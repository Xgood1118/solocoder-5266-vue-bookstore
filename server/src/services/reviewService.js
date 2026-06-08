const db = require('../db/database')
const { success, fail, now, paginate } = require('../utils/helpers')

const TAG_SYNONYMS = {
  '翻译差': '翻译一般',
  '翻译烂': '翻译一般',
  '翻译不好': '翻译一般',
  '翻译不行': '翻译一般',
  '剧情紧凑': '情节紧凑',
  '情节紧凑': '情节紧凑',
  '节奏快': '情节紧凑',
  '文笔优美': '文笔好',
  '文笔好': '文笔好',
  '文字优美': '文笔好',
  '文笔流畅': '文笔好',
  '值得一读': '推荐阅读',
  '强烈推荐': '推荐阅读',
  '推荐': '推荐阅读',
  '很治愈': '治愈系',
  '温暖治愈': '治愈系',
  '烧脑': '悬疑烧脑',
  '悬疑': '悬疑烧脑',
  '反转多': '悬疑烧脑',
  '感人': '感动',
  '泪目': '感动',
  '催泪': '感动',
  '干货多': '干货满满',
  '干货满满': '干货满满',
  '实用': '干货满满',
  '晦涩难懂': '难以理解',
  '难读': '难以理解',
  '看不懂': '难以理解',
  '经典': '经典必读',
  '名著': '经典必读',
  '必看': '经典必读',
}

const TAG_GROUPS = {
  '翻译一般': '翻译',
  '情节紧凑': '情节',
  '文笔好': '文笔',
  '推荐阅读': '推荐度',
  '治愈系': '风格',
  '悬疑烧脑': '风格',
  '感动': '情感',
  '干货满满': '内容',
  '难以理解': '阅读难度',
  '经典必读': '地位',
  '剧情紧凑': '情节',
  '文笔优美': '文笔',
  '值得一读': '推荐度',
  '强烈推荐': '推荐度',
  '很治愈': '风格',
  '温暖治愈': '风格',
  '烧脑': '风格',
  '反转多': '情节',
  '感人': '情感',
  '泪目': '情感',
  '催泪': '情感',
  '干货多': '内容',
  '实用': '内容',
  '晦涩难懂': '阅读难度',
  '难读': '阅读难度',
  '看不懂': '阅读难度',
  '经典': '地位',
  '名著': '地位',
  '必看': '地位',
}

function normalizeTag(tag) {
  const trimmed = tag.trim()
  return TAG_SYNONYMS[trimmed] || trimmed
}

function getTagGroup(tag) {
  return TAG_GROUPS[tag] || '其他'
}

