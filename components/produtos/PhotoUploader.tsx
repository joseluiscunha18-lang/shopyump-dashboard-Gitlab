'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Loader2,
  ImageMinus,
  RotateCcw,
  RefreshCw,
  ImagePlus,
  Crop,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { Sheet } from '@/components/ui/ShopyumpSheet';
import { cn } from '@/lib/cn';
import { ImageLibrarySheet } from '@/components/produtos/ImageLibrarySheet';

const MAX_FOTOS = 8;

// ─── Types ────────────────────────────────────────────────────────────────────────────────

type BgState = 'idle' | 'processing' | 'laser' | 'done' | 'error';
interface EditState {
  original: string;
  current: string;
  bgRemoved: string | null;
  bgState: BgState;
}

// Alvo do sheet de recorte: uma foto já existente na grelha, ou uma foto
// nova ainda não confirmada (nunca aparece nas miniaturas antes de "Usar imagem").
type CropTarget =
  | { type: 'existing'; index: number }
  | { type: 'new'; url: string; replaceIndex?: number };

// ─── Helpers ────────────────────────────────────────────────────────────────────────────────

async function cropToSquare(
  src: string,
  cropBox: { x: number; y: number; size: number; mode?: 'fill' | 'fit' },
  naturalSize: { w: number; h: number },
  renderedSize: { w: number; h: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d')!;
      if (cropBox.mode === 'fit') {
        // Fundo suave #F3F3F3 nas margens do modo "Imagem inteira".
        ctx.fillStyle = '#F3F3F3';
        ctx.fillRect(0, 0, 1000, 1000);
        const k = Math.min(1000 / img.naturalWidth, 1000 / img.naturalHeight);
        const w = img.naturalWidth * k;
        const h = img.naturalHeight * k;
        ctx.drawImage(img, (1000 - w) / 2, (1000 - h) / 2, w, h);
      } else {
        const scaleX = naturalSize.w / renderedSize.w;
        const scaleY = naturalSize.h / renderedSize.h;
        ctx.drawImage(img, cropBox.x * scaleX, cropBox.y * scaleY, cropBox.size * scaleX, cropBox.size * scaleY, 0, 0, 1000, 1000);
      }
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

// ─── Sparkle star ────────────────────────────────────────────────────────────────────────

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

// ─── ImagePreviewWithBg ───────────────────────────────────────────────────────────────────

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
      className="relative w-full rounded-md overflow-hidden bg-[#FAFAF9] border border-[#EDEBE8] shadow-inner"
      style={{ paddingBottom: '100%' }}
    >
      {done && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              'repeating-conic-gradient(#E5E3E0 0% 25%, white 0% 50%)',
            backgroundSize: '16px 16px',
          }}
        />
      )}
      {bgRemovedSrc && (
        <img
          src={bgRemovedSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-[5] pointer-events-none"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={cn(
          'absolute inset-0 w-full h-full object-cover z-10 pointer-events-none transition-transform duration-700',
          laser && 'animate-wipe-rl',
        )}
      />
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
      {laser && (
        <div className="animate-laser-rl absolute top-0 bottom-0 w-[3px] bg-white z-30 shadow-[0_0_25px_8px_rgba(255,255,255,1)]" />
      )}
    </div>
  );
}

// ─── Cropper simples: Preenchida (arrastar + zoom) ou Imagem inteira ───────────

type FitMode = 'fill' | 'fit';

interface CropBox {
  x: number; // posição relativa ao canto superior-esquerdo da imagem renderizada
  y: number;
  size: number;
  mode?: FitMode;
}

