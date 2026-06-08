const express = require('express')
const router = express.Router()
const favoriteService = require('../services/favoriteService')
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth')

router.get('/', authMiddleware, (req, res) => {
  const result = favoriteService.getFavorites(req.user.id, req.query)
  res.json(result)
})

router.post('/add/:bookId', authMiddleware, (req, res) => {
  const result = favoriteService.addFavorite(req.user.id, req.params.bookId)
  res.json(result)
})

router.delete('/remove/:bookId', authMiddleware, (req, res) => {
  const result = favoriteService.removeFavorite(req.user.id, req.params.bookId)
  res.json(result)
})

router.post('/toggle/:bookId', authMiddleware, (req, res) => {
  const result = favoriteService.toggleFavorite(req.user.id, req.params.bookId)
  res.json(result)
})

router.get('/check/:bookId', optionalAuthMiddleware, (req, res) => {
  if (!req.user) {
    return res.json({ code: 0, message: 'success', data: { isFavorited: false } })
  }
  const result = favoriteService.isFavorited(req.user.id, req.params.bookId)
  res.json(result)
})

module.exports = router
