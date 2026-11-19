import React from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Timer,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  CreditCard,
  UserPlus,
  Building2,
} from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '../../services/notifications.service'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  badge?: number
  adminOnly?: boolean
}

const navGroups = [
  {
    label: 'PRINCIPAL',
    items: [
      {
        path: '/crm/dashboard',
        label: 'Tableau de Bord',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'GESTION RH',
    items: [
      {
        path: '/crm/employes',
        label: 'Employés',
        icon: <Users className="h-4 w-4" />,
      },
      {
        path: '/crm/pointage',
        label: 'Pointage',
        icon: <Clock className="h-4 w-4" />,
      },
      {
        path: '/crm/conges',
        label: 'Congés',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        path: '/crm/salaires',
        label: 'Salaires',
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        path: '/crm/avances',
        label: 'Avances',
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        path: '/crm/documents',
        label: 'Documents',
        icon: <FileText className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'RECRUTEMENT',
    items: [
      {
        path: '/crm/recrutement',
        label: 'Recrutement',
        icon: <UserPlus className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'SUIVI',
    items: [
      {
        path: '/crm/periode-essai',
        label: "Période d'Essai",
        icon: <Timer className="h-4 w-4" />,
      },
      {
        path: '/crm/notifications',
        label: 'Notifications',
        icon: <Bell className="h-4 w-4" />,
        hasBadge: true,
      },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      {
        path: '/crm/entreprises',
        label: 'Entreprises',
        icon: <Building2 className="h-4 w-4" />,
        allCompaniesOnly: true,
      },
      {
        path: '/crm/parametres',
        label: 'Paramètres',
        icon: <Settings className="h-4 w-4" />,
      },
      {
        path: '/crm/utilisateurs',
        label: 'Utilisateurs',
        icon: <Shield className="h-4 w-4" />,
        adminOnly: true,
      },
    ],
  },
]

export function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const location = useLocation()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
    refetchInterval: 60000, // Refresh every minute
  })

  const unreadCount = notifications?.filter(n => !n.read_at).length || 0

  const isActive = (path: string) => {
    if (path === '/crm/employes') {
      return location.pathname === '/crm/employes' || location.pathname.startsWith('/crm/employes/')
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-[240px] flex flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <Link to="/crm/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <img
          src="/lovable-uploads/0a8dd22a-7c81-4cb4-9401-5bb711ab32bd.png"
          alt="CREHER Logo"
          className="h-9 w-auto flex-shrink-0"
        />
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-none">CREHER</h1>
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">HRM</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => {
            if ('allCompaniesOnly' in item && item.allCompaniesOnly) {
              // CREHER admin accounts only: client accounts see one company
              return hasRole(['admin']) && !user?.company_id
            }
            if ('adminOnly' in item && item.adminOnly) {
              return hasRole(['admin'])
            }
            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="mb-5">
              <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.path)
                  const hasBadge = 'hasBadge' in item && item.hasBadge

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                          'transition-colors duration-150',
                          active
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0',
                          active ? 'text-indigo-600' : 'text-gray-400'
                        )}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {hasBadge && unreadCount > 0 && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        {active && !hasBadge && (
                          <ChevronRight className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            {user ? (
              <span className="text-xs font-semibold text-indigo-700">
                {getInitials(user.first_name || user.email.split('@')[0], user.last_name || '')}
              </span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'admin' ? 'Administrateur' :
               user?.role === 'hr_manager' ? 'Responsable RH' : 'Employé'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
