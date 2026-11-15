import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Check, User, Briefcase, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { employeesService } from '../../services/employees.service'
import { netToGross, grossToNet, SMIG_BRUT } from '../../lib/payrollUtils'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { getContractTypeLabel } from '../../lib/utils'

const employeeSchema = z.object({
  // Step 1 - Personal
  cin: z.string().optional(),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  marital_status: z.string().optional(),
  children_count: z.number().min(0).default(0),
  nationality: z.string().default('Marocaine'),

  // Step 2 - Professional
  department_id: z.number().optional().nullable(),
  position_id: z.number().optional().nullable(),
  contract_type: z.enum(['CDI', 'CDD', 'PERIODE_ESSAI']).default('CDI'),
  hire_date: z.string().min(1, 'Date d\'embauche requise'),
  contract_end_date: z.string().optional(),
  base_salary: z.number().min(0, 'Salaire invalide'),
  cnss_number: z.string().optional(),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

const STEPS = [
  { id: 1, label: 'Informations Personnelles', icon: <User className="h-4 w-4" /> },
  { id: 2, label: 'Informations Professionnelles', icon: <Briefcase className="h-4 w-4" /> },
  { id: 3, label: 'Récapitulatif', icon: <ClipboardCheck className="h-4 w-4" /> },
]

export function NouvelEmployePage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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
    watch,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nationality: 'Marocaine',
      contract_type: 'CDI',
      children_count: 0,
      base_salary: 0,
    },
  })

  const watchedValues = watch()

  const [netSalaryInput, setNetSalaryInput] = useState('')
  const [computedGross, setComputedGross] = useState(0)

  const handleNetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNetSalaryInput(e.target.value)
    const normalized = e.target.value.replace(/[\s]/g, '').replace(',', '.')
    const parsed = parseFloat(normalized)
    if (!isNaN(parsed) && parsed > 0) {
      const gross = netToGross(parsed)
      setValue('base_salary', gross)
      setComputedGross(gross)
    } else {
      setValue('base_salary', 0)
      setComputedGross(0)
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => employeesService.createEmployee({
      ...data,
      base_salary: Number(data.base_salary),
      children_count: Number(data.children_count),
      cin: data.cin || null,
      email: data.email || null,
      bank_account: data.bank_account || null,
      department_id: data.department_id || null,
      position_id: data.position_id || null,
    }),
    onSuccess: async (employee) => {
      toast.success('Employé créé avec succès !')
      if (photoFile) {
        try {
          await employeesService.uploadPhoto(employee.id, photoFile)
        } catch {
          // Photo upload failure is non-fatal
        }
      }
      navigate(`/crm/employes/${employee.id}`)
    },
    onError: () => toast.error('Erreur lors de la création de l\'employé'),
  })

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof EmployeeFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['first_name', 'last_name']
    } else if (currentStep === 2) {
      fieldsToValidate = ['hire_date', 'base_salary', 'contract_type']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) setCurrentStep(prev => prev + 1)
  }

  const onSubmit = (data: EmployeeFormData) => {
    createMutation.mutate(data)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const departmentOptions = departments.map((d: { id: number; name: string }) => ({
    value: d.id,
    label: d.name,
  }))

  const positionOptions = positions
    .filter((p: { department_id: number | null }) =>
      !watchedValues.department_id || p.department_id === watchedValues.department_id
    )
    .map((p: { id: number; title: string }) => ({
      value: p.id,
      label: p.title,
    }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/crm/employes')}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel Employé</h1>
          <p className="text-sm text-gray-500 mt-1">Remplissez le formulaire en 3 étapes</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                ${currentStep === step.id
                  ? 'bg-indigo-600 text-white'
                  : currentStep > step.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className={`text-sm font-medium hidden sm:block
                ${currentStep === step.id ? 'text-indigo-600' : 'text-gray-500'}`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Informations Personnelles
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  required
                  placeholder="Prénom"
                  error={errors.first_name?.message}
                  {...register('first_name')}
                />
                <Input
                  label="Nom"
                  required
                  placeholder="Nom de famille"
                  error={errors.last_name?.message}
                  {...register('last_name')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CIN"
                  placeholder="A123456"
                  {...register('cin')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemple.ma"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Téléphone"
                  placeholder="+212 6XX XX XX XX"
                  {...register('phone')}
                />
                <DatePicker
                  label="Date de Naissance"
                  {...register('birth_date')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Genre"
                      options={[
                        { value: 'M', label: 'Masculin' },
                        { value: 'F', label: 'Féminin' },
                      ]}
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
                  label="Nombre d'Enfants"
                  type="number"
                  min="0"
                  {...register('children_count', { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Adresse"
                  placeholder="Adresse complète"
                  {...register('address')}
                />
                <Input
                  label="Ville"
                  placeholder="Ville"
                  {...register('city')}
                />
              </div>

              <Input
                label="Nationalité"
                placeholder="Marocaine"
                {...register('nationality')}
              />
            </CardBody>
          </Card>
        )}

        {/* Step 2: Professional Info */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                Informations Professionnelles
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="department_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Département"
                      options={departmentOptions}
                      placeholder="Sélectionner un département"
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
                      placeholder="Sélectionner un poste"
                      {...field}
                      value={field.value?.toString() || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="contract_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Type de Contrat"
                      required
                      options={[
                        { value: 'CDI', label: 'CDI — Contrat à Durée Indéterminée' },
                        { value: 'CDD', label: 'CDD — Contrat à Durée Déterminée' },
                        { value: 'PERIODE_ESSAI', label: "Période d'Essai" },
                      ]}
                      error={errors.contract_type?.message}
                      {...field}
                    />
                  )}
                />
                <DatePicker
                  label="Date d'Embauche"
                  required
                  error={errors.hire_date?.message}
                  {...register('hire_date')}
                />
              </div>

              {watchedValues.contract_type === 'CDD' && (
                <DatePicker
                  label="Date de Fin de Contrat"
                  hint="Obligatoire pour un CDD"
                  {...register('contract_end_date')}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <input type="hidden" {...register('base_salary', { valueAsNumber: true })} />
                  <label className="block text-sm font-medium text-gray-700">
                    Salaire Net de Base (MAD) <span className="text-red-500">*</span>
                  </label>
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
                  {errors.base_salary && (
                    <p className="text-xs text-red-600">{errors.base_salary.message}</p>
                  )}
                </div>
                <Input
                  label="Numéro CNSS"
                  placeholder="N° d'immatriculation CNSS"
                  {...register('cnss_number')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Banque"
                  placeholder="Nom de la banque"
                  {...register('bank_name')}
                />
                <Input
                  label="RIB / Compte Bancaire"
                  placeholder="Numéro de compte"
                  {...register('bank_account')}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 3: Summary */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                Récapitulatif
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Photo upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Photo de profil (optionnel)</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-semibold text-indigo-700">
                        {watchedValues.first_name?.[0]}{watchedValues.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      Choisir une photo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Summary table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Informations Personnelles</h3>
                  <dl className="space-y-2">
                    {[
                      { label: 'Nom complet', value: `${watchedValues.first_name} ${watchedValues.last_name}` },
                      { label: 'CIN', value: watchedValues.cin || '-' },
                      { label: 'Email', value: watchedValues.email || '-' },
                      { label: 'Téléphone', value: watchedValues.phone || '-' },
                      { label: 'Nationalité', value: watchedValues.nationality },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <dt className="text-gray-500">{item.label}</dt>
                        <dd className="font-medium text-gray-900">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Informations Professionnelles</h3>
                  <dl className="space-y-2">
                    {[
                      { label: 'Contrat', value: getContractTypeLabel(watchedValues.contract_type) },
                      { label: 'Date d\'embauche', value: watchedValues.hire_date || '-' },
                      { label: 'Salaire brut', value: `${watchedValues.base_salary || 0} MAD` },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <dt className="text-gray-500">{item.label}</dt>
                        <dd className="font-medium text-gray-900">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => currentStep === 1 ? navigate('/crm/employes') : setCurrentStep(prev => prev - 1)}
          >
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              variant="primary"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={handleNextStep}
            >
              Suivant
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Créer l'Employé
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
