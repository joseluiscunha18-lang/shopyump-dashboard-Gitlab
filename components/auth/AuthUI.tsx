'use client';

import { forwardRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function AuthHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-7">
      {eyebrow && <p className="mb-2 text-[13px] font-semibold text-muted-foreground">{eyebrow}</p>}
      <h1 className="text-[26px] leading-[1.2] font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-2 text-[17px] leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function AuthButton({ loading, variant = 'primary', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'outline' | 'ghost' }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'w-full h-[56px] rounded-xl text-[18px] font-semibold flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:active:scale-100',
        loading ? 'cursor-wait' : variant === 'primary' ? 'disabled:cursor-not-allowed' : 'disabled:opacity-45',
        variant === 'primary' && 'bg-foreground text-background',
        variant === 'outline' && 'bg-transparent text-foreground border border-foreground/25',
        variant === 'outline' && loading && 'bg-foreground/[0.06] border-foreground/30',
        variant === 'ghost' && 'h-11 text-muted-foreground',
        className,
      )}
    >
      {loading && <Loader2 className="animate-spin" size={20} strokeWidth={2.5} />}
      {children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string; invalid?: boolean };

function EyeClosedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 10c2.5 3.5 5.5 5 9 5s6.5-1.5 9-5" />
      <path d="M6 13.2 4.8 15M10 14.8l-.4 2M14 14.8l.4 2M18 13.2l1.2 1.8" />
    </svg>
  );
}

export const AuthField = forwardRef<HTMLInputElement, FieldProps>(({ label, hint, error, invalid, type, className, ...rest }, ref) => {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  const bad = invalid || !!error;
  return (
    <label className="block">
      <span className="block mb-2 text-[17px] font-semibold text-foreground">{label}</span>
      <span className="relative block">
        <input
          ref={ref}
          type={isPw && show ? 'text' : type}
          className={cn(
            'w-full h-[58px] rounded-xl border focus:border-[1.25px] bg-transparent px-4 text-[18px] text-foreground outline-none transition-colors placeholder:text-foreground/55',
            bad ? 'border-destructive focus:border-destructive' : 'border-foreground/25 focus:border-info',
            isPw && 'pr-12',
            className,
          )}
          {...rest}
        />
        {isPw && (
          <button type="button" tabIndex={-1} onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-foreground/70">
            {show ? <Eye size={20} /> : <EyeClosedIcon />}
          </button>
        )}
      </span>
      {error ? <span className="block mt-2 text-[14px] text-destructive">{error}</span> : hint ? <span className="block mt-2 text-[14px] text-foreground/70">{hint}</span> : null}
    </label>
  );
});
AuthField.displayName = 'AuthField';

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Voltar" className="-ml-2 mb-4 w-10 h-10 rounded-full flex items-center justify-center text-foreground active:bg-muted">
      <ArrowLeft size={20} />
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
