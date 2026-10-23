/**
 * Modelos tipados das Configurações da loja.
 *
 * Estado TEMPORÁRIO: os valores vivem em memória (DashboardState) durante a
 * sessão do navegador. Recarregar a página repõe os valores iniciais. A
 * persistência real por loja deve substituir `settingsService` sem alterar
 * as páginas.
 */

export type StoreData = { nome: string; provincia: string; cidade: string; endereco: string };

export type TimeRange = { abertura: string; fecho: string };
export type DaySchedule = { aberto: boolean; periodos: TimeRange[] };
/** Índice 0 = domingo … 6 = sábado. Só informa o atendimento; nunca bloqueia compras. */
export type BusinessHours = DaySchedule[];
export const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export function defaultBusinessHours(): BusinessHours {
  return WEEKDAYS.map((_, i) => ({ aberto: i >= 1 && i <= 5, periodos: [{ abertura: '09:00', fecho: '18:00' }] }));
}
export function formatBusinessHours(h: BusinessHours): string {
  return h.map((d, i) => d.aberto ? `${WEEKDAYS[i]} ${d.periodos.map((p) => `${p.abertura}–${p.fecho}`).join(', ')}` : null).filter(Boolean).join('; ');
}
export type StoreStatus = { ativa: boolean; eliminacaoEm: string | null; ativaAntesEliminacao: boolean };
export type Contacts = {
  whatsapp: string;
  mensagemWhatsapp: string;
  telefone: string;
  email: string;
  horarioAtivo: boolean;
  horario: BusinessHours;
};

export type CurrencyCode = 'MZN' | 'ZAR' | 'USD' | 'EUR';
export type Region = { pais: string; idioma: 'pt'; moeda: CurrencyCode; fuso: string };

export type DeliveryZone = { id: string; nome: string; areas: string; custo: number; prazo: string };
export type Delivery = {
  domicilio: boolean;
  zonas: DeliveryZone[];
  levantamento: boolean;
  localLevantamento: string;
  instrucoesLevantamento: string;
};

export type Checkout = { whatsapp: boolean };

export type Payments = {
  transferencia: boolean;
  banco: string;
  titular: string;
  conta: string;
  instrucoesTransferencia: string;
  dinheiroEntrega: boolean;
  instrucoesDinheiro: string;
};

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'MZN', label: 'Metical moçambicano', symbol: 'MT' },
  { code: 'ZAR', label: 'Rand sul-africano', symbol: 'R' },
  { code: 'USD', label: 'Dólar norte-americano', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
];

export const PUBLIC_LANGUAGES = [{ code: 'pt' as const, label: 'Português' }];

export const PROVINCES: Record<string, string[]> = {
  MZ: ['Cabo Delgado', 'Gaza', 'Inhambane', 'Manica', 'Maputo Cidade', 'Maputo Província', 'Nampula', 'Niassa', 'Sofala', 'Tete', 'Zambézia'],
};

export const DEFAULT_TIMEZONE_BY_COUNTRY: Record<string, string> = {
  MZ: 'Africa/Maputo', ZA: 'Africa/Johannesburg', PT: 'Europe/Lisbon', AO: 'Africa/Luanda', BR: 'America/Sao_Paulo',
  ZW: 'Africa/Harare', MW: 'Africa/Blantyre', TZ: 'Africa/Dar_es_Salaam', SZ: 'Africa/Mbabane', US: 'America/New_York', GB: 'Europe/London',
};

const ISO = 'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');

export function countryOptions(): { code: string; label: string }[] {
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames(['pt-PT', 'pt'], { type: 'region' }); } catch { names = null; }
  return ISO.map((code) => ({ code, label: names?.of(code) ?? code })).sort((a, b) => a.label.localeCompare(b.label, 'pt'));
}

const FALLBACK_TZ = ['Africa/Maputo', 'Africa/Johannesburg', 'Africa/Harare', 'Africa/Luanda', 'Africa/Nairobi', 'Africa/Lagos', 'Europe/Lisbon', 'Europe/London', 'America/Sao_Paulo', 'America/New_York', 'UTC'];
export function timezoneOptions(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  try { return intl.supportedValuesOf?.('timeZone') ?? FALLBACK_TZ; } catch { return FALLBACK_TZ; }
}
export function timezoneLabel(tz: string): string {
  return tz.replace(/_/g, ' ').replace('/', ' — ');
}

/** Contactos que a loja pública mostra: só os campos preenchidos. */
export function publicContactChannels(c: Contacts) {
  const v = (x: string) => x.trim() || undefined;
  return {
    whatsapp: v(c.whatsapp),
    mensagemWhatsapp: c.whatsapp.trim() ? v(c.mensagemWhatsapp) : undefined,
    telefone: v(c.telefone),
    email: v(c.email),
    horario: c.horarioAtivo ? formatBusinessHours(c.horario) || undefined : undefined,
  };
}
