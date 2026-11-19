// ─────────────────────────────────────────────────────────────────────────────
// PDF Generator — INFINITAS HRM
// ─────────────────────────────────────────────────────────────────────────────

import { payslipLines } from './payslipLines'

// ── Page geometry — A4 contracts + payslips ───────────────────────────────────
const PW          = 210   // A4 width mm
const ML          = 18    // contracts / payslips — left margin
const MR          = 18    // contracts / payslips — right margin
const CW          = PW - ML - MR
const FOOTER_Y    = 280

// ── Page geometry — A4 attestations / lettres / notes ─────────────────────────
// Marges : Haut 25 mm · Bas 20 mm · Gauche 25 mm · Droite 25 mm
const ML_L        = 25    // left  25 mm
const MR_L        = 25    // right 25 mm
const CW_L        = PW - ML_L - MR_L   // 160 mm
const HEADER_H_L  = 48    // logo/header zone — content starts at 48 mm
const FOOTER_Y_L  = 297 - 20  // 277 mm  (bas 20 mm)
const LH_L        = 7.4   // line-height ≈ 21 pt (~6pt spacing)

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  navy   : [22,  48,  92] as const,   // dark navy blue — replaces purple
  dark   : [25,  25,  25] as const,
  gray   : [110, 110, 110] as const,
  lgray  : [210, 210, 210] as const,
  white  : [255, 255, 255] as const,
  green  : [22,  163,  74] as const,
  red    : [190,  40,  40] as const,
  bgrow  : [248, 248, 250] as const,
  bgemp  : [244, 246, 250] as const,
  totoal : [230, 236, 248] as const,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert server-relative path to absolute URL the browser can fetch */
function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('http')) return path
  // path like "/uploads/logos/xxx.png" — proxy forwards this to backend
  return path   // Vite proxy handles /uploads → localhost:3001
}

