const db = require('../db/database')
const { success, fail, now } = require('../utils/helpers')

class StockService {
  lockStock(skuId, quantity) {
    const result = db.prepare(`
      UPDATE book_skus
      SET locked_stock = locked_stock + ?, updated_at = ?
      WHERE id = ? AND (stock - locked_stock) >= ?
    `).run(quantity, now(), skuId, quantity)

    return result.changes > 0
  }

  lockStocks(items) {
    const tx = db.transaction((items) => {
      for (const item of items) {
        const result = db.prepare(`
          UPDATE book_skus
          SET locked_stock = locked_stock + ?, updated_at = ?
          WHERE id = ? AND (stock - locked_stock) >= ?
        `).run(item.quantity, now(), item.skuId, item.quantity)

        if (result.changes === 0) {
          const sku = db.prepare('SELECT sku_name, stock, locked_stock FROM book_skus WHERE id = ?').get(item.skuId)
          const available = sku ? sku.stock - sku.locked_stock : 0
          throw new Error(`"${sku?.sku_name || item.skuId}"库存不足，可用: ${available}`)
        }
      }
    })

    try {
      tx(items)
      return success(null, '库存锁定成功')
    } catch (err) {
      return fail(err.message)
    }
  }

  unlockStock(skuId, quantity) {
    db.prepare(`
      UPDATE book_skus
      SET locked_stock = MAX(0, locked_stock - ?), updated_at = ?
      WHERE id = ?
    `).run(quantity, now(), skuId)
  }

  unlockStocks(items) {
    const tx = db.transaction((items) => {
      for (const item of items) {
        db.prepare(`
          UPDATE book_skus
          SET locked_stock = MAX(0, locked_stock - ?), updated_at = ?
          WHERE id = ?
        `).run(item.quantity, now(), item.skuId)
      }
    })
    tx(items)
  }

  deductStock(skuId, quantity) {
    const result = db.prepare(`
      UPDATE book_skus
      SET stock = stock - ?,
          locked_stock = locked_stock - ?,
          updated_at = ?
      WHERE id = ? AND stock >= ? AND locked_stock >= ?
    `).run(quantity, quantity, now(), skuId, quantity, quantity)

    if (result.changes === 0) {
      return fail('库存扣减失败，可能超卖')
    }
    return success(null, '库存扣减成功')
  }

  deductStocks(items) {
    const tx = db.transaction((items) => {
      for (const item of items) {
        const result = db.prepare(`
          UPDATE book_skus
          SET stock = stock - ?,
              locked_stock = locked_stock - ?,
              updated_at = ?
          WHERE id = ? AND stock >= ? AND locked_stock >= ?
        `).run(item.quantity, item.quantity, now(), item.skuId, item.quantity, item.quantity)

        if (result.changes === 0) {
          const sku = db.prepare('SELECT sku_name, stock, locked_stock FROM book_skus WHERE id = ?').get(item.skuId)
          throw new Error(`"${sku?.sku_name || item.skuId}"库存扣减失败`)
        }
      }
    })

    try {
      tx(items)
      return success(null, '库存扣减成功')
    } catch (err) {
      return fail(err.message)
    }
  }

  restoreStock(skuId, quantity) {
    db.prepare(`
      UPDATE book_skus
      SET stock = stock + ?, updated_at = ?
      WHERE id = ?
    `).run(quantity, now(), skuId)
  }

  getStockInfo(skuId) {
    const sku = db.prepare(`
      SELECT id, sku_name, edition, stock, locked_stock, 
             (stock - locked_stock) as available_stock
      FROM book_skus WHERE id = ?
    `).get(skuId)
    return sku
  }

  getStockList(bookId) {
    return db.prepare(`
      SELECT id, sku_name, edition, price_cents, stock, locked_stock,
             (stock - locked_stock) as available_stock
      FROM book_skus WHERE book_id = ?
    `).all(bookId)
  }
}

module.exports = new StockService()
