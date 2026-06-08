const db = require('../db/database')
const { success, fail, now } = require('../utils/helpers')
const stockService = require('./stockService')
const bookService = require('./bookService')

class CartService {
  getCart(userId) {
    const items = db.prepare(`
      SELECT ci.id, ci.sku_id, ci.quantity, ci.created_at, ci.updated_at,
             bs.sku_name, bs.edition, bs.price_cents, bs.book_id,
             b.title, b.cover_image, b.author_id, a.name as author_name
      FROM cart_items ci
      LEFT JOIN book_skus bs ON ci.sku_id = bs.id
      LEFT JOIN books b ON bs.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).all(userId)

    const list = items.map(item => {
      const stockInfo = stockService.getStockInfo(item.sku_id)
      return {
        ...item,
        stock: stockInfo ? stockInfo.stock : 0,
        available: stockInfo ? stockInfo.available_stock : 0,
        subtotal: item.price_cents * item.quantity,
      }
    })

    const totalCount = list.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = list.reduce((sum, item) => sum + item.subtotal, 0)

    return success({
      list,
      totalCount,
      totalAmount,
    })
  }

  addToCart(userId, skuId, quantity = 1) {
    const sku = bookService.getSkuById(skuId)
    if (!sku) {
      return fail('商品不存在')
    }
    if (sku.book_status !== 1) {
      return fail('商品已下架')
    }

    const stockInfo = stockService.getStockInfo(skuId)
    if (!stockInfo || stockInfo.available_stock < quantity) {
      return fail('库存不足')
    }

    const existing = db.prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND sku_id = ?'
    ).get(userId, skuId)

    if (existing) {
      const newQty = existing.quantity + quantity
      if (newQty > stockInfo.available_stock) {
        return fail('库存不足')
      }
      db.prepare(`
        UPDATE cart_items SET quantity = ?, updated_at = ?
        WHERE user_id = ? AND sku_id = ?
      `).run(newQty, now(), userId, skuId)
    } else {
      db.prepare(`
        INSERT INTO cart_items (user_id, sku_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, skuId, quantity, now(), now())
    }

    return success(null, '已加入购物车')
  }

  updateCartItem(userId, skuId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(userId, skuId)
    }

    const item = db.prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND sku_id = ?'
    ).get(userId, skuId)

    if (!item) {
      return fail('购物车中无此商品')
    }

    const stockInfo = stockService.getStockInfo(skuId)
    if (!stockInfo || stockInfo.available_stock < quantity) {
      return fail('库存不足')
    }

    db.prepare(`
      UPDATE cart_items SET quantity = ?, updated_at = ?
      WHERE user_id = ? AND sku_id = ?
    `).run(quantity, now(), userId, skuId)

    return success(null, '更新成功')
  }

  removeFromCart(userId, skuId) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND sku_id = ?').run(userId, skuId)
    return success(null, '已移除')
  }

  clearCart(userId) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId)
    return success(null, '购物车已清空')
  }

  clearCartItems(userId, skuIds) {
    if (!skuIds || !skuIds.length) return
    const placeholders = skuIds.map(() => '?').join(',')
    db.prepare(`
      DELETE FROM cart_items 
      WHERE user_id = ? AND sku_id IN (${placeholders})
    `).run(userId, ...skuIds)
  }
}

module.exports = new CartService()
