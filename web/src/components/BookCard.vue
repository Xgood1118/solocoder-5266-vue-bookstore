<template>
  <div class="book-card" @click="goDetail">
    <div class="book-cover">
      <div class="cover-placeholder">
        <span class="book-icon">📖</span>
      </div>
      <div v-if="book.trial_pages" class="trial-badge">免费试读</div>
    </div>
    <div class="book-info">
      <h3 class="book-title ellipsis-2">{{ book.title }}</h3>
      <p class="book-author text-muted text-sm">{{ book.author_name || '未知作者' }}</p>
      <div class="book-rating">
        <span class="stars">{{ renderStars(book.rating_avg || 0) }}</span>
        <span class="rating-count text-muted text-sm">({{ book.rating_count || 0 }})</span>
      </div>
      <div class="book-bottom">
        <span class="price text-lg font-bold">¥{{ formatPrice(book.price_cents) }}</span>
        <span class="sales text-muted text-sm">已售{{ book.sales_count || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
})

const router = useRouter()

function goDetail() {
  router.push(`/book/${props.book.id}`)
}

function formatPrice(cents) {
  return (cents / 100).toFixed(2)
}

function renderStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + '☆'.repeat(empty + half)
}
</script>

<style scoped>
.book-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
}

.book-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.trial-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #e63946;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.book-info {
  padding: 12px;
}

.book-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  margin-bottom: 6px;
}

.book-author {
  margin-bottom: 6px;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.stars {
  color: #ffc107;
  font-size: 12px;
}

.book-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  color: #e63946;
}
</style>
