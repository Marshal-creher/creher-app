import React from 'react'
import { cn } from '../../lib/utils'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export interface Column<T extends object> {
  key: keyof T | string
  header: React.ReactNode
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface TableProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  skeletonRows?: number
  className?: string
  rowKey?: (row: T) => string | number
}

export function Table<T extends object>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Aucun résultat trouvé',
  onSort,
  sortKey,
  sortDirection,
  skeletonRows = 5,
  className,
  rowKey,
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return
    if (sortKey === key) {
      onSort(key, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(key, 'asc')
    }
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 shadow-sm', className)}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                  col.sortable && onSort && 'cursor-pointer hover:bg-gray-100 select-none',
                  col.headerClassName
                )}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && onSort && (
                    <span className="text-gray-400">
                      {sortKey === String(col.key) ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row) : idx}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('px-4 py-3 text-gray-700', col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
