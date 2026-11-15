import api from '../lib/axios'

export const documentsService = {
  getDocuments: (params?: Record<string, unknown>) =>
    api.get('/documents', { params }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),

  getTypes: () =>
    api.get('/documents/types').then(r => r.data.data),

  getDocument: (id: number) =>
    api.get(`/documents/${id}`).then(r => r.data.data),

  generateDocument: (data: {
    employee_id?: number
    document_type: string
    params: Record<string, unknown>
  }) => api.post('/documents/generate', data).then(r => r.data.data),

  deleteDocument: (id: number) =>
    api.delete(`/documents/${id}`).then(r => r.data),
}
