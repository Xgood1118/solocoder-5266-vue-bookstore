const express = require('express')
const cors = require('cors')
const expressPath = require('path')
const fs = require('fs')
const config = require('./config')
const { success } = require('./utils/helpers')
const cronService = require('./services/cronService')
const db = require('./db/database')
const runMigrations = require('./db/migrate')
const runSeed = require('./db/seed')
const { generalLimiter } = require('./middleware/rateLimit')

const userRoutes = require('./routes/userRoutes')
const bookRoutes = require('./routes/bookRoutes')
const authorRoutes = require('./routes/authorRoutes')
const cartRoutes = require('./routes/cartRoutes')
const orderRoutes = require('./routes/orderRoutes')
const couponRoutes = require('./routes/couponRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const recommendationRoutes = require('./routes/recommendationRoutes')
const rankingRoutes = require('./routes/rankingRoutes')
const pdfRoutes = require('./routes/pdfRoutes')
const favoriteRoutes = require('./routes/favoriteRoutes')

const upload = require('./middleware/upload')
const { authMiddleware } = require('./middleware/auth')

async function startServer() {
  console.log('正在初始化数据库...')
  await db.init()
  await runMigrations()
  await runSeed()
  console.log('数据库初始化完成!')

  const uploadDir = config.upload.dir
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const pdfDir = config.pdf.dir
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true })
  }

  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use('/api', generalLimiter)

  app.use('/static', express.static(expressPath.join(__dirname, '..', 'uploads')))

  app.get('/api/health', (req, res) => {
    res.json(success({ status: 'ok', timestamp: Math.floor(Date.now() / 1000) }))
  })

  app.use('/api/user', userRoutes)
  app.use('/api/book', bookRoutes)
  app.use('/api/author', authorRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/order', orderRoutes)
  app.use('/api/coupon', couponRoutes)
  app.use('/api/review', reviewRoutes)
  app.use('/api/recommendation', recommendationRoutes)
  app.use('/api/ranking', rankingRoutes)
  app.use('/api/pdf', pdfRoutes)
  app.use('/api/favorite', favoriteRoutes)

  app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.json({ code: 1, message: '上传失败', data: null })
    }
    const url = `/static/${req.file.filename}`
    res.json(success({ url, filename: req.file.filename }, '上传成功'))
  })

  app.use((err, req, res, next) => {
    console.error('服务器错误:', err)
    res.json({ code: 500, message: err.message || '服务器内部错误', data: null })
  })

  const PORT = config.port
  app.listen(PORT, () => {
    console.log(`📚 书店服务已启动: http://localhost:${PORT}`)
    cronService.start()
  })

  process.on('SIGINT', () => {
    console.log('\n正在关闭服务...')
    cronService.stop()
    process.exit(0)
  })

  return app
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('服务启动失败:', err)
    process.exit(1)
  })
}

module.exports = startServer
