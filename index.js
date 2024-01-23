const cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const dotenv = require('dotenv')
const http = require('http')
const chatController = require('./controllers/chatController')
const { Server } = require('socket.io')

dotenv.config();

app.use(cors())

// Connected on database ft mongodb
mongoose.connect(process.env.URL_MONGOOSE, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('Successfully connect on database')
})
.catch((error) => {
    console.log(error)
})


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
const checkToken = require('./middlewares/verifyToken')

// Routers
const accountRouter = require('./routers/authRouter')
const chatRouter = require('./routers/chatRouter')
const groupRouter = require('./routers/groupRouter')

app.use('/account', accountRouter)
app.use('/chat', chatRouter)
app.use('/group', checkToken, groupRouter)

app.get('/test', (req, res) => {
    res.send('test success!')   
})



const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', async (socket) => {
    console.log('socket.id :', socket.id)

    socket.on('chat', async (data) => {
        console.log('data chat:', data)
        const result = await chatController.createChat(data)
        console.log('result create chat:', result)
        io.emit('chat_received', result)
    })
    

    socket.on('chat_remove', async (data) => {
        console.log('data chat remove:', data)
        const result = await chatController.removeChatById(data)
        console.log('result remove chat:', result)
        io.emit('chat_received', result)
    })
    
    socket.on('disconnect', () => {
        console.log('User disconnected from ', socket.id)
    })
});

httpServer.listen(3600, () => {
    console.log(`Running on port ${3600}`)
})

// Running test