import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsService } from '../services/settings.service'
import { Button } from './ui/Button'
import { Card, CardBody, CardHeader } from './ui/Card'
import { PageLoader } from './ui/Spinner'

// The company's payroll parameters. Defaults are those of the reference
// workbook (hr-consultant-morocco skill, 2026); a company can adapt its own
// practice (coefficients, prorata, rounding) without affecting the others.

type Kind = 'rate' | 'amount' | 'number' | 'bool'
interface Field { key: string; label: string; kind: Kind; hint?: string }

const GROUPS: Array<{ title: string; fields: Field[] }> = [
  {
    title: 'Cotisations sociales (CNSS / AMO)',
    fields: [
      { key: 'cnssCeiling', label: 'Plafond CNSS mensuel (MAD)', kind: 'amount' },
      { key: 'cnssEmployeeRate', label: 'CNSS salariale', kind: 'rate' },
      { key: 'amoEmployeeRate', label: 'AMO salariale', kind: 'rate' },
      { key: 'cnssEmployerRate', label: 'CNSS patronale — prestations sociales', kind: 'rate' },
      { key: 'familyAllowanceRate', label: 'Allocations familiales (patronale)', kind: 'rate' },
      { key: 'amoEmployerRate', label: 'AMO patronale (y c. solidarité)', kind: 'rate' },
      { key: 'tfpRate', label: 'Taxe de formation professionnelle', kind: 'rate' },
    ],
  },
  {
    title: 'Impôt sur le revenu (IR)',
    fields: [
      { key: 'fraisProThreshold', label: 'Frais pro — seuil brut mensuel (MAD)', kind: 'amount' },
      { key: 'fraisProRateLow', label: 'Frais pro — taux sous le seuil', kind: 'rate' },
      { key: 'fraisProCapLow', label: 'Frais pro — plafond sous le seuil (MAD)', kind: 'amount' },
      { key: 'fraisProRateHigh', label: 'Frais pro — taux au-dessus du seuil', kind: 'rate' },
      { key: 'fraisProCapHigh', label: 'Frais pro — plafond au-dessus (MAD)', kind: 'amount' },
      { key: 'familyDeductionPerPerson', label: 'Charges de famille — par personne (MAD/mois)', kind: 'amount' },
      { key: 'familyMaxPersons', label: 'Charges de famille — personnes au maximum', kind: 'number' },
      { key: 'retirementDeductionCap', label: 'Retraite complémentaire — part déductible du net imposable', kind: 'rate' },
    ],
  },
  {
    title: 'Temps de travail et majorations',
    fields: [
      { key: 'baseDays', label: 'Jours de base par mois', kind: 'number' },
      { key: 'monthlyHours', label: 'Heures de base par mois (taux horaire)', kind: 'number' },
      { key: 'dailyBaseDays', label: 'Jours de base (taux journalier)', kind: 'number' },
      { key: 'overtimeCoef', label: 'Coefficient heures supplémentaires', kind: 'number', hint: '2 = payées double (majoration incluse)' },
      { key: 'holidayCoef', label: 'Coefficient jour férié travaillé', kind: 'number' },
      { key: 'extraDayCoef', label: 'Coefficient jour supplémentaire', kind: 'number' },
      { key: 'panierDays', label: 'Jours de panier par mois', kind: 'number' },
      { key: 'panierDailyValue', label: 'Valeur du panier par jour (0 = panier ÷ jours)', kind: 'amount' },
    ],
  },
  {
    title: 'Options de calcul',
    fields: [
      { key: 'prorataAllowances', label: 'Proratiser panier, transport et assiduité par jours payés', kind: 'bool' },
      { key: 'fraisProThresholdOnFullTime', label: 'Seuil des frais pro testé sur le brut reconstitué à temps plein', kind: 'bool' },
      { key: 'fraisProCapProrata', label: 'Plafond des frais pro proratisé par jours payés', kind: 'bool' },
      { key: 'seniorityIncludeOvertime', label: "Heures supplémentaires dans la base de la prime d'ancienneté", kind: 'bool' },
      { key: 'seniorityIncludeRegularBonuses', label: "Primes régulières dans la base de la prime d'ancienneté", kind: 'bool' },
      { key: 'roundNetToDirham', label: 'Arrondir le net à payer au dirham', kind: 'bool' },
    ],
  },
]

