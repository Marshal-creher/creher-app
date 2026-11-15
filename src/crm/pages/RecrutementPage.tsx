import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase, Users, Calendar, CheckCircle, Plus, Edit2, Trash2,
  X, Save, ExternalLink, ChevronDown, Search, UserCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { recrutementService, Offre, Candidature } from '../services/recrutement.service'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE: { key: Candidature['statut']; label: string; color: string; bg: string }[] = [
  { key: 'NOUVEAU',            label: 'Nouveau',          color: 'text-gray-600',   bg: 'bg-gray-100' },
  { key: 'PRESELECTION',       label: 'Présélection',     color: 'text-blue-700',   bg: 'bg-blue-50' },
  { key: 'ENTRETIEN_PLANIFIE', label: 'Entretien prévu',  color: 'text-amber-700',  bg: 'bg-amber-50' },
  { key: 'ENTRETIEN_FAIT',     label: 'Entretien fait',   color: 'text-purple-700', bg: 'bg-purple-50' },
  { key: 'OFFRE_ENVOYEE',      label: 'Offre envoyée',    color: 'text-indigo-700', bg: 'bg-indigo-50' },
  { key: 'RECRUTE',            label: 'Recruté',          color: 'text-emerald-700',bg: 'bg-emerald-50' },
  { key: 'REJETE',             label: 'Rejeté',           color: 'text-red-600',    bg: 'bg-red-50' },
]

const TYPE_CONTRAT = ['CDI', 'CDD', 'INTERIM', 'STAGE', 'FREELANCE']
const SOURCES = [
  { value: 'SITE_WEB', label: 'Site web' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'REFERRAL', label: 'Référence' },
  { value: 'SPONTANEE', label: 'Candidature spontanée' },
  { value: 'AUTRE', label: 'Autre' },
]

const statutOffre = (s: Offre['statut']) => ({
  OUVERT:   { label: 'Ouvert',    cls: 'bg-emerald-100 text-emerald-700' },
  EN_PAUSE: { label: 'En pause',  cls: 'bg-amber-100 text-amber-700' },
  FERME:    { label: 'Fermé',     cls: 'bg-red-100 text-red-600' },
}[s])

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Offre Modal ──────────────────────────────────────────────────────────────

