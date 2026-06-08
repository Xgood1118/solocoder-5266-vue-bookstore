import request from './request'

export function getRecommendations(params) {
  return request.get('/recommendation', { params })
}

export function getColdStartRecommendations(limit = 10) {
  return request.get('/recommendation/cold-start', { params: { limit } })
}

export function getSimilarBooks(bookId, limit = 10) {
  return request.get(`/recommendation/similar/${bookId}`, { params: { limit } })
}

export function getBestsellers(limit = 10, categoryId) {
  return request.get('/recommendation/bestsellers', { params: { limit, categoryId } })
}

export function getNewArrivals(limit = 10) {
  return request.get('/recommendation/new-arrivals', { params: { limit } })
}

export function recordReading(data) {
  return request.post('/recommendation/reading-record', data)
}

export function getReadingHistory() {
  return request.get('/recommendation/history')
}
