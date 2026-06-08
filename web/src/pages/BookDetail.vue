<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="book" class="book-detail-page">
    <div class="container">
      <div class="book-header">
        <div class="book-cover-large">
          <div class="cover-inner">
            <span class="book-icon">📖</span>
          </div>
          <div v-if="book.trial_pages" class="trial-badge">免费试读前30%</div>
        </div>

        <div class="book-main-info">
          <h1 class="book-title">{{ book.title }}</h1>
          <p v-if="book.subtitle" class="book-subtitle">{{ book.subtitle }}</p>
          
          <div class="book-meta">
            <span class="meta-item">
              <span class="label">作者</span>
              <router-link :to="`/author/${book.author_id}`" class="author-link">
                {{ book.author_name }}
              </router-link>
            </span>
            <span class="meta-item">
              <span class="label">出版社</span>
              {{ book.publisher }}
            </span>
            <span class="meta-item">
              <span class="label">出版日期</span>
              {{ book.publish_date }}
            </span>
            <span class="meta-item">
              <span class="label">页数</span>
              {{ book.pages }}页
            </span>
            <span class="meta-item">
              <span class="label">ISBN</span>
              {{ book.isbn }}
            </span>
          </div>

          <div class="book-rating-row">
            <div class="rating-display">
              <span class="stars">{{ renderStars(book.rating_avg) }}</span>
              <span class="rating-score">{{ book.rating_avg?.toFixed(1) || '0.0' }}</span>
              <span class="rating-count">{{ book.rating_count }} 条评价</span>
            </div>
            <span class="sales-count">已售 {{ book.sales_count }}</span>
          </div>

          <div class="book-tags">
            <span v-for="tag in book.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <div class="price-section">
            <span class="price-label">优惠价</span>
            <span class="price">¥{{ formatPrice(book.price_cents) }}</span>
            <span v-if="book.price_cents < 5000" class="discount-badge">限时特惠</span>
          </div>

          <div class="edition-selector">
            <span class="selector-label">版本：</span>
            <div class="edition-options">
              <div
                v-for="sku in skus"
                :key="sku.id"
                :class="{ active: selectedSku?.id === sku.id }"
                class="edition-option"
                @click="selectedSku = sku"
              >
                <span class="edition-name">{{ sku.edition }}</span>
                <span class="edition-price">¥{{ formatPrice(sku.price_cents) }}</span>
                <span class="edition-stock">库存: {{ sku.available_stock || sku.stock }}</span>
              </div>
            </div>
          </div>

          <div class="quantity-selector">
            <span class="selector-label">数量：</span>
            <div class="quantity-control">
              <button class="qty-btn" @click="quantity--" :disabled="quantity <= 1">-</button>
              <input type="number" v-model.number="quantity" min="1" class="qty-input" />
              <button class="qty-btn" @click="quantity++">+</button>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-outline btn-lg" @click="handleTrial">
              📖 免费试读
            </button>
            <button class="btn btn-secondary btn-lg" @click="handleAddToCart">
              🛒 加入购物车
            </button>
            <button class="btn btn-primary btn-lg" @click="handleBuyNow">
              立即购买
            </button>
            <button 
              class="favorite-btn" 
              :class="{ active: isFavorited }"
              @click="toggleFavorite"
            >
              {{ isFavorited ? '❤️' : '🤍' }} 收藏
            </button>
          </div>
        </div>
      </div>

      <div class="book-body">
        <div class="main-col">
          <div class="detail-section">
            <h2 class="section-title">内容简介</h2>
            <div class="description">
              <p>{{ book.description }}</p>
            </div>
          </div>

          <div v-if="book.contents?.length" class="detail-section">
            <h2 class="section-title">图书目录</h2>
            <ul class="contents-list">
              <li v-for="(item, index) in book.contents.slice(0, showAllContents ? undefined : 10)" :key="item.id">
                <span class="chapter-num">第{{ index + 1 }}章</span>
                <span class="chapter-title">{{ item.chapter_title }}</span>
                <span class="chapter-page">P{{ item.page_num }}</span>
              </li>
            </ul>
            <button 
              v-if="book.contents.length > 10" 
              class="toggle-btn"
              @click="showAllContents = !showAllContents"
            >
              {{ showAllContents ? '收起' : `展开全部 (${book.contents.length}章)` }}
            </button>
          </div>

          <div class="detail-section">
            <h2 class="section-title">
              读者评价 ({{ reviewStats.totalCount || 0 }})
              <router-link :to="`/book/${book.id}/reviews`" class="more-link">查看全部</router-link>
            </h2>
            
            <div v-if="reviewStats" class="review-summary">
              <div class="rating-overview">
                <div class="rating-score-large">{{ reviewStats.avgRating?.toFixed(1) || '0.0' }}</div>
                <div class="rating-stars">
                  <span class="stars big">{{ renderStars(reviewStats.avgRating) }}</span>
                  <span class="rating-count">{{ reviewStats.totalCount }} 条评价</span>
                </div>
              </div>
              
              <div class="rating-distribution">
                <div v-for="i in [5,4,3,2,1]" :key="i" class="rating-bar">
                  <span class="bar-label">{{ i }}星</span>
                  <div class="bar-track">
                    <div 
                      class="bar-fill" 
                      :style="{ width: getRatingPercent(i) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-count">{{ reviewStats.ratingDistribution?.[i] || 0 }}</span>
                </div>
              </div>

              <div v-if="reviewStats.hotTags?.length" class="hot-tags">
                <span 
                  v-for="tag in reviewStats.hotTags" 
                  :key="tag.tag" 
                  class="review-tag"
                >
                  {{ tag.tag }} ({{ tag.count }})
                </span>
              </div>
            </div>

            <div v-if="reviews.length > 0" class="review-list">
              <div v-for="review in reviews" :key="review.id" class="review-item">
                <div class="review-header">
                  <div class="reviewer-info">
                    <span class="reviewer-name">{{ review.nickname || '匿名用户' }}</span>
                    <span class="review-rating">{{ renderStars(review.rating) }}</span>
                  </div>
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </div>
                <h4 class="review-title">{{ review.title }}</h4>
                <p class="review-content">{{ review.content }}</p>
                <div v-if="review.tags?.length" class="review-tags">
                  <span v-for="tag in review.tags" :key="tag.tag" class="tag small">{{ tag.tag }}</span>
                </div>
                <div class="review-footer">
                  <button class="helpful-btn" @click="voteHelpful(review.id)">
                    👍 有用 ({{ review.helpful_count }})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="side-col">
          <div class="author-card">
            <h3 class="card-title">作者简介</h3>
            <div class="author-info">
              <div class="author-avatar">
                <span class="avatar-icon">✍️</span>
              </div>
              <div class="author-detail">
                <h4 class="author-name">
                  <router-link :to="`/author/${book.author_id}`">{{ book.author_name }}</router-link>
                </h4>
                <p class="author-bio ellipsis-2">{{ book.author_bio }}</p>
              </div>
            </div>
            <router-link :to="`/author/${book.author_id}`" class="view-author-btn">
              查看作者主页 →
            </router-link>
          </div>

          <div v-if="similarBooks.length > 0" class="similar-section">
            <h3 class="card-title">相关推荐</h3>
            <div class="similar-list">
              <div 
                v-for="b in similarBooks.slice(0, 5)" 
                :key="b.id" 
                class="similar-item"
                @click="goToBook(b.id)"
              >
                <div class="similar-cover">📖</div>
                <div class="similar-info">
                  <p class="similar-title ellipsis">{{ b.title }}</p>
                  <p class="similar-price">¥{{ formatPrice(b.price_cents) }}</p>
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
import { getBookDetail, getSimilarBooks } from '@/api/book'
import { getReviewStats, getReviewList, voteReview } from '@/api/review'
import { checkFavorite, toggleFavorite as toggleFavApi } from '@/api/favorite'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const book = ref(null)
const skus = ref([])
const selectedSku = ref(null)
const quantity = ref(1)
const loading = ref(true)
const isFavorited = ref(false)
const showAllContents = ref(false)
const reviews = ref([])
const reviewStats = ref({})
const similarBooks = ref([])

