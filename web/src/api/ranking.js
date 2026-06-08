import request from './request'

export function getRankingTypes() {
  return request.get('/ranking/types')
}

export function getRanking(type, params) {
  return request.get(`/ranking/${type}`, { params })
}

export function getRankingTrend(type, days = 7) {
  return request.get(`/ranking/trend/${type}`, { params: { days } })
}

export function recalculateRankings() {
  return request.post('/ranking/recalculate')
}
