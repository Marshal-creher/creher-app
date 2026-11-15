/**
 * CrmApp.tsx
 *
 * Self-contained mount point for the INFINITAS HRM CRM.
 * Rendered by the CREHER site under the /crm/* route.
 *
 * All CRM-internal navigation stays within /crm/... :
 *   /crm/login        → LoginPage
 *   /crm/dashboard    → DashboardPage
 *   /crm/employes/*   → Employee pages
 *   etc.
 */

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { Spinner } from './components/ui/Spinner'

// Pages
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployesPage } from './pages/employes/EmployesPage'
import { NouvelEmployePage } from './pages/employes/NouvelEmployePage'
import { EmployeDetailPage } from './pages/employes/EmployeDetailPage'
import { ModifierEmployePage } from './pages/employes/ModifierEmployePage'
import { PointagePage } from './pages/PointagePage'
import { CongesPage } from './pages/CongesPage'
import { SalairesPage } from './pages/SalairesPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { PeriodeEssaiPage } from './pages/PeriodeEssaiPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ParametresPage } from './pages/ParametresPage'
import { UtilisateursPage } from './pages/UtilisateursPage'
import AvancesPage from './pages/AvancesPage'
import { PayrollRunDetailPage } from './pages/salaires/PayrollRunDetailPage'
import { RecrutementPage } from './pages/RecrutementPage'

// Dedicated QueryClient for the CRM (isolated from the CREHER site's client)
const crmQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

// ── Route guards ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Chargement..." />
      </div>
    )
  }
  if (!isAuthenticated) {
    // Redirect within the /crm prefix
    return <Navigate to="/crm/login" replace />
  }
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth()
  if (!hasRole(['admin'])) {
    return <Navigate to="/crm/dashboard" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Chargement..." />
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to="/crm/dashboard" replace />
  }
  return <>{children}</>
}

// ── Inner router (receives the /crm/* wildcard from the parent) ───────────────

function CrmRoutes() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Default: redirect /crm → /crm/login */}
        <Route index element={<Navigate to="/crm/login" replace />} />

        {/* Public */}
        <Route
          path="login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected — wrapped in the CRM sidebar layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/crm/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="employes">
            <Route index element={<EmployesPage />} />
            <Route path="nouveau" element={<NouvelEmployePage />} />
            <Route path=":id" element={<EmployeDetailPage />} />
            <Route path=":id/modifier" element={<ModifierEmployePage />} />
          </Route>

          <Route path="pointage" element={<PointagePage />} />
          <Route path="conges" element={<CongesPage />} />
          <Route path="salaires">
            <Route index element={<SalairesPage />} />
            <Route path=":id" element={<PayrollRunDetailPage />} />
          </Route>
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="periode-essai" element={<PeriodeEssaiPage />} />
          <Route path="avances" element={<AvancesPage />} />
          <Route path="recrutement" element={<RecrutementPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="parametres" element={<ParametresPage />} />
          <Route
            path="utilisateurs"
            element={
              <AdminRoute>
                <UtilisateursPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/crm/dashboard" replace />} />
      </Routes>
    </>
  )
}

// ── Public export — mounted by creher-site App.tsx ────────────────────────────

export function CrmApp() {
  return (
    <QueryClientProvider client={crmQueryClient}>
      <AuthProvider>
        <CrmRoutes />
      </AuthProvider>
    </QueryClientProvider>
  )
}
