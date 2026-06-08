const rateLimit = require('express-rate-limit')

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
})

const pdfTrialLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { code: 429, message: '试读请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
})

const couponUseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.id}` : req.ip
  },
  message: { code: 429, message: '优惠码使用过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  generalLimiter,
  pdfTrialLimiter,
  couponUseLimiter,
}
