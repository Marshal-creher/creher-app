import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isWeekend,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { congesService, type CongesRequest, type CongesBalance, type CongesType, type CalendarEntry } from '../services/conges.service'
import api from '../lib/axios'
import type { Employee } from '../types'

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const STATUS_CONFIG = {
  EN_ATTENTE: { label: 'En attente', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  APPROUVE: { label: 'Approuvé', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  REFUSE: { label: 'Refusé', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  ANNULE: { label: 'Annulé', bg: 'bg-gray-100', text: 'text-gray-600', icon: X },
} as const

/** Count working days between two date strings (inclusive), excluding weekends */
function countWorkingDays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0
  try {
    const start = parseISO(startStr)
    const end = parseISO(endStr)
    if (end < start) return 0
    const days = eachDayOfInterval({ start, end })
    return days.filter(d => !isWeekend(d)).length
  } catch {
    return 0
  }
}

// ─── CongesPage ───────────────────────────────────────────────────────────────

export function CongesPage() {
  const [activeTab, setActiveTab] = useState<'demandes' | 'soldes' | 'calendrier'>('demandes')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Congés</h1>
        <p className="text-sm text-gray-500 mt-1">Demandes, soldes et calendrier des congés</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: 'demandes', label: 'Demandes', icon: CheckCircle },
            { key: 'soldes', label: 'Soldes', icon: User },
            { key: 'calendrier', label: 'Calendrier', icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'demandes' | 'soldes' | 'calendrier')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'demandes' && <DemandesTab />}
      {activeTab === 'soldes' && <SoldesTab />}
      {activeTab === 'calendrier' && <CalendrierTab />}
    </div>
  )
}

// ─── Tab 1: Demandes ──────────────────────────────────────────────────────────

