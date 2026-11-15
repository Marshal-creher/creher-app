import api from '../lib/axios'

export interface PointageEntry {
  id: number
  employee_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  hours_worked: number
  absence_code: 'ABS' | 'MAL' | 'CP' | 'CE' | 'FERIE' | null
  notes: string | null
  employee_name?: string
  employee_code?: string
  department?: string
}

export interface MonthlySummary {
  employee_id: number
  employee_name: string
  first_name: string
  last_name: string
  cin: string | null
  employee_code: string
  department: string
  total_working_days: number
  days_present: number
  days_abs: number
  days_mal: number
  days_cp: number
  days_ce: number
  days_ferie: number
  days_retard: number
  total_retard_minutes: number
  total_hours: number
  absence_rate: number
}

export const pointageService = {
  getEntries: (params?: Record<string, unknown>) =>
    api.get('/pointage', { params }).then(r => {
      const d = r.data.data
      // backend returns paginated { data: [...], total } — extract the array
      return Array.isArray(d) ? d : (d?.data ?? [])
    }),

  getMonthlySummary: (month: number, year: number, employee_id?: number): Promise<MonthlySummary[]> =>
    api.get('/pointage/summary', { params: { month, year, employee_id } }).then(r => r.data.data),

  upsertEntry: (data: {
    employee_id: number
    date: string
    clock_in?: string | null
    clock_out?: string | null
    hours_worked?: number
    absence_code?: string | null
    notes?: string | null
  }) => api.post('/pointage', data).then(r => r.data.data),

  updateEntry: (id: number, data: object) =>
    api.put(`/pointage/${id}`, data).then(r => r.data.data),

  deleteEntry: (id: number) =>
    api.delete(`/pointage/${id}`).then(r => r.data),

  bulkImport: (entries: object[]) =>
    api.post('/pointage/bulk', { entries }).then(r => r.data),
}
