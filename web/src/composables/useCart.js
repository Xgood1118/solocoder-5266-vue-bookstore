import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'

export function useCart() {
  const cart = useCartStore()

  const items = computed(() => cart.items)
  const totalCount = computed(() => cart.totalCount)
  const totalAmount = computed(() => cart.totalAmount)
  const selectedItems = computed(() => cart.selectedItems)
  const selectedTotal = computed(() => cart.selectedTotal)
  const selectedCount = computed(() => {
    return cart.selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  })

  const fetchCart = async () => {
    return await cart.fetchCart()
  }

  const addItem = async (skuId, quantity = 1) => {
    return await cart.addItem(skuId, quantity)
  }

  const updateItem = async (skuId, quantity) => {
    return await cart.updateItem(skuId, quantity)
  }

  const removeItem = async (skuId) => {
    return await cart.removeItem(skuId)
  }

  const clearAll = async () => {
    return await cart.clearAll()
  }

  const toggleSelect = (skuId) => {
    cart.toggleSelect(skuId)
  }

  const toggleSelectAll = (selected) => {
    cart.toggleSelectAll(selected)
  }

  return {
    items,
    totalCount,
    totalAmount,
    selectedItems,
    selectedTotal,
    selectedCount,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearAll,
    toggleSelect,
    toggleSelectAll,
  }
}
