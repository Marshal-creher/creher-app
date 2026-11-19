// Quick net ↔ gross conversion for a plain monthly salary (full month, no
// seniority, no dependents), used on the employee screens. Same rules as the
// payroll engine and the reference workbook (2026): CNSS 4.48 % capped at
// 6 000, AMO 2.26 %, frais professionnels 35 % up to 2 500 when the gross is at
// most 6 500 (25 % up to 2 916.67 above), IR barème LF 2025-2026.
// Payslips themselves are always calculated by the server.

const CNSS_RATE = 0.0448
const CNSS_CEILING = 6000
const AMO_RATE = 0.0226
const FRAIS_PRO_THRESHOLD = 6500

// SMIG used for the "below SMIG" warning. 2026 sources disagree (≈ 3 266 to
// 3 422 MAD); the higher figure is kept so the warning errs on the safe side.
export const SMIG_BRUT = 3422.72

const IR_BRACKETS = [
  { floor: 0, rate: 0, deduction: 0 },
  { floor: 3333.33, rate: 0.1, deduction: 333.33 },
  { floor: 5000, rate: 0.2, deduction: 833.33 },
  { floor: 6666.67, rate: 0.3, deduction: 1500 },
  { floor: 8333.33, rate: 0.34, deduction: 1833.33 },
  { floor: 15000, rate: 0.37, deduction: 2283.33 },
]

const round2 = (n: number) => Math.sign(n) * Math.round(Math.abs(n) * 100) / 100

function netOf(gross: number): number {
  const cnss = round2(Math.min(gross, CNSS_CEILING) * CNSS_RATE)
  const amo = round2(gross * AMO_RATE)
  const low = gross <= FRAIS_PRO_THRESHOLD
  const fraisPro = round2(Math.min(gross * (low ? 0.35 : 0.25), low ? 2500 : 2916.67))
  const netTaxable = round2(Math.max(0, gross - cnss - amo - fraisPro))
  let bracket = IR_BRACKETS[0]
  for (const b of IR_BRACKETS) if (b.floor <= netTaxable) bracket = b
  const ir = round2(Math.max(0, netTaxable * bracket.rate - bracket.deduction))
  return round2(gross - cnss - amo - ir)
}

export function grossToNet(gross: number): number {
  return netOf(Math.max(0, gross))
}

// The net grows with the gross, so a search on centimes finds the gross
export function netToGross(targetNet: number): number {
  if (targetNet <= 0) return 0
  let lo = 0
  let hi = Math.round(targetNet * 200)
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (netOf(mid / 100) >= targetNet) hi = mid
    else lo = mid
  }
  return hi / 100
}

export function parseLocalizedNumber(value: string): number {
  // Handles French/Moroccan formatting: "10 000" or "10.000" or "10,000"
  const normalized = value.replace(/[\s]/g, '').replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(',', '.')
  return parseFloat(normalized)
}
