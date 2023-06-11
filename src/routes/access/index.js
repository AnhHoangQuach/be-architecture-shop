'use strict'

const express = require('express')
const router = express.Router()
const accessController = require('../../controllers/access.controller')
const { authentication, authenticationV2 } = require('../../auth/authUtils')
const asyncHandler = require('../../helpers/asyncHandler')

router.post('/signup', asyncHandler(accessController.signUp))
router.post('/login', asyncHandler(accessController.login))

router.use(authenticationV2)

router.post('/logout', asyncHandler(accessController.logout))
router.post('/handlerRefreshToken', asyncHandler(accessController.handlerRefreshToken))

module.exports = router
