'use strict'

const keyTokenModel = require('../models/keytoken.model')
const { Types } = require('mongoose')

class KeyTokenService {
  static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken }) => {
    try {
      const filter = { user: userId },
        update = {
          publicKey,
          privateKey,
          refreshTokenUsed: [],
          refreshToken,
        },
        options = { upsert: true, new: true }

      const tokens = await keyTokenModel.findOneAndUpdate(filter, update, options)

      return tokens ? tokens.publicKey : null
    } catch (error) {
      throw new Error(error)
    }
  }

  static findByUserId = async (userId) => {
    return await keyTokenModel.findOne({ user: new Types.ObjectId(userId) })
  }

  static removeKeyById = async (id) => {
    return await keyTokenModel.deleteOne(id).lean()
  }

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keyTokenModel.findOne({ refreshTokenUsed: refreshToken }).lean()
  }

  static findByRefreshToken = async (refreshToken) => {
    return await keyTokenModel.findOne({ refreshToken })
  }

  static deleteKeyById = async (userId) => {
    return await keyTokenModel.deleteOne({ user: new Types.ObjectId(userId) })
  }
}

module.exports = KeyTokenService
