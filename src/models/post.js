const mongoose = require("mongoose");   //always needed for schema creation
const User = require('./user')
const postSchema = new mongoose.Schema({
    user: {
        type:  mongoose.Schema.Types.ObjectId,  //refence user field to User schema
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
    }
},{timestamps: true})   //createdAt and updatedAt timestamps

const Post = mongoose.model('Post', postSchema)

module.exports = Post