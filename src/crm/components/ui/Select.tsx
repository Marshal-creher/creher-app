import React from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    hint,
    options,
    placeholder,
    required,
    className,
    id,
    ...props
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900',
              'appearance-none pr-10 transition-colors duration-150',
              'focus:outline-none focus:ring-2',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20',
              props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = 'Select'
