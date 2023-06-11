'use strict'

const { convertToObjectId } = require('../../utils')
const { cart } = require('../cart.model')

const findCartById = async (cartId) => {
  return await cart.findOne({ _id: convertToObjectId(cartId), cart_state: 'active' }).lean()
}

module.exports = {
  findCartById,
}
