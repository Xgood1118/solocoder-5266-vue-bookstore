import request from './request'

export function getReviewList(params) {
  return request.get('/review/list', { params })
}

export function getReviewStats(bookId) {
  return request.get(`/review/stats/${bookId}`)
}

export function createReview(data) {
  return request.post('/review/create', data)
}

export function voteReview(id, voteType = 'helpful') {
  return request.post(`/review/vote/${id}`, { voteType })
}

export function getMyReviews(params) {
  return request.get('/review/my', { params })
}

export function getAllTags() {
  return request.get('/review/tags')
}
