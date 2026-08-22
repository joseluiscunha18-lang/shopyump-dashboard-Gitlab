import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp' | 'dark';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  /* Ação principal — carvão quente, nunca branco genérico */
  primary:
    'bg-[#111110] text-white border border-[#111110] shadow-[0_4px_16px_-6px_rgba(28,25,23,0.35)] hover:bg-[#27272A] hover:border-[#3D3A36]',
  secondary:
    'bg-white text-[#1C1917] border border-[#D4D2CF] hover:bg-[#F4F4F3] shadow-sm',
  ghost:
    'bg-transparent text-[#1C1917] hover:bg-[rgba(28,25,23,0.05)]',
  danger:
    'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
  whatsapp:
    'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/25',
  dark:
    'bg-[#111110] text-white border border-[#111110] shadow-[0_10px_24px_-10px_rgba(28,25,23,0.5)] hover:bg-[#27272A]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9  px-4  text-[12px] rounded-[10px] gap-1.5',
  md: 'h-12 px-6  text-[13px] rounded-[13px] gap-2',
  lg: 'h-14 px-8  text-[14px] rounded-[18px] gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold tracking-wide',
          'transition-all duration-150 active:scale-[0.97]',
          'disabled:opacity-40 disabled:pointer-events-none',
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
