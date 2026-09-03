'use client';

import { cn } from '@/lib/format';
import { MinusIcon, PlusIcon } from './Icon';

/**
 * Accessible - + stepper with large touch targets for mobile.
 * The value is also editable directly, which is faster for "I need 10 of these".
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = 'md',
  label = 'Quantity',
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  label?: string;
  disabled?: boolean;
}) {
  const clamp = (n: number) => {
    if (Number.isNaN(n)) return min;
    const upper = max && max > 0 ? max : Number.MAX_SAFE_INTEGER;
    return Math.min(Math.max(n, min), upper);
  };

  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const field = size === 'sm' ? 'h-8 w-10 text-sm' : 'h-10 w-12 text-[15px]';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-line bg-white',
        disabled && 'opacity-50',
      )}
    >
      <button
        type="button"
        className={cn(box, 'flex items-center justify-center rounded-l-lg text-ink transition-colors hover:bg-canvas disabled:text-muted')}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <MinusIcon size={size === 'sm' ? 14 : 16} />
      </button>

      <input
        type="number"
        inputMode="numeric"
        className={cn(field, 'border-x border-line text-center font-semibold text-ink focus:outline-none focus:ring-0')}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        onBlur={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
      />

      <button
        type="button"
        className={cn(box, 'flex items-center justify-center rounded-r-lg text-ink transition-colors hover:bg-canvas disabled:text-muted')}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || (max != null && max > 0 && value >= max)}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <PlusIcon size={size === 'sm' ? 14 : 16} />
      </button>
    </div>
  );
}
