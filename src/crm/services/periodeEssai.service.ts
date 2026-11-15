import api from '../lib/axios'

export interface PeriodeEssaiEmployee {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  department_id: number | null
  department_name: string | null
  position_id: number | null
  position_title: string | null
  hire_date: string
  trial_period_end_date: string | null
  contract_type: 'CDI' | 'CDD' | 'PERIODE_ESSAI'
  status: 'ACTIF' | 'SUSPENDU' | 'TERMINE'
  days_remaining: number
}

export interface PeriodeEssaiStats {
  total: number
  expiring_this_month: number
  alert_red: number   // <= 7 days
  alert_yellow: number // 8-15 days
}

export interface PeriodeEssaiActionPayload {
  action: 'CONFIRME' | 'RENOUVELE' | 'ROMPU'
  new_end_date?: string
  notes?: string
  motif?: string
}

export interface PeriodeEssaiListResponse {
  data: PeriodeEssaiEmployee[]
  stats: PeriodeEssaiStats
}

export const periodeEssaiService = {
  getAll: (filter?: string): Promise<PeriodeEssaiListResponse> =>
    api.get('/periode-essai', { params: filter ? { filter } : undefined }).then(r => r.data),

  getStats: (): Promise<PeriodeEssaiStats> =>
    api.get('/periode-essai/stats').then(r => r.data.data),

  doAction: (id: number, payload: PeriodeEssaiActionPayload) =>
    api.post(`/periode-essai/${id}/action`, payload).then(r => r.data),
}
