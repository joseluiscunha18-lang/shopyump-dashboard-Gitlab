'use client';

import { SheetSelect, optionsFromChildren } from '@/components/ui/SheetSelect';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/lib/router-compat';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/ShopyumpButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

type HeaderCtx = { slot: HTMLElement | null; setDirty: (d: boolean) => void };
const SettingsHeaderContext = createContext<HeaderCtx | null>(null);

/** Ação do cabeçalho contextual (lado direito). Só renderiza dentro de SettingsPage. */
export function HeaderAction({ children }: { children: ReactNode }) {
  const ctx = useContext(SettingsHeaderContext);
  return ctx?.slot ? createPortal(children, ctx.slot) : null;
}

/** Informa o cabeçalho de que há alterações por guardar (ativa a confirmação ao voltar). */
export function useReportDirty(dirty: boolean) {
  const ctx = useContext(SettingsHeaderContext);
  useEffect(() => { ctx?.setDirty(dirty); return () => ctx?.setDirty(false); }, [dirty, ctx]);
}

/** Versão em componente de useReportDirty, para páginas com ações próprias. */
export function DirtyReporter({ dirty }: { dirty: boolean }) { useReportDirty(dirty); return null; }

/**
 * Moldura das páginas individuais de Configurações: cabeçalho contextual
 * (seta, título, ação Guardar) que substitui o cabeçalho global nestas rotas.
 */
export function SettingsPage({ title, intro, children, back = true, backTo = '/configuracoes', backLabel = 'Voltar às configurações' }: {
  title: string; intro?: string; children: ReactNode; back?: boolean; backTo?: string; backLabel?: string;
}) {
  const navigate = useNavigate();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ctx = useMemo(() => ({ slot, setDirty }), [slot]);
  const leave = () => navigate({ to: backTo });

  if (!back) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-28 pt-2">
        <header className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">{title}</h1>
          {intro && <p className="text-[15px] leading-relaxed text-muted-foreground">{intro}</p>}
        </header>
        {children}
      </div>
    );
  }

  return (
    <SettingsHeaderContext.Provider value={ctx}>
      <header className="settings-header">
        <button type="button" aria-label={backLabel} title={backLabel} onClick={() => (dirty ? setConfirm(true) : leave())}
          className="-ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted">
          <ChevronLeft size={26} strokeWidth={2} aria-hidden />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-foreground">{title}</h1>
        <div ref={setSlot} className="flex min-h-11 shrink-0 items-center gap-2" />
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-16 pt-4">
        {intro && <p className="text-[15px] leading-relaxed text-muted-foreground">{intro}</p>}
        {children}
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); leave(); }}
        title="Sair sem guardar?" description="Tens alterações por guardar. Se saíres agora, vais perdê-las."
        cancelLabel="Continuar a editar" confirmLabel="Sair sem guardar" danger />
    </SettingsHeaderContext.Provider>
  );
}

export function Section({ title, description, children, aside, footer }: { title: string; description?: string; children: ReactNode; aside?: ReactNode; footer?: ReactNode }) {
  return (
    <section className="flex flex-col">
      <div className="flex items-end justify-between gap-4 px-1 pb-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="flex flex-col gap-5 p-5 sm:p-6">{children}</div>
        {footer && <div className="border-t border-border/70 bg-muted/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground sm:px-6">{footer}</div>}
      </div>
    </section>
  );
}

export function ToggleRow({ label, description, checked, onChange, disabled }: { label: string; description?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', disabled && 'opacity-60')}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-foreground">{label}</span>
        {description && <span className="text-sm leading-relaxed text-muted-foreground">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed', checked ? 'bg-info' : 'bg-muted-foreground/30')}
      >
        <span className={cn('h-5 w-5 rounded-full bg-background shadow transition-transform', checked ? 'translate-x-[23px]' : 'translate-x-[3px]')} />
      </button>
    </div>
  );
}

export function FieldSelect({ label, value, onChange, children, hint, id }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; hint?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="pl-0.5 text-[13px] font-semibold text-foreground">{label}</label>
      <SheetSelect id={id} value={value} onChange={onChange} options={optionsFromChildren(children)} title={label} />
      {hint && <p className="pl-0.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: 'ok' | 'muted' | 'warn'; children: ReactNode }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      tone === 'ok' && 'bg-primary/10 text-primary',
      tone === 'muted' && 'bg-muted text-muted-foreground',
      tone === 'warn' && 'bg-destructive/10 text-destructive')}>{children}</span>
  );
}

/**
 * Rascunho local de um valor partilhado: indica alterações pendentes, avisa
 * antes de sair da página e só escreve na fonte comum ao guardar.
 */
export function useDraft<T>(source: T, commit: (v: T) => void) {
  const [draft, setDraft] = useState<T>(source);
  const [base, setBase] = useState<T>(source);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(base), [draft, base]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  const patch = (p: Partial<T>) => setDraft((d) => ({ ...d, ...p }));
  const save = (value: T = draft) => { commit(value); setBase(value); setDraft(value); };
  const reset = () => setDraft(base);
  return { draft, setDraft, patch, dirty, save, reset };
}

/**
 * Botão «Guardar» do cabeçalho contextual: só aparece com alterações por
 * guardar. `onSave` devolve false quando a validação falha (mantém o rascunho).
 * `onReset` mantém-se na assinatura para compatibilidade com as páginas.
 */
export function SaveBar({ dirty, onSave }: { dirty: boolean; onSave: () => boolean | void | Promise<boolean | void>; onReset?: () => void }) {
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  useReportDirty(dirty);
  async function handle() {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await onSave();
      if (ok === false) return show('Corrige os campos assinalados.', 'error');
      show('Alterações guardadas.');
    } catch {
      show('Não foi possível guardar. Tenta novamente.', 'error');
    } finally {
      setSaving(false);
    }
  }
  if (!dirty) return null;
  return <HeaderAction><Button type="button" size="sm" loading={saving} onClick={handle}>Guardar</Button></HeaderAction>;
}
