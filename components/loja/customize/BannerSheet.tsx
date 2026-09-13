'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { updateLoja } from '@/lib/mutations/loja';

/**
 * Painel contextual do Banner — abre ao tocar no banner na
 * pré-visualização (modelo "toque para editar"). Faz upload real para o
 * Supabase Storage e grava direto na loja, sem passar por um formulário
 * genérico — é o mesmo padrão de upload usado em ProductForm.
 */
export function BannerSheet({
  open,
  onClose,
  lojaId,
  bannerUrl,
  bannerGrande,
  onBannerGrandeChange,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lojaId: string;
  bannerUrl: string | null;
  bannerGrande: boolean;
  onBannerGrandeChange: (value: boolean) => void;
  onSaved: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadImage(BUCKETS.lojas, file, lojaId);
    if (error || !url) {
      setUploading(false);
      return show(error ?? 'Não foi possível enviar a imagem.', 'error');
    }
    const res = await updateLoja(lojaId, { banner_url: url });
    setUploading(false);
    if (!res.ok) return show(res.error ?? 'Não foi possível guardar o banner.', 'error');
    show('Banner atualizado.');
    onSaved();
  }

  async function handleRemove() {
    setRemoving(true);
    const res = await updateLoja(lojaId, { banner_url: null });
    setRemoving(false);
    if (!res.ok) return show(res.error ?? 'Não foi possível remover o banner.', 'error');
    show('Banner removido — a loja volta a mostrar a imagem de demonstração.');
    onSaved();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Banner" heightVh={55}>
      <div className="flex flex-col gap-6 pb-4">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Imagem</span>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button type="button" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
            <ImageIcon size={15} /> Alterar imagem
          </Button>
          {bannerUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1.5 self-start text-[12px] font-bold text-red-500 disabled:opacity-40"
            >
              <Trash2 size={13} /> Remover banner
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Altura</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onBannerGrandeChange(false)}
              className={cn(
                'flex-1 rounded-[12px] border px-4 py-3 text-[13px] font-bold transition-colors',
                !bannerGrande ? 'border-[#111110] bg-[#F4F4F3] text-ink' : 'border-[#E5E3E0] text-slate-400'
              )}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => onBannerGrandeChange(true)}
              className={cn(
                'flex-1 rounded-[12px] border px-4 py-3 text-[13px] font-bold transition-colors',
                bannerGrande ? 'border-[#111110] bg-[#F4F4F3] text-ink' : 'border-[#E5E3E0] text-slate-400'
              )}
            >
              Grande
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