async function loadImage(logoPath: string | null | undefined): Promise<string | null> {
  const url = resolveUrl(logoPath)
  if (!url) return null
  if (url.startsWith('data:')) return url
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = () => reject(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

function fill(pdf: any, c: readonly [number,number,number])  { pdf.setFillColor(c[0],c[1],c[2]) }
function stroke(pdf: any, c: readonly [number,number,number]){ pdf.setDrawColor(c[0],c[1],c[2]) }
function ink(pdf: any, c: readonly [number,number,number])   { pdf.setTextColor(c[0],c[1],c[2]) }

function fmt(n: number | null | undefined): string {
  if (n == null) return '0,00'
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function month(m: number): string {
  return ['Janvier','Février','Mars','Avril','Mai','Juin',
          'Juillet','Août','Septembre','Octobre','Novembre','Décembre'][(m-1)] || ''
}

/**
 * Render a paragraph with optional **bold** markers and automatic word-wrap.
 * Works for both plain and mixed bold/normal text.
 * Returns the total height consumed in mm.
 */
function richParagraph(
  pdf: any, text: string,
  x: number, y: number,
  maxW: number,
  sz = 12, lh = 7.4
): number {
  if (!text.trim()) return 0
  pdf.setFontSize(sz)
  ink(pdf, C.dark)

  // ── Plain text — use jsPDF native wrap (accurate & fast) ─────────────────
  if (!text.includes('**')) {
    pdf.setFont('helvetica', 'normal')
    const lines = pdf.splitTextToSize(text.trim(), maxW)
    pdf.text(lines, x, y)
    return lines.length * lh
  }

  // ── Mixed bold/normal — word-level render with manual wrap ────────────────
  // Build token list: alternate normal/bold segments split into words
  type Token = { word: string; bold: boolean }
  const tokens: Token[] = []
  for (const part of text.split(/(\*\*[^*]+\*\*)/)) {
    if (!part) continue
    const bold = part.startsWith('**') && part.endsWith('**')
    const content = bold ? part.slice(2, -2) : part
    // split preserving whitespace tokens so we don't lose spaces
    for (const w of content.split(/(\s+)/)) {
      if (w) tokens.push({ word: w, bold })
    }
  }

  let cx = x       // cursor x
  let cy = y       // cursor y
  let linesDrawn = 1

  for (const { word, bold } of tokens) {
    // Pure-whitespace token → advance by one space, don't render
    if (/^\s+$/.test(word)) {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal')
      cx += pdf.getTextWidth(' ')
      continue
    }

    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    const ww = pdf.getTextWidth(word)

    // Would this word overflow the right margin?
    if (cx > x && cx - x + ww > maxW) {
      cy += lh
      cx = x
      linesDrawn++
    }

    pdf.text(word, cx, cy)
    cx += ww
  }

  pdf.setFont('helvetica', 'normal')
  return linesDrawn * lh
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT PDF  —  Attestations · Contrats · Lettres · Notes
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDocumentPDF(td: Record<string, unknown>, opts: { print?: boolean } = {}): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const docType   = (td.doc_type as string) || ''
  const isContract = docType.startsWith('CONTRAT')

  // ── Layout config: A4 for all — different margins per type ───────────────
  const pw       = PW        // 210 mm — A4 for everyone
  const ml       = isContract ? ML       : ML_L
  const mr       = isContract ? MR       : MR_L
  const cw       = isContract ? CW       : CW_L
  const footerY  = isContract ? FOOTER_Y : FOOTER_Y_L
  const contentY = isContract ? 35       : HEADER_H_L + 2
  const lh       = isContract ? 5.8      : LH_L

  const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' })

  // ── Pull data ──────────────────────────────────────────────────────────────
  const hdr         = td.header as Record<string,string> | undefined
  const customHdr   = (td.doc_header_text as string) || null
  const customFtr   = (td.doc_footer_text as string) || null
  const logoDataUrl = await loadImage(td.logo_path as string)

  // ── Header/Footer drawn on EVERY page ─────────────────────────────────────
  function drawDecor(page: number, total: number) {
    pdf.setPage(page)

    // ─── HEADER ───────────────────────────────────────────────────────────
    const LOGO_W = 60, LOGO_H = 20
    const LOGO_X = ml, LOGO_Y = 8
    const TEXT_X = logoDataUrl ? LOGO_X + LOGO_W + 5 : LOGO_X

    if (logoDataUrl) {
      try { pdf.addImage(logoDataUrl, 'AUTO', LOGO_X, LOGO_Y, LOGO_W, LOGO_H, undefined, 'FAST') }
      catch {/* skip */}
    }

    if (customHdr) {
      const lines = customHdr.split('\n')
      let hy = LOGO_Y + 5
      lines.forEach((line, i) => {
        if (i === 0) { pdf.setFont('helvetica','bold');   pdf.setFontSize(12) }
        else         { pdf.setFont('helvetica','normal'); pdf.setFontSize(8)  }
        ink(pdf, i === 0 ? C.dark : C.gray)
        pdf.text(line, TEXT_X, hy)
        hy += i === 0 ? 5.5 : 4
      })
    } else {
      let hy = LOGO_Y + 5
      pdf.setFont('helvetica','bold'); pdf.setFontSize(12); ink(pdf, C.dark)
      pdf.text(hdr?.name || 'VOTRE SOCIÉTÉ', TEXT_X, hy); hy += 5.5
      if (hdr?.address) {
        pdf.setFont('helvetica','normal'); pdf.setFontSize(8); ink(pdf, C.gray)
        pdf.text(hdr.address, TEXT_X, hy); hy += 4
      }
      const legal = [
        hdr?.rc            ? `RC: ${hdr.rc}`             : '',
        hdr?.if_fiscal     ? `IF: ${hdr.if_fiscal}`       : '',
        hdr?.cnss_employer ? `CNSS: ${hdr.cnss_employer}` : '',
        hdr?.ice           ? `ICE: ${hdr.ice}`            : '',
      ].filter(Boolean).join('   ·   ')
      if (legal) { pdf.setFontSize(7); ink(pdf, C.gray); pdf.text(legal, TEXT_X, hy) }
    }

    // ─── FOOTER ───────────────────────────────────────────────────────────
    pdf.setFont('times','normal'); pdf.setFontSize(7); ink(pdf, C.gray)
    const ftxt = customFtr ||
      `Document généré par INFINITAS HRM — ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}`
    const flines = pdf.splitTextToSize(ftxt, cw)
    flines.forEach((l: string, i: number) => pdf.text(l, ml, footerY + 4 + i * 3.5))
    if (total > 1) {
      pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5)
      pdf.text(`${page} / ${total}`, pw - mr, footerY + 4, {align:'right'})
    }
  }

  // ── Content cursor ────────────────────────────────────────────────────────
  let y = contentY

  const br = (need = 12) => {
    if (y + need > footerY - 6) { pdf.addPage(); y = contentY }
  }

  // ── Title — centered, 17pt bold, underlined ───────────────────────────────
  y += lh
  const title = (td.title as string) || ''
  if (title) {
    br(20)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(17); ink(pdf, C.dark)
    const tlines = pdf.splitTextToSize(title.toUpperCase(), cw)
    pdf.text(tlines, pw / 2, y, {align:'center'})
    // underline
    const tw = Math.min(pdf.getTextWidth(title.toUpperCase()), cw)
    stroke(pdf, C.dark); pdf.setLineWidth(0.6)
    pdf.line(pw/2 - tw/2, y + 1.5, pw/2 + tw/2, y + 1.5)
    y += tlines.length * lh + 3
  }
  if (td.subtitle) {
    pdf.setFont('helvetica','italic'); pdf.setFontSize(9.5); ink(pdf, C.gray)
    const slines = pdf.splitTextToSize(td.subtitle as string, cw)
    pdf.text(slines, pw / 2, y, {align:'center'})
    y += slines.length * lh + 2
  }
  y += lh * 3

  // ── Meta block ────────────────────────────────────────────────────────────
  const meta = td.meta as Record<string,string> | undefined
  if (meta && Object.keys(meta).length > 0) {
    const rows = Object.entries(meta)
    const boxH = rows.length * 7 + 6
    br(boxH + 4)
    stroke(pdf, C.lgray); pdf.setLineWidth(0.4)
    pdf.rect(ml, y, cw, boxH, 'D')
    y += 6
    for (const [k, v] of rows) {
      pdf.setFont('helvetica','bold'); pdf.setFontSize(10); ink(pdf, C.dark)
      const kw = pdf.getTextWidth(`${k} : `)
      pdf.text(`${k} : `, ml + 6, y)
      pdf.setFont('helvetica','normal'); ink(pdf, [50,50,50] as const)
      pdf.text(v, ml + 6 + kw, y)
      y += 7
    }
    y += lh
  }

  // ── Body paragraphs — 12pt ───────────────────────────────────────────────
  for (const item of (td.body as Array<{text:string}>) || []) {
    if (!item.text) { y += lh * 0.5; continue }
    for (const para of item.text.split('\n')) {
      if (!para.trim()) { y += lh * 0.6; continue }
      // Estimate height before rendering to decide page break
      const cleanForHeight = para.replace(/\*\*[^*]+\*\*/g, m => m.slice(2,-2))
      const estLines = pdf.splitTextToSize(cleanForHeight, cw).length
      br(estLines * lh + 2)
      y += richParagraph(pdf, para.trim(), ml, y, cw, 12, lh)
    }
    y += lh * 0.6
  }

  // ── Articles (contracts) ──────────────────────────────────────────────────
  for (const art of (td.articles as Array<{num:string;text:string;bullets?:string[];textAfter?:string}>) || []) {
    br(20)
    stroke(pdf, C.lgray); pdf.setLineWidth(0.3); pdf.line(ml, y, pw-mr, y); y += 5

    pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); ink(pdf, C.navy)
    pdf.text(art.num, ml, y)
    const artTW = pdf.getTextWidth(art.num)
    stroke(pdf, C.navy); pdf.setLineWidth(0.4)
    pdf.line(ml, y + 1.5, ml + artTW, y + 1.5)
    y += 7

    if (art.text) {
      for (const para of art.text.split('\n')) {
        if (!para.trim()) { y += 2.5; continue }
        const cleanH = para.replace(/\*\*[^*]+\*\*/g, m => m.slice(2,-2))
        br(pdf.splitTextToSize(cleanH, cw-4).length * 5.5 + 2)
        y += richParagraph(pdf, para.trim(), ml+3, y, cw-4, 10, 5.5)
      }
      y += 2
    }

    for (const b of art.bullets || []) {
      const clean = b.replace(/\*\*/g, '')
      const blines = pdf.splitTextToSize(clean, cw-12)
      br(blines.length * 5.5 + 2)
      fill(pdf, C.dark); pdf.circle(ml+6, y - 1, 0.8, 'F')
      pdf.setFont('helvetica','normal'); pdf.setFontSize(10); ink(pdf, C.dark)
      pdf.text(blines, ml+10, y)
      y += blines.length * 5.5
    }
    if (art.bullets?.length) y += 2

    if (art.textAfter) {
      const cleanH = art.textAfter.replace(/\*\*/g, '')
      const lines  = pdf.splitTextToSize(cleanH, cw-4)
      br(lines.length * 5.5 + 2)
      y += richParagraph(pdf, art.textAfter, ml+3, y, cw-4, 10, 5.5)
      y += 3
    }
    y += 4
  }

  // ── Signature ─────────────────────────────────────────────────────────────
  const sig = td.signature as Record<string,unknown> | undefined
  if (sig) {
    const hasTwo = !!(sig as any).employer && !!(sig as any).employee
    if (hasTwo) {
      br(65)
      y += lh

      // Date right-aligned just above separator
      pdf.setFont('helvetica','normal'); pdf.setFontSize(10); ink(pdf, C.dark)
      pdf.text(
        `${(td.city as string)||'Casablanca'}, le ${(td.date as string)||''}`,
        pw - mr, y, {align:'right'}
      )
      y += lh

      stroke(pdf, C.lgray); pdf.setLineWidth(0.4); pdf.line(ml, y, pw-mr, y); y += lh

      const emp  = (sig as any).employer as Record<string,string>
      const sal  = (sig as any).employee as Record<string,string>
      const colW = (cw - 10) / 2
      const BOX_H = 52

      // Two large plain bordered cells — no fill
      stroke(pdf, C.lgray); pdf.setLineWidth(0.5)
      pdf.rect(ml, y, colW, BOX_H, 'D')
      pdf.rect(ml + colW + 10, y, colW, BOX_H, 'D')

      // Labels — simple bold navy text inside top of box
      pdf.setFont('helvetica','bold'); pdf.setFontSize(9); ink(pdf, C.navy)
      pdf.text(emp.title || "L'Employeur",     ml + colW/2,            y + 7, {align:'center'})
      pdf.text(sal.title || "L'Employé(e)",    ml + colW + 10 + colW/2, y + 7, {align:'center'})

      // Light divider under label
      stroke(pdf, C.lgray); pdf.setLineWidth(0.3)
      pdf.line(ml + 3, y + 10, ml + colW - 3, y + 10)
      pdf.line(ml + colW + 13, y + 10, ml + colW + 10 + colW - 3, y + 10)

      // Names
      y += 16
      pdf.setFont('helvetica','normal'); pdf.setFontSize(9); ink(pdf, C.dark)
      if (emp.name) emp.name.split('\n').forEach((l: string, i: number) => pdf.text(l, ml + 4, y + i * 5.5))
      if (sal.name) pdf.text(sal.name, ml + colW + 14, y)

      // Labels
      y += 8
      pdf.setFont('helvetica','italic'); pdf.setFontSize(7.5); ink(pdf, C.gray)
      if (emp.label)  pdf.text(emp.label,  ml + 4,           y)
      if (sal.label)  pdf.text(sal.label,  ml + colW + 14,   y)

      // Signature lines near bottom of cells
      y += 20
      stroke(pdf, C.lgray); pdf.setLineWidth(0.5)
      pdf.line(ml + 4,           y, ml + colW - 4,                  y)
      pdf.line(ml + colW + 14,   y, ml + colW + 10 + colW - 4,      y)
      y += 4
    } else {
      // Fixed at bottom of page — box bottom = FOOTER_Y_L - 2, date 8mm above box top
      const s            = sig as Record<string,string>
      const BW           = 85, BH = 52
      const BX           = pw - mr - BW
      const SIG_Y_FIXED  = FOOTER_Y_L - 2 - BH   // 223 mm
      const DATE_Y_FIXED = SIG_Y_FIXED - 8        // 215 mm

      if (y > DATE_Y_FIXED - 5) { pdf.addPage(); y = contentY }

      // Date right-aligned just above sig box
      pdf.setFont('helvetica','normal'); pdf.setFontSize(10); ink(pdf, C.dark)
      pdf.text(
        `${(td.city as string)||'Casablanca'}, le ${(td.date as string)||''}`,
        pw - mr, DATE_Y_FIXED, {align:'right'}
      )

      stroke(pdf, C.lgray); pdf.setLineWidth(0.5)
      pdf.rect(BX, SIG_Y_FIXED, BW, BH, 'D')

      pdf.setFont('helvetica','bold'); pdf.setFontSize(9); ink(pdf, C.navy)
      pdf.text(s.title || 'Signature', BX + BW/2, SIG_Y_FIXED + 7, {align:'center'})
      stroke(pdf, C.lgray); pdf.setLineWidth(0.3)
      pdf.line(BX + 3, SIG_Y_FIXED + 10, BX + BW - 3, SIG_Y_FIXED + 10)

      if (s.name) {
        pdf.setFont('helvetica','normal'); pdf.setFontSize(9); ink(pdf, C.dark)
        pdf.text(s.name, BX + BW/2, SIG_Y_FIXED + 16, {align:'center'})
      }
      if (s.label) {
        pdf.setFont('helvetica','italic'); pdf.setFontSize(7.5); ink(pdf, C.gray)
        pdf.text(s.label, BX + BW/2, SIG_Y_FIXED + 34, {align:'center'})
      }
      stroke(pdf, C.lgray); pdf.setLineWidth(0.5)
      pdf.line(BX + 4, SIG_Y_FIXED + 42, BX + BW - 4, SIG_Y_FIXED + 42)
    }
  }

  // ── Decorate all pages ────────────────────────────────────────────────────
  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) drawDecor(i, total)

  const fn = `${(title||'document').replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`
  if (opts.print) {
    pdf.autoPrint()
    const blob = pdf.output('blob')
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (win) win.onload = () => setTimeout(() => URL.revokeObjectURL(url), 10000)
  } else {
    pdf.save(fn)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYSLIP PDF  —  Bulletin de Paie
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePayslipPDF(payslip: Record<string,unknown>, company: Record<string,unknown>): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ format: 'a4', unit: 'mm' })

  const logoDataUrl = await loadImage(company.logo_path as string)

  // ── Navy header banner ────────────────────────────────────────────────────
  const BH = 42
  fill(pdf, C.navy); pdf.rect(0, 0, PW, BH, 'F')

  // Logo
  if (logoDataUrl) {
    try { pdf.addImage(logoDataUrl, 'AUTO', ML, 6, 28, 14, undefined, 'FAST') }
    catch {/* skip */}
  }

  // Company info (left of banner)
  const TX = logoDataUrl ? ML + 32 : ML
  ink(pdf, C.white)
  const customHdr = (company.doc_header_text as string) || null
  if (customHdr) {
    customHdr.split('\n').forEach((line, i) => {
      if (i===0) { pdf.setFont('helvetica','bold'); pdf.setFontSize(12) }
      else       { pdf.setFont('helvetica','normal'); pdf.setFontSize(8)  }
      pdf.text(line, TX, 12 + i*5)
    })
  } else {
    pdf.setFont('helvetica','bold'); pdf.setFontSize(12)
    pdf.text((company.name as string)||'INFINITAS', TX, 13)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8)
    if (company.address) pdf.text(company.address as string, TX, 19)
    const leg = [
      company.rc            ? `RC: ${company.rc}`            : '',
      company.if_fiscal     ? `IF: ${company.if_fiscal}`      : '',
      company.cnss_employer ? `CNSS: ${company.cnss_employer}`: '',
      company.ice           ? `ICE: ${company.ice}`           : '',
    ].filter(Boolean).join('  ·  ')
    if (leg) pdf.text(leg, TX, 25)
  }

  // "BULLETIN DE PAIE" centered in banner
  const cx = PW/2 + (TX > ML ? 10 : 0)
  pdf.setFont('helvetica','bold'); pdf.setFontSize(14); ink(pdf, C.white)
  pdf.text('BULLETIN DE PAIE', cx, 14, {align:'center'})
  stroke(pdf, [255,255,255] as const); pdf.setLineWidth(0.4)
  pdf.line(cx-34, 17, cx+34, 17)
  pdf.setFont('helvetica','normal'); pdf.setFontSize(10)
  pdf.text(`Période : ${month(payslip.period_month as number)} ${payslip.period_year}`, cx, 23, {align:'center'})
  pdf.setFontSize(8)
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, cx, 30, {align:'center'})

  let y = BH + 5

  // ── Employee box ──────────────────────────────────────────────────────────
  const EH = 34
  fill(pdf, C.bgemp); stroke(pdf, C.lgray); pdf.setLineWidth(0.4)
  pdf.roundedRect(ML, y, CW, EH, 2, 2, 'FD')
  fill(pdf, C.navy); pdf.rect(ML, y, 3, EH, 'F')  // navy accent bar

  const ex = ML + 7
  y += 6
  pdf.setFont('helvetica','bold'); pdf.setFontSize(12); ink(pdf, C.dark)
  pdf.text(String(payslip.employee_name||''), ex, y); y += 6

  pdf.setFontSize(8.5); ink(pdf, C.gray)
  const c2 = ex + 58, c3 = ex + 120
  const row = (label: string, val: string, x: number, lw: number) => {
    pdf.setFont('helvetica','bold'); ink(pdf, C.gray); pdf.text(label, x, y)
    pdf.setFont('helvetica','normal'); ink(pdf, C.dark)
    pdf.text(val||'—', x + lw, y)
  }
  row('Code :',  String(payslip.employee_code||''), ex, 13)
  row('CIN :',   String(payslip.cin||''),           c2, 10)
  row('CNSS :',  String(payslip.cnss_number||''),   c3, 14)
  y += 5
  row('Poste :', String(payslip.position_title||payslip.position||''), ex, 14)
  row('Dépt :',  String(payslip.department||''),     c2, 12)
  y += 5
  row('Banque :', String(payslip.bank_name||''),     ex, 16)
  row('Compte :', String(payslip.bank_account||''),  c2, 16)
  y += 12

  // ── Salary table: Rubrique | Base | Taux | Gains | Retenues ───────────────
  const RH = 6.2
  const colBase = ML + 92, colRate = ML + 118, colGain = ML + 150, colDed = PW - MR - 2
  const { lines, net, info } = payslipLines(payslip)

  fill(pdf, C.navy); pdf.rect(ML, y, CW, RH + 1, 'F')
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); ink(pdf, C.white)
  pdf.text('RUBRIQUE', ML + 3, y + 4.6)
  pdf.text('BASE', colBase, y + 4.6, {align:'right'})
  pdf.text('TAUX', colRate, y + 4.6, {align:'right'})
  pdf.text('GAINS', colGain, y + 4.6, {align:'right'})
  pdf.text('RETENUES', colDed, y + 4.6, {align:'right'})
  y += RH + 1

  lines.forEach((r, i) => {
    const subtotal = r.kind === 'subtotal'
    fill(pdf, subtotal ? C.totoal : i % 2 === 0 ? C.white : C.bgrow); pdf.rect(ML, y, CW, RH, 'F')
    pdf.setFont('helvetica', subtotal ? 'bold' : 'normal'); pdf.setFontSize(8.2); ink(pdf, C.dark)
    pdf.text(r.label, ML + 3, y + 4.3)
    ink(pdf, C.gray)
    if (r.base) pdf.text(r.base, colBase, y + 4.3, {align:'right'})
    if (r.rate) pdf.text(r.rate, colRate, y + 4.3, {align:'right'})
    if (r.gain !== undefined) { ink(pdf, subtotal ? C.navy : C.dark); pdf.text(fmt(r.gain), colGain, y + 4.3, {align:'right'}) }
    if (r.deduction !== undefined) { ink(pdf, C.red); pdf.text(fmt(r.deduction), colDed, y + 4.3, {align:'right'}) }
    stroke(pdf, C.lgray); pdf.setLineWidth(0.15); pdf.line(ML, y + RH, PW - MR, y + RH)
    y += RH
  })

  // Net salary bar
  y += 3
  fill(pdf, C.green); pdf.roundedRect(ML, y, CW, 11, 2, 2, 'F')
  pdf.setFont('helvetica','bold'); pdf.setFontSize(11); ink(pdf, C.white)
  pdf.text('SALAIRE NET À PAYER', ML + 5, y + 7.3)
  pdf.setFontSize(12)
  pdf.text(`${fmt(net)} MAD`, PW - MR - 3, y + 7.3, {align:'right'})
  y += 15

  // Tax and attendance figures
  const cW2 = (CW - (info.length - 1) * 3) / info.length
  info.forEach((item, i) => {
    const cx2 = ML + i * (cW2 + 3)
    pdf.setFillColor(248,248,250); stroke(pdf, C.lgray); pdf.setLineWidth(0.3)
    pdf.roundedRect(cx2, y, cW2, 11, 1.5, 1.5, 'FD')
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); ink(pdf, C.navy)
    pdf.text(item.value, cx2 + cW2 / 2, y + 5, {align:'center'})
    pdf.setFont('helvetica','normal'); pdf.setFontSize(6); ink(pdf, C.gray)
    pdf.text(item.label, cx2 + cW2 / 2, y + 9, {align:'center', maxWidth: cW2 - 2})
  })
  y += 16

  // Signature
  const gName  = (company.gerant_name  as string)||''
  const gTitle = (company.gerant_title as string)||'Le Directeur Général'
  const sColW  = (CW-8)/2
  const sBH    = 38

  stroke(pdf, C.lgray); pdf.setLineWidth(0.5)
  pdf.rect(ML, y, sColW, sBH, 'D')
  pdf.rect(ML+sColW+8, y, sColW, sBH, 'D')

  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); ink(pdf, C.navy)
  pdf.text(gTitle,                       ML+sColW/2,        y+7, {align:'center'})
  pdf.text("Signature de l'employé(e)",  ML+sColW+8+sColW/2, y+7, {align:'center'})
  stroke(pdf, C.lgray); pdf.setLineWidth(0.3)
  pdf.line(ML+3, y+10, ML+sColW-3, y+10)
  pdf.line(ML+sColW+11, y+10, ML+sColW+8+sColW-3, y+10)

  y += 11
  if (gName) { pdf.setFont('helvetica','normal'); pdf.setFontSize(9); ink(pdf, C.dark); pdf.text(gName, ML+4, y) }
  pdf.setFont('helvetica','italic'); pdf.setFontSize(7.5); ink(pdf, C.gray)
  pdf.text('Signature et cachet',    ML+4,        y+20)
  pdf.text('Lu et approuvé',         ML+sColW+12, y+20)
  stroke(pdf, [170,170,170] as const); pdf.setLineWidth(0.5)
  pdf.line(ML+4,        y+25, ML+sColW-4,           y+25)
  pdf.line(ML+sColW+12, y+25, ML+sColW+8+sColW-4,   y+25)

  // Footer
  const ftr = (company.doc_footer_text as string) ||
    `${(company.name as string)||'CREHER HRM'} — Bulletin de paie confidentiel — Exercice ${payslip.period_year}`
  stroke(pdf, C.lgray); pdf.setLineWidth(0.4)
  pdf.line(ML, FOOTER_Y, PW-MR, FOOTER_Y)
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7); ink(pdf, C.gray)
  const fl = pdf.splitTextToSize(ftr, CW-10)
  fl.forEach((l: string, i: number) => pdf.text(l, PW/2, FOOTER_Y+4+i*3.5, {align:'center'}))

  pdf.save(`bulletin_paie_${payslip.employee_code}_${payslip.period_month}_${payslip.period_year}.pdf`)
}