const asPercent = (rate: number) => Math.round(rate * 1e6) / 1e4

export function PayrollParamsForm() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['payroll-params'], queryFn: settingsService.getPayrollParams })
  const [values, setValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (data?.params) setValues(data.params)
  }, [data])

  const save = useMutation({
    mutationFn: () => {
      const changes: Record<string, unknown> = {}
      for (const group of GROUPS) for (const f of group.fields) changes[f.key] = values[f.key]
      return settingsService.updatePayrollParams(changes)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-params'] })
      toast.success('Paramètres de paie enregistrés. Recalculez les paies non payées pour les appliquer.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Valeurs refusées'),
  })

  const reset = useMutation({
    mutationFn: settingsService.resetPayrollParams,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-params'] })
      toast.success('Paramètres remis aux valeurs de référence 2026')
    },
  })

  if (isLoading || !data) return <PageLoader />
  const defaults = data.defaults as Record<string, unknown>
  const brackets = (values.irBrackets ?? []) as Array<{ floor: number; rate: number; deduction: number }>
  const seniority = (values.seniorityBrackets ?? []) as Array<{ years: number; rate: number }>

  const set = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }))

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-900">
        Le calcul reproduit le classeur « Payroll File Requalibré » et les taux 2026 de la skill RH Maroc.
        {data.customized ? ' Cette entreprise a des paramètres personnalisés.' : ' Cette entreprise utilise les valeurs de référence.'}
      </div>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">{group.title}</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {group.fields.map((f) => {
              const value = values[f.key]
              const changed = JSON.stringify(value) !== JSON.stringify(defaults[f.key])
              if (f.kind === 'bool') {
                return (
                  <label key={f.key} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => set(f.key, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className={changed ? 'font-medium text-amber-700' : ''}>{f.label}</span>
                  </label>
                )
              }
              const shown = f.kind === 'rate' ? asPercent(Number(value ?? 0)) : Number(value ?? 0)
              return (
                <div key={f.key} className="grid grid-cols-[1fr_160px] items-center gap-4">
                  <div>
                    <p className={`text-sm ${changed ? 'font-medium text-amber-700' : 'text-gray-700'}`}>{f.label}</p>
                    <p className="text-xs text-gray-400">
                      Référence : {f.kind === 'rate' ? `${asPercent(Number(defaults[f.key]))} %` : String(defaults[f.key])}
                      {f.hint ? ` — ${f.hint}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={Number.isFinite(shown) ? shown : 0}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        set(f.key, f.kind === 'rate' ? n / 100 : n)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-xs text-gray-400 w-5">{f.kind === 'rate' ? '%' : ''}</span>
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Barèmes (référence 2026, en lecture seule)</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-6 text-sm">
          <table className="w-full">
            <thead><tr className="text-xs text-gray-500"><th className="text-left py-1">IR — net imposable mensuel à partir de</th><th className="text-right">Taux</th><th className="text-right">À déduire</th></tr></thead>
            <tbody>
              {brackets.map((b) => (
                <tr key={b.floor} className="border-t border-gray-100">
                  <td className="py-1">{b.floor.toLocaleString('fr-FR')} MAD</td>
                  <td className="text-right">{asPercent(b.rate)} %</td>
                  <td className="text-right">{b.deduction.toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full">
            <thead><tr className="text-xs text-gray-500"><th className="text-left py-1">Prime d'ancienneté (Art. 350) — dès</th><th className="text-right">Taux</th></tr></thead>
            <tbody>
              {seniority.map((s) => (
                <tr key={s.years} className="border-t border-gray-100">
                  <td className="py-1">{s.years} an{s.years > 1 ? 's' : ''}</td>
                  <td className="text-right">{asPercent(s.rate)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          loading={reset.isPending}
          onClick={() => window.confirm('Revenir aux valeurs de référence 2026 pour cette entreprise ?') && reset.mutate()}
        >
          Valeurs de référence
        </Button>
        <Button variant="primary" leftIcon={<Save className="h-4 w-4" />} loading={save.isPending} onClick={() => save.mutate()}>
          Enregistrer les paramètres de paie
        </Button>
      </div>
    </div>
  )
}
