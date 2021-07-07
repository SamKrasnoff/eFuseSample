const mongoose = require("mongoose");
const Post = require('./post')
const jwt = require('jsonwebtoken')
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true  //trim for neatness, less confusion
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,   //avoid account spamming from one email
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,   //don't want duplicate usernames!
        trim: true,
    },
    createdAt: {
        type: Date,
    },
    tokens: [{
        token: {            //section for jwt tokens
            type: String,
            required: true,
        }
    }],
},{timestamps: true})       //used for createdAt and updatedAt timestamps. decided to use both for thoroughness

userSchema.virtual('posts', {   //virtual link to the Post schema
    ref: 'Post',
    localField: '_id',
    foreignField: 'user'
})

userSchema.methods.toJSON = function() {    //method to convert user info to JSON for ease of use
    const user = this
    const userObject = user.toObject()
    delete userObject.tokens
    return userObject
}

userSchema.statics.findByCredentials = async (username) => {    //unique static function to find user by given credentials, in this case username
    try {
        const user = await User.findOne({ username })
        if(!user){
            throw new Error('Unable to login!')
        }
        return user
    } catch(e){
        console.log(e)
    } 
}

userSchema.methods.generateAuthToken = async function() {       // method for generating an auth token with JWT
    try{
        const user = this
        const token = jwt.sign({_id: user._id.toString()}, `${process.env.JWT_SECRET}`)
        user.tokens = user.tokens.concat({token})
        await user.save()
        return token
    }
    catch(e){
        console.log(e)
    }
}

const User = mongoose.model('User', userSchema)

module.exports = User