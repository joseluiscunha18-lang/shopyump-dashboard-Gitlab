import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white/70 backdrop-blur-xl border border-white shadow-[0_12px_40px_rgba(15,23,42,0.04)] rounded-[28px]',
        className
      )}
      {...props}
    />
  );
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  brand: 'bg-brand-soft text-brand',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">{icon}</div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-ink">{title}</p>
        {subtitle && <p className="text-[12px] font-medium text-slate-400 max-w-[260px] mx-auto leading-relaxed">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-xl', className)} />;
}
