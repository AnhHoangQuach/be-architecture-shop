'use strict'

const { NotFoundError } = require('../core/error.response')

const { getProductById } = require('../models/repositories/product.repo')
const { inventory } = require('../models/inventory.model')

class InventoryService {
  static async addStockToInventory({ stock, productId, shopId, location = '' }) {
    const product = await getProductById(productId)
    if (!product) throw new NotFoundError('Product not found')

    const query = { inven_shopId: shopId, inven_productId: productId },
      updateSet = { $inc: { inven_stock: stock }, $set: { inven_location: location } },
      options = { upsert: true, new: true }

    return await inventory.findOneAndUpdate(query, updateSet, options)
  }
}

module.exports = InventoryService
