// The company the HRM is working on. Sent to the server with every request
// (X-Company-Id); the server ignores it for accounts attached to one company.

const COMPANY_KEY = 'crm_company_id'

export function getSelectedCompanyId(): number | null {
  try {
    const value = Number(localStorage.getItem(COMPANY_KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function setSelectedCompanyId(id: number | null): void {
  try {
    if (id) localStorage.setItem(COMPANY_KEY, String(id))
    else localStorage.removeItem(COMPANY_KEY)
  } catch {
    // storage unavailable: the server falls back to the default company
  }
}
