const db = require('../db/database')
const { success, fail, now, paginate } = require('../utils/helpers')

class FavoriteService {
  getFavorites(userId, params = {}) {
    const { page = 1, pageSize = 20 } = params

    const countSql = `
      SELECT COUNT(*) as count FROM favorites f
      LEFT JOIN books b ON f.book_id = b.id
      WHERE f.user_id = ? AND b.status = 1
    `
    const total = db.prepare(countSql).get(userId).count

    const p = paginate(page, pageSize, total)

    const list = db.prepare(`
      SELECT f.id, f.created_at, b.*, a.name as author_name
      FROM favorites f
      LEFT JOIN books b ON f.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE f.user_id = ? AND b.status = 1
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, p.pageSize, p.offset)

    return success({
      list,
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }

  addFavorite(userId, bookId) {
    const book = db.prepare('SELECT id, status FROM books WHERE id = ?').get(bookId)
    if (!book || book.status !== 1) {
      return fail('书籍不存在或已下架')
    }

    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?'
    ).get(userId, bookId)

    if (existing) {
      return fail('已收藏')
    }

    db.prepare(`
      INSERT INTO favorites (user_id, book_id, created_at)
      VALUES (?, ?, ?)
    `).run(userId, bookId, now())

    return success(null, '收藏成功')
  }

  removeFavorite(userId, bookId) {
    const result = db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND book_id = ?'
    ).run(userId, bookId)

    if (result.changes === 0) {
      return fail('未收藏')
    }

    return success(null, '已取消收藏')
  }

  isFavorited(userId, bookId) {
    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?'
    ).get(userId, bookId)

    return success({ isFavorited: !!existing })
  }

  toggleFavorite(userId, bookId) {
    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?'
    ).get(userId, bookId)

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
      return success({ isFavorited: false }, '已取消收藏')
    } else {
      const book = db.prepare('SELECT id, status FROM books WHERE id = ?').get(bookId)
      if (!book || book.status !== 1) {
        return fail('书籍不存在或已下架')
      }
      db.prepare(`
        INSERT INTO favorites (user_id, book_id, created_at)
        VALUES (?, ?, ?)
      `).run(userId, bookId, now())
      return success({ isFavorited: true }, '收藏成功')
    }
  }
}

module.exports = new FavoriteService()
