const db = require('./database')
const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    member_level TEXT NOT NULL DEFAULT 'silver',
    total_spend_cents INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    birth_date TEXT,
    nationality TEXT,
    works_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    sort INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    isbn TEXT UNIQUE,
    author_id INTEGER,
    publisher TEXT,
    publish_date TEXT,
    pages INTEGER,
    category_id INTEGER,
    description TEXT,
    cover_image TEXT,
    pdf_path TEXT,
    pdf_pages INTEGER,
    trial_pages INTEGER,
    price_cents INTEGER NOT NULL DEFAULT 0,
    rating_avg REAL NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 1,
    sort INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS book_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS book_skus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    sku_name TEXT NOT NULL,
    edition TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    locked_stock INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS book_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter_title TEXT NOT NULL,
    page_num INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    order_item_id INTEGER,
    rating INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS review_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    tag_group TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS review_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vote_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(review_id, user_id)
  )`,

  `CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sku_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, sku_id)
  )`,

  `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, book_id)
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount_cents INTEGER NOT NULL,
    discount_amount_cents INTEGER NOT NULL DEFAULT 0,
    member_discount_cents INTEGER NOT NULL DEFAULT 0,
    pay_amount_cents INTEGER NOT NULL,
    coupon_id INTEGER,
    address TEXT,
    remark TEXT,
    expires_at INTEGER NOT NULL,
    paid_at INTEGER,
    shipped_at INTEGER,
    delivered_at INTEGER,
    refunded_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    sku_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    sku_name TEXT NOT NULL,
    edition TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    cover_image TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pay_no TEXT UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at INTEGER,
    callback_data TEXT,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value INTEGER NOT NULL,
    min_amount_cents INTEGER NOT NULL DEFAULT 0,
    book_id INTEGER,
    total_count INTEGER NOT NULL DEFAULT 0,
    used_count INTEGER NOT NULL DEFAULT 0,
    start_at INTEGER,
    end_at INTEGER,
    status INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'unused',
    used_order_id INTEGER,
    used_at INTEGER,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS coupon_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    used_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS reading_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hashed_user_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    last_page INTEGER NOT NULL DEFAULT 1,
    read_percent INTEGER NOT NULL DEFAULT 0,
    last_read_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(hashed_user_id, book_id)
  )`,

  `CREATE TABLE IF NOT EXISTS ranking_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ranking_type TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    period TEXT,
    stat_date TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(ranking_type, stat_date, book_id)
  )`,

  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)`,
  `CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id)`,
  `CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)`,
  `CREATE INDEX IF NOT EXISTS idx_books_skus_book ON book_skus(book_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(hashed_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reading_history_book ON reading_history(book_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ranking_type ON ranking_books(ranking_type, stat_date)`,
  `CREATE INDEX IF NOT EXISTS idx_book_tags_tag ON book_tags(tag)`,
  `CREATE INDEX IF NOT EXISTS idx_review_tags_tag ON review_tags(tag, tag_group)`,
]

async function runMigrations() {
  console.log('开始执行数据库迁移...')

  await db.init()

  for (const sql of migrations) {
    try {
      db.exec(sql)
    } catch (err) {
      console.error('迁移失败:', err.message)
      console.error('SQL:', sql)
      throw err
    }
  }

  console.log('数据库迁移完成!')
}

if (require.main === module) {
  runMigrations().catch(err => {
    console.error('迁移失败:', err)
    process.exit(1)
  })
}

module.exports = runMigrations
