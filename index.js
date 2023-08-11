const express = require('express')
const app = express()
const cors = require('cors')
const logger = require('morgan')
const mongoose = require('mongoose')
const config = require('./config')

const usersRouter = require('./src/routes/users')
const productsRouter = require('./src/routes/products')


const corsOptions = {
  origin: 'https://hyung-2.github.io/REST-API/',
  credentials: true
}

mongoose.connect(config.MONGODB_URL)
  .then(() => console.log('mongodb connected ...'))
  .catch(e => console.log(`failed to connect mongodb: ${e}`))

app.use(cors(corsOptions))
app.use(express.json())
app.use(logger('tiny'))
app.use('/api/users', usersRouter)
app.use('/api/products', productsRouter)

app.listen(5001, () => {
  console.log('server is running on port 5001 ...')
})