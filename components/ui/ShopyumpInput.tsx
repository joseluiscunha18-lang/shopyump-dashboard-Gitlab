'use client';

import { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';
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
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="pl-0.5 text-[13px] font-semibold text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="pointer-events-none absolute left-4 text-foreground">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-md border border-border bg-card',
              'px-4 py-3.5 text-[15px] font-normal text-foreground outline-none',
              'placeholder:font-normal placeholder:text-muted-foreground',
              'transition-all duration-150',
              'hover:border-border',
              'focus:border-border focus:ring-3 focus:ring-primary/10',
              icon   ? 'pl-11 pr-4' : '',
              suffix ? 'pr-14'      : '',
              error  ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-4 text-[13px] font-bold text-foreground">
              {suffix}
            </div>
          )}
        </div>
        {hint  && !error && <p className="pl-0.5 text-xs text-muted-foreground">{hint}</p>}
        {error &&           <p className="pl-0.5 text-[11.5px] font-bold text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(({ className, label, id, ...props }, ref) => {
  const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="pl-0.5 text-[13px] font-semibold text-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full resize-none rounded-md border border-border bg-card',
          'px-4 py-3.5 text-[15px] font-normal leading-relaxed text-foreground outline-none',
          'placeholder:font-normal placeholder:text-muted-foreground',
          'transition-all duration-150',
          'hover:border-border',
          'focus:border-border focus:ring-3 focus:ring-primary/10',
          className
        )}
        {...props}
      />
    </div>
  );
});
Textarea.displayName = 'Textarea';
