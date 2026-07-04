export function normalizeUserId(userId: string): string {
  return String(userId || '').trim().toLowerCase();
}

export function isValidUserId(userId: string): boolean {
  return /^[a-z0-9._-]{4,30}$/.test(userId);
}

export function formatDateUAE(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // Return DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const x = new Date(dateStr);
  if (isNaN(x.getTime())) return dateStr;
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
}

export function formatAED(amount: number | string): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  return `AED ${(num || 0).toFixed(2)}`;
}

export function sanitizeInput(str: string): string {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '');
}

export function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}
