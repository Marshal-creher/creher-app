import api from '../lib/axios'
import type { Employee, EmployeeDocument, ApiResponse, Department, Position } from '../types'

interface EmployeesListData {
  data: Employee[]
  total: number
  page: number
  limit: number
  total_pages: number
}

interface GetEmployeesParams {
  status?: string
  department_id?: number
  search?: string
  contract_type?: string
  page?: number
  limit?: number
}

export const employeesService = {
  async getEmployees(params: GetEmployeesParams = {}): Promise<EmployeesListData> {
    const response = await api.get<ApiResponse<EmployeesListData>>('/employees', { params })
    return response.data.data
  },

  async getEmployee(id: number): Promise<Employee> {
    const response = await api.get<ApiResponse<Employee>>(`/employees/${id}`)
    return response.data.data
  },

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const response = await api.post<ApiResponse<Employee>>('/employees', data)
    return response.data.data
  },

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const response = await api.put<ApiResponse<Employee>>(`/employees/${id}`, data)
    return response.data.data
  },

  async deleteEmployee(id: number): Promise<void> {
    await api.delete(`/employees/${id}`)
  },

  async uploadPhoto(id: number, file: File): Promise<Employee> {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await api.post<ApiResponse<Employee>>(
      `/employees/${id}/photo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  async getDocuments(id: number): Promise<EmployeeDocument[]> {
    const response = await api.get<ApiResponse<EmployeeDocument[]>>(`/employees/${id}/documents`)
    return response.data.data
  },

  async uploadDocument(
    id: number,
    file: File,
    documentType: string,
    notes?: string
  ): Promise<EmployeeDocument> {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('document_type', documentType)
    if (notes) formData.append('notes', notes)

    const response = await api.post<ApiResponse<EmployeeDocument>>(
      `/employees/${id}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  async deleteDocument(employeeId: number, docId: number): Promise<void> {
    await api.delete(`/employees/${employeeId}/documents/${docId}`)
  },

  async importFromExcel(file: File): Promise<{
    imported: number
    errors: number
    total: number
    details: { row: number; status: 'ok' | 'error'; name?: string; error?: string }[]
  }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/employees/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async getDepartments(): Promise<Department[]> {
    const response = await api.get<ApiResponse<Department[]>>('/employees/departments')
    return response.data.data
  },

  async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    const response = await api.post<ApiResponse<Department>>('/employees/departments', data)
    return response.data.data
  },

  async updateDepartment(id: number, data: { name: string; description?: string }): Promise<Department> {
    const response = await api.put<ApiResponse<Department>>(`/employees/departments/${id}`, data)
    return response.data.data
  },

  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/employees/departments/${id}`)
  },

  async getPositions(departmentId?: number): Promise<Position[]> {
    const params = departmentId ? { department_id: departmentId } : {}
    const response = await api.get<ApiResponse<Position[]>>('/employees/positions', { params })
    return response.data.data
  },

  async createPosition(data: { title: string; department_id?: number | null; description?: string }): Promise<Position> {
    const response = await api.post<ApiResponse<Position>>('/employees/positions', data)
    return response.data.data
  },

  async updatePosition(id: number, data: { title: string; department_id?: number | null; description?: string }): Promise<Position> {
    const response = await api.put<ApiResponse<Position>>(`/employees/positions/${id}`, data)
    return response.data.data
  },

  async deletePosition(id: number): Promise<void> {
    await api.delete(`/employees/positions/${id}`)
  },
}
