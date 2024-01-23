const groupModel = require('../models/groupModel')
const crypto = require('crypto')
const cloudinary = require('cloudinary').v2
const authModel = require('../models/authModel')
const chatModelGroup = require('../models/chatModelGroup')
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const createGroup = async (req, res) => {
    try {
        const { user_id, group_name, number_telephone, group_description } = req.body
        
        const existingGroups = await groupModel.find({ group_access: user_id })
        
        const groupWithSameName = existingGroups.find(existingGroup => existingGroup.group_name === group_name);

        if (groupWithSameName) {
            return res.json({ status: 400, message: 'Group already exist!' })
        }

        let logoNameCloud = null
        let logo = null

        const tokenRandom = crypto.randomBytes(5).toString('hex')

        if (req.file) {
            const originalName = req.file.originalname;
            const randomChars = crypto.randomBytes(4).toString('hex');
            logoNameCloud = `${randomChars}_${originalName}`;
         
            // Menggunakan Promise untuk menunggu selesainya upload ke Cloudinary
            await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ public_id: logoNameCloud }, (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('cloud result:', result);
                        logo = result.secure_url;
                        resolve();
                    }
                }).end(req.file.buffer);
            });
        } else {
            logo = 'defaultGroup.jpg'
        }

        const dataGroup = {
            group_id: tokenRandom,
            group_number_telephone: number_telephone,
            group_name,
            group_description,
            group_access: user_id,
            logo
        }

        const create = new groupModel(dataGroup)
        const result = await create.save()
        
        if(result) {
            return res.json({ status: 200, message: 'Successfully create group!', data: dataGroup })
        }

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

const removeGroup = async (req, res) => {
    try {

        const { group_id } = req.params
        
        const existGroup = await groupModel.findOne({ group_id })
        if(!existGroup) return res.json({ status: 404, message: 'Group not available!' })

        await chatModelGroup.findOneAndDelete({ group_id })
        await existGroup.deleteOne()

        return res.json({ status: 200, message: 'Successfully to remove group!', data: existGroup })

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
} 

const updateGroup = async (req, res) => {
    try {

        const { group_id, group_name, group_description } = req.body

        const existGroup = await groupModel.findOne({ group_id })
        if(!existGroup) return res.json({ status: 404, message: 'Group not available!' })

        let logo = 'defaultGroup.jpg';

        if (req.file) {
            const originalName = req.file.originalname;
            const randomChars = crypto.randomBytes(4).toString('hex');
            logo = `${randomChars}_${originalName}`;

            try {
                if(existGroup.logo !== 'defaultGroup.jpg') {
                    await cloudinary.uploader.destroy(existGroup.logo);
                }
                await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ public_id: logo }, (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            console.log('cloud result:', result);
                            logo = result.secure_url;
                            resolve();
                        }
                    }).end(req.file.buffer);
                });
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                return res.json({ status: 500, message: 'Failed to update Group due to Cloudinary error!' });
            }
        }

        const updateFields = { group_name, group_description };
        if (logo) {
            updateFields.logo = logo;
        }

        const updateGroup = await groupModel.findOneAndUpdate(
            { group_id },
            { $set: updateFields },
            { new: true }
        );

        if (!updateGroup) {
            return res.json({ status: 500, message: 'Failed to update Group in the database!' });
        }

        const resultNew = await groupModel.findOne({ group_id })

        return res.json({ status: 200, message: 'Successfully updated group!', data: resultNew });

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

const addMembers = async (req, res) => {
    try {
        
        const { number_telephone, group_id } = req.body
        
        const equalUser = await authModel.findOne({ number_telephone })
        if(!equalUser) return res.json({ status: 404, message: 'User not available!' })

        const equalGroup = await groupModel.findOne({ group_id })
        if(!equalGroup) return res.json({ status: 404, message: 'Group not available!' })
        
        const existingMember = equalGroup.members.find(member => member.number_telephone === equalUser.number_telephone);

        if (!existingMember) {
            const newMember = {
                number_telephone: equalUser.number_telephone,
                username: equalUser.username,
            };
        
            equalGroup.members.push(newMember);
            await equalGroup.save();
        
            return res.json({ status: 200, message: 'Successfully add member to the group!' });
        } else {
            return res.json({ status: 400, message: 'User is already a member of the group!' });
        }
        

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

const leftGroup = async (req, res) => {
    try {

        const { number_telephone, group_id } = req.body
        console.log(number_telephone)
        console.log(group_id)

        const equalUser = await authModel.findOne({ number_telephone })
        if(!equalUser) return res.json({ status: 404, message: 'User not available!' })

        const equalGroup = await groupModel.findOne({ group_id })
        if(!equalGroup) return res.json({ status: 404, message: 'Group not available!' })
        
        equalGroup.members = equalGroup.members.filter(data => data.number_telephone !== number_telephone);
        await equalGroup.save()

        return res.json({ status: 200, message: 'Successfully remove members!', data: number_telephone })

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

module.exports = {
    createGroup,
    removeGroup,
    updateGroup,
    addMembers,
    leftGroup,
}