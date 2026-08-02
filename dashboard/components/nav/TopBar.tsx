'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function TopBar({ storeName, storeUrl }: { storeName: string; storeUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Bem-vindo de volta</p>
        <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight truncate max-w-[220px] sm:max-w-none">{storeName}</h1>
      </div>
      {storeUrl && (
        <button
          onClick={copyLink}
          className="flex-shrink-0 flex items-center gap-1.5 bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl px-4 h-10 text-[11px] font-bold text-ink active:scale-95 transition-all"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
      )}
    </header>
  );
}
