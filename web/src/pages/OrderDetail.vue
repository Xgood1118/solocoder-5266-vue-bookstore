<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="order" class="order-detail-page">
    <div class="container">
      <div class="order-status-bar">
        <div class="status-info">
          <h2 class="status-text">{{ getStatusText(order.status) }}</h2>
          <p class="status-desc">{{ getStatusDesc(order.status) }}</p>
        </div>
        <div class="status-steps">
          <div 
            v-for="(step, index) in statusSteps" 
            :key="step.key"
            :class="{ active: stepIndex >= index, current: stepIndex === index }"
            class="step-item"
          >
            <div class="step-icon">{{ step.icon }}</div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <div class="section-card">
            <h3 class="card-title">收货信息</h3>
            <div class="address-info">
              <p class="receiver">
                {{ order.receiver_name }}
                <span class="phone">{{ order.receiver_phone }}</span>
              </p>
              <p class="address">
                {{ order.province }} {{ order.city }} {{ order.district }} {{ order.detail_address }}
              </p>
            </div>
          </div>

          <div class="section-card">
            <h3 class="card-title">商品清单</h3>
            <div class="goods-list">
              <div v-for="item in order.items" :key="item.id" class="goods-item" @click="goToBook(item.book_id)">
                <div class="goods-cover">
                  <span class="cover-icon">📖</span>
                </div>
                <div class="goods-info">
                  <h4 class="goods-title ellipsis-2">{{ item.sku_name }}</h4>
                  <p class="goods-edition">版本：{{ item.edition }}</p>
                </div>
                <div class="goods-price">¥{{ formatPrice(item.price_cents) }}</div>
                <div class="goods-qty">×{{ item.quantity }}</div>
                <div class="goods-subtotal">¥{{ formatPrice(item.price_cents * item.quantity) }}</div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h3 class="card-title">订单信息</h3>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">订单编号</span>
                <span class="info-value">{{ order.order_no }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">下单时间</span>
                <span class="info-value">{{ formatDate(order.created_at) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">支付方式</span>
                <span class="info-value">{{ getPaymentText(order.payment_method) }}</span>
              </div>
              <div v-if="order.paid_at" class="info-row">
                <span class="info-label">支付时间</span>
                <span class="info-value">{{ formatDate(order.paid_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <aside class="detail-sidebar">
          <div class="summary-card">
            <h3 class="card-title">订单金额</h3>
            
            <div class="summary-row">
              <span>商品总额</span>
              <span>¥{{ formatPrice(order.subtotal_cents || order.total_amount_cents) }}</span>
            </div>
            <div class="summary-row">
              <span>运费</span>
              <span>¥{{ formatPrice(order.shipping_cents || 0) }}</span>
            </div>
            <div v-if="order.member_discount_cents > 0" class="summary-row discount">
              <span>会员折扣</span>
              <span>-¥{{ formatPrice(order.member_discount_cents) }}</span>
            </div>
            <div v-if="order.coupon_discount_cents > 0" class="summary-row discount">
              <span>优惠券</span>
              <span>-¥{{ formatPrice(order.coupon_discount_cents) }}</span>
            </div>
            
            <div class="summary-total">
              <span>实付金额</span>
              <span class="total">¥{{ formatPrice(order.total_amount_cents) }}</span>
            </div>

            <div class="action-buttons">
              <template v-if="order.status === 'pending'">
                <button class="btn btn-outline btn-block" @click="cancelOrder">取消订单</button>
                <button class="btn btn-primary btn-block" @click="payOrder">立即支付</button>
              </template>
              <template v-else-if="order.status === 'paid'">
                <button class="btn btn-outline btn-block" @click="confirmReceipt">确认收货</button>
              </template>
              <template v-else-if="order.status === 'completed'">
                <button class="btn btn-outline btn-block">申请退款</button>
                <button class="btn btn-primary btn-block">再次购买</button>
              </template>
              <template v-else-if="order.status === 'shipping'">
                <button class="btn btn-outline btn-block" @click="confirmReceipt">确认收货</button>
                <button class="btn btn-primary btn-block">查看物流</button>
              </template>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, cancelOrder as cancel, payOrder as pay, confirmReceipt as confirm } from '@/api/order'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const order = ref(null)
const loading = ref(true)

const formatPrice = (cents) => (cents / 100).toFixed(2)

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

const statusSteps = [
  { key: 'pending', label: '提交订单', icon: '📝' },
  { key: 'paid', label: '付款成功', icon: '💳' },
  { key: 'shipping', label: '商品配送', icon: '🚚' },
  { key: 'completed', label: '交易完成', icon: '✅' },
]

const stepIndex = computed(() => {
  const status = order.value?.status
  const map = { pending: 0, paid: 1, shipping: 2, completed: 3, cancelled: -1, refunded: -1 }
  return map[status] ?? 0
})

const getStatusText = (status) => {
  const map = {
    pending: '待付款',
    paid: '待发货',
    shipping: '配送中',
    completed: '交易完成',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return map[status] || status
}

const getStatusDesc = (status) => {
  const map = {
    pending: '请尽快完成支付，超时订单将自动取消',
    paid: '商家正在准备发货，请耐心等待',
    shipping: '商品正在配送途中，请注意查收',
    completed: '感谢您的购买，期待您的再次光临',
    cancelled: '订单已取消',
    refunded: '退款已完成',
  }
  return map[status] || ''
}

const getPaymentText = (method) => {
  const map = {
    wechat: '微信支付',
    alipay: '支付宝',
  }
  return map[method] || method
}

async function loadOrder() {
  loading.value = true
  try {
    const data = await getOrderDetail(route.params.id)
    order.value = data
  } catch (e) {
    alert(e.message || '加载订单失败')
    router.push('/orders')
  } finally {
    loading.value = false
  }
}

async function cancelOrder() {
  if (!confirm('确定要取消订单吗？')) return
  try {
    await cancel(route.params.id)
    alert('订单已取消')
    loadOrder()
  } catch (e) {
    alert(e.message || '取消失败')
  }
}

async function payOrder() {
  try {
    await pay(route.params.id)
    alert('支付成功！')
    loadOrder()
  } catch (e) {
    alert(e.message || '支付失败')
  }
}

async function confirmReceipt() {
  if (!confirm('确认已收到商品？')) return
  try {
    await confirm(route.params.id)
    alert('已确认收货')
    loadOrder()
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

function goToBook(bookId) {
  router.push(`/book/${bookId}`)
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push(`/login?redirect=/order/${route.params.id}`)
    return
  }
  loadOrder()
})
</script>

<style scoped>
.order-detail-page {
  padding: 20px 0;
}

.order-status-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  color: #fff;
}

.status-info {
  margin-bottom: 24px;
}

.status-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 6px;
}

.status-desc {
  font-size: 14px;
  opacity: 0.9;
}

.status-steps {
  display: flex;
  justify-content: space-around;
}

.step-item {
  text-align: center;
  opacity: 0.5;
  position: relative;
  flex: 1;
}

.step-item.active {
  opacity: 1;
}

.step-item::after {
  content: '';
  position: absolute;
  top: 18px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  z-index: 0;
}

.step-item:last-child::after {
  display: none;
}

.step-item.active::after {
  background: rgba(255, 255, 255, 0.8);
}

.step-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 18px;
  position: relative;
  z-index: 1;
}

.step-item.active .step-icon {
  background: #fff;
  color: #667eea;
}

.step-label {
  font-size: 13px;
}

.detail-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.detail-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.address-info .receiver {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.address-info .phone {
  font-size: 13px;
  color: #999;
  font-weight: normal;
  margin-left: 12px;
}

.address-info .address {
  font-size: 14px;
  color: #666;
}

.goods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goods-item {
  display: grid;
  grid-template-columns: 60px 1fr 80px 60px 100px;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-cover {
  width: 50px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 24px;
}

.goods-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}

.goods-edition {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.goods-price {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.goods-qty {
  text-align: center;
  color: #999;
  font-size: 14px;
}

.goods-subtotal {
  text-align: right;
  color: #e63946;
  font-weight: 600;
  font-size: 15px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-label {
  color: #999;
}

.info-value {
  color: #333;
  font-family: monospace;
}

.detail-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 80px;
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
  font-size: 24px;
  font-weight: 700;
  color: #e63946;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-block {
  width: 100%;
}

.loading {
  text-align: center;
  padding: 80px;
  color: #999;
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
