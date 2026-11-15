import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Timer, AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, Users } from 'lucide-react'
import { format, addDays, parseISO, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  periodeEssaiService,
  type PeriodeEssaiEmployee,
} from '../services/periodeEssai.service'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getDaysRemaining(trialEndDate: string | null): number {
  if (!trialEndDate) return 9999
  const end = parseISO(trialEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInDays(end, today)
}

function DaysBadge({ days }: { days: number }) {
  if (days <= 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300">
        Expiré
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
        {days} jour{days > 1 ? 's' : ''}
      </span>
    )
  }
  if (days <= 15) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
        {days} jours
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
      {days} jours
    </span>
  )
}

function rowBg(days: number): string {
  if (days <= 0) return 'bg-gray-100'
  if (days <= 7) return 'bg-red-50'
  if (days <= 15) return 'bg-amber-50'
  return 'bg-white'
}

function AlertBadge({ days }: { days: number }) {
  if (days <= 0) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" title="Expiré" />
  }
  if (days <= 7) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Alerte rouge" />
  }
  if (days <= 15) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" title="Alerte jaune" />
  }
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" title="OK" />
}

// ─── Confirm CDI dialog ───────────────────────────────────────────────────────

interface ConfirmDialogProps {
  employee: PeriodeEssaiEmployee
  onClose: () => void
  onConfirmed: () => void
}

