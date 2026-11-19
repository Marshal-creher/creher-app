import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '../types'
import api from '../lib/axios'
import { setSelectedCompanyId } from '../lib/company'

interface AuthData {
  token: string
  user: User
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (role: string | string[]) => boolean
  updateUser: (user: User) => void
}

const AUTH_KEY = 'infinitas_auth'

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AuthData
        if (parsed.token && parsed.user) {
          setToken(parsed.token)
          setUser(parsed.user)
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ data: { token: string; user: User }; message: string }>(
      '/auth/login',
      { email, password }
    )

    const { token: newToken, user: newUser } = response.data.data

    // A client account works on its own company only
    if (newUser.company_id) setSelectedCompanyId(newUser.company_id)

    setToken(newToken)
    setUser(newUser)

    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: newToken, user: newUser }))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
    setSelectedCompanyId(null)

    // Call logout endpoint (fire and forget)
    api.post('/auth/logout').catch(() => {})

    window.location.href = '/crm/login'
  }, [])

  const hasRole = useCallback((role: string | string[]) => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  }, [user])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthData
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...parsed, user: updatedUser }))
      } catch {
        // ignore
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole,
    updateUser,
  }), [user, token, isLoading, login, logout, hasRole, updateUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
