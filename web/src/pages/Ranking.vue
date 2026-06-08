<template>
  <div class="ranking-page">
    <div class="container">
      <h1 class="page-title">📊 图书榜单</h1>

      <div class="ranking-tabs">
        <button
          v-for="tab in rankingTypes"
          :key="tab.type"
          :class="{ active: activeType === tab.type }"
          class="tab-btn"
          @click="activeType = tab.type"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="ranking-content">
        <div class="ranking-main">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else class="ranking-list">
            <div
              v-for="(item, index) in rankings"
              :key="item.book_id"
              class="ranking-item"
              @click="goToBook(item.book_id)"
            >
              <div class="rank-num" :class="{ top: index < 3 }">{{ index + 1 }}</div>
              <div class="book-cover">
                <span class="cover-icon">📖</span>
              </div>
              <div class="book-info">
                <h3 class="book-title ellipsis">{{ item.title }}</h3>
                <p class="book-author">{{ item.author_name }}</p>
                <div class="book-stats">
                  <span class="stat">⭐ {{ item.rating_avg?.toFixed(1) || '0.0' }}</span>
                  <span class="stat">已售 {{ item.sales_count }}</span>
                </div>
              </div>
              <div class="book-price">¥{{ formatPrice(item.price_cents) }}</div>
              <div class="score-info">
                <span class="score-label">热度</span>
                <span class="score-value">{{ formatScore(item.score) }}</span>
              </div>
            </div>
          </div>
        </div>

        <aside class="ranking-sidebar">
          <div class="chart-card">
            <h3 class="card-title">📈 销量趋势</h3>
            <div class="chart-placeholder">
              <p>数据可视化图表占位</p>
              <p class="chart-tip">柱状图 + 折线图展示</p>
            </div>
          </div>

          <div class="chart-card">
            <h3 class="card-title">🏆 分类榜单</h3>
            <ul class="category-ranking">
              <li v-for="cat in categories" :key="cat.id">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }}本</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getRanking, getRankingTypes } from '@/api/ranking'

const router = useRouter()

const rankingTypes = ref([])
const activeType = ref('sales')
const rankings = ref([])
const loading = ref(true)

const categories = ref([
  { id: 1, name: '小说', count: 128 },
  { id: 2, name: '科幻', count: 86 },
  { id: 3, name: '推理', count: 64 },
  { id: 4, name: '文学', count: 92 },
  { id: 5, name: '历史', count: 58 },
])

const formatPrice = (cents) => (cents / 100).toFixed(2)
const formatScore = (score) => Math.round(score || 0)

async function loadRankingTypes() {
  try {
    const data = await getRankingTypes()
    rankingTypes.value = data
  } catch (e) {
    rankingTypes.value = [
      { type: 'sales', name: '畅销榜', description: '按销量排序' },
      { type: 'new', name: '新书榜', description: '按上架时间排序' },
      { type: 'hot_review', name: '热评榜', description: '按评价热度排序' },
      { type: 'kaijuan_monthly', name: '开卷月榜', description: '综合月度排行' },
    ]
  }
}

async function loadRankings() {
  loading.value = true
  try {
    const data = await getRanking(activeType.value, { limit: 20 })
    rankings.value = data.list || []
  } catch (e) {
    console.error('加载榜单失败', e)
    rankings.value = []
  } finally {
    loading.value = false
  }
}

function goToBook(bookId) {
  router.push(`/book/${bookId}`)
}

watch(activeType, loadRankings)

onMounted(() => {
  loadRankingTypes()
  loadRankings()
})
</script>

<style scoped>
.ranking-page {
  padding: 20px 0;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 24px;
}

.ranking-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #fff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: inline-flex;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #e63946;
  color: #fff;
  font-weight: 500;
}

.ranking-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.ranking-main {
  flex: 1;
  min-width: 0;
}

.ranking-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
  gap: 16px;
}

.ranking-item:hover {
  background: #fafafa;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #999;
  font-size: 16px;
  flex-shrink: 0;
}

.rank-num.top {
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
}

.book-cover {
  width: 50px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-icon {
  font-size: 24px;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.book-author {
  font-size: 13px;
  color: #999;
  margin-bottom: 6px;
}

.book-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.stat {
  color: #ff9800;
}

.book-price {
  font-size: 18px;
  font-weight: 700;
  color: #e63946;
  flex-shrink: 0;
  min-width: 80px;
  text-align: right;
}

.score-info {
  flex-shrink: 0;
  text-align: right;
  min-width: 80px;
}

.score-label {
  display: block;
  font-size: 11px;
  color: #bbb;
  margin-bottom: 2px;
}

.score-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.ranking-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.chart-placeholder {
  height: 200px;
  background: #f9f9f9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 14px;
}

.chart-tip {
  font-size: 12px;
  margin-top: 8px;
  color: #ccc;
}

.category-ranking {
  list-style: none;
}

.category-ranking li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.category-ranking li:hover {
  color: #e63946;
}

.category-ranking li:last-child {
  border-bottom: none;
}

.cat-count {
  color: #999;
  font-size: 13px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
  background: #fff;
  border-radius: 12px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
