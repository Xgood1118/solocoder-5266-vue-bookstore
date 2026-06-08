<template>
  <div class="favorites-page">
    <div class="container">
      <h1 class="page-title">我的收藏</h1>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="list.length === 0" class="empty">
        <div class="empty-icon">❤️</div>
        <p>还没有收藏任何书籍</p>
        <router-link to="/books" class="btn btn-primary">去发现好书</router-link>
      </div>
      <div v-else>
        <div class="list-header">
          <span class="count">共 {{ total }} 本收藏</span>
        </div>
        <div class="book-grid">
          <BookCard v-for="book in list" :key="book.id" :book="book" />
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMyFavorites } from '@/api/favorite'
import { useUserStore } from '@/stores/user'
import BookCard from '@/components/BookCard.vue'

const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20
const loading = ref(true)

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1)

async function loadFavorites() {
  loading.value = true
  try {
    const data = await getMyFavorites({
      page: currentPage.value,
      pageSize,
    })
    list.value = data.list || []
    total.value = data.total || 0
  } catch (e) {
    console.error('加载收藏失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch(currentPage, loadFavorites)

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/favorites')
    return
  }
  loadFavorites()
})
</script>

<style scoped>
.favorites-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.list-header {
  margin-bottom: 16px;
}

.count {
  font-size: 14px;
  color: #999;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.loading, .empty {
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty p {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  border-color: #e63946;
  color: #e63946;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}
</style>
