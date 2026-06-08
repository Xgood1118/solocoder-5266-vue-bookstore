import request from './request'

export function login(data) {
  return request.post('/user/login', data)
}

export function register(data) {
  return request.post('/user/register', data)
}

export function refreshToken(refreshToken) {
  return request.post('/user/refresh', { refreshToken })
}

export function logout(refreshToken) {
  return request.post('/user/logout', { refreshToken })
}

export function getProfile() {
  return request.get('/user/profile')
}

export function updateProfile(data) {
  return request.put('/user/profile', data)
}

export function changePassword(data) {
  return request.post('/user/change-password', data)
}

export function getMemberInfo() {
  return request.get('/user/member')
}

export function getMemberLevels() {
  return request.get('/user/member/levels')
}

export function getOrderCount() {
  return request.get('/user/order-count')
}

export function getMyCoupons(params) {
  return request.get('/coupon/mine', { params })
}
