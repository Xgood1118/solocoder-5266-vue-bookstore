const db = require('../db/database')
const { success, fail, now } = require('../utils/helpers')

const RANKING_TYPES = {
  SALES: 'sales',
  NEW: 'new',
  HOT_REVIEW: 'hot_review',
  KAIJUAN_MONTHLY: 'kaijuan_monthly',
}

class RankingService {
  getRanking(type, params = {}) {
    const { limit = 20, page = 1, period, date } = params

    const statDate = date || this._getTodayString()

    const where = ['ranking_type = ?', 'stat_date = ?']
    const values = [type, statDate]

    if (period) {
      where.push('period = ?')
      values.push(period)
    }

    const whereSql = 'WHERE ' + where.join(' AND ')

    const countSql = `SELECT COUNT(*) as count FROM ranking_books ${whereSql}`
    const total = db.prepare(countSql).get(...values).count

    const offset = (page - 1) * limit

    const rankings = db.prepare(`
      SELECT rb.*, b.title, b.cover_image, b.price_cents, b.rating_avg, b.sales_count,
             a.name as author_name
      FROM ranking_books rb
      LEFT JOIN books b ON rb.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      ${whereSql}
      ORDER BY rb.rank ASC
      LIMIT ? OFFSET ?
    `).all(...values, limit, offset)

    return success({
      list: rankings,
      total,
      page: Number(page),
      limit: Number(limit),
      statDate,
      type,
    })
  }

  _getTodayString() {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }

  _getMonthString() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  calculateSalesRanking(limit = 100) {
    const statDate = this._getTodayString()

    db.prepare('DELETE FROM ranking_books WHERE ranking_type = ? AND stat_date = ?')
      .run(RANKING_TYPES.SALES, statDate)

    const books = db.prepare(`
      SELECT id, sales_count FROM books 
      WHERE status = 1 AND sales_count > 0
      ORDER BY sales_count DESC
      LIMIT ?
    `).all(limit)

    const insertStmt = db.prepare(`
      INSERT INTO ranking_books (ranking_type, book_id, rank, score, stat_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
      books.forEach((book, index) => {
        insertStmt.run(
          RANKING_TYPES.SALES,
          book.id,
          index + 1,
          book.sales_count,
          statDate,
          now()
        )
      })
    })

    tx()

    return books.length
  }

  calculateNewRanking(limit = 100) {
    const statDate = this._getTodayString()

    db.prepare('DELETE FROM ranking_books WHERE ranking_type = ? AND stat_date = ?')
      .run(RANKING_TYPES.NEW, statDate)

    const thirtyDaysAgo = now() - 30 * 24 * 3600

    const books = db.prepare(`
      SELECT id, created_at FROM books 
      WHERE status = 1 AND created_at > ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(thirtyDaysAgo, limit)

    const insertStmt = db.prepare(`
      INSERT INTO ranking_books (ranking_type, book_id, rank, score, stat_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
      books.forEach((book, index) => {
        const score = book.created_at
        insertStmt.run(
          RANKING_TYPES.NEW,
          book.id,
          index + 1,
          score,
          statDate,
          now()
        )
      })
    })

    tx()

    return books.length
  }

  calculateHotReviewRanking(limit = 100) {
    const statDate = this._getTodayString()

    db.prepare('DELETE FROM ranking_books WHERE ranking_type = ? AND stat_date = ?')
      .run(RANKING_TYPES.HOT_REVIEW, statDate)

    const books = db.prepare(`
      SELECT 
        b.id, 
        b.rating_avg, 
        b.rating_count,
        (b.rating_avg * b.rating_count) as score
      FROM books b
      WHERE b.status = 1 AND b.rating_count > 0
      ORDER BY score DESC
      LIMIT ?
    `).all(limit)

    const insertStmt = db.prepare(`
      INSERT INTO ranking_books (ranking_type, book_id, rank, score, stat_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
      books.forEach((book, index) => {
        insertStmt.run(
          RANKING_TYPES.HOT_REVIEW,
          book.id,
          index + 1,
          book.score || 0,
          statDate,
          now()
        )
      })
    })

    tx()

    return books.length
  }

  calculateKaijuanMonthly(limit = 100) {
    const statDate = this._getTodayString()
    const period = this._getMonthString()

    db.prepare('DELETE FROM ranking_books WHERE ranking_type = ? AND stat_date = ?')
      .run(RANKING_TYPES.KAIJUAN_MONTHLY, statDate)

    const firstDayOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)

    const books = db.prepare(`
      SELECT 
        b.id, 
        b.sales_count,
        b.rating_avg,
        b.view_count,
        (b.sales_count * 0.6 + b.rating_count * 0.3 + b.view_count * 0.1) as score
      FROM books b
      WHERE b.status = 1
      ORDER BY score DESC
      LIMIT ?
    `).all(limit)

    const insertStmt = db.prepare(`
      INSERT INTO ranking_books (ranking_type, book_id, rank, score, period, stat_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
      books.forEach((book, index) => {
        insertStmt.run(
          RANKING_TYPES.KAIJUAN_MONTHLY,
          book.id,
          index + 1,
          book.score || 0,
          period,
          statDate,
          now()
        )
      })
    })

    tx()

    return books.length
  }

  recalculateAll() {
    const results = {}
    results.sales = this.calculateSalesRanking()
    results.new = this.calculateNewRanking()
    results.hotReview = this.calculateHotReviewRanking()
    results.kaijuanMonthly = this.calculateKaijuanMonthly()
    return results
  }

  getTrendData(type, days = 7) {
    const dates = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    const placeholders = dates.map(() => '?').join(',')

    const data = db.prepare(`
      SELECT stat_date, book_id, rank, score
      FROM ranking_books
      WHERE ranking_type = ? AND stat_date IN (${placeholders})
      ORDER BY stat_date ASC, rank ASC
      LIMIT 500
    `).all(type, ...dates)

    const booksByDate = {}
    for (const item of data) {
      if (!booksByDate[item.stat_date]) {
        booksByDate[item.stat_date] = []
      }
      booksByDate[item.stat_date].push(item)
    }

    return success({
      dates,
      data: booksByDate,
      type,
    })
  }

  getAvailableTypes() {
    return success([
      { type: RANKING_TYPES.SALES, name: '畅销榜', description: '按销量排序' },
      { type: RANKING_TYPES.NEW, name: '新书榜', description: '按上架时间排序' },
      { type: RANKING_TYPES.HOT_REVIEW, name: '热评榜', description: '按评价热度排序' },
      { type: RANKING_TYPES.KAIJUAN_MONTHLY, name: '开卷月榜', description: '综合月度排行' },
    ])
  }
}

module.exports = new RankingService()
module.exports.RANKING_TYPES = RANKING_TYPES
