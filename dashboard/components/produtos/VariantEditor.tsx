'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  }

  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block pl-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 pl-3 pr-2 h-8 rounded-full bg-slate-100 text-[11px] font-bold text-ink"
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-slate-400 hover:text-slate-700">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-transparent rounded-2xl px-4 py-3 text-[13px] font-semibold text-ink outline-none focus:bg-white focus:border-ink focus:ring-4 focus:ring-ink/5 transition-all"
      />
    </div>
  );
}

export function VariantEditor({
  tamanhos,
  cores,
  onTamanhosChange,
  onCoresChange,
}: {
  tamanhos: string[];
  cores: string[];
  onTamanhosChange: (v: string[]) => void;
  onCoresChange: (v: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <TagInput label="Tamanhos" values={tamanhos} onChange={onTamanhosChange} placeholder="Ex: M, Enter" />
      <TagInput label="Cores" values={cores} onChange={onCoresChange} placeholder="Ex: Azul, Enter" />
    </div>
  );
}
