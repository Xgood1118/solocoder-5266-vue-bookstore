const express = require('express')
const router = express.Router()
const reviewService = require('../services/reviewService')
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth')

router.get('/list', optionalAuthMiddleware, (req, res) => {
  const result = reviewService.getReviewList(req.query.bookId, req.query)
  res.json(result)
})

router.get('/stats/:bookId', (req, res) => {
  const result = reviewService.getReviewStats(req.params.bookId)
  res.json(result)
})

router.post('/create', authMiddleware, (req, res) => {
  const result = reviewService.createReview(req.user.id, req.body)
  res.json(result)
})

router.post('/vote/:id', authMiddleware, (req, res) => {
  const result = reviewService.voteHelpful(req.user.id, req.params.id, req.body.voteType || 'helpful')
  res.json(result)
})

router.get('/my', authMiddleware, (req, res) => {
  const result = reviewService.getUserReviews(req.user.id, req.query)
  res.json(result)
})

router.get('/tags', (req, res) => {
  const result = reviewService.getAllTags()
  res.json(result)
})

module.exports = router
