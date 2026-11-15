import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Download,
  Edit2,
  Save,
  X,
  Printer,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Gift,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { salairesService } from '../../services/salaires.service'
import { settingsService } from '../../services/settings.service'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils'
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { generatePayslipPDF } from '../../lib/pdfGenerator'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface Payslip {
  id: number
  employee_id: number
  employee_name: string
  employee_code: string
  cin?: string
  cnss_number?: string
  position_title?: string
  department?: string
  bank_name?: string
  bank_account?: string
  period_month: number
  period_year: number
  base_salary: number
  overtime_pay: number
  bonuses: number
  gross_salary: number
  cnss_employee: number
  amo_employee: number
  igr: number
  avance_deduction: number
  other_deductions: number
  retard_minutes?: number
  retard_deduction?: number
  mutuelle_rate?: number
  mutuelle_employee?: number
  net_salary: number
  days_worked: number
  days_absent: number
  status: string
}

interface PayrollRun {
  id: number
  period_month: number
  period_year: number
  status: string
  created_at: string
  paid_at?: string
  payment_date?: string
  payment_method?: string
  employee_count: number
  total_gross: number
  total_net: number
  notes?: string
  company?: Record<string, unknown>
}

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const runId = Number(id)

  const [showPayModal, setShowPayModal] = useState(false)
  const [showPayslipModal, setShowPayslipModal] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [editingPayslipId, setEditingPayslipId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState({ bonuses: 0, other_deductions: 0, mutuelle_rate: 0 })

  // ── Saisie des Primes ──
  const [showPrimesModal, setShowPrimesModal] = useState(false)
  type PrimeRow = { diverse: number; transport: number; anciennete: number; assiduite: number; autre: number }
  const PRIME_FIELDS: { key: keyof PrimeRow; label: string }[] = [
    { key: 'diverse',    label: 'Diverse' },
    { key: 'transport',  label: 'Transport' },
    { key: 'anciennete', label: 'Ancienneté' },
    { key: 'assiduite',  label: 'Assiduité' },
    { key: 'autre',      label: 'Autre' },
  ]
  const EMPTY_ROW: PrimeRow = { diverse: 0, transport: 0, anciennete: 0, assiduite: 0, autre: 0 }
  const [primesData, setPrimesData] = useState<Record<number, PrimeRow>>({})
  const [savingPrimes, setSavingPrimes] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkValues, setBulkValues] = useState<PrimeRow>({ ...EMPTY_ROW })

  const openPrimesModal = () => {
    const initial: Record<number, PrimeRow> = {}
    payslips.forEach((p: Payslip) => {
      initial[p.id] = { diverse: p.bonuses || 0, transport: 0, anciennete: 0, assiduite: 0, autre: 0 }
    })
    setPrimesData(initial)
    setSelectedIds(new Set())
    setBulkValues({ ...EMPTY_ROW })
    setShowPrimesModal(true)
  }

  const setPrime = (id: number, field: keyof PrimeRow, val: number) => {
    setPrimesData(prev => ({ ...prev, [id]: { ...prev[id], [field]: isNaN(val) ? 0 : val } }))
  }

  const totalPrimes = (row: PrimeRow) => row.diverse + row.transport + row.anciennete + row.assiduite + row.autre

  const toggleAll = () => {
    if (selectedIds.size === payslips.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(payslips.map((p: Payslip) => p.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyBulk = () => {
    setPrimesData(prev => {
      const updated = { ...prev }
      for (const id of selectedIds) {
        updated[id] = { ...bulkValues }
      }
      return updated
    })
  }

  const saveAllPrimes = async () => {
    setSavingPrimes(true)
    try {
      const updates = payslips
        .filter((p: Payslip) => {
          const row = primesData[p.id]
          return row !== undefined && Math.round(totalPrimes(row) * 100) !== Math.round(p.bonuses * 100)
        })
        .map((p: Payslip) => ({ payslipId: p.id, data: { bonuses: totalPrimes(primesData[p.id]) } }))

      if (updates.length === 0) {
        toast('Aucune modification détectée', { icon: 'ℹ️' })
        setShowPrimesModal(false)
        return
      }

      await Promise.all(updates.map(u => salairesService.updatePayslip(u.payslipId, u.data)))
      queryClient.invalidateQueries({ queryKey: ['payroll-run-payslips', runId] })
      queryClient.invalidateQueries({ queryKey: ['payroll-run', runId] })
      toast.success(`${updates.length} bulletin(s) mis à jour !`)
      setShowPrimesModal(false)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Erreur inconnue'
      toast.error(`Erreur: ${msg}`)
    } finally {
      setSavingPrimes(false)
    }
  }

  const [payForm, setPayForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Virement',
  })

  const { data: run, isLoading: runLoading } = useQuery<PayrollRun>({
    queryKey: ['payroll-run', runId],
    queryFn: () => salairesService.getPayrollRun(runId),
  })

  const { data: payslips = [], isLoading: payslipsLoading } = useQuery<Payslip[]>({
    queryKey: ['payroll-run-payslips', runId],
    queryFn: () => salairesService.getPayslips(runId),
  })

  const { data: companySettings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  })

  const markPaidMutation = useMutation({
    mutationFn: (data: { payment_date: string; payment_method?: string }) =>
      salairesService.markRunAsPaid(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-run', runId] })
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      toast.success('Paie marquée comme payée !')
      setShowPayModal(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur')
    },
  })

  const updatePayslipMutation = useMutation({
    mutationFn: ({ payslipId, data }: { payslipId: number; data: object }) =>
      salairesService.updatePayslip(payslipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-run-payslips', runId] })
      queryClient.invalidateQueries({ queryKey: ['payroll-run', runId] })
      toast.success('Bulletin mis à jour')
      setEditingPayslipId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur')
    },
  })

  const handleEditStart = (p: Payslip) => {
    setEditingPayslipId(p.id)
    setEditValues({ bonuses: p.bonuses, other_deductions: p.other_deductions, mutuelle_rate: (p as any).mutuelle_rate ?? 0 })
  }

  const handleEditSave = (p: Payslip) => {
    updatePayslipMutation.mutate({
      payslipId: p.id,
      data: editValues,
    })
  }

  const handleExportExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx')
      const data = payslips.map(p => ({
        'Employé': p.employee_name,
        'Code': p.employee_code,
        'Jours Présents': p.days_worked,
        'Jours Absents': p.days_absent,
        'Salaire Brut': p.gross_salary,
        'CNSS': p.cnss_employee,
        'AMO': p.amo_employee,
        'IGR': p.igr,
        'Primes': p.bonuses,
        'Retenues': p.other_deductions,
        'Salaire Net': p.net_salary,
        'Statut': p.status,
      }))
      const ws = utils.json_to_sheet(data)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Bulletins de Paie')
      writeFile(wb, `paie_${run?.period_month}_${run?.period_year}.xlsx`)
      toast.success('Export Excel réussi')
    } catch {
      toast.error("Erreur lors de l'export Excel. Assurez-vous que la bibliothèque xlsx est installée.")
    }
  }

  const handleDownloadPayslipPDF = async (p: Payslip) => {
    const company: Record<string, unknown> = companySettings
      ? { ...companySettings }
      : { name: 'INFINITAS', address: '', ice: '', rc: '' }
    await generatePayslipPDF(p as unknown as Record<string, unknown>, company)
  }

  if (runLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (!run) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Paie introuvable</p>
        <button onClick={() => navigate('/crm/salaires')} className="mt-4 text-indigo-600 underline text-sm">
          Retour à la liste
        </button>
      </div>
    )
  }

  const periodLabel = `${MONTHS[(run.period_month - 1)]} ${run.period_year}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/crm/salaires')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paie — {periodLabel}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Créée le {formatDate(run.created_at)}
            {run.payment_date && ` · Payée le ${formatDate(run.payment_date)}`}
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Statut</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
              {getStatusLabel(run.status)}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Brut</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(run.total_gross)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Net</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(run.total_net)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Employés</p>
            <p className="text-lg font-bold text-gray-900">{run.employee_count ?? payslips.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {run.status !== 'PAYE' && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              Marquer comme Payé
            </button>
          )}
          {run.status !== 'PAYE' && (
            <button
              onClick={openPrimesModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium"
            >
              <Gift className="h-4 w-4" />
              Saisie des Primes
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </button>
          {run.payment_method && (
            <span className="text-sm text-gray-500">
              Mode de paiement: <strong>{run.payment_method}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Payslips table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Bulletins de Paie</h2>
          <span className="ml-auto text-sm text-gray-400">{payslips.length} bulletin(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Employé</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-right font-medium">Présents</th>
                <th className="px-4 py-3 text-right font-medium">Abs</th>
                <th className="px-4 py-3 text-right font-medium">Brut</th>
                <th className="px-4 py-3 text-right font-medium">CNSS</th>
                <th className="px-4 py-3 text-right font-medium">AMO</th>
                <th className="px-4 py-3 text-right font-medium">IGR</th>
                <th className="px-4 py-3 text-right font-medium">Mutuelle %</th>
                <th className="px-4 py-3 text-right font-medium">Primes</th>
                <th className="px-4 py-3 text-right font-medium">Retenues</th>
                <th className="px-4 py-3 text-right font-medium">Net</th>
                <th className="px-4 py-3 text-center font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payslipsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 13 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>Aucun bulletin disponible</p>
                  </td>
                </tr>
              ) : (
                payslips.map((p: Payslip) => {
                  const isEditing = editingPayslipId === p.id
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-indigo-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.employee_name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.employee_code}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{p.days_worked}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{p.days_absent || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(p.gross_salary)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.cnss_employee)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.amo_employee)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.igr)}</td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="20"
                            value={editValues.mutuelle_rate}
                            onChange={e => setEditValues(v => ({ ...v, mutuelle_rate: Number(e.target.value) }))}
                            className="w-20 border border-indigo-300 rounded px-2 py-1 text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        ) : (
                          <span className="text-red-600">{p.mutuelle_rate ? `${p.mutuelle_rate}%` : '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.bonuses}
                            onChange={e => setEditValues(v => ({ ...v, bonuses: Number(e.target.value) }))}
                            className="w-24 border border-indigo-300 rounded px-2 py-1 text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        ) : (
                          <span className="text-emerald-700">{formatCurrency(p.bonuses)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.other_deductions}
                            onChange={e => setEditValues(v => ({ ...v, other_deductions: Number(e.target.value) }))}
                            className="w-24 border border-indigo-300 rounded px-2 py-1 text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        ) : (
                          <span className="text-red-600">{formatCurrency(p.other_deductions)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(p.net_salary)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleEditSave(p)}
                                disabled={updatePayslipMutation.isPending}
                                className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Sauvegarder"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingPayslipId(null)}
                                className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {run.status !== 'PAYE' && (
                                <button
                                  onClick={() => handleEditStart(p)}
                                  className="p-1.5 rounded text-indigo-500 hover:bg-indigo-50 transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPayslip(p)
                                  setShowPayslipModal(true)
                                }}
                                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
                                title="Imprimer Bulletin"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark as Paid Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Marquer comme Payé"
        size="sm"
      >
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de paiement</label>
            <input
              type="date"
              value={payForm.payment_date}
              onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode de paiement</label>
            <select
              value={payForm.payment_method}
              onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="Virement">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Espèces">Espèces</option>
            </select>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700">
            Montant total à payer: <strong>{formatCurrency(run.total_net)}</strong>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowPayModal(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => markPaidMutation.mutate(payForm)}
            disabled={markPaidMutation.isPending || !payForm.payment_date}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
          >
            {markPaidMutation.isPending ? (
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Confirmer
          </button>
        </ModalFooter>
      </Modal>

      {/* Payslip Preview Modal */}
      <Modal
        isOpen={showPayslipModal}
        onClose={() => { setShowPayslipModal(false); setSelectedPayslip(null) }}
        title="Bulletin de Paie"
        size="lg"
      >
        {selectedPayslip && (
          <>
            <ModalBody className="space-y-4">
              {/* Preview header */}
              <div className="bg-indigo-700 text-white rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">BULLETIN DE PAIE</p>
                    <p className="text-indigo-200 text-sm mt-1">
                      Période: {MONTHS[(selectedPayslip.period_month - 1)]} {selectedPayslip.period_year}
                    </p>
                  </div>
                  <span className="text-indigo-200 text-xs font-mono">{selectedPayslip.employee_code}</span>
                </div>
              </div>

              {/* Employee info */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Employé</p>
                  <p className="font-semibold text-gray-900">{selectedPayslip.employee_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Poste</p>
                  <p className="text-gray-700">{selectedPayslip.position_title || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">CIN</p>
                  <p className="text-gray-700">{selectedPayslip.cin || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">N° CNSS</p>
                  <p className="text-gray-700">{selectedPayslip.cnss_number || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Département</p>
                  <p className="text-gray-700">{selectedPayslip.department || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Banque</p>
                  <p className="text-gray-700">{selectedPayslip.bank_name || '-'}</p>
                </div>
              </div>

              {/* Salary breakdown */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-xs">
                      <th className="px-4 py-2.5 text-left font-medium">Rubrique</th>
                      <th className="px-4 py-2.5 text-right font-medium">Montant (MAD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { label: 'Salaire de base', value: selectedPayslip.base_salary, type: 'base' },
                      { label: 'Heures supplémentaires', value: selectedPayslip.overtime_pay, type: 'gain' },
                      { label: 'Primes et avantages', value: selectedPayslip.bonuses, type: 'gain' },
                      { label: 'SALAIRE BRUT', value: selectedPayslip.gross_salary, type: 'total' },
                      { label: '— CNSS salarié (4.48%)', value: -selectedPayslip.cnss_employee, type: 'deduction' },
                      { label: '— AMO salarié (2.26%)', value: -selectedPayslip.amo_employee, type: 'deduction' },
                      { label: '— IGR (retenue à la source)', value: -selectedPayslip.igr, type: 'deduction' },
                      ...(selectedPayslip.mutuelle_rate ? [{ label: `— Mutuelle privée (${selectedPayslip.mutuelle_rate}%)`, value: -(selectedPayslip.mutuelle_employee ?? 0), type: 'deduction' }] : []),
                      ...(selectedPayslip.retard_deduction ? [{ label: `— Retard (${selectedPayslip.retard_minutes} min)`, value: -(selectedPayslip.retard_deduction), type: 'deduction' }] : []),
                      { label: '— Avance sur salaire', value: -selectedPayslip.avance_deduction, type: 'deduction' },
                      { label: '— Autres retenues', value: -selectedPayslip.other_deductions, type: 'deduction' },
                    ].map((row, i) => (
                      <tr key={i} className={row.type === 'total' ? 'bg-gray-100 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className={`px-4 py-2.5 ${row.type === 'deduction' ? 'text-red-600' : row.type === 'total' ? 'text-gray-900' : 'text-gray-700'}`}>
                          {row.label}
                        </td>
                        <td className={`px-4 py-2.5 text-right ${row.type === 'deduction' ? 'text-red-600' : row.type === 'gain' ? 'text-emerald-700' : 'text-gray-900'}`}>
                          {row.value < 0
                            ? `-${formatCurrency(Math.abs(row.value))}`
                            : formatCurrency(row.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between font-bold">
                  <span>SALAIRE NET À PAYER</span>
                  <span>{formatCurrency(selectedPayslip.net_salary)}</span>
                </div>
              </div>

              {/* Days info */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>Jours travaillés: <strong className="text-gray-900">{selectedPayslip.days_worked}</strong></span>
                <span>Jours absents: <strong className="text-gray-900">{selectedPayslip.days_absent || 0}</strong></span>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => { setShowPayslipModal(false); setSelectedPayslip(null) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleDownloadPayslipPDF(selectedPayslip)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Download className="h-4 w-4" />
                Télécharger PDF
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ── Modal Saisie des Primes ── */}
      <Modal
        isOpen={showPrimesModal}
        onClose={() => setShowPrimesModal(false)}
        title={`Saisie des Primes — ${periodLabel}`}
        size="xl"
      >
        <ModalBody>
          {/* Bulk apply section */}
          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs font-semibold text-indigo-700 mb-2">
                Appliquer aux {selectedIds.size} salarié(s) sélectionné(s)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {PRIME_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-xs text-indigo-600">{label}:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bulkValues[key] || ''}
                      onChange={e => setBulkValues(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-20 text-right border border-indigo-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
                <button
                  onClick={applyBulk}
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mb-3">
            Le champ <strong>Diverse</strong> affiche les primes actuelles. Modifiez les champs pour mettre à jour. Seuls les bulletins modifiés seront sauvegardés.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-3 py-2.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === payslips.length && payslips.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium">Employé</th>
                  {PRIME_FIELDS.map(({ key, label }) => (
                    <th key={key} className="px-3 py-2.5 text-right font-medium">{label}</th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-medium text-indigo-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payslips.map((p: Payslip) => {
                  const row = primesData[p.id] ?? { ...EMPTY_ROW }
                  const total = totalPrimes(row)
                  const changed = Math.round(total * 100) !== Math.round(p.bonuses * 100)
                  const isSelected = selectedIds.has(p.id)
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(p.id)}
                          className="rounded border-gray-300 text-indigo-600"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-gray-900 text-sm">{p.employee_name}</div>
                        <div className="text-xs text-gray-400">
                          {p.employee_code} · Base {formatCurrency(p.base_salary)}
                          {p.bonuses > 0 && (
                            <span className="ml-1 text-amber-600 font-medium">
                              · Actuelles: {formatCurrency(p.bonuses)}
                            </span>
                          )}
                        </div>
                      </td>
                      {PRIME_FIELDS.map(({ key }) => (
                        <td key={key} className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row[key] || ''}
                            onChange={e => setPrime(p.id, key, parseFloat(e.target.value))}
                            placeholder="0"
                            className="w-20 text-right border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-semibold ${changed ? 'text-indigo-700' : total > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                          {total > 0 ? formatCurrency(total) : '—'}
                          {changed && <span className="ml-0.5 text-xs">✎</span>}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 text-sm font-semibold">
                  <td colSpan={2} className="px-3 py-2.5 text-indigo-800">Total des primes</td>
                  <td colSpan={5} />
                  <td className="px-3 py-2.5 text-right text-indigo-800">
                    {formatCurrency(Object.values(primesData).reduce((s, r) => s + totalPrimes(r), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowPrimesModal(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={saveAllPrimes}
            disabled={savingPrimes}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {savingPrimes ? 'Enregistrement…' : 'Enregistrer les primes'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
