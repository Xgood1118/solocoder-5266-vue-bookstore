<template>
  <div class="profile-page">
    <div class="container">
      <h1 class="page-title">个人中心</h1>

      <div class="profile-layout">
        <aside class="profile-sidebar">
          <div class="user-card">
            <div class="user-avatar">
              <span class="avatar-text">{{ userStore.user?.nickname?.[0] || '用' }}</span>
            </div>
            <h3 class="user-name">{{ userStore.user?.nickname || '用户' }}</h3>
            <p class="user-level" :class="userStore.user?.level">
              {{ getLevelName(userStore.user?.level) }}会员
            </p>
          </div>

          <nav class="side-menu">
            <button 
              :class="{ active: activeTab === 'info' }"
              class="menu-item"
              @click="activeTab = 'info'"
            >
              👤 个人信息
            </button>
            <button 
              :class="{ active: activeTab === 'orders' }"
              class="menu-item"
              @click="activeTab = 'orders'"
            >
              📦 我的订单
            </button>
            <button 
              :class="{ active: activeTab === 'favorites' }"
              class="menu-item"
              @click="activeTab = 'favorites'"
            >
              ❤️ 我的收藏
            </button>
            <button 
              :class="{ active: activeTab === 'coupons' }"
              class="menu-item"
              @click="activeTab = 'coupons'"
            >
              🎫 我的优惠
            </button>
            <button 
              :class="{ active: activeTab === 'member' }"
              class="menu-item"
              @click="activeTab = 'member'"
            >
              💎 会员中心
            </button>
          </nav>
        </aside>

        <div class="profile-main">
          <div v-if="activeTab === 'info'" class="tab-content">
            <h2 class="tab-title">个人信息</h2>
            <div class="info-form">
              <div class="form-group">
                <label>用户名</label>
                <input v-model="profileForm.username" disabled />
              </div>
              <div class="form-group">
                <label>昵称</label>
                <input v-model="profileForm.nickname" />
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input v-model="profileForm.email" />
              </div>
              <button class="btn btn-primary" @click="saveProfile">保存修改</button>
            </div>

            <h2 class="tab-title mt-40">修改密码</h2>
            <div class="info-form">
              <div class="form-group">
                <label>原密码</label>
                <input v-model="passwordForm.oldPassword" type="password" />
              </div>
              <div class="form-group">
                <label>新密码</label>
                <input v-model="passwordForm.newPassword" type="password" />
              </div>
              <div class="form-group">
                <label>确认新密码</label>
                <input v-model="passwordForm.confirmPassword" type="password" />
              </div>
              <button class="btn btn-primary" @click="handleChangePassword">修改密码</button>
            </div>
          </div>

          <div v-if="activeTab === 'orders'" class="tab-content">
            <h2 class="tab-title">最近订单</h2>
            <div class="order-shortcuts">
              <div class="shortcut-item">
                <span class="shortcut-icon">💰</span>
                <span class="shortcut-label">待付款</span>
                <span class="shortcut-count">{{ stats.pending || 0 }}</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-icon">📦</span>
                <span class="shortcut-label">待发货</span>
                <span class="shortcut-count">{{ stats.paid || 0 }}</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-icon">🚚</span>
                <span class="shortcut-label">待收货</span>
                <span class="shortcut-count">{{ stats.shipping || 0 }}</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-icon">✅</span>
                <span class="shortcut-label">已完成</span>
                <span class="shortcut-count">{{ stats.completed || 0 }}</span>
              </div>
            </div>
            <router-link to="/orders" class="view-all-link">查看全部订单 →</router-link>
          </div>

          <div v-if="activeTab === 'favorites'" class="tab-content">
            <h2 class="tab-title">我的收藏</h2>
            <div v-if="favorites.length === 0" class="empty">暂无收藏</div>
            <div v-else class="favorite-grid">
              <BookCard v-for="book in favorites" :key="book.id" :book="book" />
            </div>
          </div>

          <div v-if="activeTab === 'coupons'" class="tab-content">
            <h2 class="tab-title">我的优惠券</h2>
            <div v-if="coupons.length === 0" class="empty">暂无优惠券</div>
            <div v-else class="coupon-list">
              <div 
                v-for="coupon in coupons" 
                :key="coupon.id" 
                :class="{ used: coupon.status === 'used', expired: coupon.status === 'expired' }"
                class="coupon-card"
              >
                <div class="coupon-amount">
                  <span v-if="coupon.type === 'percent_off'">
                    {{ (coupon.discount_value / 10).toFixed(1) }}折
                  </span>
                  <span v-else>
                    ¥{{ formatPrice(coupon.discount_value) }}
                  </span>
                </div>
                <div class="coupon-detail">
                  <h4 class="coupon-name">{{ coupon.name }}</h4>
                  <p class="coupon-condition">满{{ formatPrice(coupon.min_amount) }}可用</p>
                  <p class="coupon-expire">{{ formatDate(coupon.expires_at) }}到期</p>
                </div>
                <div class="coupon-status">
                  <span v-if="coupon.status === 'available'" class="status-available">可使用</span>
                  <span v-else-if="coupon.status === 'used'" class="status-used">已使用</span>
                  <span v-else class="status-expired">已过期</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'member'" class="tab-content">
            <h2 class="tab-title">会员中心</h2>
            
            <div class="member-card" :class="userStore.user?.level">
              <div class="member-level">
                <span class="level-icon">💎</span>
                <span class="level-name">{{ getLevelName(userStore.user?.level) }}会员</span>
              </div>
              <div class="member-discount">
                专享 {{ getDiscountRate(userStore.user?.level) }} 折优惠
              </div>
              <div class="member-spend">
                累计消费：¥{{ formatPrice(userStore.user?.total_spend_cents || 0) }}
              </div>
            </div>

            <div class="level-rules">
              <h3 class="rules-title">会员等级规则</h3>
              <div class="level-list">
                <div class="level-item">
                  <span class="level-badge bronze">🥉 白银会员</span>
                  <span class="level-condition">累计消费 ¥0 - ¥499</span>
                  <span class="level-benefit">9.8折</span>
                </div>
                <div class="level-item">
                  <span class="level-badge gold">🥈 黄金会员</span>
                  <span class="level-condition">累计消费 ¥500 - ¥1999</span>
                  <span class="level-benefit">9.5折</span>
                </div>
                <div class="level-item">
                  <span class="level-badge diamond">💎 钻石会员</span>
                  <span class="level-condition">累计消费 ¥2000 以上</span>
                  <span class="level-benefit">9折</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { updateProfile, changePassword as changePasswordApi, getMyCoupons } from '@/api/user'
