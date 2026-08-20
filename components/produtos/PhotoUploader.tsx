'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Loader2,
  Star,
  Trash2,
  Scissors,
  Sparkles,
  RotateCcw,
  Check,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

const MAX_FOTOS = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

type BgState = 'idle' | 'processing' | 'done' | 'error';

interface EditState {
  /** URL original (nunca alterada após o primeiro carregamento) */
  original: string;
  /** URL actualmente em uso (pode ser original ou pós-remoção de fundo) */
  current: string;
  /** URL com fundo removido (null se ainda não processado) */
  bgRemoved: string | null;
  bgState: BgState;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recorta a imagem de origem para um quadrado 1:1 centrado em (offsetX,
 * offsetY) — onde offset é o deslocamento do utilizador a partir do centro
 * natural. Devolve um data-URL PNG.
 */
async function cropToSquare(
  src: string,
  offsetX: number,
  offsetY: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { naturalWidth: W, naturalHeight: H } = img;
      const side = Math.min(W, H);
      // Centro natural
      const cx = W / 2;
      const cy = H / 2;
      // Escala: os offsets vêm em px da pré-visualização (300 px fixos),
      // converter para px nativos.
      const scale = side / 300;
      const sx = cx - side / 2 + offsetX * scale;
      const sy = cy - side / 2 + offsetY * scale;
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, 1000, 1000);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Converte data-URL para File para poder fazer upload */
function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

/** Remove o fundo via remove.bg (API key no env) */
async function removeBgApi(imageUrl: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;
  if (!apiKey) throw new Error('API key não configurada');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_url: imageUrl, size: 'auto' }),
  });

  if (!res.ok) throw new Error('Falhou a remoção de fundo');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ─── CropEditor ───────────────────────────────────────────────────────────────

/**
 * Editor de enquadramento 1:1. O utilizador arrasta a imagem dentro de uma
 * janela quadrada fixa. Não é um editor de fotografia completo — apenas o
 * suficiente para ajustar o centramento.
 */
function CropEditor({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (offsetX: number, offsetY: number) => void;
  onCancel: () => void;
}) {
  // offset em px (espaço da pré-visualização 300×300)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const PREVIEW = 300; // tamanho da janela de pré-visualização em px

  // Calcula os limites de deslocamento
  function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max);
  }

  function getLimits() {
    if (!imgSize) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const scale = PREVIEW / Math.min(imgSize.w, imgSize.h);
    const renderedW = imgSize.w * scale;
    const renderedH = imgSize.h * scale;
    const maxX = (renderedW - PREVIEW) / 2;
    const maxY = (renderedH - PREVIEW) / 2;
    return { minX: -maxX, maxX, minY: -maxY, maxY };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    const { minX, maxX, minY, maxY } = getLimits();
    setOffset({
      x: clamp(dragStart.current.ox + dx, minX, maxX),
      y: clamp(dragStart.current.oy + dy, minY, maxY),
    });
  }

  function onPointerUp() {
    dragStart.current = null;
  }

  // Calcula o estilo da imagem dentro do quadrado de pré-visualização
  function imgStyle() {
    if (!imgSize) return {};
    const scale = PREVIEW / Math.min(imgSize.w, imgSize.h);
    return {
      width: imgSize.w * scale,
      height: imgSize.h * scale,
      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
      top: '50%',
      left: '50%',
    };
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Janela de pré-visualização */}
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-100 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ width: PREVIEW, height: PREVIEW }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute pointer-events-none"
          style={{ ...imgStyle(), maxWidth: 'none' }}
          onLoad={(e) => {
            const t = e.currentTarget;
            setImgSize({ w: t.naturalWidth, h: t.naturalHeight });
          }}
        />
        {/* Grade sutil de enquadramento */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
        }} />
        {/* Cantos */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos) => (
          <div
            key={pos}
            className={cn('absolute w-6 h-6 pointer-events-none', pos)}
            style={{
              borderTop: pos.includes('top') ? '2px solid white' : undefined,
              borderBottom: pos.includes('bottom') ? '2px solid white' : undefined,
              borderLeft: pos.includes('left') ? '2px solid white' : undefined,
              borderRight: pos.includes('right') ? '2px solid white' : undefined,
            }}
          />
        ))}
      </div>

      <p className="text-[12px] font-medium text-slate-400 text-center">
        Arraste para ajustar o enquadramento
      </p>

      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-500 active:scale-[0.98] transition-transform"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onConfirm(offset.x, offset.y)}
          className="flex-1 h-11 rounded-2xl bg-[#0f172a] text-white text-[13px] font-bold active:scale-[0.98] transition-transform"
        >
          Usar imagem
        </button>
      </div>
    </div>
  );
}

