import React from 'react'
import { cn, getStatusColor, getStatusLabel } from '../../lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
  primary: 'bg-indigo-100 text-indigo-800',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * Get status badge JSX with appropriate colors
 */
export function StatusBadge({ status }: { status: string }) {
  const colorClasses = getStatusColor(status)
  const label = getStatusLabel(status)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClasses
      )}
    >
      {label}
    </span>
  )
}
