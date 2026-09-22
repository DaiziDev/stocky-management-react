import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from './utils';

export { formatCurrency, formatDate, formatDateTime, formatRelativeTime };

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatQuantity(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatStockStatus(quantity: number, threshold: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (quantity <= 0) return { label: 'Rupture', variant: 'danger' };
  if (quantity <= threshold) return { label: 'Stock faible', variant: 'warning' };
  return { label: 'En stock', variant: 'success' };
}

export function formatOrderStatus(status: string): { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
    PENDING: { label: 'En attente', variant: 'warning' },
    CONFIRMED: { label: 'Confirmé', variant: 'info' },
    PROCESSING: { label: 'En préparation', variant: 'info' },
    SHIPPED: { label: 'Expédié', variant: 'info' },
    DELIVERED: { label: 'Livré', variant: 'success' },
    CANCELLED: { label: 'Annulé', variant: 'danger' },
    RETURNED: { label: 'Retourné', variant: 'danger' },
  };
  return statusMap[status] || { label: status, variant: 'default' };
}

export function formatPaymentStatus(status: string): { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
    PENDING: { label: 'En attente', variant: 'warning' },
    PAID: { label: 'Payé', variant: 'success' },
    PARTIAL: { label: 'Partiel', variant: 'info' },
    REFUNDED: { label: 'Remboursé', variant: 'info' },
    FAILED: { label: 'Échoué', variant: 'danger' },
  };
  return statusMap[status] || { label: status, variant: 'default' };
}