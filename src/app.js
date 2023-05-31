require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const compression = require('compression')
const app = express()

// init middleware

app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
  })
)

// init db
require('./dbs/init.mongodb.js')
const { checkOverload } = require('./helpers/check.connect')
checkOverload()

// init routes
app.use('/', require('./routes'))

// handling errors
app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use((error, req, res, next) => {
  const statusCode = error.status || 500
  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
  })
})

module.exports = app
