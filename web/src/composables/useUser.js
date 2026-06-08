import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function useUser() {
  const userStore = useUserStore()
  const router = useRouter()

  const user = computed(() => userStore.user)
  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const token = computed(() => userStore.token)

  const doLogin = async (form) => {
    return await userStore.doLogin(form)
  }

  const doRegister = async (form) => {
    return await userStore.doRegister(form)
  }

  const doLogout = async () => {
    return await userStore.doLogout()
  }

  const fetchProfile = async () => {
    return await userStore.fetchProfile()
  }

  const requireLogin = (redirect = null) => {
    if (!isLoggedIn.value) {
      const r = redirect || window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(r)}`)
      return false
    }
    return true
  }

  const getLevelName = (level) => {
    const map = {
      silver: '白银',
      gold: '黄金',
      diamond: '钻石',
    }
    return map[level] || '白银'
  }

  const getMemberDiscount = (level) => {
    const rates = {
      silver: 0.98,
      gold: 0.95,
      diamond: 0.9,
    }
    return rates[level] || 1
  }

  return {
    user,
    isLoggedIn,
    token,
    doLogin,
    doRegister,
    doLogout,
    fetchProfile,
    requireLogin,
    getLevelName,
    getMemberDiscount,
  }
}
