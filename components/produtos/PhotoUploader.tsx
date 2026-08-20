'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Star,
  Trash2,
  RefreshCw,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/Toast';

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

function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

/**
 * Converte a fonte local do editor (data: URL do recorte, ou blob: URL
 * gerado pela remoção de fundo) num File real para envio ao Supabase
 * Storage. fetch() lida com ambos os esquemas sem precisar de dois
 * caminhos de código diferentes.
 */
async function srcToFile(src: string, filename: string): Promise<File> {
  if (src.startsWith('data:')) {
    return dataURLtoFile(src, filename);
  }
  const res = await fetch(src);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
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
          if (!b) return reject(new Error('Falha ao processar'));
          resolve(URL.createObjectURL(b));
        }, 'image/png');
        return;
      }

      const data = imageData.data;
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const TOLERANCE = 40;
      const FEATHER = 22;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt(
          (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2,
        );
        if (dist < TOLERANCE) {
          data[i + 3] = 0;
        } else if (dist < TOLERANCE + FEATHER) {
          data[i + 3] = Math.round(((dist - TOLERANCE) / FEATHER) * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Falha ao converter'));
        if (objectUrl !== imageUrl) URL.revokeObjectURL(objectUrl);
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// ─── Estrela Sparkle (SVG idêntico ao HTML) ──────────────────────────────────

function GoldSparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      className={cn('gold-sparkle animate-twinkle absolute pointer-events-none', className)}
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

// ─── Modal de Recorte 1:1 por Arrasto ────────────────────────────────────────

function CropperModal({
  open,
  src,
  onClose,
  onConfirm,
}: {
  open: boolean;
  src: string;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const dragStart = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const PREVIEW = 280;

  useEffect(() => {
    if (open) {
      setOffset({ x: 0, y: 0 });
    }
  }, [open, src]);

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

  function handleSave() {
    if (!imgSize) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d')!;

      const scale = PREVIEW / Math.min(imgSize.w, imgSize.h);
      const outputScale = 1000 / PREVIEW;

      const drawW = imgSize.w * scale * outputScale;
      const drawH = imgSize.h * scale * outputScale;
      const drawX = (1000 - drawW) / 2 + offset.x * outputScale;
      const drawY = (1000 - drawH) / 2 + offset.y * outputScale;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      onConfirm(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = src;
  }

  return (
    <Sheet open={open} onClose={onClose} title="Ajustar Imagem" closeButton heightVh={80}>
      <div className="flex flex-col h-full justify-between pb-6">
        <p className="text-[11px] font-medium text-slate-500 mb-3 text-center">
          Deslize com o dedo para ajustar a posição do enquadramento.
        </p>

        {/* ÁREA DE RECORTE */}
        <div className="flex-1 bg-[#020617] relative flex items-center justify-center overflow-hidden rounded-2xl min-h-[300px]">
          <div
            className="relative overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing touch-none select-none shadow-2xl rounded-2xl"
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
              className="absolute pointer-events-none max-w-none transition-transform duration-75"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${
                  imgSize ? PREVIEW / Math.min(imgSize.w, imgSize.h) : 1
                })`,
              }}
              onLoad={(e) => {
                const t = e.currentTarget;
                setImgSize({ w: t.naturalWidth, h: t.naturalHeight });
              }}
            />
          </div>
        </div>

        {/* BOTÃO CONFIRMAR */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-4 bg-[#0F172A] text-white rounded-[20px] font-black tracking-widest text-[14px] uppercase active:scale-[0.98] transition-transform shadow-xl flex justify-center items-center gap-2"
          >
            Confirmar Ajuste
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Modal Editor IA (Animação de Remoção de Fundo) ──────────────────────────

function AiEditorSheet({
  open,
  src,
  editState,
  uploading,
  onClose,
  onChangePhoto,
  onStartAiProcess,
  onConfirmFinal,
}: {
  open: boolean;
  src: string;
  editState: EditState;
  uploading: boolean;
  onClose: () => void;
  onChangePhoto: () => void;
  onStartAiProcess: () => void;
  onConfirmFinal: () => void;
}) {
  const [statusText, setStatusText] = useState('A analisar imagem...');

  const { bgState, bgRemoved } = editState;
  const processing = bgState === 'processing';
  const laserPhase = bgState === 'laser';
  const bgDone = bgState === 'done';
  const busy = processing || laserPhase;

  useEffect(() => {
    if (!processing) return;
    const frasesIA = [
      'A analisar imagem...',
      'A identificar produto...',
      'A polir detalhes...',
      'A finalizar magia...',
    ];
    let step = 0;
    setStatusText(frasesIA[0]);
    const interval = setInterval(() => {
      step++;
      if (step < frasesIA.length) setStatusText(frasesIA[step]);
    }, 700);

    return () => clearInterval(interval);
  }, [processing]);

  return (
    <Sheet open={open} onClose={onClose} title="Editar Imagem" closeButton heightVh={100}>
      <div className="flex flex-col h-full justify-between pb-6 overflow-y-auto">
        <div className="flex flex-col items-center space-y-6 pt-2">
          {/* CARD DO PRODUTO (Estilo Catalog Card) */}
          <div
            className={cn(
              'w-full max-w-[260px] bg-white rounded-[40px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-100 relative transition-all duration-500',
              bgDone && 'max-w-[300px]',
            )}
          >
            <div className="w-full pb-[100%] relative rounded-[32px] overflow-hidden bg-[#F8FAFC] border border-gray-50 shadow-inner">
              {/* Imagem sem fundo (Atrás para revelação) */}
              {bgRemoved && (
                <img
                  src={bgRemoved}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}

              {/* Imagem Original (Com Efeito Wipe) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className={cn(
                  'absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700',
                  laserPhase && 'animate-wipe-rl',
                  bgDone && 'opacity-0',
                )}
              />

              {/* OVERLAY ESCURO + ESTRELAS DOURADAS */}
              {busy && (
                <div
                  className={cn(
                    'absolute inset-0 z-20 pointer-events-none overflow-hidden transition-opacity duration-500',
                    processing ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ backgroundColor: 'rgba(18, 14, 10, 0.65)' }}
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

              {/* RAIO LASER */}
              {laserPhase && (
                <div className="animate-laser-rl absolute top-0 bottom-0 w-[3px] bg-white z-30 shadow-[0_0_25px_8px_rgba(255,255,255,1)]" />
              )}
            </div>
          </div>

          {/* BOTÃO TROCAR IMAGEM */}
          {!busy && (
            <button
              type="button"
              onClick={onChangePhoto}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0F172A] rounded-full active:scale-95 transition-colors border border-gray-200 shadow-sm"
            >
              <RefreshCw size={14} className="opacity-70" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                Trocar Imagem
              </span>
            </button>
          )}

          {/* TEXTO STATUS IA */}
          {busy && <span className="status-premium text-[11px] font-black">{statusText}</span>}

          {/* CARD INFORMATIVO ANTES/DEPOIS */}
          {!busy && !bgDone && (
            <div className="w-full bg-white border border-gray-200 rounded-[28px] p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[14px] font-black text-[#0F172A]">Remova o fundo da sua imagem</p>
                  <span className="px-2 py-0.5 bg-[#0F172A] text-white text-[7px] font-black rounded uppercase tracking-[1.5px]">
                    PREMIUM
                  </span>
                </div>
                <p className="text-[11px] font-medium text-gray-500">
                  Deixe seu produto com um visual limpo e profissional.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Antes</span>
                  <div className="w-[90px] h-[90px] rounded-[16px] overflow-hidden bg-gray-50 border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://www.dropbox.com/scl/fi/dtskmv5jmawzsfjr75s75/1000497357.png?rlkey=jh21nqldc9d8gnxdurzcf9lj1&st=34jpdf0o&raw=1"
                      alt="Antes"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                </div>
                <span className="text-gray-300 text-lg mt-4">→</span>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Depois</span>
                  <div className="w-[90px] h-[90px] bg-white rounded-[16px] border border-gray-100 shadow-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://www.dropbox.com/scl/fi/aebnv8x19c7y458fw3px1/1000497721.png?rlkey=zubn2r7lgh6sqodgynryen0rc&st=1tdrzhqv&raw=1"
                      alt="Depois"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTÕES DE AÇÃO INFERIORES */}
        <div className="w-full space-y-2 pt-4">
          {!bgDone ? (
            <>
              <button
                type="button"
                disabled={busy || uploading}
                onClick={onStartAiProcess}
                className="w-full py-4 bg-[#0F172A] text-white rounded-[16px] font-bold text-[14px] flex justify-center items-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-50"
              >
                <Sparkles size={18} />
                Remover Fundo
              </button>
              <button
                type="button"
                disabled={busy || uploading}
                onClick={onConfirmFinal}
                className="w-full py-3 bg-transparent text-slate-600 font-bold text-[13px] active:scale-95 transition-all text-center block disabled:opacity-50"
              >
                {uploading ? 'Enviando...' : 'Continuar com a Imagem Original'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={onConfirmFinal}
              className="w-full py-4 bg-[#0F172A] text-white rounded-[16px] font-bold text-[14px] shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Adicionar ao Produto'}
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

// ─── Sheet de Opções para Imagem da Grelha ───────────────────────────────────

function ImageOptionsSheet({
  open,
  onClose,
  onMakeCover,
  onChangePhoto,
  onRemovePhoto,
}: {
  open: boolean;
  onClose: () => void;
  onMakeCover: () => void;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Opções da Imagem" closeButton>
      <div className="space-y-3 pb-6 pt-2">
        <button
          type="button"
          onClick={onMakeCover}
          className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-[#0F172A] font-bold text-[13px] rounded-2xl active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          Tornar Foto de Capa
        </button>
        <button
          type="button"
          onClick={onChangePhoto}
          className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-[#0F172A] font-bold text-[13px] rounded-2xl active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          Trocar Imagem
        </button>
        <button
          type="button"
          onClick={onRemovePhoto}
          className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-red-500 font-bold text-[13px] rounded-2xl active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          Remover Imagem
        </button>
      </div>
    </Sheet>
  );
}

// ─── PhotoUploader Principal ──────────────────────────────────────────────────

export function PhotoUploader({
  photos,
  onChange,
  lojaId,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  lojaId: string;
}) {
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentFileSrc, setCurrentFileSrc] = useState<string | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [aiEditorOpen, setAiEditorOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Gestão de fila de imagens
  const processNextInQueue = (queue: File[]) => {
    if (queue.length === 0) {
      setCurrentFileSrc(null);
      setCropOpen(false);
      return;
    }
    const file = queue[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentFileSrc(e.target?.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setFileQueue(files);
    processNextInQueue(files);
    e.target.value = '';
  };

  // 1. Confirmar Recorte -> Abrir Editor IA
  const handleCropConfirm = (croppedSrc: string) => {
    setCurrentFileSrc(croppedSrc);
    setCropOpen(false);
    setAiEditorOpen(true);

    setEditStates((prev) => ({
      ...prev,
      [croppedSrc]: {
        original: croppedSrc,
        current: croppedSrc,
        bgRemoved: null,
        bgState: 'idle',
      },
    }));
  };

  // 2. Executar Animação e Remoção do Fundo
  const handleStartAiProcess = async () => {
    if (!currentFileSrc) return;
    const src = currentFileSrc;

    setEditStates((prev) => ({
      ...prev,
      [src]: { ...prev[src], bgState: 'processing' },
    }));

    try {
      const resultUrl = await removeBgApi(src);

      // Sequência de tempos do HTML: 2.5s análise + 2.0s varredura laser
      await new Promise((res) => setTimeout(res, 2500));
      setEditStates((prev) => ({
        ...prev,
        [src]: { ...prev[src], bgState: 'laser', bgRemoved: resultUrl },
      }));

      await new Promise((res) => setTimeout(res, 2000));
      setEditStates((prev) => ({
        ...prev,
        [src]: { ...prev[src], bgState: 'done', current: resultUrl },
      }));
    } catch {
      setEditStates((prev) => ({
        ...prev,
        [src]: { ...prev[src], bgState: 'error' },
      }));
    }
  };

  // 3. Confirmar Final -> Upload real para o Supabase Storage -> Adicionar à grelha
  const handleConfirmFinal = async () => {
    if (!currentFileSrc) return;

    const state = editStates[currentFileSrc];
    const finalSrc = state?.bgState === 'done' && state.bgRemoved ? state.bgRemoved : currentFileSrc;

    setUploading(true);
    try {
      const file = await srcToFile(finalSrc, `produto-${Date.now()}.png`);
      const { url, error } = await uploadImage(BUCKETS.produtos, file, lojaId);

      if (error || !url) {
        throw new Error(error || 'Falha ao enviar imagem');
      }

      if (isReplacing && selectedIndex !== null) {
        const next = [...photos];
        next[selectedIndex] = url;
        onChange(next);
        setIsReplacing(false);
        setSelectedIndex(null);
        setAiEditorOpen(false);
      } else {
        onChange([...photos, url]);
        setAiEditorOpen(false);

        const nextQueue = fileQueue.slice(1);
        setFileQueue(nextQueue);
        setTimeout(() => processNextInQueue(nextQueue), 300);
      }
    } catch {
      toast.show('Não foi possível enviar a imagem. Tente novamente.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const currentEditState = currentFileSrc
    ? editStates[currentFileSrc] || {
        original: currentFileSrc,
        current: currentFileSrc,
        bgRemoved: null,
        bgState: 'idle',
      }
    : {
        original: '',
        current: '',
        bgRemoved: null,
        bgState: 'idle' as BgState,
      };

  return (
    <div>
      {/* CABEÇALHO */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-black text-[#0F172A]">Fotografias</h3>
          <p className="text-[11px] font-medium text-slate-400">A primeira Imagem será a capa.</p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400">
          {photos.length}/{MAX_FOTOS}
        </span>
      </div>

      {/* GRELHA DE FOTOS */}
      <div className="grid grid-cols-4 gap-2 relative">
        {photos.map((url, index) => (
          <div
            key={url + index}
            onClick={() => {
              setSelectedIndex(index);
              setOptionsOpen(true);
            }}
            className={cn(
              'aspect-square rounded-xl border-[3px] border-slate-100 ring-2 ring-white ring-inset shadow-md shrink-0 relative bg-white flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-300 overflow-hidden',
              index === 0 && 'border-[#0F172A]',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover rounded-[10px] p-[2px]" />
            {index === 0 && (
              <span className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase z-10 shadow-sm">
                Capa
              </span>
            )}
          </div>
        ))}

        {photos.length < MAX_FOTOS && (
          <button
            type="button"
            onClick={() => {
              setIsReplacing(false);
              inputRef.current?.click();
            }}
            className="aspect-square rounded-xl border-2 border-dashed border-[#CBD5E0] bg-slate-50 flex flex-col items-center justify-center text-[#4A5568] active:bg-slate-100 transition-all"
          >
            <Plus size={20} className="mb-0.5" />
            <span className="text-[10px] font-bold tracking-wider">Adicionar</span>
          </button>
        )}
      </div>

      {photos.length > 0 && (
        <p className="text-[10px] text-center text-slate-400 font-semibold mt-3">
          Toque para editar
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* MODAL CROPPER */}
      {currentFileSrc && (
        <CropperModal
          open={cropOpen}
          src={currentFileSrc}
          onClose={() => setCropOpen(false)}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* MODAL EDITOR IA */}
      {currentFileSrc && (
        <AiEditorSheet
          open={aiEditorOpen}
          src={currentFileSrc}
          editState={currentEditState}
          uploading={uploading}
          onClose={() => setAiEditorOpen(false)}
          onChangePhoto={() => {
            setAiEditorOpen(false);
            inputRef.current?.click();
          }}
          onStartAiProcess={handleStartAiProcess}
          onConfirmFinal={handleConfirmFinal}
        />
      )}

      {/* MODAL OPÇÕES */}
      <ImageOptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onMakeCover={() => {
          if (selectedIndex === null) return;
          const next = [...photos];
          const [moved] = next.splice(selectedIndex, 1);
          next.unshift(moved);
          onChange(next);
          setOptionsOpen(false);
        }}
        onChangePhoto={() => {
          setIsReplacing(true);
          setOptionsOpen(false);
          inputRef.current?.click();
        }}
        onRemovePhoto={() => {
          if (selectedIndex === null) return;
          onChange(photos.filter((_, i) => i !== selectedIndex));
          setOptionsOpen(false);
        }}
      />
    </div>
  );
}