'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Loader2, Plus } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { cn } from '@/lib/cn';

/**
 * "Selecionar imagens existentes" + "Adicionar nova imagem" — nunca pede
 * novo upload obrigatório por variante. Novas imagens entram também na
 * galeria geral do produto (mesma URL, sem duplicar o ficheiro).
 */
export function VariantImagePicker({
  open,
  onClose,
  label,
  fotosGerais,
  selecionadas,
  onSave,
  onAddToGaleria,
  lojaId,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  fotosGerais: string[];
  selecionadas: string[];
  onSave: (urls: string[]) => void;
  onAddToGaleria: (url: string) => void;
  lojaId: string;
}) {
  const [draft, setDraft] = useState<string[]>(selecionadas);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggle(url: string) {
    setDraft((d) => (d.includes(url) ? d.filter((u) => u !== url) : [...d, url]));
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const { url } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (url) {
        onAddToGaleria(url);
        setDraft((d) => [...d, url]);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Imagens — ${label}`}
      subtitle="Escolhe imagens já carregadas ou adiciona novas."
      footer={
        <Button
          className="w-full"
          onClick={() => {
            onSave(draft);
            onClose();
          }}
        >
          Guardar ({draft.length})
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-2.5 pb-4">
        {fotosGerais.map((url, i) => {
          const active = draft.includes(url);
          return (
            <button
              key={url + i}
              type="button"
              onClick={() => toggle(url)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md bg-[#F4F4F3] ring-2 transition-all',
                active ? 'ring-ink' : 'ring-transparent'
              )}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="100px" />
              {active && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/35">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink">
                    <Check size={14} />
                  </span>
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[#D4D2CF] text-[#8A8681]"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          <span className="text-[8px] font-bold uppercase tracking-wider">Nova</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
    </Sheet>
  );
}
