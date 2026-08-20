'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Loader2,
  Star,
  Trash2,
  RotateCcw,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

const MAX_FOTOS = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

type BgState = 'idle' | 'processing' | 'laser' | 'done' | 'error';

interface EditState {
  original: string;
  current: string;
  bgRemoved: string | null;
  bgState: BgState;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      const scale = side / 300;
      const sx = W / 2 - side / 2 + offsetX * scale;
      const sy = H / 2 - side / 2 + offsetY * scale;
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

function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

async function removeBgApi(imageUrl: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;
  if (!apiKey) throw new Error('API key não configurada');
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, size: 'auto' }),
  });
  if (!res.ok) throw new Error('Falhou a remoção de fundo');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ─── Sparkle star (SVG gold, retirado do reference) ──────────────────────────

function GoldSparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      className={cn('gold-sparkle animate-twinkle absolute', className)}
      style={{ animationDelay: delay }}
      viewBox="0 0 24 24"
    >
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FDB931" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <path
        d="M12,21.5C12,21.5 12,12 2.5,12C12,12 12,2.5 12,2.5C12,2.5 12,12 21.5,12C12,12 12,21.5 12,21.5Z"
        fill="url(#gold-grad)"
      />
    </svg>
  );
}

// ─── ImagePreviewWithBg ───────────────────────────────────────────────────────
// Pré-visualização quadrada com as animações originais de remoção de fundo:
// overlay escuro + estrelas douradas → laser da direita para esquerda → reveal

function ImagePreviewWithBg({
  src,
  bgRemovedSrc,
  bgState,
}: {
  src: string;
  bgRemovedSrc: string | null;
  bgState: BgState;
}) {
  const processing = bgState === 'processing';
  const laser = bgState === 'laser';
  const done = bgState === 'done';

  return (
    <div
      className="relative w-full rounded-[32px] overflow-hidden bg-[#F8FAFC] border border-gray-50 shadow-inner"
      style={{ paddingBottom: '100%' }}
    >
      {/* Xadrez de transparência — só visível quando fundo removido */}
      {done && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              'repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%)',
            backgroundSize: '16px 16px',
          }}
        />
      )}

      {/* Camada: imagem com fundo removido (atrás, revelada pelo laser) */}
      {bgRemovedSrc && (
        <img
          src={bgRemovedSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-contain z-[5] pointer-events-none"
        />
      )}

      {/* Camada: imagem original — faz wipe para a direita durante o laser */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={cn(
          'absolute inset-0 w-full h-full object-contain z-10 pointer-events-none transition-transform duration-700',
          laser && 'animate-wipe-rl',
        )}
      />

      {/* Overlay escuro + estrelas durante processing */}
      {(processing || laser) && (
        <div
          className={cn(
            'absolute inset-0 z-20 pointer-events-none overflow-hidden transition-opacity duration-500',
            processing ? 'opacity-100' : 'opacity-0',
          )}
          style={{ backgroundColor: 'rgba(18,14,10,0.65)', backdropFilter: 'blur(2px)' }}
        >
          <GoldSparkle className="top-[15%] left-[20%] w-4 h-4" delay="0.1s" />
          <GoldSparkle className="top-[25%] right-[20%] w-7 h-7" delay="0.5s" />
          <GoldSparkle className="bottom-[20%] left-[30%] w-5 h-5" delay="0.8s" />
          <GoldSparkle className="top-[50%] right-[10%] w-3 h-3" delay="1.2s" />
          <div className="absolute top-[40%] left-[15%] w-1 h-1 bg-yellow-200 rounded-full animate-pulse opacity-60" />
          <div
            className="absolute bottom-[35%] right-[25%] w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-40"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      )}

      {/* Laser — passa da direita para a esquerda */}
      {laser && (
        <div className="animate-laser-rl absolute top-0 bottom-0 w-[3px] bg-white z-30 shadow-[0_0_25px_8px_rgba(255,255,255,1)]" />
      )}

      {/* Badge de conclusão */}
      {done && (
        <div className="animate-fade-up-in absolute bottom-3 left-3 z-30 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 shadow-sm pointer-events-none">
          <Check size={11} className="text-white" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white">
            Fundo removido
          </span>
        </div>
      )}
    </div>
  );
}

