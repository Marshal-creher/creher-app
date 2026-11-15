import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationsService } from '../services/notifications.service'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import { formatRelative, cn } from '../lib/utils'
import type { Notification } from '../types'

const TYPE_CONFIG = {
  info: {
    icon: <Info className="h-5 w-5" />,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  alert: {
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    borderColor: 'border-red-200',
  },
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
  },
}

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      toast.success('Toutes les notifications ont été marquées comme lues')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = notifications.filter(n => !n.read_at).length

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''}
            {unreadCount > 0 && ` — ${unreadCount} non lu${unreadCount > 1 ? 'es' : 'e'}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Check className="h-4 w-4" />}
            loading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-16 w-16" />}
          title="Aucune notification"
          description="Vous n'avez aucune notification pour le moment. Revenez plus tard."
        />
      ) : (
        <div className="space-y-3">
          {/* Unread */}
          {unreadCount > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Non lues ({unreadCount})
              </p>
              {notifications
                .filter(n => !n.read_at)
                .map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkRead={() => markReadMutation.mutate(notif.id)}
                  />
                ))}
            </div>
          )}

          {/* Read */}
          {notifications.filter(n => n.read_at).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">
                Lues ({notifications.filter(n => n.read_at).length})
              </p>
              {notifications
                .filter(n => n.read_at)
                .map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkRead={() => {}}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: () => void
}) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
  const isUnread = !notification.read_at

  return (
    <Card className={cn(
      'mb-3 cursor-pointer transition-all hover:shadow-md',
      isUnread && 'ring-1 ring-indigo-100'
    )}>
      <CardBody className="flex items-start gap-4 py-4">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
          config.bgColor,
          config.iconColor,
          config.borderColor
        )}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0" onClick={isUnread ? onMarkRead : undefined}>
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm',
              isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}>
              {notification.title}
            </p>
            {isUnread && (
              <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-gray-400">{formatRelative(notification.created_at)}</p>
            {notification.first_name && (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {notification.first_name} {notification.last_name}
              </span>
            )}
          </div>
        </div>

        {isUnread && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead() }}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Marquer comme lu"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
      </CardBody>
    </Card>
  )
}
