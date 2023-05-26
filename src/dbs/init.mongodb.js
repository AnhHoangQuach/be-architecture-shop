'use strict'

require('dotenv').config()
const mongoose = require('mongoose')
const {
  db: { host, name, password },
} = require('../configs/config.mongodb')

const connectString = `mongodb+srv://${host}:${password}@cluster0.c0lkaku.mongodb.net/${name}`
const { countConnect } = require('../helpers/check.connect')

// singleton pattern
class Database {
  constructor() {
    this.connect()
  }

  //connect
  connect(type = 'mongodb') {
    if (1 === 1) {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }

    mongoose
      .connect(connectString)
      .then((_) => {
        console.log(`Connected Mongodb Successfully!`)
        return countConnect()
      })
      .catch((err) => console.log(`Error: ${err}`))
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb
