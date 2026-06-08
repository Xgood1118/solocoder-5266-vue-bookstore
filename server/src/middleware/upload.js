const multer = require('multer')
const path = require('path')
const fs = require('fs')
const config = require('../config')

const uploadDir = config.upload.dir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const pdfDir = config.pdf.dir
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, pdfDir)
    } else {
      cb(null, uploadDir)
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}_${random}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  },
})

module.exports = upload
