'use strict'

const HEADERS = {
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'authorization',
}

const { findById } = require('../services/apikey.service')

const apiKey = async (req, res, next) => {
  try {
    const key = req.headers[HEADERS.API_KEY]?.toString()
    if (!key) {
      return res.status(403).json({
        message: 'Forbidden error',
      })
    }

    const objKey = await findById(key)
    if (!objKey) {
      return res.status(403).json({
        message: 'Forbidden error',
      })
    }

    req.objKey = objKey
    return next()
  } catch (error) {}
}

const permission = (permission) => {
  return (req, res, next) => {
    if (!req.objKey.permissions) {
      return res.status(403).json({
        message: 'Permission denied',
      })
    }

    if (!req.objKey.permissions.includes(permission)) {
      return res.status(403).json({
        message: 'Permission denied',
      })
    }

    return next()
  }
}

const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

module.exports = {
  apiKey,
  permission,
  asyncHandler,
}
