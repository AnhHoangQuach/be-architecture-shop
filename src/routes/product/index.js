'use strict'

const express = require('express')
const router = express.Router()
const productController = require('../../controllers/product.controller')
const { authenticationV2 } = require('../../auth/authUtils')
const asyncHandler = require('../../helpers/asyncHandler')

router.get('/search/:keySearch', asyncHandler(productController.getListSearchProduct))
router.get('', asyncHandler(productController.findAllProducts))
router.get('/:id', asyncHandler(productController.findProduct))

router.use(authenticationV2)

router.post('', asyncHandler(productController.createProduct))
router.patch('/:id', asyncHandler(productController.updateProduct))

router.post('/publish/:id', asyncHandler(productController.publishProductForShop))
router.post('/unpublish/:id', asyncHandler(productController.unPublishProductForShop))

router.get('/drafts/all', asyncHandler(productController.getAllDraftsForShop))
router.get('/published/all', asyncHandler(productController.getAllPublishForShop))

module.exports = router
