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
          <label
            htmlFor={inputId}
            className="pl-0.5 text-[11px] font-black uppercase tracking-[0.06em] text-[#3D3A36]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="pointer-events-none absolute left-4 text-[#A8A29E]">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-[13px] border border-[rgba(28,25,23,0.11)] bg-white',
              'px-4 py-3.5 text-[15px] font-semibold text-[#1C1917] outline-none',
              'placeholder:font-medium placeholder:text-[#A8A29E]',
              'transition-all duration-150',
              'focus:border-[#1C1917] focus:ring-3 focus:ring-[rgba(28,25,23,0.06)]',
              icon   ? 'pl-11 pr-4' : '',
              suffix ? 'pr-12'      : '',
              error  ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-4 text-[12px] font-bold text-[#78716C]">
              {suffix}
            </div>
          )}
        </div>
        {hint  && !error && <p className="pl-0.5 text-[11.5px] font-medium text-[#A8A29E]">{hint}</p>}
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
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="pl-0.5 text-[11px] font-black uppercase tracking-[0.06em] text-[#3D3A36]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full resize-none rounded-[13px] border border-[rgba(28,25,23,0.11)] bg-white',
          'px-4 py-3.5 text-[15px] font-medium leading-relaxed text-[#1C1917] outline-none',
          'placeholder:font-medium placeholder:text-[#A8A29E]',
          'transition-all duration-150',
          'focus:border-[#1C1917] focus:ring-3 focus:ring-[rgba(28,25,23,0.06)]',
          className
        )}
        {...props}
      />
    </div>
  );
});
Textarea.displayName = 'Textarea';
