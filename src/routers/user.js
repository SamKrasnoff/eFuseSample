const express = require('express')
const router = new express.Router()     //first two lines for proper http request routing
const redis = require('redis')          //caching!
const REDIS_PORT = process.env.REDIS_PORT || 6379       //connect to redis server (also in a docker container)
const client = redis.createClient({                     //configure client connection
    port: REDIS_PORT,
    host: 'redis'
})
const auth = require('../middleware/auth')          //need the auth check middleware
const User = require('../models/user')              //need user model for access

router.post('/api/user', async (req, res) => {      //create new user 
    const user = new User(req.body)
    try{
        await(user.save())
        res.status(201).send({user})
    } catch(e){
        res.status(400).send(e)
    }
})

router.post('/api/user/login', async (req, res) => {    //login user
    try {
        const user = await User.findByCredentials(req.body.username)   //find by username
        const token = await user.generateAuthToken()                   //create auth token and send 
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/api/user/logout', auth, async (req, res) => {     //removes all tokens, functionally logs out
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/api/user/:userId', cache, async (req, res) => {    //get user information given userID
    const user = await User.findOne({_id: req.params.userId})
    client.set(req.params.userId, user.toString())              //send to redis, key is userID
    res.send(user)
})

router.patch('/api/user/:userId', async (req, res) => { //update user info
    const updates = Object.keys(req.body)
    const allowedUpdates = ['firstName', 'lastName', 'username','email'] //only allow updates to some data
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))     //check for validity

    if(!isValidOperation){
        return res.status(400).send({ error: 'Invalid updates!'})
    }
    try {
        const user = await User.findOne({_id: req.params.userId})   //find user from params
        if (!user) {
            return res.status(404).send()
        }
        updates.forEach((update) => {
            user[update] = req.body[update]     //actually make the changes 
        })
        await user.save()
        res.send(user)
    }
    catch(e){
        res.status(400).send(e)
    }
})

function cache(req, res, next){     //checks if userID key is stored, if so, then pull from redis, otherwise continue
    const _id = req.params.userId
    client.get(_id, (err, data) => {
        if (err) throw err;
        if (data !== null){
            res.send(data)
        }
        else{
            next()
        }
    })
}

module.exports = router