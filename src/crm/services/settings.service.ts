import api from '../lib/axios'
import type { CompanySettings, ApiResponse } from '../types'

export const settingsService = {
  async getSettings(): Promise<CompanySettings> {
    const response = await api.get<ApiResponse<CompanySettings>>('/settings')
    return response.data.data
  },

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const response = await api.put<ApiResponse<CompanySettings>>('/settings', data)
    return response.data.data
  },

  async getPayrollParams(): Promise<{ params: Record<string, unknown>; defaults: Record<string, unknown>; customized: boolean }> {
    const response = await api.get('/settings/payroll-params')
    return response.data.data
  },

  async updatePayrollParams(data: Record<string, unknown>) {
    const response = await api.put('/settings/payroll-params', data)
    return response.data.data
  },

  async resetPayrollParams() {
    const response = await api.delete('/settings/payroll-params')
    return response.data.data
  },

  async uploadLogo(file: File): Promise<CompanySettings> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await api.post<ApiResponse<CompanySettings>>(
      '/settings/logo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },
}
