const express = require('express')
const router = express.Router()
const recommendationService = require('../services/recommendationService')
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth')

router.get('/', optionalAuthMiddleware, (req, res) => {
  const userId = req.user ? req.user.id : null
  const result = recommendationService.getRecommendations(userId, req.query)
  res.json(result)
})

router.get('/for-you', optionalAuthMiddleware, (req, res) => {
  const userId = req.user ? req.user.id : null
  const result = recommendationService.getRecommendations(userId, req.query)
  res.json(result)
})

router.get('/cold-start', (req, res) => {
  const result = recommendationService.getColdStartRecommendations(req.query.limit || 10)
  res.json(result)
})

router.get('/similar/:bookId', (req, res) => {
  const result = recommendationService.getSimilarBooks(req.params.bookId, req.query.limit || 10)
  res.json(result)
})

router.get('/bestsellers', (req, res) => {
  const result = recommendationService.getBestsellers(req.query.limit || 10, req.query.categoryId)
  res.json(result)
})

router.get('/new-arrivals', (req, res) => {
  const result = recommendationService.getNewArrivals(req.query.limit || 10)
  res.json(result)
})

router.post('/reading-record', authMiddleware, (req, res) => {
  const { bookId, page, readPercent } = req.body
  recommendationService.recordReading(req.user.id, bookId, page || 1, readPercent || 0)
  res.json({ code: 0, message: 'success', data: null })
})

router.get('/history', authMiddleware, (req, res) => {
  const result = recommendationService.getUserHistory(req.user.id)
  res.json({ code: 0, message: 'success', data: result })
})

module.exports = router
