const db = require('./database')
const bcrypt = require('bcryptjs')
const { now } = require('../utils/helpers')

const AUTHORS = [
  { name: '余华', bio: '中国当代著名作家，北京师范大学教授。代表作《活着》《许三观卖血记》等。', nationality: '中国', birth_date: '1960-04-3' },
  { name: '刘慈欣', bio: '中国科幻小说代表作家，中国作家协会会员。代表作《三体》系列。', nationality: '中国', birth_date: '1963-06-23' },
  { name: '村上春树', bio: '日本当代作家，作品风格独特，深受读者喜爱。代表作《挪威的森林》等。', nationality: '日本', birth_date: '1949-01-12' },
  { name: '东野圭吾', bio: '日本推理小说作家，代表作《白夜行》《嫌疑人X的献身》等。', nationality: '日本', birth_date: '1958-02-04' },
  { name: '加西亚·马尔克斯', bio: '哥伦比亚作家，魔幻现实主义文学代表人物。代表作《百年孤独》。', nationality: '哥伦比亚', birth_date: '1927-03-06' },
  { name: '乔治·奥威尔', bio: '英国作家、记者，以政治寓言小说闻名。代表作《1984》《动物农场》。', nationality: '英国', birth_date: '1903-06-25' },
  { name: '钱钟书', bio: '中国现代作家、文学研究家。代表作《围城》。', nationality: '中国', birth_date: '1910-11-21' },
  { name: '张爱玲', bio: '中国现代作家，作品以细腻笔触描绘都市男女情感著称。', nationality: '中国', birth_date: '1920-09-30' },
  { name: '海明威', bio: '美国作家，"新闻体"小说创始人。代表作《老人与海》。', nationality: '美国', birth_date: '1899-07-21' },
  { name: '卡夫卡', bio: '奥地利小说家，西方现代主义文学的先驱。代表作《变形记》。', nationality: '奥地利', birth_date: '1883-07-03' },
]

const CATEGORIES = [
  { name: '小说', parent_id: 0, sort: 1 },
  { name: '科幻', parent_id: 1, sort: 1 },
  { name: '推理', parent_id: 1, sort: 2 },
  { name: '文学', parent_id: 0, sort: 2 },
  { name: '历史', parent_id: 0, sort: 3 },
  { name: '科技', parent_id: 0, sort: 4 },
  { name: '哲学', parent_id: 0, sort: 5 },
  { name: '经济', parent_id: 0, sort: 6 },
]

