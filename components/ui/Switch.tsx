'use client';

import { cn } from '@/lib/cn';

export function Switch({
  checked,
  onChange,
  ariaLabel,
  size = 'md',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
}) {
  const track     = size === 'sm' ? 'h-[22px] w-[38px]' : 'h-[26px] w-[46px]';
  const knob      = size === 'sm' ? 'h-[16px] w-[16px]' : 'h-[20px] w-[20px]';
  const translate = size === 'sm' ? 'translate-x-[17px]' : 'translate-x-[21px]';
  const offset    = 'translate-x-[3px]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full',
        'transition-colors duration-200',
        track,
        checked
          ? 'bg-[#1C1917]'
          : 'bg-[#D6D1CB]'
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white',
          'shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition-transform duration-200',
          knob,
          checked ? translate : offset
        )}
      />
    </button>
  );
}
