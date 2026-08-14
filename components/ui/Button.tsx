import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-white text-ink border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:bg-slate-50 hover:border-slate-300',
  secondary: 'bg-white text-ink border border-slate-200 hover:bg-slate-50 shadow-sm',
  ghost: 'bg-transparent text-ink hover:bg-slate-100',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/25',
  dark: 'bg-[#1A1210] text-white border border-[#1A1210] shadow-[0_10px_24px_-10px_rgba(26,18,16,0.5)] hover:bg-[#241a17] hover:border-[#241a17]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[12px] rounded-xl gap-1.5',
  md: 'h-12 px-6 text-[13px] rounded-2xl gap-2',
  lg: 'h-14 px-8 text-[14px] rounded-full gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
