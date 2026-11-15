import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Plus, RefreshCw, AlertTriangle, CheckCircle, XCircle, Search, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '../lib/axios'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Avance {
  id: number
  employee_id: number
  employee_name?: string
  employee_code?: string
  department?: string
  montant: number
  motif: string | null
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'REMBOURSE' | 'PARTIELLEMENT_REMBOURSE'
  request_date: string
  approved_by?: number | null
  approved_at?: string | null
  notes?: string | null
  created_at: string
}

// ─── Service ───────────────────────────────────────────────────────────────────

const avancesService = {
  getAll: (params?: Record<string, unknown>): Promise<Avance[]> =>
    api.get('/avances', { params }).then(r => {
      const d = r.data.data
      return d?.data ?? d ?? []
    }),

  create: (data: { employee_id: number; montant: number; motif?: string; nb_echeances?: number; date_remboursement_prevue?: string }): Promise<Avance> =>
    api.post('/avances', data).then(r => r.data.data ?? r.data),

  approve: (id: number, notes?: string): Promise<Avance> =>
    api.put(`/avances/${id}/approve`, { notes }).then(r => r.data.data ?? r.data),

  refuse: (id: number, notes: string): Promise<Avance> =>
    api.put(`/avances/${id}/refuse`, { notes }).then(r => r.data.data ?? r.data),
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatMontant(amount: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }).format(amount)
}

