'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Loader2,
  Star,
  Trash2,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
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
  cropBox: { x: number; y: number; size: number },
  naturalSize: { w: number; h: number },
  renderedSize: { w: number; h: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scaleX = naturalSize.w / renderedSize.w;
      const scaleY = naturalSize.h / renderedSize.h;
      const sx = cropBox.x * scaleX;
      const sy = cropBox.y * scaleY;
      const sSize = cropBox.size * Math.min(scaleX, scaleY);
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, 1000, 1000);
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

// ─── Sparkle star ─────────────────────────────────────────────────────────────

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

// ─── Cropper com alças de redimensionamento ───────────────────────────────────
// Lógica: a imagem é exibida em tamanho fixo (nunca se move) dentro de um
// container. A crop box quadrada arrasta-se dentro da imagem (a imagem é
// o limite) e redimensiona-se apenas pelas 4 alças dos cantos.

type Handle = 'nw' | 'ne' | 'sw' | 'se';

interface CropBox {
  x: number; // posição relativa ao canto superior-esquerdo da imagem renderizada
  y: number;
  size: number;
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
  const CONTAINER = 315; // px — quadrado fixo visível (+5%)

  const containerRef = useRef<HTMLDivElement>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);
  const [imgRendered, setImgRendered] = useState<{ w: number; h: number } | null>(null);

  // Posição do canto sup-esq da imagem dentro do container — fixa após o load
  // (a imagem é centrada e nunca se move).
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  // Crop box: coordenadas relativas ao canto sup-esq da imagem renderizada
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, size: CONTAINER });

  // refs de arrastos
  const boxDragStart = useRef<{ px: number; py: number; bx: number; by: number } | null>(null);
  const handleStart = useRef<{
    handle: Handle;
    px: number; py: number;
    box: CropBox;
  } | null>(null);

  // Expõe função getter ao pai
  useEffect(() => {
    if (!imgNatural || !imgRendered) return;
    onReady(() => ({ cropBox, naturalSize: imgNatural, renderedSize: imgRendered }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropBox, imgNatural, imgRendered]);

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const nat = { w: img.naturalWidth, h: img.naturalHeight };
    setImgNatural(nat);

    // Fit da imagem inteira dentro de CONTAINER (contain), mantendo aspect.
    // A imagem fica sempre visível por completo e fixa.
    const scale = Math.min(CONTAINER / nat.w, CONTAINER / nat.h);
    const rw = Math.round(nat.w * scale);
    const rh = Math.round(nat.h * scale);
    setImgRendered({ w: rw, h: rh });

    // Centra a imagem no container — posição fixa, não muda mais.
    const startX = (CONTAINER - rw) / 2;
    const startY = (CONTAINER - rh) / 2;
    setImgPos({ x: startX, y: startY });

    // Crop box centrada, quadrado máximo que cabe na imagem.
    const boxSize = Math.min(rw, rh);
    const bx = (rw - boxSize) / 2;
    const by = (rh - boxSize) / 2;
    setCropBox({ x: bx, y: by, size: boxSize });
  }

  // ── Arrastar a crop box dentro da imagem (imagem fixa) ────────────────────

  function onBoxDown(e: React.PointerEvent) {
    if (handleStart.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    boxDragStart.current = { px: e.clientX, py: e.clientY, bx: cropBox.x, by: cropBox.y };
  }

  function onBoxMove(e: React.PointerEvent) {
    if (!boxDragStart.current || !imgRendered) return;
    const dx = e.clientX - boxDragStart.current.px;
    const dy = e.clientY - boxDragStart.current.py;

    const maxX = imgRendered.w - cropBox.size;
    const maxY = imgRendered.h - cropBox.size;

    const newX = Math.min(Math.max(boxDragStart.current.bx + dx, 0), Math.max(maxX, 0));
    const newY = Math.min(Math.max(boxDragStart.current.by + dy, 0), Math.max(maxY, 0));

    setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
  }

  function onBoxUp() {
    boxDragStart.current = null;
  }

  // ── Handles de redimensionamento (só 4 cantos) ────────────────────────────

  function onHandleDown(e: React.PointerEvent, handle: Handle) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStart.current = { handle, px: e.clientX, py: e.clientY, box: { ...cropBox } };
  }

  function onHandleMove(e: React.PointerEvent) {
    if (!handleStart.current || !imgRendered) return;
    const { handle, px, py, box } = handleStart.current;
    const dx = e.clientX - px;
    const dy = e.clientY - py;

    let { x, y, size } = box;
    const MIN_SIZE = 80;

    // Para manter 1:1 nos cantos, usa o delta máximo
    if (handle === 'nw') {
      const d = Math.min(dx, dy);
      const newSize = Math.max(MIN_SIZE, size - d);
      const diff = size - newSize;
      x = box.x + diff;
      y = box.y + diff;
      size = newSize;
    } else if (handle === 'ne') {
      const d = -Math.min(-dx, dy);
      const newSize = Math.max(MIN_SIZE, size + d);
      y = box.y - (newSize - size);
      size = newSize;
    } else if (handle === 'sw') {
      const d = Math.min(dx, -dy);
      const newSize = Math.max(MIN_SIZE, size - d);
      x = box.x + (size - newSize);
      size = newSize;
    } else if (handle === 'se') {
      const delta = Math.max(dx, dy);
      size = Math.max(MIN_SIZE, size + delta);
    }

    // Limita dentro da imagem renderizada (referencial próprio da imagem, começa em 0,0)
    const imgRight = imgRendered.w;
    const imgBottom = imgRendered.h;
    x = Math.max(0, Math.min(x, imgRight - MIN_SIZE));
    y = Math.max(0, Math.min(y, imgBottom - MIN_SIZE));
    size = Math.min(size, imgRight - x, imgBottom - y, CONTAINER);

    setCropBox({ x, y, size });
  }

  function onHandleUp() {
    handleStart.current = null;
  }

  // Posição da crop box no ecrã (relativa ao container)
  const cropScreen = {
    left: (cropBox.x + imgPos.x),
    top: (cropBox.y + imgPos.y),
    size: cropBox.size,
  };

  const handles: { id: Handle; style: React.CSSProperties; cursor: string }[] = [
    { id: 'nw', style: { top: -6, left: -6 }, cursor: 'nwse-resize' },
    { id: 'ne', style: { top: -6, right: -6 }, cursor: 'nesw-resize' },
    { id: 'sw', style: { bottom: -6, left: -6 }, cursor: 'nesw-resize' },
    { id: 'se', style: { bottom: -6, right: -6 }, cursor: 'nwse-resize' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl bg-black/80 mx-auto touch-none select-none"
      style={{ width: CONTAINER, height: CONTAINER }}
    >
      {/* Imagem fixa — nunca se move */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute pointer-events-none"
        style={{
          left: imgPos.x,
          top: imgPos.y,
          width: imgRendered?.w ?? 'auto',
          height: imgRendered?.h ?? 'auto',
          maxWidth: 'none',
          opacity: 0.35, // área fora do crop aparece escurecida
        }}
        onLoad={onImgLoad}
      />

      {/* Área de recorte — a imagem aparece aqui em plena opacidade.
          Esta área é a que se arrasta (a imagem por trás está fixa). */}
      <div
        className="absolute overflow-hidden touch-none"
        style={{
          left: cropScreen.left,
          top: cropScreen.top,
          width: cropScreen.size,
          height: cropScreen.size,
          cursor: 'move',
        }}
        onPointerDown={onBoxDown}
        onPointerMove={(e) => { onBoxMove(e); onHandleMove(e); }}
        onPointerUp={() => { onBoxUp(); onHandleUp(); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute pointer-events-none"
          style={{
            left: imgPos.x - cropScreen.left,
            top: imgPos.y - cropScreen.top,
            width: imgRendered?.w ?? 'auto',
            height: imgRendered?.h ?? 'auto',
            maxWidth: 'none',
          }}
        />
        {/* Grade de composição */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
            backgroundSize: `${cropScreen.size / 3}px ${cropScreen.size / 3}px`,
          }}
        />
      </div>

      {/* Borda da crop box + alças (só cantos) */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: cropScreen.left,
          top: cropScreen.top,
          width: cropScreen.size,
          height: cropScreen.size,
          border: '2px solid rgba(255,255,255,0.9)',
          borderRadius: 4,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
        }}
      >
        {/* Cantos decorativos brancos (L-shapes) */}
        {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos) => (
          <div
            key={pos}
            className={cn('absolute w-6 h-6 pointer-events-none', pos)}
            style={{
              borderTop: pos.includes('top') ? '3px solid white' : undefined,
              borderBottom: pos.includes('bottom') ? '3px solid white' : undefined,
              borderLeft: pos.includes('left') ? '3px solid white' : undefined,
              borderRight: pos.includes('right') ? '3px solid white' : undefined,
              borderRadius:
                pos === 'top-0 left-0' ? '3px 0 0 0' :
                pos === 'top-0 right-0' ? '0 3px 0 0' :
                pos === 'bottom-0 left-0' ? '0 0 0 3px' : '0 0 3px 0',
            }}
          />
        ))}

        {/* Alças de redimensionamento — só os 4 cantos (pointer-events: all) */}
        {handles.map(({ id, style, cursor }) => (
          <div
            key={id}
            className="absolute pointer-events-auto z-20"
            style={{
              ...style,
              width: 20,
              height: 20,
              cursor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPointerDown={(e) => onHandleDown(e, id)}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Hint de instrução */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
        <span
          className="text-[10px] font-semibold text-white/70 bg-black/30 rounded-full px-3 py-1"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          Arraste dentro da área · Use os cantos para ajustar
        </span>
      </div>
    </div>
  );
}

// ─── CropAndEditSheet ─────────────────────────────────────────────────────────

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
    <Sheet open={open} onClose={onClose} title="Posicionar imagem" subtitle="Arraste e ajuste o enquadramento" closeButton heightVh={92}>
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
              className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm mx-auto"
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

        {/* Remover fundo */}
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

        {/* Usar imagem — fecha INSTANTANEAMENTE */}
        <button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-[#0F172A] text-white text-[14px] font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none"
        >
          Usar imagem
        </button>
      </div>
    </Sheet>
  );
}

// ─── ImageActionSheet ─────────────────────────────────────────────────────────

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
  const { bgState, bgRemoved } = editState;
  const bgDone = bgState === 'done';
  const bgError = bgState === 'error';

  return (
    <Sheet open={open} onClose={onClose} title="Editar imagem" closeButton>
      <div className="flex flex-col gap-3 pb-6">
        <div className="mx-auto w-full max-w-[200px]">
          <ImagePreviewWithBg
            src={editState.original}
            bgRemovedSrc={bgRemoved}
            bgState={bgState}
          />
        </div>

        <div className="h-px bg-slate-100 my-1" />

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
  lojaId?: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartIndex = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const orderRef = useRef(photos);
  orderRef.current = photos;

  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [actionIndex, setActionIndex] = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const swapInputRef = useRef<HTMLInputElement>(null);

  // ── Upload ──────────────────────────────────────────────────────────────────

  function handleFiles(files: FileList | null, replaceIndex?: number) {
    if (!files || files.length === 0) return;
    const limit = replaceIndex !== undefined ? 1 : MAX_FOTOS - photos.length;
    const localUrls = Array.from(files)
      .slice(0, limit)
      .map((file) => URL.createObjectURL(file));

    if (replaceIndex !== undefined && localUrls[0]) {
      const next = [...photos];
      next[replaceIndex] = localUrls[0];
      onChange(next);
      setCropIndex(replaceIndex);
    } else if (localUrls.length >= 1) {
      const newPhotos = [...photos, ...localUrls];
      onChange(newPhotos);
      setCropIndex(newPhotos.length - 1);
    }
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

  // ── BG removal ────────────────────────────────────────────────────────────────

  async function handleBgRemove(url: string) {
    patchEditState(url, { bgState: 'processing' });
    try {
      const resultUrl = url;
      await new Promise<void>((res) => setTimeout(res, 2500));
      patchEditState(url, { bgState: 'laser', bgRemoved: resultUrl });
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

  // ── Crop confirm — fecha instantaneamente, gera novo blob cropado ───────────
  // O upload para o Supabase só acontece ao guardar o produto (ProductForm).

  function handleCropConfirm(
    index: number,
    getCrop: () => { cropBox: CropBox; naturalSize: { w: number; h: number }; renderedSize: { w: number; h: number } },
  ) {
    const url = photos[index];
    const state = getEditState(url);

    // Fecha o sheet imediatamente
    setCropIndex(null);

    // Aplica o crop localmente (gera novo blob) em background
    (async () => {
      try {
        const { cropBox, naturalSize, renderedSize } = getCrop();
        const croppedDataUrl = await cropToSquare(state.current, cropBox, naturalSize, renderedSize);
        // Converte para blob URL para manter a pré-visualização
        const res = await fetch(croppedDataUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const next = [...orderRef.current];
        next[index] = blobUrl;
        onChange(next);
        setEditStates((prev) => {
          const existing = prev[url] ?? { original: url, current: url, bgRemoved: null, bgState: 'idle' as BgState };
          const updated = { ...prev };
          delete updated[url];
          updated[blobUrl] = { ...existing, original: blobUrl, current: blobUrl };
          return updated;
        });
      } catch {
        // silent — mantém a foto original se o crop falhar
      }
    })();
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
    <div data-loja-id={lojaId}>
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
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 active:bg-slate-50"
          >
            <Plus size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Adicionar</span>
          </button>
        )}
      </div>

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

      {cropPhoto && cropEditState && (
        <CropAndEditSheet
          open={cropIndex !== null}
          src={cropEditState.current}
          editState={cropEditState}
          onClose={() => setCropIndex(null)}
          onConfirm={(getCrop) => cropIndex !== null && handleCropConfirm(cropIndex, getCrop)}
          onBgRemove={() => cropPhoto && handleBgRemove(cropEditState.original)}
          onBgUndo={() => cropPhoto && handleBgUndo(cropEditState.original)}
        />
      )}

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
