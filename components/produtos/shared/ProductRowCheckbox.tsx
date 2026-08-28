import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Surfaces';

/**
 * Wrapper da checkbox de seleção da linha (real ou pendente). O
 * `<span>` de fora é SEMPRE o mesmo elemento, mesmo tamanho, quer se
 * mostre o shimmer ou a `<Checkbox>` real — isto é o que evita o React
 * desmontar/remontar a linha inteira quando o esqueleto da
 * PendingProductRow termina (ver comentários em PendingProductRow.tsx).
 */
export function ProductRowCheckbox({
  loading,
  checked,
  onChange,
  ariaLabel,
  className = 'ml-0.5 mr-2',
}: {
  loading?: boolean;
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex h-[19px] w-[19px] flex-shrink-0 ${className}`}>
      {loading ? (
        <Skeleton className="h-full w-full rounded-[6px]" />
      ) : (
        <Checkbox checked={checked} onChange={onChange} ariaLabel={ariaLabel} />
      )}
    </span>
  );
}
