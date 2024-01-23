const express = require('express')
const router = express.Router()
const chatController = require('../controllers/chatController')

router.post('/messagePersonal', chatController.getAllChatPersonal)
router.post('/messageGroup/:group_id', chatController.getAllChatGroup)

module.exports = router