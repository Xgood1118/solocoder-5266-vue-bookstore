<template>
  <div class="orders-page">
    <div class="container">
      <h1 class="page-title">我的订单</h1>

      <div class="order-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.status"
          :class="{ active: activeStatus === tab.status }"
          class="tab-btn"
          @click="activeStatus = tab.status; currentPage = 1"
        >
          {{ tab.name }}
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="orders.length === 0" class="empty">
        <div class="empty-icon">📦</div>
        <p>暂无订单</p>
        <router-link to="/books" class="btn btn-primary">去逛逛</router-link>
      </div>
      <div v-else class="order-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div class="order-left">
              <span class="order-time">{{ formatDate(order.created_at) }}</span>
              <span class="order-no">订单号：{{ order.order_no }}</span>
            </div>
            <span class="order-status" :class="order.status">
              {{ getStatusText(order.status) }}
            </span>
          </div>

          <div class="order-body">
            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item" @click="goToBook(item.book_id)">
                <div class="item-cover">
                  <span class="cover-icon">📖</span>
                </div>
                <div class="item-info">
                  <p class="item-title ellipsis-2">{{ item.sku_name }}</p>
                  <p class="item-edition">{{ item.edition }}</p>
                </div>
                <div class="item-right">
                  <p class="item-price">¥{{ formatPrice(item.price_cents) }}</p>
                  <p class="item-qty">×{{ item.quantity }}</p>
                </div>
              </div>
            </div>

            <div class="order-total">
              <p class="count">共 {{ getTotalCount(order.items) }} 件商品</p>
              <p class="total">
                实付 <span class="amount">¥{{ formatPrice(order.total_amount_cents) }}</span>
              </p>
            </div>
          </div>

          <div class="order-footer">
            <div class="footer-left">
              <span v-if="order.coupon_discount_cents > 0" class="discount-tag">
                优惠 -¥{{ formatPrice(order.coupon_discount_cents) }}
              </span>
            </div>
            <div class="footer-right">
              <template v-if="order.status === 'pending'">
                <button class="btn btn-outline btn-sm" @click="handleCancelOrder(order.id)">取消订单</button>
                <button class="btn btn-primary btn-sm" @click="handlePayOrder(order.id)">去支付</button>
              </template>
              <template v-else-if="order.status === 'paid'">
                <button class="btn btn-outline btn-sm" @click="handleConfirmReceipt(order.id)">确认收货</button>
              </template>
              <template v-else-if="order.status === 'completed'">
                <button class="btn btn-outline btn-sm" @click="goToReview(order.id)">评价</button>
              </template>
              <router-link :to="`/order/${order.id}`" class="view-detail">
                查看详情 →
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList, cancelOrder as cancelOrderApi, payOrder as payOrderApi, confirmReceipt as confirmReceiptApi } from '@/api/order'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const orders = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const loading = ref(true)
const activeStatus = ref('')

const statusTabs = [
  { status: '', name: '全部订单' },
  { status: 'pending', name: '待付款' },
  { status: 'paid', name: '待发货' },
  { status: 'shipping', name: '待收货' },
  { status: 'completed', name: '已完成' },
  { status: 'cancelled', name: '已取消' },
]

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1)

const formatPrice = (cents) => (cents / 100).toFixed(2)

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp * 1000)
  return d.toLocaleString('zh-CN')
}

const getStatusText = (status) => {
  const map = {
    pending: '待付款',
    paid: '待发货',
    shipping: '配送中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return map[status] || status
}

const getTotalCount = (items) => {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

async function loadOrders() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize,
    }
    if (activeStatus.value) {
      params.status = activeStatus.value
    }
    
    const data = await getOrderList(params)
    orders.value = data.list || []
    total.value = data.total || 0
  } catch (e) {
    console.error('加载订单失败', e)
    orders.value = []
  } finally {
    loading.value = false
  }
}

async function handleCancelOrder(orderId) {
  if (!confirm('确定要取消订单吗？')) return
  try {
    await cancelOrderApi(orderId)
    alert('订单已取消')
    loadOrders()
  } catch (e) {
    alert(e.message || '取消失败')
  }
}

async function handlePayOrder(orderId) {
  try {
    await payOrderApi(orderId)
    alert('支付成功！')
    loadOrders()
  } catch (e) {
    alert(e.message || '支付失败')
  }
}

async function handleConfirmReceipt(orderId) {
  if (!confirm('确认已收到商品？')) return
  try {
    await confirmReceiptApi(orderId)
    alert('已确认收货')
    loadOrders()
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

function goToBook(bookId) {
  router.push(`/book/${bookId}`)
}

function goToReview(orderId) {
  router.push(`/order/${orderId}?review=1`)
}

watch(currentPage, loadOrders)
watch(activeStatus, () => { currentPage.value = 1; loadOrders() })

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/orders')
    return
  }
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.order-tabs {
  display: flex;
  gap: 4px;
  background: #fff;
  padding: 8px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: inline-flex;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
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

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.order-left {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}

.order-no {
  font-family: monospace;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
}

.order-status.pending { color: #ff9800; }
.order-status.paid { color: #2196f3; }
.order-status.shipping { color: #9c27b0; }
.order-status.completed { color: #4caf50; }
.order-status.cancelled { color: #999; }

.order-body {
  display: flex;
  padding: 16px 20px;
  gap: 24px;
}

.order-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.order-item:hover {
  background: #f9f9f9;
}

.item-cover {
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

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}

.item-edition {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.item-right {
  text-align: right;
  flex-shrink: 0;
}

.item-price {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.item-qty {
  font-size: 13px;
  color: #999;
}

.order-total {
  width: 160px;
  border-left: 1px solid #f0f0f0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.count {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.total {
  font-size: 14px;
  color: #666;
}

.total .amount {
  font-size: 20px;
  font-weight: 700;
  color: #e63946;
  margin-left: 4px;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.discount-tag {
  background: #fff3e0;
  color: #ff9800;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.view-detail {
  color: #1976d2;
  font-size: 13px;
  margin-left: 8px;
}

.view-detail:hover {
  text-decoration: underline;
}

.loading, .empty {
  text-align: center;
  padding: 60px;
  color: #999;
  background: #fff;
  border-radius: 12px;
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

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
