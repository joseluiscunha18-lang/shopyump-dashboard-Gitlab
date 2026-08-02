'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Sparkles, Store, Rocket } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { completeOnboarding } from '@/lib/mutations/loja';
import { useToast } from '@/components/ui/Toast';

type Experience = 'iniciante' | 'experiente';
type BusinessModel = 'novo' | 'existente';

const TOTAL_STEPS = 4; // step 5 is the success screen, not part of the progress bar (matches onboarding.js)

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [shopName, setShopName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();

  const slug = useMemo(() => slugify(shopName), [shopName]);

  function goTo(n: number) {
    setStep(n);
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await completeOnboarding({ nome: shopName.trim(), whatsapp: whatsapp.trim() });
      if (!res.ok) {
        show(res.error ?? 'Não foi possível criar a loja.', 'error');
        return;
      }
      goTo(5);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1600);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {step <= 4 && (
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => goTo(step - 1)} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-ink active:scale-90 transition-transform">
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300 rounded-full"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            {step === TOTAL_STEPS ? 'Último passo' : `Passo ${step} de ${TOTAL_STEPS}`}
          </span>
        </div>
      )}

      {step === 1 && (
        <StepChoice
          title="Já vendes online?"
          subtitle="Ajuda-nos a preparar a melhor experiência para ti."
          options={[
            { value: 'iniciante', label: 'Ainda não, esta é a minha primeira loja', icon: <Sparkles size={18} /> },
            { value: 'experiente', label: 'Sim, já vendo por WhatsApp ou redes sociais', icon: <Store size={18} /> },
          ]}
          selected={experience}
          onSelect={(v) => {
            setExperience(v as Experience);
            setTimeout(() => goTo(2), 300);
          }}
        />
      )}

      {step === 2 && (
        <StepChoice
          title="O que vais vender?"
          subtitle="Podes ajustar isto mais tarde nas definições da loja."
          options={[
            { value: 'novo', label: 'Produtos que eu mesmo fabrico ou revendo', icon: <Store size={18} /> },
            { value: 'existente', label: 'Já tenho um catálogo pronto para importar', icon: <Rocket size={18} /> },
          ]}
          selected={businessModel}
          onSelect={(v) => {
            setBusinessModel(v as BusinessModel);
            setTimeout(() => goTo(3), 300);
          }}
        />
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">Como se vai chamar a tua loja?</h2>
            <p className="text-sm text-slate-500 font-medium">Este nome vai aparecer no teu link público.</p>
          </div>
          <Input
            autoFocus
            placeholder="Ex: Loja da Ana"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          {shopName.trim().length > 0 && (
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
              <span className="text-[12px] font-semibold text-slate-500">
                <span className="font-bold text-ink">{slug || 'loja'}</span>.shopyump.com
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                <Check size={12} /> Disponível
              </span>
            </div>
          )}
          <Button className="w-full" disabled={!slug} onClick={() => goTo(4)}>
            Continuar
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">Qual o teu WhatsApp?</h2>
            <p className="text-sm text-slate-500 font-medium">É para aqui que os pedidos dos teus clientes vão chegar.</p>
          </div>
          <Input placeholder="Ex: 84XXXXXXX" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <Button className="w-full" disabled={whatsapp.trim().length < 7} loading={pending} onClick={handleSubmit}>
            Criar a minha loja
          </Button>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col items-center text-center gap-5 py-10">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            {pending ? <Loader2 className="animate-spin" size={24} /> : <Check size={26} />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">A tua loja está pronta!</h2>
            <p className="text-sm text-slate-500 font-medium">A abrir o teu painel…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepChoice({
  title,
  subtitle,
  options,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  options: { value: string; label: string; icon: React.ReactNode }[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-ink tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'flex items-center gap-4 text-left p-5 rounded-2xl border-2 transition-all active:scale-[0.98]',
              selected === opt.value ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', selected === opt.value ? 'bg-white/15' : 'bg-slate-100 text-slate-500')}>
              {opt.icon}
            </div>
            <span className="text-sm font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
