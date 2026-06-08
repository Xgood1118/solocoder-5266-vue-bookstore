<template>
  <div class="coupons-page">
    <div class="container">
      <h1 class="page-title">优惠券中心</h1>

      <div class="coupon-tabs">
        <button
          :class="{ active: activeTab === 'available' }"
          class="tab-btn"
          @click="activeTab = 'available'"
        >
          可领取
        </button>
        <button
          :class="{ active: activeTab === 'mine' }"
          class="tab-btn"
          @click="activeTab = 'mine'"
        >
          我的优惠券
        </button>
      </div>

      <div v-if="activeTab === 'available'">
        <div v-if="loadingAvailable" class="loading">加载中...</div>
        <div v-else-if="availableCoupons.length === 0" class="empty">暂无可领取优惠券</div>
        <div v-else class="coupon-grid">
          <div v-for="coupon in availableCoupons" :key="coupon.id" class="coupon-card">
            <div class="coupon-left">
              <div class="coupon-amount">
                <span v-if="coupon.type === 'percent_off'">
                  {{ (coupon.discount_value / 10).toFixed(0) }}折
                </span>
                <span v-else>
                  ¥{{ formatPrice(coupon.discount_value) }}
                </span>
              </div>
              <p class="coupon-condition">满{{ formatPrice(coupon.min_amount) }}可用</p>
            </div>
            <div class="coupon-right">
              <h3 class="coupon-name">{{ coupon.name }}</h3>
              <p class="coupon-type">{{ getCouponTypeText(coupon.type) }}</p>
              <p class="coupon-expire">有效期至 {{ formatDate(coupon.end_time) }}</p>
              <button 
                class="claim-btn"
                :disabled="coupon.claimed"
                @click="claimCoupon(coupon)"
              >
                {{ coupon.claimed ? '已领取' : '立即领取' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'mine'">
        <div v-if="loadingMine" class="loading">加载中...</div>
        <div v-else-if="myCoupons.length === 0" class="empty">暂无优惠券</div>
        <div v-else class="coupon-list">
          <div 
            v-for="coupon in myCoupons" 
            :key="coupon.id" 
            :class="{ used: coupon.status === 'used', expired: coupon.status === 'expired' }"
            class="coupon-row"
          >
            <div class="coupon-info">
              <div class="coupon-amount-small">
                <span v-if="coupon.type === 'percent_off'">{{ (coupon.discount_value / 10).toFixed(0) }}折</span>
                <span v-else>¥{{ formatPrice(coupon.discount_value) }}</span>
              </div>
              <div class="coupon-detail">
                <h4 class="coupon-name">{{ coupon.name }}</h4>
                <p class="coupon-condition">满{{ formatPrice(coupon.min_amount) }}可用</p>
                <p class="coupon-expire">{{ formatDate(coupon.expires_at) }}到期</p>
              </div>
            </div>
            <div class="coupon-action">
              <span v-if="coupon.status === 'available'" class="status-available">可使用</span>
              <span v-else-if="coupon.status === 'used'" class="status-used">已使用</span>
              <span v-else class="status-expired">已过期</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCouponList, claimCoupon as claim } from '@/api/coupon'
import { getMyCoupons as getMine } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('available')
const availableCoupons = ref([])
const myCoupons = ref([])
const loadingAvailable = ref(true)
const loadingMine = ref(false)

const formatPrice = (cents) => (cents / 100).toFixed(2)

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

const getCouponTypeText = (type) => {
  const map = {
    amount_off: '满减券',
    percent_off: '折扣券',
    single: '单品券',
  }
  return map[type] || '优惠券'
}

async function loadAvailableCoupons() {
  loadingAvailable.value = true
  try {
    const data = await getCouponList({ status: 'active' })
    availableCoupons.value = (data.list || []).map(c => ({ ...c, claimed: false }))
  } catch (e) {
    console.error('加载优惠券失败', e)
    availableCoupons.value = []
  } finally {
    loadingAvailable.value = false
  }
}

async function loadMyCoupons() {
  if (!userStore.isLoggedIn) return
  
  loadingMine.value = true
  try {
    const data = await getMine()
    myCoupons.value = data.list || []
  } catch (e) {
    console.error('加载我的优惠券失败', e)
    myCoupons.value = []
  } finally {
    loadingMine.value = false
  }
}

async function claimCoupon(coupon) {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/coupons')
    return
  }
  
  try {
    await claim(coupon.code)
    coupon.claimed = true
    alert('领取成功')
  } catch (e) {
    alert(e.message || '领取失败')
  }
}

watch(activeTab, (val) => {
  if (val === 'mine') {
    loadMyCoupons()
  }
})

onMounted(() => {
  loadAvailableCoupons()
})
</script>

<style scoped>
.coupons-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.coupon-tabs {
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
  padding: 8px 24px;
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

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.coupon-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.coupon-left {
  width: 160px;
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
  padding: 24px 16px;
  text-align: center;
  position: relative;
}

.coupon-left::before {
  content: '';
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  background: #f5f5f5;
  border-radius: 50%;
}

.coupon-left::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  background: #f5f5f5;
  border-radius: 50%;
}

.coupon-amount {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 6px;
}

.coupon-condition {
  font-size: 12px;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.coupon-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.coupon-type {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.coupon-expire {
  font-size: 12px;
  color: #bbb;
  flex: 1;
}

.claim-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-start;
  transition: all 0.2s;
}

.claim-btn:hover:not(:disabled) {
  background: #d32f2f;
}

.claim-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.coupon-row.used,
.coupon-row.expired {
  opacity: 0.6;
}

.coupon-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.coupon-amount-small {
  width: 80px;
  font-size: 24px;
  font-weight: 700;
  color: #e63946;
  text-align: center;
}

.coupon-row.used .coupon-amount-small,
.coupon-row.expired .coupon-amount-small {
  color: #999;
}

.coupon-detail {
  min-width: 0;
}

.coupon-detail .coupon-name {
  font-size: 15px;
  margin-bottom: 4px;
}

.coupon-detail .coupon-condition {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}

.coupon-detail .coupon-expire {
  font-size: 12px;
  color: #999;
}

.coupon-action {
  flex-shrink: 0;
}

.status-available {
  color: #4caf50;
  font-size: 14px;
  font-weight: 500;
}

.status-used,
.status-expired {
  color: #999;
  font-size: 14px;
}

.loading, .empty {
  text-align: center;
  padding: 60px;
  color: #999;
  background: #fff;
  border-radius: 12px;
}
</style>
