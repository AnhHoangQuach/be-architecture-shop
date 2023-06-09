'use strict'

const DiscountService = require('../services/discount.service')
const { SuccessResponse } = require('../core/success.response')

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: 'Discount code created successfully',
      metadata: await DiscountService.createDiscountCode({
        ...req.body,
        shopId: req.user.userId,
      }),
    }).send(res)
  }

  getAllDiscountCodes = async (req, res, next) => {
    new SuccessResponse({
      message: 'Discount codes fetched successfully',
      metadata: await DiscountService.getAllDiscountCodesByShop({
        ...req.query,
        shopId: req.user.userId,
      }),
    }).send(res)
  }

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get discount amount successfully',
      metadata: await DiscountService.getDiscountAmount({
        ...req.body,
      }),
    }).send(res)
  }

  getAllDiscountCodesWithProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all discount codes with product successfully',
      metadata: await DiscountService.getAllDiscountCodesWithProduct({
        ...req.query,
      }),
    }).send(res)
  }
}

module.exports = new DiscountController()
