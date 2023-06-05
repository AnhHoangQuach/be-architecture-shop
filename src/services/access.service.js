'use strict'

const shopModel = require('../models/shop.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { createTokenPair, verifyJWT } = require('../auth/authUtils')
const { getInfoData } = require('../utils')
const {
  BadRequestError,
  ConflictRequestError,
  AuthFailureError,
  ForbiddenError,
} = require('../core/error.response')

const KeyTokenService = require('./keyToken.service')
const { findByEmail } = require('./shop.service')

const RoleShop = {
  SHOP: 'SHOP',
  WRITER: 'WRITER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
}

class AccessService {
  static handlerRefreshTokenV2 = async ({ keyStore, user, refreshToken }) => {
    const { userId, email } = user
    if (keyStore.refreshTokenUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId)
      throw new ForbiddenError('Something wrong happened!! Pls relogin')
    }

    if (keyStore.refreshToken !== refreshToken) {
      throw new AuthFailureError('Shop not registered 1')
    }

    const foundShop = await findByEmail({ email })
    if (!foundShop) throw new BadRequestError('Shop not registered 2')

    const tokens = await createTokenPair({ userId, email }, keyStore.publicKey, keyStore.privateKey)

    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokenUsed: refreshToken,
      },
    })

    return {
      user,
      tokens,
    }
  }

  static handlerRefreshToken = async (refreshToken) => {
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)
    if (foundToken) {
      const { userId, email } = verifyJWT(refreshToken, foundToken.privateKey)
      console.log({ userId, email })
      await KeyTokenService.deleteKeyById(userId)
      throw new ForbiddenError('Something wrong happened!! Pls relogin')
    }

    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)
    if (!holderToken) throw new AuthFailureError('Shop not registered 1')

    const { userId, email } = verifyJWT(refreshToken, holderToken.privateKey)
    console.log('[2]--', { userId, email })

    const foundShop = await findByEmail({ email })
    if (!foundShop) throw new BadRequestError('Shop not registered 2')

    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    )

    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokenUsed: refreshToken,
      },
    })

    return {
      user: { userId, email },
      tokens,
    }
  }

  static logout = async (keyStore) => {
    return await KeyTokenService.removeKeyById(keyStore._id)
  }

  static login = async ({ email, password, refreshToken = null }) => {
    const foundShop = await findByEmail({ email })
    if (!foundShop) throw new BadRequestError('Shop not registered')

    const match = bcrypt.compare(password, foundShop.password)
    if (!match) throw new AuthFailureError('Authentication error')

    const privateKey = crypto.randomBytes(64).toString('hex')
    const publicKey = crypto.randomBytes(64).toString('hex')

    const { _id: userId } = foundShop

    const tokens = await createTokenPair(
      {
        userId,
        email,
      },
      publicKey,
      privateKey
    )

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      publicKey,
      privateKey,
      userId,
    })

    return {
      shop: getInfoData({ fields: ['_id', 'name', 'email'], object: foundShop }),
      tokens,
    }
  }

  static signUp = async ({ name, email, password }) => {
    const holderShop = await shopModel.findOne({ email }).lean()
    if (holderShop) {
      throw new BadRequestError('Error: Shop already registered!')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    })

    if (newShop) {
      const privateKey = crypto.randomBytes(64).toString('hex')
      const publicKey = crypto.randomBytes(64).toString('hex')

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      })

      if (!keyStore) {
        return {
          code: 'xxxx',
          message: 'keyStore error',
        }
      }

      // created token pair
      const tokens = await createTokenPair(
        {
          userId: newShop._id,
          email,
        },
        publicKey,
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
  }
}

module.exports = AccessService
