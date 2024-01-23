const express = require('express')
const router = express.Router()
const groupController = require('../controllers/groupController')
const multer = require('multer')
const upload = multer()

router.post('/', upload.single('logo'), groupController.createGroup)
router.post('/add/member', groupController.addMembers)
router.post('/update', upload.single('logo'), groupController.updateGroup)
router.delete('/remove/:group_id', groupController.removeGroup)
router.post('/remove/member', groupController.leftGroup)

module.exports = router