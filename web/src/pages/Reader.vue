<template>
  <div class="reader-page">
    <div class="reader-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">← 返回</button>
        <span class="book-title" v-if="bookInfo">{{ bookInfo.title }}</span>
      </div>
      <div class="header-center">
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
      </div>
      <div class="header-right">
        <button class="control-btn" :disabled="currentPage <= 1" @click="prevPage">◀ 上一页</button>
        <div class="page-input">
          <input 
            type="number" 
            v-model.number="pageInput" 
            @keyup.enter="goToPage(pageInput)"
            :max="totalPages"
            min="1"
          />
          <span>/ {{ totalPages }}</span>
        </div>
        <button class="control-btn" :disabled="currentPage >= totalPages" @click="nextPage">下一页 ▶</button>
      </div>
    </div>

    <div class="reader-content">
      <div class="sidebar">
        <div class="sidebar-title">📖 试读说明</div>
        <div class="sidebar-content">
          <p>• 本书共 {{ totalPages }} 页</p>
          <p>• 免费试读前 {{ trialPages }} 页（约30%）</p>
          <p>• 喜欢请购买完整版</p>
        </div>
        
        <div class="sidebar-title mt-20">🔥 热门标签</div>
        <div class="tag-cloud">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <button v-if="bookInfo" class="buy-btn btn btn-primary btn-block" @click="goBuy">
          购买完整版
        </button>
      </div>

      <div class="pdf-container">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>正在加载第 {{ currentPage }} 页...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>❌ {{ error }}</p>
          <button class="retry-btn" @click="loadPage">重试</button>
        </div>

        <canvas v-show="!loading && !error" ref="canvasRef" class="pdf-canvas"></canvas>
        
        <div v-if="!loading && !error && currentPage >= trialPages" class="trial-end-overlay">
          <div class="trial-end-card">
            <h3>📚 试读结束</h3>
            <p>您已阅读完免费试读部分，喜欢请购买完整版</p>
            <button class="btn btn-primary btn-lg" @click="goBuy">立即购买</button>
            <p class="trial-info">试读：{{ trialPages }} / {{ totalPages }} 页 (约30%)</p>
          </div>
        </div>
      </div>
    </div>

    <div class="reader-footer">
      <div class="progress-bar" @click="onProgressClick">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBookDetail } from '@/api/book'
import { getTrialInfo } from '@/api/pdf'

const route = useRoute()
const router = useRouter()

const bookInfo = ref(null)
const trialInfo = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const trialPages = ref(0)
const loading = ref(false)
const error = ref('')
const canvasRef = ref(null)
const pageInput = ref(1)

const tags = ['精彩', '值得一读', '引人入胜', '文笔优美', '剧情紧凑']

const progressPercent = computed(() => {
  if (totalPages.value <= 0) return 0
  return Math.min((currentPage.value / totalPages.value) * 100, 100)
})

async function loadBookInfo() {
  try {
    const data = await getBookDetail(route.params.id)
    bookInfo.value = data
  } catch (e) {
    console.error('加载书籍信息失败', e)
  }
}

async function loadTrialInfo() {
  try {
    const data = await getTrialInfo(route.params.id)
    trialInfo.value = data
    totalPages.value = data.total_pages || 100
    trialPages.value = data.trial_pages || 30
  } catch (e) {
    console.error('加载试读信息失败', e)
    totalPages.value = 100
    trialPages.value = 30
  }
}

