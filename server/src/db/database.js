const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')
const config = require('../config')

let db = null
let SQL = null
let saveTimeout = null

function getDataDir() {
  const dir = path.join(__dirname, '..', '..', 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

async function init() {
  if (db) return db

  SQL = await initSqlJs()

  const dataDir = getDataDir()
  const dbPath = path.join(dataDir, 'bookstore.db')

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  try {
    db.run('PRAGMA journal_mode = WAL')
    db.run('PRAGMA foreign_keys = ON')
  } catch (e) {
    // sql.js may not support all pragmas
  }

  return db
}

function save() {
  if (!db) return
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    try {
      const dataDir = getDataDir()
      const dbPath = path.join(dataDir, 'bookstore.db')
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(dbPath, buffer)
    } catch (err) {
      console.error('保存数据库失败:', err)
    }
    saveTimeout = null
  }, 100)
}

function saveSync() {
  if (!db) return
  try {
    const dataDir = getDataDir()
    const dbPath = path.join(dataDir, 'bookstore.db')
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  } catch (err) {
    console.error('保存数据库失败:', err)
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

function exec(sql, params = []) {
  const results = []
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function get(sql, params = []) {
  const results = exec(sql, params)
  return results[0] || null
}

function all(sql, params = []) {
  return exec(sql, params)
}

function run(sql, params = []) {
  db.run(sql, params)
  const changes = db.getRowsModified()
  const lastId = exec('SELECT last_insert_rowid() as id')[0].id
  save()
  return { changes, lastInsertRowid: lastId }
}

function prepare(sql) {
  const stmt = db.prepare(sql)

  return {
    run(...params) {
      stmt.reset()
      if (params.length > 0) {
        stmt.bind(params)
      }
      while (stmt.step()) {}
      const changes = db.getRowsModified()
      const lastId = exec('SELECT last_insert_rowid() as id')[0].id
      save()
      return { changes, lastInsertRowid: lastId }
    },
    get(...params) {
      stmt.reset()
      if (params.length > 0) {
        stmt.bind(params)
      }
      if (stmt.step()) {
        return stmt.getAsObject()
      }
      return null
    },
    all(...params) {
      stmt.reset()
      if (params.length > 0) {
        stmt.bind(params)
      }
      const results = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      return results
    },
    free() {
      stmt.free()
    },
  }
}

function transaction(fn) {
  return function (...args) {
    db.run('BEGIN TRANSACTION')
    try {
      const result = fn(...args)
      db.run('COMMIT')
      saveSync()
      return result
    } catch (err) {
      db.run('ROLLBACK')
      throw err
    }
  }
}

module.exports = {
  init,
  save,
  saveSync,
  getDb,
  exec,
  get,
  all,
  run,
  prepare,
  transaction,
}