function Cropper({
  src,
  onReady,
}: {
  src: string;
  onReady: (
    getCrop: () => { cropBox: CropBox; naturalSize: { w: number; h: number }; renderedSize: { w: number; h: number } },
  ) => void;
}) {
  const C = 315;
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [mode, setMode] = useState<FitMode>('fill');
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 }); // deslocamento do centro (px)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const base = nat ? (mode === 'fill' ? Math.max(C / nat.w, C / nat.h) : Math.min(C / nat.w, C / nat.h)) : 1;
  const scale = base * (mode === 'fill' ? zoom : 1);
  const rw = nat ? nat.w * scale : C;
  const rh = nat ? nat.h * scale : C;

  function clamp(o: { x: number; y: number }) {
    const mx = Math.max(0, (rw - C) / 2);
    const my = Math.max(0, (rh - C) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  }

  useEffect(() => { setOff((o) => clamp(o)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, mode, nat]);

  const left = (C - rw) / 2 + off.x;
  const top = (C - rh) / 2 + off.y;

  useEffect(() => {
    if (!nat) return;
    onReady(() => ({
      cropBox: mode === 'fill' ? { x: -left, y: -top, size: C, mode } : { x: 0, y: 0, size: C, mode },
      naturalSize: nat,
      renderedSize: { w: rw, h: rh },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nat, mode, zoom, off]);

  const seg = (m: FitMode, label: string) => (
    <button
      type="button"
      onClick={() => { setMode(m); setZoom(1); setOff({ x: 0, y: 0 }); }}
      className={cn(
        'flex-1 rounded-md py-2 text-[12.5px] font-bold transition-colors',
        mode === m ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground',
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-4" style={{ width: C }}>
      <div className="flex w-full rounded-lg bg-[#EFEEEC] p-1">
        {seg('fill', 'Preenchida')}
        {seg('fit', 'Imagem inteira')}
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-[#E4E2DF] bg-[#F3F3F3] touch-none select-none',
          mode === 'fill' && 'cursor-grab active:cursor-grabbing',
        )}
        style={{ width: C, height: C }}
        onPointerDown={(e) => {
          if (mode !== 'fill') return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setOff(clamp({ x: drag.current.ox + e.clientX - drag.current.px, y: drag.current.oy + e.clientY - drag.current.py }));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute pointer-events-none"
          style={{ left, top, width: rw, height: rh, maxWidth: 'none', opacity: nat ? 1 : 0 }}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        />
      </div>

      {mode === 'fill' ? (
        <div className="flex w-full items-center gap-3">
          <span className="text-[11px] font-bold text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#1A1714]"
            aria-label="Zoom"
          />
        </div>
      ) : (
        <p className="text-[11px] font-medium text-muted-foreground">A imagem aparece completa, com margens cinza-claro.</p>
      )}
      {mode === 'fill' && (
        <p className="-mt-2 text-[11px] font-medium text-muted-foreground">Arraste a imagem para posicionar</p>
      )}
    </div>
  );
}

// ─── CropAndEditSheet ─────────────────────────────────────────────────────────────────────

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
  onConfirm: (getCrop: () => { cropBox: CropBox; naturalSize: { w: number; h: number }; renderedSize: { w: number; h: number } }) => void;
  onClose: () => void;
  onBgRemove: () => void;
  onBgUndo: () => void;
}) {
  const getCropRef = useRef<(() => { cropBox: CropBox; naturalSize: { w: number; h: number }; renderedSize: { w: number; h: number } }) | null>(null);
  const [bgDoneNatural, setBgDoneNatural] = useState<{ w: number; h: number } | null>(null);

  const { bgState } = editState;
  const processing = bgState === 'processing';
  const laserPhase = bgState === 'laser';
  const bgDone = bgState === 'done';
  const bgError = bgState === 'error';
  const busy = processing || laserPhase;

  const [statusText, setStatusText] = useState('A analisar imagem…');

  useEffect(() => {
    if (!processing) return;
    const frases = [
      'A analisar imagem…',
      'A identificar produto…',
      'A polir detalhes…',
      'A finalizar magia…',
    ];
    let step = 0;
    setStatusText(frases[0]);
    const interval = setInterval(() => {
      step++;
      if (step < frases.length) setStatusText(frases[step]);
    }, 700);
    return () => clearInterval(interval);
  }, [processing]);

  function handleConfirm() {
    // Fecha o sheet IMEDIATAMENTE — o upload acontece em background
    if (getCropRef.current) {
      onConfirm(getCropRef.current);
    } else if (bgDoneNatural) {
      // Sem fundo: sem crop box, mas a imagem foi mostrada com object-cover
      // a preencher o quadrado — replica esse recorte centrado (cover) real.
      const { w, h } = bgDoneNatural;
      const size = Math.min(w, h);
      onConfirm(() => ({
        cropBox: { x: (w - size) / 2, y: (h - size) / 2, size },
        naturalSize: { w, h },
        renderedSize: { w, h },
      }));
    } else {
      // fallback final: usa a imagem inteira
      onConfirm(() => ({
        cropBox: { x: 0, y: 0, size: 315 },
        naturalSize: { w: 315, h: 315 },
        renderedSize: { w: 315, h: 315 },
      }));
    }
    // onConfirm é responsável por fechar o sheet; não esperamos
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={busy ? 'A remover fundo' : 'Posicionar imagem'}
      subtitle={busy ? undefined : 'Escolha como a imagem aparece'}
      closeButton
      heightVh={92}
    >
      <div className="flex flex-col gap-5 pb-6">

        {/* Cropper principal */}
        <div className="flex flex-col items-center gap-3">
          {busy ? (
            <div style={{ width: 315 }}>
              <ImagePreviewWithBg src={src} bgRemovedSrc={editState.bgRemoved} bgState={bgState} />
            </div>
          ) : bgDone ? (
            // Depois de remover o fundo: sem crop box, imagem a 100% do quadrado 1:1.
            <div
              className="relative overflow-hidden rounded-md bg-[#F4F4F3] shadow-sm mx-auto"
              style={{ width: 315, height: 315 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setBgDoneNatural({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
            </div>
          ) : (
            <Cropper
              src={src}
              onReady={(getter) => { getCropRef.current = getter; }}
            />
          )}

          {busy && (
            <span className="status-premium text-[10px]">
              {processing ? statusText : 'A finalizar…'}
            </span>
          )}
        </div>

        {bgDone && (
          <button
            type="button"
            onClick={onBgUndo}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#D4D2CF] bg-white py-3.5 text-[13px] font-bold text-ink shadow-sm active:scale-[0.98] transition-transform"
          >
            <RotateCcw size={15} className="text-[#8A8681]" />
            Desfazer remoção
          </button>
        )}

        {bgError && (
          <>
            <button
              type="button"
              onClick={onBgRemove}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 border border-red-100 py-3.5 text-[13px] font-bold text-red-500 active:scale-[0.98] transition-transform"
            >
              <RefreshCw size={15} />
              Tentar novamente
            </button>
            <p className="text-center text-[11px] font-medium text-red-400">
              Não foi possível remover o fundo. Imagem original preservada.
            </p>
          </>
        )}

        {/* Usar imagem — fecha INSTANTANEAMENTE */}
        <button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          className="w-full py-4 rounded-md bg-[#111110] text-white text-[14px] font-bold shadow-[0_10px_24px_-10px_rgba(28,25,23,0.5)] hover:bg-[#27272A] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none"
        >
          Usar imagem
        </button>
      </div>
    </Sheet>
  );
}

// ─── ImageActionSheet ───────────────────────────────────────────────────────────────────────
// Menu compacto: só escolhe a ação. A pré-visualização aparece apenas no
// editor (ajustar / remover fundo).

function ImageActionSheet({
  open,
  onClose,
  onEdit,
  onRemove,
  onBgRemove,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onBgRemove: () => void;
}) {
  const item =
    'flex w-full items-center gap-3.5 px-1.5 py-3 text-left rounded-lg active:bg-muted/60 transition-colors';
  const tile = 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F4F4F3]';
  return (
    <Sheet open={open} onClose={onClose} title="Opções da imagem" closeButton>
      <div className="flex flex-col pb-5">
        <button type="button" onClick={onEdit} className={item}>
          <span className={tile}><Crop size={18} strokeWidth={1.75} className="text-foreground" /></span>
          <span className="text-[14px] font-semibold text-foreground">Ajustar imagem</span>
        </button>
        <button type="button" onClick={onBgRemove} className={item}>
          <span className={tile}><Sparkles size={18} strokeWidth={1.75} className="text-foreground" /></span>
          <span className="text-[14px] font-semibold text-foreground">Remover fundo</span>
        </button>
        <button type="button" onClick={onRemove} className={item}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 ring-1 ring-destructive/15">
            <ImageMinus size={18} strokeWidth={1.75} className="text-destructive" />
          </span>
          <span className="text-[14px] font-semibold text-destructive">Remover imagem</span>
        </button>
      </div>
    </Sheet>
  );
}

// ─── PhotoUploader (principal) ──────────────────────────────────────────────────────────────────────

export function PhotoUploader({
  photos,
  onChange,
  lojaId,
  error,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  lojaId?: string;
  /** Estado de erro (ex: publicar sem nenhuma imagem) — só afeta a área de
   *  upload vazia; a grelha com fotos já resolvida não precisa de aviso. */
  error?: boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartIndex = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const orderRef = useRef(photos);
  orderRef.current = photos;

  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [pendingQueue, setPendingQueue] = useState<string[]>([]);
  const [actionIndex, setActionIndex] = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  // Mapa url-de-exibição → url ORIGINAL limpa (nunca recortada). Garante que
  // voltar a ajustar uma foto recorte sempre a original, sem arrastar as
  // margens já gravadas no blob anterior.
  const pristineRef = useRef<Record<string, string>>({});

  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const swapInputRef = useRef<HTMLInputElement>(null);

  // Abre automaticamente o próximo ficheiro pendente na fila (um de cada vez),
  // assim que o sheet de recorte anterior fechar.
  useEffect(() => {
    if (cropTarget || pendingQueue.length === 0) return;
    const [next, ...rest] = pendingQueue;
    setCropTarget({ type: 'new', url: next });
    setPendingQueue(rest);
  }, [cropTarget, pendingQueue]);

  // ── Upload ─────────────────────────────────────────────────────────────────────────────────────

  function handleFiles(files: FileList | null, replaceIndex?: number) {
    if (!files || files.length === 0) return;

    if (replaceIndex !== undefined) {
      const file = files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setCropTarget({ type: 'new', url, replaceIndex });
      }
    } else {
      const reservedSlots =
        (cropTarget?.type === 'new' && cropTarget.replaceIndex === undefined ? 1 : 0) +
        pendingQueue.length;
      const limit = Math.max(MAX_FOTOS - photos.length - reservedSlots, 0);
      const urls = Array.from(files)
        .slice(0, limit)
        .map((file) => URL.createObjectURL(file));
      if (urls.length > 0) setPendingQueue((prev) => [...prev, ...urls]);
    }

    if (inputRef.current) inputRef.current.value = '';
    if (swapInputRef.current) swapInputRef.current.value = '';
  }

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────────────────────────

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

  // ── EditState ────────────────────────────────────────────────────────────────────────────────

  function getEditState(url: string): EditState {
    const key = pristineRef.current[url] ?? url;
    return editStates[key] ?? { original: key, current: url, bgRemoved: null, bgState: 'idle' };
  }

  function patchEditState(url: string, patch: Partial<EditState>) {
    const key = pristineRef.current[url] ?? url;
    setEditStates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { original: key, current: url, bgRemoved: null, bgState: 'idle' as BgState }), ...patch },
    }));
  }

  // ── BG removal ───────────────────────────────────────────────────────────────────────────────────

  async function handleBgRemove(url: string) {
    patchEditState(url, { bgState: 'processing' });
    try {
      const resultUrl = url;
      await new Promise<void>((res) => setTimeout(res, 2500));
      patchEditState(url, { bgState: 'laser', bgRemoved: resultUrl });
      await new Promise<void>((res) => setTimeout(res, 2000));
      // Só substitui no produto quando o utilizador toca em "Usar imagem".
      patchEditState(url, { bgState: 'done', current: resultUrl });
    } catch {
      patchEditState(url, { bgState: 'error' });
    }
  }

  function handleBgUndo(url: string) {
    const state = getEditState(url);
    patchEditState(url, { bgState: 'idle', current: state.original });
  }

  // ── Crop confirm — fecha instantaneamente, gera novo blob cropado ───────────
  // O upload para o Supabase só acontece ao guardar o produto (ProductForm).
  // Fotos novas só entram no array `photos` (e portanto nas miniaturas) aqui,
  // depois de o utilizador confirmar com "Usar imagem".

  function handleCropConfirm(
    target: CropTarget,
    getCrop: () => { cropBox: CropBox; naturalSize: { w: number; h: number }; renderedSize: { w: number; h: number } },
  ) {
    const sourceUrl = target.type === 'existing' ? photos[target.index] : target.url;
    const state = getEditState(sourceUrl);

    // Fecha o sheet imediatamente
    setCropTarget(null);

    // Aplica o crop localmente (gera novo blob) em background
    (async () => {
      try {
        const { cropBox, naturalSize, renderedSize } = getCrop();
        // Recorta SEMPRE a partir da original limpa — nunca do blob já
        // recortado, para as margens antigas não reaparecerem.
        const croppedDataUrl = await cropToSquare(state.original, cropBox, naturalSize, renderedSize);
        // Converte para blob URL para manter a pré-visualização
        const res = await fetch(croppedDataUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (target.type === 'existing') {
          const next = [...orderRef.current];
          next[target.index] = blobUrl;
          onChange(next);
        } else if (target.replaceIndex !== undefined) {
          const next = [...orderRef.current];
          next[target.replaceIndex] = blobUrl;
          onChange(next);
        } else {
          onChange([...orderRef.current, blobUrl]);
        }

        // A chave do estado continua a ser a ORIGINAL limpa: voltar a
        // ajustar recorta sempre a partir dela, nunca do blob recortado.
        setEditStates((prev) => {
          const existing = prev[state.original] ?? { original: state.original, current: sourceUrl, bgRemoved: null, bgState: 'idle' as BgState };
          const updated = { ...prev };
          updated[state.original] = { ...existing, current: blobUrl };
          return updated;
        });
        pristineRef.current[blobUrl] = state.original;
        if (target.type === 'existing' && sourceUrl !== state.original) {
          delete pristineRef.current[sourceUrl];
        }
        if (target.type === 'new' && target.replaceIndex !== undefined) {
          const antiga = orderRef.current[target.replaceIndex];
          if (antiga) {
            const chaveAntiga = pristineRef.current[antiga] ?? antiga;
            delete pristineRef.current[antiga];
            setEditStates((prev) => {
              if (!(chaveAntiga in prev)) return prev;
              const updated = { ...prev };
              delete updated[chaveAntiga];
              return updated;
            });
          }
        }
      } catch (err) {
        // Antes, a foto já estava no array mesmo antes do recorte terminar,
        // por isso uma falha aqui não a fazia desaparecer. Agora que só
        // entra no array após o recorte, uma falha silenciosa perdia a
        // imagem por completo. Para não a perder, adiciona a original.
        console.error('Falha ao recortar imagem, a usar original:', err);
        if (target.type === 'existing') {
          // já estava no array — não faz nada, mantém a foto como estava
        } else if (target.replaceIndex !== undefined) {
          const next = [...orderRef.current];
          next[target.replaceIndex] = sourceUrl;
          onChange(next);
        } else {
          onChange([...orderRef.current, sourceUrl]);
        }
      }
    })();
  }

  // Cancela um recorte pendente (foto nova ainda não confirmada) — descarta
  // a imagem sem nunca a ter mostrado nas miniaturas.
  function handleCropCancel() {
    if (cropTarget?.type === 'new') {
      const url = cropTarget.url;
      setEditStates((prev) => {
        if (!(url in prev)) return prev;
        const updated = { ...prev };
        delete updated[url];
        return updated;
      });
      URL.revokeObjectURL(url);
    } else if (cropTarget?.type === 'existing') {
      // Cancelar não aplica nada: mantém a foto como está, sem resultado de fundo.
      const url = photos[cropTarget.index];
      if (url) {
        patchEditState(url, { bgState: 'idle', bgRemoved: null });
      }
    }
    setCropTarget(null);
  }

  // ── Acções ───────────────────────────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────────────────────────────

  const cropSrcUrl =
    cropTarget?.type === 'existing' ? photos[cropTarget.index] : cropTarget?.url ?? null;
  const cropEditState = cropSrcUrl ? getEditState(cropSrcUrl) : null;

  const actionPhoto = actionIndex !== null ? photos[actionIndex] : null;
  const actionEditState = actionPhoto ? getEditState(actionPhoto) : null;

  return (
    <div data-loja-id={lojaId}>
      {/* Container de upload — só quando ainda não há fotos */}
      {photos.length === 0 && (
        <>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className={cn(
              'group relative w-full overflow-hidden rounded-xl border border-dashed transition-all duration-150 active:scale-[0.985]',
              error
                ? 'border-red-200 bg-red-50/60'
                : 'border-[#D4D2CF] bg-[#FCFCFB] hover:border-[#A8A5A1] hover:bg-[#F8F8F7]'
            )}
          >
            <span className="relative flex flex-row items-center justify-center gap-4 py-7 px-5">
              {/* Icon */}
              <ImagePlus
                size={22}
                strokeWidth={1.75}
                className={error ? 'text-red-400' : 'text-[#71717A]'}
              />

              {/* Text stack */}
              <span className="flex flex-col items-start gap-1">
                <span className={cn(
                  'text-[13px] font-bold leading-tight',
                  error ? 'text-red-600' : 'text-[#3F3F46]'
                )}>
                  Adicionar imagem
                </span>
                <span className={cn(
                  'text-[11px] font-medium',
                  error ? 'text-red-400' : 'text-[#A1A1AA]'
                )}>
                  Até {MAX_FOTOS} imagens · JPG, PNG ou WEBP
                </span>
              </span>
            </span>
          </button>
          {error && (
            <p className="mt-1.5 pl-0.5 text-[11.5px] font-bold text-red-500">
              Adicione pelo menos uma imagem do produto.
            </p>
          )}
        </>
      )}

      {/* Grelha de imagens */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((url, i) => {
            const dragging = dragIndex === i;
            return (
              <div
                key={url}
                data-photo-index={i}
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={() => onPointerUp(i)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'relative aspect-square touch-none select-none overflow-hidden rounded-[6px] bg-[#F4F4F3] transition-all duration-150',
                  i === 0 && photos.length > 1 ? 'border-2 border-[#1C1917]' : 'border border-[#E4E2DF]',
                  dragging ? 'opacity-25 scale-95 ring-2 ring-[rgba(28,25,23,0.2)]' : 'opacity-100 scale-100',
                )}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="pointer-events-none object-cover"
                  sizes="160px"
                  unoptimized={url.startsWith('blob:')}
                />
                <button
                  type="button"
                  aria-label="Opções da imagem"
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionIndex(i);
                  }}
                  className="absolute right-1 top-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-foreground/60 text-background backdrop-blur-sm active:scale-95"
                >
                  <MoreHorizontal size={14} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}

          {photos.length < MAX_FOTOS && (
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[6px] border-[1.5px] border-dashed border-[#B8B5B1] text-[#71717A] transition-all duration-150 hover:border-[#6B7280] hover:text-[#52525B] active:bg-[#F4F4F3]"
            >
              <Plus size={20} strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-[0.08em]">Adicionar</span>
            </button>
          )}
        </div>
      )}

      {/* Float ghost durante drag */}
      {dragIndex !== null && floatPos && photos[dragIndex] && (
        <div
          className="pointer-events-none fixed z-[200] h-16 w-16 overflow-hidden rounded-md shadow-2xl ring-2 ring-[rgba(28,25,23,0.2)]"
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
        <p className="mt-3 text-center text-[10.5px] font-semibold text-[#71717A]">
          Arraste para reordenar · Toque para editar
        </p>
      )}

      <ImageLibrarySheet
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        lojaId={lojaId ?? ''}
        existing={photos}
        onConfirm={(urls) => {
          onChange([...orderRef.current, ...urls].slice(0, MAX_FOTOS));
          setLibraryOpen(false);
        }}
      />
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

      {cropSrcUrl && cropEditState && (
        <CropAndEditSheet
          open={cropTarget !== null}
          src={cropEditState.original}
          editState={cropEditState}
          onClose={handleCropCancel}
          onConfirm={(getCrop) => cropTarget && handleCropConfirm(cropTarget, getCrop)}
          onBgRemove={() => {
            if (!cropSrcUrl) return;
            handleBgRemove(cropSrcUrl);
          }}
          onBgUndo={() => {
            if (!cropSrcUrl) return;
            handleBgUndo(cropSrcUrl);
          }}
        />
      )}

      <ImageActionSheet
        open={actionIndex !== null}
        onClose={() => setActionIndex(null)}
        onEdit={() => {
          if (actionIndex !== null) setCropTarget({ type: 'existing', index: actionIndex });
          setActionIndex(null);
        }}
        onRemove={() => actionIndex !== null && handleRemove(actionIndex)}
        onBgRemove={() => {
          if (!actionPhoto || actionIndex === null) return;
          handleBgRemove(actionPhoto);
          setActionIndex(null);
          setCropTarget({ type: 'existing', index: actionIndex });
        }}
      />
    </div>
  );
}