class ReviewService {
  getReviewList(bookId, params = {}) {
    const { rating, sort = 'new', page = 1, pageSize = 10 } = params

    const where = ['book_id = ?', 'status = ?']
    const values = [bookId, 'approved']

    if (rating) {
      where.push('rating = ?')
      values.push(rating)
    }

    const whereSql = 'WHERE ' + where.join(' AND ')

    const countSql = `SELECT COUNT(*) as count FROM reviews ${whereSql}`
    const total = db.prepare(countSql).get(...values).count

    let orderSql = 'ORDER BY created_at DESC'
    if (sort === 'helpful') {
      orderSql = 'ORDER BY helpful_count DESC'
    } else if (sort === 'rating_high') {
      orderSql = 'ORDER BY rating DESC'
    } else if (sort === 'rating_low') {
      orderSql = 'ORDER BY rating ASC'
    }

    const p = paginate(page, pageSize, total)

    const reviews = db.prepare(`
      SELECT r.*, u.nickname, u.avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `).all(...values, p.pageSize, p.offset)

    const reviewIds = reviews.map(r => r.id)
    let tagsByReview = {}
    if (reviewIds.length) {
      const placeholders = reviewIds.map(() => '?').join(',')
      const allTags = db.prepare(`
        SELECT review_id, tag, tag_group FROM review_tags 
        WHERE review_id IN (${placeholders})
      `).all(...reviewIds)
      tagsByReview = allTags.reduce((acc, t) => {
        if (!acc[t.review_id]) acc[t.review_id] = []
        acc[t.review_id].push({ tag: t.tag, group: t.tag_group })
        return acc
      }, {})
    }

    return success({
      list: reviews.map(r => ({
        ...r,
        tags: tagsByReview[r.id] || [],
      })),
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }

  getReviewStats(bookId) {
    const stats = db.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_count,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as count_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as count_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as count_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as count_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as count_1
      FROM reviews 
      WHERE book_id = ? AND status = 'approved'
    `).get(bookId)

    const tags = db.prepare(`
      SELECT tag, tag_group, COUNT(*) as count 
      FROM review_tags 
      WHERE review_id IN (SELECT id FROM reviews WHERE book_id = ? AND status = 'approved')
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 30
    `).all(bookId)

    return success({
      avgRating: stats.avg_rating || 0,
      totalCount: stats.total_count || 0,
      ratingDistribution: {
        5: stats.count_5 || 0,
        4: stats.count_4 || 0,
        3: stats.count_3 || 0,
        2: stats.count_2 || 0,
        1: stats.count_1 || 0,
      },
      hotTags: tags,
    })
  }

  createReview(userId, params) {
    const { bookId, orderId, orderItemId, rating, title, content, tags = [] } = params

    if (!rating || rating < 1 || rating > 5) {
      return fail('评分必须在1-5星之间')
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId)
    if (!order) {
      return fail('订单不存在')
    }

    if (order.status !== 'delivered') {
      return fail('订单未完成，无法评价')
    }

    const existing = db.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND order_item_id = ?'
    ).get(userId, orderItemId)
    if (existing) {
      return fail('已评价过该商品')
    }

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO reviews (
          book_id, user_id, order_id, order_item_id, rating, title, content, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
      `).run(bookId, userId, orderId, orderItemId, rating, title || '', content || '', now(), now())

      const reviewId = result.lastInsertRowid

      const uniqueTags = [...new Set(tags.map(t => normalizeTag(t)))]
      const insertTag = db.prepare(`
        INSERT INTO review_tags (review_id, tag, tag_group, created_at)
        VALUES (?, ?, ?, ?)
      `)
      for (const tag of uniqueTags) {
        if (tag) {
          insertTag.run(reviewId, tag, getTagGroup(tag), now())
        }
      }

      this._updateBookRating(bookId)

      return { reviewId }
    })

    try {
      const result = tx()
      return success({ reviewId: result.reviewId }, '评价成功')
    } catch (err) {
      return fail(err.message)
    }
  }

  _updateBookRating(bookId) {
    const result = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE book_id = ? AND status = 'approved'
    `).get(bookId)

    db.prepare(`
      UPDATE books SET rating_avg = ?, rating_count = ? WHERE id = ?
    `).run(result.avg_rating || 0, result.count || 0, bookId)
  }

  voteHelpful(userId, reviewId, voteType = 'helpful') {
    const existing = db.prepare(
      'SELECT * FROM review_votes WHERE review_id = ? AND user_id = ?'
    ).get(reviewId, userId)

    if (existing) {
      if (existing.vote_type === voteType) {
        db.prepare('DELETE FROM review_votes WHERE review_id = ? AND user_id = ?').run(reviewId, userId)
        db.prepare('UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = ?').run(reviewId)
        return success(null, '已取消投票')
      } else {
        db.prepare(`
          UPDATE review_votes SET vote_type = ? WHERE review_id = ? AND user_id = ?
        `).run(voteType, reviewId, userId)
        return success(null, '投票成功')
      }
    }

    db.prepare(`
      INSERT INTO review_votes (review_id, user_id, vote_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run(reviewId, userId, voteType, now())

    if (voteType === 'helpful') {
      db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(reviewId)
    }

    return success(null, '投票成功')
  }

  getUserReviews(userId, params = {}) {
    const { page = 1, pageSize = 10 } = params

    const countSql = 'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?'
    const total = db.prepare(countSql).get(userId).count

    const p = paginate(page, pageSize, total)

    const reviews = db.prepare(`
      SELECT r.*, b.title, b.cover_image, b.author_id, a.name as author_name
      FROM reviews r
      LEFT JOIN books b ON r.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, p.pageSize, p.offset)

    return success({
      list: reviews,
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }

  getAllTags() {
    const tags = db.prepare(`
      SELECT tag, tag_group, COUNT(*) as usage_count
      FROM review_tags
      GROUP BY tag
      ORDER BY usage_count DESC
      LIMIT 50
    `).all()

    return success(tags)
  }
}

module.exports = new ReviewService()
module.exports.normalizeTag = normalizeTag
module.exports.getTagGroup = getTagGroup
