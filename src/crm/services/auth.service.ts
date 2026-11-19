import api from '../lib/axios'
import type { User, ApiResponse } from '../types'

interface LoginResponse {
  token: string
  user: User
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
    return response.data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/me/password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/auth/users')
    return response.data.data
  },

  async createUser(data: {
    email: string
    password: string
    role: string
    employee_id?: number | null
    company_id?: number | null
  }): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/auth/users', data)
    return response.data.data
  },

  async updateUser(id: number, data: Partial<User & { active: boolean }>): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/auth/users/${id}`, data)
    return response.data.data
  },
}
