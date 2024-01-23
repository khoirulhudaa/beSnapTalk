const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
    group_id: {
        type: String,
        required: true
    },
    group_name: {
        type: String,
        require: true
    },
    group_description: {
        type: String,
        default: 'Not desciption'
    },
    group_number_telephone: {
        type: String,
        required: true
    },
    members: {
        type: Array,
        default: []
    },
    logo: {
        type: String,
        default: 'defaultGroup.jpg'
    },
    type_account: {
        type: String,
        default: 'group'
    },
    group_access: {
        type: String, 
        required: true
    },
    created_at: {
        type: Date,
        default: new Date()
    },
})

module.exports = mongoose.model('groupChat', groupSchema)