import request from './request'

export function getFavorites(params) {
  return request.get('/favorite', { params })
}

export function addFavorite(bookId) {
  return request.post(`/favorite/add/${bookId}`)
}

export function removeFavorite(bookId) {
  return request.delete(`/favorite/remove/${bookId}`)
}

export function toggleFavorite(bookId) {
  return request.post(`/favorite/toggle/${bookId}`)
}

export function checkFavorite(bookId) {
  return request.get(`/favorite/check/${bookId}`)
}

export function getMyFavorites(params) {
  return getFavorites(params)
}
