const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')

function success(data = null, message = 'success') {
  return { code: 0, message, data }
}

function fail(message = 'error', code = 1) {
  return { code, message, data: null }
}

function now() {
  return Math.floor(Date.now() / 1000)
}

function genOrderNo() {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BK${timestamp}${random}`
}

function genPayNo() {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `PAY${timestamp}${random}`
}

function hashUserId(userId) {
  return crypto.createHash('sha256').update(`user:${userId}:salt:bookstore`).digest('hex')
}

function formatPrice(cents) {
  return (cents / 100).toFixed(2)
}

function validateISBN13(isbn) {
  if (!/^\d{13}$/.test(isbn)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i])
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  return check === parseInt(isbn[12])
}

function validateISBN10(isbn) {
  if (!/^\d{9}[\dXx]$/.test(isbn)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i)
  }
  const last = isbn[9].toUpperCase()
  sum += last === 'X' ? 10 : parseInt(last)
  return sum % 11 === 0
}

function validateISBN(isbn) {
  if (!isbn) return false
  const clean = isbn.replace(/-/g, '')
  if (clean.length === 13) return validateISBN13(clean)
  if (clean.length === 10) return validateISBN10(clean)
  return false
}

function paginate(page, pageSize, total) {
  const currentPage = Math.max(1, parseInt(page) || 1)
  const size = Math.min(100, Math.max(1, parseInt(pageSize) || 10))
  const totalPages = Math.ceil(total / size)
  const offset = (currentPage - 1) * size
  return {
    page: currentPage,
    pageSize: size,
    total,
    totalPages,
    offset,
    hasMore: currentPage < totalPages,
  }
}

module.exports = {
  success,
  fail,
  now,
  genOrderNo,
  genPayNo,
  hashUserId,
  formatPrice,
  validateISBN,
  validateISBN13,
  validateISBN10,
  paginate,
}
