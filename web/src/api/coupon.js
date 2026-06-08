import request from './request'

export function getCouponList(params) {
  return request.get('/coupon/list', { params })
}

export function getMyCoupons(status = 'unused') {
  return request.get('/coupon/mine', { params: { status } })
}

export function receiveCoupon(id) {
  return request.post(`/coupon/receive/${id}`)
}

export const claimCoupon = receiveCoupon

export function getAvailableCoupons(amount) {
  return request.get('/coupon/available', { params: { amount } })
}
