import request from './request'

export function getCart() {
  return request.get('/cart')
}

export function addToCart(skuId, quantity = 1) {
  return request.post('/cart/add', { skuId, quantity })
}

export function updateCartItem(skuId, quantity) {
  return request.put('/cart/update', { skuId, quantity })
}

export function removeFromCart(skuId) {
  return request.delete(`/cart/remove/${skuId}`)
}

export function clearCart() {
  return request.delete('/cart/clear')
}
