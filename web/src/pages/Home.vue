<template>
  <div class="home-page">
    <div class="container">
      <section class="banner-section">
        <div class="banner">
          <div class="banner-content">
            <h1>每本好书，值得遇见</h1>
            <p>海量精选图书 · 免费试读前30% · 智能推荐</p>
            <router-link to="/books" class="btn btn-primary btn-lg">立即探索</router-link>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          <span>🔥 畅销榜单</span>
          <router-link to="/ranking" class="more-link">查看更多 →</router-link>
        </h2>
        <div v-if="loadingBestsellers" class="loading">加载中...</div>
        <div v-else class="book-grid">
          <BookCard v-for="book in bestsellers" :key="book.id" :book="book" />
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          <span>✨ 新书上架</span>
        </h2>
        <div v-if="loadingNewBooks" class="loading">加载中...</div>
        <div v-else class="book-grid">
          <BookCard v-for="book in newBooks" :key="book.id" :book="book" />
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          <span>💡 为你推荐</span>
        </h2>
        <div v-if="loadingRecommendations" class="loading">加载中...</div>
        <div v-else class="book-grid">
          <BookCard v-for="book in recommendations" :key="book.id" :book="book" />
        </div>
      </section>

      <section class="section features">
        <div class="feature-item">
          <span class="feature-icon">📖</span>
          <h3>免费试读</h3>
          <p>每本书免费试读前30%，PDF流式渲染</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <h3>智能推荐</h3>
          <p>基于阅读历史的个性化推荐</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⭐</span>
          <h3>真实评价</h3>
          <p>海量读者真实评价，标签化分类</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">💎</span>
          <h3>会员特权</h3>
          <p>累计消费升级会员，享专属折扣</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BookCard from '@/components/BookCard.vue'
import { getBestsellers, getNewArrivals, getRecommendations } from '@/api/book'

const bestsellers = ref([])
const newBooks = ref([])
const recommendations = ref([])
const loadingBestsellers = ref(true)
const loadingNewBooks = ref(true)
const loadingRecommendations = ref(true)

async function loadBestsellers() {
  try {
    const data = await getBestsellers(8)
    bestsellers.value = data
  } finally {
    loadingBestsellers.value = false
  }
}

async function loadNewBooks() {
  try {
    const data = await getNewArrivals(8)
    newBooks.value = data
  } finally {
    loadingNewBooks.value = false
  }
}

async function loadRecommendations() {
  try {
    const data = await getRecommendations({ limit: 8 })
    recommendations.value = data.list || []
  } catch (e) {
    const data = await getBestsellers(8)
    recommendations.value = data
  } finally {
    loadingRecommendations.value = false
  }
}

onMounted(() => {
  loadBestsellers()
  loadNewBooks()
  loadRecommendations()
})
</script>

<style scoped>
.home-page {
  padding-bottom: 20px;
}

.banner-section {
  margin-bottom: 32px;
}

.banner {
  height: 320px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.banner::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.banner-content {
  text-align: center;
  color: #fff;
  z-index: 1;
}

.banner-content h1 {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 16px;
}

.banner-content p {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.more-link {
  font-size: 14px;
  color: #999;
  font-weight: normal;
}

.more-link:hover {
  color: #e63946;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.feature-item {
  text-align: center;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 12px;
  display: block;
}

.feature-item h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.feature-item p {
  font-size: 13px;
  color: #999;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