function StatusBadge({ status }: { status: Avance['status'] }) {
  const map: Record<Avance['status'], { label: string; classes: string }> = {
    EN_ATTENTE: { label: 'En attente', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    APPROUVE: { label: 'Approuvé', classes: 'bg-green-100 text-green-700 border-green-200' },
    REFUSE: { label: 'Refusé', classes: 'bg-red-100 text-red-700 border-red-200' },
    REMBOURSE: { label: 'Remboursé', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
    PARTIELLEMENT_REMBOURSE: { label: 'Partiellement remboursé', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  }
  const { label, classes } = map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  )
}

// ─── Create Avance Modal ────────────────────────────────────────────────────────

function CreateAvanceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [montant, setMontant] = useState('')
  const [motif, setMotif] = useState('')
  const [nbEcheances, setNbEcheances] = useState('1')
  const [dateRemboursement, setDateRemboursement] = useState('')

  const { data: empResult } = useQuery({
    queryKey: ['employees-search-avance', employeeSearch],
    queryFn: () => api.get('/employees', { params: { search: employeeSearch, status: 'ACTIF', limit: 10 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),
    enabled: employeeSearch.length >= 2,
  })
  const employees: any[] = Array.isArray(empResult) ? empResult : []

  const createMutation = useMutation({
    mutationFn: avancesService.create,
    onSuccess: () => {
      toast.success('Demande d\'avance créée avec succès')
      onSuccess()
      onClose()
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur lors de la création'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) { toast.error('Sélectionnez un employé'); return }
    const m = parseFloat(montant)
    if (!m || m <= 0) { toast.error('Montant invalide'); return }
    createMutation.mutate({
      employee_id: selectedEmployee.id,
      montant: m,
      motif: motif || undefined,
      nb_echeances: parseInt(nbEcheances) || 1,
      date_remboursement_prevue: dateRemboursement || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Nouvelle demande d'avance</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee search */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employé *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setSelectedEmployee(null); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Rechercher un employé..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {showDropdown && employees.length > 0 && !selectedEmployee && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {employees.map((emp: any) => (
                  <button
                    key={emp.id}
                    type="button"
                    onMouseDown={() => { setSelectedEmployee(emp); setShowDropdown(false); setEmployeeSearch('') }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                    <span className="text-gray-400 text-xs ml-2">{emp.employee_code} — {emp.department_name}</span>
                    <span className="text-indigo-500 text-xs ml-2">Salaire: {formatMontant(emp.base_salary)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedEmployee && (
              <div className="mt-1 flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
                <span>{selectedEmployee.first_name} {selectedEmployee.last_name} — Salaire brut: {formatMontant(selectedEmployee.base_salary)}</span>
                <button type="button" onClick={() => setSelectedEmployee(null)} className="ml-auto text-indigo-400 hover:text-indigo-600">×</button>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Montant demandé (MAD) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="ex: 2000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Motif */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Motif (optionnel)</label>
            <input
              type="text"
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="ex: Frais médicaux, réparation voiture..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Echeances + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre d'échéances</label>
              <select
                value={nbEcheances}
                onChange={e => setNbEcheances(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {[1,2,3,4,5,6,8,10,12].map(n => (
                  <option key={n} value={n}>{n} mois</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date remboursement prévue</label>
              <input
                type="date"
                value={dateRemboursement}
                onChange={e => setDateRemboursement(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Preview */}
          {montant && parseFloat(montant) > 0 && parseInt(nbEcheances) > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              Remboursement : {nbEcheances} × {formatMontant(parseFloat(montant) / parseInt(nbEcheances))} / mois
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !selectedEmployee || !montant}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Envoi...</>
              ) : (
                <><Plus className="h-4 w-4" /> Soumettre la demande</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function AvancesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('tous')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refuseDialog, setRefuseDialog] = useState<{ open: boolean; avance: Avance | null }>({ open: false, avance: null })
  const [refuseNotes, setRefuseNotes] = useState('')

  const { data: avances = [], isLoading, isError } = useQuery({
    queryKey: ['avances'],
    queryFn: () => avancesService.getAll(),
    refetchInterval: 60000,
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => avancesService.approve(id),
    onSuccess: () => {
      toast.success('Avance approuvée avec succès.')
      queryClient.invalidateQueries({ queryKey: ['avances'] })
    },
    onError: () => toast.error('Erreur lors de l\'approbation.'),
  })

  const refuseMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => avancesService.refuse(id, notes),
    onSuccess: () => {
      toast.success('Avance refusée.')
      queryClient.invalidateQueries({ queryKey: ['avances'] })
      setRefuseDialog({ open: false, avance: null })
      setRefuseNotes('')
    },
    onError: () => toast.error('Erreur lors du refus.'),
  })

  const filtered = avances.filter(a => {
    const matchSearch =
      !search ||
      a.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.employee_code?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'tous' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalEnAttente = avances.filter(a => a.status === 'EN_ATTENTE').length
  const totalApprouve = avances.filter(a => a.status === 'APPROUVE').length
  const montantTotal = avances
    .filter(a => a.status === 'APPROUVE' || a.status === 'REMBOURSE' || a.status === 'PARTIELLEMENT_REMBOURSE')
    .reduce((sum, a) => sum + a.montant, 0)

  const statusTabs = [
    { key: 'tous', label: 'Toutes' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'APPROUVE', label: 'Approuvées' },
    { key: 'REFUSE', label: 'Refusées' },
    { key: 'REMBOURSE', label: 'Remboursées' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avances sur Salaire</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les demandes d'avances des employés</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalEnAttente}</p>
            <p className="text-xs text-gray-500 mt-0.5">En attente d'approbation</p>
          </div>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalApprouve}</p>
            <p className="text-xs text-gray-500 mt-0.5">Approuvées en cours</p>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{formatMontant(montantTotal)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Montant total accordé</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === tab.key
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un employé..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-500">Erreur lors du chargement des avances.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <CreditCard className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Aucune avance trouvée</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer une demande
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employé</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Département</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Motif</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date demande</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(avance => (
                  <tr key={avance.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-700">
                            {avance.employee_name?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{avance.employee_name ?? `Employé #${avance.employee_id}`}</p>
                          {avance.employee_code && (
                            <p className="text-xs text-gray-400 font-mono">{avance.employee_code}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {avance.department ?? <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatMontant(avance.montant)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {avance.motif ?? <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {avance.request_date
                        ? format(parseISO(avance.request_date), 'dd/MM/yyyy', { locale: fr })
                        : format(parseISO(avance.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={avance.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {avance.status === 'EN_ATTENTE' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(avance.id)}
                              disabled={approveMutation.isPending}
                              title="Approuver"
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setRefuseDialog({ open: true, avance })}
                              title="Refuser"
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {avance.status !== 'EN_ATTENTE' && (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              {filtered.length} avance{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAvanceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['avances'] })}
        />
      )}

      {/* Refuse dialog */}
      {refuseDialog.open && refuseDialog.avance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Refuser l'avance</h2>
                <p className="text-sm text-gray-500">{refuseDialog.avance.employee_name}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              Avance de <strong>{formatMontant(refuseDialog.avance.montant)}</strong> — veuillez indiquer le motif du refus.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Motif du refus <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refuseNotes}
                onChange={e => setRefuseNotes(e.target.value)}
                rows={3}
                placeholder="Raison du refus..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRefuseDialog({ open: false, avance: null }); setRefuseNotes('') }}
                disabled={refuseMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => refuseMutation.mutate({ id: refuseDialog.avance!.id, notes: refuseNotes })}
                disabled={!refuseNotes.trim() || refuseMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {refuseMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Traitement...</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Refuser</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
