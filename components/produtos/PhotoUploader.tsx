'use client';

import { useRef, useState, useEffect } from 'react';
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
  Sparkles,
  Crop,
  ChevronRight,
} from 'lucide-react';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

const MAX_FOTOS = 5;

// ─── Tipos ────────────────────────────────────────────────────────────────────

type BgState = 'idle' | 'processing' | 'laser' | 'done' | 'error';

interface EditState {
  original: string;
  current: string;
  bgRemoved: string | null;
  bgState: BgState;
  bgColor: string;
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
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

async function removeBgApi(imageUrl: string): Promise<string> {
  let objectUrl = imageUrl;
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    objectUrl = URL.createObjectURL(blob);
  } catch {
    objectUrl = imageUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, W, H);
      } catch {
        canvas.toBlob((b) => {
          if (!b) return reject(new Error('Falhou conversão'));
          resolve(URL.createObjectURL(b));
        }, 'image/png');
        return;
      }

      const data = imageData.data;
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const TOLERANCE = 42;
      const FEATHER = 20;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (dist < TOLERANCE) {
          data[i + 3] = 0;
        } else if (dist < TOLERANCE + FEATHER) {
          data[i + 3] = Math.round(((dist - TOLERANCE) / FEATHER) * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Falhou conversão'));
        if (objectUrl !== imageUrl) URL.revokeObjectURL(objectUrl);
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// ─── Componente Estrela Dourada SVG ──────────────────────────────────────────

function GoldSparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      className={cn('gold-sparkle animate-twinkle absolute pointer-events-none', className)}
      style={{ animationDelay: delay }}
      viewBox="0 0 24 24"
    >
      <defs>
        <linearGradient id="gold-grad-next" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FDB931" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <path
        d="M12,21.5C12,21.5 12,12 2.5,12C12,12 12,2.5 12,2.5C12,2.5 12,12 21.5,12C12,12 12,21.5 12,21.5Z"
        fill="url(#gold-grad-next)"
      />
    </svg>
  );
}

// ─── ImagePreviewWithBg ───────────────────────────────────────────────────────

