import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { searchBooks } from '@/api/book'

export function useSearch() {
  const userStore = useUserStore()
  
  const keyword = ref('')
  const results = ref([])
  const loading = ref(false)
  const history = ref([])
  const showHistory = ref(false)

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('search_history')
      if (saved) {
        history.value = JSON.parse(saved)
      }
    } catch (e) {
      history.value = []
    }
  }

  const saveHistory = (kw) => {
    if (!kw) return
    const filtered = history.value.filter(h => h !== kw)
    filtered.unshift(kw)
    history.value = filtered.slice(0, 10)
    localStorage.setItem('search_history', JSON.stringify(history.value))
  }

  const clearHistory = () => {
    history.value = []
    localStorage.removeItem('search_history')
  }

  const doSearch = async (kw) => {
    if (!kw) return
    keyword.value = kw
    loading.value = true
    
    try {
      const data = await searchBooks({ keyword: kw, pageSize: 20 })
      results.value = data.list || []
      saveHistory(kw)
    } catch (e) {
      results.value = []
    } finally {
      loading.value = false
    }
  }

  const addToHistory = (kw) => {
    saveHistory(kw)
  }

  loadHistory()

  return {
    keyword,
    results,
    loading,
    history,
    showHistory,
    doSearch,
    clearHistory,
    addToHistory,
    loadHistory,
  }
}
