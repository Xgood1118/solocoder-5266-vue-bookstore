<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">我的购物车</h1>

      <div v-if="loading" class="loading">加载中...</div>
      
      <div v-else-if="cart.items.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>购物车还是空的</p>
        <router-link to="/books" class="btn btn-primary">去逛逛</router-link>
      </div>

      <div v-else class="cart-layout">
        <div class="cart-main">
          <div class="cart-header">
            <label class="select-all">
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
              全选
            </label>
            <span class="header-info">商品</span>
            <span class="header-price">单价</span>
            <span class="header-qty">数量</span>
            <span class="header-subtotal">小计</span>
            <span class="header-action">操作</span>
          </div>

          <div class="cart-list">
            <div 
              v-for="item in cart.items" 
              :key="item.sku_id" 
              class="cart-item"
            >
              <div class="item-select">
                <input 
                  type="checkbox" 
                  :checked="item.selected"
                  @change="toggleSelect(item.sku_id)"
                />
              </div>
              <div class="item-cover" @click="goToBook(item.book_id)">
                <span class="cover-icon">📖</span>
              </div>
              <div class="item-info">
                <h3 class="item-title ellipsis-2" @click="goToBook(item.book_id)">
                  {{ item.sku_name }}
                </h3>
                <p class="item-edition">版本：{{ item.edition }}</p>
                <p class="item-author">作者：{{ item.author_name || '未知' }}</p>
              </div>
              <div class="item-price">¥{{ formatPrice(item.price_cents) }}</div>
              <div class="item-qty">
                <div class="quantity-control">
                  <button 
                    class="qty-btn" 
                    @click="updateQty(item.sku_id, item.quantity - 1)"
                    :disabled="item.quantity <= 1"
                  >-</button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button 
                    class="qty-btn" 
                    @click="updateQty(item.sku_id, item.quantity + 1)"
                  >+</button>
                </div>
                <p v-if="item.available < item.quantity" class="stock-warning">
                  库存不足，仅剩 {{ item.available }} 件
                </p>
              </div>
              <div class="item-subtotal">¥{{ formatPrice(item.price_cents * item.quantity) }}</div>
              <div class="item-action">
                <button class="remove-btn" @click="removeItem(item.sku_id)">删除</button>
              </div>
            </div>
          </div>

          <div class="cart-footer">
            <label class="select-all">
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
              全选
            </label>
            <button class="clear-btn" @click="clearCart">清空购物车</button>
            <div class="footer-right">
              <span class="selected-info">
                已选 <em>{{ selectedCount }}</em> 件
              </span>
              <span class="total-label">合计：</span>
              <span class="total-price">¥{{ formatPrice(selectedTotal) }}</span>
              <button class="btn btn-primary btn-lg" :disabled="selectedCount === 0" @click="goCheckout">
                去结算
              </button>
            </div>
          </div>
        </div>

        <aside class="cart-sidebar">
          <div class="summary-card">
            <h3 class="card-title">订单摘要</h3>
            <div class="summary-row">
              <span>商品件数</span>
              <span>{{ cart.totalCount }} 件</span>
            </div>
            <div class="summary-row">
              <span>商品总额</span>
              <span>¥{{ formatPrice(cart.totalAmount) }}</span>
            </div>
            <div class="summary-row discount">
              <span>优惠</span>
              <span>-¥0.00</span>
            </div>
            <div class="summary-total">
              <span>应付总额</span>
              <span class="total">¥{{ formatPrice(selectedTotal) }}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const cart = useCartStore()
const userStore = useUserStore()

const loading = ref(true)

const formatPrice = (cents) => (cents / 100).toFixed(2)

const isAllSelected = computed(() => {
  if (cart.items.length === 0) return false
  return cart.items.every(item => item.selected)
})

const selectedCount = computed(() => {
  return cart.selectedItems.reduce((sum, item) => sum + item.quantity, 0)
})

const selectedTotal = computed(() => cart.selectedTotal)

function toggleSelectAll() {
  cart.toggleSelectAll(!isAllSelected.value)
}

function toggleSelect(skuId) {
  cart.toggleSelect(skuId)
}

async function updateQty(skuId, quantity) {
  if (quantity < 1) return
  try {
    await cart.updateItem(skuId, quantity)
  } catch (e) {
    alert(e.message || '更新失败')
  }
}

async function removeItem(skuId) {
  if (!confirm('确定要删除吗？')) return
  try {
    await cart.removeItem(skuId)
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

async function clearCart() {
  if (!confirm('确定要清空购物车吗？')) return
  try {
    await cart.clearAll()
  } catch (e) {
    alert(e.message || '清空失败')
  }
}

function goToBook(bookId) {
  router.push(`/book/${bookId}`)
}

function goCheckout() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (selectedCount.value === 0) return
  
  const items = cart.selectedItems.map(item => ({
    skuId: item.sku_id,
    quantity: item.quantity,
  }))
  localStorage.setItem('checkoutItems', JSON.stringify(items))
  router.push('/checkout')
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    try {
      await cart.fetchCart()
    } catch (e) {
      console.error('加载购物车失败', e)
    }
  }
  loading.value = false
})
</script>

<style scoped>
.cart-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.cart-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.cart-main {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.cart-header {
  display: grid;
  grid-template-columns: 50px 80px 1fr 100px 120px 100px 80px;
  align-items: center;
  padding: 16px 20px;
  background: #f9f9f9;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  color: #999;
}

.header-info {
  padding-left: 20px;
}

.header-price,
.header-qty,
.header-subtotal {
  text-align: center;
}

.header-action {
  text-align: center;
}

.cart-list {
  min-height: 200px;
}

.cart-item {
  display: grid;
  grid-template-columns: 50px 80px 1fr 100px 120px 100px 80px;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.item-select {
  text-align: center;
}

.item-cover {
  width: 60px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cover-icon {
  font-size: 28px;
}

.item-info {
  padding: 0 16px;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  cursor: pointer;
  line-height: 1.4;
  height: 2.8em;
}

.item-title:hover {
  color: #e63946;
}

.item-edition,
.item-author {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.item-price {
  text-align: center;
  color: #e63946;
  font-weight: 500;
}

.item-qty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.qty-btn {
  width: 28px;
  height: 28px;
  background: #f5f5f5;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-value {
  width: 40px;
  text-align: center;
  font-size: 14px;
}

.stock-warning {
  font-size: 11px;
  color: #ff9800;
}

.item-subtotal {
  text-align: center;
  color: #e63946;
  font-weight: 600;
  font-size: 15px;
}

.item-action {
  text-align: center;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 13px;
}

.remove-btn:hover {
  color: #e63946;
}

.cart-footer {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #f9f9f9;
  border-top: 1px solid #eee;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.clear-btn {
  margin-left: 20px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 13px;
}

.clear-btn:hover {
  color: #e63946;
}

.footer-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.selected-info {
  font-size: 13px;
  color: #666;
}

.selected-info em {
  color: #e63946;
  font-style: normal;
  font-weight: 600;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 22px;
  font-weight: 700;
  color: #e63946;
}

.cart-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.summary-card {
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
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.summary-row.discount {
  color: #4caf50;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
}

.summary-total .total {
  font-size: 22px;
  font-weight: 700;
  color: #e63946;
}

.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-cart p {
  color: #999;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
