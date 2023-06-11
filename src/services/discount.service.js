'use strict'

const { BadRequestError, NotFoundError } = require('../core/error.response')
const { discount } = require('../models/discount.model')

const { convertToObjectIdMongoDB } = require('../utils')
const { findAllProducts } = require('../models/repositories/product.repo')
const {
  findAllDiscountCodesUnSelect,
  checkDiscountExists,
} = require('../models/repositories/discount.repo')

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
      users_used,
    } = payload

    if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
      throw new BadRequestError('Discount code has expired')
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError('Start date must be before end date')
    }

    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongoDB(shopId),
      })
      .lean()

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError('Discount code already exists')
    }

    const newDiscount = await discount.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discount_value: value,
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_shopId: convertToObjectIdMongoDB(shopId),
      discount_max_uses_per_user: max_uses_per_user,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === 'specific' ? product_ids : [],
    })

    return newDiscount
  }

  static async updateDiscountCode() {}

  static async getAllDiscountCodesWithProduct({ code, shopId, limit, page }) {
    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongoDB(shopId),
      })
      .lean()

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw BadRequestError('Discount code does not exist')
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount
    let products

    if (discount_applies_to === 'all') {
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongoDB(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      })
    }

    if (discount_applies_to === 'specific') {
      products = await findAllProducts({
        filter: {
          isPublished: true,
          _id: { $in: discount_product_ids },
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      })
    }

    return products
  }

  static async getAllDiscountCodesByShop({ limit, page, shopId }) {
    const discounts = await findAllDiscountCodesUnSelect({
      filter: {
        discount_shopId: convertToObjectIdMongoDB(shopId),
        discount_is_active: true,
      },
      limit: +limit,
      page: +page,
      unSelect: ['__v', 'discount_shopId'],
      model: discount,
    })

    return discounts
  }

  static async getDiscountAmount({ code, shopId, userId, products }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectIdMongoDB(shopId),
      },
    })

    if (!foundDiscount) throw new NotFoundError('Discount code does not exist')

    const {
      discount_is_active,
      discount_max_uses,
      discount_start_date,
      discount_end_date,
      discount_min_order_value,
      discount_max_uses_per_user,
      discount_type,
      discount_users_used,
      discount_value,
    } = foundDiscount

    if (!discount_is_active) throw new NotFoundError('Discount code expired')
    if (!discount_max_uses) throw new NotFoundError('Discount code are out')

    if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)) {
      throw new NotFoundError('Discount code expired')
    }

    let totalOrder = 0
    if (discount_min_order_value > 0) {
      totalOrder = products.reduce((acc, cur) => {
        return acc + cur.price * cur.quantity
      }, 0)

      if (totalOrder < discount_min_order_value) {
        throw new BadRequestError(
          `Discount requires a minimum order value of ${discount_min_order_value}`
        )
      }
    }

    if (discount_max_uses_per_user > 0) {
      const userDiscount = discount_users_used.find((user) => user.userId === userId)
    }

    const amount =
      discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100)

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    }
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const deleted = await discount.deleteOne({
      discount_shopId: convertToObjectIdMongoDB(shopId),
      discount_code: codeId,
    })

    return deleted
  }

  static async cancelDiscountCode({ shopId, codeId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_shopId: convertToObjectIdMongoDB(shopId),
        discount_code: codeId,
      },
    })

    if (!foundDiscount) throw new NotFoundError('Discount code does not exist')

    const result = await discount.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $inc: {
        discount_uses_count: -1,
        discount_max_uses: 1,
      },
    })

    return result
  }
}

module.exports = DiscountService