async function loadPage() {
  if (currentPage.value > trialPages.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const canvas = canvasRef.value
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    const imgWidth = 600
    const imgHeight = 850
    canvas.width = imgWidth
    canvas.height = imgHeight
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, imgWidth, imgHeight)
    
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 24px serif'
    ctx.textAlign = 'center'
    ctx.fillText(bookInfo.value?.title || '书籍标题', imgWidth / 2, 80)
    
    ctx.font = '14px sans-serif'
    ctx.fillStyle = '#888'
    ctx.fillText(`作者：${bookInfo.value?.author_name || '未知'}`, imgWidth / 2, 110)
    
    ctx.strokeStyle = '#dddddd'
    ctx.beginPath()
    ctx.moveTo(60, 140)
    ctx.lineTo(imgWidth - 60, 140)
    ctx.stroke()
    
    ctx.fillStyle = '#444444'
    ctx.font = '16px serif'
    ctx.textAlign = 'justify'
    const lineHeight = 28
    let y = 180
    
    const paragraphs = [
      '这是本书的第 ' + currentPage.value + ' 页内容。在真实场景中，这里会显示 PDF 文档的实际内容，通过 PDF.js 进行流式渲染。',
      '',
      '我们采用流式传输技术，仅加载当前页面的内容，而不是一次性下载整本 PDF，这样可以：',
      '• 保护版权，防止完整 PDF 被下载',
      '• 加快加载速度，提升用户体验',
      '• 节省带宽成本',
      '',
      '每本书提供前 30% 的免费试读内容，让读者在购买前就能充分了解书籍质量。这种试读模式已经被证明可以有效提升转化率。',
      '',
      '阅读体验是我们非常看重的一点。我们使用业界领先的 PDF 渲染技术，确保文字清晰、翻页流畅，带给您接近纸质书的阅读感受。',
      '',
      '支持多种阅读方式：单页模式、双页模式、滚动模式，以及夜间模式等，满足不同场景下的阅读需求。',
      '',
      '（本页为模拟演示内容，实际项目中将接入 PDF.js 渲染真实 PDF 文件）',
    ]
    
    paragraphs.forEach(para => {
      if (para === '') {
        y += lineHeight / 2
      } else if (para.startsWith('•')) {
        ctx.fillText(para, 80, y)
        y += lineHeight
      } else {
        const words = para.split('')
        let line = ''
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i]
          const metrics = ctx.measureText(testLine)
          if (metrics.width > imgWidth - 120 && line.length > 0) {
            ctx.fillText(line, 60, y)
            line = words[i]
            y += lineHeight
          } else {
            line = testLine
          }
        }
        if (line) {
          ctx.fillText(line, 60, y)
          y += lineHeight
        }
      }
      y += 8
    })
    
    ctx.fillStyle = '#999999'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`- ${currentPage.value} -`, imgWidth / 2, imgHeight - 40)
    
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    pageInput.value = currentPage.value
    loadPage()
  }
}

function nextPage() {
  if (currentPage.value < trialPages.value) {
    currentPage.value++
    pageInput.value = currentPage.value
    loadPage()
  }
}

function goToPage(page) {
  if (page >= 1 && page <= trialPages.value) {
    currentPage.value = page
    loadPage()
  } else {
    alert(`请输入 1-${trialPages.value} 之间的页码`)
    pageInput.value = currentPage.value
  }
}

function onProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const page = Math.max(1, Math.min(trialPages.value, Math.round(percent * totalPages.value)))
  currentPage.value = page
  pageInput.value = page
  loadPage()
}

function goBack() {
  router.back()
}

function goBuy() {
  router.push(`/book/${route.params.id}`)
}

watch(currentPage, () => {
  pageInput.value = currentPage.value
})

onMounted(async () => {
  await Promise.all([loadBookInfo(), loadTrialInfo()])
  await nextTick()
  loadPage()
})
</script>

<style scoped>
.reader-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.reader-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
}

.back-btn:hover {
  background: #f5f5f5;
  color: #e63946;
}

.book-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.page-info {
  font-size: 14px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  padding: 6px 14px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
}

.control-btn:hover:not(:disabled) {
  border-color: #e63946;
  color: #e63946;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-input {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
}

.page-input input {
  width: 50px;
  height: 30px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.reader-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  padding: 24px;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.mt-20 {
  margin-top: 24px;
}

.sidebar-content {
  font-size: 13px;
  color: #666;
  line-height: 2;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: #f0f7ff;
  color: #1976d2;
  border-radius: 16px;
  font-size: 12px;
}

.buy-btn {
  margin-top: 24px;
}

.pdf-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  position: relative;
}

.pdf-canvas {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  height: auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #e63946;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 60px;
  color: #e63946;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.trial-end-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.trial-end-card {
  text-align: center;
  padding: 40px;
}

.trial-end-card h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.trial-end-card p {
  color: #666;
  margin-bottom: 24px;
}

.trial-info {
  margin-top: 16px !important;
  font-size: 12px !important;
  color: #999 !important;
}

.reader-footer {
  height: 12px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.progress-bar {
  position: relative;
  height: 4px;
  background: #f0f0f0;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #e63946;
  transition: width 0.2s;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #e63946;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(230, 57, 70, 0.4);
}
</style>
