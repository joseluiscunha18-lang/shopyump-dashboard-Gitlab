import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp' | 'dark';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
 primary:'bg-primary text-primary-foreground border border-primary hover:opacity-90',
 secondary:'bg-secondary text-secondary-foreground border border-border hover:bg-muted',
 ghost:'bg-transparent text-foreground hover:bg-muted',
 danger:'bg-destructive/10 text-destructive border border-destructive/20',
 whatsapp:'bg-brand text-brand-foreground hover:opacity-90',
 dark:'bg-primary text-primary-foreground border border-primary hover:opacity-90',
};
const sizes: Record<Size,string> = {
 sm:'min-h-9 px-3 text-xs rounded-md gap-1.5', md:'min-h-11 px-4 text-sm rounded-md gap-2', lg:'min-h-12 px-6 text-sm rounded-md gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(cn(
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-150 active:scale-[0.97]',
          'disabled:opacity-40 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        ))}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
