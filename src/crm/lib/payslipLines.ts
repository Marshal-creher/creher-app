// Lines of a Moroccan payslip ("bulletin de paie"), built from what the HRM's
// payroll engine stored for the payslip. Used by the on-screen payslip and the
// PDF, so both always show the same rubrics as the reference workbook.

export interface PayrollParams {
  cnssCeiling: number
  cnssEmployeeRate: number
  amoEmployeeRate: number
  cnssEmployerRate: number
  familyAllowanceRate: number
  amoEmployerRate: number
  tfpRate: number
  overtimeCoef: number
  holidayCoef: number
  extraDayCoef: number
  baseDays: number
  [key: string]: unknown
}

export interface PayrollDetails {
  workedDays: number; paidDays: number; absenceAndLeaveDeduction: number; paidLeaveAmount: number
  hourlyRate: number; dailyRate: number; overtimePay: number; holidayPay: number; extraDaysPay: number
  regularisationPay: number; monthVariables: number; panierPaid: number; transportPaid: number
  attendanceBonusPaid: number; netTargetTotal: number; grossUp: number; nightPremiumGross: number
  commissionNetGross: number; bonusNetGross: number; nightGratificationPaid: number; missionBonusPaid: number
  engagementCommissionPaid: number; performanceAllowancePaid: number; personalBonusPaid: number
  seniorityYears: number; seniorityRate: number; seniorityBonus: number; taxableGrossBeforeGrossUp: number
  taxableGross: number; fullTimeGross: number; cnssEmployee: number; amoEmployee: number; fraisPro: number
  netTaxableBeforeRetirement: number; retirementDeduction: number; netTaxable: number; irGross: number
  familyDeduction: number; irNet: number; grossPaid: number; totalDeductions: number; netBeforeRounding: number
  rounding: number; netPay: number; cnssEmployer: number; familyAllowance: number; amoEmployer: number
  tfp: number; employerCharges: number; employerCost: number
  params?: PayrollParams
}

export interface PayrollInputs {
  baseSalary: number; hireDate: string | null; dependents: number; unpaidAbsenceDays: number; paidLeaveDays: number
  overtimeHours: number; holidaysWorked: number; extraDays: number; regularisationDays: number
  previousMonthRemainder: number; panier: number; panierExcludedDays: number; transport: number
  attendanceBonus: number; nightGratification: number; missionBonus: number; engagementCommission: number
  performanceAllowance: number; personalBonus: number; bonusGross: number; bonusGross5: number
  commissionGross: number; malusGross: number; nightPremiumNet: number; commissionNet: number; bonusNet: number
  bonusNet5: number; malusNet: number; retirementAmount: number; retirementDeductible: boolean; companyLoan: number
  salaryAdvance: number; lateDeduction: number; lateMinutes: number; mutuelleEmployee: number; otherDeductions: number
}

export interface PayslipLine {
  label: string
  base?: string
  rate?: string
  gain?: number
  deduction?: number
  kind: 'line' | 'subtotal'
}

const num = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (r: number) => `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const qty = (n: number, unit: string) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit}`

