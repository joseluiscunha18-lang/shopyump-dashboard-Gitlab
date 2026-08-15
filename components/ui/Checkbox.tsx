'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[6px] border transition-colors',
        checked || indeterminate
          ? 'border-[#1A1210] bg-[#1A1210]'
          : 'border-slate-300 bg-white hover:border-slate-400',
        className,
      )}
    >
      {indeterminate ? (
        <Minus size={11} strokeWidth={3} className="text-white" />
      ) : checked ? (
        <Check size={11} strokeWidth={3} className="text-white" />
      ) : null}
    </button>
  );
}
