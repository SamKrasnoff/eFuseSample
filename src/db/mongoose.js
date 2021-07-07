const mongoose = require('mongoose')
//Connection code for database connection, connecting across docker-compose containers
mongoose.connect('mongodb://mongo:27017/docker-node-mongo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})  