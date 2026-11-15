import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

/**
 * Protected route wrapper — redirects to /login if not authenticated
 */
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
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * Admin-only route wrapper
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth()

  if (!hasRole(['admin'])) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

/**
 * Public route — redirects authenticated users to dashboard
 */
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
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected routes — all wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Main routes */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Employee routes */}
        <Route path="employes">
          <Route index element={<EmployesPage />} />
          <Route path="nouveau" element={<NouvelEmployePage />} />
          <Route path=":id" element={<EmployeDetailPage />} />
          <Route path=":id/modifier" element={<ModifierEmployePage />} />
        </Route>

        {/* HR modules */}
        <Route path="pointage" element={<PointagePage />} />
        <Route path="conges" element={<CongesPage />} />
        <Route path="salaires">
          <Route index element={<SalairesPage />} />
          <Route path=":id" element={<PayrollRunDetailPage />} />
        </Route>
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="periode-essai" element={<PeriodeEssaiPage />} />
        <Route path="avances" element={<AvancesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Administration */}
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

      {/* 404 — redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
