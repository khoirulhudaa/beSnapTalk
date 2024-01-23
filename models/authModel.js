const mongoose = require('mongoose')

const authSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    username: {
        type: String,
        require: true
    },
    number_telephone: {
        type: String,
        required: true
    },
    photo_profile: {
        type: String,
        default: 'default.jpg'
    },
    type_account: {
        type: String,
        default: 'personal'
    },
    relations: {
        type: Array,
        default: []
    },
    created_at: {
        type: Date,
        default: new Date()
    }
})

module.exports = mongoose.model('authChat', authSchema)