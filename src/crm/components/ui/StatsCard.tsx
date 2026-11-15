import React from 'react'
import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  iconBgColor?: string
  iconColor?: string
  className?: string
  onClick?: () => void
}

export function StatsCard({
  icon,
  label,
  value,
  delta,
  deltaLabel,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  className,
  onClick,
}: StatsCardProps) {
  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const isNeutral = delta === 0

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-6 shadow-sm',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-indigo-200',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>

          {delta !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              isPositive && 'text-emerald-600',
              isNegative && 'text-red-600',
              isNeutral && 'text-gray-500'
            )}>
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {isNeutral && <Minus className="h-3 w-3" />}
              <span>
                {isPositive && '+'}
                {delta}%
                {deltaLabel && ` ${deltaLabel}`}
              </span>
            </div>
          )}
        </div>

        <div className={cn('p-3 rounded-xl flex-shrink-0', iconBgColor)}>
          <div className={cn('h-6 w-6', iconColor)}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}
