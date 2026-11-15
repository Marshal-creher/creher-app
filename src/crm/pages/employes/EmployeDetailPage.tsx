import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, User, FileText, Clock, Calendar, DollarSign,
  History, Pencil, Phone, Mail, MapPin, CreditCard, Building2,
  Download, Upload, Trash2
} from 'lucide-react'
import { employeesService } from '../../services/employees.service'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate, formatCurrency, getContractTypeLabel, getInitials, daysUntil, getUrgencyColor } from '../../lib/utils'
import { grossToNet } from '../../lib/payrollUtils'

type TabId = 'profil' | 'documents' | 'pointage' | 'conges' | 'salaires' | 'historique'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profil', label: 'Profil', icon: <User className="h-4 w-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { id: 'pointage', label: 'Pointage', icon: <Clock className="h-4 w-4" /> },
  { id: 'conges', label: 'Congés', icon: <Calendar className="h-4 w-4" /> },
  { id: 'salaires', label: 'Fiches de Paie', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'historique', label: 'Historique', icon: <History className="h-4 w-4" /> },
]

export function EmployeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('profil')
  const employeeId = parseInt(id || '0', 10)

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesService.getEmployee(employeeId),
    enabled: !!employeeId,
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => employeesService.getDocuments(employeeId),
    enabled: activeTab === 'documents' && !!employeeId,
  })

  if (isLoading) return <PageLoader />

  if (!employee) {
    return (
      <EmptyState
        title="Employé introuvable"
        description="Cet employé n'existe pas ou a été supprimé."
        action={{ label: 'Retour à la liste', onClick: () => navigate('/crm/employes') }}
      />
    )
  }

  const trialDaysLeft = employee.trial_period_end_date ? daysUntil(employee.trial_period_end_date) : null

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/crm/employes')}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-semibold">
              {employee.employee_code}
            </span>
            <span>{employee.position_title || 'Sans poste'}</span>
            {employee.department_name && <span>• {employee.department_name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={employee.status} />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => navigate(`/crm/employes/${employeeId}/modifier`)}
          >
            Modifier
          </Button>
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-6">
            {/* Photo */}
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-indigo-200">
              {employee.photo_path ? (
                <img
                  src={employee.photo_path}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-indigo-700">
                  {getInitials(employee.first_name, employee.last_name)}
                </span>
              )}
            </div>

            {/* Info grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: <Mail className="h-4 w-4 text-gray-400" />,
                  label: 'Email',
                  value: employee.email || '-'
                },
                {
                  icon: <Phone className="h-4 w-4 text-gray-400" />,
                  label: 'Téléphone',
                  value: employee.phone || '-'
                },
                {
                  icon: <MapPin className="h-4 w-4 text-gray-400" />,
                  label: 'Ville',
                  value: employee.city || '-'
                },
                {
                  icon: <CreditCard className="h-4 w-4 text-gray-400" />,
                  label: 'CIN',
                  value: employee.cin || '-'
                },
                {
                  icon: <Building2 className="h-4 w-4 text-gray-400" />,
                  label: 'Contrat',
                  value: getContractTypeLabel(employee.contract_type)
                },
                {
                  icon: <Calendar className="h-4 w-4 text-gray-400" />,
                  label: 'Embauché le',
                  value: formatDate(employee.hire_date)
                },
                {
                  icon: <DollarSign className="h-4 w-4 text-gray-400" />,
                  label: 'Salaire NET',
                  value: formatCurrency(Math.round(grossToNet(employee.base_salary)))
                },
                {
                  icon: <DollarSign className="h-4 w-4 text-gray-400" />,
                  label: 'Salaire Brut',
                  value: formatCurrency(employee.base_salary)
                },
                {
                  icon: <User className="h-4 w-4 text-gray-400" />,
                  label: 'CNSS',
                  value: employee.cnss_number || '-'
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  {item.icon}
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trial period alert */}
          {employee.trial_period_end_date && trialDaysLeft !== null && trialDaysLeft <= 30 && (
            <div className={`mt-4 p-3 rounded-lg border flex items-center gap-3 ${getUrgencyColor(trialDaysLeft)}`}>
              <Clock className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">
                Période d'essai expire le {formatDate(employee.trial_period_end_date)}
                {trialDaysLeft > 0
                  ? ` (dans ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''})`
                  : ' (expirée)'}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
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

      {/* Tab content */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Informations Personnelles</h3>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                {[
                  { label: 'Nom complet', value: `${employee.first_name} ${employee.last_name}` },
                  { label: 'Genre', value: employee.gender === 'M' ? 'Masculin' : employee.gender === 'F' ? 'Féminin' : '-' },
                  { label: 'Date de naissance', value: formatDate(employee.birth_date) },
                  { label: 'Situation familiale', value: employee.marital_status || '-' },
                  { label: 'Nombre d\'enfants', value: String(employee.children_count) },
                  { label: 'Nationalité', value: employee.nationality },
                  { label: 'Adresse', value: employee.address || '-' },
                  { label: 'Ville', value: employee.city || '-' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{item.label}</dt>
                    <dd className="font-medium text-gray-900 text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Informations Professionnelles</h3>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                {[
                  { label: 'Code Employé', value: employee.employee_code },
                  { label: 'Type de Contrat', value: getContractTypeLabel(employee.contract_type) },
                  { label: 'Date d\'embauche', value: formatDate(employee.hire_date) },
                  ...(employee.contract_end_date ? [{ label: 'Fin de contrat', value: formatDate(employee.contract_end_date) }] : []),
                  ...(employee.trial_period_end_date ? [{ label: 'Fin période d\'essai', value: formatDate(employee.trial_period_end_date) }] : []),
                  { label: 'Salaire NET de base', value: formatCurrency(Math.round(grossToNet(employee.base_salary))) },
                  { label: 'Salaire brut de base', value: formatCurrency(employee.base_salary) },
                  { label: 'Taux horaire', value: employee.hourly_rate ? formatCurrency(employee.hourly_rate) + '/h' : '-' },
                  { label: 'N° CNSS', value: employee.cnss_number || '-' },
                  { label: 'Banque', value: employee.bank_name || '-' },
                  { label: 'RIB', value: employee.bank_account || '-' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{item.label}</dt>
                    <dd className="font-medium text-gray-900 text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{documents.length} document{documents.length > 1 ? 's' : ''}</p>
            <label className="cursor-pointer">
              <input type="file" className="hidden" />
              <Button variant="primary" size="sm" leftIcon={<Upload className="h-4 w-4" />}>
                Téléverser
              </Button>
            </label>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Aucun document"
              description="Aucun document n'a été téléversé pour cet employé."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardBody className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">{doc.document_type} • {formatDate(doc.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pointage' && (
        <EmptyState
          icon={<Clock className="h-12 w-12" />}
          title="Pointage"
          description="Les données de pointage seront affichées ici."
          action={{ label: 'Aller au Pointage', onClick: () => navigate('/crm/pointage') }}
        />
      )}

      {activeTab === 'conges' && (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="Congés"
          description="Les demandes de congés seront affichées ici."
          action={{ label: 'Gérer les Congés', onClick: () => navigate('/crm/conges') }}
        />
      )}

      {activeTab === 'salaires' && (
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="Fiches de Paie"
          description="Les fiches de paie seront affichées ici."
          action={{ label: 'Aller aux Salaires', onClick: () => navigate('/crm/salaires') }}
        />
      )}

      {activeTab === 'historique' && (
        <EmptyState
          icon={<History className="h-12 w-12" />}
          title="Historique"
          description="L'historique des modifications sera affiché ici."
        />
      )}
    </div>
  )
}
