import api from '../lib/axios'
import type { Notification, ApiResponse } from '../types'

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications')
    return response.data.data
  },

  async markRead(id: number): Promise<Notification> {
    const response = await api.put<ApiResponse<Notification>>(`/notifications/${id}/read`)
    return response.data.data
  },

  async markAllRead(): Promise<{ updated: number }> {
    const response = await api.put<ApiResponse<{ updated: number }>>('/notifications/read-all')
    return response.data.data
  },
}
