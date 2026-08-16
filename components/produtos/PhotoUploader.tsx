'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Loader2, Star, Trash2, GripVertical } from 'lucide-react';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

const MAX_FOTOS = 8;
const LONG_PRESS_MS = 170;
const DRAG_THRESHOLD_PX = 6;

/**
 * Galeria geral do produto. A primeira foto é sempre a capa — não pedimos
 * ao vendedor para escolher manualmente. Arrastar e soltar para reordenar
 * (toque e segure, tal como no Shopyump-main); toque simples abre um
 * menu rápido para tornar capa ou remover.
 */
export function PhotoUploader({
  photos,
  onChange,
  lojaId,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  lojaId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [actionsFor, setActionsFor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const orderRef = useRef(photos);
  orderRef.current = photos;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, MAX_FOTOS - photos.length)) {
      const { url } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (url) uploaded.push(url);
    }
    onChange([...photos, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
    setActionsFor(null);
  }

  function makeCover(index: number) {
    if (index === 0) return setActionsFor(null);
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
    setActionsFor(null);
  }

  function indexUnderPoint(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest('[data-photo-index]') as HTMLElement | null;
    if (!el) return null;
    const idx = Number(el.dataset.photoIndex);
    return Number.isNaN(idx) ? null : idx;
  }

  function onThumbPointerDown(e: React.PointerEvent, index: number) {
    startPos.current = { x: e.clientX, y: e.clientY };
    draggingRef.current = false;
    pressTimer.current = setTimeout(() => {
      draggingRef.current = true;
      setDragIndex(index);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, LONG_PRESS_MS);
  }

  function onThumbPointerMove(e: React.PointerEvent) {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (!draggingRef.current) {
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX && pressTimer.current) {
        // moved before long-press fired: treat as scroll/tap, cancel drag intent
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      return;
    }
    if (dragIndex === null) return;
    const over = indexUnderPoint(e.clientX, e.clientY);
    if (over === null || over === dragIndex) return;
    const next = [...orderRef.current];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(over, 0, moved);
    onChange(next);
    setDragIndex(over);
  }

  function onThumbPointerUp(index: number) {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (draggingRef.current) {
      draggingRef.current = false;
      setDragIndex(null);
    } else {
      setActionsFor(index);
    }
    startPos.current = null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between pl-1">
        <div>
          <h3 className="text-[13px] font-black text-ink">Imagens</h3>
          <p className="text-[11px] font-medium text-slate-400">A primeira imagem é a capa do produto.</p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400">
          {photos.length}/{MAX_FOTOS}
        </span>
      </div>

      <div ref={gridRef} className="grid grid-cols-4 gap-2.5">
        {photos.map((url, i) => (
          <div
            key={url + i}
            data-photo-index={i}
            onPointerDown={(e) => onThumbPointerDown(e, i)}
            onPointerMove={onThumbPointerMove}
            onPointerUp={() => onThumbPointerUp(i)}
            className={cn(
              'group relative aspect-square touch-none select-none overflow-hidden rounded-2xl bg-slate-100 shadow-sm',
              dragIndex === i && 'z-10 scale-[1.06] shadow-xl ring-2 ring-ink/20'
            )}
          >
            <Image src={url} alt="" fill className="pointer-events-none object-cover" sizes="120px" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                <Star size={9} className="fill-white" /> Capa
              </span>
            )}
            {photos.length > 1 && (
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition-opacity group-active:opacity-100">
                <GripVertical size={12} />
              </span>
            )}
          </div>
        ))}

        {photos.length < MAX_FOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 active:bg-slate-50"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span className="text-[9px] font-bold uppercase tracking-wider">Adicionar</span>
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <p className="mt-2.5 text-center text-[10px] font-semibold text-slate-400">
          Toque para editar ou mantenha pressionado para reordenar
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Sheet open={actionsFor !== null} onClose={() => setActionsFor(null)} title="Editar imagem">
        <div className="flex flex-col gap-2 pb-4">
          {actionsFor !== null && actionsFor !== 0 && (
            <button
              type="button"
              onClick={() => makeCover(actionsFor)}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98]"
            >
              <Star size={16} className="text-slate-500" /> Tornar imagem de capa
            </button>
          )}
          <button
            type="button"
            onClick={() => actionsFor !== null && removeAt(actionsFor)}
            className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3.5 text-left text-[13px] font-bold text-red-500 active:scale-[0.98]"
          >
            <Trash2 size={16} /> Remover imagem
          </button>
        </div>
      </Sheet>
    </div>
  );
}
