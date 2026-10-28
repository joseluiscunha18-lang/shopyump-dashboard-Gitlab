'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { Sheet } from '@/components/ui/ShopyumpSheet';
import { cn } from '@/lib/cn';
import {
  adicionarABiblioteca,
  listarBiblioteca,
  reduzirImagem,
  vagasRestantes,
  type ImagemBiblioteca,
} from '@/lib/produtos/imageLibrary';

const FORMATOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;

type Pendente = { id: string; file: File; estado: 'loading' | 'error'; erro?: string };

/** Valida um ficheiro antes de o carregar para a Biblioteca. */
export function validarFicheiro(file: { type: string; size: number }): string | null {
  if (!FORMATOS.includes(file.type)) return 'Formato não suportado';
  if (file.size > MAX_MB * 1024 * 1024) return `Maior que ${MAX_MB} MB`;
  return null;
}

/** Seleção limitada às vagas que o produto ainda tem. */
export function alternarSelecao(sel: string[], url: string, vagas: number): string[] {
  if (sel.includes(url)) return sel.filter((u) => u !== url);
  return sel.length >= vagas ? sel : [...sel, url];
}

export function ImageLibrarySheet({
  open,
  onClose,
  lojaId,
  existing,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  lojaId: string;
  existing: string[];
  onConfirm: (urls: string[]) => void;
}) {
  const [imagens, setImagens] = useState<ImagemBiblioteca[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const vagas = vagasRestantes(existing.length);

  useEffect(() => {
    if (!open) return;
    setImagens(listarBiblioteca(lojaId));
    setSel([]);
    setPendentes([]);
  }, [open, lojaId]);

  async function carregar(p: Pendente) {
    setPendentes((l) => l.map((x) => (x.id === p.id ? { ...x, estado: 'loading', erro: undefined } : x)));
    try {
      const url = await reduzirImagem(p.file);
      adicionarABiblioteca(lojaId, url);
      setImagens(listarBiblioteca(lojaId));
      setPendentes((l) => l.filter((x) => x.id !== p.id));
      setSel((s) => (s.includes(url) || existing.includes(url) ? s : alternarSelecao(s, url, vagas)));
    } catch {
      setPendentes((l) => l.map((x) => (x.id === p.id ? { ...x, estado: 'error', erro: 'Falhou' } : x)));
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const novos: Pendente[] = Array.from(files).map((file) => {
      const erro = validarFicheiro(file);
      return { id: crypto.randomUUID(), file, estado: erro ? 'error' : 'loading', erro: erro ?? undefined };
    });
    setPendentes((l) => [...novos, ...l]);
    novos.filter((n) => !n.erro).forEach(carregar);
    if (inputRef.current) inputRef.current.value = '';
  }

  const vazio = imagens.length === 0 && pendentes.length === 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Biblioteca de imagens"
      heightVh={88}
      closeButton
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-md border border-border bg-background py-3 text-[13px] font-bold text-foreground active:bg-muted"
          >
            Carregar imagens
          </button>
          <button
            type="button"
            disabled={sel.length === 0}
            onClick={() => onConfirm(sel)}
            className="flex-1 rounded-md bg-primary py-3 text-[13px] font-bold text-primary-foreground disabled:opacity-40"
          >
            {sel.length > 0 ? `Adicionar (${sel.length})` : 'Adicionar'}
          </button>
        </div>
      }
    >
      <div className="pb-4 pt-1">
        {vazio ? (
          <p className="py-10 text-center text-[13px] text-muted-foreground">As imagens que carregar aparecem aqui.</p>
        ) : (
          <>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Recentes</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {pendentes.map((p) => (
              <div key={p.id} className="relative grid aspect-square place-items-center rounded-[6px] border border-[#E4E2DF] bg-[#F4F4F3]">
                {p.estado === 'loading' ? (
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                    <span className="text-[11px] font-bold text-destructive">{p.erro}</span>
                    {!validarFicheiro(p.file) && (
                      <button type="button" onClick={() => carregar(p)} className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                        <RotateCcw size={12} /> Tentar novamente
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {imagens.map((img, i) => {
              const idx = sel.indexOf(img.original);
              const on = idx >= 0;
              const usada = existing.includes(img.original);
              const bloqueada = usada || (!on && sel.length >= vagas);
              return (
                <button
                  key={img.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Imagem ${i + 1}`}
                  disabled={bloqueada}
                  onClick={() => setSel((s) => alternarSelecao(s, img.original, vagas))}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-[6px] bg-[#F4F4F3] transition-all duration-150',
                    on ? 'border-2 border-[#1C1917]' : 'border border-[#E4E2DF]',
                    bloqueada && 'opacity-40',
                  )}
                >
                  <img src={img.semFundo ?? img.original} alt="" className="h-full w-full object-cover" />
                  {on && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                  )}
                  {usada && (
                    <span className="absolute inset-x-0 bottom-0 bg-background/80 py-0.5 text-[9px] font-bold text-foreground">No produto</span>
                  )}
                </button>
              );
            })}
          </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </Sheet>
  );
}
