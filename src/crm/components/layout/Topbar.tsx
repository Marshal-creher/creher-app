import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Bell, ChevronDown, User, Settings, LogOut, Check } from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '../../services/notifications.service'
import { formatRelative } from '../../lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/crm/dashboard': 'Tableau de Bord',
  '/crm/employes': 'Gestion des Employés',
  '/crm/employes/nouveau': 'Nouvel Employé',
  '/crm/pointage': 'Gestion du Pointage',
  '/crm/conges': 'Gestion des Congés',
  '/crm/salaires': 'Gestion des Salaires',
  '/crm/documents': 'Documents RH',
  '/crm/periode-essai': "Suivi des Périodes d'Essai",
  '/crm/notifications': 'Notifications',
  '/crm/parametres': 'Paramètres',
  '/crm/utilisateurs': 'Gestion des Utilisateurs',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.includes('/crm/employes/') && pathname.includes('/modifier')) return 'Modifier Employé'
  if (pathname.includes('/crm/employes/')) return 'Profil Employé'
  return 'CREHER HRM'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const pageTitle = getPageTitle(location.pathname)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
    refetchInterval: 60000,
  })

  const unreadCount = notifications.filter(n => !n.read_at).length

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const notifTypeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-amber-100 text-amber-600',
    alert: 'bg-red-100 text-red-600',
    success: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <header className="fixed top-0 left-[240px] right-0 z-10 h-[64px] bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      {/* Page title */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
            }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      {unreadCount} non lu{unreadCount > 1 ? 'es' : 'e'}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Tout lire
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Aucune notification
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                        !notif.read_at && 'bg-indigo-50/50'
                      )}
                      onClick={() => {
                        if (!notif.read_at) {
                          markReadMutation.mutate(notif.id)
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                          notifTypeColors[notif.type] || 'bg-gray-100 text-gray-600'
                        )}>
                          {notif.type === 'alert' ? '!' : notif.type === 'warning' ? '⚠' : 'i'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatRelative(notif.created_at)}</p>
                        </div>
                        {!notif.read_at && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-gray-100">
                <Link
                  to="/crm/notifications"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  onClick={() => setShowNotifications(false)}
                >
                  Voir toutes les notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-700">
                {user ? getInitials(user.first_name || user.email.split('@')[0], user.last_name || '') : '?'}
              </span>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {user?.role === 'admin' ? 'Administrateur' :
                 user?.role === 'hr_manager' ? 'Responsable RH' : 'Employé'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <Link
                to="/crm/parametres"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="h-4 w-4 text-gray-400" />
                Mon Profil
              </Link>
              <Link
                to="/crm/parametres"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Paramètres
              </Link>
              <div className="border-t border-gray-100" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
