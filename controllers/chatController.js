const chatModelPersonal = require('../models/chatModelPersonal')
const chatModelGroup = require('../models/chatModelGroup')
const authModel = require('../models/authModel')
const crypto = require('crypto')

const createChat = async (data) => {
    try {

        const { message, type_chat, sender_id, recipient_id } = data
        console.log('test data:',data)
        
        const tokenRandom = crypto.randomBytes(5).toString('hex')

        if(type_chat === 'personal') {

            const existAccount1 = await authModel.findOne({ number_telephone: sender_id })
            const existAccount2 = await authModel.findOne({ number_telephone: recipient_id })
    
            if(!existAccount1 || !existAccount2) return { status: 404, message: 'Sender or recipinet not available!', data: `${sender_id} and ${recipient_id}` }
    
            const data1 = {
                username: existAccount2.username,
                number_telephone: existAccount2.number_telephone
            }
    
            if (!existAccount1.relations.filter(relation => relation.number_telephone === data1.number_telephone).length) {
                existAccount1.relations.push(data1);
                await existAccount1.save()
            }
    
            const data2 = {
                username: existAccount1.username,
                number_telephone: existAccount1.number_telephone
            };
    
            if (!existAccount2.relations.filter(relation => relation.number_telephone === data2.number_telephone).length) {
                existAccount2.relations.push(data2);
                await existAccount2.save()
            }
    
            const dataChat = {
                chat_id: tokenRandom,
                chat_code:`${sender_id}_${recipient_id}`,
                message,
                type_chat,
                sender_id,
                recipient_id,
            }
        
            const create = new chatModelPersonal(dataChat)
            await create.save()
            
            // const existChat1 = await chatModelPersonal.find({ sender_id, recipient_id });
            // const existChat2 = await chatModelPersonal.find({ sender_id: recipient_id, recipient_id: sender_id });
    
            // const resultChat = [...existChat1, ...existChat2]
            return { status: 200, message: 'Successfulyy sent message!', data: message }
       
        } else {

            const dataChatGroup = {
                chat_id: tokenRandom,
                chat_code:`${sender_id}_${recipient_id}`,
                message,
                type_chat,
                sender_id,
                recipient_id,
                group_id: recipient_id
            }
    
            const create = new chatModelGroup(dataChatGroup)
            await create.save()

            // const resultChat = await chatModelGroup.find({ group_id: recipient_id });
            return { status: 200, message: 'Successfulyy sent message!', data: message }
        }

    } catch (error) {
        return { status: 500, message: 'Error server!', error: error.message }
    }
}

const getAllChatPersonal = async (req, res) => {
    try {

        const { sender, recipient } = req.body

        const existChat1 = await chatModelPersonal.find({ sender_id: sender, recipient_id: recipient });
        const existChat2 = await chatModelPersonal.find({ sender_id: recipient, recipient_id: sender });

        const resultChat = [...existChat1, ...existChat2]

        return res.json({ status: 200, message: 'Successfully get all chat!', data: resultChat });

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

const getAllChatGroup = async (req, res) => {
    try {

        const { group_id } = req.params

        const existChat = await chatModelGroup.find({ group_id });

        return res.json({ status: 200, message: 'Successfully get all chat!', data: existChat });

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

const removeChatById = async (data) => {
    try {

        const { chat_id, type_chat } = data
        console.log(chat_id)
        console.log(type_chat)

        const existChat = type_chat === 'personal' ? await chatModelPersonal.findOneAndDelete({ chat_id }) : await chatModelGroup.findOneAndDelete({ chat_id })

        if(!existChat) return res.json({ status: 404, message: 'Chat not available!' })

        return { status: 200, message: 'Successfully remove chat!' }

    } catch (error) {
        return { status: 500, message: 'Error server!', error: error.message }
    }
}

module.exports = {
    createChat,
    getAllChatPersonal,
    getAllChatGroup,
    removeChatById
}