import { getMyFavorites } from '@/api/favorite'
import BookCard from '@/components/BookCard.vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('info')
const favorites = ref([])
const coupons = ref([])
const stats = ref({})

const profileForm = reactive({
  username: '',
  nickname: '',
  email: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const formatPrice = (cents) => (cents / 100).toFixed(2)

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

const getLevelName = (level) => {
  const map = {
    bronze: '白银',
    silver: '白银',
    gold: '黄金',
    diamond: '钻石',
  }
  return map[level] || '白银'
}

const getDiscountRate = (level) => {
  const map = {
    silver: 9.8,
    gold: 9.5,
    diamond: 9.0,
  }
  return map[level] || 9.8
}

async function saveProfile() {
  try {
    await updateProfile({
      nickname: profileForm.nickname,
      email: profileForm.email,
    })
    await userStore.fetchProfile()
    alert('保存成功')
  } catch (e) {
    alert(e.message || '保存失败')
  }
}

async function handleChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    alert('请填写完整')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    alert('新密码至少6位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('两次密码不一致')
    return
  }
  
  try {
    await changePasswordApi(passwordForm.oldPassword, passwordForm.newPassword)
    alert('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e) {
    alert(e.message || '修改失败')
  }
}

async function loadFavorites() {
  try {
    const data = await getMyFavorites({ pageSize: 20 })
    favorites.value = data.list || []
  } catch (e) {
    console.error('加载收藏失败', e)
  }
}

async function loadCoupons() {
  try {
    const data = await getMyCoupons()
    coupons.value = data.list || []
  } catch (e) {
    console.error('加载优惠券失败', e)
    coupons.value = []
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/profile')
    return
  }
  
  if (userStore.user) {
    profileForm.username = userStore.user.username || ''
    profileForm.nickname = userStore.user.nickname || ''
    profileForm.email = userStore.user.email || ''
  }
})
</script>

<style scoped>
.profile-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.profile-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.profile-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.user-avatar {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.avatar-text {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.user-level {
  font-size: 13px;
  color: #999;
}

.user-level.silver { color: #c0c0c0; }
.user-level.gold { color: #ffd700; }
.user-level.diamond { color: #b9f2ff; }

.side-menu {
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.menu-item {
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
  color: #333;
}

.menu-item.active {
  background: #fff5f5;
  color: #e63946;
  font-weight: 500;
}

.profile-main {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.mt-40 {
  margin-top: 40px;
}

.info-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.form-group input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:disabled {
  background: #f5f5f5;
  color: #999;
}

.order-shortcuts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.shortcut-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.shortcut-item:hover {
  background: #fff5f5;
  transform: translateY(-2px);
}

.shortcut-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.shortcut-label {
  font-size: 13px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.shortcut-count {
  font-size: 20px;
  font-weight: 600;
  color: #e63946;
}

.view-all-link {
  display: block;
  text-align: right;
  color: #1976d2;
  font-size: 13px;
}

.view-all-link:hover {
  text-decoration: underline;
}

.favorite-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.empty {
  text-align: center;
  padding: 60px;
  color: #999;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-card {
  display: flex;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.coupon-amount {
  width: 120px;
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
}

.coupon-card.used .coupon-amount,
.coupon-card.expired .coupon-amount {
  background: #ccc;
}

.coupon-detail {
  flex: 1;
  padding: 14px 16px;
}

.coupon-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.coupon-condition {
  font-size: 13px;
  color: #999;
  margin-bottom: 2px;
}

.coupon-expire {
  font-size: 12px;
  color: #bbb;
}

.coupon-status {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px dashed #eee;
}

.status-available {
  color: #4caf50;
  font-size: 13px;
}

.status-used,
.status-expired {
  color: #999;
  font-size: 13px;
}

.member-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 28px;
  color: #fff;
  margin-bottom: 24px;
}

.member-card.gold {
  background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
}

.member-card.diamond {
  background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
}

.member-level {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.level-icon {
  font-size: 28px;
}

.level-name {
  font-size: 20px;
  font-weight: 600;
}

.member-discount {
  font-size: 16px;
  margin-bottom: 8px;
  opacity: 0.95;
}

.member-spend {
  font-size: 14px;
  opacity: 0.85;
}

.level-rules {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
}

.rules-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
}

.level-badge {
  font-size: 15px;
  font-weight: 500;
  min-width: 100px;
}

.level-condition {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.level-benefit {
  font-size: 14px;
  color: #e63946;
  font-weight: 500;
}
</style>
