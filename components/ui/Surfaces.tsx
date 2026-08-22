import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white border border-[rgba(28,25,23,0.09)] rounded-[18px]',
        className
      )}
      {...props}
    />
  );
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-[#F5F3F0] text-[#78716C]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-600',
  brand:   'bg-[oklch(0.95_0.05_45)] text-[oklch(0.62_0.19_35)]',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em]',
        tones[tone]
      )}
    >
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
      <div className="w-16 h-16 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#A8A29E]">
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-[#1C1917]">{title}</p>
        {subtitle && (
          <p className="text-[12px] font-medium text-[#A8A29E] max-w-[260px] mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-[10px]', className)} />;
}
