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
            className="pl-0.5 text-[11px] font-black uppercase tracking-[0.06em] text-[#44403C]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="pointer-events-none absolute left-4 text-[#9CA3AF]">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-[13px] border border-[#D4D2CF] bg-[#F4F4F3]',
              'px-4 py-3.5 text-[15px] font-semibold text-[#111110] outline-none',
              'placeholder:font-normal placeholder:text-[#9CA3AF]',
              'transition-all duration-150',
              'focus:border-[#111110] focus:bg-white focus:ring-3 focus:ring-[rgba(17,17,16,0.08)]',
              icon   ? 'pl-11 pr-4' : '',
              suffix ? 'pr-14'      : '',
              error  ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-4 text-[13px] font-bold text-[#6B7280]">
              {suffix}
            </div>
          )}
        </div>
        {hint  && !error && <p className="pl-0.5 text-[11.5px] font-medium text-[#9CA3AF]">{hint}</p>}
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
          className="pl-0.5 text-[11px] font-black uppercase tracking-[0.06em] text-[#44403C]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full resize-none rounded-[13px] border border-[#D4D2CF] bg-[#F4F4F3]',
          'px-4 py-3.5 text-[15px] font-normal leading-relaxed text-[#111110] outline-none',
          'placeholder:font-normal placeholder:text-[#9CA3AF]',
          'transition-all duration-150',
          'focus:border-[#111110] focus:bg-white focus:ring-3 focus:ring-[rgba(17,17,16,0.08)]',
          className
        )}
        {...props}
      />
    </div>
  );
});
Textarea.displayName = 'Textarea';