export function payslipLines(p: Record<string, unknown>): { lines: PayslipLine[]; net: number; info: Array<{ label: string; value: string }> } {
  const d = p.details as PayrollDetails | null | undefined
  const i = p.inputs as PayrollInputs | null | undefined

  if (!d || !i) return legacyLines(p)

  const prm = d.params
  const lines: PayslipLine[] = []
  const gain = (label: string, amount: number, base?: string, rate?: string) => {
    if (Math.abs(amount) >= 0.005) lines.push({ label, base, rate, gain: amount, kind: 'line' })
  }
  const deduct = (label: string, amount: number, base?: string, rate?: string) => {
    if (Math.abs(amount) >= 0.005) lines.push({ label, base, rate, deduction: amount, kind: 'line' })
  }

  lines.push({ label: 'Salaire de base', base: qty(prm?.baseDays ?? 26, 'j'), gain: i.baseSalary, kind: 'line' })
  gain(`Retenue absences non payées et congés`, -d.absenceAndLeaveDeduction, qty(i.unpaidAbsenceDays + i.paidLeaveDays, 'j'), num(d.dailyRate))
  gain('Indemnité de congés payés', d.paidLeaveAmount, qty(i.paidLeaveDays, 'j'), num(d.dailyRate))
  gain(`Retenue pour retards`, -i.lateDeduction, qty(i.lateMinutes, 'min'))
  gain(`Prime d'ancienneté`, d.seniorityBonus, qty(d.seniorityYears, 'ans'), pct(d.seniorityRate))
  gain('Heures supplémentaires', d.overtimePay, qty(i.overtimeHours, 'h'), prm ? `${num(d.hourlyRate)} × ${prm.overtimeCoef}` : undefined)
  gain('Jours fériés travaillés', d.holidayPay, qty(i.holidaysWorked, 'j'), prm ? `${num(d.dailyRate)} × ${prm.holidayCoef}` : undefined)
  gain('Jours supplémentaires', d.extraDaysPay, qty(i.extraDays, 'j'), prm ? `${num(d.dailyRate)} × ${prm.extraDayCoef}` : undefined)
  gain('Régularisation', d.regularisationPay, qty(i.regularisationDays, 'j'), num(d.dailyRate))
  gain('Rappel / reliquat du mois précédent', i.previousMonthRemainder)
  gain(`Prime d'assiduité`, d.attendanceBonusPaid)
  gain('Gratification de nuit', d.nightGratificationPaid)
  gain('Prime de mission', d.missionBonusPaid)
  gain(`Commission d'engagement`, d.engagementCommissionPaid)
  gain('Indemnité de performance', d.performanceAllowancePaid)
  gain('Bonification personnelle', d.personalBonusPaid)
  gain('Bonus', i.bonusGross)
  gain('Bonus 5 %', i.bonusGross5)
  gain('Commission', i.commissionGross)
  gain('Malus', -i.malusGross)
  gain('Prime de nuit (nette garantie)', d.nightPremiumGross)
  gain('Commission (nette garantie)', d.commissionNetGross)
  gain('Bonus (net garanti)', d.bonusNetGross)
  lines.push({ label: 'SALAIRE BRUT IMPOSABLE', gain: d.taxableGross, kind: 'subtotal' })

  gain('Prime de panier (exonérée)', d.panierPaid)
  gain('Indemnité de transport (exonérée)', d.transportPaid)
  lines.push({ label: 'SALAIRE BRUT GLOBAL', gain: d.grossPaid, kind: 'subtotal' })

  const cnssBase = Math.min(d.taxableGross, prm?.cnssCeiling ?? d.taxableGross)
  deduct('CNSS', d.cnssEmployee, num(cnssBase), prm ? pct(prm.cnssEmployeeRate) : undefined)
  deduct('AMO', d.amoEmployee, num(d.taxableGross), prm ? pct(prm.amoEmployeeRate) : undefined)
  deduct('IR (retenue à la source)', d.irNet, num(d.netTaxable), 'barème')
  deduct('Retraite complémentaire', i.retirementAmount)
  deduct('Mutuelle', i.mutuelleEmployee)
  deduct('Prêt société', i.companyLoan)
  deduct('Avance sur salaire', i.salaryAdvance)
  deduct('Autres retenues', i.otherDeductions)
  if (d.rounding > 0.004) gain('Arrondi', d.rounding)
  if (d.rounding < -0.004) deduct('Arrondi', -d.rounding)

  const info = [
    { label: 'Jours payés', value: qty(d.paidDays, 'j') },
    { label: 'Frais professionnels', value: num(d.fraisPro) },
    ...(d.retirementDeduction ? [{ label: 'Retraite déduite (IR)', value: num(d.retirementDeduction) }] : []),
    { label: 'Net imposable', value: num(d.netTaxable) },
    { label: 'IR brut', value: num(d.irGross) },
    { label: `Charges de famille (${i.dependents} pers.)`, value: num(d.familyDeduction) },
  ]
  return { lines, net: d.netPay, info }
}

// Payslips calculated before the current payroll engine kept only totals.
function legacyLines(p: Record<string, unknown>) {
  const v = (key: string) => Number(p[key] ?? 0) || 0
  const lines: PayslipLine[] = [
    { label: 'Salaire de base', gain: v('base_salary'), kind: 'line' },
  ]
  if (v('absence_deduction')) lines.push({ label: 'Retenue absences', gain: -v('absence_deduction'), kind: 'line' })
  if (v('retard_deduction')) lines.push({ label: 'Retenue pour retards', gain: -v('retard_deduction'), kind: 'line' })
  if (v('overtime_pay')) lines.push({ label: 'Heures supplémentaires', gain: v('overtime_pay'), kind: 'line' })
  if (v('bonuses')) lines.push({ label: 'Primes', gain: v('bonuses'), kind: 'line' })
  lines.push({ label: 'SALAIRE BRUT', gain: v('gross_salary'), kind: 'subtotal' })
  lines.push({ label: 'CNSS', deduction: v('cnss_employee'), kind: 'line' })
  lines.push({ label: 'AMO', deduction: v('amo_employee'), kind: 'line' })
  lines.push({ label: 'IR (retenue à la source)', deduction: v('igr'), kind: 'line' })
  if (v('mutuelle_employee')) lines.push({ label: 'Mutuelle', deduction: v('mutuelle_employee'), kind: 'line' })
  if (v('avance_deduction')) lines.push({ label: 'Avance sur salaire', deduction: v('avance_deduction'), kind: 'line' })
  if (v('other_deductions')) lines.push({ label: 'Autres retenues', deduction: v('other_deductions'), kind: 'line' })
  return { lines, net: v('net_salary'), info: [{ label: 'Calcul', value: 'ancienne version de la paie' }] }
}
