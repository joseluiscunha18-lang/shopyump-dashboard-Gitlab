import { CURRENCIES, type CurrencyCode } from './model';

export const STORE_NAME_MIN = 2;
export const STORE_NAME_MAX = 60;

export function validateStoreName(v: string): string | null {
  const t = v.trim();
  if (!t) return 'Indica o nome da loja.';
  if (t.length < STORE_NAME_MIN) return `Usa pelo menos ${STORE_NAME_MIN} caracteres.`;
  if (t.length > STORE_NAME_MAX) return `Usa no máximo ${STORE_NAME_MAX} caracteres.`;
  return null;
}

/** Remove espaços, hífenes e parênteses; mantém o "+" inicial. */
export function normalizePhone(v: string): string {
  const t = v.trim();
  return (t.startsWith('+') ? '+' : '') + t.replace(/\D/g, '');
}

/** Número internacional E.164: "+" e 8 a 15 dígitos. Vazio é aceite (campo opcional). */
export function validateInternationalPhone(v: string): string | null {
  if (!v.trim()) return null;
  const n = normalizePhone(v);
  if (!n.startsWith('+')) return 'Inclui o indicativo do país, por exemplo +258.';
  if (!/^\+[1-9]\d{7,14}$/.test(n)) return 'Número inválido. Verifica os dígitos.';
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v.trim()) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'E-mail inválido.';
}

/** Aceita "instagram.com/x" e acrescenta https://. Devolve null se inválido. */
export function normalizeUrl(v: string): string | null {
  const t = v.trim();
  if (!t) return '';
  const withProto = /^[a-z]+:\/\//i.test(t) ? t : 'https://' + t;
  try {
    const u = new URL(withProto);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function validateMoney(v: string): string | null {
  if (!v.trim()) return 'Indica o custo (0 para grátis).';
  const n = Number(v.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 'Valor inválido.';
  if (n > 1_000_000) return 'Valor demasiado alto.';
  return null;
}

export function whatsappLink(phone: string, message = ''): string | null {
  if (!phone || validateInternationalPhone(phone)) return null;
  const digits = normalizePhone(phone).slice(1);
  return `https://wa.me/${digits}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`;
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  const c = CURRENCIES.find((x) => x.code === currency) ?? CURRENCIES[0]!;
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  const grouped = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return currency === 'MZN' ? `${grouped} MT` : `${c.symbol} ${grouped}`;
}

/** Uma página só pode ser publicada com conteúdo. */
export function canPublishPage(text: string): boolean {
  return text.trim().length > 0;
}

export const DELETION_GRACE_DAYS = 30;
export function scheduleDeletionDate(from: Date): Date {
  const d = new Date(from); d.setDate(d.getDate() + DELETION_GRACE_DAYS); return d;
}
