import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, icon, suffix, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-4 text-slate-400 pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 text-[13px] font-semibold text-ink outline-none transition-all shadow-sm',
              'focus:bg-white focus:border-ink focus:ring-4 focus:ring-ink/5',
              icon ? 'pl-11 pr-4' : 'px-4',
              suffix ? 'pr-11' : '',
              error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
              className
            )}
            {...props}
          />
          {suffix && <div className="absolute right-4 text-slate-400">{suffix}</div>}
        </div>
        {hint && !error && <p className="text-[11px] font-medium text-slate-400 pl-1">{hint}</p>}
        {error && <p className="text-[11px] font-bold text-red-500 pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-slate-50 border border-transparent rounded-2xl px-4 py-3.5 text-[13px] font-medium text-ink outline-none transition-all shadow-sm resize-none',
            'focus:bg-white focus:border-ink focus:ring-4 focus:ring-ink/5',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
