const path = require('path')

const config = {
  port: process.env.PORT || 3001,
  jwt: {
    secret: process.env.JWT_SECRET || 'bookstore-secret-key-2024',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  order: {
    expireMinutes: 30,
  },
  db: {
    path: path.join(__dirname, '..', 'data', 'bookstore.db'),
  },
  upload: {
    dir: path.join(__dirname, '..', 'uploads'),
    maxSize: 10 * 1024 * 1024,
  },
  pdf: {
    dir: path.join(__dirname, '..', 'uploads', 'pdfs'),
    trialPercent: 30,
  },
  member: {
    levels: [
      { level: 'silver', name: '白银会员', minSpend: 0, discount: 0.98 },
      { level: 'gold', name: '黄金会员', minSpend: 50000, discount: 0.95 },
      { level: 'diamond', name: '钻石会员', minSpend: 200000, discount: 0.9 },
    ],
  },
  coupon: {
    rateLimitWindow: 3600,
    maxUsesPerWindow: 3,
  },
  ranking: {
    cronSchedule: '0 0 * * *',
  },
}

module.exports = config
