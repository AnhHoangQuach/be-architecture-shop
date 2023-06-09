'use strict'

const express = require('express')
const router = express.Router()
const cartController = require('../../controllers/cart.controller')
const asyncHandler = require('../../helpers/asyncHandler')

router.post('', asyncHandler(cartController.addToCart))
router.post('/update', asyncHandler(cartController.update))
router.delete('', asyncHandler(cartController.delete))
router.get('', asyncHandler(cartController.getListUserCart))

module.exports = router
