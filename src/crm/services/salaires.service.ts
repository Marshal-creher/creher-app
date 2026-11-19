import api from '../lib/axios'

export const salairesService = {
  getPayrollRuns: (params?: Record<string, unknown>) =>
    api.get('/salaires', { params }).then(r => {
      const d = r.data.data
      return Array.isArray(d) ? d : (d?.data ?? [])
    }),

  getPayrollRun: (id: number) =>
    api.get(`/salaires/${id}`).then(r => r.data.data),

  getPayslips: (run_id: number) =>
    api.get(`/salaires/${run_id}/payslips`).then(r => r.data.data),

  getPayslip: (payslip_id: number) =>
    api.get(`/salaires/payslip/${payslip_id}`).then(r => r.data.data),

  getEmployeePayslips: (employee_id: number) =>
    api.get(`/salaires/employee/${employee_id}`).then(r => r.data.data),

  createPayrollRun: (data: { period_month: number; period_year: number; notes?: string }) =>
    api.post('/salaires', data).then(r => r.data.data),

  updatePayslip: (payslip_id: number, data: object) =>
    api.put(`/salaires/payslip/${payslip_id}`, data).then(r => r.data.data),

  getSummary: (run_id: number) =>
    api.get(`/salaires/${run_id}/employer-summary`).then(r => r.data.data),

  recalculate: (run_id: number) =>
    api.post(`/salaires/${run_id}/recalculate`).then(r => r.data.data),

  markRunAsPaid: (run_id: number, data: { payment_date: string; payment_method?: string }) =>
    api.put(`/salaires/${run_id}/pay`, data).then(r => r.data.data),

  deletePayrollRun: (run_id: number) =>
    api.delete(`/salaires/${run_id}`).then(r => r.data),

  importExcel: (file: File, params: { period_month: number; period_year: number; notes?: string }) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('period_month', String(params.period_month))
    fd.append('period_year', String(params.period_year))
    if (params.notes) fd.append('notes', params.notes)
    return api.post('/salaires/import-excel', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data)
  },
}
