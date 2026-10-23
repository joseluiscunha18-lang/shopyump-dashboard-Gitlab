'use client';

/**
 * Kit partilhado para as páginas demonstrativas (configurações da loja,
 * notificações, clientes, cupons, plano, etc.). Tudo vive em memória:
 * nenhuma destas páginas grava na base de dados, processa pagamentos ou liga
 * domínios. Quando a funcionalidade real existir, substituir o `onSave`
 * demonstrativo pela mutation correspondente em lib/mutations/.
 */

import Link from 'next/link';
import { SheetSelect } from '@/components/ui/SheetSelect';
import { ReactNode, useMemo, useState } from 'react';
import { ChevronRight, FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui/Surfaces';
import { Button } from '@/components/ui/ShopyumpButton';
import { Input, Textarea } from '@/components/ui/ShopyumpInput';
import { Switch } from '@/components/ui/ShopyumpSwitch';
import { useToast } from '@/components/ui/Toast';

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-1">
      {back && (
        <Link href={back.href} className="text-[12px] font-bold text-slate-400 hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function DemoBanner({ children }: { children?: ReactNode }) {
  return (
    <div role="note" className="demo-note">
      
      <span>{children ?? 'Demonstração: as alterações são temporárias, sem operações reais.'}</span>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-2">{children}</div>;
}

export type Field =
  | { kind: 'text' | 'email' | 'tel' | 'url' | 'number'; name: string; label: string; hint?: string; required?: boolean; suffix?: string }
  | { kind: 'textarea'; name: string; label: string; rows?: number }
  | { kind: 'switch'; name: string; label: string; description?: string }
  | { kind: 'select'; name: string; label: string; options: { value: string; label: string }[] };

type Values = Record<string, string | boolean>;

/** Formulário de definições com estado "alterações não guardadas", validação e toast. */
export function SettingsForm({ sections, initial, onSave }: { onSave?: (values:Values)=>void; sections: { title: string; fields: Field[] }[]; initial: Values }) {
  const [saved, setSaved] = useState<Values>(initial);
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { show } = useToast();
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const set = (k: string, v: string | boolean) => setValues((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    sections.flatMap((s) => s.fields).forEach((f) => {
      const v = values[f.name];
      if ('required' in f && f.required && !String(v ?? '').trim()) errs[f.name] = 'Campo obrigatório.';
      if (f.kind === 'email' && v && !/^\S+@\S+\.\S+$/.test(String(v))) errs[f.name] = 'Email inválido.';
    });
    setErrors(errs);
    if (Object.keys(errs).length) return show('Corrige os campos assinalados.', 'error');
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(values);
    onSave?.(values);
    show('Alterações guardadas (demonstração).');
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-0">
      {sections.map((s) => (
        <section key={s.title} className="form-section">
          <h3 className="text-[13px] font-black text-ink">{s.title}</h3>
          {s.fields.map((f) => {
            if (f.kind === 'switch')
              return (
                <div key={f.name} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{f.label}</p>
                    {f.description && <p className="text-[12px] text-slate-400">{f.description}</p>}
                  </div>
                  <Switch checked={Boolean(values[f.name])} onChange={(v) => set(f.name, v)} ariaLabel={f.label} />
                </div>
              );
            if (f.kind === 'textarea')
              return <Textarea key={f.name} name={f.name} label={f.label} rows={f.rows ?? 4} value={String(values[f.name] ?? '')} onChange={(e) => set(f.name, e.target.value)} />;
            if (f.kind === 'select')
              return (
                <div key={f.name} className="flex flex-col gap-1.5">
                  <span className="field-label">{f.label}</span>
                  <SheetSelect value={String(values[f.name] ?? '')} onChange={(v) => set(f.name, v)} options={f.options} title={f.label} ariaLabel={f.label} />
                </div>
              );
            return (
              <Input
                key={f.name}
                name={f.name}
                type={f.kind}
                label={f.label + (f.required ? ' *' : '')}
                hint={f.hint}
                suffix={f.suffix}
                error={errors[f.name]}
                value={String(values[f.name] ?? '')}
                onChange={(e) => set(f.name, e.target.value)}
              />
            );
          })}
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={!dirty} loading={saving}>Guardar alterações</Button>
        {dirty && <Button type="button" variant="ghost" onClick={()=>{setValues(saved);setErrors({})}}>Repor</Button>}
        <span role="status" className="text-xs text-muted-foreground">{dirty?'Alterações por guardar':'Sem alterações pendentes'}</span>
      </div>
    </form>
  );
}

export function LinkList({items}:{items:{href:string;label:string;description:string;icon:ReactNode}[]}){return <div>{items.map(i=><Link key={i.href} href={i.href} className="settings-row"><span className="text-muted-foreground">{i.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{i.label}</span><span className="mt-1 block text-xs text-muted-foreground">{i.description}</span></span><ChevronRight size={17} className="text-muted-foreground"/></Link>)}</div>}
