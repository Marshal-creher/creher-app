import React from 'react'
import { cn } from '../../lib/utils'
import { Calendar } from 'lucide-react'

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({
    label,
    error,
    hint,
    required,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Calendar className="h-4 w-4" />
          </div>
          <input
            ref={ref}
            id={inputId}
            type="date"
            className={cn(
              'block w-full rounded-lg border bg-white pl-10 pr-3 py-2.5 text-sm text-gray-900',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20',
              props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
