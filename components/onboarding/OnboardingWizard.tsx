'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { completeOnboarding } from '@/lib/mutations/loja';
import { getSlugsOcupados } from '@/lib/queries/loja';
import { invalidarUserContext } from '@/lib/auth/getUserContext';
import { createClient } from '@/lib/supabase/client';
import { isReservedSubdomain, isValidSubdomain } from '@/lib/domains';
import { AuthButton, AuthField, AuthHeading } from '@/components/auth/AuthUI';
import { COUNTRIES, CountryPhoneField, type Country } from './CountryPhoneField';

const LAST = 3;
const DOMAIN = 'shopyump.com';
const slugify = (v: string) => v.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
/** Endereço utilizável: válido como subdomínio, não reservado e (confirmado na base de dados) não ocupado. */
const isUsable = (s: string, taken: Set<string>) => s.length >= 2 && isValidSubdomain(s) && !isReservedSubdomain(s) && !taken.has(s);

/** Nome próprio / apelido: aceita acentos, nomes compostos e várias palavras; exige pelo menos 2 letras. */
const nameOk = (v: string) => v.replace(/[^\p{L}]/gu, '').length >= 2;
const collapse = (v: string) => v.replace(/\s+/g, ' ').trim();
/** Primeiro valor de texto não vazio entre as chaves indicadas (dados da conta). */
const pick = (m: Record<string, unknown>, keys: string[]) =>
  (keys.map((k) => m[k]).find((v) => typeof v === 'string' && v.trim()) as string | undefined)?.trim();

const candidatos = (base: string) => [`${base}-shop`, `loja-${base}`, `${base}-store`, `${base}-24`, `${base}-27`, `${base}-mz`];

