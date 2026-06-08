<template>
  <div class="checkout-page">
    <div class="container">
      <h1 class="page-title">确认订单</h1>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="items.length === 0" class="empty">
        <p>没有可结算的商品</p>
        <router-link to="/cart" class="btn btn-primary">返回购物车</router-link>
      </div>

      <div v-else class="checkout-layout">
        <div class="checkout-main">
          <div class="section-card">
            <h2 class="section-title">收货地址</h2>
            <div class="address-list">
              <div 
                v-for="addr in addresses" 
                :key="addr.id"
                :class="{ active: selectedAddress?.id === addr.id }"
                class="address-item"
                @click="selectedAddress = addr"
              >
                <div class="address-info">
                  <p class="address-name">
                    {{ addr.receiver_name }}
                    <span class="address-phone">{{ addr.phone }}</span>
                  </p>
                  <p class="address-detail">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</p>
                </div>
                <div v-if="addr.is_default" class="default-tag">默认</div>
              </div>
            </div>
            <button class="add-address-btn">+ 添加新地址</button>
          </div>

          <div class="section-card">
            <h2 class="section-title">商品清单</h2>
            <div class="goods-list">
              <div v-for="item in items" :key="item.sku_id" class="goods-item">
                <div class="goods-cover">
                  <span class="cover-icon">📖</span>
                </div>
                <div class="goods-info">
                  <h3 class="goods-title ellipsis-2">{{ item.sku_name || item.book_title }}</h3>
                  <p class="goods-edition">版本：{{ item.edition || '平装' }}</p>
                </div>
                <div class="goods-price">¥{{ formatPrice(item.price_cents) }}</div>
                <div class="goods-qty">×{{ item.quantity }}</div>
                <div class="goods-subtotal">¥{{ formatPrice(item.price_cents * item.quantity) }}</div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">支付方式</h2>
            <div class="payment-options">
              <div 
                :class="{ active: paymentMethod === 'wechat' }"
                class="payment-option"
                @click="paymentMethod = 'wechat'"
              >
                <span class="payment-icon">💚</span>
                <span class="payment-name">微信支付</span>
              </div>
              <div 
                :class="{ active: paymentMethod === 'alipay' }"
                class="payment-option"
                @click="paymentMethod = 'alipay'"
              >
                <span class="payment-icon">💙</span>
                <span class="payment-name">支付宝</span>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">优惠券</h2>
            <div class="coupon-selector">
              <div v-if="availableCoupons.length === 0" class="no-coupon">
                暂无可用优惠券
              </div>
              <div v-else class="coupon-list">
                <div 
                  v-for="coupon in availableCoupons" 
                  :key="coupon.id"
                  :class="{ active: selectedCoupon?.id === coupon.id }"
                  class="coupon-item"
                  @click="selectCoupon(coupon)"
                >
                  <div class="coupon-amount">
                    <span v-if="coupon.type === 'percent_off'">{{ (coupon.discount_value / 10) }}折</span>
                    <span v-else>¥{{ formatPrice(coupon.discount_value) }}</span>
                  </div>
                  <div class="coupon-info">
                    <p class="coupon-name">{{ coupon.name }}</p>
                    <p class="coupon-condition">满{{ formatPrice(coupon.min_amount) }}可用</p>
                    <p class="coupon-expire">{{ formatDate(coupon.expires_at) }}到期</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="checkout-sidebar">
          <div class="summary-card">
            <h3 class="card-title">订单摘要</h3>
            
            <div class="summary-row">
              <span>商品件数</span>
              <span>{{ totalCount }} 件</span>
            </div>
            <div class="summary-row">
              <span>商品总额</span>
              <span>¥{{ formatPrice(totalAmount) }}</span>
            </div>
            <div class="summary-row">
              <span>运费</span>
              <span>¥{{ formatPrice(shippingFee) }}</span>
            </div>
            <div class="summary-row discount">
              <span>会员折扣</span>
              <span>-¥{{ formatPrice(memberDiscount) }}</span>
            </div>
            <div class="summary-row discount" v-if="selectedCoupon">
              <span>优惠券</span>
              <span>-¥{{ formatPrice(couponDiscount) }}</span>
            </div>
            
            <div class="summary-total">
              <span>应付总额</span>
              <span class="total">¥{{ formatPrice(finalAmount) }}</span>
            </div>

            <button 
              class="btn btn-primary btn-lg btn-block" 
              :disabled="submitting"
              @click="submitOrder"
            >
              {{ submitting ? '提交中...' : '提交订单' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createOrder, getAvailableCoupons } from '@/api/order'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const items = ref([])
const addresses = ref([
  {
    id: 1,
    receiver_name: '测试用户',
    phone: '138****8888',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '某某大街123号某某小区1号楼101室',
    is_default: true,
  }
])
const selectedAddress = ref(null)
const paymentMethod = ref('wechat')
const availableCoupons = ref([])
const selectedCoupon = ref(null)

const formatPrice = (cents) => (cents / 100).toFixed(2)

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

const totalCount = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity, 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
})

const shippingFee = computed(() => {
  return totalAmount.value >= 9900 ? 0 : 1000
})

