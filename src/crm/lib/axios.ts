import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor: add Bearer token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('infinitas_auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData) as { token?: string }
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data
      localStorage.removeItem('infinitas_auth')
      // Redirect to CRM login (mounted under /crm prefix in merged app)
      if (!window.location.pathname.endsWith('/crm/login')) {
        window.location.href = '/crm/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
