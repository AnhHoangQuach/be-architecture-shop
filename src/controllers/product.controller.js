'use strict'

const ProductService = require('../services/product.service')
const ProductServiceV2 = require('../services/product.service.xxx')
const { SuccessResponse } = require('../core/success.response')

class ProductController {
  createProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create new product success',
      metadata: await ProductServiceV2.createProduct(req.body.product_type, {
        ...req.body,
        product_shop: req.user.userId,
      }),
    }).send(res)
  }

  updateProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update product success',
      metadata: await ProductServiceV2.updateProduct(req.body.product_type, req.params.id, {
        ...req.body,
        product_shop: req.user.userId,
      }),
    }).send(res)
  }

  publishProductForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Publish product success',
      metadata: await ProductServiceV2.publishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.id,
      }),
    }).send(res)
  }

  unPublishProductForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Unpublish product success',
      metadata: await ProductServiceV2.unPublishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.id,
      }),
    }).send(res)
  }

  /**
   * @description Get all draft products for shop
   * @param {Number} limit
   * @param {Number} skip
   * @return {JSON}
   */
  getAllDraftsForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list draft success',
      metadata: await ProductServiceV2.findAllDraftsForShop({
        product_shop: req.user.userId,
      }),
    }).send(res)
  }

  /**
   * @description Get all published products for shop
   * @param {Number} limit
   * @param {Number} skip
   * @return {JSON}
   */
  getAllPublishForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list publish success',
      metadata: await ProductServiceV2.findAllPublishForShop({
        product_shop: req.user.userId,
      }),
    }).send(res)
  }

  getListSearchProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list search product success',
      metadata: await ProductServiceV2.searchProducts(req.params),
    }).send(res)
  }

  findAllProducts = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list product success',
      metadata: await ProductServiceV2.findAllProducts(req.query),
    }).send(res)
  }

  findProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get product success',
      metadata: await ProductServiceV2.findProduct({
        product_id: req.params.id,
      }),
    }).send(res)
  }
}

module.exports = new ProductController()
