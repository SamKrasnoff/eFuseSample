const express = require('express')
require('./db/mongoose')        //database config
require('dotenv').config()      //env variables config
const userRouter = require('./routers/user')
const postRouter = require('./routers/post')
const app = express()

app.use(express.json())     //process requests as JSON object for ease of use
app.use(userRouter)         //use user routing
app.use(postRouter)         //use posts routing

const port = 5000

app.listen(port, () => {
    console.log("server is up on port", port)       //listen on port 5000
})