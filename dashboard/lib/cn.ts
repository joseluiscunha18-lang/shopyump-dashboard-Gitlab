type ClassValue = string | number | null | boolean | undefined | ClassValue[];

function toVal(mix: ClassValue): string {
  if (Array.isArray(mix)) return mix.map(toVal).filter(Boolean).join(' ');
  return mix ? String(mix) : '';
}

/** Minimal clsx-style class combiner — avoids pulling in a dependency for this. */
export function cn(...inputs: ClassValue[]): string {
  return inputs.map(toVal).filter(Boolean).join(' ');
}
