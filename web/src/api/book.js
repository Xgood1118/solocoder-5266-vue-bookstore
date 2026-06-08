import request from './request'

export function getBookList(params) {
  return request.get('/book/list', { params })
}

export function getBookDetail(id) {
  return request.get(`/book/detail/${id}`)
}

export function getBookSkus(bookId) {
  return request.get(`/book/skus/${bookId}`)
}

export function getSimilarBooks(id, limit = 10) {
  return request.get(`/book/similar/${id}`, { params: { limit } })
}

export function getBestsellers(limit = 10, categoryId) {
  return request.get('/book/bestsellers', { params: { limit, categoryId } })
}

export function getNewArrivals(limit = 10) {
  return request.get('/book/new-arrivals', { params: { limit } })
}

export function getRecommendations(params) {
  return request.get('/recommendation/for-you', { params })
}

export function searchBooks(params) {
  return request.get('/book/search', { params })
}