// ─── CropAndEditSheet ─────────────────────────────────────────────────────────
// Ecrã unificado: posicionar 1:1 + remover fundo + confirmar.
// Aberto automaticamente ao adicionar/trocar uma imagem.

function CropAndEditSheet({
  open,
  src,
  editState,
  onConfirm,
  onClose,
  onBgRemove,
  onBgUndo,
}: {
  open: boolean;
  src: string;
  editState: EditState;
  onConfirm: (offsetX: number, offsetY: number) => void;
  onClose: () => void;
  onBgRemove: () => void;
  onBgUndo: () => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const PREVIEW = 300;

  function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max);
  }

  function getLimits() {
    if (!imgSize) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const scale = PREVIEW / Math.min(imgSize.w, imgSize.h);
    const renderedW = imgSize.w * scale;
    const renderedH = imgSize.h * scale;
    return {
      minX: -(renderedW - PREVIEW) / 2,
      maxX: (renderedW - PREVIEW) / 2,
      minY: -(renderedH - PREVIEW) / 2,
      maxY: (renderedH - PREVIEW) / 2,
    };
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

  const { bgState, bgRemoved } = editState;
  const processing = bgState === 'processing';
  const laserPhase = bgState === 'laser';
  const bgDone = bgState === 'done';
  const bgError = bgState === 'error';
  const busy = processing || laserPhase;

  // Texto de status IA

  // Gerido pelo pai via bgState — mas precisamos de reiniciar o offset
  // ao abrir com uma imagem nova
  return (
    <Sheet open={open} onClose={onClose} title="Posicionar imagem" subtitle="1:1 · Arraste para ajustar" closeButton heightVh={92}>
      <div className="flex flex-col gap-5 pb-6">

        {/* ── Área de pré-visualização / posicionamento ── */}
        <div className="flex flex-col items-center gap-3">

          {/* Janela quadrada de recorte */}
          {!bgDone ? (
            <div
              className="relative overflow-hidden rounded-[28px] bg-slate-100 cursor-grab active:cursor-grabbing touch-none select-none shadow-inner mx-auto"
              style={{ width: PREVIEW, height: PREVIEW }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Imagem arrastável */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                className={cn(
                  'absolute pointer-events-none',
                  busy && 'opacity-50',
                )}
                style={{ ...imgStyle(), maxWidth: 'none' }}
                onLoad={(e) => {
                  const t = e.currentTarget;
                  setImgSize({ w: t.naturalWidth, h: t.naturalHeight });
                }}
              />

              {/* Grade de composição */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '100px 100px',
                }}
              />

              {/* Cantos */}
              {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos) => (
                <div
                  key={pos}
                  className={cn('absolute w-7 h-7 pointer-events-none', pos)}
                  style={{
                    borderTop: pos.includes('top') ? '2.5px solid white' : undefined,
                    borderBottom: pos.includes('bottom') ? '2.5px solid white' : undefined,
                    borderLeft: pos.includes('left') ? '2.5px solid white' : undefined,
                    borderRight: pos.includes('right') ? '2.5px solid white' : undefined,
                    borderRadius: pos.includes('top-0 left-0') ? '12px 0 0 0' :
                                  pos.includes('top-0 right-0') ? '0 12px 0 0' :
                                  pos.includes('bottom-0 left-0') ? '0 0 0 12px' : '0 0 12px 0',
                  }}
                />
              ))}

              {/* Overlay escuro + estrelas durante processamento */}
              {busy && (
                <div
                  className={cn(
                    'absolute inset-0 z-20 pointer-events-none overflow-hidden transition-opacity duration-500',
                    processing ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ backgroundColor: 'rgba(18,14,10,0.65)', backdropFilter: 'blur(2px)' }}
                >
                  <GoldSparkle className="top-[15%] left-[20%] w-4 h-4" delay="0.1s" />
                  <GoldSparkle className="top-[25%] right-[20%] w-7 h-7" delay="0.5s" />
                  <GoldSparkle className="bottom-[20%] left-[30%] w-5 h-5" delay="0.8s" />
                  <GoldSparkle className="top-[50%] right-[10%] w-3 h-3" delay="1.2s" />
                  <div className="absolute top-[40%] left-[15%] w-1 h-1 bg-yellow-200 rounded-full animate-pulse opacity-60" />
                  <div
                    className="absolute bottom-[35%] right-[25%] w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-40"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              )}

              {/* Laser */}
              {laserPhase && (
                <div className="animate-laser-rl absolute top-0 bottom-0 w-[3px] bg-white z-30 shadow-[0_0_25px_8px_rgba(255,255,255,1)]" />
              )}
            </div>
          ) : (
            /* Pós-remoção: preview com fundo transparente */
            <div className="w-full max-w-[300px] mx-auto">
              <ImagePreviewWithBg
                src={src}
                bgRemovedSrc={bgRemoved}
                bgState={bgState}
              />
            </div>
          )}

          {/* Texto de status IA */}
          {busy && (
            <span className="status-premium text-[10px]">
              {processing ? 'A analisar imagem…' : 'A finalizar…'}
            </span>
          )}

          {!busy && !bgDone && (
            <p className="text-[11px] font-medium text-slate-400 text-center">
              Arraste para posicionar · O resultado será 1:1
            </p>
          )}
        </div>

        {/* ── Remover fundo ── */}
        {!bgDone && !bgError && (
          <button
            type="button"
            onClick={onBgRemove}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-[13px] font-bold text-ink shadow-sm active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin text-slate-400" />
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
            Remover fundo
          </button>
        )}

        {bgDone && (
          <button
            type="button"
            onClick={onBgUndo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-[13px] font-bold text-ink shadow-sm active:scale-[0.98] transition-transform"
          >
            <RotateCcw size={15} className="text-slate-400" />
            Desfazer remoção
          </button>
        )}

        {bgError && (
          <>
            <button
              type="button"
              onClick={onBgRemove}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 border border-red-100 py-3.5 text-[13px] font-bold text-red-500 active:scale-[0.98] transition-transform"
            >
              <RefreshCw size={15} />
              Tentar novamente
            </button>
            <p className="text-center text-[11px] font-medium text-red-400">
              Não foi possível remover o fundo. Imagem original preservada.
            </p>
          </>
        )}

        {/* ── Confirmar / Usar imagem ── */}
        <button
          type="button"
          disabled={busy}
          onClick={() => onConfirm(offset.x, offset.y)}
          className="w-full py-4 rounded-2xl bg-[#0F172A] text-white text-[14px] font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none"
        >
          Usar imagem
        </button>
      </div>
    </Sheet>
  );
}

