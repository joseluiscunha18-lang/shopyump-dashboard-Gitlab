import { ReactNode } from 'react';
import { Card } from '@/components/ui/Surfaces';

export function StatCard({
  icon,
  label,
  value,
  sub,
  emphasis,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <Card className={`p-5 flex items-center gap-4 ${emphasis ? 'bg-ink text-white border-none' : ''}`}>
      <div className={`flex-shrink-0 ${emphasis ? 'text-white' : 'text-ink'}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${emphasis ? 'text-white/70' : 'text-slate-500'}`}>
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <h3 className={`text-2xl font-black tracking-tight truncate ${emphasis ? 'text-white' : 'text-ink'}`}>{value}</h3>
          {sub && <span className={`text-[11px] font-bold ${emphasis ? 'text-white/60' : 'text-slate-400'}`}>{sub}</span>}
        </div>
      </div>
    </Card>
  );
}
