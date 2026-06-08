import request from './request'

export function createOrder(data) {
  return request.post('/order/create', data)
}

export function getOrderList(params) {
  return request.get('/order/list', { params })
}

export function getOrderDetail(id) {
  return request.get(`/order/detail/${id}`)
}

export function cancelOrder(id) {
  return request.post(`/order/cancel/${id}`)
}

export function payOrder(id) {
  return request.post(`/order/pay/${id}`)
}

export function confirmReceive(id) {
  return request.post(`/order/confirm/${id}`)
}

export const confirmReceipt = confirmReceive

export function applyRefund(id) {
  return request.post(`/order/refund/${id}`)
}

export function getAvailableCoupons(params) {
  return request.get('/coupon/available', { params })
}