function DemandesTab() {
  const queryClient = useQueryClient()
  const today = new Date()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(today.getFullYear())
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const [showNewModal, setShowNewModal] = useState(false)
  const [refuseModal, setRefuseModal] = useState<{ id: number; name: string } | null>(null)

  // Fetch types
  const { data: types = [] } = useQuery<CongesType[]>({
    queryKey: ['conges-types'],
    queryFn: congesService.getTypes,
  })

  // Fetch requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['conges-requests', search, statusFilter, typeFilter, yearFilter, page],
    queryFn: () =>
      congesService.getRequests({
        search: search || undefined,
        status: statusFilter || undefined,
        conges_type_id: typeFilter || undefined,
        year: yearFilter,
        page,
        limit: PAGE_SIZE,
      }),
  })

  const requests: CongesRequest[] = (requestsData as any)?.data ?? (requestsData as any) ?? []
  const total: number = (requestsData as any)?.total ?? requests.length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const approveMutation = useMutation({
    mutationFn: (id: number) => congesService.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conges-requests'] })
      toast.success('Demande approuvée')
    },
    onError: () => toast.error('Erreur lors de l\'approbation'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => congesService.cancelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conges-requests'] })
      toast.success('Demande annulée')
    },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  })

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="APPROUVE">Approuvé</option>
          <option value="REFUSE">Refusé</option>
          <option value="ANNULE">Annulé</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          value={yearFilter}
          onChange={e => { setYearFilter(Number(e.target.value)); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={() => setShowNewModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Demande
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Aucune demande trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date demande</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employé</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Du</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Au</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Nb jours</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Motif</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req: CongesRequest) => {
                  const cfg = STATUS_CONFIG[req.status]
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {format(parseISO(req.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {req.employee_name ?? `Employé #${req.employee_id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{req.conges_type_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {format(parseISO(req.start_date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {format(parseISO(req.end_date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-800">{req.days_count}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{req.reason ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {req.status === 'EN_ATTENTE' && (
                            <>
                              <button
                                onClick={() => approveMutation.mutate(req.id)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium disabled:opacity-60 transition-colors"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Approuver
                              </button>
                              <button
                                onClick={() => setRefuseModal({ id: req.id, name: req.employee_name ?? '' })}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium transition-colors"
                              >
                                <XCircle className="h-3 w-3" />
                                Refuser
                              </button>
                            </>
                          )}
                          {(req.status === 'EN_ATTENTE' || req.status === 'APPROUVE') && (
                            <button
                              onClick={() => cancelMutation.mutate(req.id)}
                              disabled={cancelMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs font-medium disabled:opacity-60 transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{total} demande(s) au total</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewModal && (
        <NewDemandeModal
          types={types}
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['conges-requests'] })
            setShowNewModal(false)
          }}
        />
      )}
      {refuseModal && (
        <RefuseModal
          requestId={refuseModal.id}
          employeeName={refuseModal.name}
          onClose={() => setRefuseModal(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['conges-requests'] })
            setRefuseModal(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Nouvelle Demande Modal ───────────────────────────────────────────────────

interface NewDemandeModalProps {
  types: CongesType[]
  onClose: () => void
  onSuccess: () => void
}

function NewDemandeModal({ types, onClose, onSuccess }: NewDemandeModalProps) {
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const { data: employeesData } = useQuery({
    queryKey: ['employees-search', employeeSearch],
    queryFn: () => api.get('/employees', { params: { status: 'ACTIF', search: employeeSearch || undefined, limit: 20 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),
    enabled: showEmployeeDropdown,
  })
  const employees: Employee[] = Array.isArray(employeesData) ? employeesData : []

  const { data: balances = [] } = useQuery<CongesBalance[]>({
    queryKey: ['conges-balances', selectedEmployee?.id],
    queryFn: () => congesService.getBalances(selectedEmployee!.id, new Date().getFullYear()),
    enabled: !!selectedEmployee,
  })

  const selectedBalance = balances.find(b => b.conges_type_id === Number(selectedTypeId))
  const workingDays = countWorkingDays(startDate, endDate)

  const createMutation = useMutation({
    mutationFn: congesService.createRequest,
    onSuccess: () => {
      toast.success('Demande créée avec succès')
      onSuccess()
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee || !selectedTypeId || !startDate || !endDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    createMutation.mutate({
      employee_id: selectedEmployee.id,
      conges_type_id: Number(selectedTypeId),
      start_date: startDate,
      end_date: endDate,
      reason: reason || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle Demande de Congé</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Employee selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employé <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : employeeSearch}
                onChange={e => {
                  setEmployeeSearch(e.target.value)
                  setSelectedEmployee(null)
                  setShowEmployeeDropdown(true)
                }}
                onFocus={() => setShowEmployeeDropdown(true)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showEmployeeDropdown && employees.length > 0 && !selectedEmployee && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {employees.map((emp: Employee) => (
                    <button
                      key={emp.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setSelectedEmployee(emp)
                        setShowEmployeeDropdown(false)
                        setEmployeeSearch('')
                      }}
                    >
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-gray-400">{emp.employee_code} — {emp.department_name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de congé <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTypeId}
              onChange={e => setSelectedTypeId(Number(e.target.value) || '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un type...</option>
              {types.map(t => {
                const bal = balances.find(b => b.conges_type_id === t.id)
                return (
                  <option key={t.id} value={t.id}>
                    {t.name}{bal ? ` (${bal.remaining_days} jours restants)` : ''}
                  </option>
                )
              })}
            </select>
            {selectedBalance && (
              <p className="mt-1 text-xs text-blue-600">
                Solde disponible: <strong>{selectedBalance.remaining_days} jours</strong>
                {' '}/ {selectedBalance.total_days} jours total
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Working days count */}
          {startDate && endDate && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              workingDays > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'
            }`}>
              {workingDays > 0
                ? `${workingDays} jour(s) ouvrable(s)`
                : 'Aucun jour ouvrable dans cette période'}
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Motif de la demande (optionnel)..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !selectedEmployee || !selectedTypeId || !startDate || !endDate}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium"
          >
            {createMutation.isPending ? 'Envoi...' : 'Soumettre la demande'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Refus Modal ──────────────────────────────────────────────────────────────

interface RefuseModalProps {
  requestId: number
  employeeName: string
  onClose: () => void
  onSuccess: () => void
}

function RefuseModal({ requestId, employeeName, onClose, onSuccess }: RefuseModalProps) {
  const [notes, setNotes] = useState('')

  const refuseMutation = useMutation({
    mutationFn: () => congesService.refuseRequest(requestId, notes),
    onSuccess: () => {
      toast.success('Demande refusée')
      onSuccess()
    },
    onError: () => toast.error('Erreur lors du refus'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Refuser la demande</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Vous allez refuser la demande de <strong>{employeeName}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif du refus <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Expliquer le motif du refus..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => refuseMutation.mutate()}
            disabled={!notes.trim() || refuseMutation.isPending}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors font-medium"
          >
            {refuseMutation.isPending ? 'Refus...' : 'Confirmer le refus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Soldes ────────────────────────────────────────────────────────────

function SoldesTab() {
  const today = new Date()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  const { data: employeesData } = useQuery({
    queryKey: ['employees-search-soldes', employeeSearch],
    queryFn: () => api.get('/employees', { params: { status: 'ACTIF', search: employeeSearch || undefined, limit: 20 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),
    enabled: showDropdown,
  })
  const employees: Employee[] = Array.isArray(employeesData) ? employeesData : []

  const { data: balances = [], isLoading } = useQuery<CongesBalance[]>({
    queryKey: ['conges-balances', selectedEmployeeId, selectedYear],
    queryFn: () => congesService.getBalances(selectedEmployeeId as number, selectedYear),
    enabled: !!selectedEmployeeId,
  })

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  const remainingColor = (remaining: number, total: number) => {
    if (total === 0) return 'text-gray-400'
    const ratio = remaining / total
    if (ratio > 0.5) return 'text-green-600'
    if (ratio > 0.2) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-5">
      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Employee selector */}
        <div className="relative">
          <input
            type="text"
            placeholder="Sélectionner un employé..."
            value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : employeeSearch}
            onChange={e => {
              setEmployeeSearch(e.target.value)
              setSelectedEmployee(null)
              setSelectedEmployeeId('')
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-64 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showDropdown && employees.length > 0 && !selectedEmployee && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {employees.map((emp: Employee) => (
                <button
                  key={emp.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setSelectedEmployee(emp)
                    setSelectedEmployeeId(emp.id)
                    setShowDropdown(false)
                    setEmployeeSearch('')
                  }}
                >
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                    <div className="text-xs text-gray-400">{emp.employee_code}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Content */}
      {!selectedEmployeeId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Sélectionnez un employé pour afficher ses soldes de congés</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des soldes...</span>
        </div>
      ) : balances.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Aucun solde trouvé pour {selectedYear}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map(bal => {
            const usedPct = bal.total_days > 0 ? Math.min(100, (bal.used_days / bal.total_days) * 100) : 0
            const color = bal.conges_type_color ?? '#3B82F6'
            return (
              <div key={bal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Colored header */}
                <div className="h-2" style={{ backgroundColor: color }} />
                <div className="p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {bal.conges_type_name ?? `Type #${bal.conges_type_id}`}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{bal.total_days}</div>
                      <div className="text-xs text-gray-400">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">{bal.used_days}</div>
                      <div className="text-xs text-gray-400">Utilisés</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${remainingColor(bal.remaining_days, bal.total_days)}`}>
                        {bal.remaining_days}
                      </div>
                      <div className="text-xs text-gray-400">Restants</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Utilisés</span>
                      <span>{usedPct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${usedPct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Calendrier ────────────────────────────────────────────────────────

interface DayLeave {
  id: number
  employee_name: string
  conges_type_name: string
  conges_type_color: string
}

function CalendrierTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const { data: calendarData = [], isLoading } = useQuery<CalendarEntry[]>({
    queryKey: ['conges-calendar', month, year],
    queryFn: () => congesService.getCalendar(month, year),
  })

  // Build a map: dateStr -> list of leaves
  const leavesByDay = useMemo(() => {
    const map: Record<string, DayLeave[]> = {}
    calendarData.forEach(entry => {
      try {
        const start = parseISO(entry.start_date)
        const end = parseISO(entry.end_date)
        const days = eachDayOfInterval({ start, end })
        days.forEach(d => {
          const key = format(d, 'yyyy-MM-dd')
          if (!map[key]) map[key] = []
          map[key].push({
            id: entry.id,
            employee_name: entry.employee_name,
            conges_type_name: entry.conges_type_name,
            conges_type_color: entry.conges_type_color ?? '#3B82F6',
          })
        })
      } catch {
        // skip malformed dates
      }
    })
    return map
  }, [calendarData])

  // Build calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Get the first Monday of the grid (or earlier week start)
  // getDay returns 0=Sun..6=Sat; we use Mon=1 as first day
  const startWeekDay = getDay(monthStart) // 0 = Sun
  // Offset to get Monday: if Sunday (0) -> go back 6 days, else go back (startWeekDay - 1) days
  const offset = startWeekDay === 0 ? 6 : startWeekDay - 1
  const gridStart = addDays(monthStart, -offset)

  // We need enough rows to cover the month (up to 6 weeks)
  const totalCells = 42
  const gridDays = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i))

  const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentDate(d => subMonths(d, 1))}
          className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Mois précédent
        </button>
        <h2 className="text-lg font-semibold text-gray-900 capitalize min-w-[180px] text-center">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button
          onClick={() => setCurrentDate(d => addMonths(d, 1))}
          className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Mois suivant
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement du calendrier...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAY_HEADERS.map(d => (
              <div
                key={d}
                className={`py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                  d === 'Sam' || d === 'Dim' ? 'text-gray-400 bg-gray-50' : 'text-gray-600'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {gridDays.map((day, idx) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const leaves = leavesByDay[dayKey] ?? []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const weekend = isWeekend(day)

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 ${
                    !isCurrentMonth ? 'bg-gray-50' : weekend ? 'bg-slate-50' : 'bg-white'
                  } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  {/* Day number */}
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : !isCurrentMonth
                        ? 'text-gray-300'
                        : weekend
                          ? 'text-gray-400'
                          : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>

                  {/* Leave blocks (max 3 visible, +N more) */}
                  <div className="space-y-0.5">
                    {leaves.slice(0, 3).map((leave, i) => (
                      <div
                        key={`${leave.id}-${i}`}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium"
                        style={{ backgroundColor: leave.conges_type_color }}
                        title={`${leave.employee_name} — ${leave.conges_type_name}`}
                      >
                        {leave.employee_name}
                      </div>
                    ))}
                    {leaves.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">
                        +{leaves.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {calendarData.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Types:</span>
          {Array.from(new Map(calendarData.map(e => [e.conges_type_name, e.conges_type_color])).entries()).map(([name, color]) => (
            <span key={name} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color ?? '#3B82F6' }} />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