function OffreModal({
  offre, onClose, onSave,
}: { offre: Offre | null; onClose: () => void; onSave: (data: object) => void }) {
  const [form, setForm] = useState({
    titre: offre?.titre ?? '',
    description: offre?.description ?? '',
    type_contrat: offre?.type_contrat ?? 'CDI',
    nb_postes: offre?.nb_postes ?? 1,
    statut: offre?.statut ?? 'OUVERT',
    date_limite: offre?.date_limite ?? '',
  })

  return (
    <Modal isOpen onClose={onClose} title={offre ? 'Modifier l\'offre' : 'Nouvelle offre'} size="md">
      <ModalBody className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre du poste *</label>
          <input
            value={form.titre}
            onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ex: Développeur Full Stack"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
            <select
              value={form.type_contrat}
              onChange={e => setForm(f => ({ ...f, type_contrat: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {TYPE_CONTRAT.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nb de postes</label>
            <input
              type="number" min="1"
              value={form.nb_postes}
              onChange={e => setForm(f => ({ ...f, nb_postes: parseInt(e.target.value) || 1 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={form.statut}
              onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="OUVERT">Ouvert</option>
              <option value="EN_PAUSE">En pause</option>
              <option value="FERME">Fermé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
            <input
              type="date"
              value={form.date_limite}
              onChange={e => setForm(f => ({ ...f, date_limite: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="Missions, profil recherché, compétences..."
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          Annuler
        </button>
        <button
          onClick={() => onSave({ ...form, date_limite: form.date_limite || null })}
          disabled={!form.titre.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          <Save className="h-4 w-4" />
          {offre ? 'Enregistrer' : 'Créer l\'offre'}
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Candidature Modal ────────────────────────────────────────────────────────

function CandidatureModal({
  candidature, offres, onClose, onSave,
}: { candidature: Candidature | null; offres: Offre[]; onClose: () => void; onSave: (data: object) => void }) {
  const [form, setForm] = useState({
    nom: candidature?.nom ?? '',
    prenom: candidature?.prenom ?? '',
    email: candidature?.email ?? '',
    telephone: candidature?.telephone ?? '',
    poste_souhaite: candidature?.poste_souhaite ?? '',
    offre_id: candidature?.offre_id ? String(candidature.offre_id) : '',
    statut: candidature?.statut ?? 'NOUVEAU',
    source: candidature?.source ?? 'SPONTANEE',
    cv_url: candidature?.cv_url ?? '',
    date_entretien: candidature?.date_entretien ?? '',
    notes: candidature?.notes ?? '',
  })

  return (
    <Modal isOpen onClose={onClose} title={candidature ? 'Modifier le candidat' : 'Nouveau candidat'} size="md">
      <ModalBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offre concernée</label>
            <select value={form.offre_id} onChange={e => setForm(f => ({ ...f, offre_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Candidature spontanée —</option>
              {offres.map(o => <option key={o.id} value={o.id}>{o.titre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poste souhaité</label>
            <input value={form.poste_souhaite} onChange={e => setForm(f => ({ ...f, poste_souhaite: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              {PIPELINE.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien CV</label>
            <input value={form.cv_url} onChange={e => setForm(f => ({ ...f, cv_url: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entretien</label>
            <input type="datetime-local" value={form.date_entretien} onChange={e => setForm(f => ({ ...f, date_entretien: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="Observations, compétences, impressions..." />
        </div>
      </ModalBody>
      <ModalFooter>
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          Annuler
        </button>
        <button
          onClick={() => onSave({
            ...form,
            offre_id: form.offre_id ? parseInt(form.offre_id) : null,
            email: form.email || null,
            telephone: form.telephone || null,
            poste_souhaite: form.poste_souhaite || null,
            cv_url: form.cv_url || null,
            date_entretien: form.date_entretien || null,
            notes: form.notes || null,
          })}
          disabled={!form.nom.trim() || !form.prenom.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          <Save className="h-4 w-4" />
          {candidature ? 'Enregistrer' : 'Ajouter le candidat'}
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  c, onEdit, onDelete, onMoveNext, onMovePrev, isLast, isFirst,
}: {
  c: Candidature
  onEdit: () => void
  onDelete: () => void
  onMoveNext: () => void
  onMovePrev: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const src = SOURCES.find(s => s.value === c.source)
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 group">
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <p className="font-medium text-gray-900 text-sm leading-snug">
          {c.prenom} {c.nom}
        </p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {c.offre_titre && (
        <p className="text-xs text-indigo-600 mb-1 truncate">{c.offre_titre}</p>
      )}
      {c.poste_souhaite && !c.offre_titre && (
        <p className="text-xs text-gray-500 mb-1 truncate">{c.poste_souhaite}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
        {src && <span className="bg-gray-100 rounded px-1.5 py-0.5">{src.label}</span>}
        <span className="ml-auto">{new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
      </div>
      {c.date_entretien && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-1">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          {new Date(c.date_entretien).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      {c.cv_url && (
        <a href={c.cv_url} target="_blank" rel="noreferrer"
          className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <ExternalLink className="h-3 w-3" />CV
        </a>
      )}
      <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={onMovePrev}
          disabled={isFirst}
          className="flex-1 text-xs py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Étape précédente"
        >←</button>
        <button
          onClick={onMoveNext}
          disabled={isLast}
          className="flex-1 text-xs py-1 rounded text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Étape suivante"
        >→</button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RecrutementPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'offres' | 'pipeline'>('pipeline')
  const [search, setSearch] = useState('')
  const [showOffreModal, setShowOffreModal] = useState(false)
  const [editingOffre, setEditingOffre] = useState<Offre | null>(null)
  const [showCandModal, setShowCandModal] = useState(false)
  const [editingCand, setEditingCand] = useState<Candidature | null>(null)
  const [filterOffre, setFilterOffre] = useState('')

  const { data: stats } = useQuery({ queryKey: ['recrutement-stats'], queryFn: recrutementService.getStats })
  const { data: offres = [] } = useQuery({ queryKey: ['offres'], queryFn: () => recrutementService.getOffres() })
  const { data: candidatures = [] } = useQuery({
    queryKey: ['candidatures', search, filterOffre],
    queryFn: () => recrutementService.getCandidatures({
      search: search || undefined,
      offre_id: filterOffre ? parseInt(filterOffre) : undefined,
    }),
  })

  const saveOffre = useMutation({
    mutationFn: (data: object) => editingOffre
      ? recrutementService.updateOffre(editingOffre.id, data)
      : recrutementService.createOffre(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offres'] })
      qc.invalidateQueries({ queryKey: ['recrutement-stats'] })
      toast.success(editingOffre ? 'Offre mise à jour' : 'Offre créée')
      setShowOffreModal(false); setEditingOffre(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
  })

  const deleteOffre = useMutation({
    mutationFn: (id: number) => recrutementService.deleteOffre(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offres'] })
      qc.invalidateQueries({ queryKey: ['recrutement-stats'] })
      toast.success('Offre supprimée')
    },
  })

  const saveCand = useMutation({
    mutationFn: (data: object) => editingCand
      ? recrutementService.updateCandidature(editingCand.id, data)
      : recrutementService.createCandidature(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['recrutement-stats'] })
      toast.success(editingCand ? 'Candidat mis à jour' : 'Candidat ajouté')
      setShowCandModal(false); setEditingCand(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
  })

  const deleteCand = useMutation({
    mutationFn: (id: number) => recrutementService.deleteCandidature(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['recrutement-stats'] })
      toast.success('Candidat supprimé')
    },
  })

  const moveStatus = (c: Candidature, dir: 'prev' | 'next') => {
    const idx = PIPELINE.findIndex(p => p.key === c.statut)
    const newIdx = dir === 'next' ? idx + 1 : idx - 1
    if (newIdx < 0 || newIdx >= PIPELINE.length) return
    recrutementService.updateCandidature(c.id, { statut: PIPELINE[newIdx].key }).then(() => {
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['recrutement-stats'] })
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recrutement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Offres d'emploi et pipeline de candidatures</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingOffre(null); setShowOffreModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
          >
            <Briefcase className="h-4 w-4" />
            Nouvelle offre
          </button>
          <button
            onClick={() => { setEditingCand(null); setShowCandModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter candidat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="h-5 w-5 text-indigo-600" />} label="Offres ouvertes" value={stats?.offres.ouvertes ?? 0} color="bg-indigo-50" />
        <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} label="Total candidats" value={stats?.candidatures.total ?? 0} color="bg-blue-50" />
        <StatCard icon={<Calendar className="h-5 w-5 text-amber-600" />} label="Entretiens" value={stats?.candidatures.entretiens ?? 0} color="bg-amber-50" />
        <StatCard icon={<UserCheck className="h-5 w-5 text-emerald-600" />} label="Recrutés" value={stats?.candidatures.recrutes ?? 0} color="bg-emerald-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['pipeline', 'Pipeline candidatures'], ['offres', 'Offres d\'emploi']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── PIPELINE TAB ── */}
      {tab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un candidat..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <select
              value={filterOffre}
              onChange={e => setFilterOffre(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Toutes les offres</option>
              {offres.map(o => <option key={o.id} value={o.id}>{o.titre}</option>)}
            </select>
          </div>

          {/* Kanban */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {PIPELINE.map((stage, stageIdx) => {
                const cards = candidatures.filter(c => c.statut === stage.key)
                return (
                  <div key={stage.key} className="w-56 flex-shrink-0">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${stage.bg}`}>
                      <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                      <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${stage.bg} ${stage.color} border border-current border-opacity-20`}>
                        {cards.length}
                      </span>
                    </div>
                    <div className="space-y-2 min-h-[80px]">
                      {cards.map(c => (
                        <KanbanCard
                          key={c.id}
                          c={c}
                          onEdit={() => { setEditingCand(c); setShowCandModal(true) }}
                          onDelete={() => {
                            if (confirm(`Supprimer ${c.prenom} ${c.nom} ?`)) deleteCand.mutate(c.id)
                          }}
                          onMoveNext={() => moveStatus(c, 'next')}
                          onMovePrev={() => moveStatus(c, 'prev')}
                          isFirst={stageIdx === 0}
                          isLast={stageIdx === PIPELINE.length - 1}
                        />
                      ))}
                      {cards.length === 0 && (
                        <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-300">Vide</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── OFFRES TAB ── */}
      {tab === 'offres' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Offres d'emploi</h2>
            <span className="ml-auto text-sm text-gray-400">{offres.length} offre(s)</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Poste</th>
                <th className="px-4 py-3 text-left font-medium">Contrat</th>
                <th className="px-4 py-3 text-center font-medium">Postes</th>
                <th className="px-4 py-3 text-center font-medium">Candidatures</th>
                <th className="px-4 py-3 text-left font-medium">Date limite</th>
                <th className="px-4 py-3 text-center font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <p>Aucune offre d'emploi</p>
                    <button
                      onClick={() => { setEditingOffre(null); setShowOffreModal(true) }}
                      className="mt-2 text-indigo-600 text-sm hover:underline"
                    >Créer la première offre</button>
                  </td>
                </tr>
              ) : offres.map(o => {
                const st = statutOffre(o.statut)
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.titre}</p>
                      {o.departement_name && <p className="text-xs text-gray-400">{o.departement_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{o.type_contrat}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{o.nb_postes}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-indigo-700 font-semibold">{o.nb_candidatures}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {o.date_limite ? formatDate(o.date_limite) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st?.cls}`}>
                        {st?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            recrutementService.updateOffre(o.id, { statut: o.statut === 'OUVERT' ? 'FERME' : 'OUVERT' })
                              .then(() => qc.invalidateQueries({ queryKey: ['offres'] }))
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                          title={o.statut === 'OUVERT' ? 'Fermer' : 'Rouvrir'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingOffre(o); setShowOffreModal(true) }}
                          className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Supprimer cette offre ?')) deleteOffre.mutate(o.id) }}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showOffreModal && (
        <OffreModal
          offre={editingOffre}
          onClose={() => { setShowOffreModal(false); setEditingOffre(null) }}
          onSave={data => saveOffre.mutate(data)}
        />
      )}
      {showCandModal && (
        <CandidatureModal
          candidature={editingCand}
          offres={offres}
          onClose={() => { setShowCandModal(false); setEditingCand(null) }}
          onSave={data => saveCand.mutate(data)}
        />
      )}
    </div>
  )
}
