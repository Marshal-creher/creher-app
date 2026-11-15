import api from '../lib/axios'

export const avancesService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/avances', { params }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? d) }),

  getStats: () =>
    api.get('/avances/stats').then(r => r.data.data),

  getByEmployee: (employee_id: number) =>
    api.get(`/avances/employee/${employee_id}`).then(r => r.data.data),

  getById: (id: number) =>
    api.get(`/avances/${id}`).then(r => r.data.data),

  create: (data: {
    employee_id: number
    montant: number
    motif?: string
    date_remboursement_prevue?: string
    nb_echeances?: number
  }) => api.post('/avances', data).then(r => r.data.data),

  approve: (id: number, notes?: string) =>
    api.put(`/avances/${id}/approve`, { notes }).then(r => r.data.data),

  refuse: (id: number, notes?: string) =>
    api.put(`/avances/${id}/refuse`, { notes }).then(r => r.data.data),

  addRemboursement: (id: number, data: {
    montant: number
    date_remboursement: string
    notes?: string
  }) => api.post(`/avances/${id}/remboursement`, data).then(r => r.data.data),
}
