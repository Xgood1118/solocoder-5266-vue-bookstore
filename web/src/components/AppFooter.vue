<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于我们</h4>
          <p>云端书店，每本好书，值得遇见。</p>
          <p>为读者提供优质的阅读体验。</p>
        </div>
        <div class="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/books">全部图书</router-link></li>
            <li><router-link to="/ranking">畅销榜单</router-link></li>
            <li><router-link to="/">新书推荐</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>客户服务</h4>
          <ul>
            <li>帮助中心</li>
            <li>配送说明</li>
            <li>退换货政策</li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>联系方式</h4>
          <p>客服热线：400-123-4567</p>
          <p>服务时间：9:00-21:00</p>
          <p>邮箱：service@bookstore.com</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2024 云端书店 版权所有</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.app-footer {
  background: #2d2d2d;
  color: #999;
  padding: 40px 0 20px;
  margin-top: 40px;
}

.footer-content {
  display: flex;
  gap: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #444;
}

.footer-section {
  flex: 1;
}

.footer-section h4 {
  color: #fff;
  font-size: 15px;
  margin-bottom: 16px;
}

.footer-section ul {
  list-style: none;
}

.footer-section li {
  margin-bottom: 8px;
  font-size: 13px;
  cursor: pointer;
}

.footer-section li:hover {
  color: #e63946;
}

.footer-section p {
  font-size: 13px;
  margin-bottom: 8px;
  line-height: 1.8;
}

.footer-section a {
  color: #999;
}

.footer-section a:hover {
  color: #e63946;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  font-size: 12px;
}
</style>
