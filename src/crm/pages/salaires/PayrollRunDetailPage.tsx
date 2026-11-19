import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, FileText, Download, Edit2, Printer, Users, RefreshCw, Landmark,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { salairesService } from '../../services/salaires.service'
import { settingsService } from '../../services/settings.service'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils'
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { generatePayslipPDF } from '../../lib/pdfGenerator'
import { payslipLines, type PayrollDetails, type PayrollInputs } from '../../lib/payslipLines'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface Payslip {
  id: number
  employee_id: number
  employee_name: string
  employee_code: string
  department?: string
  position?: string
  cin?: string
  cnss_number?: string
  bank_name?: string
  bank_account?: string
  period_month: number
  period_year: number
  base_salary: number
  gross_salary: number
  brut_imposable: number
  cnss_employee: number
  amo_employee: number
  igr: number
  net_salary: number
  total_employer_cost: number
  days_worked: number
  days_absent: number
  charges_personnes: number
  retard_minutes: number
  overtime_hours: number
  prime_assiduite: number
  prime_panier: number
  prime_transport: number
  gratification: number
  bonuses: number
  commission_brute: number
  commission_nette: number
  malus: number
  other_deductions: number
  payment_status: string
  inputs: PayrollInputs | null
  details: PayrollDetails | null
}

interface PayrollRun {
  id: number
  period_month: number
  period_year: number
  status: string
  created_at: string
  run_date?: string
  payment_method?: string
  total_gross: number
  total_net: number
  total_employer_cost: number
  payslip_count: number
}

// The workbook's input columns, grouped as on its "Paie" sheet.
type FieldKind = 'money' | 'days' | 'hours' | 'count' | 'minutes' | 'bool'
interface InputField { key: keyof PayrollInputs; label: string; kind: FieldKind; hint?: string }
const INPUT_GROUPS: Array<{ title: string; note?: string; fields: InputField[] }> = [
  {
    title: 'Salarié',
    fields: [
      { key: 'baseSalary', label: 'Salaire de base', kind: 'money' },
      { key: 'dependents', label: 'Personnes à charge (IR)', kind: 'count', hint: 'conjoint sans revenu, enfants — 6 au plus' },
    ],
  },
  {
    title: 'Absences et congés',
    fields: [
      { key: 'unpaidAbsenceDays', label: "Jours d'absence non payée", kind: 'days' },
      { key: 'paidLeaveDays', label: 'Jours de congé pris', kind: 'days', hint: 'payés : ne réduisent pas le salaire' },
      { key: 'lateMinutes', label: 'Retards (minutes)', kind: 'minutes' },
    ],
  },
  {
    title: 'Heures et jours du mois',
    fields: [
      { key: 'overtimeHours', label: 'Heures supplémentaires', kind: 'hours' },
      { key: 'holidaysWorked', label: 'Jours fériés travaillés', kind: 'days' },
      { key: 'extraDays', label: 'Jours supplémentaires', kind: 'days' },
      { key: 'regularisationDays', label: 'Jours de régularisation (oubli)', kind: 'days' },
      { key: 'previousMonthRemainder', label: 'Reliquat / rappel du mois précédent (brut)', kind: 'money' },
    ],
  },
  {
    title: 'Primes du contrat (montant d\'un mois complet)',
    note: 'Reprises automatiquement le mois suivant ; proratisées selon les jours payés.',
    fields: [
      { key: 'panier', label: 'Prime de panier (exonérée)', kind: 'money' },
      { key: 'panierExcludedDays', label: 'Jours travaillés sans panier', kind: 'days' },
      { key: 'transport', label: 'Indemnité de transport (exonérée)', kind: 'money' },
      { key: 'attendanceBonus', label: "Prime d'assiduité", kind: 'money' },
      { key: 'nightGratification', label: 'Gratification de nuit', kind: 'money' },
      { key: 'missionBonus', label: 'Prime de mission', kind: 'money' },
      { key: 'engagementCommission', label: "Commission d'engagement", kind: 'money' },
      { key: 'performanceAllowance', label: 'Indemnité de performance', kind: 'money' },
      { key: 'personalBonus', label: 'Bonification personnelle', kind: 'money' },
    ],
  },
  {
    title: 'Primes du mois (montants bruts)',
    fields: [
      { key: 'bonusGross', label: 'Bonus', kind: 'money' },
      { key: 'bonusGross5', label: 'Bonus 5 %', kind: 'money' },
      { key: 'commissionGross', label: 'Commission', kind: 'money' },
      { key: 'malusGross', label: 'Malus (déduit)', kind: 'money' },
    ],
  },
  {
    title: 'Montants nets garantis',
    note: 'Le salarié touche exactement ce net : le brut correspondant est calculé selon sa situation.',
    fields: [
      { key: 'nightPremiumNet', label: 'Prime de nuit — net', kind: 'money' },
      { key: 'commissionNet', label: 'Commission — net', kind: 'money' },
      { key: 'bonusNet', label: 'Bonus — net', kind: 'money' },
      { key: 'bonusNet5', label: 'Bonus 5 % — net', kind: 'money' },
      { key: 'malusNet', label: 'Malus — net (déduit)', kind: 'money' },
    ],
  },
  {
    title: 'Retenues',
    note: 'Les avances sur salaire viennent du module Avances.',
    fields: [
      { key: 'retirementAmount', label: 'Retraite complémentaire (retenue)', kind: 'money' },
      { key: 'retirementDeductible', label: "Déductible de l'IR (contrat éligible)", kind: 'bool' },
      { key: 'companyLoan', label: 'Prêt société (échéance)', kind: 'money' },
      { key: 'otherDeductions', label: 'Autres retenues', kind: 'money' },
    ],
  },
]
const INPUT_KEYS = INPUT_GROUPS.flatMap((g) => g.fields.map((f) => f.key))