function ConfirmDialog({ employee, onClose, onConfirmed }: ConfirmDialogProps) {
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      periodeEssaiService.doAction(employee.id, {
        action: 'CONFIRME',
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success(
        `L'embauche définitive de ${employee.first_name} ${employee.last_name} a été confirmée en CDI. Pensez à générer une Attestation de Travail.`,
        { duration: 5000 }
      )
      queryClient.invalidateQueries({ queryKey: ['periode-essai'] })
      onConfirmed()
    },
    onError: () => {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Confirmer l'embauche définitive</h2>
            <p className="text-sm text-gray-500">Passage en CDI</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          Êtes-vous sûr de vouloir confirmer l'embauche définitive de{' '}
          <strong>{employee.first_name} {employee.last_name}</strong> en CDI ?
        </p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Observations sur la période d'essai..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Confirmation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmer en CDI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Renouveler modal ─────────────────────────────────────────────────────────

interface RenewModalProps {
  employee: PeriodeEssaiEmployee
  onClose: () => void
  onRenewed: () => void
}

function RenewModal({ employee, onClose, onRenewed }: RenewModalProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentEnd = employee.trial_period_end_date || today
  const [newEndDate, setNewEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const prolongDays =
    newEndDate
      ? differenceInDays(parseISO(newEndDate), parseISO(currentEnd))
      : null

  const mutation = useMutation({
    mutationFn: () =>
      periodeEssaiService.doAction(employee.id, {
        action: 'RENOUVELE',
        new_end_date: newEndDate,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success(`Période d'essai de ${employee.first_name} ${employee.last_name} renouvelée jusqu'au ${format(parseISO(newEndDate), 'dd/MM/yyyy', { locale: fr })}.`)
      queryClient.invalidateQueries({ queryKey: ['periode-essai'] })
      onRenewed()
    },
    onError: () => {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    },
  })

  const canSubmit = Boolean(newEndDate) && (!prolongDays || prolongDays > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Renouveler la période d'essai</h2>
            <p className="text-sm text-gray-500">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-sm">
          <span className="text-gray-500">Fin actuelle : </span>
          <span className="font-semibold text-gray-900">
            {currentEnd
              ? format(parseISO(currentEnd), 'dd MMMM yyyy', { locale: fr })
              : '—'}
          </span>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Nouvelle date de fin <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={newEndDate}
            min={today}
            onChange={e => setNewEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {prolongDays !== null && prolongDays > 0 && (
            <p className="mt-1.5 text-xs text-blue-600 font-medium">
              Prolongation de {prolongDays} jour{prolongDays > 1 ? 's' : ''}
            </p>
          )}
          {prolongDays !== null && prolongDays <= 0 && (
            <p className="mt-1.5 text-xs text-red-500">
              La nouvelle date doit être postérieure à la date de fin actuelle.
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Raison du renouvellement..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Renouvellement...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Renouveler
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Rompre dialog ────────────────────────────────────────────────────────────

interface RuptureDialogProps {
  employee: PeriodeEssaiEmployee
  onClose: () => void
  onDone: () => void
}

function RuptureDialog({ employee, onClose, onDone }: RuptureDialogProps) {
  const [motif, setMotif] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      periodeEssaiService.doAction(employee.id, {
        action: 'ROMPU',
        motif,
      }),
    onSuccess: () => {
      toast.success(`La période d'essai de ${employee.first_name} ${employee.last_name} a été rompue. Le contrat est maintenant TERMINÉ.`, { duration: 5000 })
      queryClient.invalidateQueries({ queryKey: ['periode-essai'] })
      onDone()
      navigate(`/crm/employes/${employee.id}`)
    },
    onError: () => {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Rompre la période d'essai</h2>
            <p className="text-sm text-gray-500">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700 font-medium">
            Cette action mettra fin au contrat de l'employé. Le statut passera à TERMINÉ.
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Motif de rupture <span className="text-red-500">*</span>
          </label>
          <textarea
            value={motif}
            onChange={e => setMotif(e.target.value)}
            rows={4}
            placeholder="Décrivez le motif de la rupture de la période d'essai..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!motif.trim() || mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Rompre la période d'essai
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterTab = 'tous' | 'en_cours' | 'expires'

type DialogState =
  | { type: 'none' }
  | { type: 'confirm'; employee: PeriodeEssaiEmployee }
  | { type: 'renew'; employee: PeriodeEssaiEmployee }
  | { type: 'rupture'; employee: PeriodeEssaiEmployee }

export function PeriodeEssaiPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('tous')
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['periode-essai'],
    queryFn: () => periodeEssaiService.getAll(),
    refetchInterval: 60000,
  })

  const employees: PeriodeEssaiEmployee[] = data?.data ?? []
  const stats = data?.stats ?? {
    total: 0,
    expiring_this_month: 0,
    alert_red: 0,
    alert_yellow: 0,
  }

  // Compute days_remaining from trial_period_end_date if not returned by API
  const enriched = employees.map(emp => ({
    ...emp,
    days_remaining:
      typeof emp.days_remaining === 'number'
        ? emp.days_remaining
        : getDaysRemaining(emp.trial_period_end_date),
  }))

  const filtered = enriched.filter(emp => {
    if (activeTab === 'en_cours') return emp.days_remaining > 0
    if (activeTab === 'expires') return emp.days_remaining <= 0
    return true
  })

  const urgentRed = enriched.filter(e => e.days_remaining > 0 && e.days_remaining <= 7)
  const urgentYellow = enriched.filter(e => e.days_remaining > 7 && e.days_remaining <= 15)

  const closeDialog = () => setDialog({ type: 'none' })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'expires', label: 'Expirés' },
  ]

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Périodes d'Essai</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez et suivez les périodes d'essai de vos employés
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total || enriched.length}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Total en période d'essai</p>
          </div>
        </div>

        {/* Expiring this month */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.expiring_this_month}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Expirant ce mois-ci</p>
          </div>
        </div>

        {/* Alert red */}
        <div className="bg-white border border-red-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.alert_red || urgentRed.length}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Alerte ROUGE ≤ 7 jours</p>
          </div>
        </div>

        {/* Alert yellow */}
        <div className="bg-white border border-yellow-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
            <Timer className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{stats.alert_yellow || urgentYellow.length}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Alerte JAUNE 8-15 jours</p>
          </div>
        </div>
      </div>

      {/* Alert banners */}
      {urgentRed.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl px-5 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            URGENT : {urgentRed.length} employé{urgentRed.length > 1 ? 's' : ''} dont la période d'essai expire dans moins de 7 jours !
          </p>
        </div>
      )}

      {urgentYellow.length > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-yellow-700">
            ATTENTION : {urgentYellow.length} employé{urgentYellow.length > 1 ? 's' : ''} dont la période d'essai expire dans 15 jours
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Chargement des données...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-500">Erreur lors du chargement des données.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Timer className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Aucun employé trouvé</p>
              <p className="text-xs text-gray-400">
                {activeTab === 'tous'
                  ? "Aucun employé n'est actuellement en période d'essai."
                  : activeTab === 'en_cours'
                  ? "Aucun employé en cours de période d'essai."
                  : "Aucune période d'essai expirée."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employé</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Département</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Poste</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Embauché le</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Fin Période</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Jours Restants</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Alerte</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(emp => {
                  const days = emp.days_remaining
                  return (
                    <tr
                      key={emp.id}
                      className={`${rowBg(days)} hover:brightness-95 transition-colors`}
                    >
                      {/* Employé */}
                      <td className="px-5 py-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate(`/crm/employes/${emp.id}`)}
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-700">
                              {emp.first_name?.[0]}{emp.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                              {emp.first_name} {emp.last_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {emp.employee_code}
                        </span>
                      </td>

                      {/* Département */}
                      <td className="px-4 py-3 text-gray-700 text-sm">
                        {emp.department_name || <span className="text-gray-400 italic">—</span>}
                      </td>

                      {/* Poste */}
                      <td className="px-4 py-3 text-gray-700 text-sm">
                        {emp.position_title || <span className="text-gray-400 italic">—</span>}
                      </td>

                      {/* Embauché le */}
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {emp.hire_date
                          ? format(parseISO(emp.hire_date), 'dd/MM/yyyy')
                          : '—'}
                      </td>

                      {/* Fin Période */}
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {emp.trial_period_end_date
                          ? format(parseISO(emp.trial_period_end_date), 'dd/MM/yyyy')
                          : '—'}
                      </td>

                      {/* Jours Restants */}
                      <td className="px-4 py-3 text-center">
                        <DaysBadge days={days} />
                      </td>

                      {/* Alerte */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <AlertBadge days={days} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Confirmer */}
                          {days > 0 && (
                            <button
                              onClick={() => setDialog({ type: 'confirm', employee: emp })}
                              title="Confirmer l'embauche définitive en CDI"
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* Renouveler */}
                          <button
                            onClick={() => setDialog({ type: 'renew', employee: emp })}
                            title="Renouveler la période d'essai"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>

                          {/* Rompre */}
                          <button
                            onClick={() => setDialog({ type: 'rupture', employee: emp })}
                            title="Rompre la période d'essai"
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {filtered.length} employé{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400">
              Dernière mise à jour : {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {dialog.type === 'confirm' && (
        <ConfirmDialog
          employee={dialog.employee}
          onClose={closeDialog}
          onConfirmed={closeDialog}
        />
      )}
      {dialog.type === 'renew' && (
        <RenewModal
          employee={dialog.employee}
          onClose={closeDialog}
          onRenewed={closeDialog}
        />
      )}
      {dialog.type === 'rupture' && (
        <RuptureDialog
          employee={dialog.employee}
          onClose={closeDialog}
          onDone={closeDialog}
        />
      )}
    </div>
  )
}
