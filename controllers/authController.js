const authModel = require('../models/authModel')
const groupModel = require('../models/groupModel')
const crypto = require('crypto')
const cloudinary = require('cloudinary').v2;
const jsonwebtoken = require('jsonwebtoken')
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
   
const signUp = async (req, res) => {
    try {
        
        const { username, number_telephone } = req.body

        const equalNumber = await authModel.findOne({ number_telephone })
        if(equalNumber) return res.json({ status: 500, message: 'Number already exist!' })
 
        const tokenRandom = crypto.randomBytes(5).toString('hex')

        const dataUser = {
            user_id: tokenRandom,
            username,
            number_telephone
        }

        const createUser = new authModel(dataUser)
        const result = await createUser.save()

        if(result) {
            return res.json({ status: 200, message: 'Successfully create account!', data: dataUser })
        }
        
    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

const signIn = async (req, res) => {
    try {
        
        const { number_telephone } = req.body
        
        const existAccount = await authModel.findOne({ number_telephone })
        if(!existAccount) return res.json({ status: 404, message: 'User not available!' })
 
        const token = jsonwebtoken.sign({ user_id: existAccount.number_telephone }, 'snaptalk', { expiresIn: '5h' })

        return res.json({ status: 200, message: 'Successfully sign in!', token, data: existAccount })

    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

const removeUser = async (req, res) => {
    try {

        const { user_id } = req.params

        const remove = await authModel.findOneAndDelete({ user_id })
        if(!remove) return res.json({ status:  500, message: 'Failed to remove account!'})
        
        return res.json({ status: 200, message: 'Successfully remove account', data: user_id })

    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

const updateUser = async (req, res) => {
    try {

        const { user_id, username, number_telephone } = req.body

        const equalUser = await authModel.findOne({ user_id })
        if(!equalUser) return res.json({ status: 404, message: 'User not available!' })
            
        const filter = { user_id }
        let namePhoto = null
        let photo_profile = null

        if(req.file) {

            const originameName = req.file.filename
            const tokenRandon = crypto.randomBytes(5).toString('hex')
            namePhoto = `${tokenRandon}_${originameName}`

            try {
                if(equalUser.photo_profile !== 'default.jpg') {
                    await cloudinary.uploader.destroy(equalUser.photo_profile);
                }
                await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ public_id: namePhoto }, (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            console.log('cloud result:', result);
                            photo_profile = result.secure_url;
                            resolve();
                        }
                    }).end(req.file.buffer);
                });
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                return res.json({ status: 500, message: 'Failed to update Group due to Cloudinary error!' });
            }

        } else {
            photo_profile = 'default.jpg'
        }
        
        const set = {
            username, 
            number_telephone,
            photo_profile
        }

        const updateUser = await authModel.updateOne(filter, set, { new: true })
        if(!updateUser) return res.json({ status: 500, message: 'Failed to update acount!', data: user_id })
        const resultNew = await authModel.findOne({ user_id })
        
        return res.json({ status: 200, message: 'Successfully u[date acount!', data: resultNew })
        
    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

const addRelationship = async (req, res) => {
    try {
        
        const { user_id, number_telephone } = req.body

        const existUser = await authModel.findOne({ number_telephone })
        if(!existUser) return res.json({ status: 404, message: 'Number not available!' })
        
        const existAccount = await authModel.findOne({ user_id })
        if (!existAccount) return res.json({ status: 404, message: 'Number not available!' })
        
        const existRelation = existAccount.relations.filter(data => data.number_telephone === number_telephone);
        if (existRelation.length > 0) return res.json({ status: 500, message: "Number already exists!" });
       
        const data = {
            username: existUser.username,
            number_telephone
        }

        existAccount.relations.push(data)
        await existAccount.save()

        return res.json({ status: 200, message: 'Successfully u[date acount!' })
        
    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

const getRelation = async (req, res) => {
    try {

        const { number_telephone } = req.params

        const existAccount = await authModel.findOne({ number_telephone })
        if(!existAccount) return res.json({ status: 404, message: 'Your account not availbale!' })
        
        const relationNumbers = existAccount.relations.map(data => data.number_telephone) || [];
        
        const relatedAccounts = await authModel.find({
            number_telephone: { $in: relationNumbers },
        });
        
        const existGroups = await groupModel.find()
        const myGroup = await groupModel.find({ group_number_telephone: number_telephone })
       
        const similarMembers = existGroups.filter(group => {
            return group.members.some(member => member.number_telephone === number_telephone);
        });

        const result = [...myGroup, ...similarMembers, ...relatedAccounts]

        return res.json({ status: 200, message: 'Success get all relationship!', data: result });

    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

const removeRelationship = async (req, res) => {
    try {

        const { myNumber, number_telephone } = req.body
        const existAccount = await authModel.findOne({ number_telephone: myNumber })
        if(!existAccount) return res.json({ status: 404, message: 'Your account not available!' })

        existAccount.relations = existAccount.relations.filter(data => data.number_telephone !== number_telephone)
        await existAccount.save()

        return res.json({ status: 200, message: 'Successfully remove contact', data: number_telephone })

    } catch (error) {
        return res.json({ status: 200, message: 'Error server!', message: error.message })
    }
}

module.exports = {
    signUp,
    signIn,
    removeUser,
    updateUser,
    addRelationship,
    getRelation,
    removeRelationship
}