function ImagePreviewWithBg({
  src,
  bgRemovedSrc,
  bgState,
  bgColor = '#F5F5F7',
}: {
  src: string;
  bgRemovedSrc: string | null;
  bgState: BgState;
  bgColor?: string;
}) {
  const processing = bgState === 'processing';
  const laser = bgState === 'laser';
  const done = bgState === 'done';

  return (
    <div
      id="catalog-card"
      className="w-full max-w-[260px] bg-white rounded-[40px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-100 relative mx-auto transition-all duration-500"
    >
      <div
        className="w-full relative rounded-[32px] overflow-hidden border border-gray-50 shadow-inner"
        style={{ paddingBottom: '100%', backgroundColor: done ? bgColor : '#F8FAFC' }}
      >
        {/* Camada: imagem com fundo removido (atrás, revelada pelo laser) */}
        {bgRemovedSrc && (
          <div
            className={cn(
              'absolute inset-0 w-full h-full flex z-0 transition-opacity duration-300',
              done || laser ? 'opacity-100' : 'opacity-0'
            )}
            style={{ backgroundColor: bgColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgRemovedSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
            />
          </div>
        )}

        {/* Camada: imagem original — faz wipe da direita para a esquerda durante o laser */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover z-10 pointer-events-none transition-transform duration-700',
            laser && 'animate-wipe-rl'
          )}
        />

        {/* Overlay escuro + estrelas douradas (Exato do HTML/reference) */}
        {(processing || laser) && (
          <div
            className={cn(
              'absolute inset-0 z-20 pointer-events-none overflow-hidden transition-opacity duration-500',
              processing ? 'opacity-100' : 'opacity-0'
            )}
            style={{ backgroundColor: 'rgba(18, 14, 10, 0.65)', backdropFilter: 'blur(2px)' }}
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

        {/* Laser — percorre da direita para a esquerda */}
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
    </div>
  );
}

// ─── Modal de Escolha de Cor do Fundo ─────────────────────────────────────────

function ColorPickerSheet({
  open,
  onClose,
  selectedColor,
  onSelectColor,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onConfirm: () => void;
}) {
  const options = [
    { label: 'Branco', color: 'transparent', bgClass: 'bg-white border-gray-200' },
    { label: 'Cinza', color: '#F5F5F7', bgClass: 'bg-[#F5F5F7] border-gray-200' },
    { label: 'Preto', color: '#121212', bgClass: 'bg-[#121212] border-gray-800' },
    { label: 'Creme', color: '#FDF5E6', bgClass: 'bg-[#FDF5E6] border-orange-100' },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="" closeButton={false}>
      <div className="px-2 pb-6 pt-2">
        <h3 className="text-[22px] font-black text-slate-900 tracking-tight mb-1">
          Cor de Fundo
        </h3>
        <p className="text-slate-500 text-[13px] mb-8 font-medium">
          Escolha a cor para destacar o produto.
        </p>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {options.map((opt) => {
            const isActive = selectedColor === opt.color;
            return (
              <div
                key={opt.color}
                onClick={() => onSelectColor(opt.color)}
                className={cn('color-card flex flex-col items-center cursor-pointer', isActive && 'active')}
              >
                <div className={cn('w-full aspect-square rounded-2xl border-2 shadow-sm relative', opt.bgClass)}>
                  {isActive && (
                    <div className="check-badge font-bold absolute -top-1 -right-1 w-5 h-5 bg-[#0F172A] text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow-sm">
                      ✓
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-2 uppercase tracking-widest font-bold',
                    isActive ? 'text-gray-900 font-black' : 'text-gray-400'
                  )}
                >
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-4 bg-[#0F172A] text-white rounded-[20px] font-black text-[14px] shadow-xl uppercase tracking-[2px] active:scale-95 transition-all"
        >
          TRANSFORMAR IMAGEM
        </button>
      </div>
    </Sheet>
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
  onChangePhoto,
}: {
  open: boolean;
  src: string;
  editState: EditState;
  onConfirm: (offsetX: number, offsetY: number) => void;
  onClose: () => void;
  onBgRemove: (color: string) => void;
  onBgUndo: () => void;
  onChangePhoto: () => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(editState.bgColor || '#F5F5F7');
  const PREVIEW = 260;

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [src]);

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
  const busy = processing || laserPhase;

  const [aiTextStatus, setAiTextStatus] = useState('A ANALISAR IMAGEM...');

  useEffect(() => {
    if (processing) {
      const frases = [
        'A ANALISAR IMAGEM...',
        'A IDENTIFICAR PRODUTO...',
        'A POLIR DETALHES...',
        'A FINALIZAR MAGIA...',
      ];
      let step = 0;
      setAiTextStatus(frases[0]);
      const interval = setInterval(() => {
        step++;
        if (step < frases.length) setAiTextStatus(frases[step]);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [processing]);

  return (
    <Sheet open={open} onClose={onClose} title="Editar Imagem" closeButton heightVh={92}>
      <div className="flex flex-col gap-5 pb-6">
        <div className="flex flex-col items-center gap-4">
          {!bgDone && !busy ? (
            <div
              className="relative overflow-hidden rounded-[32px] bg-[#F8FAFC] cursor-grab active:cursor-grabbing touch-none select-none border border-gray-100 shadow-lg mx-auto"
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
                className="absolute pointer-events-none max-w-none"
                style={{ ...imgStyle() }}
                onLoad={(e) => {
                  const t = e.currentTarget;
                  setImgSize({ w: t.naturalWidth, h: t.naturalHeight });
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                  backgroundSize: '86px 86px',
                }}
              />
            </div>
          ) : (
            <ImagePreviewWithBg
              src={src}
              bgRemovedSrc={bgRemoved}
              bgState={bgState}
              bgColor={selectedColor}
            />
          )}

          <button
            type="button"
            onClick={onChangePhoto}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0F172A] rounded-full active:scale-95 transition-all border border-gray-200 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 opacity-70" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              Trocar Imagem
            </span>
          </button>
        </div>

        <div className="flex justify-center h-4 items-center">
          {busy && (
            <span className="status-premium text-[10px] font-black tracking-[2px] uppercase animate-pulse">
              {aiTextStatus}
            </span>
          )}
        </div>

        {!bgDone && !busy && (
          <div className="w-full bg-white border border-gray-200 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-4 px-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[14px] font-black text-[#0F172A] tracking-tight">
                  Remova o fundo da sua imagem
                </p>
                <span className="px-2 py-0.5 bg-[#0F172A] text-white text-[7px] font-black rounded-[4px] uppercase tracking-[1.5px]">
                  PREMIUM
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-500 leading-snug">
                Deixe o seu produto com um visual limpo e profissional.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div class="flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Antes
                </span>
                <div className="relative w-[90px] h-[90px] rounded-[18px] overflow-hidden bg-gray-50 border border-gray-100">
                  <img
                    src="https://www.dropbox.com/scl/fi/dtskmv5jmawzsfjr75s75/1000497357.png?rlkey=jh21nqldc9d8gnxdurzcf9lj1&st=34jpdf0o&raw=1"
                    className="w-full h-full object-cover opacity-80"
                    alt=""
                  />
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-4" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                  Depois
                </span>
                <div className="relative w-[90px] h-[90px] bg-white rounded-[18px] border border-gray-100 shadow-md overflow-hidden">
                  <img
                    src="https://www.dropbox.com/scl/fi/aebnv8x19c7y458fw3px1/1000497721.png?rlkey=zubn2r7lgh6sqodgynryen0rc&st=1tdrzhqv&raw=1"
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full space-y-2 mt-auto pt-2">
          {!bgDone && !busy && (
            <button
              type="button"
              onClick={() => setColorSheetOpen(true)}
              className="w-full py-4 bg-[#0F172A] text-white rounded-[16px] font-bold text-[14px] flex justify-center items-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              Melhorar Imagem
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(offset.x, offset.y)}
            className={cn(
              'w-full py-3.5 rounded-[16px] font-bold text-[13px] active:scale-95 transition-all',
              bgDone
                ? 'bg-[#0F172A] text-white shadow-lg text-[14px]'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            {bgDone ? 'Adicionar ao Produto' : 'Continuar com a Imagem Original'}
          </button>
        </div>
      </div>

      <ColorPickerSheet
        open={colorSheetOpen}
        onClose={() => setColorSheetOpen(false)}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        onConfirm={() => {
          setColorSheetOpen(false);
          onBgRemove(selectedColor);
        }}
      />
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
  onChangePhoto,
}: {
  open: boolean;
  onClose: () => void;
  isCover: boolean;
  editState: EditState | null;
  onEdit: () => void;
  onMakeCover: () => void;
  onRemove: () => void;
  onChangePhoto: () => void;
}) {
  if (!editState) return null;

  return (
    <Sheet open={open} onClose={onClose} title="" closeButton={false}>
      <div className="flex flex-col gap-3 pb-6 pt-2">
        <button
          type="button"
          onClick={onMakeCover}
          className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-[#0F172A] font-bold rounded-2xl active:scale-95 transition-all flex justify-center items-center gap-2 text-[13px]"
        >
          Tornar Foto de Capa
        </button>

        <button
          type="button"
          onClick={onChangePhoto}
          className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-[#0F172A] font-bold rounded-2xl active:scale-95 transition-all flex justify-center items-center gap-2 text-[13px]"
        >
          Trocar Imagem
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="w-full py-4 bg-gray-50 hover:bg-red-50 text-red-500 font-bold rounded-2xl active:scale-95 transition-all flex justify-center items-center gap-2 text-[13px]"
        >
          Remover Imagem
        </button>
      </div>
    </Sheet>
  );
}

// ─── PhotoUploader (Principal) ────────────────────────────────────────────────

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
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartIndex = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [actionIndex, setActionIndex] = useState<number | null>(null);
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

    const next = [...photos];
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
    return (
      editStates[url] ?? {
        original: url,
        current: url,
        bgRemoved: null,
        bgState: 'idle',
        bgColor: '#F5F5F7',
      }
    );
  }

  function patchEditState(url: string, patch: Partial<EditState>) {
    setEditStates((prev) => ({
      ...prev,
      [url]: {
        ...(prev[url] ?? {
          original: url,
          current: url,
          bgRemoved: null,
          bgState: 'idle' as BgState,
          bgColor: '#F5F5F7',
        }),
        ...patch,
      },
    }));
  }

  // ── Remoção de fundo ─────────────────────────────────────────────────────────

  async function handleBgRemove(url: string, color: string) {
    patchEditState(url, { bgState: 'processing', bgColor: color });

    try {
      const resultUrl = await removeBgApi(url);

      // PASSO 1: 2.5s overlay escuro com estrelas douradas
      await new Promise<void>((res) => setTimeout(res, 2500));
      patchEditState(url, { bgState: 'laser', bgRemoved: resultUrl });

      // PASSO 2: 2.0s do laser passando da direita para a esquerda
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

  // ── Recorte ──────────────────────────────────────────────────────────────────

  async function handleCropConfirm(index: number, offsetX: number, offsetY: number) {
    const url = photos[index];
    const state = getEditState(url);
    try {
      const croppedDataUrl = await cropToSquare(state.current, offsetX, offsetY);
      const file = dataURLtoFile(croppedDataUrl, `crop-${Date.now()}.jpg`);
      const { url: newUrl } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (newUrl) {
        const next = [...photos];
        next[index] = newUrl;
        onChange(next);
        setEditStates((prev) => {
          const existing = prev[url] ?? {
            original: url,
            current: url,
            bgRemoved: null,
            bgState: 'idle' as BgState,
            bgColor: '#F5F5F7',
          };
          const updated = { ...prev };
          delete updated[url];
          updated[newUrl] = { ...existing, original: newUrl, current: newUrl };
          return updated;
        });
      }
    } catch {
      // erro silencioso
    }
    setCropIndex(null);
  }

  // ── Ações ───────────────────────────────────────────────────────────────────

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
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-black text-[#0F172A]">Fotografias</h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            A primeira Imagem será a capa.
          </p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-400">
          <span className="text-[#0F172A]">{photos.length}</span>/{MAX_FOTOS}
        </span>
      </div>

      {/* Grelha */}
      <div className="grid grid-cols-4 gap-2">
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
                'photo-slot relative aspect-square rounded-xl border-[3px] border-slate-100 ring-2 ring-white ring-inset shadow-md shrink-0 bg-white flex items-center justify-center cursor-move active:scale-95 transition-all duration-300 overflow-hidden',
                i === 0 && 'is-cover border-[#0F172A] border-2',
                dragging && 'fantasma'
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                className="pointer-events-none object-cover rounded-[10px] p-[2px]"
                sizes="120px"
                unoptimized={url.startsWith('blob:')}
              />
              {i === 0 && (
                <div className="badge-capa absolute bottom-1 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase z-30 shadow-sm">
                  Capa
                </div>
              )}
            </div>
          );
        })}

        {photos.length < MAX_FOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[#CBD5E0] bg-slate-50 flex flex-col items-center justify-center text-[#4A5568] active:bg-slate-100 transition-all"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} className="mb-0.5" />
            )}
            <span className="text-[10px] font-bold tracking-wider">Adicionar</span>
          </button>
        )}
      </div>

      {/* Thumbnail flutuante durante o arrasto */}
      {dragIndex !== null && floatPos && photos[dragIndex] && (
        <div
          className="voando pointer-events-none fixed z-[9999] h-20 w-20 overflow-hidden rounded-xl shadow-2xl ring-2 ring-ink/20"
          style={{
            left: floatPos.x - 40,
            top: floatPos.y - 40,
          }}
        >
          <Image
            src={photos[dragIndex]}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={photos[dragIndex]?.startsWith('blob:')}
          />
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-[10px] text-center text-slate-400 font-semibold mt-3">
          Toque para editar ou arraste para reordenar
        </p>
      )}

      {/* Inputs Ocultos */}
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

      {/* Modal de Posicionamento + Remoção de Fundo */}
      {cropPhoto && cropEditState && (
        <CropAndEditSheet
          open={cropIndex !== null}
          src={cropEditState.current}
          editState={cropEditState}
          onClose={() => setCropIndex(null)}
          onConfirm={(ox, oy) => cropIndex !== null && handleCropConfirm(cropIndex, ox, oy)}
          onBgRemove={(color) => cropPhoto && handleBgRemove(cropEditState.original, color)}
          onBgUndo={() => cropPhoto && handleBgUndo(cropEditState.original)}
          onChangePhoto={() => swapInputRef.current?.click()}
        />
      )}

      {/* Menu de Ações (Toque Simples) */}
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
        onChangePhoto={() => swapInputRef.current?.click()}
      />
    </div>
  );
}