const formatPrice = (cents) => (cents / 100).toFixed(2)

const renderStars = (rating) => {
  const full = Math.floor(rating || 0)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-CN')
}

const getRatingPercent = (star) => {
  const total = reviewStats.value.totalCount || 1
  const count = reviewStats.value.ratingDistribution?.[star] || 0
  return (count / total) * 100
}

async function loadBook() {
  loading.value = true
  try {
    const data = await getBookDetail(route.params.id)
    book.value = data
    skus.value = data.skus || []
    if (skus.value.length > 0) {
      selectedSku.value = skus.value[0]
    }
    
    await Promise.all([
      loadReviewStats(),
      loadReviews(),
      loadSimilarBooks(),
    ])
    
    if (userStore.isLoggedIn) {
      checkFav()
    }
  } finally {
    loading.value = false
  }
}

async function loadReviewStats() {
  try {
    const data = await getReviewStats(route.params.id)
    reviewStats.value = data
  } catch (e) {
    console.error('加载评价统计失败', e)
  }
}

async function loadReviews() {
  try {
    const data = await getReviewList({ bookId: route.params.id, pageSize: 3, sort: 'helpful' })
    reviews.value = data.list || []
  } catch (e) {
    console.error('加载评价失败', e)
  }
}

async function loadSimilarBooks() {
  try {
    const data = await getSimilarBooks(route.params.id, 8)
    similarBooks.value = data
  } catch (e) {
    console.error('加载相似书籍失败', e)
  }
}