function suggestions(base: string, taken: Set<string>): string[] {
  const out: string[] = [];
  for (const c of candidatos(base)) {
    if (isUsable(c, taken) && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  return out;
}

const GOALS = [
  { value: 'fisicos', label: 'Vender produtos físicos', desc: 'Produtos físicos, encomendas e vendas online.' },
  { value: 'digitais', label: 'Vender produtos digitais', desc: 'E-books, cursos, jogos e outros conteúdos digitais.' },
  { value: 'gerir', label: 'Gerir o meu negócio', desc: 'Gerenciar produtos, vendas e pedidos num só lugar.' },
  { value: 'dropshipping', label: 'Fazer dropshipping', desc: 'Vender sem manter stock próprio.' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  // Endereços que a base de dados já tem ocupados (verificado enquanto escreve).
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);

  // Pré-preenche só se a conta já trouxer nome próprio E apelido (ex.: Google). Nunca deduz do e-mail.
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const m = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
      const f = pick(m, ['first_name', 'given_name', 'primeiro_nome']);
      const l = pick(m, ['last_name', 'family_name', 'apelido']);
      if (f && l) {
        setFirstName((cur) => cur || f);
        setLastName((cur) => cur || l);
      }
    });
  }, []);
  const [whatsapp, setWhatsapp] = useState('');
  const [firstTouched, setFirstTouched] = useState(false);
  const [lastTouched, setLastTouched] = useState(false);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]!);
  const [goals, setGoals] = useState<string[]>([]);
  const [shopName, setShopName] = useState('');
  const [chosen, setChosen] = useState('');
  const [custom, setCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const base = useMemo(() => slugify(shopName), [shopName]);
  const baseFree = isUsable(base, taken);
  const alts = useMemo(() => (base.length >= 2 && !baseFree ? suggestions(base, taken) : []), [base, baseFree, taken]);

  // Confirma na base de dados que o endereço (e as alternativas) estão livres.
  useEffect(() => {
    if (step !== 3 || base.length < 2) return;
    let cancelado = false;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const ocupados = await getSlugsOcupados([base, ...candidatos(base)]);
        if (!cancelado) setTaken((prev) => new Set([...prev, ...ocupados]));
      } catch { /* sem rede: a verificação final acontece ao finalizar */ }
      if (!cancelado) setChecking(false);
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [base, step]);

  // Endereço personalizado: confirma também o que foi escrito à mão.
  useEffect(() => {
    if (!custom || chosen.length < 2 || taken.has(chosen)) return;
    let cancelado = false;
    const t = setTimeout(async () => {
      try {
        const ocupados = await getSlugsOcupados([chosen]);
        if (!cancelado && ocupados.length) setTaken((prev) => new Set([...prev, ...ocupados]));
      } catch { /* idem */ }
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [custom, chosen, taken]);

  // Quando o nome muda, propõe o endereço automaticamente (sem mexer no nome).
  useEffect(() => {
    if (custom) return;
    setChosen(baseFree ? base : alts[0] ?? '');
  }, [base, baseFree, alts, custom]);

  const address = chosen;
  const addressFree = isUsable(address, taken);

  async function finish() {
    setError('');
    setLoading(true);
    // Nome da pessoa e objetivos ficam nos dados da conta (sem alterar tabelas).
    // first_name também alimenta a saudação do e-mail de boas-vindas.
    const first = collapse(firstName);
    const last = collapse(lastName);
    await createClient().auth.updateUser({ data: { first_name: first, last_name: last, nome_completo: `${first} ${last}`, objetivos: goals } });
    const res = await completeOnboarding({
      nome: shopName.trim(),
      whatsapp: `+${country.dial}${whatsapp.replace(/\D/g, '')}`,
      slug: address,
    });
    if (!res.ok) {
      setLoading(false);
      // Endereço ocupado entretanto: marca-o e deixa o utilizador escolher outro.
      if (res.error?.includes('já está em uso')) setTaken((prev) => new Set([...prev, address]));
      setError(res.error ?? 'Não foi possível criar a loja. Tente novamente.');
      return;
    }
    invalidarUserContext();
    router.push('/');
    router.refresh();
  }

  const firstOk = nameOk(firstName);
  const lastOk = nameOk(lastName);
  const canNext =
    step === 1 ? firstOk && lastOk && whatsapp.replace(/\D/g, '').length === 9 :
    step === 2 ? goals.length > 0 : shopName.trim().length >= 3 && addressFree;

  return (
    <div className="flex-1 flex flex-col pb-[40vh] sm:pb-0"
      onFocusCapture={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }}>
      <div className="mb-8 flex h-10 items-center gap-1">
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)} aria-label="Voltar" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground active:bg-muted">
            <ArrowLeft size={20} />
          </button>
        )}
        <span className="text-[17px] font-black tracking-tight text-foreground">Shopyump</span>
      </div>

      <div>
        {step === 1 && (
          <>
            <AuthHeading title="Vamos começar!" subtitle="Primeiro, queremos conhecer um pouco sobre si." />
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 items-start gap-3">
                <div className="min-w-0">
                  <AuthField label="Nome próprio" autoComplete="given-name" autoCapitalize="words" placeholder="Ana" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setFirstTouched(true)} className="px-3.5"
                    error={firstTouched && firstName.trim().length > 0 && !firstOk ? 'Escreva o nome próprio.' : undefined} />
                </div>
                <div className="min-w-0">
                  <AuthField label="Apelido" autoComplete="family-name" autoCapitalize="words" placeholder="Machava" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setLastTouched(true)} className="px-3.5"
                    error={lastTouched && lastName.trim().length > 0 && !lastOk ? 'Escreva o apelido.' : undefined} />
                </div>
              </div>
              <CountryPhoneField country={country} onCountry={setCountry} number={whatsapp} onNumber={setWhatsapp} />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <AuthHeading title="Como pretende usar a Shopyump?" subtitle="Escolha uma ou mais opções que melhor descrevam o seu negócio." />
            <div className="grid grid-cols-1 gap-2.5" role="group">
              {GOALS.map((o) => {
                const on = goals.includes(o.value);
                return (
                  <button key={o.value} type="button" aria-pressed={on}
                    onClick={() => setGoals(on ? goals.filter((g) => g !== o.value) : [...goals, o.value])}
                    className={cn('flex items-center gap-3.5 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors', on ? 'border-info ring-[0.5px] ring-info' : 'border-foreground/25 hover:border-foreground/40')}>
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]', on ? 'border-info bg-info text-background' : 'border-foreground/30')}>
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-foreground">{o.label}</span>
                      <span className="block text-[13px] text-muted-foreground">{o.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <AuthHeading title="Dê um nome à sua loja" subtitle="Escolha o nome para a sua loja online." />
            <AuthField label="Nome da loja" placeholder="Ana Maria" autoFocus value={shopName}
              error={shopName.trim().length > 0 && shopName.trim().length < 3 ? "O nome deve ter pelo menos 3 letras." : undefined}
              onChange={(e) => { setShopName(e.target.value); setCustom(false); }} />

            {base.length >= 2 && !custom && baseFree && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <span className="truncate text-[15px]">
                  <span className="font-semibold text-foreground">{base}</span>
                  <span className="text-muted-foreground">.{DOMAIN}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[12px] font-medium text-success">
                  <Check size={12} strokeWidth={3} />Disponível
                </span>
              </div>
            )}

            {base.length >= 2 && !baseFree && !custom && (
              <div className="mt-4" ref={(el) => { if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150); }}>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <span className="truncate text-[15px]">
                    <span className="font-semibold text-foreground">{base}</span>
                    <span className="text-muted-foreground">.{DOMAIN}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[12px] font-medium text-destructive">Indisponível</span>
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  O nome comercial continua a ser {shopName.trim()}. Escolha uma das opções abaixo:
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {alts.map((s, i) => {
                    const on = chosen === s;
                    return (
                      <button key={s} type="button" onClick={() => setChosen(s)}
                        className={cn('flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors', on ? 'border-info ring-[0.5px] ring-info' : 'border-foreground/25')}>
                        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]', on ? 'border-info' : 'border-foreground/30')}>
                          {on && <span className="h-2.5 w-2.5 rounded-full bg-info" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px]">
                          <span className="font-semibold text-foreground">{s}</span>
                          <span className="text-muted-foreground">.{DOMAIN}</span>
                        </span>
                        {i === 0 && <span className="shrink-0 rounded-full bg-info/10 px-2 py-0.5 text-[12px] font-medium text-info">Sugerido</span>}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => { setCustom(true); setChosen(''); }} className="mt-3 text-[14px] font-medium text-info">
                  Personalizar endereço
                </button>
              </div>
            )}

            {custom && (
              <div className="mt-4">
                <label className="mb-2 block text-[14px] font-medium text-foreground">Endereço da loja</label>
                <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-foreground/25 bg-card transition-colors focus-within:border-info">
                  <input autoFocus value={chosen} placeholder="anamaria" onChange={(e) => setChosen(slugify(e.target.value))}
                    className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60" />
                  <span className="flex items-center pr-3 text-[15px] text-muted-foreground">.{DOMAIN}</span>
                </div>
                {chosen.length >= 2 && (
                  <p className={cn('mt-2 text-[13px] font-medium', addressFree ? 'text-success' : 'text-destructive')}>
                    {addressFree ? 'Disponível' : 'Este endereço já está a ser usado'}
                  </p>
                )}
                <button type="button" onClick={() => setCustom(false)} className="mt-2 text-[14px] font-medium text-info">
                  Ver sugestões
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8">
        {error && <p className="mb-3 text-[14px] text-destructive" role="alert">{error}</p>}
        <AuthButton loading={loading} disabled={!canNext || (step === 3 && checking && !addressFree)} onClick={() => (step < LAST ? setStep(step + 1) : finish())}>
          {step < LAST ? 'Continuar' : 'Finalizar'}
        </AuthButton>
      </div>
    </div>
  );
}
