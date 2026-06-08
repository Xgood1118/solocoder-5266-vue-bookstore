const express = require('express')
const router = express.Router()
const rankingService = require('../services/rankingService')

router.get('/types', (req, res) => {
  const result = rankingService.getAvailableTypes()
  res.json(result)
})

router.get('/:type', (req, res) => {
  const result = rankingService.getRanking(req.params.type, req.query)
  res.json(result)
})

router.get('/trend/:type', (req, res) => {
  const result = rankingService.getTrendData(req.params.type, req.query.days || 7)
  res.json(result)
})

router.post('/recalculate', (req, res) => {
  const results = rankingService.recalculateAll()
  res.json({ code: 0, message: 'success', data: results })
})

module.exports = router
