const express = require('express');
const mongoose = require('mongoose');
const Ably = require('ably/promises');
const chatController = require('./controllers/chatController');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.URL_MONGOOSE, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error(error));

// Timeout middleware
app.use((req, res, next) => {
    res.setTimeout(20000, () => res.status(408).send('Request timeout'));
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

app.get('/test', (req, res) => res.send('test success!'));

// Create Ably client instance
const ably = new Ably.Realtime('e87l2A.h1L5zQ:N2VQ6cUTikKzFtbVU2quPgMpxF2P4TCIZPN_d7gSBeE');

// Channel for chat messages
const chatChannel = ably.channels.get('chat');

app.listen(3600, () => {
    console.log(`Server listening on port ${3600}`);
});

// Handle incoming chat messages
chatChannel.subscribe('chat', async (message) => {
    console.log('Received chat message:', message.data);
    const result = await chatController.createChat(message.data);
    console.log('Chat created:', result);
    // Emit chat_received event to Ably for other clients
    await chatChannel.publish('chat_received', result);
});

// Handle chat removal requests
chatChannel.subscribe('chat_remove', async (message) => {
    console.log('Received chat removal request:', message.data);
    const result = await chatController.removeChatById(message.data);
    console.log('Chat removed:', result);
    // Emit chat_received event to Ably for other clients
    await chatChannel.publish('chat_received', result);
});

// Handle errors
ably.connection.on('error', (error) => {
    console.error('Ably connection error:', error);
});
