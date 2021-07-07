const jwt = require('jsonwebtoken')
const User = require('../models/user')
//This was my approach to binding users to their posts, using a JWT login. It is not completely fleshed out, but is working correctly.
const auth = async (req, res, next) => {
    try{
        //verification of user
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()
    } catch(e) {
        res.status(401).send({ error: 'Please Authenticate'})
    }
}

module.exports = auth