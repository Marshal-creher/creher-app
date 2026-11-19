import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, ChevronDown, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { companiesService } from '../../services/companies.service'
import { getSelectedCompanyId, setSelectedCompanyId } from '../../lib/company'

// Shows which company the HRM is working on and lets a CREHER account switch.
// Switching empties the cached data, so no screen keeps the previous company's.
export function CompanySwitcher() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(getSelectedCompanyId())
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesService.list,
    staleTime: 60_000,
  })
  const companies = data?.companies ?? []
  const active = companies.filter((c) => c.active)

  // Same default as the server: the selected company if still open, else the
  // first active one (lowest id).
  useEffect(() => {
    if (!active.length) return
    if (!selected || !active.some((c) => c.id === selected)) {
      const fallback = [...active].sort((a, b) => a.id - b.id)[0].id
      setSelectedCompanyId(fallback)
      setSelected(fallback)
    }
  }, [active, selected])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const current = companies.find((c) => c.id === selected) ?? active[0]
  if (!current) return null

  const choose = (id: number) => {
    setOpen(false)
    if (id === current.id) return
    setSelectedCompanyId(id)
    setSelected(id)
    queryClient.clear()
    navigate('/crm/dashboard')
    toast.success(`Entreprise : ${companies.find((c) => c.id === id)?.name ?? ''}`)
  }

  if (!data?.allCompaniesAccess) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 text-sm font-medium">
        <Building2 className="h-4 w-4" />
        {current.name}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm font-medium hover:bg-indigo-100 transition-colors max-w-[260px]"
        title="Changer d'entreprise"
      >
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{current.name}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <p className="px-4 pt-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entreprises suivies</p>
          <ul className="max-h-72 overflow-y-auto pb-1">
            {active.map((company) => (
              <li key={company.id}>
                <button
                  onClick={() => choose(company.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium text-gray-900">{company.name}</span>
                    <span className="block text-xs text-gray-400">
                      {company.employee_count ?? 0} salarié{(company.employee_count ?? 0) > 1 ? 's' : ''} actif{(company.employee_count ?? 0) > 1 ? 's' : ''}
                    </span>
                  </span>
                  {company.id === current.id && <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => { setOpen(false); navigate('/crm/entreprises') }}
            className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 text-sm text-indigo-700 hover:bg-indigo-50"
          >
            <Settings2 className="h-4 w-4" />
            Gérer les entreprises
          </button>
        </div>
      )}
    </div>
  )
}
