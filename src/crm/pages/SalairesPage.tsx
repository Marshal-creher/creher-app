import React, { useState, useRef } from 'react'
import api from '../lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Eye,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { salairesService } from '../services/salaires.service'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../lib/utils'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { StatsCard } from '../components/ui/StatsCard'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface PayrollRun {
  id: number
  period_month: number
  period_year: number
  status: string
  created_at: string
  employee_count?: number
  payslip_count?: number
  total_gross: number
  total_net: number
  notes?: string
}

interface ExcelRow {
  employee_code: string
  employee_name?: string
  _matched?: boolean
}

// Headers of the reference workbook's "Paie" sheet: the server recognises them,
// so the workbook itself can be imported. The template only carries the
// month's variables: contract elements (panier, transport…) are taken from the
// previous month, and a blank cell in a column of the file counts as 0.
const TEMPLATE_HEADERS = [
  'Matricule', 'NOM & PRENOM', 'JOURS ABSENCE NON PAYÉE (nb)', 'JOURS DE CONGÉ PRIS (nb)', 'Nb heures supp.',
  'Nb jours fériés travaillés', 'Nb jours supp.', 'Nb jours régul. (oubli)', 'RELIQUAT M-1 (brut)',
  'Jours non inclus panier (nb)', 'BONUS BRUT', 'BONUS BRUT 5%', 'COMMISSION BRUT', 'MALUS BRUT (déduit)',
  'PRIME DE NUIT NET CIBLE', 'COMMISSION NET CIBLE', 'BONUS NET CIBLE', 'Bonus NET 5%', 'MALUS NET CIBLE (déduit)',
]

function downloadTemplate(employees: Array<{ employee_code: string; first_name: string; last_name: string }>) {
  const rows = [
    TEMPLATE_HEADERS,
    ...employees.map(e => [e.employee_code, `${e.last_name} ${e.first_name}`]),
  ]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = TEMPLATE_HEADERS.map((h, i) => ({ wch: i === 1 ? 28 : Math.max(10, Math.min(h.length + 2, 30)) }))
  XLSX.utils.book_append_sheet(wb, ws, 'Paie')
  XLSX.writeFile(wb, 'modele_variables_paie.xlsx')
}

