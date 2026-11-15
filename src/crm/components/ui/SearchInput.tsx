import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  autoFocus?: boolean
}

export function SearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue || '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== internalValue) {
      setInternalValue(externalValue)
    }
  }, [externalValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }

  const handleClear = () => {
    setInternalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-9 py-2.5 text-sm',
          'text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
          'transition-colors duration-150'
        )}
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
