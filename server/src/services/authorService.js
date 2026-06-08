const db = require('../db/database')
const { success, fail, paginate } = require('../utils/helpers')

class AuthorService {
  getAuthorList(params = {}) {
    const { keyword, page = 1, pageSize = 20, sort = 'works' } = params

    const where = []
    const values = []

    if (keyword) {
      where.push('name LIKE ?')
      values.push(`%${keyword}%`)
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const countSql = `SELECT COUNT(*) as count FROM authors ${whereSql}`
    const total = db.prepare(countSql).get(...values).count

    let orderSql = 'ORDER BY works_count DESC'
    if (sort === 'name') {
      orderSql = 'ORDER BY name ASC'
    } else if (sort === 'new') {
      orderSql = 'ORDER BY created_at DESC'
    }

    const p = paginate(page, pageSize, total)

    const list = db.prepare(`
      SELECT * FROM authors
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `).all(...values, p.pageSize, p.offset)

    return success({
      list,
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }

  getAuthorDetail(id) {
    const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(id)
    if (!author) {
      return fail('作者不存在')
    }

    const books = db.prepare(`
      SELECT * FROM books 
      WHERE author_id = ? AND status = 1
      ORDER BY created_at DESC
      LIMIT 50
    `).all(id)

    return success({
      ...author,
      books,
    })
  }

  getAuthorBooks(authorId, params = {}) {
    const { page = 1, pageSize = 20 } = params

    const countSql = 'SELECT COUNT(*) as count FROM books WHERE author_id = ? AND status = 1'
    const total = db.prepare(countSql).get(authorId).count

    const p = paginate(page, pageSize, total)

    const list = db.prepare(`
      SELECT * FROM books
      WHERE author_id = ? AND status = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(authorId, p.pageSize, p.offset)

    return success({
      list,
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }
}

module.exports = new AuthorService()
