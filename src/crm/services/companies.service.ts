import api from '../lib/axios'

export interface Company {
  id: number
  name: string
  active: boolean
  created_at: string
  employee_count: number | null
}

export interface CompaniesResponse {
  companies: Company[]
  allCompaniesAccess: boolean
}

export interface NewCompany {
  name: string
  forme_juridique?: string
  ice?: string
  if_fiscal?: string
  rc?: string
  cnss_employer?: string
  capital?: string
  address?: string
  city?: string
  phone?: string
  email?: string
}

export const companiesService = {
  list: (): Promise<CompaniesResponse> =>
    api.get('/companies').then((r) => ({ companies: r.data.data as Company[], allCompaniesAccess: Boolean(r.data.all_companies_access) })),

  create: (data: NewCompany): Promise<Company> =>
    api.post('/companies', data).then((r) => r.data.data),

  update: (id: number, data: { name?: string; active?: boolean }): Promise<Company> =>
    api.put(`/companies/${id}`, data).then((r) => r.data.data),
}
