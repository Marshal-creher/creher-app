import api from '../lib/axios'

export interface CongesType {
  id: number
  name: string
  days_allowed: number | null
  color?: string
  description: string | null
  requires_approval: number
}

export interface CongesRequest {
  id: number
  employee_id: number
  conges_type_id: number
  start_date: string
  end_date: string
  days_count: number
  reason: string | null
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE'
  approved_by: number | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  employee_name?: string
  employee_code?: string
  conges_type_name?: string
  conges_type_color?: string
}

export interface CongesBalance {
  id: number
  employee_id: number
  conges_type_id: number
  year: number
  total_days: number
  used_days: number
  remaining_days: number
  conges_type_name?: string
  conges_type_color?: string
}

export interface CalendarEntry {
  id: number
  employee_id: number
  employee_name: string
  conges_type_name: string
  conges_type_color: string
  start_date: string
  end_date: string
  days_count: number
  status: string
}

export const congesService = {
  getRequests: (params?: Record<string, unknown>) =>
    api.get('/conges', { params }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),

  getCalendar: (month: number, year: number) =>
    api.get('/conges/calendar', { params: { month, year } }).then(r => r.data.data),

  getTypes: (): Promise<CongesType[]> =>
    api.get('/conges/types').then(r => r.data.data),

  getBalances: (employee_id: number, year?: number): Promise<CongesBalance[]> =>
    api.get(`/conges/balances/${employee_id}`, { params: { year } }).then(r => r.data.data),

  createRequest: (data: {
    employee_id: number
    conges_type_id: number
    start_date: string
    end_date: string
    reason?: string
  }) => api.post('/conges', data).then(r => r.data.data),

  approveRequest: (id: number) =>
    api.put(`/conges/${id}/approve`).then(r => r.data.data),

  refuseRequest: (id: number, notes: string) =>
    api.put(`/conges/${id}/refuse`, { notes }).then(r => r.data.data),

  cancelRequest: (id: number) =>
    api.put(`/conges/${id}/cancel`).then(r => r.data.data),
}
