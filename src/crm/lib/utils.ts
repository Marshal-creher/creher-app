import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, parseISO, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Merge Tailwind classes intelligently
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a date in French short format (dd/MM/yyyy)
 */
export function formatDate(date: string | Date | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: fr })
  } catch {
    return String(date)
  }
}

/**
 * Format a date in French long format
 */
export function formatDateFr(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'le dd MMMM yyyy', { locale: fr })
  } catch {
    return String(date)
  }
}

/**
 * Format a date as relative time in French
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistance(d, new Date(), { locale: fr, addSuffix: true })
  } catch {
    return String(date)
  }
}

/**
 * Format currency in Moroccan Dirham
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' MAD'
}

/**
 * Get initials from first name and last name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}`
}

/**
 * Calculate days until a given date
 */
export function daysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return differenceInDays(d, new Date())
  } catch {
    return 0
  }
}

/**
 * Get French label for contract type
 */
export function getContractTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CDI: 'Contrat à Durée Indéterminée',
    CDD: 'Contrat à Durée Déterminée',
    PERIODE_ESSAI: 'Période d\'Essai',
  }
  return labels[type] || type
}

/**
 * Get short label for contract type
 */
export function getContractTypeShortLabel(type: string): string {
  const labels: Record<string, string> = {
    CDI: 'CDI',
    CDD: 'CDD',
    PERIODE_ESSAI: 'Essai',
  }
  return labels[type] || type
}

/**
 * Get Tailwind color classes for employee status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIF: 'bg-emerald-100 text-emerald-800',
    SUSPENDU: 'bg-amber-100 text-amber-800',
    TERMINE: 'bg-red-100 text-red-800',
    EN_ATTENTE: 'bg-amber-100 text-amber-800',
    APPROUVE: 'bg-emerald-100 text-emerald-800',
    REFUSE: 'bg-red-100 text-red-800',
    ANNULE: 'bg-gray-100 text-gray-700',
    BROUILLON: 'bg-gray-100 text-gray-700',
    CALCULE: 'bg-blue-100 text-blue-800',
    PAYE: 'bg-emerald-100 text-emerald-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Get French label for status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIF: 'Actif',
    SUSPENDU: 'Suspendu',
    TERMINE: 'Terminé',
    EN_ATTENTE: 'En attente',
    APPROUVE: 'Approuvé',
    REFUSE: 'Refusé',
    ANNULE: 'Annulé',
    BROUILLON: 'Brouillon',
    CALCULE: 'Calculé',
    PAYE: 'Payé',
    M: 'Masculin',
    F: 'Féminin',
  }
  return labels[status] || status
}

/**
 * Get urgency color class based on days remaining
 */
export function getUrgencyColor(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'text-red-700 bg-red-50 border-red-200'
  if (daysRemaining <= 7) return 'text-red-600 bg-red-50 border-red-200'
  if (daysRemaining <= 15) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-blue-600 bg-blue-50 border-blue-200'
}

/**
 * Truncate text to a given length
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
