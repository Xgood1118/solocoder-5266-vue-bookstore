const express = require('express')
const router = express.Router()
const bookService = require('../services/bookService')
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth')

router.get('/list', optionalAuthMiddleware, (req, res) => {
  const result = bookService.getBookList(req.query)
  res.json(result)
})

router.get('/detail/:id', optionalAuthMiddleware, (req, res) => {
  const result = bookService.getBookDetail(req.params.id)
  res.json(result)
})

router.get('/skus/:bookId', (req, res) => {
  const stockService = require('../services/stockService')
  const result = stockService.getStockList(req.params.bookId)
  res.json({ code: 0, message: 'success', data: result })
})

router.get('/similar/:id', (req, res) => {
  const recommendationService = require('../services/recommendationService')
  const result = recommendationService.getSimilarBooks(req.params.id, req.query.limit || 10)
  res.json(result)
})

router.get('/bestsellers', (req, res) => {
  const recommendationService = require('../services/recommendationService')
  const result = recommendationService.getBestsellers(req.query.limit || 10, req.query.categoryId)
  res.json(result)
})

router.get('/new-arrivals', (req, res) => {
  const recommendationService = require('../services/recommendationService')
  const result = recommendationService.getNewArrivals(req.query.limit || 10)
  res.json(result)
})

module.exports = router
