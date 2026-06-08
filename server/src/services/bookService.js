const db = require('../db/database')
const { success, fail, now, paginate } = require('../utils/helpers')

class BookService {
  getBookList(params = {}) {
    const {
      keyword,
      categoryId,
      authorId,
      tag,
      sort = 'new',
      page = 1,
      pageSize = 20,
    } = params

    const where = ['b.status = 1']
    const values = []

    if (keyword) {
      where.push('(b.title LIKE ? OR b.isbn LIKE ?)')
      values.push(`%${keyword}%`, `%${keyword}%`)
    }

    if (categoryId) {
      where.push('b.category_id = ?')
      values.push(categoryId)
    }

    if (authorId) {
      where.push('b.author_id = ?')
      values.push(authorId)
    }

    if (tag) {
      where.push('b.id IN (SELECT book_id FROM book_tags WHERE tag = ?)')
      values.push(tag)
    }

    const whereSql = 'WHERE ' + where.join(' AND ')

    const countSql = `SELECT COUNT(*) as count FROM books b ${whereSql}`
    const total = db.prepare(countSql).get(...values).count

    let orderSql = 'ORDER BY b.created_at DESC'
    if (sort === 'sales') {
      orderSql = 'ORDER BY b.sales_count DESC'
    } else if (sort === 'rating') {
      orderSql = 'ORDER BY b.rating_avg DESC'
    } else if (sort === 'price_asc') {
      orderSql = 'ORDER BY b.price_cents ASC'
    } else if (sort === 'price_desc') {
      orderSql = 'ORDER BY b.price_cents DESC'
    }

    const p = paginate(page, pageSize, total)

    const sql = `
      SELECT b.*, a.name as author_name, c.name as category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `
    const list = db.prepare(sql).all(...values, p.pageSize, p.offset)

    const bookIds = list.map(b => b.id)
    let tagsByBook = {}
    if (bookIds.length) {
      const placeholders = bookIds.map(() => '?').join(',')
      const allTags = db.prepare(`
        SELECT book_id, tag FROM book_tags WHERE book_id IN (${placeholders})
      `).all(...bookIds)
      tagsByBook = allTags.reduce((acc, t) => {
        if (!acc[t.book_id]) acc[t.book_id] = []
        acc[t.book_id].push(t.tag)
        return acc
      }, {})
    }

    return success({
      list: list.map(b => ({
        ...b,
        tags: tagsByBook[b.id] || [],
      })),
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }

  getBookDetail(id) {
    const book = db.prepare(`
      SELECT b.*, a.name as author_name, a.avatar as author_avatar, a.bio as author_bio,
             c.name as category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ? AND b.status = 1
    `).get(id)

    if (!book) {
      return fail('书籍不存在')
    }

    const skus = db.prepare('SELECT * FROM book_skus WHERE book_id = ?').get(id)
    const tags = db.prepare('SELECT tag FROM book_tags WHERE book_id = ?').all(id)
    const contents = db.prepare('SELECT * FROM book_contents WHERE book_id = ? ORDER BY sort_order ASC').all(id)

    this.incrementViewCount(id)

    return success({
      ...book,
      skus: skus || [],
      tags: tags.map(t => t.tag),
      contents,
    })
  }

  incrementViewCount(bookId) {
    db.prepare('UPDATE books SET view_count = view_count + 1 WHERE id = ?').run(bookId)
  }

  getSkusByIds(skuIds) {
    if (!skuIds || !skuIds.length) return []
    const placeholders = skuIds.map(() => '?').join(',')
    return db.prepare(`
      SELECT bs.*, b.title as book_title, b.cover_image, b.status as book_status,
             b.author_id, b.isbn
      FROM book_skus bs
      LEFT JOIN books b ON bs.book_id = b.id
      WHERE bs.id IN (${placeholders})
    `).all(...skuIds)
  }

  getSkuById(skuId) {
    return db.prepare(`
      SELECT bs.*, b.title as book_title, b.cover_image, b.status as book_status
      FROM book_skus bs
      LEFT JOIN books b ON bs.book_id = b.id
      WHERE bs.id = ?
    `).get(skuId)
  }

  getBooksByIds(bookIds) {
    if (!bookIds || !bookIds.length) return []
    const placeholders = bookIds.map(() => '?').join(',')
    return db.prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id IN (${placeholders}) AND b.status = 1
    `).all(...bookIds)
  }

  getSimilarBooks(bookId, limit = 10) {
    const book = db.prepare('SELECT category_id, author_id FROM books WHERE id = ?').get(bookId)
    if (!book) return []

    return db.prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id != ? AND b.status = 1
        AND (b.category_id = ? OR b.author_id = ?)
      ORDER BY b.sales_count DESC
      LIMIT ?
    `).all(bookId, book.category_id, book.author_id, limit)
  }

  updateSalesCount(bookId, quantity) {
    db.prepare(`
      UPDATE books SET sales_count = sales_count + ? WHERE id = ?
    `).run(quantity, bookId)
  }
}

module.exports = new BookService()
