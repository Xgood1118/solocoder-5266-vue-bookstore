import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '@/api/cart'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const totalAmount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  })

  const selectedItems = computed(() => items.value.filter(item => item.selected))

  const selectedTotal = computed(() => {
    return selectedItems.value.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  })

  async function fetchCart() {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      items.value = []
      return
    }
    loading.value = true
    try {
      const data = await getCart()
      items.value = data.list.map(item => ({ ...item, selected: true }))
    } finally {
      loading.value = false
    }
  }

  async function addItem(skuId, quantity = 1) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }
    await addToCart(skuId, quantity)
    await fetchCart()
  }

  async function updateItem(skuId, quantity) {
    await updateCartItem(skuId, quantity)
    await fetchCart()
  }

  async function removeItem(skuId) {
    await removeFromCart(skuId)
    await fetchCart()
  }

  async function clearAll() {
    await clearCart()
    items.value = []
  }

  function toggleSelect(skuId) {
    const item = items.value.find(i => i.sku_id === skuId)
    if (item) {
      item.selected = !item.selected
    }
  }

  function toggleSelectAll(selected) {
    items.value.forEach(item => {
      item.selected = selected
    })
  }

  function clearSelectedItems(skuIds) {
    items.value = items.value.filter(item => !skuIds.includes(item.sku_id))
  }

  function reset() {
    items.value = []
  }

  return {
    items,
    loading,
    totalCount,
    totalAmount,
    selectedItems,
    selectedTotal,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearAll,
    toggleSelect,
    toggleSelectAll,
    clearSelectedItems,
    reset,
  }
})