const memberDiscount = computed(() => {
  if (!userStore.user?.level) return 0
  const rates = { silver: 0.98, gold: 0.95, diamond: 0.9 }
  const rate = rates[userStore.user.level] || 1
  return Math.floor(totalAmount.value * (1 - rate))
})

const couponDiscount = computed(() => {
  if (!selectedCoupon.value) return 0
  const coupon = selectedCoupon.value
  if (coupon.type === 'amount_off') {
    return coupon.discount_value
  } else if (coupon.type === 'percent_off') {
    return Math.floor(totalAmount.value * (1 - coupon.discount_value / 100))
  } else if (coupon.type === 'single') {
    return coupon.discount_value
  }
  return 0
})

const finalAmount = computed(() => {
  let amount = totalAmount.value + shippingFee.value
  amount -= memberDiscount.value
  amount -= couponDiscount.value
  return Math.max(amount, 1)
})

async function loadCheckoutItems() {
  loading.value = true
  try {
    const stored = localStorage.getItem('checkoutItems')
    if (stored) {
      const checkoutItems = JSON.parse(stored)
      
      await cartStore.fetchCart()
      
      items.value = checkoutItems.map(ci => {
        const cartItem = cartStore.items.find(i => i.sku_id === ci.skuId)
        if (cartItem) {
          return {
            ...cartItem,
            quantity: ci.quantity,
          }
        }
        return {
          sku_id: ci.skuId,
          quantity: ci.quantity,
          price_cents: 4500,
          sku_name: '未知商品',
          book_title: '未知商品',
          edition: '平装',
        }
      })
    }
    
    selectedAddress.value = addresses.value.find(a => a.is_default) || addresses.value[0]
    
    await loadAvailableCoupons()
  } catch (e) {
    console.error('加载结算信息失败', e)
  } finally {
    loading.value = false
  }
}

async function loadAvailableCoupons() {
  try {
    const data = await getAvailableCoupons({ amount: totalAmount.value })
    availableCoupons.value = data.list || []
  } catch (e) {
    console.error('加载可用优惠券失败', e)
    availableCoupons.value = []
  }
}

function selectCoupon(coupon) {
  if (selectedCoupon.value?.id === coupon.id) {
    selectedCoupon.value = null
  } else {
    selectedCoupon.value = coupon
  }
}

async function submitOrder() {
  if (!selectedAddress.value) {
    alert('请选择收货地址')
    return
  }
  
  submitting.value = true
  try {
    const orderItems = items.value.map(item => ({
      sku_id: item.sku_id,
      quantity: item.quantity,
      price_cents: item.price_cents,
    }))
    
    const data = await createOrder({
      items: orderItems,
      address_id: selectedAddress.value.id,
      coupon_id: selectedCoupon.value?.id,
      payment_method: paymentMethod.value,
    })
    
    alert('订单创建成功！')
    localStorage.removeItem('checkoutItems')
    router.push(`/order/${data.order_id}`)
  } catch (e) {
    alert(e.message || '下单失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/checkout')
    return
  }
  loadCheckoutItems()
})
</script>

<style scoped>
.checkout-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.checkout-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.checkout-main {
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

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.address-item:hover {
  border-color: #e63946;
}

.address-item.active {
  border-color: #e63946;
  background: #fff5f5;
}

.address-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.address-phone {
  font-size: 13px;
  color: #999;
  font-weight: normal;
  margin-left: 12px;
}

.address-detail {
  font-size: 13px;
  color: #666;
}

.default-tag {
  background: #e63946;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.add-address-btn {
  margin-top: 12px;
  width: 100%;
  padding: 12px;
  border: 1px dashed #ddd;
  background: #fafafa;
  border-radius: 8px;
  color: #999;
  cursor: pointer;
  font-size: 13px;
}

.add-address-btn:hover {
  border-color: #e63946;
  color: #e63946;
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
  font-size: 14px;
  color: #666;
  text-align: center;
}

.goods-qty {
  font-size: 14px;
  color: #999;
  text-align: center;
}

.goods-subtotal {
  font-size: 15px;
  font-weight: 600;
  color: #e63946;
  text-align: right;
}

.payment-options {
  display: flex;
  gap: 16px;
}

.payment-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option:hover {
  border-color: #e63946;
}

.payment-option.active {
  border-color: #e63946;
  background: #fff5f5;
}

.payment-icon {
  font-size: 24px;
}

.payment-name {
  font-size: 14px;
  color: #333;
}

.coupon-selector {
  max-height: 300px;
  overflow-y: auto;
}

.no-coupon {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coupon-item {
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.coupon-item:hover {
  border-color: #e63946;
}

.coupon-item.active {
  border-color: #e63946;
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.15);
}

.coupon-amount {
  width: 100px;
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
  text-align: center;
  padding: 16px 0;
  font-size: 22px;
  font-weight: 700;
}

.coupon-info {
  flex: 1;
  padding: 12px 16px;
}

.coupon-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.coupon-condition {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.coupon-expire {
  font-size: 11px;
  color: #bbb;
}

.checkout-sidebar {
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

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
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
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
}

.summary-total .total {
  font-size: 26px;
  font-weight: 700;
  color: #e63946;
}

.btn-block {
  width: 100%;
  margin-top: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty {
  background: #fff;
  border-radius: 12px;
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
