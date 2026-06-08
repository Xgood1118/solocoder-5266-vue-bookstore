import request from './request'

export function getPdfInfo(bookId) {
  return request.get(`/pdf/info/${bookId}`)
}

export function getTrialInfo(bookId, page, pageSize) {
  return request.get(`/pdf/trial/${bookId}`, { params: { page, pageSize } })
}

export function getPdfPage(bookId, page) {
  return `/api/pdf/page/${bookId}/${page}`
}

export function getFullTrialPdf(bookId) {
  return `/api/pdf/full-trial/${bookId}`
}

export function generateSamplePdf(bookId) {
  return request.post(`/pdf/generate-sample/${bookId}`)
}
