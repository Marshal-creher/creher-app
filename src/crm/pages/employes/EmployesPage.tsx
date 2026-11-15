import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Pencil, UserX, Filter, Upload, X, CheckCircle, AlertCircle, FileSpreadsheet, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { employeesService } from '../../services/employees.service'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { formatCurrency, formatDate, getContractTypeShortLabel } from '../../lib/utils'
import { grossToNet } from '../../lib/payrollUtils'
import type { Employee, Department } from '../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIF', label: 'Actif' },
  { value: 'SUSPENDU', label: 'Suspendu' },
  { value: 'TERMINE', label: 'Terminé' },
]

const CONTRACT_OPTIONS = [
  { value: '', label: 'Tous les contrats' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'PERIODE_ESSAI', label: "Période d'Essai" },
]

// ── Import result detail type ─────────────────────────────────────────────────
type ImportDetail = { row: number; status: 'ok' | 'error'; name?: string; error?: string }
type ImportResult = { imported: number; errors: number; total: number; details: ImportDetail[] }

export function EmployesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [contractType, setContractType] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showGross, setShowGross] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', { search, status, departmentId, contractType, page }],
    queryFn: () => employeesService.getEmployees({
      search: search || undefined,
      status: status || undefined,
      department_id: departmentId ? parseInt(departmentId) : undefined,
      contract_type: contractType || undefined,
      page,
      limit: 20,
    }),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: employeesService.getDepartments,
  })

  const deleteMutation = useMutation({
    mutationFn: employeesService.deleteEmployee,
    onSuccess: () => {
      toast.success('Employé archivé avec succès')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: () => toast.error('Erreur lors de l\'archivage'),
  })

  // ── Import handlers ────────────────────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setImportFile(f); setImportResult(null) }
  }

  const handleImportSubmit = async () => {
    if (!importFile) return
    setImporting(true)
    try {
      const result = await employeesService.importFromExcel(importFile)
      setImportResult(result)
      if (result.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ['employees'] })
        toast.success(`${result.imported} employé(s) importé(s) avec succès`)
      }
      if (result.errors > 0) toast.error(`${result.errors} ligne(s) en erreur`)
    } catch {
      toast.error("Erreur lors de l'import")
    } finally {
      setImporting(false)
    }
  }

  const handleCloseImport = () => {
    setShowImport(false)
    setImportFile(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Download template ──────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      'Prénom', 'Nom', 'CIN', 'CNSS', 'Email', 'Téléphone',
      'Adresse', 'Ville', 'Date de naissance', "Date d'embauche",
      'Type contrat', 'Date fin contrat', 'Département', 'Poste',
      'Salaire de base NET', 'Banque', 'Compte bancaire',
      'Sexe', 'Situation familiale', "Nombre d'enfants", 'Nationalité',
    ]
    const example = [
      'Mohamed', 'Alami', 'BE123456', '1234567', 'malami@example.com', '+212600000000',
      '10 Rue Hassan II', 'Casablanca', '15/06/1990', '01/03/2023',
      'CDI', '', 'RH', 'Responsable RH',
      '8000', 'Attijariwafa', 'MA123456789', 'M', 'Célibataire', '0', 'Marocaine',
    ]
    const csvRows = [headers.join(','), example.join(',')]
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template_import_employes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const departmentOptions = [
    { value: '', label: 'Tous les départements' },
    ...departments.map((d: Department) => ({ value: String(d.id), label: d.name })),
  ]

  const columns: Column<Employee>[] = [
    {
      key: 'employee_code',
      header: 'Code',
      render: (emp) => (
        <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          {emp.employee_code}
        </span>
      ),
    },
    {
      key: 'last_name',
      header: 'Nom & Prénom',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            {emp.photo_path ? (
              <img
                src={emp.photo_path}
                alt={`${emp.first_name} ${emp.last_name}`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-indigo-700">
                {emp.first_name?.[0]}{emp.last_name?.[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
            <p className="text-xs text-gray-500">{emp.email || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department_name',
      header: 'Département',
      render: (emp) => (
        <span className="text-gray-700">{emp.department_name || '-'}</span>
      ),
    },
    {
      key: 'position_title',
      header: 'Poste',
      render: (emp) => (
        <span className="text-gray-700">{emp.position_title || '-'}</span>
      ),
    },
    {
      key: 'contract_type',
      header: 'Contrat',
      render: (emp) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
          {getContractTypeShortLabel(emp.contract_type)}
        </span>
      ),
    },
    {
      key: 'hire_date',
      header: 'Embauche',
      render: (emp) => (
        <span className="text-gray-600 text-xs">{formatDate(emp.hire_date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      key: 'base_salary',
      header: (
        <button
          onClick={() => setShowGross(g => !g)}
          className="flex items-center gap-1 uppercase tracking-wider font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
          title={showGross ? 'Cliquer pour afficher le NET' : 'Cliquer pour afficher le Brut'}
        >
          {showGross ? 'Salaire Brut' : 'Salaire NET'}
          <svg className="h-3 w-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      ),
      render: (emp) => (
        <span className="font-medium text-gray-900">
          {showGross
            ? formatCurrency(emp.base_salary)
            : formatCurrency(Math.round(grossToNet(emp.base_salary)))}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (emp) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/crm/employes/${emp.id}`) }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Voir le profil"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/crm/employes/${emp.id}/modifier`) }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {emp.status !== 'TERMINE' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Archiver ${emp.first_name} ${emp.last_name} ?`)) {
                  deleteMutation.mutate(emp.id)
                }
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Archiver"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const employees = employeesData?.data || []
  const totalPages = employeesData?.total_pages || 1
  const total = employeesData?.total || 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employés</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} employé{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={() => { setShowImport(true); setImportResult(null) }}
          >
            Importer Excel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/crm/employes/nouveau')}
          >
            Nouvel Employé
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Rechercher par nom, CIN, code..."
            className="flex-1"
          />
          <Button
            variant="outline"
            size="md"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtres
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              placeholder="Statut"
            />
            <Select
              options={departmentOptions}
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setPage(1) }}
              placeholder="Département"
            />
            <Select
              options={CONTRACT_OPTIONS}
              value={contractType}
              onChange={(e) => { setContractType(e.target.value); setPage(1) }}
              placeholder="Type de contrat"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={employees}
        loading={isLoading}
        emptyMessage="Aucun employé trouvé"
        rowKey={(emp) => emp.id}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ── Import Excel Modal ─────────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Importer des employés</h2>
                  <p className="text-xs text-gray-500">Fichier Excel (.xlsx) ou CSV</p>
                </div>
              </div>
              <button onClick={handleCloseImport} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Template download */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div>
                  <p className="text-sm font-medium text-blue-800">Télécharger le modèle</p>
                  <p className="text-xs text-blue-600 mt-0.5">Modèle CSV avec toutes les colonnes et un exemple</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Modèle CSV
                </button>
              </div>

              {/* Format guide */}
              {!importResult && (
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border-b border-gray-200">
                    Format du tableau Excel
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Colonne</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Exemple</th>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Obligatoire</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[
                          { col: 'Prénom',              ex: 'Mohamed',          req: true  },
                          { col: 'Nom',                 ex: 'Alami',            req: true  },
                          { col: "Date d'embauche",     ex: '01/03/2023',       req: true  },
                          { col: 'CIN',                 ex: 'BE123456',         req: false },
                          { col: 'CNSS',                ex: '1234567',          req: false },
                          { col: 'Email',               ex: 'malami@ex.com',    req: false },
                          { col: 'Téléphone',           ex: '+212600000000',    req: false },
                          { col: 'Adresse',             ex: '10 Rue Hassan II', req: false },
                          { col: 'Ville',               ex: 'Casablanca',       req: false },
                          { col: 'Date de naissance',   ex: '15/06/1990',       req: false },
                          { col: 'Type contrat',        ex: 'CDI / CDD / PERIODE_ESSAI', req: false },
                          { col: 'Date fin contrat',    ex: '31/12/2024',       req: false },
                          { col: 'Département',         ex: 'RH',               req: false },
                          { col: 'Poste',               ex: 'Responsable RH',   req: false },
                          { col: 'Salaire de base NET',  ex: '8000',             req: false },
                          { col: 'Banque',              ex: 'Attijariwafa',     req: false },
                          { col: 'Compte bancaire',     ex: 'MA123456789',      req: false },
                          { col: 'Sexe',                ex: 'M ou F',           req: false },
                          { col: 'Situation familiale', ex: 'Célibataire',      req: false },
                          { col: "Nombre d'enfants",    ex: '2',                req: false },
                          { col: 'Nationalité',         ex: 'Marocaine',        req: false },
                        ].map(({ col, ex, req }) => (
                          <tr key={col} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-medium text-gray-800">
                              {col}
                              {req && <span className="ml-1 text-red-500">*</span>}
                            </td>
                            <td className="px-3 py-1.5 text-gray-500 font-mono">{ex}</td>
                            <td className="px-3 py-1.5">
                              {req
                                ? <span className="text-red-600 font-medium">Oui</span>
                                : <span className="text-gray-400">Non</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-amber-700 text-xs">
                    Les dates acceptent les formats : <strong>JJ/MM/AAAA</strong>, <strong>JJ-MM-AAAA</strong> ou <strong>AAAA-MM-JJ</strong>.
                    Le département et le poste doivent correspondre exactement aux noms existants dans le système.
                  </div>
                </div>
              )}

              {/* File picker */}
              {!importResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner le fichier
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    {importFile ? (
                      <p className="text-sm font-medium text-green-700">{importFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Cliquer pour choisir un fichier</p>
                        <p className="text-xs text-gray-400 mt-1">.xlsx, .xls ou .csv — max 10 Mo</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                </div>
              )}

              {/* Results */}
              {importResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{importResult.total}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Lignes traitées</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                      <p className="text-xs text-green-600 mt-0.5">Importés</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${importResult.errors > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <p className={`text-2xl font-bold ${importResult.errors > 0 ? 'text-red-700' : 'text-gray-400'}`}>{importResult.errors}</p>
                      <p className={`text-xs mt-0.5 ${importResult.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>Erreurs</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    {importResult.details.map((d) => (
                      <div key={d.row} className={`flex items-start gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 ${d.status === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
                        {d.status === 'ok'
                          ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-600">Ligne {d.row}</span>
                          {d.name && <span className="text-xs text-gray-800 ml-2 font-medium">{d.name}</span>}
                          {d.error && <p className="text-xs text-red-700 mt-0.5">{d.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleCloseImport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {importResult ? 'Fermer' : 'Annuler'}
              </button>
              {!importResult && (
                <button
                  onClick={handleImportSubmit}
                  disabled={!importFile || importing}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {importing ? 'Import en cours...' : 'Lancer l\'import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
