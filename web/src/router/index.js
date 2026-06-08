import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue')
  },
  {
    path: '/books',
    name: 'BookList',
    component: () => import('@/pages/BookList.vue')
  },
  {
    path: '/book/:id',
    name: 'BookDetail',
    component: () => import('@/pages/BookDetail.vue')
  },
  {
    path: '/author/:id',
    name: 'AuthorDetail',
    component: () => import('@/pages/AuthorDetail.vue')
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/pages/Ranking.vue')
  },
  {
    path: '/read/:bookId',
    name: 'Reader',
    component: () => import('@/pages/Reader.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/pages/Cart.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/pages/Checkout.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/pages/Orders.vue')
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('@/pages/OrderDetail.vue')
  },
  {
    path: '/coupons',
    name: 'Coupons',
    component: () => import('@/pages/Coupons.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue')
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/pages/Favorites.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