// ─── ImageEditor sheet ────────────────────────────────────────────────────────

function ImageEditorSheet({
  open,
  onClose,
  editState,
  onBgRemove,
  onBgUndo,
  onSwap,
  onRemove,
  onMakeCover,
  isCover,
  onCropOpen,
}: {
  open: boolean;
  onClose: () => void;
  editState: EditState | null;
  onBgRemove: () => void;
  onBgUndo: () => void;
  onSwap: () => void;
  onRemove: () => void;
  onMakeCover: () => void;
  isCover: boolean;
  onCropOpen: () => void;
}) {
  if (!editState) return null;

  const { current, bgState, bgRemoved } = editState;
  const processing = bgState === 'processing';
  const bgDone = bgState === 'done';
  const bgError = bgState === 'error';

  return (
    <Sheet open={open} onClose={onClose} title="Editar imagem" closeButton>
      <div className="flex flex-col gap-4 pb-6">
        {/* Pré-visualização quadrada */}
        <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl bg-slate-100">
          {/* Fundo transparente — xadrez discreto */}
          {bgDone && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%)',
                backgroundSize: '20px 20px',
              }}
            />
          )}
          <Image
            key={current}
            src={current}
            alt=""
            fill
            className={cn(
              'object-contain transition-opacity duration-300',
              processing && 'opacity-60'
            )}
            sizes="260px"
            unoptimized={current.startsWith('blob:')}
          />

          {/* Animação de processamento */}
          {processing && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div
                className="animate-bg-remove-sweep absolute inset-y-0 w-1/3"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
                  <Loader2 size={18} className="animate-spin text-slate-600" />
                </div>
                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                  Removendo fundo…
                </span>
              </div>
            </div>
          )}

          {/* Badge de sucesso */}
          {bgDone && (
            <div className="animate-fade-up-in absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 shadow-sm">
              <Check size={11} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                Fundo removido
              </span>
            </div>
          )}
        </div>

        {/* Botão "Trocar imagem" */}
        <button
          type="button"
          onClick={onSwap}
          className="text-center text-[12px] font-bold text-slate-400 underline-offset-2 hover:text-slate-600 active:scale-[0.98] transition-transform"
        >
          Trocar imagem
        </button>

        {/* Separador */}
        <div className="h-px bg-slate-100" />

        {/* Ações */}
        <div className="flex flex-col gap-2">
          {/* Ajustar enquadramento */}
          <button
            type="button"
            onClick={onCropOpen}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform"
          >
            <Scissors size={16} className="text-slate-400" />
            Ajustar enquadramento
          </button>

          {/* Remover fundo — estados */}
          {!bgDone && !bgError && (
            <button
              type="button"
              onClick={onBgRemove}
              disabled={processing}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
            >
              {processing ? (
                <Loader2 size={16} className="animate-spin text-slate-400" />
              ) : (
                <Sparkles size={16} className="text-slate-400" />
              )}
              {processing ? 'Removendo fundo…' : 'Remover fundo'}
            </button>
          )}

          {bgDone && (
            <>
              <button
                type="button"
                onClick={onBgUndo}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform"
              >
                <RotateCcw size={16} className="text-slate-400" />
                Desfazer remoção
              </button>
            </>
          )}

          {bgError && (
            <button
              type="button"
              onClick={onBgRemove}
              className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3.5 text-left text-[13px] font-bold text-red-500 active:scale-[0.98] transition-transform"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          )}

          {bgError && (
            <p className="px-1 text-[11px] font-medium text-red-400">
              Não foi possível remover o fundo. A imagem original foi preservada.
            </p>
          )}

          {/* Tornar capa */}
          {!isCover && (
            <button
              type="button"
              onClick={onMakeCover}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform"
            >
              <Star size={16} className="text-slate-400" />
              Tornar imagem de capa
            </button>
          )}

          {/* Remover */}
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3.5 text-left text-[13px] font-bold text-red-500 active:scale-[0.98] transition-transform"
          >
            <Trash2 size={16} />
            Remover imagem
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── PhotoUploader (principal) ────────────────────────────────────────────────

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

  // drag-to-reorder — instânea, sem long-press
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartIndex = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const orderRef = useRef(photos);
  orderRef.current = photos;

  // editor
  const [editorIndex, setEditorIndex] = useState<number | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const swapInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleFiles(files: FileList | null, replaceIndex?: number) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    const limit = replaceIndex !== undefined ? 1 : MAX_FOTOS - photos.length;
    for (const file of Array.from(files).slice(0, limit)) {
      const { url } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (url) uploaded.push(url);
    }
    if (replaceIndex !== undefined && uploaded[0]) {
      const next = [...photos];
      next[replaceIndex] = uploaded[0];
      onChange(next);
      // Abre o enquadramento automático ao trocar
      setTimeout(() => setCropIndex(replaceIndex), 100);
    } else {
      const newPhotos = [...photos, ...uploaded];
      onChange(newPhotos);
      // Abre o enquadramento na última foto adicionada
      if (uploaded.length === 1) {
        setTimeout(() => setCropIndex(newPhotos.length - 1), 100);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    if (swapInputRef.current) swapInputRef.current.value = '';
  }

  // ── Reorder — drag instantâneo ───────────────────────────────────────────────

  const DRAG_PX = 5; // pixels mínimos para activar drag

  function onPointerDown(e: React.PointerEvent, index: number) {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartIndex.current = index;
    isDraggingRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStartPos.current === null || dragStartIndex.current === null) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (!isDraggingRef.current) {
      if (Math.hypot(dx, dy) < DRAG_PX) return;
      isDraggingRef.current = true;
      setDragIndex(dragStartIndex.current);
    }

    // Posição flutuante do thumbnail
    setFloatPos({ x: e.clientX, y: e.clientY });

    // Detectar a célula abaixo
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-photo-index]') as HTMLElement | null;
    if (!el) return;
    const over = Number(el.dataset.photoIndex);
    if (Number.isNaN(over) || over === dragStartIndex.current) return;

    const next = [...orderRef.current];
    const [moved] = next.splice(dragStartIndex.current, 1);
    next.splice(over, 0, moved);
    onChange(next);
    dragStartIndex.current = over;
    setDragIndex(over);
  }

  function onPointerUp(index: number) {
    if (isDraggingRef.current) {
      // Era drag — terminar
      isDraggingRef.current = false;
      setDragIndex(null);
      setFloatPos(null);
      dragStartPos.current = null;
      dragStartIndex.current = null;
    } else {
      // Era tap — abrir editor
      dragStartPos.current = null;
      dragStartIndex.current = null;
      setEditorIndex(index);
    }
  }

  // ── EditState helpers ────────────────────────────────────────────────────────

  function getEditState(url: string): EditState {
    return editStates[url] ?? { original: url, current: url, bgRemoved: null, bgState: 'idle' };
  }

  function setEditState(url: string, patch: Partial<EditState>) {
    setEditStates((prev) => ({
      ...prev,
      [url]: { ...getEditState(url), ...patch },
    }));
  }

  // ── Editor actions ────────────────────────────────────────────────────────────

  function handleRemove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
    setEditorIndex(null);
  }

  function handleMakeCover(index: number) {
    if (index === 0) return setEditorIndex(null);
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
    setEditorIndex(null);
  }

  async function handleBgRemove(originalUrl: string) {
    setEditState(originalUrl, { bgState: 'processing' });
    try {
      const resultUrl = await removeBgApi(originalUrl);
      setEditState(originalUrl, { bgState: 'done', bgRemoved: resultUrl, current: resultUrl });
      // Reflectir na lista de fotos
      onChange(photos.map((u) => (u === originalUrl ? resultUrl : u)));
    } catch {
      setEditState(originalUrl, { bgState: 'error' });
    }
  }

  function handleBgUndo(originalUrl: string) {
    const state = getEditState(originalUrl);
    setEditState(originalUrl, { bgState: 'idle', current: state.original });
    onChange(photos.map((u) => (u === state.bgRemoved ? state.original : u)));
  }

  // ── Crop ──────────────────────────────────────────────────────────────────────

  async function handleCropConfirm(index: number, offsetX: number, offsetY: number) {
    const url = photos[index];
    const state = getEditState(url);
    try {
      const croppedDataUrl = await cropToSquare(state.current, offsetX, offsetY);
      // Upload do recorte
      const file = dataURLtoFile(croppedDataUrl, `crop-${Date.now()}.png`);
      const { url: newUrl } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (newUrl) {
        const next = [...photos];
        next[index] = newUrl;
        onChange(next);
        // Actualizar editState com nova URL
        setEditStates((prev) => {
          const existing = prev[url] ?? { original: url, current: url, bgRemoved: null, bgState: 'idle' };
          const newState: EditState = { ...existing, current: newUrl };
          const updated = { ...prev };
          delete updated[url];
          updated[newUrl] = newState;
          return updated;
        });
      }
    } catch {
      // silently ignore crop errors
    }
    setCropIndex(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const editorPhoto = editorIndex !== null ? photos[editorIndex] : null;
  const editorState = editorPhoto ? getEditState(editorPhoto) : null;

  const cropPhoto = cropIndex !== null ? photos[cropIndex] : null;
  const cropState = cropPhoto ? getEditState(cropPhoto) : null;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-2 flex items-center justify-between pl-1">
        <div>
          <h3 className="text-[13px] font-black text-ink">Imagens</h3>
          <p className="text-[11px] font-medium text-slate-400">
            A primeira imagem é a capa do produto.
          </p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400">
          {photos.length}/{MAX_FOTOS}
        </span>
      </div>

      {/* Grelha */}
      <div ref={gridRef} className="grid grid-cols-4 gap-2.5">
        {photos.map((url, i) => {
          const dragging = dragIndex === i;
          return (
            <div
              key={url + i}
              data-photo-index={i}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={() => onPointerUp(i)}
              className={cn(
                'group relative aspect-square touch-none select-none overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-all duration-150',
                dragging
                  ? 'opacity-30 scale-95 ring-2 ring-ink/20'
                  : 'opacity-100 scale-100'
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                className="pointer-events-none object-cover"
                sizes="120px"
                unoptimized={url.startsWith('blob:')}
              />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                  <Star size={9} className="fill-white" /> Capa
                </span>
              )}
            </div>
          );
        })}

        {/* Botão adicionar */}
        {photos.length < MAX_FOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 active:bg-slate-50"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Adicionar
            </span>
          </button>
        )}
      </div>

      {/* Floating thumbnail durante drag */}
      {dragIndex !== null && floatPos && photos[dragIndex] && (
        <div
          className="pointer-events-none fixed z-[200] h-16 w-16 overflow-hidden rounded-2xl shadow-2xl ring-2 ring-ink/20"
          style={{
            left: floatPos.x - 32,
            top: floatPos.y - 32,
            transform: 'scale(1.1) rotate(2deg)',
            transition: 'transform 0.1s ease',
          }}
        >
          <Image
            src={photos[dragIndex]}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
            unoptimized={photos[dragIndex]?.startsWith('blob:')}
          />
        </div>
      )}

      {photos.length > 1 && (
        <p className="mt-2.5 text-center text-[10px] font-semibold text-slate-400">
          Arraste para reordenar · Toque para editar
        </p>
      )}

      {/* Inputs ocultos */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={swapInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files, editorIndex ?? undefined)}
      />

      {/* Editor de imagem */}
      <ImageEditorSheet
        open={editorIndex !== null && cropIndex === null}
        onClose={() => setEditorIndex(null)}
        editState={editorState}
        isCover={editorIndex === 0}
        onBgRemove={() => editorPhoto && handleBgRemove(editorState?.original ?? editorPhoto)}
        onBgUndo={() => editorPhoto && handleBgUndo(editorState?.original ?? editorPhoto)}
        onSwap={() => swapInputRef.current?.click()}
        onRemove={() => editorIndex !== null && handleRemove(editorIndex)}
        onMakeCover={() => editorIndex !== null && handleMakeCover(editorIndex)}
        onCropOpen={() => {
          setCropIndex(editorIndex);
          setEditorIndex(null);
        }}
      />

      {/* Editor de enquadramento 1:1 */}
      <Sheet
        open={cropIndex !== null}
        onClose={() => {
          setCropIndex(null);
          // Se veio do editor, voltar ao editor
          if (editorIndex !== null) {
            // mantém editorIndex já definido
          }
        }}
        title="Ajustar enquadramento"
        subtitle="1:1 · Arraste para posicionar"
        closeButton
      >
        {cropPhoto && cropState && (
          <CropEditor
            src={cropState.current}
            onConfirm={(ox, oy) => cropIndex !== null && handleCropConfirm(cropIndex, ox, oy)}
            onCancel={() => setCropIndex(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
