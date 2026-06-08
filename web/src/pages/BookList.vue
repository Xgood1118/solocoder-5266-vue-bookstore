<template>
  <div class="book-list-page">
    <div class="container">
      <div class="page-layout">
        <aside class="sidebar">
          <div class="filter-section">
            <h3 class="filter-title">分类</h3>
            <ul class="filter-list">
              <li 
                :class="{ active: !categoryId }"
                @click="categoryId = ''; currentPage = 1"
              >
                全部
              </li>
              <li 
                v-for="cat in categories" 
                :key="cat.id"
                :class="{ active: categoryId == cat.id }"
                @click="categoryId = cat.id; currentPage = 1"
              >
                {{ cat.name }}
              </li>
            </ul>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">排序</h3>
            <ul class="filter-list">
              <li :class="{ active: sortBy === 'new' }" @click="sortBy = 'new'">最新上架</li>
              <li :class="{ active: sortBy === 'sales' }" @click="sortBy = 'sales'">销量最高</li>
              <li :class="{ active: sortBy === 'rating' }" @click="sortBy = 'rating'">评分最高</li>
              <li :class="{ active: sortBy === 'price_asc' }" @click="sortBy = 'price_asc'">价格从低到高</li>
              <li :class="{ active: sortBy === 'price_desc' }" @click="sortBy = 'price_desc'">价格从高到低</li>
            </ul>
          </div>
        </aside>

        <main class="main-content">
          <div class="list-header">
            <h1 class="page-title">
              {{ keyword ? `搜索: ${keyword}` : '全部图书' }}
              <span class="count">共 {{ total }} 本</span>
            </h1>
          </div>

          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="books.length === 0" class="empty">
            暂无相关书籍
          </div>
          <div v-else class="book-grid">
            <BookCard v-for="book in books" :key="book.id" :book="book" />
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <button 
              class="page-btn" 
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              上一页
            </button>
            <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button 
              class="page-btn" 
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              下一页
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import BookCard from '@/components/BookCard.vue'
import { getBookList } from '@/api/book'

const route = useRoute()

const books = ref([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 20
const categoryId = ref('')
const sortBy = ref('new')
const keyword = ref('')

const categories = ref([
  { id: 1, name: '小说' },
  { id: 2, name: '科幻' },
  { id: 3, name: '推理' },
  { id: 4, name: '文学' },
  { id: 5, name: '历史' },
  { id: 6, name: '科技' },
  { id: 7, name: '哲学' },
  { id: 8, name: '经济' },
])

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1)

async function loadBooks() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize,
      sort: sortBy.value,
    }
    if (categoryId.value) params.categoryId = categoryId.value
    if (keyword.value) params.keyword = keyword.value

    const data = await getBookList(params)
    books.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

watch(currentPage, loadBooks)
watch(sortBy, () => { currentPage.value = 1; loadBooks() })
watch(categoryId, () => { currentPage.value = 1; loadBooks() })

watch(() => route.query.keyword, (newVal) => {
  keyword.value = newVal || ''
  currentPage.value = 1
  loadBooks()
})

onMounted(() => {
  keyword.value = route.query.keyword || ''
  loadBooks()
})
</script>

<style scoped>
.book-list-page {
  padding: 20px 0;
}

.page-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
}

.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-list {
  list-style: none;
}

.filter-list li {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
  transition: all 0.2s;
}

.filter-list li:hover {
  background: #f5f5f5;
  color: #333;
}

.filter-list li.active {
  background: #ffe5e7;
  color: #e63946;
  font-weight: 500;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.list-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.page-title .count {
  font-size: 14px;
  font-weight: normal;
  color: #999;
  margin-left: 8px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
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
