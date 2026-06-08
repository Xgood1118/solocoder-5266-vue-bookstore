const express = require('express')
const router = express.Router()
const pdfService = require('../services/pdfService')
const { pdfTrialLimiter } = require('../middleware/rateLimit')
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth')
const recommendationService = require('../services/recommendationService')

router.get('/info/:bookId', (req, res) => {
  const result = pdfService.getPdfInfo(req.params.bookId)
  res.json(result)
})

router.get('/trial/:bookId', pdfTrialLimiter, (req, res) => {
  const result = pdfService.getTrialPages(req.params.bookId, req.query.page, req.query.pageSize)
  res.json(result)
})

router.get('/page/:bookId/:page', pdfTrialLimiter, optionalAuthMiddleware, async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId)
    const pageNum = parseInt(req.params.page)

    if (req.user) {
      const book = require('../db/database').prepare(
        'SELECT trial_pages FROM books WHERE id = ?'
      ).get(bookId)
      const trialPages = book?.trial_pages || 10
      const readPercent = Math.min(100, Math.floor((pageNum / trialPages) * 100))
      recommendationService.recordReading(req.user.id, bookId, pageNum, readPercent)
    }

    const result = await pdfService.getPdfPage(bookId, pageNum)

    if (result.error) {
      return res.status(result.status || 500).json({
        code: result.status || 500,
        message: result.error,
        data: null,
      })
    }

    res.setHeader('Content-Type', result.contentType)
    res.setHeader('X-Page', result.page)
    res.setHeader('X-Total-Pages', result.totalPages)
    res.setHeader('X-Trial-Pages', result.trialPages)
    res.send(result.data)
  } catch (err) {
    console.error('PDF 页面获取失败:', err)
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/full-trial/:bookId', pdfTrialLimiter, async (req, res) => {
  try {
    const result = await pdfService.getTrialPdf(req.params.bookId)

    if (result.error) {
      return res.status(result.status || 500).json({
        code: result.status || 500,
        message: result.error,
        data: null,
      })
    }

    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `inline; filename="trial.pdf"`)
    res.setHeader('X-Trial-Pages', result.trialPages)
    res.setHeader('X-Total-Pages', result.totalPages)
    res.send(result.data)
  } catch (err) {
    console.error('PDF 试读获取失败:', err)
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/generate-sample/:bookId', authMiddleware, async (req, res) => {
  try {
    const result = await pdfService.createSamplePdf(req.params.bookId)
    res.json(result)
  } catch (err) {
    console.error('生成示例 PDF 失败:', err)
    res.status(500).json({ code: 500, message: '生成失败', data: null })
  }
})

module.exports = router
