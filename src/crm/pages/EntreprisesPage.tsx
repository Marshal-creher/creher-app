import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, ArrowRight, Pencil, Power } from 'lucide-react'
import toast from 'react-hot-toast'
import { companiesService, type Company, type NewCompany } from '../services/companies.service'
import { getSelectedCompanyId, setSelectedCompanyId } from '../lib/company'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { formatDate } from '../lib/utils'

// The companies CREHER follows. Each has its own employees, attendance, leave
// and payroll; the switcher in the top bar chooses the one being worked on.

const EMPTY: NewCompany = {
  name: '', forme_juridique: '', ice: '', if_fiscal: '', rc: '', cnss_employer: '',
  capital: '', address: '', city: '', phone: '', email: '',
}

const FIELDS: Array<{ key: keyof NewCompany; label: string; placeholder?: string; wide?: boolean }> = [
  { key: 'name', label: 'Raison sociale *', placeholder: 'Ex. ATLAS SERVICES SARL', wide: true },
  { key: 'forme_juridique', label: 'Forme juridique', placeholder: 'SARL, SA, SARL AU…' },
  { key: 'capital', label: 'Capital', placeholder: '100 000 MAD' },
  { key: 'ice', label: 'ICE' },
  { key: 'if_fiscal', label: 'Identifiant fiscal (IF)' },
  { key: 'rc', label: 'Registre de commerce (RC)' },
  { key: 'cnss_employer', label: 'N° affiliation CNSS' },
  { key: 'address', label: 'Adresse', wide: true },
  { key: 'city', label: 'Ville' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'email', label: 'Email', wide: true },
]

const errorMessage = (err: any) => err?.response?.data?.error || err?.message || 'Erreur'

export function EntreprisesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<NewCompany>(EMPTY)
  const [renaming, setRenaming] = useState<Company | null>(null)
  const [newName, setNewName] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['companies'], queryFn: companiesService.list })
  const companies = data?.companies ?? []
  const currentId = getSelectedCompanyId()

  const open = (company: Company) => {
    setSelectedCompanyId(company.id)
    queryClient.clear()
    navigate('/crm/dashboard')
    toast.success(`Entreprise : ${company.name}`)
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => typeof v === 'string' && v.trim() !== ''),
      ) as unknown as NewCompany
      return companiesService.create(payload)
    },
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setShowCreate(false)
      setForm(EMPTY)
      toast.success(`${company.name} créée`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; active?: boolean } }) => companiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setRenaming(null)
      toast.success('Entreprise mise à jour')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entreprises suivies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chaque entreprise a ses propres salariés, pointages, congés et paies. Choisissez celle sur laquelle
            vous travaillez avec le sélecteur en haut de l'écran.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          Nouvelle entreprise
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">Entreprise</th>
              <th className="px-5 py-3 text-right font-medium">Salariés actifs</th>
              <th className="px-5 py-3 text-left font-medium">Créée le</th>
              <th className="px-5 py-3 text-left font-medium">Statut</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map((company) => (
              <tr key={company.id} className={company.active ? '' : 'bg-gray-50 text-gray-400'}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{company.name}</p>
                      {company.id === currentId && <p className="text-xs text-indigo-600">Entreprise affichée</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">{company.employee_count ?? '—'}</td>
                <td className="px-5 py-3">{formatDate(company.created_at)}</td>
                <td className="px-5 py-3">
                  <Badge variant={company.active ? 'success' : 'gray'}>{company.active ? 'Active' : 'Désactivée'}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {company.active && (
                      <Button size="sm" variant="outline" leftIcon={<ArrowRight className="h-4 w-4" />} onClick={() => open(company)}>
                        Ouvrir
                      </Button>
                    )}
                    <button
                      title="Renommer"
                      onClick={() => { setRenaming(company); setNewName(company.name) }}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title={company.active ? 'Désactiver (les données sont conservées)' : 'Réactiver'}
                      onClick={() => {
                        const confirmText = company.active
                          ? `Désactiver ${company.name} ? Ses données sont conservées et ses comptes clients ne pourront plus se connecter.`
                          : `Réactiver ${company.name} ?`
                        if (window.confirm(confirmText)) updateMutation.mutate({ id: company.id, data: { active: !company.active } })
                      }}
                      className={`p-2 rounded-lg hover:bg-gray-100 ${company.active ? 'text-red-500' : 'text-emerald-600'}`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Pour donner accès à un client, créez un compte dans Utilisateurs et rattachez-le à son entreprise :
        il ne verra que celle-ci.
      </p>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle entreprise" size="lg">
        <ModalBody>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((field) => (
              <div key={field.key} className={field.wide ? 'col-span-2' : ''}>
                <Input
                  label={field.label}
                  placeholder={field.placeholder}
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Les autres informations (logo, gérant, temps de travail, paramètres de paie) se règlent ensuite dans
            Paramètres, une fois l'entreprise ouverte. La paie démarre avec les taux 2026 du classeur de référence.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
          <Button
            variant="primary"
            loading={createMutation.isPending}
            disabled={form.name.trim().length < 2}
            onClick={() => createMutation.mutate()}
          >
            Créer l'entreprise
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={Boolean(renaming)} onClose={() => setRenaming(null)} title="Renommer l'entreprise" size="sm">
        <ModalBody>
          <Input label="Raison sociale" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setRenaming(null)}>Annuler</Button>
          <Button
            variant="primary"
            loading={updateMutation.isPending}
            disabled={newName.trim().length < 2}
            onClick={() => renaming && updateMutation.mutate({ id: renaming.id, data: { name: newName.trim() } })}
          >
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
