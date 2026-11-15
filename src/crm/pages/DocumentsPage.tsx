import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, UserCheck, AlertTriangle, Mail, UserX,
  Star, Briefcase, DollarSign, Award,
  Megaphone, ChevronRight, Download, Printer,
  Plus, Trash2, RefreshCw, Search, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { documentsService } from '../services/documents.service'
import { generateDocumentPDF } from '../lib/pdfGenerator'
import { grossToNet } from '../lib/payrollUtils'
import { settingsService } from '../services/settings.service'
import api from '../lib/axios'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Document types config ────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { value: 'ATTESTATION_TRAVAIL',  label: 'Attestation de Travail',          icon: UserCheck,     color: 'green'   },
  { value: 'ATTESTATION_SALAIRE',  label: 'Attestation de Salaire',          icon: DollarSign,    color: 'emerald' },
  { value: 'CERTIFICAT_TRAVAIL',   label: 'Certificat de Travail',           icon: Award,         color: 'teal'    },
  { value: 'NOTIFICATION_ABSENCE', label: "Notification Absence / Retard",   icon: Clock,         color: 'amber'   },
  { value: 'PROMESSE_EMBAUCHE',    label: "Promesse d'Embauche",             icon: Star,          color: 'violet'  },
  { value: 'RENOUVELLEMENT_ESSAI', label: "Renouvellement Période d'Essai",  icon: RefreshCw,     color: 'orange'  },
  { value: 'NOTE_SERVICE',         label: 'Note de Service',                 icon: Megaphone,     color: 'slate'   },
  { value: 'CONTRAT_CDI',          label: 'Contrat de Travail CDI',          icon: Briefcase,     color: 'blue'    },
  { value: 'CONTRAT_CDD',          label: 'Contrat de Travail CDD',          icon: Briefcase,     color: 'indigo'  },
  { value: 'AVERTISSEMENT',        label: 'Avertissement Disciplinaire',     icon: AlertTriangle, color: 'orange'  },
  { value: 'MISE_EN_DEMEURE',      label: 'Mise en Demeure',                 icon: Mail,          color: 'red'     },
  { value: 'LETTRE_LICENCIEMENT',  label: 'Lettre de Licenciement',          icon: UserX,         color: 'red'     },
] as const

type DocumentType = typeof DOCUMENT_TYPES[number]['value']

// Documents that need manual input — no auto-fill
const MANUAL_DOCS = new Set(['CONTRAT_CDI','CONTRAT_CDD','AVERTISSEMENT','MISE_EN_DEMEURE','LETTRE_LICENCIEMENT'])

const TYPE_LABELS: Record<string, string> = {
  CONTRAT_CDI:          'Contrat CDI',
  CONTRAT_CDD:          'Contrat CDD',
  PROMESSE_EMBAUCHE:    "Promesse d'Embauche",
  RENOUVELLEMENT_ESSAI: 'Renouvellement Essai',
  AVERTISSEMENT:        'Avertissement',
  MISE_EN_DEMEURE:      'Mise en Demeure',
  LETTRE_LICENCIEMENT:  'Licenciement',
  ATTESTATION_TRAVAIL:  'Attestation Travail',
  ATTESTATION_SALAIRE:  'Attestation Salaire',
  CERTIFICAT_TRAVAIL:   'Certificat Travail',
  NOTE_SERVICE:         'Note de Service',
  NOTIFICATION_ABSENCE: 'Notification Absence/Retard',
}

// ─── Extra fields per document type ──────────────────────────────────────────

