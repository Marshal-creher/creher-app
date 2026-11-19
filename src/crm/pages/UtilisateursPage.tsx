import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/auth.service'
import { companiesService } from '../services/companies.service'
import { getSelectedCompanyId } from '../lib/company'
import { Button } from '../components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import { formatDate } from '../lib/utils'
import type { User } from '../types'

export function UtilisateursPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  // New accounts default to the company on screen (least access); "all" is
  // only for CREHER staff.
  const emptyForm = () => ({ email: '', password: '', role: 'employee', company: String(getSelectedCompanyId() ?? '') })
  const [formData, setFormData] = useState(emptyForm)

  const { data: companiesData } = useQuery({ queryKey: ['companies'], queryFn: companiesService.list })
  const canChooseCompany = Boolean(companiesData?.allCompaniesAccess)
  const companyOptions = [
    ...(companiesData?.companies ?? []).filter((c) => c.active).map((c) => ({ value: String(c.id), label: c.name })),
    { value: 'all', label: 'Toutes les entreprises (compte CREHER)' },
  ]

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: authService.getUsers,
  })

  const createMutation = useMutation({
    mutationFn: () => authService.createUser({
      email: formData.email,
      password: formData.password,
      role: formData.role,
      company_id: formData.company && formData.company !== 'all' ? Number(formData.company) : null,
    }),
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowModal(false)
      setFormData(emptyForm())
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Erreur lors de la création'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      authService.updateUser(id, { active } as Parameters<typeof authService.updateUser>[1]),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowModal(true)}
        >
          Nouvel Utilisateur
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entreprise</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Créé le</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Connexion</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(users as User[]).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      {user.first_name && (
                        <p className="text-xs text-gray-500">{user.first_name} {user.last_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                    {user.role === 'admin' ? 'Administrateur' :
                     user.role === 'hr_manager' ? 'Responsable RH' : 'Employé'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {user.company_id ? user.company_name : <span className="text-indigo-700 font-medium">Toutes (CREHER)</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.active ? 'ACTIF' : 'TERMINE'} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {user.last_login ? formatDate(user.last_login) : 'Jamais'}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant={user.active ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({ id: user.id, active: !user.active })}
                  >
                    {user.active ? 'Désactiver' : 'Activer'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvel Utilisateur">
        <ModalBody className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Mot de passe"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <Select
            label="Rôle"
            options={[
              { value: 'employee', label: 'Employé' },
              { value: 'hr_manager', label: 'Responsable RH' },
              { value: 'admin', label: 'Administrateur' },
            ]}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          {canChooseCompany && (
            <Select
              label="Accès"
              options={companyOptions}
              value={formData.company || 'all'}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          )}
          <p className="text-xs text-gray-500">
            Un compte rattaché à une entreprise ne voit que celle-ci : c'est l'accès à donner à un client.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Créer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
