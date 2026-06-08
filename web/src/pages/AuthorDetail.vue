<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="author" class="author-detail-page">
    <div class="container">
      <div class="author-header">
        <div class="author-avatar">
          <span class="avatar-icon">✍️</span>
        </div>
        <div class="author-info">
          <h1 class="author-name">{{ author.name }}</h1>
          <p v-if="author.country" class="author-country">
            {{ author.country }}作家
          </p>
          <p class="author-stats">
            <span>📚 共 {{ author.book_count || 0 }} 部作品</span>
          </p>
        </div>
      </div>

      <div class="author-body">
        <div class="main-col">
          <div class="detail-section">
            <h2 class="section-title">作者简介</h2>
            <div class="bio">
              <p>{{ author.bio }}</p>
            </div>
          </div>

          <div class="detail-section">
            <h2 class="section-title">
              全部作品
              <span class="count">共 {{ books.length }} 部</span>
            </h2>

            <div v-if="loadingBooks" class="loading-mini">加载中...</div>
            <div v-else-if="books.length === 0" class="empty">暂无作品</div>
            <div v-else class="book-grid">
              <BookCard v-for="book in books" :key="book.id" :book="book" />
            </div>
          </div>
        </div>

        <aside class="side-col">
          <div v-if="representativeBooks.length > 0" class="representative-card">
            <h3 class="card-title">代表作品</h3>
            <div class="rep-list">
              <div 
                v-for="b in representativeBooks" 
                :key="b.id" 
                class="rep-item"
                @click="goToBook(b.id)"
              >
                <div class="rep-cover">📖</div>
                <div class="rep-info">
                  <p class="rep-title ellipsis">{{ b.title }}</p>
                  <p class="rep-rating">⭐ {{ b.rating_avg?.toFixed(1) || '0.0' }}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuthorDetail, getAuthorBooks } from '@/api/author'
import BookCard from '@/components/BookCard.vue'

const route = useRoute()
const router = useRouter()

const author = ref(null)
const books = ref([])
const loading = ref(true)
const loadingBooks = ref(true)

const representativeBooks = computed(() => {
  return books.value
    .filter(b => b.rating_avg && b.rating_avg >= 4)
    .slice(0, 5)
})

async function loadAuthor() {
  loading.value = true
  try {
    const data = await getAuthorDetail(route.params.id)
    author.value = data
    loadBooks()
  } catch (e) {
    console.error('加载作者信息失败', e)
  } finally {
    loading.value = false
  }
}

async function loadBooks() {
  loadingBooks.value = true
  try {
    const data = await getAuthorBooks(route.params.id, { pageSize: 50 })
    books.value = data.list || []
  } catch (e) {
    console.error('加载作者作品失败', e)
  } finally {
    loadingBooks.value = false
  }
}

function goToBook(bookId) {
  router.push(`/book/${bookId}`)
}

onMounted(() => {
  loadAuthor()
})
</script>

<style scoped>
.author-detail-page {
  padding: 20px 0;
}

.author-header {
  display: flex;
  align-items: center;
  gap: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 24px;
  color: #fff;
}

.author-avatar {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 60px;
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.author-country {
  font-size: 15px;
  opacity: 0.8;
  margin-bottom: 12px;
}

.author-stats {
  font-size: 14px;
  opacity: 0.9;
}

.author-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.main-col {
  flex: 1;
  min-width: 0;
}

.side-col {
  width: 280px;
  flex-shrink: 0;
}

.detail-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title .count {
  font-size: 13px;
  font-weight: normal;
  color: #999;
}

.bio {
  color: #555;
  line-height: 1.8;
  font-size: 14px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.representative-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 80px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.rep-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rep-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.rep-item:hover {
  background: #f5f5f5;
}

.rep-cover {
  width: 40px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.rep-info {
  flex: 1;
  min-width: 0;
}

.rep-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.rep-rating {
  font-size: 12px;
  color: #ff9800;
}

.loading,
.loading-mini,
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.loading-mini {
  padding: 30px;
  font-size: 14px;
}

.empty {
  font-size: 14px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
