'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export type Country = { iso: string; name: string; dial: string; flag: string };

export const COUNTRIES: Country[] = [
  { iso: 'MZ', name: 'Moçambique', dial: '258', flag: '🇲🇿' },
  { iso: 'ZA', name: 'África do Sul', dial: '27', flag: '🇿🇦' },
  { iso: 'AO', name: 'Angola', dial: '244', flag: '🇦🇴' },
  { iso: 'BR', name: 'Brasil', dial: '55', flag: '🇧🇷' },
  { iso: 'BW', name: 'Botsuana', dial: '267', flag: '🇧🇼' },
  { iso: 'CV', name: 'Cabo Verde', dial: '238', flag: '🇨🇻' },
  { iso: 'CN', name: 'China', dial: '86', flag: '🇨🇳' },
  { iso: 'AE', name: 'Emirados Árabes Unidos', dial: '971', flag: '🇦🇪' },
  { iso: 'ES', name: 'Espanha', dial: '34', flag: '🇪🇸' },
  { iso: 'US', name: 'Estados Unidos', dial: '1', flag: '🇺🇸' },
  { iso: 'SZ', name: 'Essuatíni', dial: '268', flag: '🇸🇿' },
  { iso: 'FR', name: 'França', dial: '33', flag: '🇫🇷' },
  { iso: 'GW', name: 'Guiné-Bissau', dial: '245', flag: '🇬🇼' },
  { iso: 'IN', name: 'Índia', dial: '91', flag: '🇮🇳' },
  { iso: 'GB', name: 'Reino Unido', dial: '44', flag: '🇬🇧' },
  { iso: 'KE', name: 'Quénia', dial: '254', flag: '🇰🇪' },
  { iso: 'MW', name: 'Malawi', dial: '265', flag: '🇲🇼' },
  { iso: 'NG', name: 'Nigéria', dial: '234', flag: '🇳🇬' },
  { iso: 'PT', name: 'Portugal', dial: '351', flag: '🇵🇹' },
  { iso: 'ST', name: 'São Tomé e Príncipe', dial: '239', flag: '🇸🇹' },
  { iso: 'TZ', name: 'Tanzânia', dial: '255', flag: '🇹🇿' },
  { iso: 'TL', name: 'Timor-Leste', dial: '670', flag: '🇹🇱' },
  { iso: 'ZM', name: 'Zâmbia', dial: '260', flag: '🇿🇲' },
  { iso: 'ZW', name: 'Zimbabué', dial: '263', flag: '🇿🇼' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function CountryPhoneField({ country, onCountry, number, onNumber }: {
  country: Country; onCountry: (c: Country) => void; number: string; onNumber: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = norm(q.trim()).replace(/^\+/, '');
    return t ? COUNTRIES.filter((c) => norm(c.name).includes(t) || c.dial.startsWith(t)) : COUNTRIES;
  }, [q]);

  return (
    <div>
      <label className="mb-2 block text-[14px] font-medium text-foreground">Número de contacto</label>
      <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-foreground/25 bg-card transition-colors focus-within:border-info">
        <button type="button" onClick={() => setOpen(true)} className="flex shrink-0 items-center gap-1.5 border-r border-border px-3 text-[15px] text-foreground" aria-label="Escolher país">
          <span>{country.flag}</span><span className="font-medium">+{country.dial}</span><ChevronDown size={14} className="text-muted-foreground" />
        </button>
        <input type="tel" inputMode="numeric" placeholder="84 000 0000" value={number}
          onChange={(e) => onNumber(e.target.value.replace(/[^\d\s]/g, ''))}
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60" />
      </div>
      {number.replace(/\D/g, '').length > 9 && (
        <p className="mt-1.5 text-[13px] text-destructive">Algo está errado: número inválido.</p>
      )}

      {open && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-foreground/40 sm:items-center" onClick={() => setOpen(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-2xl bg-card sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4">
              <p className="text-[16px] font-semibold text-foreground">Escolher país</p>
              <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X size={18} /></button>
            </div>
            <div className="mx-4 my-3 flex h-11 items-center gap-2 rounded-xl bg-muted px-3">
              <Search size={16} className="text-muted-foreground" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar país ou indicativo"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="overflow-y-auto px-2 pb-4">
              {list.length === 0 && <p className="px-3 py-6 text-center text-[14px] text-muted-foreground">Nenhum país encontrado.</p>}
              {list.map((c) => (
                <button key={c.iso} type="button" onClick={() => { onCountry(c); setOpen(false); setQ(''); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] hover:bg-muted ${c.iso === country.iso ? 'bg-muted' : ''}`}>
                  <span>{c.flag}</span><span className="flex-1 text-foreground">{c.name}</span><span className="text-muted-foreground">+{c.dial}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
