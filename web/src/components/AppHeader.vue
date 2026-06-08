<template>
  <header class="app-header">
    <div class="container header-inner">
      <div class="logo" @click="goHome">
        <span class="logo-icon">📚</span>
        <span class="logo-text">云端书店</span>
      </div>

      <div class="search-bar">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索书名、ISBN、作者..."
          @keyup.enter="search"
        />
        <button class="search-btn" @click="search">搜索</button>
      </div>

      <nav class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/books" class="nav-link">书城</router-link>
        <router-link to="/ranking" class="nav-link">榜单</router-link>
        <router-link to="/cart" class="nav-link cart-link">
          购物车
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </router-link>
      </nav>

      <div class="user-area">
        <template v-if="isLoggedIn">
          <router-link to="/profile" class="user-link">{{ user?.nickname || user?.username }}</router-link>
          <span class="divider">|</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </template>
        <template v-else>
          <router-link to="/login" class="login-link">登录</router-link>
          <router-link to="/register" class="register-btn">注册</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const keyword = ref('')

const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)
const cartCount = computed(() => cartStore.totalCount)

function goHome() {
  router.push('/')
}

function search() {
  if (keyword.value.trim()) {
    router.push({ path: '/books', query: { keyword: keyword.value } })
  }
}

async function handleLogout() {
  await userStore.doLogout()
  cartStore.reset()
  router.push('/')
}

onMounted(() => {
  userStore.initFromStorage()
  if (userStore.isLoggedIn) {
    cartStore.fetchCart()
  }
})
</script>

<style scoped>
.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  height: 64px;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #e63946;
}

.search-bar {
  flex: 1;
  max-width: 500px;
  display: flex;
  height: 38px;
  border: 2px solid #e63946;
  border-radius: 4px;
  overflow: hidden;
}

.search-bar input {
  flex: 1;
  border: none;
  padding: 0 12px;
  font-size: 14px;
}

.search-btn {
  width: 80px;
  background: #e63946;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background: #d62828;
}

.nav-links {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}

.nav-link {
  color: #333;
  font-size: 14px;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #e63946;
}

.cart-link {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background: #e63946;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: 14px;
}

.user-link {
  color: #333;
}

.user-link:hover {
  color: #e63946;
}

.divider {
  color: #ddd;
}

.logout-btn {
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  color: #e63946;
}

.login-link {
  color: #666;
}

.login-link:hover {
  color: #e63946;
}

.register-btn {
  background: #e63946;
  color: #fff;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.register-btn:hover {
  background: #d62828;
}
</style>
