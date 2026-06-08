const express = require('express')
const router = express.Router()
const couponService = require('../services/couponService')
const { authMiddleware } = require('../middleware/auth')
const { couponUseLimiter } = require('../middleware/rateLimit')

router.get('/list', (req, res) => {
  const result = couponService.getCouponList(req.query)
  res.json(result)
})

router.get('/mine', authMiddleware, (req, res) => {
  const result = couponService.getUserCoupons(req.user.id, req.query.status || 'unused')
  res.json(result)
})

router.post('/receive/:id', authMiddleware, (req, res) => {
  const result = couponService.receiveCoupon(req.user.id, req.params.id)
  res.json(result)
})

router.get('/available', authMiddleware, (req, res) => {
  const result = couponService.getAvailableCoupons(req.user.id, req.query.amount || 0)
  res.json(result)
})

router.post('/use', authMiddleware, couponUseLimiter, (req, res) => {
  const { couponId, amount } = req.body
  const result = couponService.useCoupon(req.user.id, couponId, amount)
  res.json(result)
})

module.exports = router