// ─── ImageActionSheet ─────────────────────────────────────────────────────────
// Sheet que abre ao tocar numa foto já existente na grelha.

function ImageActionSheet({
  open,
  onClose,
  isCover,
  editState,
  onEdit,
  onMakeCover,
  onRemove,
  onBgRemove,
  onBgUndo,
}: {
  open: boolean;
  onClose: () => void;
  isCover: boolean;
  editState: EditState | null;
  onEdit: () => void;
  onMakeCover: () => void;
  onRemove: () => void;
  onBgRemove: () => void;
  onBgUndo: () => void;
}) {
  if (!editState) return null;
  const { current, bgState, bgRemoved } = editState;
  const bgDone = bgState === 'done';
  const bgError = bgState === 'error';

  return (
    <Sheet open={open} onClose={onClose} title="Editar imagem" closeButton>
      <div className="flex flex-col gap-3 pb-6">
        {/* Preview */}
        <div className="mx-auto w-full max-w-[200px]">
          <ImagePreviewWithBg
            src={editState.original}
            bgRemovedSrc={bgRemoved}
            bgState={bgState}
          />
        </div>

        <div className="h-px bg-slate-100 my-1" />

        {/* Ajustar enquadramento */}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform"
        >
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Ajustar enquadramento
        </button>

        {/* Remover fundo */}
        {!bgDone && !bgError && (
          <button
            type="button"
            onClick={onBgRemove}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform"
          >
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Remover fundo
          </button>
        )}

        {bgDone && (
          <button
            type="button"
            onClick={onBgUndo}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-[13px] font-bold text-ink active:scale-[0.98] transition-transform"
          >
            <RotateCcw size={16} className="text-slate-400" />
            Desfazer remoção
          </button>
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

  // drag-to-reorder — instâneo, sem long-press
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartIndex = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const orderRef = useRef(photos);
  orderRef.current = photos;

  // ecrãs de edição
  const [cropIndex, setCropIndex] = useState<number | null>(null);       // posicionar + bg-remove
  const [actionIndex, setActionIndex] = useState<number | null>(null);   // menu de acções para fotos existentes

  const [editStates, setEditStates] = useState<Record<string, EditState>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const swapInputRef = useRef<HTMLInputElement>(null);

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleFiles(files: FileList | null, replaceIndex?: number) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const limit = replaceIndex !== undefined ? 1 : MAX_FOTOS - photos.length;
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, limit)) {
      const { url } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (url) uploaded.push(url);
    }
    if (replaceIndex !== undefined && uploaded[0]) {
      const next = [...photos];
      next[replaceIndex] = uploaded[0];
      onChange(next);
      setTimeout(() => setCropIndex(replaceIndex), 80);
    } else {
      const newPhotos = [...photos, ...uploaded];
      onChange(newPhotos);
      if (uploaded.length >= 1) {
        setTimeout(() => setCropIndex(newPhotos.length - 1), 80);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    if (swapInputRef.current) swapInputRef.current.value = '';
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────

  const DRAG_PX = 5;

  function onPointerDown(e: React.PointerEvent, index: number) {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartIndex.current = index;
    isDraggingRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStartPos.current || dragStartIndex.current === null) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (!isDraggingRef.current) {
      if (Math.hypot(dx, dy) < DRAG_PX) return;
      isDraggingRef.current = true;
      setDragIndex(dragStartIndex.current);
    }

    setFloatPos({ x: e.clientX, y: e.clientY });

    const el = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest('[data-photo-index]') as HTMLElement | null;
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
      isDraggingRef.current = false;
      setDragIndex(null);
      setFloatPos(null);
      dragStartPos.current = null;
      dragStartIndex.current = null;
    } else {
      dragStartPos.current = null;
      dragStartIndex.current = null;
      setActionIndex(index);
    }
  }

  // ── EditState ────────────────────────────────────────────────────────────────

  function getEditState(url: string): EditState {
    return editStates[url] ?? { original: url, current: url, bgRemoved: null, bgState: 'idle' };
  }

  function patchEditState(url: string, patch: Partial<EditState>) {
    setEditStates((prev) => ({
      ...prev,
      [url]: { ...(prev[url] ?? { original: url, current: url, bgRemoved: null, bgState: 'idle' as BgState }), ...patch },
    }));
  }

  // ── BG removal com sequência de animações do reference ────────────────────────

  async function handleBgRemove(url: string) {
    patchEditState(url, { bgState: 'processing' });

    try {
      // Simula frases IA (2.5s) + depois laser (2s) = total ~4.5s visualmente
      const resultUrl = await removeBgApi(url);

      // Fase 1: overlay escuro + estrelas (já activo)
      // Fase 2: após 2.5s → clareia e laser começa
      await new Promise<void>((res) => setTimeout(res, 2500));
      patchEditState(url, { bgState: 'laser', bgRemoved: resultUrl });

      // Fase 3: após 2s do laser → done
      await new Promise<void>((res) => setTimeout(res, 2000));
      patchEditState(url, { bgState: 'done', current: resultUrl });
      onChange(photos.map((u) => (u === url ? resultUrl : u)));
    } catch {
      patchEditState(url, { bgState: 'error' });
    }
  }

  function handleBgUndo(url: string) {
    const state = getEditState(url);
    patchEditState(url, { bgState: 'idle', current: state.original });
    onChange(photos.map((u) => (u === state.bgRemoved ? state.original : u)));
  }

  // ── Crop confirm ─────────────────────────────────────────────────────────────

  async function handleCropConfirm(index: number, offsetX: number, offsetY: number) {
    const url = photos[index];
    const state = getEditState(url);
    try {
      const croppedDataUrl = await cropToSquare(state.current, offsetX, offsetY);
      const file = dataURLtoFile(croppedDataUrl, `crop-${Date.now()}.png`);
      const { url: newUrl } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (newUrl) {
        const next = [...photos];
        next[index] = newUrl;
        onChange(next);
        setEditStates((prev) => {
          const existing = prev[url] ?? { original: url, current: url, bgRemoved: null, bgState: 'idle' as BgState };
          const updated = { ...prev };
          delete updated[url];
          updated[newUrl] = { ...existing, original: newUrl, current: newUrl };
          return updated;
        });
      }
    } catch {
      // silent
    }
    setCropIndex(null);
  }

  // ── Acções ───────────────────────────────────────────────────────────────────

  function handleRemove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
    setActionIndex(null);
  }

  function handleMakeCover(index: number) {
    if (index === 0) return setActionIndex(null);
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
    setActionIndex(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const cropPhoto = cropIndex !== null ? photos[cropIndex] : null;
  const cropEditState = cropPhoto ? getEditState(cropPhoto) : null;

  const actionPhoto = actionIndex !== null ? photos[actionIndex] : null;
  const actionEditState = actionPhoto ? getEditState(actionPhoto) : null;

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
      <div className="grid grid-cols-4 gap-2.5">
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
                'relative aspect-square touch-none select-none overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-all duration-150',
                dragging ? 'opacity-25 scale-95 ring-2 ring-ink/20' : 'opacity-100 scale-100',
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

      {/* Thumbnail flutuante durante drag */}
      {dragIndex !== null && floatPos && photos[dragIndex] && (
        <div
          className="pointer-events-none fixed z-[200] h-16 w-16 overflow-hidden rounded-2xl shadow-2xl ring-2 ring-ink/20"
          style={{
            left: floatPos.x - 32,
            top: floatPos.y - 32,
            transform: 'scale(1.12) rotate(2deg)',
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
        onChange={(e) => handleFiles(e.target.files, actionIndex ?? undefined)}
      />

      {/* Ecrã de posicionamento + remover fundo (novo upload / trocar) */}
      {cropPhoto && cropEditState && (
        <CropAndEditSheet
          open={cropIndex !== null}
          src={cropEditState.current}
          editState={cropEditState}
          onClose={() => setCropIndex(null)}
          onConfirm={(ox, oy) => cropIndex !== null && handleCropConfirm(cropIndex, ox, oy)}
          onBgRemove={() => cropPhoto && handleBgRemove(cropEditState.original)}
          onBgUndo={() => cropPhoto && handleBgUndo(cropEditState.original)}
        />
      )}

      {/* Menu de acções para fotos existentes (tap) */}
      <ImageActionSheet
        open={actionIndex !== null}
        onClose={() => setActionIndex(null)}
        isCover={actionIndex === 0}
        editState={actionEditState}
        onEdit={() => {
          setCropIndex(actionIndex);
          setActionIndex(null);
        }}
        onMakeCover={() => actionIndex !== null && handleMakeCover(actionIndex)}
        onRemove={() => actionIndex !== null && handleRemove(actionIndex)}
        onBgRemove={() => {
          if (!actionPhoto) return;
          const st = getEditState(actionPhoto);
          handleBgRemove(st.original);
          setActionIndex(null);
          setCropIndex(actionIndex);
        }}
        onBgUndo={() => actionPhoto && handleBgUndo(getEditState(actionPhoto).original)}
      />
    </div>
  );
}
