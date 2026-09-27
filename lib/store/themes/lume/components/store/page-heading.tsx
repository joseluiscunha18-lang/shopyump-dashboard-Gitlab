'use client';

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="border-b border-border bg-subtle"><div className="mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-12"><p className="text-[11px] font-semibold uppercase text-muted-foreground">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p></div></div>;
}
