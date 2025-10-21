import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Normaliza los datos de balance de Laudus API a formato consistente
 * Maneja las diferencias entre totals, standard y 8Columns
 */
export function normalizeBalanceData(item: any): any {
  if (!item) return item;
  
  // Calcular balance si no existe
  const balance = item.balance ?? (
    (item.debitBalance ?? 0) - (item.creditBalance ?? 0)
  );
  
  // El accountCode siempre viene como accountNumber de Laudus
  const accountCode = item.accountNumber || item.accountCode || '';
  
  return {
    ...item, // Mantener todos los campos originales
    // Campos normalizados (sobrescriben los originales)
    accountCode,
    accountName: item.accountName || '',
    debit: item.debit ?? 0,
    credit: item.credit ?? 0,
    balance,
  };
}
