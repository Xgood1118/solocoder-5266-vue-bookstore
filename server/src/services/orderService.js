const db = require('../db/database')
const { success, fail, now, genOrderNo, genPayNo, paginate } = require('../utils/helpers')
const config = require('../config')
const stockService = require('./stockService')
const couponService = require('./couponService')
const memberService = require('./memberService')
const bookService = require('./bookService')

const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
}

class OrderService {
  createOrder(userId, params) {
    const { items, couponId, address, remark } = params

    if (!items || !items.length) {
      return fail('请选择商品')
    }

    const skuIds = items.map(i => i.skuId)
    const skus = bookService.getSkusByIds(skuIds)
    const skuMap = new Map(skus.map(s => [s.id, s]))

    const orderItems = []
    let totalAmount = 0

    for (const item of items) {
      const sku = skuMap.get(item.skuId)
      if (!sku || sku.book_status !== 1) {
        return fail(`商品不存在或已下架`)
      }
      const available = sku.stock - sku.locked_stock
      if (available < item.quantity) {
        return fail(`"${sku.sku_name}"库存不足，可用: ${available}`)
      }
      totalAmount += sku.price_cents * item.quantity
      orderItems.push({
        skuId: sku.id,
        bookId: sku.book_id,
        skuName: sku.sku_name,
        edition: sku.edition,
        priceCents: sku.price_cents,
        quantity: item.quantity,
        coverImage: sku.cover_image,
      })
    }

    let discountAmount = 0
    let usedCouponId = null

    if (couponId) {
      const couponResult = couponService.useCoupon(userId, couponId, totalAmount)
      if (couponResult.code !== 0) {
        return fail(couponResult.message)
      }
      discountAmount = couponResult.data.discountAmount
      usedCouponId = couponId
    }

    const memberDiscount = memberService.calculateDiscount(userId, totalAmount - discountAmount)
    const memberDiscountAmount = memberDiscount.discountAmount

    const payAmount = Math.max(0, totalAmount - discountAmount - memberDiscountAmount)
    const orderNo = genOrderNo()
    const expiresAt = now() + config.order.expireMinutes * 60

    const tx = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (
          order_no, user_id, status, total_amount_cents, discount_amount_cents,
          member_discount_cents, pay_amount_cents, coupon_id, address, remark,
          expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderNo, userId, ORDER_STATUS.PENDING, totalAmount, discountAmount,
        memberDiscountAmount, payAmount, usedCouponId, address || '', remark || '',
        expiresAt, now(), now()
      )

      const orderId = orderResult.lastInsertRowid

      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id, sku_id, book_id, sku_name, edition, price_cents, quantity, cover_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of orderItems) {
        insertItem.run(
          orderId, item.skuId, item.bookId, item.skuName,
          item.edition, item.priceCents, item.quantity, item.coverImage
        )
      }

      const lockResult = stockService.lockStocks(
        orderItems.map(i => ({ skuId: i.skuId, quantity: i.quantity }))
      )
      if (lockResult.code !== 0) {
        throw new Error(lockResult.message)
      }

      if (usedCouponId) {
        couponService.markCouponUsed(userId, usedCouponId, orderId)
      }

