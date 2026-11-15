import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, TrendingDown, DollarSign, Calendar,
  AlertTriangle, Clock, FileText, Plus, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { dashboardService } from '../services/dashboard.service'
import { StatsCard } from '../components/ui/StatsCard'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/Spinner'
import { formatCurrency, formatDate, daysUntil, getUrgencyColor } from '../lib/utils'

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'
]

export function DashboardPage() {
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getStats,
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  if (isLoading) return <PageLoader />

  if (!stats) return null

  const absenceRateOk = stats.absence_rate_this_month < 5

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de votre entreprise — {new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/crm/employes/nouveau')}
        >
          Nouvel Employé
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          icon={<Users className="h-full w-full" />}
          label="Total Employés Actifs"
          value={stats.active_employees}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          onClick={() => navigate('/crm/employes')}
        />
        <StatsCard
          icon={<TrendingDown className="h-full w-full" />}
          label="Taux d'Absence (mois)"
          value={`${stats.absence_rate_this_month.toFixed(1)}%`}
          iconBgColor={absenceRateOk ? 'bg-emerald-50' : 'bg-amber-50'}
          iconColor={absenceRateOk ? 'text-emerald-600' : 'text-amber-600'}
        />
        <StatsCard
          icon={<DollarSign className="h-full w-full" />}
          label="Masse Salariale (mois)"
          value={formatCurrency(stats.payroll_this_month)}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          onClick={() => navigate('/crm/salaires')}
        />
        <StatsCard
          icon={<Calendar className="h-full w-full" />}
          label="Congés en Attente"
          value={stats.pending_leaves_count}
          iconBgColor={stats.pending_leaves_count > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
          iconColor={stats.pending_leaves_count > 0 ? 'text-amber-600' : 'text-emerald-600'}
          onClick={() => navigate('/crm/conges')}
        />
      </div>

      {/* Alerts section + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="xl:col-span-1 space-y-4">
          {/* Trial period expirations */}
          {stats.upcoming_trial_expirations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Périodes d'Essai</h3>
                  </div>
                  <Badge variant="warning">{stats.upcoming_trial_expirations.length}</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {stats.upcoming_trial_expirations.slice(0, 5).map((emp) => {
                    const days = Math.round(emp.days_remaining)
                    const urgencyClass = getUrgencyColor(days)
                    return (
                      <div
                        key={emp.id}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/crm/employes/${emp.id}`)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{emp.department_name || 'Sans département'}</p>
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-lg border ${urgencyClass}`}>
                          {days <= 0 ? 'Expiré' : `J-${days}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {stats.upcoming_trial_expirations.length > 5 && (
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={() => navigate('/crm/periode-essai')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Voir tout ({stats.upcoming_trial_expirations.length}) →
                    </button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* CDD expirations */}
          {stats.upcoming_cdd_expirations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Contrats CDD</h3>
                  </div>
                  <Badge variant="danger">{stats.upcoming_cdd_expirations.length}</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {stats.upcoming_cdd_expirations.slice(0, 5).map((emp) => {
                    const days = Math.round(emp.days_remaining)
                    const urgencyClass = getUrgencyColor(days)
                    return (
                      <div
                        key={emp.id}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/crm/employes/${emp.id}`)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Fin: {formatDate(emp.contract_end_date)}
                          </p>
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-lg border ${urgencyClass}`}>
                          {days <= 0 ? 'Expiré' : `J-${days}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Actions Rapides</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {[
                  { label: 'Nouvel Employé', path: '/crm/employes/nouveau', icon: <Users className="h-4 w-4" /> },
                  { label: 'Gérer les Congés', path: '/crm/conges', icon: <Calendar className="h-4 w-4" /> },
                  { label: 'Générer un Document', path: '/crm/documents', icon: <FileText className="h-4 w-4" /> },
                  { label: 'Voir le Pointage', path: '/crm/pointage', icon: <Clock className="h-4 w-4" /> },
                ].map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
                  >
                    <span className="text-gray-400">{action.icon}</span>
                    {action.label}
                    <ArrowRight className="h-3 w-3 ml-auto text-gray-400" />
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts + recent */}
        <div className="xl:col-span-2 space-y-6">
          {/* Department chart */}
          {stats.employees_by_department.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Effectifs par Département</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.employees_by_department}
                    margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="department"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [value, 'Employés']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.employees_by_department.map((_entry, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Recent documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Documents Récents</h3>
                <button
                  onClick={() => navigate('/crm/documents')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Voir tout →
                </button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {stats.recent_documents.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Aucun document généré récemment
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stats.recent_documents.map((doc) => (
                    <div key={doc.id} className="px-6 py-3 flex items-center gap-4">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.document_type}
                          {doc.first_name && ` — ${doc.first_name} ${doc.last_name}`}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardBody className="text-center py-5">
                <p className="text-2xl font-bold text-gray-900">{stats.total_employees}</p>
                <p className="text-xs text-gray-500 mt-1">Total Employés</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-5">
                <p className="text-2xl font-bold text-amber-600">{stats.inactive_employees}</p>
                <p className="text-xs text-gray-500 mt-1">Suspendus</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-5">
                <p className="text-2xl font-bold text-indigo-600">{stats.pending_notifications_count}</p>
                <p className="text-xs text-gray-500 mt-1">Notifications</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