async function checkFav() {
  try {
    const data = await checkFavorite(route.params.id)
    isFavorited.value = data.isFavorited
  } catch (e) {
    // ignore
  }
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const data = await toggleFavApi(route.params.id)
    isFavorited.value = data.isFavorited
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

async function handleAddToCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (!selectedSku.value) return
  try {
    await cartStore.addItem(selectedSku.value.id, quantity.value)
    alert('已加入购物车')
  } catch (e) {
    alert(e.message || '加入购物车失败')
  }
}

function handleBuyNow() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (!selectedSku.value) return
  
  localStorage.setItem('checkoutItems', JSON.stringify([{
    skuId: selectedSku.value.id,
    quantity: quantity.value,
  }]))
  router.push('/checkout')
}

function handleTrial() {
  router.push(`/read/${book.value.id}`)
}

function voteHelpful(reviewId) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  voteReview(reviewId, 'helpful').then(() => {
    loadReviews()
  }).catch(e => alert(e.message))
}

function goToBook(id) {
  router.push(`/book/${id}`)
}

onMounted(() => {
  loadBook()
})
</script>

<style scoped>
.book-detail-page {
  padding: 20px 0;
}

.book-header {
  display: flex;
  gap: 40px;
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.book-cover-large {
  width: 240px;
  flex-shrink: 0;
  position: relative;
}

.cover-inner {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.book-icon {
  font-size: 80px;
}

.trial-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #e63946;
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(230, 57, 70, 0.3);
}

.book-main-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #222;
}

.book-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
}

.book-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}

.meta-item .label {
  color: #999;
  margin-right: 8px;
}

.author-link {
  color: #1976d2;
}

.author-link:hover {
  text-decoration: underline;
}

.book-rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  color: #ffc107;
  font-size: 14px;
}

.stars.big {
  font-size: 20px;
}

.rating-score {
  font-size: 18px;
  font-weight: 600;
  color: #ff9800;
}

.rating-count {
  color: #999;
  font-size: 13px;
}

.sales-count {
  color: #999;
  font-size: 13px;
}

.book-tags {
  margin-bottom: 16px;
}

