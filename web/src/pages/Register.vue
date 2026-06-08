<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>📚 加入云端书店</h1>
          <p>创建账户，开启阅读之旅</p>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
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
            <label>邮箱</label>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label>昵称</label>
            <input 
              v-model="form.nickname" 
              type="text" 
              placeholder="请输入昵称（选填）"
            />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>

          <div class="form-group">
            <label>确认密码</label>
            <input 
              v-model="form.confirmPassword" 
              type="password" 
              placeholder="请再次输入密码"
              required
            />
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-lg btn-block"
            :disabled="loading"
          >
            {{ loading ? '注册中...' : '注 册' }}
          </button>
        </form>

        <div class="register-footer">
          已有账户？
          <router-link to="/login" class="login-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive({
  username: '',
  email: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

async function handleRegister() {
  if (form.password.length < 6) {
    alert('密码至少6位')
    return
  }
  if (form.password !== form.confirmPassword) {
    alert('两次密码输入不一致')
    return
  }

  loading.value = true
  try {
    await userStore.doRegister({
      username: form.username,
      email: form.email,
      password: form.password,
      nickname: form.nickname || form.username,
    })
    alert('注册成功！')
    router.push('/')
  } catch (e) {
    alert(e.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-container {
  width: 100%;
  max-width: 440px;
}

.register-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #e63946;
  margin-bottom: 8px;
}

.register-header p {
  color: #999;
  font-size: 14px;
}

.register-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
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
  height: 42px;
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

.register-footer {
  text-align: center;
  font-size: 14px;
  color: #999;
}

.login-link {
  color: #e63946;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
