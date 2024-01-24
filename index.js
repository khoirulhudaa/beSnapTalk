const express = require('express');
const mongoose = require('mongoose');
const Ably = require('ably');  // Import Ably library
const chatController = require('./controllers/chatController');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());

// Connected on the MongoDB database
mongoose.connect(process.env.URL_MONGOOSE, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connect on database');
  })
  .catch((error) => {
    console.log(error);
  });

// Middleware untuk mengatur timeout
app.use((req, res, next) => {
  res.setTimeout(20000, () => {
    res.status(408).send('Request timeout');
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
const checkToken = require('./middlewares/verifyToken');

// Routers
const accountRouter = require('./routers/authRouter');
const chatRouter = require('./routers/chatRouter');
const groupRouter = require('./routers/groupRouter');

app.use('/account', accountRouter);
app.use('/chat', chatRouter);
app.use('/group', checkToken, groupRouter);

app.get('/test', (req, res) => {
  res.send('test success!');
});

// Initialize Ably client
const ably = new Ably.Realtime({ key: process.env.API_ABLY });
const channel = ably.channels.get('chat');  // Choose a channel name

// Listen for incoming chat events
channel.subscribe('chat', async (message) => {
  const data = message.data;
  console.log('Received chat message:', data);
  const result = await chatController.createChat(data);
  console.log('Result create chat:', result);
  channel.publish('chat_received', result);
});

// Handle chat events from clients
app.post('/send-chat', async (req, res) => {
  try {
    const data = req.body;
    const result = await chatController.createChat(data);
    console.log('Result create chat:', result);
    channel.publish('chat', result);  // Publish to Ably channel
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Handle chat removal events from clients
app.post('/chat_remove', async (req, res) => {
  try {
    const data = req.body;
    const result = await chatController.removeChatById(data);
    console.log('Result remove chat:', result);
    channel.publish('chat_removed', data);  // Publish to Ably channel
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove chat' });
  }
});

module.exports = app;
