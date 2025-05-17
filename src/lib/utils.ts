import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return new Intl.DateTimeFormat('en-US').format(date)
}

export function formatCurrency(value: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}