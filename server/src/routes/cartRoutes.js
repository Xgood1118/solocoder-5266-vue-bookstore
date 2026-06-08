const express = require('express')
const router = express.Router()
const cartService = require('../services/cartService')
const { authMiddleware } = require('../middleware/auth')

router.get('/', authMiddleware, (req, res) => {
  const result = cartService.getCart(req.user.id)
  res.json(result)
})

router.post('/add', authMiddleware, (req, res) => {
  const { skuId, quantity } = req.body
  const result = cartService.addToCart(req.user.id, skuId, quantity || 1)
  res.json(result)
})

router.put('/update', authMiddleware, (req, res) => {
  const { skuId, quantity } = req.body
  const result = cartService.updateCartItem(req.user.id, skuId, quantity)
  res.json(result)
})

router.delete('/remove/:skuId', authMiddleware, (req, res) => {
  const result = cartService.removeFromCart(req.user.id, req.params.skuId)
  res.json(result)
})

router.delete('/clear', authMiddleware, (req, res) => {
  const result = cartService.clearCart(req.user.id)
  res.json(result)
})

module.exports = router
