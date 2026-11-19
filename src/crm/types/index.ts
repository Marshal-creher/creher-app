// =============================================
// Auth & Users
// =============================================

export interface User {
  id: number
  email: string
  role: 'admin' | 'hr_manager' | 'employee'
  employee_id: number | null
  created_at: string
  last_login: string | null
  active: number
  first_name?: string
  last_name?: string
  photo_path?: string
  company_id?: number | null    // null = CREHER account, every company
  company_name?: string | null
}

// =============================================
// Company
// =============================================

export interface CompanySettings {
  id: number
  name: string
  logo_path: string | null
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  ice: string | null
  rc: string | null
  if_fiscal: string | null
  cnss_employer: string | null
  capital: string | null
  forme_juridique: string | null
  gerant_name: string | null
  gerant_title: string | null
  doc_header_text: string | null
  doc_footer_text: string | null
  working_days_per_week: number
  working_hours_per_day: number
  annual_leave_days: number
  trial_period_cdi_days: number
  trial_period_cdd_days: number
  work_start_time: string | null
  break_duration_minutes: number | null
  retard_tolerance_minutes: number | null
  created_at: string
  updated_at: string
}

// =============================================
// HR Entities
// =============================================

export interface Department {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Position {
  id: number
  title: string
  department_id: number | null
  department_name?: string
  description: string | null
  created_at: string
}

export interface Employee {
  id: number
  employee_code: string
  cin: string | null
  cnss_number: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  birth_date: string | null
  hire_date: string
  contract_type: 'CDI' | 'CDD' | 'PERIODE_ESSAI'
  contract_end_date: string | null
  trial_period_end_date: string | null
  trial_period_duration_days: number | null
  status: 'ACTIF' | 'SUSPENDU' | 'TERMINE'
  department_id: number | null
  position_id: number | null
  manager_id: number | null
  base_salary: number
  hourly_rate: number | null
  bank_account: string | null
  bank_name: string | null
  photo_path: string | null
  gender: 'M' | 'F' | null
  marital_status: string | null
  children_count: number
  nationality: string
  created_by: number | null
  created_at: string
  updated_at: string
  // Joined fields
  department_name?: string
  position_title?: string
  manager_name?: string
}

export interface EmployeeDocument {
  id: number
  employee_id: number
  document_type: string
  file_path: string
  file_name: string
  notes: string | null
  created_by: number | null
  created_at: string
  uploaded_by_email?: string
}

// =============================================
// Attendance (Pointage)
// =============================================

export interface PointageEntry {
  id: number
  employee_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  hours_worked: number | null
  absence_code: 'ABS' | 'MAL' | 'CP' | 'CE' | null
  notes: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

// =============================================
// Leave (Congés)
// =============================================

export interface CongesType {
  id: number
  name: string
  days_allowed: number | null
  description: string | null
  requires_approval: number
}

export interface CongesRequest {
  id: number
  employee_id: number
  conges_type_id: number
  start_date: string
  end_date: string
  days_count: number
  reason: string | null
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE'
  approved_by: number | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  employee_name?: string
  conges_type_name?: string
}

export interface CongesBalance {
  id: number
  employee_id: number
  conges_type_id: number
  year: number
  total_days: number
  used_days: number
  remaining_days: number
  // Joined fields
  conges_type_name?: string
}

// =============================================
// Payroll
// =============================================

export interface PayrollRun {
  id: number
  period_month: number
  period_year: number
  status: 'BROUILLON' | 'CALCULE' | 'PAYE'
  run_date: string | null
  total_gross: number
  total_net: number
  notes: string | null
  created_by: number | null
  created_at: string
}

export interface PayslipData {
  id: number
  payroll_run_id: number
  employee_id: number
  period_month: number
  period_year: number
  base_salary: number
  days_worked: number
  days_absent: number
  hours_worked: number
  overtime_hours: number
  absence_deduction: number
  gross_salary: number
  cnss_employee: number
  amo_employee: number
  igr: number
  other_deductions: number
  bonuses: number
  net_salary: number
  payment_date: string | null
  payment_method: string | null
  payment_status: 'EN_ATTENTE' | 'PAYE'
  created_at: string
  // Joined fields
  employee_name?: string
  employee_code?: string
}

// =============================================
// Generated Documents
// =============================================

export enum DocumentType {
  CONTRAT_TRAVAIL = 'CONTRAT_TRAVAIL',
  ATTESTATION_TRAVAIL = 'ATTESTATION_TRAVAIL',
  ATTESTATION_SALAIRE = 'ATTESTATION_SALAIRE',
  CERTIFICAT_TRAVAIL = 'CERTIFICAT_TRAVAIL',
  AVERTISSEMENT = 'AVERTISSEMENT',
  MISE_EN_DEMEURE = 'MISE_EN_DEMEURE',
  LETTRE_NOTIFICATION = 'LETTRE_NOTIFICATION',
  PROMESSE_EMBAUCHE = 'PROMESSE_EMBAUCHE',
  NOTE_SERVICE = 'NOTE_SERVICE',
  RENOUVELLEMENT_ESSAI = 'RENOUVELLEMENT_ESSAI',
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRAT_TRAVAIL: 'Contrat de Travail',
  ATTESTATION_TRAVAIL: 'Attestation de Travail',
  ATTESTATION_SALAIRE: 'Attestation de Salaire',
  CERTIFICAT_TRAVAIL: 'Certificat de Travail',
  AVERTISSEMENT: 'Avertissement',
  MISE_EN_DEMEURE: 'Mise en Demeure',
  LETTRE_NOTIFICATION: 'Lettre de Notification',
  PROMESSE_EMBAUCHE: "Promesse d'Embauche",
  NOTE_SERVICE: 'Note de Service',
  RENOUVELLEMENT_ESSAI: "Renouvellement de Période d'Essai",
}

export interface GeneratedDocument {
  id: number
  employee_id: number | null
  document_type: string
  template_data: string | null
  file_path: string | null
  created_by: number | null
  created_at: string
  // Joined fields
  first_name?: string
  last_name?: string
  employee_code?: string
}

// =============================================
// Notifications & Audit
// =============================================

export interface Notification {
  id: number
  type: 'info' | 'warning' | 'alert' | 'success'
  title: string
  message: string
  employee_id: number | null
  read_at: string | null
  created_at: string
  // Joined fields
  first_name?: string
  last_name?: string
  employee_code?: string
}

export interface AuditLog {
  id: number
  user_id: number | null
  action: string
  entity_type: string
  entity_id: number | null
  old_values: string | null
  new_values: string | null
  ip_address: string | null
  created_at: string
}

export interface TrialPeriodAlert {
  id: number
  employee_id: number
  alert_type: 'YELLOW' | 'RED'
  alert_date: string
  action_taken: 'RENOUVELE' | 'CONFIRME' | 'ROMPU' | null
  action_date: string | null
  notes: string | null
  created_at: string
}

// =============================================
// Dashboard
// =============================================

export interface UpcomingExpiration {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  trial_period_end_date?: string
  contract_end_date?: string
  contract_type: string
  department_name: string | null
  position_title: string | null
  days_remaining: number
}

export interface DashboardStats {
  total_employees: number
  active_employees: number
  inactive_employees: number
  payroll_this_month: number
  absence_rate_this_month: number
  pending_leaves_count: number
  upcoming_trial_expirations: UpcomingExpiration[]
  upcoming_cdd_expirations: UpcomingExpiration[]
  recent_documents: GeneratedDocument[]
  pending_notifications_count: number
  employees_by_department: Array<{ department: string; count: number }>
  employees_by_contract: Array<{ contract_type: string; count: number }>
}

// =============================================
// API Response types
// =============================================

export interface ApiResponse<T> {
  data: T
  message: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface EmployeesListResponse {
  data: {
    data: Employee[]
    total: number
    page: number
    limit: number
    total_pages: number
  }
  message: string
}