const BOOKS = [
  { title: '活着', subtitle: '', isbn: '9787506365437', author_idx: 0, category_idx: 0, price: 3900, description: '《活着》是余华的代表作之一，讲述了农村人福贵悲惨的人生遭遇。', pages: 191, publish_date: '2012-08-01', publisher: '作家出版社', tags: ['经典必读', '感动', '文笔好'], chapters: 12 },
  { title: '许三观卖血记', subtitle: '', isbn: '9787506365444', author_idx: 0, category_idx: 0, price: 3500, description: '讲述了许三观靠着卖血渡过了人生的一个个难关的故事。', pages: 258, publish_date: '2011-02-01', publisher: '作家出版社', tags: ['经典必读', '感动', '文笔好'], chapters: 15 },
  { title: '三体', subtitle: '地球往事三部曲之一', isbn: '9787536692930', author_idx: 1, category_idx: 1, price: 2300, description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。', pages: 302, publish_date: '2008-01-01', publisher: '重庆出版社', tags: ['悬疑烧脑', '经典必读', '推荐阅读'], chapters: 30 },
  { title: '三体Ⅱ：黑暗森林', subtitle: '', isbn: '9787536693968', author_idx: 1, category_idx: 1, price: 3200, description: '三体人在利用魔法般的科技锁死了地球人的科学之后，庞大的宇宙舰队直扑太阳系。', pages: 470, publish_date: '2008-05-01', publisher: '重庆出版社', tags: ['悬疑烧脑', '情节紧凑', '反转多'], chapters: 25 },
  { title: '三体Ⅲ：死神永生', subtitle: '', isbn: '9787229030933', author_idx: 1, category_idx: 1, price: 3800, description: '与三体文明的战争使人类第一次看到了宇宙黑暗的真相。', pages: 513, publish_date: '2010-11-01', publisher: '重庆出版社', tags: ['悬疑烧脑', '强烈推荐', '经典必读'], chapters: 30 },
  { title: '挪威的森林', subtitle: '', isbn: '9787532742929', author_idx: 2, category_idx: 0, price: 2800, description: '这是一部动人心弦的、平缓舒雅的、略带感伤的恋爱小说。', pages: 384, publish_date: '2007-07-01', publisher: '上海译文出版社', tags: ['治愈系', '文笔好', '温暖治愈'], chapters: 12 },
  { title: '海边的卡夫卡', subtitle: '', isbn: '9787532751778', author_idx: 2, category_idx: 0, price: 3100, description: '主要讲述了主人公田村卡夫卡的成长故事。', pages: 267, publish_date: '2010-10-01', publisher: '上海译文出版社', tags: ['治愈系', '温暖治愈', '文笔好'], chapters: 20 },
  { title: '白夜行', subtitle: '', isbn: '9787544258609', author_idx: 3, category_idx: 2, price: 3950, description: '1973年，大阪的一栋废弃建筑中发现一名遭利器刺死的男子。', pages: 352, publish_date: '2013-01-01', publisher: '南海出版公司', tags: ['悬疑烧脑', '情节紧凑', '反转多'], chapters: 13 },
  { title: '嫌疑人X的献身', subtitle: '', isbn: '9787544245555', author_idx: 3, category_idx: 2, price: 2500, description: '这是一部推理小说，讲述了一个数学天才为了帮助一对母女隐藏杀害前夫的罪行的故事。', pages: 251, publish_date: '2010-01-01', publisher: '南海出版公司', tags: ['悬疑烧脑', '强烈推荐', '经典必读'], chapters: 15 },
  { title: '百年孤独', subtitle: '', isbn: '9787544253994', author_idx: 4, category_idx: 0, price: 5500, description: '《百年孤独》是魔幻现实主义文学的代表作。', pages: 360, publish_date: '2011-06-01', publisher: '南海出版公司', tags: ['经典必读', '文笔好', '名著'], chapters: 20 },
  { title: '1984', subtitle: '', isbn: '9787540415433', author_idx: 5, category_idx: 3, price: 3600, description: '《1984》是一部杰出的政治寓言小说，也是一部幻想小说。', pages: 307, publish_date: '2010-01-01', publisher: '湖南文艺出版社', tags: ['经典必读', '名著', '反乌托邦'], chapters: 3 },
  { title: '动物农场', subtitle: '', isbn: '9787540415434', author_idx: 5, category_idx: 3, price: 2400, description: '《动物农场》是一则入骨三分的反乌托邦的政治讽喻寓言。', pages: 118, publish_date: '2010-01-01', publisher: '湖南文艺出版社', tags: ['经典必读', '名著', '讽刺'], chapters: 10 },
  { title: '围城', subtitle: '', isbn: '9787020024759', author_idx: 6, category_idx: 0, price: 3200, description: '《围城》是钱钟书所著的长篇小说。', pages: 359, publish_date: '1991-02-01', publisher: '人民文学出版社', tags: ['经典必读', '文笔好', '讽刺'], chapters: 9 },
  { title: '倾城之恋', subtitle: '', isbn: '9787530211122', author_idx: 7, category_idx: 0, price: 2980, description: '《倾城之恋》是张爱玲最脍炙人口的短篇小说之一。', pages: 287, publish_date: '2012-08-01', publisher: '北京十月文艺出版社', tags: ['爱情', '文笔好', '经典必读'], chapters: 10 },
  { title: '老人与海', subtitle: '', isbn: '9787544726838', author_idx: 8, category_idx: 3, price: 1900, description: '《老人与海》是海明威最具代表性的作品之一。', pages: 180, publish_date: '2012-05-01', publisher: '译林出版社', tags: ['经典必读', '励志', '名著'], chapters: 5 },
  { title: '变形记', subtitle: '', isbn: '9787532751525', author_idx: 9, category_idx: 3, price: 1800, description: '《变形记》是奥地利作家卡夫卡最有特色的短篇小说之一。', pages: 128, publish_date: '2011-03-01', publisher: '上海译文出版社', tags: ['经典必读', '荒诞', '名著'], chapters: 3 },
  { title: '平凡的世界', subtitle: '', isbn: '9787530212004', author_idx: 0, category_idx: 0, price: 12800, description: '这是一部全景式地表现中国当代城乡社会生活的长篇小说。', pages: 1633, publish_date: '2012-03-01', publisher: '北京十月文艺出版社', tags: ['经典必读', '感动', '文笔好'], chapters: 50 },
  { title: '解忧杂货店', subtitle: '', isbn: '9787544270878', author_idx: 3, category_idx: 2, price: 3950, description: '现代人内心流失的东西，这家杂货店能帮你找回。', pages: 291, publish_date: '2014-05-01', publisher: '南海出版公司', tags: ['治愈系', '温暖治愈', '推荐阅读'], chapters: 5 },
  { title: '明朝那些事儿', subtitle: '第一部', isbn: '9787213046439', author_idx: 0, category_idx: 4, price: 3580, description: '《明朝那些事儿》主要讲述的是从1344年到1644年这三百年间关于明朝的一些事情。', pages: 280, publish_date: '2011-05-01', publisher: '浙江人民出版社', tags: ['历史', '干货满满', '推荐阅读'], chapters: 10 },
  { title: '人类简史', subtitle: '从动物到上帝', isbn: '9787508647357', author_idx: 4, category_idx: 4, price: 6800, description: '十万年前，地球上至少有六种不同的人，但今日，世界舞台为什么只剩下了我们自己？', pages: 440, publish_date: '2014-11-01', publisher: '中信出版社', tags: ['历史', '人类', '干货满满'], chapters: 20 },
]

const COUPONS = [
  { code: 'NEW10', name: '新人专享券', type: 'amount_off', value: 1000, min_amount_cents: 5000, total_count: 1000 },
  { code: 'SAVE20', name: '满减优惠', type: 'amount_off', value: 2000, min_amount_cents: 10000, total_count: 500 },
  { code: 'VIP15', name: '会员85折', type: 'percent_off', value: 15, min_amount_cents: 0, total_count: 1000 },
  { code: 'BOOK5', name: '单本立减', type: 'single', value: 500, min_amount_cents: 0, total_count: 1000, book_idx: 0 },
  { code: 'FLASH50', name: '限时半价', type: 'percent_off', value: 50, min_amount_cents: 0, total_count: 100 },
]

const TAG_GROUPS = {
  '经典必读': '地位',
  '感动': '情感',
  '文笔好': '文笔',
  '悬疑烧脑': '风格',
  '推荐阅读': '推荐度',
  '情节紧凑': '情节',
  '反转多': '情节',
  '治愈系': '风格',
  '温暖治愈': '风格',
  '强烈推荐': '推荐度',
  '名著': '地位',
  '反乌托邦': '风格',
  '讽刺': '风格',
  '爱情': '情感',
  '励志': '情感',
  '荒诞': '风格',
  '历史': '内容',
  '干货满满': '内容',
  '人类': '内容',
  '翻译一般': '翻译',
}

async function runSeed() {
  console.log('开始填充种子数据...')

  await db.init()

  const userCount = db.get('SELECT COUNT(*) as count FROM users').count
  if (userCount > 0) {
    console.log('已有数据，跳过种子填充')
    return
  }

  const nowTime = now()

  console.log('  - 插入分类...')
  for (const cat of CATEGORIES) {
    db.run('INSERT INTO categories (name, parent_id, sort, created_at) VALUES (?, ?, ?, ?)',
      [cat.name, cat.parent_id, cat.sort, nowTime])
  }

  console.log('  - 插入作者...')
  for (const author of AUTHORS) {
    db.run(
      'INSERT INTO authors (name, avatar, bio, birth_date, nationality, works_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
      [author.name, '', author.bio, author.birth_date, author.nationality, nowTime, nowTime]
    )
  }

  console.log('  - 插入书籍...')
  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i]
    const authorId = book.author_idx + 1
    const categoryId = book.category_idx + 1

    const result = db.run(`
      INSERT INTO books (
        title, subtitle, isbn, author_id, publisher, publish_date, pages,
        category_id, description, cover_image, price_cents,
        status, sort, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [
      book.title, book.subtitle, book.isbn, authorId, book.publisher,
      book.publish_date, book.pages, categoryId, book.description,
      '', book.price, nowTime, nowTime
    ])
    const bookId = result.lastInsertRowid

    for (const tag of book.tags) {
      db.run('INSERT INTO book_tags (book_id, tag, created_at) VALUES (?, ?, ?)',
        [bookId, tag, nowTime])
    }

    db.run(`
      INSERT INTO book_skus (
        book_id, sku_name, edition, price_cents, stock, locked_stock, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `, [bookId, `${book.title} - 平装`, '平装', book.price, 100 + Math.floor(Math.random() * 200), nowTime, nowTime])

    db.run(`
      INSERT INTO book_skus (
        book_id, sku_name, edition, price_cents, stock, locked_stock, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `, [bookId, `${book.title} - 精装`, '精装', Math.floor(book.price * 1.5), 50 + Math.floor(Math.random() * 100), nowTime, nowTime])

    for (let j = 0; j < Math.min(book.chapters, 10); j++) {
      db.run(`
        INSERT INTO book_contents (book_id, chapter_title, page_num, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [bookId, `第${j + 1}章 章节标题示例`, (j * 20) + 1, j + 1, nowTime])
    }
  }

  console.log('  - 插入用户...')
  const passwordHash = bcrypt.hashSync('123456', 10)
  db.run(`
    INSERT INTO users (
      username, email, password_hash, nickname, avatar,
      member_level, total_spend_cents, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'silver', 0, ?, ?)
  `, ['testuser', 'test@example.com', passwordHash, '测试用户', '', nowTime, nowTime])

  db.run(`
    INSERT INTO users (
      username, email, password_hash, nickname, avatar,
      member_level, total_spend_cents, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'silver', 0, ?, ?)
  `, ['reader01', 'reader01@example.com', passwordHash, '读书爱好者', '', nowTime, nowTime])

  console.log('  - 插入优惠码...')
  for (const coupon of COUPONS) {
    const bookId = coupon.book_idx !== undefined ? coupon.book_idx + 1 : null
    db.run(`
      INSERT INTO coupons (
        code, name, type, value, min_amount_cents, book_id,
        total_count, used_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
    `, [coupon.code, coupon.name, coupon.type, coupon.value, coupon.min_amount_cents, bookId, coupon.total_count, nowTime])
  }

  console.log('  - 插入评价...')
  const reviewSamples = [
    { rating: 5, title: '非常经典', content: '这本书真的太棒了，值得一读再读！', tags: ['经典必读', '文笔好'] },
    { rating: 4, title: '还不错', content: '整体来说还可以，有些地方写得很好。', tags: ['推荐阅读'] },
    { rating: 5, title: '强烈推荐', content: '一口气读完，根本停不下来！', tags: ['强烈推荐', '情节紧凑'] },
    { rating: 3, title: '一般般', content: '翻译一般，内容还行吧。', tags: ['翻译一般'] },
    { rating: 5, title: '神作', content: '看完之后久久不能平静，太震撼了！', tags: ['经典必读', '悬疑烧脑'] },
    { rating: 4, title: '治愈系', content: '很温暖的一本书，适合周末慢慢读。', tags: ['治愈系', '温暖治愈'] },
    { rating: 5, title: '干货满满', content: '学到了很多知识，非常实用！', tags: ['干货满满'] },
  ]

  for (let bookId = 1; bookId <= BOOKS.length; bookId++) {
    const numReviews = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < numReviews; i++) {
      const sample = reviewSamples[Math.floor(Math.random() * reviewSamples.length)]
      const reviewResult = db.run(`
        INSERT INTO reviews (
          book_id, user_id, order_id, order_item_id, rating, title, content,
          helpful_count, status, created_at, updated_at
        ) VALUES (?, ?, NULL, NULL, ?, ?, ?, 0, 'approved', ?, ?)
      `, [bookId, (i % 2) + 1, sample.rating, sample.title, sample.content,
        nowTime - Math.floor(Math.random() * 86400 * 30), nowTime])
      const reviewId = reviewResult.lastInsertRowid
      for (const tag of sample.tags) {
        const group = TAG_GROUPS[tag] || '其他'
        db.run('INSERT INTO review_tags (review_id, tag, tag_group, created_at) VALUES (?, ?, ?, ?)',
          [reviewId, tag, group, nowTime])
      }
    }
  }

  console.log('  - 更新书籍评分...')
  for (let bookId = 1; bookId <= BOOKS.length; bookId++) {
    const stats = db.get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE book_id = ? AND status = 'approved'
    `, [bookId])
    db.run('UPDATE books SET rating_avg = ?, rating_count = ?, sales_count = ? WHERE id = ?',
      [stats.avg_rating || 0, stats.count || 0, Math.floor(Math.random() * 5000) + 100, bookId])
  }

  console.log('  - 更新作者作品数...')
  for (let i = 0; i < AUTHORS.length; i++) {
    const count = BOOKS.filter(b => b.author_idx === i).length
    db.run('UPDATE authors SET works_count = ? WHERE id = ?', [count, i + 1])
  }

  console.log('  - 计算榜单...')
  const rankingService = require('../services/rankingService')
  rankingService.recalculateAll()

  db.saveSync()
  console.log('种子数据填充完成!')
}

if (require.main === module) {
  runSeed().catch(err => {
    console.error('种子数据填充失败:', err)
    process.exit(1)
  })
}

module.exports = runSeed
