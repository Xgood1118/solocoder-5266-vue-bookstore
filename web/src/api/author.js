import request from './request'

export function getAuthorList(params) {
  return request.get('/author/list', { params })
}

export function getAuthorDetail(id) {
  return request.get(`/author/detail/${id}`)
}

export function getAuthorBooks(id, params) {
  return request.get(`/author/${id}/books`, { params })
}
