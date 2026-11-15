import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Building2, Settings, Shield, Save, Upload, FileText, Layers, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsService } from '../services/settings.service'
import { authService } from '../services/auth.service'
import { employeesService } from '../services/employees.service'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/Badge'
import { formatDate } from '../lib/utils'
import type { CompanySettings, User, Department, Position } from '../types'

type TabId = 'entreprise' | 'documents' | 'config_rh' | 'departements' | 'utilisateurs'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'entreprise', label: 'Entreprise', icon: <Building2 className="h-4 w-4" /> },
  { id: 'documents', label: 'Documents & PDF', icon: <FileText className="h-4 w-4" /> },
  { id: 'config_rh', label: 'Configuration RH', icon: <Settings className="h-4 w-4" /> },
  { id: 'departements', label: 'Départements & Postes', icon: <Layers className="h-4 w-4" /> },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: <Shield className="h-4 w-4" /> },
]

export function ParametresPage() {
  const [activeTab, setActiveTab] = useState<TabId>('entreprise')
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authService.getUsers,
    enabled: activeTab === 'utilisateurs',
  })

  const updateSettingsMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      toast.success('Paramètres mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const uploadLogoMutation = useMutation({
    mutationFn: settingsService.uploadLogo,
    onSuccess: () => {
      toast.success('Logo mis à jour')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => toast.error('Erreur lors du téléversement du logo'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez votre système INFINITAS HRM</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'entreprise' && settings && (
        <CompanyForm
          settings={settings}
          onSave={(data) => updateSettingsMutation.mutate(data)}
          saving={updateSettingsMutation.isPending}
          onLogoUpload={(file) => uploadLogoMutation.mutate(file)}
          uploadingLogo={uploadLogoMutation.isPending}
        />
      )}

      {activeTab === 'documents' && settings && (
        <DocumentsForm settings={settings} onSave={(data) => updateSettingsMutation.mutate(data)} saving={updateSettingsMutation.isPending} />
      )}

      {activeTab === 'config_rh' && settings && (
        <HRConfigForm settings={settings} onSave={(data) => updateSettingsMutation.mutate(data)} saving={updateSettingsMutation.isPending} />
      )}

      {activeTab === 'departements' && (
        <DepartementsPostesTab />
      )}

      {activeTab === 'utilisateurs' && (
        <UsersTab users={users as User[]} />
      )}
    </div>
  )
}

