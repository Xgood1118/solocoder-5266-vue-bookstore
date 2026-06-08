import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, logout, getProfile } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setUser(userData) {
    user.value = userData
  }

  function setToken(newToken, newRefreshToken) {
    token.value = newToken
    refreshToken.value = newRefreshToken
    localStorage.setItem('token', newToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  function clearUser() {
    user.value = null
    token.value = ''
    refreshToken.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  async function doLogin(credentials) {
    const data = await login(credentials)
    setToken(data.accessToken, data.refreshToken)
    setUser({
      id: data.userId,
      username: data.username,
      email: data.email,
      nickname: data.nickname,
      avatar: data.avatar,
      memberLevel: data.memberLevel,
      totalSpend: data.totalSpend,
    })
    localStorage.setItem('user', JSON.stringify(user.value))
    return data
  }

  async function doRegister(credentials) {
    const data = await register(credentials)
    setToken(data.accessToken, data.refreshToken)
    setUser({
      id: data.userId,
      username: data.username,
      email: data.email,
      nickname: data.nickname,
      avatar: data.avatar,
      memberLevel: 'silver',
      totalSpend: 0,
    })
    localStorage.setItem('user', JSON.stringify(user.value))
    return data
  }

  async function doLogout() {
    try {
      await logout(refreshToken.value)
    } catch (e) {
      // ignore
    }
    clearUser()
  }

  async function fetchProfile() {
    if (!token.value) return null
    try {
      const data = await getProfile()
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (e) {
      clearUser()
      throw e
    }
  }

  function initFromStorage() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        user.value = null
      }
    }
  }

  return {
    user,
    token,
    refreshToken,
    isLoggedIn,
    setUser,
    setToken,
    clearUser,
    doLogin,
    doRegister,
    doLogout,
    fetchProfile,
    initFromStorage,
  }
})
