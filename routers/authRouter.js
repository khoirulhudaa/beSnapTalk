const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const multer = require('multer')
const upload = multer()

router.post('/signup/user', authController.signUp)
router.post('/signin/user', authController.signIn)
router.post('/add/relation', authController.addRelationship)
router.post('/remove/relation', authController.removeRelationship)
router.get('/relationship/:number_telephone', authController.getRelation)
router.delete('/remove/user/:user_id', authController.removeUser)
router.post('/user', upload.single('photo_profile'), authController.updateUser)

module.exports = router 