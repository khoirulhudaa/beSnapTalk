const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const chatController = require('./controllers/chatController');
require('dotenv').config()
const cors = require('cors')

const app = express();
const corsOptions = {
    origin: 'https://snaptalkk.vercel.app', // Replace with your allowed origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    // Add more options as needed
  };
app.use(cors(corsOptions))

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

const httpServer = require('http').createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "https://snaptalkk.vercel.app",
        methods: ["GET", "POST"]
    },
    path: '/socket.io', // Make sure this matches with the client
});

// Inisialisasi Socket.IO di luar fungsi penanganan HTTP
io.on('connection', async (socket) => {
    console.log('socket.id:', socket.id);

    socket.on('chat', async (data) => {
        console.log('data chat:', data);
        const result = await chatController.createChat(data);
        console.log('result create chat:', result);
        io.emit('chat_received', result);
    });

    socket.on('chat_remove', async (data) => {
        console.log('data chat remove:', data);
        const result = await chatController.removeChatById(data);
        console.log('result remove chat:', result);
        io.emit('chat_received', result);
    });
    
    socket.on('connect_error', (error) => {
        io.emit('chat_received', error);
        console.error('Connection error:', error);
    });
      
    socket.on('connect_timeout', () => {
        console.error('Connection timeout');
    });
      

    socket.on('disconnect', () => {
        console.log('User disconnected from ', socket.id);
    });
});

httpServer.listen(3600, () => {
    console.log(`Server is port ${3600}`);
});
