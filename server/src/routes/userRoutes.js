const express = require('express')
const router = express.Router()
const userService = require('../services/userService')
const memberService = require('../services/memberService')
const { authMiddleware } = require('../middleware/auth')

router.post('/register', (req, res) => {
  const result = userService.register(req.body)
  res.json(result)
})

router.post('/login', (req, res) => {
  const result = userService.login(req.body)
  res.json(result)
})

router.post('/refresh', (req, res) => {
  const result = userService.refreshToken(req.body.refreshToken)
  res.json(result)
})

router.post('/logout', authMiddleware, (req, res) => {
  const result = userService.logout(req.body.refreshToken)
  res.json(result)
})

router.get('/profile', authMiddleware, (req, res) => {
  const result = userService.getProfile(req.user.id)
  res.json(result)
})

router.put('/profile', authMiddleware, (req, res) => {
  const result = userService.updateProfile(req.user.id, req.body)
  res.json(result)
})

router.post('/change-password', authMiddleware, (req, res) => {
  const result = userService.changePassword(req.user.id, req.body)
  res.json(result)
})

router.get('/member', authMiddleware, (req, res) => {
  const result = memberService.getMemberInfo(req.user.id)
  res.json(result)
})

router.get('/member/levels', (req, res) => {
  const result = memberService.getAllLevels()
  res.json(result)
})

router.get('/order-count', authMiddleware, (req, res) => {
  const result = userService.getOrderCount(req.user.id)
  res.json(result)
})

module.exports = router