// Values for the form: the stored inputs, or the columns of a payslip
// calculated by the previous version of the payroll.
function formValues(p: Payslip): Record<string, number | boolean> {
  const values: Record<string, number | boolean> = {}
  for (const key of INPUT_KEYS) values[key] = key === 'retirementDeductible' ? false : 0
  if (p.inputs) {
    for (const key of INPUT_KEYS) {
      const v = (p.inputs as unknown as Record<string, unknown>)[key]
      if (v !== undefined && v !== null) values[key] = key === 'retirementDeductible' ? Boolean(v) : Number(v)
    }
    return values
  }
  return {
    ...values,
    baseSalary: p.base_salary, dependents: p.charges_personnes ?? 0, unpaidAbsenceDays: p.days_absent ?? 0,
    overtimeHours: p.overtime_hours ?? 0, lateMinutes: p.retard_minutes ?? 0, attendanceBonus: p.prime_assiduite ?? 0,
    panier: p.prime_panier ?? 0, transport: p.prime_transport ?? 0, bonusGross: (p.gratification ?? 0) + (p.bonuses ?? 0),
    commissionGross: p.commission_brute ?? 0, commissionNet: p.commission_nette ?? 0, malusGross: p.malus ?? 0,
    otherDeductions: p.other_deductions ?? 0,
  }
}

