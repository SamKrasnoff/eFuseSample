const express = require('express')  
const router = new express.Router()     //first two lines for proper http request routing
const redis = require('redis')          //caching!
const REDIS_PORT = process.env.REDIS_PORT || 6379   //connect to redis server (also in a docker container)
const client = redis.createClient({     //make sure client connects properly
    port: REDIS_PORT,
    host: 'redis'
})
const auth = require('../middleware/auth')  //need the auth check middleware
const Post = require('../models/post')      //need both models for proper use
const User = require('../models/user')
const mongoose = require("mongoose");

router.post('/api/post', auth, async (req, res) => {    //create new post, auth middleware allows link to user
    const post = new Post({
        ...req.body,
        user: req.user._id
    })
    try {
        await post.save()
        res.status(201).send({post})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/api/post/:postId', userCache, async (req, res) => {    //Get user based on postId
    const post = await Post.findOne({_id: req.params.postId})       //get post
    const user = await User.findOne({_id: post.user})               //get user from found post
    client.set(req.params.postId, user.toString())                  //link postID with user in redis
    res.send(user)
})

router.patch('/api/post/:postId', auth, async (req, res) => {       //update post info
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title', 'content']                     //only let them change title and content, not id/createdAt/etc
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) //check for validity

    if(!isValidOperation){
        return res.status(400).send({ error: 'Invalid updates!'})   //check for validity
    }
    try {
        const post = await Post.findOne({_id: req.params.postId})   //find post from params
        if (!post) {
            return res.status(404).send()
        }
        updates.forEach((update) => {
            post[update] = req.body[update]     //actually make the changes
        })
        await post.save()
        res.send(post)                          //send changed post
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.get('/api/user/:userId/posts',postCache, async (req, res) => {
    const Posts = await Post.find({user: {
        $in: [
            mongoose.Types.ObjectId(req.params.userId.toString())   //find all posts maching user ID
        ]
    }})
    const userPosts = req.params.userId + "posts"                   //link user posts with user, add posts to differentiate this cache with user routing cache
    client.set(userPosts, Posts.toString())                         //store to redis
    res.send(Posts)
})

function userCache(req, res, next){
    const { postId } = req.params       //get postID
    client.get(postId, (err, data) => {    //look for key. If it exists, send from redis, if not, continue on
        if (err) throw err;
        if (data !== null){
            res.send(data)
        }
        else{
            next();
        }
    })
}

function postCache(req, res, next){
    const _id = req.params.userId + "posts" //get userID, add posts to differentiate
    client.get(_id, (err, data) => {    //look for key. If it exists, send from redis, if not, continue on
        if (err) throw err;
        if (data !== null){
            res.send(data)
        }
        else{
            next();
        }
    })
}

module.exports = router