// Currency formatting utilities for Nepal (Rupees)

export function formatCurrency(num: number | undefined): string {
  if (num === undefined) return 'Rs. 0';
  return `Rs. ${num.toFixed(2)}`;
}

export function formatNumber(num: number | undefined): string {
  if (num === undefined) return '0';
  return new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(num);
}

export function formatPercentage(num: number | undefined): string {
  if (num === undefined) return '0.00%';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}