.tag {
  display: inline-block;
  padding: 3px 10px;
  background: #f0f7ff;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag.small {
  padding: 2px 6px;
  font-size: 11px;
}

.price-section {
  background: #fff8f8;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.price-label {
  color: #999;
  font-size: 14px;
}

.price {
  font-size: 32px;
  font-weight: 700;
  color: #e63946;
}

.discount-badge {
  background: #e63946;
  color: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.edition-selector,
.quantity-selector {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.selector-label {
  color: #666;
  width: 50px;
  flex-shrink: 0;
  padding-top: 6px;
}

.edition-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.edition-option {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  text-align: center;
  min-width: 100px;
  transition: all 0.2s;
}

.edition-option:hover {
  border-color: #e63946;
}

.edition-option.active {
  border-color: #e63946;
  background: #fff5f5;
}

.edition-name {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.edition-price {
  color: #e63946;
  font-weight: 600;
  display: block;
  font-size: 14px;
}

.edition-stock {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.qty-btn {
  width: 32px;
  height: 32px;
  background: #f5f5f5;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-input {
  width: 60px;
  height: 32px;
  border: none;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  text-align: center;
  font-size: 14px;
  -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.favorite-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.favorite-btn.active {
  background: #fff5f5;
  border-color: #e63946;
  color: #e63946;
}

.book-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.main-col {
  flex: 1;
  min-width: 0;
}

.side-col {
  width: 300px;
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

.more-link {
  font-size: 13px;
  color: #999;
  font-weight: normal;
}

.more-link:hover {
  color: #e63946;
}

.description {
  color: #555;
  line-height: 1.8;
}

.contents-list {
  list-style: none;
}

.contents-list li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  font-size: 14px;
}

.chapter-num {
  color: #999;
  width: 60px;
  flex-shrink: 0;
}

.chapter-title {
  flex: 1;
}

.chapter-page {
  color: #999;
  font-size: 12px;
}

.toggle-btn {
  margin-top: 12px;
  color: #1976d2;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.review-summary {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.rating-overview {
  text-align: center;
  min-width: 120px;
}

.rating-score-large {
  font-size: 48px;
  font-weight: 700;
  color: #ff9800;
  line-height: 1;
}

.rating-stars {
  margin-top: 8px;
}

.rating-distribution {
  flex: 1;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 13px;
}

.bar-label {
  width: 30px;
  color: #666;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #ffc107;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-count {
  width: 40px;
  text-align: right;
  color: #999;
}

.hot-tags {
  margin-top: 16px;
}

.review-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 12px;
  margin-right: 8px;
  margin-bottom: 8px;
  color: #666;
}

.review-list {
  margin-top: 16px;
}

.review-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-name {
  font-weight: 500;
  color: #333;
}

.review-rating {
  color: #ffc107;
  font-size: 12px;
}

.review-date {
  color: #999;
  font-size: 12px;
}

.review-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.review-content {
  color: #555;
  line-height: 1.6;
  margin-bottom: 10px;
}

.review-tags {
  margin-bottom: 10px;
}

.review-footer {
  text-align: right;
}

.helpful-btn {
  padding: 4px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
}

.helpful-btn:hover {
  background: #e8f5e9;
  color: #4caf50;
}

.author-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}

.author-detail {
  flex: 1;
  min-width: 0;
}

.author-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.author-name a {
  color: #333;
}

.author-name a:hover {
  color: #e63946;
}

.author-bio {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.view-author-btn {
  display: block;
  text-align: center;
  color: #1976d2;
  font-size: 13px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-author-btn:hover {
  border-color: #1976d2;
  background: #f0f7ff;
}

.similar-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.similar-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.similar-item {
  display: flex;
  gap: 10px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.similar-item:hover {
  background: #f5f5f5;
}

.similar-cover {
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

.similar-info {
  flex: 1;
  min-width: 0;
}

.similar-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.similar-price {
  font-size: 13px;
  color: #e63946;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 80px;
  color: #999;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
