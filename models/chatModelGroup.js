const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    sender_id: {
        type: String,
        required: true
    },
    recipient_id: {
        type: String,
        required: true
    },
    chat_code: {
        type: String,
        required: true
    },
    group_id: {
        type: String,
        required: true
    },
    created_at: {
        type: String,
        default: () => {
            let date = new Date(); // Get current date and time
            let day = date.getDate();
            let month = date.getMonth() + 1; // Months are zero indexed in JavaScript
            let year = date.getFullYear();
            let hours = date.getHours();
            let minutes = date.getMinutes();

            return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    }
})

module.exports = mongoose.model('chatGroup', chatSchema)