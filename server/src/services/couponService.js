const db = require('../db/database')
const { success, fail, now } = require('../utils/helpers')
const config = require('../config')

const COUPON_TYPES = {
  SINGLE: 'single',
  AMOUNT_OFF: 'amount_off',
  PERCENT_OFF: 'percent_off',
}

class CouponService {
  getCouponList(params = {}) {
    const { status, page = 1, pageSize = 20 } = params

    const where = []
    const values = []

    where.push('status = ?')
    values.push(status !== undefined ? status : 1)

    const whereSql = 'WHERE ' + where.join(' AND ')

    const countSql = `SELECT COUNT(*) as count FROM coupons ${whereSql}`
    const total = db.prepare(countSql).get(...values).count

    const offset = (page - 1) * pageSize

    const list = db.prepare(`
      SELECT * FROM coupons
      ${whereSql}
      AND (start_at IS NULL OR start_at <= ?)
      AND (end_at IS NULL OR end_at > ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...values, now(), now(), pageSize, offset)

    return success({
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  }

  getCouponByCode(code) {
    return db.prepare('SELECT * FROM coupons WHERE code = ?').get(code)
  }

  getUserCoupons(userId, status = 'unused') {
    const list = db.prepare(`
      SELECT uc.id as user_coupon_id, uc.coupon_id, uc.status, uc.used_order_id, uc.used_at, uc.created_at,
             c.code, c.name, c.type, c.value, c.min_amount_cents, c.book_id, c.start_at, c.end_at
      FROM user_coupons uc
      LEFT JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ? AND uc.status = ?
      ORDER BY uc.created_at DESC
    `).all(userId, status)

    return success(list.map(c => ({
      ...c,
      isExpired: c.end_at && c.end_at < now(),
    })))
  }

  receiveCoupon(userId, couponId) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId)
    if (!coupon) {
      return fail('优惠码不存在')
    }
    if (coupon.status !== 1) {
      return fail('优惠码已失效')
    }
    if (coupon.end_at && coupon.end_at < now()) {
      return fail('优惠码已过期')
    }
    if (coupon.total_count > 0 && coupon.used_count >= coupon.total_count) {
      return fail('优惠码已领完')
    }

    const already = db.prepare(
      'SELECT id FROM user_coupons WHERE user_id = ? AND coupon_id = ?'
    ).get(userId, couponId)
    if (already) {
      return fail('已领取过该优惠码')
    }

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO user_coupons (user_id, coupon_id, status, created_at)
        VALUES (?, ?, 'unused', ?)
      `).run(userId, couponId, now())

      db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(couponId)
    })

    tx()
    return success(null, '领取成功')
  }

  calculateDiscount(coupon, amount, bookId = null) {
    if (!coupon) return { valid: false, discount: 0, message: '优惠码不存在' }
    if (coupon.status !== 1) return { valid: false, discount: 0, message: '优惠码不可用' }
    if (coupon.end_at && coupon.end_at < now()) return { valid: false, discount: 0, message: '优惠码已过期' }
    if (amount < coupon.min_amount_cents) {
      return { valid: false, discount: 0, message: `满${(coupon.min_amount_cents / 100).toFixed(2)}元可用` }
    }

    if (coupon.type === COUPON_TYPES.SINGLE && bookId && coupon.book_id && coupon.book_id !== bookId) {
      return { valid: false, discount: 0, message: '该优惠码仅限指定书籍使用' }
    }

    let discount = 0
    if (coupon.type === COUPON_TYPES.SINGLE || coupon.type === COUPON_TYPES.AMOUNT_OFF) {
      discount = coupon.value
    } else if (coupon.type === COUPON_TYPES.PERCENT_OFF) {
      discount = Math.floor(amount * (100 - coupon.value) / 100)
    }

    discount = Math.min(discount, amount)
    return { valid: true, discount, coupon }
  }

  useCoupon(userId, couponId, amount) {
    const userCoupon = db.prepare(
      'SELECT * FROM user_coupons WHERE user_id = ? AND coupon_id = ? AND status = ?'
    ).get(userId, couponId, 'unused')

    if (!userCoupon) {
      return fail('优惠码不可用或已使用')
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId)
    const result = this.calculateDiscount(coupon, amount)
    if (!result.valid) {
      return fail(result.message)
    }

    return success({
      discountAmount: result.discount,
      coupon,
    })
  }

  markCouponUsed(userId, couponId, orderId) {
    db.prepare(`
      UPDATE user_coupons SET status = 'used', used_order_id = ?, used_at = ?
      WHERE user_id = ? AND coupon_id = ?
    `).run(orderId, now(), userId, couponId)

    db.prepare(`
      INSERT INTO coupon_usage_log (user_id, coupon_id, used_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, couponId, now(), now())
  }

  restoreCoupon(couponId, orderId) {
    db.prepare(`
      UPDATE user_coupons SET status = 'unused', used_order_id = NULL, used_at = NULL
      WHERE coupon_id = ? AND used_order_id = ?
    `).run(couponId, orderId)
  }

  getAvailableCoupons(userId, amount) {
    const userCoupons = db.prepare(`
      SELECT uc.id as user_coupon_id, uc.coupon_id, c.*
      FROM user_coupons uc
      LEFT JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ? AND uc.status = 'unused'
        AND (c.end_at IS NULL OR c.end_at > ?)
        AND c.status = 1
    `).all(userId, now())

    const list = userCoupons.map(uc => {
      const result = this.calculateDiscount(uc, amount)
      return {
        ...uc,
        available: result.valid,
        discountAmount: result.discount,
        unavailableReason: result.message,
      }
    })

    list.sort((a, b) => b.discountAmount - a.discountAmount)
    return success(list)
  }

  checkRateLimit(userId) {
    const windowStart = now() - config.coupon.rateLimitWindow
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM coupon_usage_log
      WHERE user_id = ? AND used_at >= ?
    `).get(userId, windowStart).count

    return count < config.coupon.maxUsesPerWindow
  }
}

module.exports = new CouponService()
module.exports.COUPON_TYPES = COUPON_TYPES