const errorMessage = (err: any) => err?.response?.data?.error || err?.message || 'Erreur'

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const runId = Number(id)

  const [showPayModal, setShowPayModal] = useState(false)
  const [preview, setPreview] = useState<Payslip | null>(null)
  const [editing, setEditing] = useState<Payslip | null>(null)
  const [initial, setInitial] = useState<Record<string, number | boolean>>({})
  const [values, setValues] = useState<Record<string, number | boolean>>({})
  const [payForm, setPayForm] = useState({ payment_date: new Date().toISOString().split('T')[0], payment_method: 'Virement' })

  const { data: run, isLoading: runLoading } = useQuery<PayrollRun>({
    queryKey: ['payroll-run', runId],
    queryFn: () => salairesService.getPayrollRun(runId),
  })
  const { data: payslips = [], isLoading: payslipsLoading } = useQuery<Payslip[]>({
    queryKey: ['payroll-run-payslips', runId],
    queryFn: () => salairesService.getPayslips(runId),
  })
  const { data: summaryData } = useQuery({
    queryKey: ['payroll-run-summary', runId],
    queryFn: () => salairesService.getSummary(runId),
  })
  const { data: companySettings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.getSettings })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payroll-run', runId] })
    queryClient.invalidateQueries({ queryKey: ['payroll-run-payslips', runId] })
    queryClient.invalidateQueries({ queryKey: ['payroll-run-summary', runId] })
    queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
  }

  const markPaid = useMutation({
    mutationFn: () => salairesService.markRunAsPaid(runId, payForm),
    onSuccess: () => { refresh(); toast.success('Paie marquée comme payée'); setShowPayModal(false) },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const recalculate = useMutation({
    mutationFn: () => salairesService.recalculate(runId),
    onSuccess: () => { refresh(); toast.success('Paie recalculée avec les paramètres actuels') },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const savePayslip = useMutation({
    mutationFn: () => {
      // Only what changed, so nothing else of the payslip is overwritten
      const changed: Record<string, number | boolean> = {}
      for (const key of INPUT_KEYS) if (values[key] !== initial[key]) changed[key] = values[key]
      return salairesService.updatePayslip(editing!.id, { inputs: changed })
    },
    onSuccess: (updated: Payslip) => {
      refresh()
      toast.success(`Bulletin recalculé — net à payer ${formatCurrency(updated.net_salary)}`)
      setEditing(null)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const openEditor = (p: Payslip) => {
    const v = formValues(p)
    setInitial(v)
    setValues(v)
    setEditing(p)
  }

  const handleExportExcel = async () => {
    const { utils, writeFile } = await import('xlsx')
    const rows = payslips.map((p) => {
      const d = p.details
      const i = p.inputs
      return {
        'Matricule': p.employee_code,
        'Nom & prénom': p.employee_name,
        'Département': p.department ?? '',
        'Salaire de base': p.base_salary,
        'Jours payés': d?.paidDays ?? '',
        'Absences non payées (j)': i?.unpaidAbsenceDays ?? p.days_absent,
        'Congés pris (j)': i?.paidLeaveDays ?? '',
        "Prime d'ancienneté": d?.seniorityBonus ?? '',
        'Heures supp. (montant)': d?.overtimePay ?? '',
        'Variables du mois': d?.monthVariables ?? '',
        "Prime d'assiduité": d?.attendanceBonusPaid ?? '',
        'Brut équivalent des nets garantis': d?.grossUp ?? '',
        'Brut imposable': p.brut_imposable,
        'Panier (exonéré)': d?.panierPaid ?? '',
        'Transport (exonéré)': d?.transportPaid ?? '',
        'Brut global': p.gross_salary,
        'CNSS salariale': p.cnss_employee,
        'AMO salariale': p.amo_employee,
        'Frais professionnels': d?.fraisPro ?? '',
        'Net imposable': d?.netTaxable ?? '',
        'IR brut': d?.irGross ?? '',
        'Charges de famille': d?.familyDeduction ?? '',
        'IR net': p.igr,
        'Retraite complémentaire': i?.retirementAmount ?? '',
        'Prêt société': i?.companyLoan ?? '',
        'Avance sur salaire': i?.salaryAdvance ?? '',
        'Arrondi': d?.rounding ?? '',
        'NET À PAYER': p.net_salary,
        'CNSS patronale (prestations)': d?.cnssEmployer ?? '',
        'Allocations familiales': d?.familyAllowance ?? '',
        'AMO patronale': d?.amoEmployer ?? '',
        'TFP': d?.tfp ?? '',
        'Total charges patronales': d?.employerCharges ?? '',
        'COÛT TOTAL EMPLOYEUR': p.total_employer_cost,
      }
    })
    const wb = utils.book_new()
    utils.book_append_sheet(wb, utils.json_to_sheet(rows), 'Paie')
    const s = summaryData?.summary
    const decl = summaryData?.declarations
    if (s && decl) {
      utils.book_append_sheet(wb, utils.aoa_to_sheet([
        ['SYNTHÈSE DE LA PAIE', `${run?.period_month}/${run?.period_year}`],
        ['Effectif', s.employee_count],
        ['Masse salariale brute imposable', s.taxable_gross],
        ['Brut global versé', s.gross_paid],
        ['Total CNSS salariale', s.cnss_employee],
        ['Total AMO salariale', s.amo_employee],
        ['Total IR retenu à la source', s.ir_net],
        ['Total NET À PAYER', s.net_pay],
        ['Total charges patronales', s.employer_charges],
        ['COÛT TOTAL EMPLOYEUR', s.employer_cost],
        [],
        ['Total à verser à la CNSS (DAMANCOM)', decl.damancom_total],
        ['IR à reverser à la DGI (SIMPL-IR)', decl.simpl_ir_total],
        ['Salaires nets à virer', decl.net_to_transfer],
        ['Retraite complémentaire à reverser', decl.retirement_to_transfer],
        ['Mutuelle à reverser', decl.mutuelle_to_transfer],
        ['TOTAL FONDS NÉCESSAIRES', decl.funds_needed],
      ]), 'Synthèse')
    }
    writeFile(wb, `paie_${run?.period_month}_${run?.period_year}.xlsx`)
    toast.success('Export Excel réussi')
  }

  const handleDownloadPayslipPDF = async (p: Payslip) => {
    await generatePayslipPDF(p as unknown as Record<string, unknown>, (companySettings ?? {}) as Record<string, unknown>)
  }

  const previewLines = useMemo(() => (preview ? payslipLines(preview as unknown as Record<string, unknown>) : null), [preview])

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
        <button onClick={() => navigate('/crm/salaires')} className="mt-4 text-indigo-600 underline text-sm">Retour à la liste</button>
      </div>
    )
  }

  const periodLabel = `${MONTHS[run.period_month - 1]} ${run.period_year}`
  const editable = run.status !== 'PAYE'
  const s = summaryData?.summary
  const decl = summaryData?.declarations

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/crm/salaires')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paie — {periodLabel}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Créée le {formatDate(run.created_at)}
            {run.status === 'PAYE' && run.run_date && ` · Payée le ${formatDate(run.run_date)}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Statut</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
              {getStatusLabel(run.status)}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Brut global</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(run.total_gross)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net à payer</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(run.total_net)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Coût employeur</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(s?.employer_cost ?? run.total_employer_cost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Salariés</p>
            <p className="text-lg font-bold text-gray-900">{payslips.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {editable && (
            <button onClick={() => setShowPayModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4" />
              Marquer comme payé
            </button>
          )}
          {editable && (
            <button
              onClick={() => window.confirm('Recalculer tous les bulletins avec les paramètres de paie actuels de l\'entreprise ? Les saisies sont conservées.') && recalculate.mutate()}
              disabled={recalculate.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200 hover:bg-indigo-100 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${recalculate.isPending ? 'animate-spin' : ''}`} />
              Recalculer
            </button>
          )}
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 font-medium">
            <Download className="h-4 w-4" />
            Exporter Excel
          </button>
          {run.payment_method && <span className="text-sm text-gray-500">Mode de paiement : <strong>{run.payment_method}</strong></span>}
        </div>
      </div>

      {/* Payslips */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Bulletins de paie</h2>
          <span className="ml-auto text-sm text-gray-400">
            {editable ? 'Crayon : saisir les variables du mois · ' : ''}{payslips.length} bulletin(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Salarié</th>
                <th className="px-4 py-3 text-right font-medium">Jours payés</th>
                <th className="px-4 py-3 text-right font-medium">Brut imposable</th>
                <th className="px-4 py-3 text-right font-medium">CNSS</th>
                <th className="px-4 py-3 text-right font-medium">AMO</th>
                <th className="px-4 py-3 text-right font-medium">IR</th>
                <th className="px-4 py-3 text-right font-medium">Net à payer</th>
                <th className="px-4 py-3 text-right font-medium">Coût employeur</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payslipsLoading ? (
                <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Chargement…</td></tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    Aucun bulletin
                  </td>
                </tr>
              ) : payslips.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.employee_name}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {p.employee_code}
                      {!p.details && <span className="ml-2 font-sans text-amber-600">ancien calcul — recalculez</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.details?.paidDays ?? p.days_worked}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(p.brut_imposable)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.cnss_employee)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.amo_employee)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.igr)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(p.net_salary)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.total_employer_cost)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {editable && (
                        <button onClick={() => openEditor(p)} className="p-1.5 rounded text-indigo-500 hover:bg-indigo-50" title="Saisir les variables du mois">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setPreview(p)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100" title="Bulletin de paie">
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Declarations: what to pay to whom */}
      {s && decl && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Déclarations et fonds à prévoir</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 p-6 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">CNSS — DAMANCOM</p>
              {[
                ['CNSS salariale', s.cnss_employee],
                ['AMO salariale', s.amo_employee],
                ['CNSS patronale (prestations sociales)', s.cnss_employer_prestations],
                ['Allocations familiales', s.family_allowance],
                ['AMO patronale', s.amo_employer],
                ['Taxe de formation professionnelle', s.tfp],
              ].map(([label, amount]) => (
                <div key={label as string} className="flex justify-between"><span className="text-gray-600">{label}</span><span>{formatCurrency(amount as number)}</span></div>
              ))}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span>Total à verser à la CNSS</span><span>{formatCurrency(decl.damancom_total)}</span>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-4">DGI — SIMPL-IR</p>
              <div className="flex justify-between font-semibold"><span>IR retenu à la source à reverser</span><span>{formatCurrency(decl.simpl_ir_total)}</span></div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fonds à prévoir</p>
              <div className="flex justify-between"><span className="text-gray-600">Salaires nets à virer</span><span>{formatCurrency(decl.net_to_transfer)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">IR (DGI)</span><span>{formatCurrency(decl.simpl_ir_total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">CNSS (DAMANCOM)</span><span>{formatCurrency(decl.damancom_total)}</span></div>
              {decl.retirement_to_transfer > 0 && <div className="flex justify-between"><span className="text-gray-600">Retraite complémentaire</span><span>{formatCurrency(decl.retirement_to_transfer)}</span></div>}
              {decl.mutuelle_to_transfer > 0 && <div className="flex justify-between"><span className="text-gray-600">Mutuelle</span><span>{formatCurrency(decl.mutuelle_to_transfer)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-indigo-800">
                <span>TOTAL FONDS NÉCESSAIRES</span><span>{formatCurrency(decl.funds_needed)}</span>
              </div>
              <div className="pt-3 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between"><span>Masse salariale brute imposable</span><span>{formatCurrency(s.taxable_gross)}</span></div>
                <div className="flex justify-between"><span>dont prime d'ancienneté</span><span>{formatCurrency(s.seniority_bonus)}</span></div>
                <div className="flex justify-between"><span>Panier et transport (exonérés)</span><span>{formatCurrency(s.exempt_allowances)}</span></div>
                {s.loans_and_advances > 0 && <div className="flex justify-between"><span>Prêts et avances récupérés</span><span>{formatCurrency(s.loans_and_advances)}</span></div>}
                <div className="flex justify-between font-medium text-gray-700"><span>Coût total employeur</span><span>{formatCurrency(s.employer_cost)}</span></div>
              </div>
              {decl.legacy_payslips > 0 && (
                <p className="text-xs text-amber-700 pt-2">
                  {decl.legacy_payslips} bulletin(s) calculé(s) par l'ancienne version : cliquez sur Recalculer pour appliquer le calcul du classeur.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mark as paid */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Marquer comme payé" size="sm">
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de paiement</label>
            <input type="date" value={payForm.payment_date} onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode de paiement</label>
            <select value={payForm.payment_method} onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="Virement">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Espèces">Espèces</option>
            </select>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700">
            Montant total à virer : <strong>{formatCurrency(run.total_net)}</strong>. Une paie payée ne peut plus être modifiée.
          </div>
        </ModalBody>
        <ModalFooter>
          <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={() => markPaid.mutate()} disabled={markPaid.isPending || !payForm.payment_date}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
            <CheckCircle className="h-4 w-4" /> Confirmer
          </button>
        </ModalFooter>
      </Modal>

      {/* Monthly inputs of one employee */}
      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `Variables du mois — ${editing.employee_name}` : ''} size="2xl">
        {editing && (
          <>
            <ModalBody className="space-y-5 max-h-[70vh] overflow-y-auto">
              {INPUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{group.title}</p>
                  {group.note && <p className="text-xs text-gray-400 mt-0.5">{group.note}</p>}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {group.fields.map((f) => (
                      f.kind === 'bool' ? (
                        <label key={f.key} className="flex items-center gap-2 text-sm text-gray-700 pt-5">
                          <input type="checkbox" checked={Boolean(values[f.key])}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.checked }))}
                            className="rounded border-gray-300 text-indigo-600" />
                          {f.label}
                        </label>
                      ) : (
                        <label key={f.key} className="block">
                          <span className={`block text-xs mb-1 ${values[f.key] !== initial[f.key] ? 'text-indigo-700 font-semibold' : 'text-gray-600'}`}>{f.label}</span>
                          <input type="number" step="any" min={f.key === 'malusGross' || f.key === 'malusNet' ? 0 : undefined}
                            value={Number(values[f.key] ?? 0)}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value === '' ? 0 : Number(e.target.value) }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none" />
                          {f.hint && <span className="block text-[11px] text-gray-400 mt-0.5">{f.hint}</span>}
                        </label>
                      )
                    ))}
                  </div>
                </div>
              ))}
              {editing.inputs && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  Avance sur salaire du mois (module Avances) : <strong>{formatCurrency(editing.inputs.salaryAdvance)}</strong>.
                  {' '}Date d'embauche prise en compte pour l'ancienneté : <strong>{editing.inputs.hireDate ? formatDate(editing.inputs.hireDate) : '—'}</strong>.
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <span className="mr-auto text-sm text-gray-500">Net actuel : <strong>{formatCurrency(editing.net_salary)}</strong></span>
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={() => savePayslip.mutate()} disabled={savePayslip.isPending}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                {savePayslip.isPending ? 'Calcul…' : 'Enregistrer et recalculer'}
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Payslip preview */}
      <Modal isOpen={Boolean(preview)} onClose={() => setPreview(null)} title="Bulletin de paie" size="xl">
        {preview && previewLines && (
          <>
            <ModalBody className="space-y-4">
              <div className="bg-indigo-700 text-white rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="font-bold">{preview.employee_name}</p>
                  <p className="text-indigo-200 text-sm">{MONTHS[preview.period_month - 1]} {preview.period_year} · {preview.position || '—'}</p>
                </div>
                <span className="text-indigo-200 text-xs font-mono">{preview.employee_code}</span>
              </div>
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-600">
                    <th className="px-3 py-2 text-left">Rubrique</th>
                    <th className="px-3 py-2 text-right">Base</th>
                    <th className="px-3 py-2 text-right">Taux</th>
                    <th className="px-3 py-2 text-right">Gains</th>
                    <th className="px-3 py-2 text-right">Retenues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewLines.lines.map((line, i) => (
                    <tr key={i} className={line.kind === 'subtotal' ? 'bg-indigo-50 font-semibold' : ''}>
                      <td className="px-3 py-1.5">{line.label}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{line.base ?? ''}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{line.rate ?? ''}</td>
                      <td className="px-3 py-1.5 text-right">{line.gain !== undefined ? formatCurrency(line.gain) : ''}</td>
                      <td className="px-3 py-1.5 text-right text-red-600">{line.deduction !== undefined ? formatCurrency(line.deduction) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-emerald-600 text-white rounded-lg px-4 py-3 flex justify-between font-bold">
                <span>NET À PAYER</span><span>{formatCurrency(previewLines.net)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {previewLines.info.map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400">{item.label}</p>
                    <p className="font-semibold text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
              {preview.details && (
                <p className="text-xs text-gray-500">
                  Charges patronales : {formatCurrency(preview.details.employerCharges)} · Coût total employeur : {formatCurrency(preview.details.employerCost)}
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Fermer</button>
              <button onClick={() => handleDownloadPayslipPDF(preview)} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                <Download className="h-4 w-4" /> Télécharger PDF
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  )
}
