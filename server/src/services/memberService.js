const db = require('../db/database')
const { success, fail } = require('../utils/helpers')
const config = require('../config')

class MemberService {
  getLevelInfo(level) {
    const levels = config.member.levels
    return levels.find(l => l.level === level) || levels[0]
  }

  calculateLevel(totalSpend) {
    const levels = config.member.levels
    let currentLevel = levels[0]
    for (const level of levels) {
      if (totalSpend >= level.minSpend) {
        currentLevel = level
      }
    }
    return currentLevel
  }

  calculateDiscount(userId, amount) {
    const user = db.prepare('SELECT member_level FROM users WHERE id = ?').get(userId)
    if (!user) {
      return { discount: 0, discountAmount: 0, level: null }
    }

    const levelInfo = this.getLevelInfo(user.member_level)
    const discountAmount = Math.floor(amount * (1 - levelInfo.discount))
    return {
      level: levelInfo.level,
      levelName: levelInfo.name,
      discount: levelInfo.discount,
      discountAmount,
    }
  }

  addSpend(userId, amount) {
    const user = db.prepare('SELECT total_spend_cents, member_level FROM users WHERE id = ?').get(userId)
    if (!user) return

    const newTotal = Math.max(0, user.total_spend_cents + amount)
    const newLevel = this.calculateLevel(newTotal)

    db.prepare(`
      UPDATE users 
      SET total_spend_cents = ?, member_level = ?, updated_at = ?
      WHERE id = ?
    `).run(newTotal, newLevel.level, Math.floor(Date.now() / 1000), userId)

    return {
      totalSpend: newTotal,
      level: newLevel.level,
      levelName: newLevel.name,
      levelUp: newLevel.level !== user.member_level,
    }
  }

  getMemberInfo(userId) {
    const user = db.prepare(
      'SELECT member_level, total_spend_cents FROM users WHERE id = ?'
    ).get(userId)

    if (!user) {
      return fail('用户不存在')
    }

    const currentLevel = this.getLevelInfo(user.member_level)
    const levels = config.member.levels
    const currentIndex = levels.findIndex(l => l.level === user.member_level)
    const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null

    let progress = 100
    let nextLevelSpend = 0
    if (nextLevel) {
      const levelProgress = user.total_spend_cents - currentLevel.minSpend
      const levelRange = nextLevel.minSpend - currentLevel.minSpend
      progress = levelRange > 0 ? Math.min(100, Math.floor((levelProgress / levelRange) * 100)) : 0
      nextLevelSpend = nextLevel.minSpend - user.total_spend_cents
    }

    return success({
      level: currentLevel.level,
      levelName: currentLevel.name,
      discount: currentLevel.discount,
      totalSpend: user.total_spend_cents,
      nextLevel: nextLevel ? {
        level: nextLevel.level,
        name: nextLevel.name,
        discount: nextLevel.discount,
      } : null,
      progress,
      nextLevelSpend: Math.max(0, nextLevelSpend),
      levels,
    })
  }

  getAllLevels() {
    return success(config.member.levels)
  }
}

module.exports = new MemberService()
