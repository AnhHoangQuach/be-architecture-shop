'use strict'

const shopModel = require('../models/shop.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const KeyTokenService = require('./keyToken.Service')
const { createTokenPair } = require('../auth/authUtils')
const { getInfoData } = require('../utils')

const RoleShop = {
  SHOP: 'SHOP',
  WRITER: 'WRITER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
}

class AccessService {
  static signUp = async ({ name, email, password }) => {
    console.log(name, email, password)
    try {
      const holderShop = await shopModel.findOne({ email }).lean()
      if (holderShop) {
        return {
          code: 'xxxx',
          message: 'Shop already registered',
        }
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const newShop = await shopModel.create({
        name,
        email,
        password: passwordHash,
        roles: [RoleShop.SHOP],
      })

      if (newShop) {
        // created privateKey, publicKey -> publicKey: verify, privateKey: sign
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
          },
          publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
          },
        })

        console.log({ privateKey, publicKey })

        const publicKeyString = await KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey,
        })

        if (!publicKeyString) {
          return {
            code: 'xxxx',
            message: 'publicKeyString error',
          }
        }

        console.log(`publicKeyString::`, publicKeyString)
        const publicKeyObject = crypto.createPublicKey(publicKeyString)

        console.log(`publicKeyObject::`, publicKeyObject)
        // created token pair
        const tokens = await createTokenPair(
          {
            userId: newShop._id,
            email,
          },
          publicKeyString,
          privateKey
        )
        console.log(`Created Token Success::`, tokens)

        return {
          code: 201,
          metadata: {
            shop: getInfoData({ fields: ['_id', 'name', 'email'], object: newShop }),
            tokens,
          },
        }
      }

      return {
        code: 200,
        metadata: null,
      }
    } catch (error) {
      return {
        code: 'xxx',
        message: error.message,
        status: 'error',
      }
    }
  }
}

module.exports = AccessService
