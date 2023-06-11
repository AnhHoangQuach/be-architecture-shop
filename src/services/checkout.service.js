'use strict'

const { findCartById } = require('../models/repositories/cart.repo')
const { NotFoundError, BadRequestError } = require('../core/error.response')
const { checkProductByServer } = require('../models/repositories/product.repo')
const { acquireLock, releaseLock } = require('./redis.service')
const { order } = require('../models/order.model')

class CheckoutService {
  static async checkoutReview({ cartId, userId, shop_order_ids = [] }) {
    const foundCart = await findCartById(cartId)
    if (!foundCart) throw new NotFoundError('Cart not found')

    const checkout_order = {
        totalPrice: 0,
        feeShip: 0,
        totalDiscount: 0,
        totalCheckout: 0,
      },
      shop_order_ids_new = []

    for (let i = 0; i < shop_order_ids.length; i++) {
      const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]

      const checkProductServer = await checkProductByServer(item_products)
      if (!checkProductServer[0]) throw new BadRequestError('Order wrong')

      const checkoutPrice = checkProductServer.reduce((total, product) => {
        return total + product.quantity * product.price
      }, 0)

      checkout_order.totalPrice += checkoutPrice

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice,
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductServer,
      }

      if (shop_discounts.length > 0) {
        const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
          codeId: shop_discounts[0].codeId,
          userId,
          shopId,
          products: checkProductServer,
        })

        checkout_order.totalDiscount += discount

        if (discount > 0) itemCheckout.priceApplyDiscount = checkoutPrice - discount
      }
    }

    checkout_order.totalCheckout += itemCheckout.priceApplyDiscount
    shop_order_ids_new.push(itemCheckout)

    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_order,
    }
  }

  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address = {},
    user_payment = {},
  }) {
    const { shop_order_ids_new, checkout_order } = await this.checkoutReview({
      cartId,
      userId,
      shop_order_ids,
    })

    const products = shop_order_ids_new.flatMap((item) => item.item_products)
    const acquireProduct = []

    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i]
      const keyLock = await acquireLock(productId, quantity, cartId)
      acquireLock.push(keyLock ? true : false)
      if (keyLock) {
        await releaseLock(keyLock)
      }
    }

    if (acquireProduct.includes(false)) {
      throw new BadRequestError('Mot so san pham da duoc cap nhat, vui long quay lai gio hang...')
    }

    const newOrder = await order.create({
      order_userId: userId,
      order_checkout: checkout_order,
      order_shipping: user_address,
      order_payment: user_payment,
      order_products: shop_order_ids_new,
    })

    return newOrder
  }

  static async getOrdersByUser() {}

  static async getOneOrderbyUser() {}

  static async cancelOrderByUser() {}

  static async updateOrderStatusByShop() {}
}

module.exports = CheckoutService
