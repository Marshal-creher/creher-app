import api from '../lib/axios'
import type { DashboardStats, ApiResponse } from '../types'

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard')
    return response.data.data
  },
}
