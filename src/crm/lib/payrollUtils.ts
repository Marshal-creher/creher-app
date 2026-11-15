// LF 2026 rates
const CNSS_RATE = 0.0448
const CNSS_CEILING = 6000
const AMO_RATE = 0.0226
const FRAIS_PRO_RATE = 0.25
const FRAIS_PRO_CAP = 35000 / 12   // 2 916,67/mois — LF 2026
export const SMIG_BRUT = 3422.72  // SMIG brut mensuel LF 2026

// IGR brackets — LF 2026
function monthlyIGR(annualTaxable: number): number {
  let tax = 0
  if (annualTaxable <= 40000) tax = 0
  else if (annualTaxable <= 60000) tax = annualTaxable * 0.10 - 4000
  else if (annualTaxable <= 80000) tax = annualTaxable * 0.20 - 10000
  else if (annualTaxable <= 100000) tax = annualTaxable * 0.30 - 18000
  else if (annualTaxable <= 180000) tax = annualTaxable * 0.34 - 22000
  else tax = annualTaxable * 0.38 - 29200
  return Math.max(0, tax) / 12
}

function _grossToNet(gross: number): number {
  const cnss = Math.min(gross, CNSS_CEILING) * CNSS_RATE
  const amo = gross * AMO_RATE
  const fraisPro = Math.min(gross * FRAIS_PRO_RATE, FRAIS_PRO_CAP)
  const igr = monthlyIGR(Math.max(0, gross - cnss - amo - fraisPro) * 12)
  return Math.max(0, gross - cnss - amo - igr)
}

export function grossToNet(gross: number): number {
  return Math.round(_grossToNet(gross) * 100) / 100
}

// Binary search: net→gross is monotonic so bisection converges fast
export function netToGross(targetNet: number): number {
  if (targetNet <= 0) return 0
  let low = targetNet
  let high = targetNet * 3
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2
    const net = _grossToNet(mid)
    if (Math.abs(net - targetNet) < 0.01) return Math.round(mid * 100) / 100
    if (net < targetNet) low = mid
    else high = mid
  }
  return Math.round(((low + high) / 2) * 100) / 100
}

export function parseLocalizedNumber(value: string): number {
  // Handles French/Moroccan formatting: "10 000" or "10.000" or "10,000"
  const normalized = value.replace(/[\s]/g, '').replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(',', '.')
  return parseFloat(normalized)
}
