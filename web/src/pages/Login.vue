<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>📚 云端书店</h1>
          <p>欢迎回来，请登录您的账户</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="form.username" 
              type="text" 
              placeholder="请输入用户名"
              required
            />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码"
              required
            />
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-lg btn-block"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </button>

          <div class="login-tips">
            <p>测试账号：testuser / 123456</p>
          </div>
        </form>

        <div class="login-footer">
          还没有账户？
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()

const loading = ref(false)
const form = reactive({
  username: 'testuser',
  password: '123456'
})

async function handleLogin() {
  loading.value = true
  try {
    await userStore.doLogin(form)
    await cartStore.fetchCart()
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    alert(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #e63946;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #e63946;
  outline: none;
}

.btn-block {
  width: 100%;
}

.login-tips {
  margin-top: 16px;
  text-align: center;
}

.login-tips p {
  font-size: 12px;
  color: #bbb;
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #999;
}

.register-link {
  color: #e63946;
  font-weight: 500;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