      return { orderId, orderNo }
    })

    try {
      const result = tx()
      return success({
        orderId: result.orderId,
        orderNo: result.orderNo,
        payAmount,
        totalAmount,
        discountAmount,
        memberDiscountAmount,
      })
    } catch (err) {
      return fail(err.message)
    }
  }

  getOrderList(userId, params = {}) {
    const { status, page = 1, pageSize = 10 } = params

    const where = ['user_id = ?']
    const values = [userId]

    if (status) {
      where.push('status = ?')
      values.push(status)
    }

    const whereSql = 'WHERE ' + where.join(' AND ')

    const countSql = `SELECT COUNT(*) as count FROM orders ${whereSql}`
    const total = db.prepare(countSql).get(...values).count

    const p = paginate(page, pageSize, total)

    const listSql = `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    const orders = db.prepare(listSql).all(...values, p.pageSize, p.offset)

    const orderIds = orders.map(o => o.id)
    let itemsByOrder = {}
    if (orderIds.length) {
      const placeholders = orderIds.map(() => '?').join(',')
      const allItems = db.prepare(`
        SELECT * FROM order_items WHERE order_id IN (${placeholders})
      `).all(...orderIds)
      itemsByOrder = allItems.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = []
        acc[item.order_id].push(item)
        return acc
      }, {})
    }

    const list = orders.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }))

    return success({
      list,
      total: p.total,
      page: p.page,
      pageSize: p.pageSize,
      totalPages: p.totalPages,
    })
  }

  getOrderDetail(userId, orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId)
    if (!order) {
      return fail('订单不存在')
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)
    return success({ ...order, items })
  }

  getOrderByNo(orderNo) {
    return db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo)
  }

  cancelOrder(userId, orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId)
    if (!order) {
      return fail('订单不存在')
    }
    if (order.status !== ORDER_STATUS.PENDING) {
      return fail('当前订单状态不可取消')
    }

    this._cancelOrderInternal(order)
    return success(null, '订单已取消')
  }

  _cancelOrderInternal(order) {
    const tx = db.transaction(() => {
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
        ORDER_STATUS.CANCELLED, now(), order.id
      )

      const items = db.prepare('SELECT sku_id, quantity FROM order_items WHERE order_id = ?').all(order.id)
      stockService.unlockStocks(items.map(i => ({ skuId: i.sku_id, quantity: i.quantity })))

      if (order.coupon_id) {
        couponService.restoreCoupon(order.coupon_id, order.id)
      }
    })
    tx()
  }

  expireOrders() {
    const nowTime = now()
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE status = ? AND expires_at < ?
    `).all(ORDER_STATUS.PENDING, nowTime)

    let count = 0
    for (const order of orders) {
      try {
        this._cancelOrderInternal(order)
        count++
      } catch (err) {
        console.error(`取消超时订单失败: ${order.order_no}`, err.message)
      }
    }
    return count
  }

  updateOrderStatus(orderId, status, extra = {}) {
    const fields = ['status = ?', 'updated_at = ?']
    const values = [status, now()]

    if (extra.paidAt !== undefined) {
      fields.push('paid_at = ?')
      values.push(extra.paidAt)
    }
    if (extra.shippedAt !== undefined) {
      fields.push('shipped_at = ?')
      values.push(extra.shippedAt)
    }
    if (extra.deliveredAt !== undefined) {
      fields.push('delivered_at = ?')
      values.push(extra.deliveredAt)
    }
    if (extra.refundedAt !== undefined) {
      fields.push('refunded_at = ?')
      values.push(extra.refundedAt)
    }

    values.push(orderId)
    db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  }

  payOrder(orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!order) return fail('订单不存在')
    if (order.status !== ORDER_STATUS.PENDING) return fail('订单状态错误')

    const items = db.prepare('SELECT sku_id as skuId, quantity, book_id as bookId FROM order_items WHERE order_id = ?').all(orderId)
    const deductResult = stockService.deductStocks(items)
    if (deductResult.code !== 0) {
      return fail(deductResult.message)
    }

    for (const item of items) {
      bookService.updateSalesCount(item.bookId, item.quantity)
    }

    memberService.addSpend(order.user_id, order.pay_amount_cents)

    this.updateOrderStatus(orderId, ORDER_STATUS.PAID, { paidAt: now() })

    const payNo = genPayNo()
    db.prepare(`
      INSERT INTO payments (pay_no, order_id, amount_cents, status, paid_at, created_at)
      VALUES (?, ?, ?, 'paid', ?, ?)
    `).run(payNo, orderId, order.pay_amount_cents, now(), now())

    return success({ payNo }, '支付成功')
  }

  shipOrder(orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!order) return fail('订单不存在')
    if (order.status !== ORDER_STATUS.PAID) return fail('订单状态错误')

    this.updateOrderStatus(orderId, ORDER_STATUS.SHIPPED, { shippedAt: now() })
    return success(null, '发货成功')
  }

  confirmReceive(userId, orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId)
    if (!order) return fail('订单不存在')
    if (order.status !== ORDER_STATUS.SHIPPED) return fail('订单状态错误，无法确认收货')

    this.updateOrderStatus(orderId, ORDER_STATUS.DELIVERED, { deliveredAt: now() })
    return success(null, '确认收货成功')
  }

  applyRefund(userId, orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId)
    if (!order) return fail('订单不存在')
    if (![ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED].includes(order.status)) {
      return fail('当前状态不可退款')
    }

    const items = db.prepare('SELECT sku_id, quantity, book_id FROM order_items WHERE order_id = ?').all(orderId)
    stockService.unlockStocks(items.map(i => ({ skuId: i.sku_id, quantity: i.quantity })))

    for (const item of items) {
      bookService.updateSalesCount(item.book_id, -item.quantity)
    }

    memberService.addSpend(order.user_id, -order.pay_amount_cents)

    if (order.coupon_id) {
      couponService.restoreCoupon(order.coupon_id, orderId)
    }

    this.updateOrderStatus(orderId, ORDER_STATUS.REFUNDED, { refundedAt: now() })
    return success(null, '退款成功')
  }

  canReview(order) {
    if (order.status !== ORDER_STATUS.DELIVERED) return false
    const reviewWindow = 30 * 24 * 3600
    const deliveredAt = order.delivered_at || 0
    return now() - deliveredAt < reviewWindow
  }
}

module.exports = { OrderService: new OrderService(), ORDER_STATUS }
