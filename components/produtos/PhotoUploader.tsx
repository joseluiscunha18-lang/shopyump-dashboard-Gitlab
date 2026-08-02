'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, X, Loader2 } from 'lucide-react';
import { uploadImage, BUCKETS } from '@/lib/storage';

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
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const { url } = await uploadImage(BUCKETS.produtos, file, lojaId);
      if (url) uploaded.push(url);
    }
    onChange([...photos, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block pl-1">Fotos</label>
      <div className="grid grid-cols-4 gap-3">
        {photos.map((url, i) => (
          <div key={url + i} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
            <Image src={url} alt="" fill className="object-cover" sizes="120px" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
