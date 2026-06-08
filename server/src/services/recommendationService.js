const db = require('../db/database')
const { success, hashUserId } = require('../utils/helpers')
const bookService = require('./bookService')

class RecommendationService {
  getRecommendations(userId, params = {}) {
    const { limit = 10, type = 'mixed' } = params

    if (!userId) {
      return this.getColdStartRecommendations(limit)
    }

    const userHistory = this.getUserHistory(userId)
    if (userHistory.length < 3) {
      return this.getColdStartRecommendations(limit)
    }

    const userBased = this.getUserBasedRecommendations(userId, limit)
    const tagBased = this.getTagBasedRecommendations(userId, Math.floor(limit / 2))

    const combined = this._mergeRecommendations([userBased.list, tagBased.list], limit)

    return success({
      list: combined,
      type: userHistory.length < 5 ? 'cold_start' : 'collaborative',
    })
  }

  getColdStartRecommendations(limit = 10) {
    const books = db.prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.status = 1
      ORDER BY b.sales_count DESC, b.rating_avg DESC
      LIMIT ?
    `).all(limit)

    return success({
      list: books,
      type: 'cold_start',
    })
  }

  getUserBasedRecommendations(userId, limit = 10) {
    const hashedId = hashUserId(userId)

    const userBooks = db.prepare(`
      SELECT book_id, read_percent 
      FROM reading_history 
      WHERE hashed_user_id = ?
      ORDER BY last_read_at DESC
      LIMIT 20
    `).all(hashedId)

    if (userBooks.length === 0) {
      return this.getColdStartRecommendations(limit)
    }

    const userBookIds = new Set(userBooks.map(b => b.book_id))

    const similarUsers = this._findSimilarUsers(hashedId, userBookIds)

    const recommendedBooks = new Map()

    for (const simUser of similarUsers) {
      const simUserBooks = db.prepare(`
        SELECT book_id FROM reading_history 
        WHERE hashed_user_id = ? AND book_id NOT IN (${[...userBookIds].map(() => '?').join(',')})
        ORDER BY last_read_at DESC
        LIMIT 10
      `).all(simUser.hashed_user_id, ...userBookIds)

      for (const book of simUserBooks) {
        const currentScore = recommendedBooks.get(book.book_id) || 0
        recommendedBooks.set(book.book_id, currentScore + simUser.similarity)
      }
    }

    const sortedBooks = [...recommendedBooks.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([bookId]) => bookId)

    let books = []
    if (sortedBooks.length > 0) {
      books = bookService.getBooksByIds(sortedBooks)
      const bookMap = new Map(books.map(b => [b.id, b]))
      books = sortedBooks.map(id => bookMap.get(id)).filter(Boolean)
    }

    if (books.length < limit) {
      const coldStart = this.getColdStartRecommendations(limit - books.length)
      const existingIds = new Set(books.map(b => b.id))
      for (const book of coldStart.list) {
        if (!existingIds.has(book.id)) {
          books.push(book)
          existingIds.add(book.id)
        }
      }
    }

    return success({
      list: books.slice(0, limit),
      type: 'collaborative',
    })
  }

  _findSimilarUsers(hashedUserId, userBookIds) {
    const users = db.prepare(`
      SELECT DISTINCT hashed_user_id 
      FROM reading_history 
      WHERE hashed_user_id != ?
    `).all(hashedUserId)

    const similarUsers = []

    for (const user of users) {
      const userBooks = db.prepare(`
        SELECT book_id FROM reading_history WHERE hashed_user_id = ?
      `).all(user.hashed_user_id).map(b => b.book_id)

      const userBookSet = new Set(userBooks)
      let intersection = 0
      for (const bookId of userBookIds) {
        if (userBookSet.has(bookId)) {
          intersection++
        }
      }

      const union = userBookIds.size + userBookSet.size - intersection
      const similarity = union > 0 ? intersection / union : 0

      if (similarity > 0) {
        similarUsers.push({
          hashed_user_id: user.hashed_user_id,
          similarity,
        })
      }
    }

    return similarUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
  }

  getTagBasedRecommendations(userId, limit = 10) {
    const hashedId = hashUserId(userId)

    const userBooks = db.prepare(`
      SELECT book_id FROM reading_history 
      WHERE hashed_user_id = ?
      ORDER BY last_read_at DESC
      LIMIT 10
    `).all(hashedId).map(b => b.book_id)

    if (userBooks.length === 0) {
      return this.getColdStartRecommendations(limit)
    }

    const placeholders = userBooks.map(() => '?').join(',')
    const userTags = db.prepare(`
      SELECT tag, COUNT(*) as count FROM book_tags 
      WHERE book_id IN (${placeholders})
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `).all(...userBooks)

    if (userTags.length === 0) {
      return this.getColdStartRecommendations(limit)
    }

    const tags = userTags.map(t => t.tag)
    const tagPlaceholders = tags.map(() => '?').join(',')

    const recommendedBooks = db.prepare(`
      SELECT bt.book_id, COUNT(*) as tag_match_count, b.title, b.cover_image, b.sales_count, b.rating_avg, a.name as author_name
      FROM book_tags bt
      LEFT JOIN books b ON bt.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE bt.tag IN (${tagPlaceholders}) 
        AND bt.book_id NOT IN (${placeholders})
        AND b.status = 1
      GROUP BY bt.book_id
      ORDER BY tag_match_count DESC, b.sales_count DESC
      LIMIT ?
    `).all(...tags, ...userBooks, limit)

    return success({
      list: recommendedBooks,
      type: 'tag_based',
    })
  }

  getUserHistory(userId) {
    const hashedId = hashUserId(userId)
    return db.prepare(`
      SELECT * FROM reading_history 
      WHERE hashed_user_id = ?
      ORDER BY last_read_at DESC
    `).all(hashedId)
  }

  recordReading(userId, bookId, page, readPercent) {
    const hashedId = hashUserId(userId)

    const existing = db.prepare(
      'SELECT * FROM reading_history WHERE hashed_user_id = ? AND book_id = ?'
    ).get(hashedId, bookId)

    const nowTime = Math.floor(Date.now() / 1000)

    if (existing) {
      db.prepare(`
        UPDATE reading_history 
        SET last_page = ?, read_percent = MAX(read_percent, ?), last_read_at = ?
        WHERE hashed_user_id = ? AND book_id = ?
      `).run(page, readPercent, nowTime, hashedId, bookId)
    } else {
      db.prepare(`
        INSERT INTO reading_history (
          hashed_user_id, book_id, last_page, read_percent, last_read_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(hashedId, bookId, page, readPercent, nowTime, nowTime)
    }
  }