function CompanyForm({
  settings,
  onSave,
  saving,
  onLogoUpload,
  uploadingLogo,
}: {
  settings: CompanySettings
  onSave: (data: Partial<CompanySettings>) => void
  saving: boolean
  onLogoUpload: (file: File) => void
  uploadingLogo: boolean
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: settings.name,
      address: settings.address || '',
      city: settings.city || '',
      phone: settings.phone || '',
      email: settings.email || '',
      ice: settings.ice || '',
      rc: settings.rc || '',
      if_fiscal: settings.if_fiscal || '',
      forme_juridique: settings.forme_juridique || '',
      cnss_employer: settings.cnss_employer || '',
      capital: settings.capital || '',
      gerant_name: settings.gerant_name || '',
      gerant_title: settings.gerant_title || 'Directeur Général',
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(settings.logo_path)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Show local preview immediately
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onLogoUpload(file)
  }

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Informations de l'Entreprise</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Nom de l'entreprise" required {...register('name')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Adresse" {...register('address')} />
              <Input label="Ville" {...register('city')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Téléphone" {...register('phone')} />
              <Input label="Email" type="email" {...register('email')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="ICE" placeholder="Identifiant Commun de l'Entreprise" {...register('ice')} />
              <Input label="RC" placeholder="Registre de Commerce" {...register('rc')} />
              <Input label="IF Fiscal" placeholder="Identifiant Fiscal" {...register('if_fiscal')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="N° CNSS Employeur" {...register('cnss_employer')} />
              <Input label="Forme Juridique" placeholder="ex: SARL, SA..." {...register('forme_juridique')} />
              <Input label="Capital Social" placeholder="ex: 1 000 000 MAD" {...register('capital')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Gérant / DG" placeholder="Nom complet du signataire" {...register('gerant_name')} />
              <Input label="Titre du Gérant" placeholder="ex: Directeur Général" {...register('gerant_title')} />
            </div>
          </CardBody>
        </Card>

        {/* Logo upload */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Logo de l'Entreprise</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-6">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Logo"
                    className="h-16 w-auto object-contain border border-gray-200 rounded-lg p-2 bg-white"
                  />
                </div>
              ) : (
                <div className="h-16 w-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-xs text-center">
                  Aucun logo
                </div>
              )}
              <div className="space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {uploadingLogo ? (
                    <span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {previewUrl ? 'Changer le logo' : 'Téléverser un logo'}
                </button>
                <p className="text-xs text-gray-400">PNG, JPG, SVG — max 2 Mo. Sera utilisé sur tous les PDFs.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end mt-4">
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

function DocumentsForm({
  settings,
  onSave,
  saving,
}: {
  settings: CompanySettings
  onSave: (data: Partial<CompanySettings>) => void
  saving: boolean
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      doc_header_text: settings.doc_header_text || '',
      doc_footer_text: settings.doc_footer_text || '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">En-tête des Documents PDF</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte d'en-tête</label>
              <textarea
                {...register('doc_header_text')}
                rows={3}
                placeholder={`Ex: ${settings.name || 'VOTRE SOCIÉTÉ'}\n${settings.address || 'Adresse'} — Tél: ${settings.phone || ''}\nRC: ${settings.rc || ''} | ICE: ${settings.ice || ''}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Affiché en haut de chaque document généré. Laissez vide pour utiliser le nom de la société automatiquement.</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Pied de Page des Documents PDF</h2>
          </CardHeader>
          <CardBody>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte de pied de page</label>
              <textarea
                {...register('doc_footer_text')}
                rows={2}
                placeholder={`Ex: ${settings.name || 'VOTRE SOCIÉTÉ'} — RC: ${settings.rc || ''} — ICE: ${settings.ice || ''} — Tél: ${settings.phone || ''}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Affiché en bas de chaque page de vos documents. Laissez vide pour le pied de page par défaut.</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Aperçu</h2>
          </CardHeader>
          <CardBody>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-purple-700 text-white px-4 py-3 text-xs font-mono">
                ← En-tête: {settings.doc_header_text || settings.name || 'Nom de la société'}
              </div>
              <div className="bg-gray-50 px-4 py-6 text-center text-gray-400 text-sm">
                Contenu du document (bulletin de paie, attestation, contrat...)
              </div>
              <div className="bg-gray-100 px-4 py-2 text-xs font-mono text-gray-500">
                ← Pied de page: {settings.doc_footer_text || `${settings.name || 'INFINITAS HRM'} — Document confidentiel`}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Enregistrer
          </Button>
        </div>
      </div>
    </form>
  )
}

function HRConfigForm({
  settings,
  onSave,
  saving,
}: {
  settings: CompanySettings
  onSave: (data: Partial<CompanySettings>) => void
  saving: boolean
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      working_days_per_week: settings.working_days_per_week,
      working_hours_per_day: settings.working_hours_per_day,
      annual_leave_days: settings.annual_leave_days,
      trial_period_cdi_days: settings.trial_period_cdi_days,
      trial_period_cdd_days: settings.trial_period_cdd_days,
      work_start_time: settings.work_start_time || '08:30',
      break_duration_minutes: settings.break_duration_minutes ?? 60,
      retard_tolerance_minutes: settings.retard_tolerance_minutes ?? 0,
      mutuelle_rate: (settings as any).mutuelle_rate ?? 0,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Temps de Travail</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Jours de travail / semaine"
                type="number"
                min="1"
                max="7"
                hint="Maroc: 6 jours (44h/semaine)"
                {...register('working_days_per_week', { valueAsNumber: true })}
              />
              <Input
                label="Heures de travail / jour"
                type="number"
                min="1"
                max="24"
                step="0.5"
                hint="Durée journalière légale"
                {...register('working_hours_per_day', { valueAsNumber: true })}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Gestion du Pointage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Heure de début de travail"
                type="time"
                hint="Référence pour calculer le retard"
                {...register('work_start_time')}
              />
              <Input
                label="Durée pause déjeuner (min)"
                type="number"
                min="0"
                max="120"
                hint="Déduite si journée > 4h"
                {...register('break_duration_minutes', { valueAsNumber: true })}
              />
              <Input
                label="Tolérance retard (min)"
                type="number"
                min="0"
                hint="Retard ignoré si ≤ cette valeur"
                {...register('retard_tolerance_minutes', { valueAsNumber: true })}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Politique de Congés</h2>
          </CardHeader>
          <CardBody>
            <Input
              label="Jours de congés annuels"
              type="number"
              min="0"
              hint="Minimum légal au Maroc: 18 jours ouvrables"
              {...register('annual_leave_days', { valueAsNumber: true })}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Périodes d'Essai par Défaut</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Durée période d'essai CDI (jours)"
                type="number"
                min="0"
                hint="Généralement 90 jours pour un CDI"
                {...register('trial_period_cdi_days', { valueAsNumber: true })}
              />
              <Input
                label="Durée période d'essai CDD (jours)"
                type="number"
                min="0"
                hint="Généralement 45 jours pour un CDD"
                {...register('trial_period_cdd_days', { valueAsNumber: true })}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Paramètres de Paie — LF 2026</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <div>CNSS salarié : <span className="font-semibold text-gray-800">4,48%</span></div>
              <div>AMO salarié : <span className="font-semibold text-gray-800">2,26%</span></div>
              <div>SMIG brut : <span className="font-semibold text-gray-800">3 422,72 MAD</span></div>
            </div>
            <Input
              label="Taux Mutuelle Privée par défaut (%)"
              type="number"
              min="0"
              max="20"
              step="0.01"
              hint="Entrez 0 pour désactiver la mutuelle. Modifiable par bulletin de paie."
              {...register('mutuelle_rate', { valueAsNumber: true })}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Enregistrer la Configuration
          </Button>
        </div>
      </div>
    </form>
  )
}

function UsersTab({ users }: { users: User[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        <Button variant="primary" size="sm">
          Nouvel Utilisateur
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Créé le</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dernière Connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                      {user.role === 'admin' ? 'Administrateur' :
                       user.role === 'hr_manager' ? 'Responsable RH' : 'Employé'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.active ? 'ACTIF' : 'TERMINE'} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {user.last_login ? formatDate(user.last_login) : 'Jamais'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ── Départements & Postes ─────────────────────────────────────────────────────

function DepartementsPostesTab() {
  const qc = useQueryClient()
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [editingPos, setEditingPos] = useState<Position | null>(null)
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [showPosForm, setShowPosForm] = useState(false)
  const [deptForm, setDeptForm] = useState({ name: '', description: '' })
  const [posForm, setPosForm] = useState({ title: '', department_id: '', description: '' })
  const [filterDept, setFilterDept] = useState<number | undefined>(undefined)

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => employeesService.getDepartments(),
  })

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['positions', filterDept],
    queryFn: () => employeesService.getPositions(filterDept),
  })

  const createDept = useMutation({
    mutationFn: (d: { name: string; description?: string }) => employeesService.createDepartment(d),
    onSuccess: () => { toast.success('Département créé'); qc.invalidateQueries({ queryKey: ['departments'] }); setShowDeptForm(false); setDeptForm({ name: '', description: '' }) },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
  })

  const updateDept = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => employeesService.updateDepartment(id, data),
    onSuccess: () => { toast.success('Département mis à jour'); qc.invalidateQueries({ queryKey: ['departments'] }); setEditingDept(null) },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
  })

  const deleteDept = useMutation({
    mutationFn: (id: number) => employeesService.deleteDepartment(id),
    onSuccess: () => { toast.success('Département supprimé'); qc.invalidateQueries({ queryKey: ['departments'] }); qc.invalidateQueries({ queryKey: ['positions'] }) },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const createPos = useMutation({
    mutationFn: (d: { title: string; department_id?: number | null; description?: string }) => employeesService.createPosition(d),
    onSuccess: () => { toast.success('Poste créé'); qc.invalidateQueries({ queryKey: ['positions'] }); setShowPosForm(false); setPosForm({ title: '', department_id: '', description: '' }) },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
  })

  const updatePos = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title: string; department_id?: number | null; description?: string } }) => employeesService.updatePosition(id, data),
    onSuccess: () => { toast.success('Poste mis à jour'); qc.invalidateQueries({ queryKey: ['positions'] }); setEditingPos(null) },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
  })

  const deletePos = useMutation({
    mutationFn: (id: number) => employeesService.deletePosition(id),
    onSuccess: () => { toast.success('Poste supprimé'); qc.invalidateQueries({ queryKey: ['positions'] }) },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const startEditDept = (d: Department) => { setEditingDept(d); setDeptForm({ name: d.name, description: d.description || '' }); setShowDeptForm(false) }
  const startEditPos = (p: Position) => { setEditingPos(p); setPosForm({ title: p.title, department_id: p.department_id ? String(p.department_id) : '', description: p.description || '' }); setShowPosForm(false) }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ── Départements ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Départements</h2>
              <button
                onClick={() => { setShowDeptForm(true); setEditingDept(null); setDeptForm({ name: '', description: '' }) }}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {(showDeptForm || editingDept) && (
              <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 space-y-2">
                <input
                  value={deptForm.name}
                  onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nom du département *"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  value={deptForm.description}
                  onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optionnel)"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!deptForm.name.trim()) return toast.error('Le nom est obligatoire')
                      if (editingDept) updateDept.mutate({ id: editingDept.id, data: deptForm })
                      else createDept.mutate(deptForm)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                  >
                    <Check className="h-3.5 w-3.5" /> {editingDept ? 'Modifier' : 'Créer'}
                  </button>
                  <button
                    onClick={() => { setShowDeptForm(false); setEditingDept(null) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" /> Annuler
                  </button>
                </div>
              </div>
            )}
            <ul className="divide-y divide-gray-100">
              {departments.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-400">Aucun département</li>
              )}
              {departments.map(d => (
                <li key={d.id} className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${editingDept?.id === d.id ? 'bg-indigo-50' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    {d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditDept(d)} className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Supprimer "${d.name}" ?`)) deleteDept.mutate(d.id) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* ── Postes ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Postes</h2>
              <button
                onClick={() => { setShowPosForm(true); setEditingPos(null); setPosForm({ title: '', department_id: '', description: '' }) }}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {/* Filter by dept */}
            <div className="px-4 py-2 border-b border-gray-100">
              <select
                value={filterDept ?? ''}
                onChange={e => setFilterDept(e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Tous les départements</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {(showPosForm || editingPos) && (
              <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 space-y-2">
                <input
                  value={posForm.title}
                  onChange={e => setPosForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Intitulé du poste *"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={posForm.department_id}
                  onChange={e => setPosForm(f => ({ ...f, department_id: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Aucun département</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input
                  value={posForm.description}
                  onChange={e => setPosForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optionnel)"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!posForm.title.trim()) return toast.error("L'intitulé est obligatoire")
                      const payload = { title: posForm.title, department_id: posForm.department_id ? Number(posForm.department_id) : null, description: posForm.description }
                      if (editingPos) updatePos.mutate({ id: editingPos.id, data: payload })
                      else createPos.mutate(payload)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                  >
                    <Check className="h-3.5 w-3.5" /> {editingPos ? 'Modifier' : 'Créer'}
                  </button>
                  <button
                    onClick={() => { setShowPosForm(false); setEditingPos(null) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" /> Annuler
                  </button>
                </div>
              </div>
            )}

            <ul className="divide-y divide-gray-100">
              {positions.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-400">Aucun poste</li>
              )}
              {positions.map(p => (
                <li key={p.id} className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${editingPos?.id === p.id ? 'bg-indigo-50' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.title}</p>
                    {p.department_name && <p className="text-xs text-indigo-600 mt-0.5">{p.department_name}</p>}
                    {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditPos(p)} className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Supprimer "${p.title}" ?`)) deletePos.mutate(p.id) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
