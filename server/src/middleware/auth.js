const jwt = require('jsonwebtoken')
const config = require('../config')
const { fail } = require('../utils/helpers')
const db = require('../db/database')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return res.json(fail('请先登录', 401))
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    const user = db.prepare('SELECT id, username, email, nickname, avatar, member_level, total_spend_cents FROM users WHERE id = ?').get(decoded.userId)
    
    if (!user) {
      return res.json(fail('用户不存在', 401))
    }

    req.user = user
    next()
  } catch (err) {
    return res.json(fail('Token 无效或已过期', 401))
  }
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    const user = db.prepare('SELECT id, username, email, nickname, avatar, member_level, total_spend_cents FROM users WHERE id = ?').get(decoded.userId)
    if (user) {
      req.user = user
    }
  } catch (err) {
    // ignore
  }

  next()
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
}
