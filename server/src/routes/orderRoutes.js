const express = require('express')
const router = express.Router()
const { OrderService } = require('../services/orderService')
const { authMiddleware } = require('../middleware/auth')

router.post('/create', authMiddleware, (req, res) => {
  const result = OrderService.createOrder(req.user.id, req.body)
  res.json(result)
})

router.get('/list', authMiddleware, (req, res) => {
  const result = OrderService.getOrderList(req.user.id, req.query)
  res.json(result)
})

router.get('/detail/:id', authMiddleware, (req, res) => {
  const result = OrderService.getOrderDetail(req.user.id, req.params.id)
  res.json(result)
})

router.post('/cancel/:id', authMiddleware, (req, res) => {
  const result = OrderService.cancelOrder(req.user.id, req.params.id)
  res.json(result)
})

router.post('/pay/:id', authMiddleware, (req, res) => {
  const result = OrderService.payOrder(req.params.id)
  res.json(result)
})

router.post('/confirm/:id', authMiddleware, (req, res) => {
  const result = OrderService.confirmReceive(req.user.id, req.params.id)
  res.json(result)
})

router.post('/refund/:id', authMiddleware, (req, res) => {
  const result = OrderService.applyRefund(req.user.id, req.params.id)
  res.json(result)
})

module.exports = router