  _mergeRecommendations(lists, limit) {
    const seen = new Set()
    const result = []

    const maxLen = Math.max(...lists.map(l => l.length))
    for (let i = 0; i < maxLen && result.length < limit; i++) {
      for (const list of lists) {
        if (i < list.length && result.length < limit) {
          const book = list[i]
          if (!seen.has(book.id)) {
            seen.add(book.id)
            result.push(book)
          }
        }
      }
    }

    return result.slice(0, limit)
  }

  getSimilarBooks(bookId, limit = 10) {
    const book = db.prepare('SELECT category_id, author_id FROM books WHERE id = ?').get(bookId)
    if (!book) return success([])

    const books = db.prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id != ? AND b.status = 1
        AND (b.category_id = ? OR b.author_id = ?)
      ORDER BY b.sales_count DESC, b.rating_avg DESC
      LIMIT ?
    `).all(bookId, book.category_id, book.author_id, limit)

    return success(books)
  }

  getBestsellers(limit = 10, categoryId = null) {
    const where = ['b.status = 1']
    const values = []

    if (categoryId) {
      where.push('b.category_id = ?')
      values.push(categoryId)
    }

    const whereSql = 'WHERE ' + where.join(' AND ')

    const books = db.prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      ${whereSql}
      ORDER BY b.sales_count DESC
      LIMIT ?
    `).all(...values, limit)

    return success(books)
  }

  getNewArrivals(limit = 10) {
    const books = db.prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.status = 1
      ORDER BY b.created_at DESC
      LIMIT ?
    `).all(limit)

    return success(books)
  }
}

module.exports = new RecommendationService()
