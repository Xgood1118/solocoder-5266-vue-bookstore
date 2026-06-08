const db = require('../db/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { success, fail, now } = require('../utils/helpers')
const config = require('../config')

class UserService {
  register(params) {
    const { username, email, password, nickname } = params

    if (!username || !email || !password) {
      return fail('请填写完整信息')
    }

    if (password.length < 6) {
      return fail('密码至少6位')
    }

    const existingUser = db.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).get(username, email)

    if (existingUser) {
      return fail('用户名或邮箱已存在')
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const result = db.prepare(`
      INSERT INTO users (
        username, email, password_hash, nickname, 
        member_level, total_spend_cents, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'silver', 0, ?, ?)
    `).run(username, email, passwordHash, nickname || username, now(), now())

    const userId = result.lastInsertRowid
    const tokens = this._generateTokens(userId)

    return success({
      userId,
      username,
      email,
      nickname: nickname || username,
      ...tokens,
    }, '注册成功')
  }

  login(params) {
    const { username, password } = params

    if (!username || !password) {
      return fail('请输入用户名和密码')
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, username)

    if (!user) {
      return fail('用户不存在')
    }

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) {
      return fail('密码错误')
    }

    const tokens = this._generateTokens(user.id)

    return success({
      userId: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      memberLevel: user.member_level,
      totalSpend: user.total_spend_cents,
      ...tokens,
    }, '登录成功')
  }

  _generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    const refreshToken = uuidv4()
    const refreshExpiresAt = now() + 30 * 24 * 3600

    db.prepare(`
      INSERT INTO refresh_tokens (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(refreshToken, userId, refreshExpiresAt, now())

    return {
      accessToken,
      refreshToken,
    }
  }

  refreshToken(refreshToken) {
    const token = db.prepare(
      'SELECT * FROM refresh_tokens WHERE token = ?'
    ).get(refreshToken)

    if (!token) {
      return fail('Refresh Token 无效')
    }

    if (token.expires_at < now()) {
      db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken)
      return fail('Refresh Token 已过期')
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(token.user_id)
    if (!user) {
      return fail('用户不存在')
    }

    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken)

    const tokens = this._generateTokens(user.id)

    return success({
      userId: user.id,
      ...tokens,
    })
  }

  logout(refreshToken) {
    if (refreshToken) {
      db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken)
    }
    return success(null, '登出成功')
  }

  getProfile(userId) {
    const user = db.prepare(`
      SELECT id, username, email, nickname, avatar, 
             member_level, total_spend_cents, created_at, updated_at
      FROM users WHERE id = ?
    `).get(userId)

    if (!user) {
      return fail('用户不存在')
    }

    return success(user)
  }

  updateProfile(userId, params) {
    const { nickname, avatar } = params

    const fields = []
    const values = []

    if (nickname !== undefined) {
      fields.push('nickname = ?')
      values.push(nickname)
    }

    if (avatar !== undefined) {
      fields.push('avatar = ?')
      values.push(avatar)
    }

    if (fields.length === 0) {
      return fail('没有需要更新的内容')
    }

    fields.push('updated_at = ?')
    values.push(now(), userId)

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    return success(null, '更新成功')
  }

  changePassword(userId, params) {
    const { oldPassword, newPassword } = params

    if (!oldPassword || !newPassword) {
      return fail('请输入原密码和新密码')
    }

    if (newPassword.length < 6) {
      return fail('新密码至少6位')
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!user) {
      return fail('用户不存在')
    }

    const valid = bcrypt.compareSync(oldPassword, user.password_hash)
    if (!valid) {
      return fail('原密码错误')
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10)
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(newPasswordHash, now(), userId)

    return success(null, '密码修改成功')
  }

  getOrderCount(userId) {
    const result = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders
      FROM orders WHERE user_id = ?
    `).get(userId)

    return success(result)
  }
}

module.exports = new UserService()
