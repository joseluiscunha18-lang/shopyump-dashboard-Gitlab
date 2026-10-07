'use client';

import { useLumePersonalizacao } from './lume-personalizacao-context';
import type { LumePageKey } from '@/theme-editor/themes/lume/page-text';

export function PageHeading({ eyebrow, title, description, pageKey }: { eyebrow: string; title: string; description: string; pageKey?: LumePageKey }) {
  const o = useLumePersonalizacao()?.pages[pageKey ?? 'collection'];
  if (pageKey && o) { eyebrow = o.eyebrow ?? eyebrow; title = o.title ?? title; description = o.description ?? description; }
  return <div className="border-b border-border bg-subtle"><div className="mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-12"><p className="text-[11px] font-semibold uppercase text-muted-foreground">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p></div></div>;
}