const normalizeLabel = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function SalairesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PayrollRun | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importRows, setImportRows] = useState<ExcelRow[]>([])
  const [importForm, setImportForm] = useState({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), notes: '' })

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [form, setForm] = useState({
    period_month: currentMonth,
    period_year: currentYear,
    notes: '',
  })

  const { data: runs = [], isLoading } = useQuery<PayrollRun[]>({
    queryKey: ['payroll-runs'],
    queryFn: () => salairesService.getPayrollRuns(),
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees-actif-salaires'],
    queryFn: () => api.get('/employees', { params: { status: 'ACTIF', limit: 200 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),
  })
  const employees = (Array.isArray(employeesData) ? employeesData : []) as Array<{ employee_code: string; first_name: string; last_name: string }>

  const createMutation = useMutation({
    mutationFn: salairesService.createPayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      toast.success('Paie créée avec succès !')
      setShowCreateModal(false)
      setForm({ period_month: currentMonth, period_year: currentYear, notes: '' })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salairesService.deletePayrollRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      toast.success('Paie supprimée')
      setShowDeleteModal(false)
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression')
    },
  })

  const importMutation = useMutation({
    mutationFn: () => salairesService.importExcel(importFile!, importForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      toast.success('Paie importée avec succès !')
      setShowImportModal(false)
      setImportFile(null)
      setImportRows([])
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || err?.message || 'Erreur lors de l\'import')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const sheetName = wb.SheetNames.find(n => normalizeLabel(n) === 'paie') ?? wb.SheetNames[0]
      const raw = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: null })
      const codeHeaders = ['matricule', 'employee code', 'code employe', 'code']
      const headerIndex = raw.slice(0, 15).findIndex(r => r.some(c => codeHeaders.includes(normalizeLabel(c))))
      if (headerIndex < 0) {
        toast.error('Colonne « Matricule » introuvable dans le fichier')
        setImportRows([])
        return
      }
      const header = raw[headerIndex].map(normalizeLabel)
      const codeCol = header.findIndex(h => codeHeaders.includes(h))
      const nameCol = header.findIndex(h => ['nom prenom', 'nom employe', 'employee name', 'nom'].includes(h))
      const empCodes = new Set(employees.map(e => e.employee_code))
      const parsed: ExcelRow[] = raw.slice(headerIndex + 1)
        .map(row => ({ code: String(row[codeCol] ?? '').trim(), name: nameCol >= 0 ? String(row[nameCol] ?? '') : '' }))
        .filter(r => r.code && normalizeLabel(r.code) !== 'total')
        .map(r => ({ employee_code: r.code, employee_name: r.name, _matched: empCodes.has(r.code) }))
      setImportRows(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  const latestRun = runs[0] as PayrollRun | undefined

  const handleDelete = (run: PayrollRun) => {
    setDeleteTarget(run)
    setShowDeleteModal(true)
  }

  const handleCreate = () => {
    if (!form.period_month || !form.period_year) {
      toast.error('Veuillez sélectionner une période')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Salaires</h1>
          <p className="text-sm text-gray-500 mt-1">Bulletins de paie et virements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Importer Excel
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Créer la Paie
          </button>
        </div>
      </div>

      {/* Stats */}
      {latestRun && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={<TrendingUp />}
            label="Total Brut (dernière paie)"
            value={formatCurrency(latestRun.total_gross)}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<DollarSign />}
            label="Total Net (dernière paie)"
            value={formatCurrency(latestRun.total_net)}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatsCard
            icon={<Users />}
            label="Nombre d'employés"
            value={latestRun.employee_count ?? latestRun.payslip_count ?? 0}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Historique des Paies</h2>
          <span className="ml-auto text-sm text-gray-400">{runs.length} paie(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Période</th>
                <th className="px-6 py-3 text-left font-medium">Date création</th>
                <th className="px-6 py-3 text-left font-medium">Statut</th>
                <th className="px-6 py-3 text-right font-medium">Nb Employés</th>
                <th className="px-6 py-3 text-right font-medium">Total Brut</th>
                <th className="px-6 py-3 text-right font-medium">Total Net</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <DollarSign className="h-12 w-12 text-gray-200" />
                      <p className="font-medium text-gray-500">Aucune paie créée</p>
                      <p className="text-sm">Cliquez sur "Créer la Paie" pour démarrer</p>
                    </div>
                  </td>
                </tr>
              ) : (
                runs.map((run: PayrollRun) => (
                  <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {MONTHS[(run.period_month - 1)]} {run.period_year}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(run.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                        {getStatusLabel(run.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">{run.employee_count ?? run.payslip_count ?? '-'}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{formatCurrency(run.total_gross)}</td>
                    <td className="px-6 py-4 text-right text-emerald-700 font-semibold">{formatCurrency(run.total_net)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/crm/salaires/${run.id}`)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </button>
                        {run.status !== 'PAYE' && (
                          <button
                            onClick={() => handleDelete(run)}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors font-medium"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle paie"
        size="md"
      >
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mois</label>
              <select
                value={form.period_month}
                onChange={e => setForm(f => ({ ...f, period_month: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année</label>
              <select
                value={form.period_year}
                onChange={e => setForm(f => ({ ...f, period_year: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Remarques sur cette paie..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-700">
            Cette action va calculer automatiquement les salaires de tous les employés actifs pour la période sélectionnée.
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {createMutation.isPending ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Générer
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>

      {/* Excel Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportFile(null); setImportRows([]) }}
        title="Importer la paie depuis Excel"
        size="xl"
      >
        <ModalBody className="space-y-4">
          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mois</label>
              <select
                value={importForm.period_month}
                onChange={e => setImportForm(f => ({ ...f, period_month: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année</label>
              <select
                value={importForm.period_year}
                onChange={e => setImportForm(f => ({ ...f, period_year: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* File upload + template */}
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-emerald-300 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {importFile ? importFile.name : 'Sélectionner un fichier Excel'}
            </button>
            <button
              onClick={() => downloadTemplate(employees)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Modèle Excel
            </button>
          </div>

          {/* Preview table */}
          {importRows.length > 0 && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 flex items-center gap-2">
                <span>{importRows.length} lignes importées</span>
                <span className="ml-auto text-emerald-600">{importRows.filter(r => r._matched).length} employés reconnus</span>
                {importRows.some(r => !r._matched) && (
                  <span className="text-red-500">{importRows.filter(r => !r._matched).length} non trouvés</span>
                )}
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-center">Salarié trouvé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importRows.map((row, i) => (
                      <tr key={i} className={row._matched ? 'bg-white' : 'bg-red-50'}>
                        <td className="px-3 py-2 font-mono font-medium">{row.employee_code}</td>
                        <td className="px-3 py-2 text-gray-700">{row.employee_name}</td>
                        <td className="px-3 py-2 text-center">
                          {row._matched
                            ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                            : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <strong>Fichiers acceptés :</strong> le modèle ci-dessus, ou directement le classeur « Payroll File Requalibré »
            (onglet Paie) : les salariés sont reconnus par leur matricule et toutes ses colonnes de saisie sont reprises.<br />
            Une colonne présente dans le fichier remplace la valeur du HRM (cellule vide = 0). Les colonnes absentes gardent
            les valeurs préremplies : pointage du mois, primes du contrat reprises du mois précédent.
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => { setShowImportModal(false); setImportFile(null); setImportRows([]) }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => importMutation.mutate()}
            disabled={!importFile || importMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
          >
            {importMutation.isPending ? (
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importer et calculer
          </button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <ModalBody>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-red-50 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Êtes-vous sûr de vouloir supprimer la paie de{' '}
                <strong>
                  {deleteTarget
                    ? `${MONTHS[(deleteTarget.period_month - 1)]} ${deleteTarget.period_year}`
                    : ''}
                </strong>{' '}?
              </p>
              <p className="text-xs text-gray-400 mt-1">Cette action est irréversible.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            {deleteMutation.isPending ? (
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Supprimer
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
