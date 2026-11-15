import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { employeesService } from '../../services/employees.service'
import { netToGross, grossToNet, SMIG_BRUT } from '../../lib/payrollUtils'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/Spinner'

const updateSchema = z.object({
  cin: z.string().optional(),
  cnss_number: z.string().optional(),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.preprocess(v => v === '' ? undefined : v, z.enum(['M', 'F']).optional()),
  marital_status: z.string().optional(),
  children_count: z.preprocess(v => (v === null || v === undefined || (typeof v === 'number' && isNaN(v as number))) ? undefined : Number(v), z.number().min(0).optional()),
  nationality: z.string().optional(),
  department_id: z.number().optional().nullable(),
  position_id: z.number().optional().nullable(),
  contract_type: z.preprocess(v => v === '' ? undefined : v, z.enum(['CDI', 'CDD', 'PERIODE_ESSAI']).optional()),
  hire_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
  status: z.preprocess(v => v === '' ? undefined : v, z.enum(['ACTIF', 'SUSPENDU', 'TERMINE']).optional()),
})

type UpdateFormData = z.infer<typeof updateSchema>

export function ModifierEmployePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const employeeId = parseInt(id || '0', 10)

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesService.getEmployee(employeeId),
    enabled: !!employeeId,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: employeesService.getDepartments,
  })

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => employeesService.getPositions(),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
  })

  const [netSalaryInput, setNetSalaryInput] = useState('')
  const [computedGross, setComputedGross] = useState(0)

  useEffect(() => {
    if (!employee) return
    reset({
      cin: employee.cin || '',
      cnss_number: employee.cnss_number || '',
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      city: employee.city || '',
      birth_date: employee.birth_date || '',
      gender: employee.gender || undefined,
      marital_status: employee.marital_status || '',
      children_count: employee.children_count,
      nationality: employee.nationality,
      department_id: employee.department_id,
      position_id: employee.position_id,
      contract_type: employee.contract_type,
      hire_date: employee.hire_date,
      contract_end_date: employee.contract_end_date || '',
      bank_account: employee.bank_account || '',
      bank_name: employee.bank_name || '',
      status: employee.status,
    })
    const net = grossToNet(employee.base_salary)
    setNetSalaryInput(String(Math.round(net)))
    setComputedGross(employee.base_salary)
  }, [employee, reset])

  const handleNetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNetSalaryInput(e.target.value)
    const normalized = e.target.value.replace(/[\s]/g, '').replace(',', '.')
    const parsed = parseFloat(normalized)
    if (!isNaN(parsed) && parsed > 0) {
      setComputedGross(netToGross(parsed))
    } else {
      setComputedGross(0)
    }
  }

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFormData) => employeesService.updateEmployee(employeeId, {
      ...data,
      cin: data.cin || null,
      email: data.email || null,
      bank_account: data.bank_account || null,
      base_salary: computedGross > 0 ? computedGross : (employee?.base_salary ?? 0),
    }),
    onSuccess: () => {
      toast.success('Employé mis à jour avec succès !')
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      navigate(`/crm/employes/${employeeId}`)
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  if (isLoading) return <PageLoader />

  const departmentOptions = departments.map((d: { id: number; name: string }) => ({
    value: d.id,
    label: d.name,
  }))

  const positionOptions = positions.map((p: { id: number; title: string }) => ({
    value: p.id,
    label: p.title,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/crm/employes/${employeeId}`)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Modifier — {employee?.first_name} {employee?.last_name}
          </h1>
          <p className="text-sm text-gray-500">{employee?.employee_code}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Informations Personnelles</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" required error={errors.first_name?.message} {...register('first_name')} />
              <Input label="Nom" required error={errors.last_name?.message} {...register('last_name')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="CIN" {...register('cin')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Téléphone" {...register('phone')} />
              <DatePicker label="Date de Naissance" {...register('birth_date')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Adresse" {...register('address')} />
              <Input label="Ville" {...register('city')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Genre"
                    options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
                    placeholder="Sélectionner"
                    {...field}
                    value={field.value || ''}
                  />
                )}
              />
              <Select
                label="Situation Familiale"
                options={[
                  { value: 'Célibataire', label: 'Célibataire' },
                  { value: 'Marié(e)', label: 'Marié(e)' },
                  { value: 'Divorcé(e)', label: 'Divorcé(e)' },
                  { value: 'Veuf/Veuve', label: 'Veuf/Veuve' },
                ]}
                placeholder="Sélectionner"
                {...register('marital_status')}
              />
              <Input
                label="Nb. Enfants"
                type="number"
                min="0"
                {...register('children_count', { valueAsNumber: true })}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Informations Professionnelles</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="department_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Département"
                    options={departmentOptions}
                    placeholder="Sélectionner"
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                )}
              />
              <Controller
                name="position_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Poste"
                    options={positionOptions}
                    placeholder="Sélectionner"
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="contract_type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Type de Contrat"
                    options={[
                      { value: 'CDI', label: 'CDI' },
                      { value: 'CDD', label: 'CDD' },
                      { value: 'PERIODE_ESSAI', label: "Période d'Essai" },
                    ]}
                    {...field}
                    value={field.value || ''}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Statut"
                    options={[
                      { value: 'ACTIF', label: 'Actif' },
                      { value: 'SUSPENDU', label: 'Suspendu' },
                      { value: 'TERMINE', label: 'Terminé' },
                    ]}
                    {...field}
                    value={field.value || ''}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Date d'Embauche" {...register('hire_date')} />
              <DatePicker label="Fin de Contrat" {...register('contract_end_date')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Salaire Net de Base (MAD)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={netSalaryInput}
                  onChange={handleNetChange}
                  placeholder="ex: 10000"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
                {computedGross > 0 && (
                  <div className={`rounded-md border px-3 py-2 text-xs flex justify-between ${computedGross < SMIG_BRUT ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'}`}>
                    <span className="text-gray-500">Brut calculé :</span>
                    <span className={`font-semibold ${computedGross < SMIG_BRUT ? 'text-amber-700' : 'text-blue-700'}`}>{computedGross.toLocaleString('fr-MA', { maximumFractionDigits: 2 })} MAD</span>
                  </div>
                )}
                {computedGross > 0 && computedGross < SMIG_BRUT && (
                  <p className="text-xs text-amber-600">⚠ Inférieur au SMIG ({SMIG_BRUT.toLocaleString('fr-MA')} MAD brut) — le système appliquera le SMIG automatiquement.</p>
                )}
              </div>
              <Input label="N° CNSS" {...register('cnss_number')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Banque" {...register('bank_name')} />
              <Input label="RIB" {...register('bank_account')} />
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => navigate(`/crm/employes/${employeeId}`)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={updateMutation.isPending}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Enregistrer les Modifications
          </Button>
        </div>
      </form>
    </div>
  )
}
