const express = require('express')
const router = express.Router()
const authorService = require('../services/authorService')

router.get('/list', (req, res) => {
  const result = authorService.getAuthorList(req.query)
  res.json(result)
})

router.get('/detail/:id', (req, res) => {
  const result = authorService.getAuthorDetail(req.params.id)
  res.json(result)
})

router.get('/:id/books', (req, res) => {
  const result = authorService.getAuthorBooks(req.params.id, req.query)
  res.json(result)
})

module.exports = router
