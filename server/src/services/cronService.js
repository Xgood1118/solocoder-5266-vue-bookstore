const cron = require('node-cron')
const config = require('../config')
const { OrderService } = require('./orderService')
const rankingService = require('./rankingService')

class CronService {
  constructor() {
    this.tasks = []
    this.running = false
  }

  start() {
    if (this.running) return
    this.running = true

    console.log('启动定时任务...')

    const expireTask = cron.schedule('*/5 * * * *', () => {
      try {
        const count = OrderService.expireOrders()
        if (count > 0) {
          console.log(`[CRON] 已取消 ${count} 个超时订单`)
        }
      } catch (err) {
        console.error('[CRON] 订单超时处理失败:', err)
      }
    })
    this.tasks.push(expireTask)

    const rankingTask = cron.schedule(config.ranking.cronSchedule, () => {
      try {
        console.log('[CRON] 开始重新计算榜单...')
        const results = rankingService.recalculateAll()
        console.log('[CRON] 榜单计算完成:', results)
      } catch (err) {
        console.error('[CRON] 榜单计算失败:', err)
      }
    })
    this.tasks.push(rankingTask)

    console.log(`定时任务已启动，共 ${this.tasks.length} 个任务`)
  }

  stop() {
    console.log('停止定时任务...')
    for (const task of this.tasks) {
      task.stop()
    }
    this.tasks = []
    this.running = false
    console.log('定时任务已停止')
  }
}

module.exports = new CronService()
