import React, { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addDays, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Users,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { pointageService, type PointageEntry, type MonthlySummary } from '../services/pointage.service'
import api from '../lib/axios'
import type { Employee, Department } from '../types'

// ─── helpers ────────────────────────────────────────────────────────────────

const WORK_START = '08:30'
const BREAK_MINUTES = 60    // 1h pause déjeuner
const RETARD_TOLERANCE = 0  // minutes de tolérance (0 = aucune)

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// 8h00 → 17h00 = 9h brut - 1h pause = 8h effectif
function calcHours(clockIn: string, clockOut: string): number {
  if (!clockIn || !clockOut) return 0
  const raw = timeToMinutes(clockOut) - timeToMinutes(clockIn)
  if (raw <= 0) return 0
  const effective = raw > 4 * 60 ? raw - BREAK_MINUTES : raw
  return Math.round(Math.max(effective, 0) / 60 * 100) / 100
}

function calcRetardMinutes(clockIn: string, workStart = WORK_START, tolerance = RETARD_TOLERANCE): number {
  if (!clockIn) return 0
  const raw = timeToMinutes(clockIn) - timeToMinutes(workStart)
  if (raw <= 0) return 0
  return raw <= tolerance ? 0 : raw
}

function formatRetard(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2,'0')}` : `${h}h`
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

// ─── Status definitions ──────────────────────────────────────────────────────

interface StatusDef {
  code: string
  label: string
  shortLabel: string
  color: string          // button active bg
  textColor: string      // button active text
  borderColor: string    // button active border
  rowBg: string          // row background when active
  badgeBg: string        // badge background
  badgeText: string
}

const STATUSES: StatusDef[] = [
  { code: '', label: 'Présent', shortLabel: 'P', color: 'bg-emerald-500', textColor: 'text-white', borderColor: 'border-emerald-500', rowBg: 'bg-emerald-50', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  { code: 'ABS', label: 'Absent', shortLabel: 'ABS', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500', rowBg: 'bg-red-50', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  { code: 'MAL', label: 'Maladie', shortLabel: 'MAL', color: 'bg-amber-500', textColor: 'text-white', borderColor: 'border-amber-500', rowBg: 'bg-amber-50', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' },
  { code: 'CP', label: 'Congé Payé', shortLabel: 'CP', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500', rowBg: 'bg-blue-50', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' },
  { code: 'CE', label: 'Congé Exceptionnel', shortLabel: 'CE', color: 'bg-purple-500', textColor: 'text-white', borderColor: 'border-purple-500', rowBg: 'bg-purple-50', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' },
  { code: 'FERIE', label: 'Jour Férié', shortLabel: 'FÉR', color: 'bg-gray-400', textColor: 'text-white', borderColor: 'border-gray-400', rowBg: 'bg-gray-50', badgeBg: 'bg-gray-100', badgeText: 'text-gray-600' },
]

function getStatus(code: string): StatusDef {
  return STATUSES.find(s => s.code === code) ?? STATUSES[0]
}

// ─── row state ───────────────────────────────────────────────────────────────

interface RowState {
  employeeId: number
  clockIn: string
  clockOut: string
  absenceCode: string
  notes: string
  saved: boolean
  entryId: number | null
}

// ─── Import Excel Modal ───────────────────────────────────────────────────────

interface ImportRow {
  employee_code: string
  date: string
  heure_arrivee?: string
  heure_depart?: string
  statut?: string
  notes?: string
  _valid: boolean
  _error?: string
}

function downloadPointageTemplate(employees: Employee[]) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const rows = employees.map(e => ({
    'employee_code': e.employee_code,
    'Nom': `${e.first_name} ${e.last_name}`,
    'date': today,
    'heure_arrivee': '08:30',
    'heure_depart': '17:00',
    'statut': '',
    'notes': '',
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 13 }, { wch: 22 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Pointage')

  // Add instructions sheet
  const instructions = [
    { 'INSTRUCTIONS': '--- COLONNES OBLIGATOIRES ---' },
    { 'INSTRUCTIONS': 'employee_code : Code employé (ex: EMP001)' },
    { 'INSTRUCTIONS': 'date          : Format YYYY-MM-DD (ex: 2026-04-14)' },
    { 'INSTRUCTIONS': '' },
    { 'INSTRUCTIONS': '--- COLONNES OPTIONNELLES ---' },
    { 'INSTRUCTIONS': 'heure_arrivee : Format HH:MM (ex: 08:30) — laisser vide si absent' },
    { 'INSTRUCTIONS': 'heure_depart  : Format HH:MM (ex: 17:00)' },
    { 'INSTRUCTIONS': 'statut        : Laisser VIDE si présent, sinon:' },
    { 'INSTRUCTIONS': '   ABS ou ABSENT       → Absence injustifiée' },
    { 'INSTRUCTIONS': '   MAL ou MALADIE      → Arrêt maladie' },
    { 'INSTRUCTIONS': '   CP ou CONGE PAYE    → Congé payé' },
    { 'INSTRUCTIONS': '   CE ou CONGE EXCEPTIONNEL → Congé exceptionnel' },
    { 'INSTRUCTIONS': '   FERIE ou JOUR FERIE → Jour férié' },
    { 'INSTRUCTIONS': 'notes         : Commentaire libre (optionnel)' },
    { 'INSTRUCTIONS': '' },
    { 'INSTRUCTIONS': '--- RÈGLES DE CALCUL ---' },
    { 'INSTRUCTIONS': 'Heures effectives = (heure_depart - heure_arrivee) - 1h pause' },
    { 'INSTRUCTIONS': 'Ex: 08:00 → 17:00 = 9h brut - 1h = 8h effectif' },
    { 'INSTRUCTIONS': 'Retard = heure_arrivee après 08h30' },
    { 'INSTRUCTIONS': '' },
    { 'INSTRUCTIONS': '--- EXEMPLE ---' },
    { 'INSTRUCTIONS': 'EMP001 | 2026-04-14 | 08:30 | 17:00 |       |          → Présent, 8h' },
    { 'INSTRUCTIONS': 'EMP002 | 2026-04-14 | 09:00 | 17:00 | ABS   |          → Absent' },
    { 'INSTRUCTIONS': 'EMP003 | 2026-04-14 |       |       | MAL   | Grippe   → Maladie' },
  ]
  const wsInfo = XLSX.utils.json_to_sheet(instructions)
  wsInfo['!cols'] = [{ wch: 70 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Instructions')

  XLSX.writeFile(wb, 'modele_pointage.xlsx')
}

function ImportModal({ onClose, onSuccess, employees }: { onClose: () => void; onSuccess: () => void; employees: Employee[] }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: false })
      const empCodes = new Set(employees.map(e => e.employee_code))
      const parsed: ImportRow[] = raw.map((row, i) => {
        const code = String(row['employee_code'] ?? row['Code Employé'] ?? '').trim()
        const date = String(row['date'] ?? row['Date'] ?? '').trim()
        let error = ''
        if (!code) error = 'employee_code manquant'
        else if (!empCodes.has(code)) error = `Employé "${code}" introuvable`
        else if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) error = `Date invalide: "${date}"`
        return {
          employee_code: code,
          date,
          heure_arrivee: String(row['heure_arrivee'] ?? row['Heure Arrivée'] ?? '').trim() || undefined,
          heure_depart: String(row['heure_depart'] ?? row['Heure Départ'] ?? '').trim() || undefined,
          statut: String(row['statut'] ?? row['Statut'] ?? '').trim() || undefined,
          notes: String(row['notes'] ?? row['Notes'] ?? '').trim() || undefined,
          _valid: !error,
          _error: error || undefined,
        }
      })
      setRows(parsed)
    }
    reader.readAsArrayBuffer(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/pointage/import-excel', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const result = res.data.data
      toast.success(`${result.success} ligne(s) importée(s) avec succès`)
      if (result.errors?.length > 0 || result.parse_errors?.length > 0) {
        const errs = [...(result.errors ?? []), ...(result.parse_errors ?? [])]
        toast.error(`${errs.length} erreur(s) — voir console`, { duration: 5000 })
        console.warn('Import errors:', errs)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  const validCount = rows.filter(r => r._valid).length
  const errorCount = rows.filter(r => !r._valid).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Importer le pointage depuis Excel</h2>
            <p className="text-sm text-gray-400 mt-0.5">Importez les présences/absences en masse</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* File picker + template */}
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-sm text-blue-700 hover:bg-blue-50 transition-colors font-medium flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
              {file ? file.name : 'Sélectionner un fichier Excel (.xlsx)'}
            </button>
            <button
              onClick={() => downloadPointageTemplate(employees)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Modèle Excel
            </button>
          </div>

          {/* Format info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
            <p className="font-semibold text-sm text-blue-900">Format du fichier Excel</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div><span className="font-mono bg-blue-100 px-1 rounded">employee_code</span> — Code employé (ex: EMP001) <span className="text-red-500">*obligatoire</span></div>
              <div><span className="font-mono bg-blue-100 px-1 rounded">date</span> — Format YYYY-MM-DD (ex: 2026-04-14) <span className="text-red-500">*obligatoire</span></div>
              <div><span className="font-mono bg-blue-100 px-1 rounded">heure_arrivee</span> — Format HH:MM (ex: 08:30)</div>
              <div><span className="font-mono bg-blue-100 px-1 rounded">heure_depart</span> — Format HH:MM (ex: 17:00)</div>
              <div className="col-span-2"><span className="font-mono bg-blue-100 px-1 rounded">statut</span> — Laisser vide si présent. Sinon: <span className="font-semibold">ABS · MAL · CP · CE · FERIE</span></div>
              <div><span className="font-mono bg-blue-100 px-1 rounded">notes</span> — Commentaire (optionnel)</div>
            </div>
            <p className="text-blue-600 pt-1">💡 8h00→17h00 = <strong>8h effectives</strong> (9h brut − 1h pause déjeuner automatique)</p>
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3 text-xs">
                <span className="font-medium text-gray-600">{rows.length} lignes lues</span>
                {validCount > 0 && <span className="text-emerald-600 font-semibold">✓ {validCount} valides</span>}
                {errorCount > 0 && <span className="text-red-500 font-semibold">✗ {errorCount} erreurs</span>}
              </div>
              <div className="overflow-x-auto max-h-52">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Arrivée</th>
                      <th className="px-3 py-2 text-left">Départ</th>
                      <th className="px-3 py-2 text-left">Statut</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                      <th className="px-3 py-2 text-center">H.eff.</th>
                      <th className="px-3 py-2 text-center">Statut import</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => {
                      const heures = row.heure_arrivee && row.heure_depart ? calcHours(row.heure_arrivee, row.heure_depart) : null
                      const retard = row.heure_arrivee ? calcRetardMinutes(row.heure_arrivee) : 0
                      return (
                        <tr key={i} className={row._valid ? 'bg-white' : 'bg-red-50'}>
                          <td className="px-3 py-1.5 font-mono font-medium">{row.employee_code}</td>
                          <td className="px-3 py-1.5 text-gray-600">{row.date}</td>
                          <td className="px-3 py-1.5 font-mono">{row.heure_arrivee || '—'}</td>
                          <td className="px-3 py-1.5 font-mono">{row.heure_depart || '—'}</td>
                          <td className="px-3 py-1.5">{row.statut || <span className="text-emerald-600">Présent</span>}</td>
                          <td className="px-3 py-1.5 text-gray-400">{row.notes || '—'}</td>
                          <td className="px-3 py-1.5 text-center">
                            {heures !== null ? (
                              <span className={`font-mono ${retard > 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                                {heures.toFixed(1)}h{retard > 0 ? ` ⚠${formatRetard(retard)}` : ''}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {row._valid
                              ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                              : <span className="text-red-500 font-medium text-[10px]">{row._error}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!file || validCount === 0 || importing}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {importing
              ? <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Upload className="h-4 w-4" />}
            Importer {validCount > 0 ? `${validCount} lignes` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Import Mensuel Modal ─────────────────────────────────────────────────────

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

interface MensuelRow {
  code: string; nom: string; prenom: string
  jours_travailles: number; jours_absents: number
  retard_min: number; heures_sup: number
  _valid: boolean; _error?: string
}

function downloadMensuelTemplate(employees: Employee[], month: number, year: number) {
  const rows = employees.map(e => ({
    'Code': e.employee_code,
    'Nom': e.last_name,
    'Prénom': e.first_name,
    'Jours travaillés': 26,
    'Jours absents': 0,
    'Retard (min)': 0,
    'Heures sup': 0,
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Pointage')
  XLSX.writeFile(wb, `pointage_mensuel_${String(month).padStart(2,'0')}_${year}.xlsx`)
}

function ImportMensuelModal({ onClose, onSuccess, employees }: { onClose: () => void; onSuccess: () => void; employees: Employee[] }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [file, setFile]   = useState<File | null>(null)
  const [rows, setRows]   = useState<MensuelRow[]>([])
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const empCodes = new Set(employees.map(e => e.employee_code))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => {
      const wb  = XLSX.read(ev.target?.result, { type: 'array' })
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' })
      const parsed: MensuelRow[] = raw.map(r => {
        const code   = String(r['Code'] ?? r['employee_code'] ?? '').trim()
        const nom    = String(r['Nom']  ?? '').trim()
        const prenom = String(r['Prénom'] ?? r['Prenom'] ?? '').trim()
        const jT = parseInt(String(r['Jours travaillés'] ?? r['jours_travailles'] ?? 0)) || 0
        const jA = parseInt(String(r['Jours absents']    ?? r['jours_absents']    ?? 0)) || 0
        const rm = parseInt(String(r['Retard (min)']     ?? r['Retard (minutes)'] ?? r['retard_minutes'] ?? 0)) || 0
        const hs = parseFloat(String(r['Heures sup']     ?? r['heures_sup']       ?? 0)) || 0
        let error = ''
        if (!code && (!nom || !prenom)) error = 'Code ou Nom+Prénom requis'
        else if (code && !empCodes.has(code)) error = `Code "${code}" introuvable`
        else if (jT < 0 || jA < 0) error = 'Jours invalides'
        return { code, nom, prenom, jours_travailles: jT, jours_absents: jA, retard_min: rm, heures_sup: hs, _valid: !error, _error: error || undefined }
      })
      setRows(parsed)
    }
    reader.readAsArrayBuffer(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('month', String(month))
      fd.append('year',  String(year))
      const res = await api.post('/pointage/import-mensuel', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const result = res.data.data
      toast.success(`${result.success} employé(s) importé(s)`)
      if (result.errors?.length > 0) toast.error(`${result.errors.length} erreur(s)`, { duration: 4000 })
      onSuccess(); onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de l\'import')
    } finally { setImporting(false) }
  }

  const validCount = rows.filter(r => r._valid).length
  const errorCount = rows.filter(r => !r._valid).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import Pointage Mensuel</h2>
            <p className="text-sm text-gray-400 mt-0.5">Une ligne par employé — totaux du mois</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Month/Year + actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {MONTHS_FR.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-xl text-sm text-blue-700 hover:bg-blue-50 flex-1 font-medium">
              <FileSpreadsheet className="h-4 w-4" />
              {file ? file.name : 'Sélectionner un fichier Excel'}
            </button>
            <button onClick={() => downloadMensuelTemplate(employees, month, year)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 whitespace-nowrap">
              <Download className="h-4 w-4" /> Modèle
            </button>
          </div>

          {/* Format info */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold text-amber-900">Format attendu (une ligne par employé)</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              <div><span className="font-mono bg-amber-100 px-1 rounded">Code</span> — Code employé <span className="text-red-500">*</span></div>
              <div><span className="font-mono bg-amber-100 px-1 rounded">Jours travaillés</span> — ex: 22</div>
              <div><span className="font-mono bg-amber-100 px-1 rounded">Nom</span> + <span className="font-mono bg-amber-100 px-1 rounded">Prénom</span> — si pas de code</div>
              <div><span className="font-mono bg-amber-100 px-1 rounded">Jours absents</span> — ex: 2</div>
              <div><span className="font-mono bg-amber-100 px-1 rounded">Retard (min)</span> — total du mois, ex: 45</div>
              <div><span className="font-mono bg-amber-100 px-1 rounded">Heures sup</span> — ex: 8.5</div>
            </div>
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3 text-xs">
                <span className="font-medium text-gray-600">{rows.length} lignes</span>
                {validCount > 0 && <span className="text-emerald-600 font-semibold">✓ {validCount} valides</span>}
                {errorCount > 0 && <span className="text-red-500 font-semibold">✗ {errorCount} erreurs</span>}
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Employé</th>
                      <th className="px-3 py-2 text-center">J. Travaillés</th>
                      <th className="px-3 py-2 text-center">J. Absents</th>
                      <th className="px-3 py-2 text-center">Retard (min)</th>
                      <th className="px-3 py-2 text-center">H. Sup</th>
                      <th className="px-3 py-2 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                      <tr key={i} className={r._valid ? 'bg-white' : 'bg-red-50'}>
                        <td className="px-3 py-1.5 font-mono">{r.code || '—'}</td>
                        <td className="px-3 py-1.5">{r.prenom} {r.nom}</td>
                        <td className="px-3 py-1.5 text-center font-medium">{r.jours_travailles}</td>
                        <td className="px-3 py-1.5 text-center text-red-600">{r.jours_absents || '—'}</td>
                        <td className="px-3 py-1.5 text-center text-orange-600">{r.retard_min || '—'}</td>
                        <td className="px-3 py-1.5 text-center text-blue-600">{r.heures_sup || '—'}</td>
                        <td className="px-3 py-1.5 text-center">
                          {r._valid
                            ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                            : <span className="text-red-500 text-[10px]">{r._error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleImport} disabled={!file || validCount === 0 || importing}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium">
            {importing
              ? <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Upload className="h-4 w-4" />}
            Importer {validCount > 0 ? `${validCount} employés` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PointagePage ─────────────────────────────────────────────────────────────

export function PointagePage() {
  const [activeTab, setActiveTab] = useState<'saisie' | 'recap'>('saisie')
  const [showImport, setShowImport] = useState(false)
  const [showImportMensuel, setShowImportMensuel] = useState(false)
  const queryClient = useQueryClient()

  // Fetch employees for template download
  const { data: empData } = useQuery({
    queryKey: ['employees-actif-pointage-main'],
    queryFn: () => api.get('/employees', { params: { status: 'ACTIF', limit: 200 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),
  })
  const allEmployees: Employee[] = Array.isArray(empData) ? empData : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Pointage</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi des présences et absences</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportMensuel(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Mensuel
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Import Journalier
          </button>
        </div>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pointage-day'] })}
          employees={allEmployees}
        />
      )}
      {showImportMensuel && (
        <ImportMensuelModal
          onClose={() => setShowImportMensuel(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pointage-summary'] })}
          employees={allEmployees}
        />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: 'saisie', label: 'Saisie Journalière', icon: Clock },
            { key: 'recap', label: 'Récapitulatif Mensuel', icon: Download },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'saisie' | 'recap')}
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

      {activeTab === 'saisie' ? <SaisieTab /> : <RecapTab />}
    </div>
  )
}

// ─── Tab 1: Saisie Journalière ────────────────────────────────────────────────

function SaisieTab() {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [rows, setRows] = useState<Record<number, RowState>>({})
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  // Fetch employees
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees-actif'],
    queryFn: () => api.get('/employees', { params: { status: 'ACTIF', limit: 200 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.data ?? []) }),
  })
  const employees: Employee[] = Array.isArray(employeesData) ? employeesData : []

  // Fetch pointage entries for selected date
  const { data: entries = [], isLoading: loadingEntries } = useQuery<PointageEntry[]>({
    queryKey: ['pointage-day', dateStr],
    queryFn: () => pointageService.getEntries({ date: dateStr }),
  })

  // Seed row state from existing entries when data loads
  React.useEffect(() => {
    if (!entries || !Array.isArray(entries)) return
    setRows(prev => {
      const next = { ...prev }
      ;(entries as PointageEntry[]).forEach((e: PointageEntry) => {
        next[e.employee_id] = {
          employeeId: e.employee_id,
          clockIn: e.clock_in ?? '',
          clockOut: e.clock_out ?? '',
          absenceCode: e.absence_code ?? '',
          notes: e.notes ?? '',
          saved: true,
          entryId: e.id,
        }
      })
      return next
    })
  }, [entries])

  // Map employee_id -> entry
  const entryMap: Record<number, PointageEntry> = {}
  entries.forEach(e => { entryMap[e.employee_id] = e })

  const getRow = useCallback((employeeId: number): RowState => {
    if (rows[employeeId]) return rows[employeeId]
    const existing = entryMap[employeeId]
    if (existing) {
      return {
        employeeId,
        clockIn: existing.clock_in ?? '',
        clockOut: existing.clock_out ?? '',
        absenceCode: existing.absence_code ?? '',
        notes: existing.notes ?? '',
        saved: true,
        entryId: existing.id,
      }
    }
    return { employeeId, clockIn: '', clockOut: '', absenceCode: '', notes: '', saved: false, entryId: null }
  }, [rows, entryMap])

  const updateRow = (employeeId: number, patch: Partial<RowState>) => {
    setRows(prev => ({
      ...prev,
      [employeeId]: { ...getRow(employeeId), ...patch, saved: false },
    }))
  }

  const upsertMutation = useMutation({
    mutationFn: pointageService.upsertEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointage-day', dateStr] })
    },
  })

  const saveRow = async (emp: Employee) => {
    const row = getRow(emp.id)
    try {
      await upsertMutation.mutateAsync({
        employee_id: emp.id,
        date: dateStr,
        clock_in: row.clockIn || null,
        clock_out: row.clockOut || null,
        hours_worked: calcHours(row.clockIn, row.clockOut),
        absence_code: row.absenceCode || null,
        notes: row.notes || null,
      })
      setRows(prev => ({ ...prev, [emp.id]: { ...getRow(emp.id), saved: true } }))
      toast.success(`Pointage enregistré pour ${emp.first_name} ${emp.last_name}`)
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const saveAll = async () => {
    if (employees.length === 0) {
      toast('Aucun employé actif', { icon: '⚠️' })
      return
    }
    let ok = 0
    for (const emp of employees) {
      try {
        const row = getRow(emp.id)
        const isAbsence = !!row.absenceCode
        await upsertMutation.mutateAsync({
          employee_id: emp.id,
          date: dateStr,
          clock_in: isAbsence ? null : (row.clockIn || null),
          clock_out: isAbsence ? null : (row.clockOut || null),
          hours_worked: isAbsence ? 0 : calcHours(row.clockIn, row.clockOut),
          absence_code: row.absenceCode || null,
          notes: row.notes || null,
        })
        setRows(prev => ({ ...prev, [emp.id]: { ...getRow(emp.id), saved: true } }))
        ok++
      } catch {
        // continue
      }
    }
    toast.success(`${ok} pointage(s) enregistré(s)`)
  }

  const markAllPresent = () => {
    const next: Record<number, RowState> = { ...rows }
    for (const emp of employees) {
      next[emp.id] = { ...getRow(emp.id), absenceCode: '', clockIn: '08:00', clockOut: '17:00', saved: false }
    }
    setRows(next)
    toast('Tous marqués Présent — pensez à enregistrer', { icon: '✅' })
  }

  const isLoading = loadingEmployees || loadingEntries

  // Summary counts for the day
  const counts = employees.reduce((acc: Record<string, number>, emp: Employee) => {
    const code = getRow(emp.id).absenceCode ?? ''
    acc[code] = (acc[code] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="px-4 py-2 font-semibold text-gray-900 capitalize min-w-[220px] text-center text-base">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
          <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="ml-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
            Aujourd'hui
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllPresent}
            className="flex items-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 text-sm font-medium transition-colors"
          >
            <Users className="h-4 w-4" />
            Tous Présents
          </button>
          <button
            onClick={saveAll}
            disabled={upsertMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm font-medium"
          >
            <Save className="h-4 w-4" />
            Enregistrer tout
          </button>
        </div>
      </div>

      {/* Day summary badges */}
      {!isLoading && employees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => {
            const n = s.code === '' ? (counts[''] ?? 0) : (counts[s.code] ?? 0)
            if (n === 0 && s.code !== '') return null
            return (
              <span key={s.code} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.badgeBg} ${s.badgeText}`}>
                {s.label}: <strong>{n}</strong>
              </span>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {STATUSES.map(s => (
          <span key={s.code} className={`px-2 py-0.5 rounded border ${s.badgeBg} ${s.badgeText} border-transparent font-medium`}>
            {s.shortLabel} = {s.label}
          </span>
        ))}
      </div>

      {/* Cards grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Aucun employé actif trouvé</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {employees.map((emp: Employee) => {
              const row = getRow(emp.id)
              const status = getStatus(row.absenceCode)
              const isAbsence = !!row.absenceCode
              const hours = calcHours(row.clockIn, row.clockOut)
              const retardMin = isAbsence ? 0 : calcRetardMinutes(row.clockIn)
              const retardLabel = formatRetard(retardMin)

              return (
                <div key={emp.id} className={`px-4 py-3 transition-colors ${status.rowBg}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm leading-tight">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{emp.employee_code}</p>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {STATUSES.map(s => {
                        const active = row.absenceCode === s.code
                        return (
                          <button
                            key={s.code}
                            onClick={() => updateRow(emp.id, {
                              absenceCode: s.code,
                              clockIn: s.code ? '' : (row.clockIn || '08:00'),
                              clockOut: s.code ? '' : (row.clockOut || '17:00'),
                            })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                              active
                                ? `${s.color} ${s.textColor} ${s.borderColor} shadow-sm`
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {s.shortLabel !== s.label.slice(0, s.shortLabel.length) ? s.shortLabel : s.shortLabel}
                            <span className="hidden sm:inline ml-1">{active ? '' : ''}</span>
                            {active && <span className="ml-1">✓</span>}
                          </button>
                        )
                      })}
                    </div>

                    {/* Hours (only if present) */}
                    {!isAbsence && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={row.clockIn}
                          onChange={e => updateRow(emp.id, { clockIn: e.target.value })}
                          className="w-24 border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          title="Heure d'arrivée"
                        />
                        <span className="text-gray-400 text-xs">→</span>
                        <input
                          type="time"
                          value={row.clockOut}
                          onChange={e => updateRow(emp.id, { clockOut: e.target.value })}
                          className="w-24 border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          title="Heure de départ"
                        />
                        {hours > 0 && (
                          <span className="text-xs text-gray-500 font-mono whitespace-nowrap">{hours.toFixed(1)}h</span>
                        )}
                        {retardLabel && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 whitespace-nowrap">
                            ⚠ Retard {retardLabel}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <input
                      type="text"
                      value={row.notes}
                      onChange={e => updateRow(emp.id, { notes: e.target.value })}
                      placeholder="Note..."
                      className="w-28 border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Save + status */}
                    <div className="flex items-center gap-2 ml-auto">
                      {row.saved ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Enregistré
                        </span>
                      ) : (
                        <button
                          onClick={() => saveRow(emp)}
                          disabled={upsertMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-xs font-medium transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          Sauver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 2: Récapitulatif Mensuel ─────────────────────────────────────────────

function RecapTab() {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedDept, setSelectedDept] = useState<string>('')

  // Departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/employees/departments').then(r => r.data.data ?? []),
  })

  // Summary
  const { data: summary = [], isLoading, error } = useQuery<MonthlySummary[]>({
    queryKey: ['pointage-summary', selectedMonth, selectedYear],
    queryFn: () => pointageService.getMonthlySummary(selectedMonth, selectedYear),
  })

  const filtered = selectedDept
    ? summary.filter(s => s.department === selectedDept)
    : summary

  // Totals
  const totals = filtered.reduce(
    (acc, row) => ({
      total_working_days: acc.total_working_days + row.total_working_days,
      days_present: acc.days_present + row.days_present,
      days_abs: acc.days_abs + row.days_abs,
      days_mal: acc.days_mal + row.days_mal,
      days_cp: acc.days_cp + row.days_cp,
      days_ce: acc.days_ce + row.days_ce,
      days_ferie: acc.days_ferie + (row.days_ferie ?? 0),
      days_retard: acc.days_retard + (row.days_retard ?? 0),
      total_retard_minutes: acc.total_retard_minutes + (row.total_retard_minutes ?? 0),
      total_hours: acc.total_hours + row.total_hours,
    }),
    { total_working_days: 0, days_present: 0, days_abs: 0, days_mal: 0, days_cp: 0, days_ce: 0, days_ferie: 0, days_retard: 0, total_retard_minutes: 0, total_hours: 0 }
  )

  const absenceRateColor = (rate: number) => {
    if (rate < 5) return 'text-green-600'
    if (rate <= 10) return 'text-amber-600'
    return 'text-red-600'
  }

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const data = filtered.map(row => ({
        'Code': row.employee_code,
        'Nom': row.last_name,
        'Prénom': row.first_name,
        'CIN': row.cin ?? '',
        'Département': row.department,
        'Jours Ouvrables': row.total_working_days,
        'Présents': row.days_present,
        'ABS': row.days_abs,
        'MAL': row.days_mal,
        'CP': row.days_cp,
        'CE': row.days_ce,
        'Total Heures': row.total_hours,
        'Retard (min)': row.total_retard_minutes,
        'Taux Absence %': row.absence_rate,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Pointage')
      XLSX.writeFile(wb, `pointage_${selectedMonth}_${selectedYear}.xlsx`)
      toast.success('Export Excel généré')
    } catch {
      toast.error('Erreur lors de l\'export')
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les départements</option>
          {departments.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erreur de chargement des données
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            Aucune donnée pour {MONTHS[selectedMonth - 1]} {selectedYear}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Employé</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Dépt.</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">J.Ouv.</th>
                  <th className="text-center px-3 py-3 font-medium text-emerald-600">Présent</th>
                  <th className="text-center px-3 py-3 font-medium text-red-500">ABS</th>
                  <th className="text-center px-3 py-3 font-medium text-amber-500">MAL</th>
                  <th className="text-center px-3 py-3 font-medium text-blue-500">CP</th>
                  <th className="text-center px-3 py-3 font-medium text-purple-500">CE</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-400">Fér.</th>
                  <th className="text-center px-3 py-3 font-medium text-orange-500">Retards</th>
                  <th className="text-center px-3 py-3 font-medium text-orange-500">Min retard</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Heures</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Abs %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(row => (
                  <tr key={row.employee_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{row.employee_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.employee_code}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{row.department ?? '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-700 font-medium">{row.total_working_days}</td>
                    <td className="px-3 py-3 text-center text-emerald-700 font-semibold">{row.days_present}</td>
                    <td className="px-3 py-3 text-center text-red-600 font-medium">{row.days_abs || '—'}</td>
                    <td className="px-3 py-3 text-center text-amber-600 font-medium">{row.days_mal || '—'}</td>
                    <td className="px-3 py-3 text-center text-blue-600 font-medium">{row.days_cp || '—'}</td>
                    <td className="px-3 py-3 text-center text-purple-600 font-medium">{row.days_ce || '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-400">{(row.days_ferie ?? 0) || '—'}</td>
                    <td className="px-3 py-3 text-center">
                      {(row.days_retard ?? 0) > 0
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">{row.days_retard}j</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {(row.total_retard_minutes ?? 0) > 0
                        ? <span className="text-xs font-mono text-orange-600">{formatRetard(row.total_retard_minutes ?? 0)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700 font-mono text-xs">{row.total_hours.toFixed(1)}h</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-semibold ${absenceRateColor(row.absence_rate)}`}>
                        {row.absence_rate > 0 ? `${row.absence_rate.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                  <td className="px-4 py-3 text-gray-800" colSpan={2}>TOTAL ({filtered.length} employés)</td>
                  <td className="px-3 py-3 text-center text-gray-700">{totals.total_working_days}</td>
                  <td className="px-3 py-3 text-center text-emerald-700">{totals.days_present}</td>
                  <td className="px-3 py-3 text-center text-red-600">{totals.days_abs || '—'}</td>
                  <td className="px-3 py-3 text-center text-amber-600">{totals.days_mal || '—'}</td>
                  <td className="px-3 py-3 text-center text-blue-600">{totals.days_cp || '—'}</td>
                  <td className="px-3 py-3 text-center text-purple-600">{totals.days_ce || '—'}</td>
                  <td className="px-3 py-3 text-center text-gray-400">{totals.days_ferie || '—'}</td>
                  <td className="px-3 py-3 text-center text-orange-600">{totals.days_retard || '—'}</td>
                  <td className="px-3 py-3 text-center text-orange-600 font-mono text-xs">{totals.total_retard_minutes > 0 ? formatRetard(totals.total_retard_minutes) : '—'}</td>
                  <td className="px-3 py-3 text-center text-gray-700 font-mono text-xs">{totals.total_hours.toFixed(1)}h</td>
                  <td className="px-3 py-3 text-center text-gray-500">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