function ExtraFields({
  type,
  params,
  onChange,
}: {
  type: DocumentType
  params: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  const field = (key: string, label: string, fieldType = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {fieldType === 'textarea' ? (
        <textarea
          value={params[key] || ''}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      ) : (
        <input
          type={fieldType}
          value={params[key] || ''}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      )}
    </div>
  )

  const fields: Record<DocumentType, JSX.Element[]> = {
    CONTRAT_CDI: [
      field('start_date',       "Date d'embauche / prise d'effet",  'date'),
      field('trial_months',     "Durée période d'essai (mois)",     'number', 'ex: 3'),
      field('salary_net',       'Salaire net mensuel (MAD)',        'number', 'ex: 10000'),
      field('salary_net_words', 'Salaire net en lettres',           'text',   'ex: Dix mille dirhams'),
      field('responsibilities', 'Missions/fonctions (1 par ligne)', 'textarea', 'ex: Gestion administrative\nRecrutement\nSupervision de la paie'),
    ],
    CONTRAT_CDD: [
      field('start_date', 'Date début', 'date'),
      field('end_date',   'Date fin',   'date'),
      field('reason',     'Motif du CDD', 'text', "ex: Remplacement, surcroît d'activité"),
    ],
    PROMESSE_EMBAUCHE: [
      field('start_date',   "Date d'entrée en poste",  'date'),
      field('salary',       'Salaire net mensuel (MAD)', 'number', 'ex: 6000'),
      field('salary_words', 'Salaire en lettres',        'text',   'ex: Six mille dirhams'),
    ],
    RENOUVELLEMENT_ESSAI: [
      field('renewal_days', 'Durée du renouvellement (jours)', 'number'),
      field('new_end_date', 'Nouvelle date de fin',            'date'),
    ],
    AVERTISSEMENT: [
      field('reason', 'Faits reprochés', 'textarea', 'Décrivez les manquements constatés...'),
    ],
    MISE_EN_DEMEURE: [
      field('reason',      'Faits reprochés',                      'textarea'),
      field('demand',      'Mise en demeure de',                   'textarea', 'ex: reprendre votre poste immédiatement'),
      field('delay_days',  'Délai de réponse (heures)',            'number'),
    ],
    LETTRE_LICENCIEMENT: [
      field('reason',       'Motifs du licenciement',                        'textarea'),
      field('hearing_date', "Date d'effet / entretien préalable",            'date'),
      field('notice_days',  'Préavis (jours)',                               'number'),
    ],
    ATTESTATION_TRAVAIL: [],
    ATTESTATION_SALAIRE: [
      field('net_salary',   'Salaire net mensuel (MAD)', 'number', 'ex: 10000'),
      field('salary_words', 'Salaire en lettres',        'text',   'ex: Dix mille dirhams'),
    ],
    CERTIFICAT_TRAVAIL: [
      field('end_date', 'Date de fin de contrat', 'date'),
      field('reason',   'Motif de départ',        'text', 'ex: démission, fin de contrat, rupture conventionnelle'),
    ],
    NOTE_SERVICE: [
      field('note_number', 'Numéro de note',  'text', 'ex: NS-2026-001'),
      field('recipients',  'Destinataires',   'text', 'ex: Tout le personnel'),
      field('subject',     'Objet',           'text'),
      field('content',     'Contenu',         'textarea'),
    ],
    NOTIFICATION_ABSENCE: [
      <div key="absence_type">
        <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
        <select
          value={params['absence_type'] || 'absence'}
          onChange={e => onChange('absence_type', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="absence">Absence</option>
          <option value="retard">Retard</option>
        </select>
      </div>,
      field('absence_date', 'Date de l\'absence / retard', 'date'),
      field('duration',     'Durée (ex: 2h, toute la journée)', 'text'),
      field('reason',       'Motif déclaré (optionnel)',         'text', 'Laisser vide si non justifié'),
    ],
  }

  if (type === 'LETTRE_LICENCIEMENT') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type de licenciement</label>
          <select
            value={params['type'] || 'faute_grave'}
            onChange={e => onChange('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="faute_grave">Faute grave</option>
            <option value="economique">Motif économique</option>
          </select>
        </div>
        {fields[type].map((el, i) => <div key={i}>{el}</div>)}
      </div>
    )
  }

  return <div className="space-y-3">{(fields[type] || []).map((el, i) => <div key={i}>{el}</div>)}</div>
}

// ─── Document preview component ───────────────────────────────────────────────

function DocumentPreview({ doc, logoPath, docHeaderText, docFooterText }: {
  doc: any
  logoPath?: string | null
  docHeaderText?: string | null
  docFooterText?: string | null
}) {
  const td      = doc.template_data
  const company = td?.header

  const RichText = ({ text }: { text: string }) => {
    if (!text) return null
    return (
      <>
        {text.split('\n').map((line, li, arr) => (
          <span key={li}>
            {line.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                : <span key={i}>{part}</span>
            )}
            {li < arr.length - 1 && <br />}
          </span>
        ))}
      </>
    )
  }

  return (
    // A4 simulation: white card, fixed width proportion, print-ready
    <div
      className="bg-white shadow-lg font-sans text-[11px] leading-[1.55] print:shadow-none"
      style={{ width: '100%', minHeight: '297mm', fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* ── HEADER ── */}
      <div className="px-8 pt-6 pb-0">
        <div className="flex items-start gap-4">
          {/* Logo */}
          {logoPath ? (
            <img src={logoPath} alt="Logo" className="h-12 w-auto object-contain flex-shrink-0" />
          ) : (
            <div className="flex-shrink-0 w-12 h-12 rounded bg-purple-700 flex items-center justify-center">
              <span className="text-white font-black text-[8px] text-center leading-tight">LOGO</span>
            </div>
          )}

          {/* Company info */}
          <div className="flex-1 min-w-0">
            {docHeaderText ? (
              <div className="text-[10px]">
                {docHeaderText.split('\n').map((line, i) => (
                  <p key={i} className={i === 0 ? 'font-bold text-[12px] text-gray-900' : 'text-gray-500'}>{line}</p>
                ))}
              </div>
            ) : (
              <>
                <p className="font-bold text-[12px] text-gray-900">{company?.name || 'VOTRE SOCIÉTÉ'}</p>
                {company?.address && <p className="text-gray-500 text-[9px] mt-0.5">{company.address}</p>}
                <div className="flex flex-wrap gap-x-3 mt-0.5 text-[8.5px] text-gray-400">
                  {company?.rc            && <span>RC: {company.rc}</span>}
                  {company?.if_fiscal     && <span>IF: {company.if_fiscal}</span>}
                  {company?.cnss_employer && <span>CNSS: {company.cnss_employer}</span>}
                  {company?.ice           && <span>ICE: {company.ice}</span>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Header separator */}
        <div className="mt-3 border-t border-[#16305c]" />
        <div className="border-t border-gray-200 mt-[1px] mb-0" />
      </div>

      {/* ── CONTENT ── */}
      <div className="px-8 py-4">

        {/* City + Date */}
        <p className="text-right text-[9.5px] text-gray-500 mb-5">
          {td?.city || 'Casablanca'}, le {td?.date || ''}
        </p>

        {/* Title */}
        {td?.title && (
          <div className="text-center mb-2">
            <h1 className="inline text-[14px] font-bold text-gray-900 uppercase tracking-wider underline underline-offset-4">
              {td.title}
            </h1>
          </div>
        )}
        {td?.subtitle && (
          <p className="text-center text-[9px] text-gray-400 italic mb-4">{td.subtitle}</p>
        )}

        <div className="mb-5" />

        {/* Meta block */}
        {td?.meta && Object.keys(td.meta).length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3 mb-5 space-y-1">
            {Object.entries(td.meta as Record<string, string>).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[10px]">
                <span className="font-bold text-gray-700 w-24 flex-shrink-0">{k} :</span>
                <span className="text-gray-600">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body paragraphs */}
        <div className="space-y-2.5 mb-5 text-gray-800 text-[10.5px]">
          {(td?.body || []).map((item: { text: string }, i: number) => (
            item.text
              ? <p key={i} className="text-justify leading-relaxed"><RichText text={item.text} /></p>
              : <div key={i} className="h-2" />
          ))}
        </div>

        {/* Articles */}
        {(td?.articles || []).length > 0 && (
          <div className="space-y-4 mb-6">
            {(td.articles as Array<{ num: string; text: string; bullets?: string[]; textAfter?: string }>).map((art, i) => (
              <div key={i}>
                <div className="border-t border-gray-200 pt-3 mb-2" />
                {/* Article heading — purple pill */}
                <span className="inline-block text-[9px] font-bold uppercase text-[#16305c] underline underline-offset-2 mb-2">
                  {art.num}
                </span>
                {/* Text */}
                <div className="text-[10.5px] text-gray-800 space-y-1 pl-1">
                  {art.text && art.text.split('\n').map((para, pi) => (
                    para.trim()
                      ? <p key={pi} className="text-justify leading-relaxed"><RichText text={para} /></p>
                      : <div key={pi} className="h-1" />
                  ))}
                </div>
                {/* Bullets */}
                {art.bullets && art.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-2">
                    {art.bullets.map((b, bi) => (
                      <li key={bi} className="flex gap-2 text-[10.5px] text-gray-800">
                        <span className="text-gray-600 flex-shrink-0 text-[8px] mt-1">●</span>
                        <span><RichText text={b} /></span>
                      </li>
                    ))}
                  </ul>
                )}
                {art.textAfter && (
                  <p className="mt-2 text-justify text-[10.5px] text-gray-800 pl-1"><RichText text={art.textAfter} /></p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signature block */}
        {td?.signature && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            {(td.signature as any).employer && (td.signature as any).employee ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Employer */}
                <div className="border border-gray-300 min-h-[130px] flex flex-col">
                  <div className="px-3 pt-2 pb-1 border-b border-gray-200">
                    <p className="text-[9px] font-bold text-[#16305c]">{(td.signature as any).employer.title}</p>
                  </div>
                  <div className="px-3 py-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] text-gray-700 font-medium whitespace-pre-line">
                        {(td.signature as any).employer.name}
                      </p>
                      {(td.signature as any).employer.label && (
                        <p className="text-[8px] text-gray-400 italic mt-1">{(td.signature as any).employer.label}</p>
                      )}
                    </div>
                    <div className="mt-6 border-t border-gray-300 pt-1">
                      <p className="text-[7.5px] text-gray-400">Signature et cachet</p>
                    </div>
                  </div>
                </div>
                {/* Employee */}
                <div className="border border-gray-300 min-h-[130px] flex flex-col">
                  <div className="px-3 pt-2 pb-1 border-b border-gray-200">
                    <p className="text-[9px] font-bold text-[#16305c]">{(td.signature as any).employee.title}</p>
                  </div>
                  <div className="px-3 py-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] text-gray-700">{(td.signature as any).employee.name || ''}</p>
                      {(td.signature as any).employee.label && (
                        <p className="text-[8px] text-gray-400 italic mt-1">{(td.signature as any).employee.label}</p>
                      )}
                    </div>
                    <div className="mt-6 border-t border-gray-300 pt-1">
                      <p className="text-[7.5px] text-gray-400">Lu et approuvé</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="w-60 border border-gray-300 min-h-[130px] flex flex-col">
                  <div className="px-3 pt-2 pb-1 border-b border-gray-200">
                    <p className="text-[9px] font-bold text-[#16305c] text-center">{(td.signature as any).title || 'Signature'}</p>
                  </div>
                  <div className="px-3 py-3 flex-1 flex flex-col justify-between text-center">
                    <div>
                      {(td.signature as any).name && (
                        <p className="text-[9px] text-gray-700">{(td.signature as any).name}</p>
                      )}
                    </div>
                    <div className="mt-6 border-t border-gray-300 pt-1">
                      <p className="text-[7.5px] text-gray-400">{(td.signature as any).label || 'Signature et cachet'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="px-8 mt-auto pt-4">
        <div className="border-t-[1.5px] border-purple-700 pt-2 pb-4">
          <p className="text-center text-[7px] text-gray-400">
            {docFooterText || td?.legal || `Document généré par INFINITAS HRM — ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Recent documents component ───────────────────────────────────────────────

function RecentDocuments() {
  const queryClient = useQueryClient()

  const { data: docsResult } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getDocuments({ limit: 10 }),
  })
  const docs = (docsResult as any)?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsService.deleteDocument(id),
    onSuccess: () => {
      toast.success('Document supprimé')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  if (!docs || docs.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Documents Récents</h3>
      <div className="space-y-2">
        {docs.map((doc: any) => (
          <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {TYPE_LABELS[doc.document_type] || doc.document_type}
              </p>
              <p className="text-xs text-gray-500">
                {doc.employee_name || 'Général'} —{' '}
                {doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                  : ''}
              </p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(doc.id)}
              disabled={deleteMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const queryClient = useQueryClient()

  const [selectedType,          setSelectedType]          = useState<DocumentType | null>(null)
  const [employeeSearch,        setEmployeeSearch]        = useState('')
  const [selectedEmployee,      setSelectedEmployee]      = useState<any>(null)
  const [showEmployeeDropdown,  setShowEmployeeDropdown]  = useState(false)
  const [formParams,            setFormParams]            = useState<Record<string, string>>({})
  const [generatedDoc,          setGeneratedDoc]          = useState<any>(null)
  const [isGenerating,          setIsGenerating]          = useState(false)

  const { data: companySettings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  })

  // Employee autocomplete
  const { data: employeesResult } = useQuery({
    queryKey: ['employees-search', employeeSearch],
    queryFn: () =>
      api
        .get('/employees', { params: { search: employeeSearch, status: 'ACTIF', limit: 10 } })
        .then(r => r.data.data),
    enabled: employeeSearch.length >= 2,
  })
  const employees = (employeesResult as any)?.data ?? (Array.isArray(employeesResult) ? employeesResult : [])

  // Generate handler
  const handleGenerate = async () => {
    if (!selectedType) {
      toast.error('Sélectionnez un type de document')
      return
    }
    const needsEmployee = selectedType !== 'NOTE_SERVICE'
    if (needsEmployee && !selectedEmployee) {
      toast.error('Sélectionnez un employé')
      return
    }

    setIsGenerating(true)
    try {
      const result = await documentsService.generateDocument({
        employee_id: selectedEmployee?.id,
        document_type: selectedType,
        params: {
          ...formParams,
          ...(formParams.salary        ? { salary:        parseFloat(formParams.salary)        } : {}),
          ...(formParams.salary_net    ? { salary_net:    parseFloat(formParams.salary_net)    } : {}),
          ...(formParams.net_salary    ? { net_salary:    parseFloat(formParams.net_salary)    } : {}),
          ...(formParams.trial_months  ? { trial_months:  parseInt(formParams.trial_months)    } : {}),
          ...(formParams.renewal_days  ? { renewal_days:  parseInt(formParams.renewal_days)    } : {}),
          ...(formParams.delay_days    ? { delay_days:    parseInt(formParams.delay_days)      } : {}),
          ...(formParams.notice_days   ? { notice_days:   parseInt(formParams.notice_days)     } : {}),
        },
      })
      setGeneratedDoc(result)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document généré avec succès')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de la génération')
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-fill form fields from employee data when employee is selected
  useEffect(() => {
    if (!selectedEmployee || !selectedType || MANUAL_DOCS.has(selectedType)) return
    const emp = selectedEmployee
    const autofill: Record<string, string> = {}
    if (selectedType === 'ATTESTATION_SALAIRE') {
      if (emp.base_salary) autofill['net_salary'] = String(Math.round(grossToNet(emp.base_salary)))
    }
    if (selectedType === 'CERTIFICAT_TRAVAIL') {
      if (emp.contract_end_date) autofill['end_date'] = emp.contract_end_date.slice(0, 10)
    }
    if (selectedType === 'RENOUVELLEMENT_ESSAI') {
      if (emp.trial_period_end_date) autofill['new_end_date'] = emp.trial_period_end_date.slice(0, 10)
    }
    if (selectedType === 'NOTIFICATION_ABSENCE') {
      autofill['absence_date'] = new Date().toISOString().slice(0, 10)
    }
    if (Object.keys(autofill).length > 0) {
      setFormParams(prev => ({ ...autofill, ...prev }))
    }
  }, [selectedEmployee, selectedType])

  const handleSelectType = (type: DocumentType) => {
    setSelectedType(type)
    setGeneratedDoc(null)
    setFormParams({})
    setSelectedEmployee(null)
    setEmployeeSearch('')
  }

  const handleClearDoc = () => {
    setGeneratedDoc(null)
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Générateur de Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Créez et gérez tous les documents RH — les informations employé sont pré-remplies automatiquement
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 min-h-[700px]">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="w-96 flex-shrink-0 space-y-4 overflow-y-auto">

          {/* Document type selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Type de Document</h3>
            <div className="grid grid-cols-1 gap-2">
              {DOCUMENT_TYPES.map(dt => {
                const Icon       = dt.icon
                const isSelected = selectedType === dt.value
                return (
                  <button
                    key={dt.value}
                    onClick={() => handleSelectType(dt.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{dt.label}</span>
                    {isSelected && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Params panel – visible when a type is selected */}
          {selectedType && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Paramètres</h3>

              {/* Employee autocomplete (not for NOTE_SERVICE) */}
              {selectedType !== 'NOTE_SERVICE' && (
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Employé *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={
                        selectedEmployee
                          ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                          : employeeSearch
                      }
                      onChange={e => {
                        setEmployeeSearch(e.target.value)
                        setSelectedEmployee(null)
                        setShowEmployeeDropdown(true)
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 150)}
                      placeholder="Rechercher un employé..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {showEmployeeDropdown && employees.length > 0 && !selectedEmployee && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {employees.map((emp: any) => (
                        <button
                          key={emp.id}
                          onMouseDown={() => {
                            setSelectedEmployee(emp)
                            setShowEmployeeDropdown(false)
                            setEmployeeSearch('')
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                          <span className="text-gray-400 text-xs ml-2">
                            {emp.employee_code} — {emp.department_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedEmployee && (
                    <div className="mt-1 flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                      <UserCheck className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {selectedEmployee.first_name} {selectedEmployee.last_name} — {selectedEmployee.position_title}
                      </span>
                      <button
                        onClick={() => setSelectedEmployee(null)}
                        className="ml-auto text-indigo-400 hover:text-indigo-600 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic extra fields */}
              <ExtraFields
                type={selectedType}
                params={formParams}
                onChange={(key, val) => setFormParams(prev => ({ ...prev, [key]: val }))}
              />

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Générer le Document
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {generatedDoc ? (
            <>
              {/* Action bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => generateDocumentPDF({
                    ...generatedDoc.template_data,
                    doc_type: generatedDoc.document_type,
                    logo_path: companySettings?.logo_path,
                    doc_header_text: companySettings?.doc_header_text,
                    doc_footer_text: companySettings?.doc_footer_text,
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => generateDocumentPDF({
                    ...generatedDoc.template_data,
                    doc_type: generatedDoc.document_type,
                    logo_path: companySettings?.logo_path,
                    doc_header_text: companySettings?.doc_header_text,
                    doc_footer_text: companySettings?.doc_footer_text,
                  }, { print: true })}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </button>
                <button
                  onClick={handleClearDoc}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors ml-auto"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau Document
                </button>
              </div>

              {/* Document preview */}
              <DocumentPreview
                doc={generatedDoc}
                logoPath={companySettings?.logo_path}
                docHeaderText={companySettings?.doc_header_text}
                docFooterText={companySettings?.doc_footer_text}
              />
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 h-80 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <FileText className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Sélectionnez un type de document</p>
                <p className="text-xs mt-1">et renseignez les paramètres pour générer</p>
              </div>
            </div>
          )}

          {/* Recent documents */}
          <RecentDocuments />
        </div>
      </div>
    </div>
  )
}
