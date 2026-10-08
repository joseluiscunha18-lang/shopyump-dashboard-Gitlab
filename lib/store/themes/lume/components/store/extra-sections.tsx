'use client';

import type { CSSProperties } from 'react';
import { ImageIcon } from 'lucide-react';
import { Link } from '../../router';
import { categorySlug, type Category } from '../../lib/store-data';
import type { LumeExtraButton, LumeExtraSection } from '../../lib/personalizacao';
import { useLumeLoja } from './lume-loja-context';
import { SmartLink } from './smart-link';
import { ProductArt } from './product-art';

/**
 * Seções que o lojista adicionou no editor (Categorias, Imagem e texto, Texto livre).
 * Tudo vem já resolvido e validado de lib/personalizacao.ts (cores em hex, textos
 * limitados) — aqui só se desenha. Os textos entram no React como texto (escapados).
 */

const SIZES = { sm: { h: 34, px: 16, fs: 13 }, md: { h: 40, px: 20, fs: 14 }, lg: { h: 48, px: 28, fs: 15 } } as const;

function buttonStyle(b: LumeExtraButton): CSSProperties {
  const s = SIZES[b.size];
  const base: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: s.h, padding: `0 ${s.px}px`, borderRadius: b.radius, fontSize: s.fs, fontWeight: 600, whiteSpace: 'nowrap', color: b.fg };
  if (b.variant === 'outline') return { ...base, background: 'transparent', border: `1px solid ${b.bg}` };
  if (b.variant === 'text') return { ...base, background: 'transparent', border: '1px solid transparent', height: 'auto', padding: '6px 0', textDecoration: 'underline' };
  return { ...base, background: b.bg, border: '1px solid var(--border)' };
}

function Title({ x }: { x: LumeExtraSection }) {
  if (!x.title.show || !x.title.text) return null;
  return (
    <>
      <style>{`.sx-t-${x.id}{font-size:${x.title.sizeM}px}@media (min-width:640px){.sx-t-${x.id}{font-size:${x.title.sizeD}px}}`}</style>
      <h2 className={`sx-t-${x.id} font-bold leading-tight`}>{x.title.text}</h2>
    </>
  );
}

function Body({ x }: { x: LumeExtraSection }) {
  if (!x.text?.show || !x.text.text) return null;
  return <p className="mt-3 whitespace-pre-line text-base opacity-80">{x.text.text}</p>;
}

function Action({ x }: { x: LumeExtraSection }) {
  const b = x.button;
  if (!b?.show || !b.link) return null;
  return (
    <div className="mt-5">
      <SmartLink link={b.link} style={buttonStyle(b)}>{b.label}</SmartLink>
    </div>
  );
}

function Frame({ x, children }: { x: LumeExtraSection; children: React.ReactNode }) {
  return (
    <section data-sy={`extra-${x.type}`} style={{ background: x.bg, color: x.fg }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</div>
    </section>
  );
}

function CategoriesBlock({ x }: { x: LumeExtraSection }) {
  const { produtos, categorias } = useLumeLoja();
  const items = categorias
    .map((name: Category) => {
      const list = produtos.filter((p) => p.category === name);
      const first = list.find((p) => p.images?.[0]) ?? list[0];
      return { name, count: list.length, cover: first?.images?.[0], kind: first?.kind };
    })
    .filter((c) => c.count > 0);
  if (items.length === 0) return null;
  const cols = x.columns ?? { d: 4, m: 2 };
  return (
    <Frame x={x}>
      <Title x={x} />
      <style>{`.sx-g-${x.id}{grid-template-columns:repeat(${cols.m},minmax(0,1fr))}@media (min-width:640px){.sx-g-${x.id}{grid-template-columns:repeat(${cols.d},minmax(0,1fr))}}`}</style>
      <div className={`sx-g-${x.id} mt-5 grid gap-3 sm:gap-5`}>
        {items.map((c) => (
          <Link key={c.name} to="/produtos" search={{ categoria: categorySlug(c.name) }} className="group block min-w-0 text-center">
            <div className="aspect-square overflow-hidden border border-border bg-product-gallery" style={{ borderRadius: x.shape === 'round' ? 999 : 16 }}>
              {c.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- fotos de qualquer bucket (produto.fotos)
                <img src={c.cover} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              ) : c.kind ? <ProductArt kind={c.kind} /> : null}
            </div>
            <p className="mt-2 truncate text-sm font-semibold">{c.name}</p>
            {x.showCount ? <p className="text-xs opacity-60">{c.count} {c.count === 1 ? 'produto' : 'produtos'}</p> : null}
          </Link>
        ))}
      </div>
    </Frame>
  );
}

function ImageTextBlock({ x }: { x: LumeExtraSection }) {
  const right = x.side === 'right';
  return (
    <Frame x={x}>
      <div className="grid items-center gap-5 sm:grid-cols-2 sm:gap-12">
        <div className={`overflow-hidden bg-product-gallery ${right ? 'sm:order-2' : ''}`} style={{ aspectRatio: x.image?.ratio ?? '4/5', borderRadius: 'var(--radius)' }}>
          {x.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem do bucket da loja
            <img src={x.image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center opacity-40"><ImageIcon size={32} /></div>
          )}
        </div>
        <div>
          <Title x={x} />
          <Body x={x} />
          <Action x={x} />
        </div>
      </div>
    </Frame>
  );
}

function RichTextBlock({ x }: { x: LumeExtraSection }) {
  const center = x.align !== 'left';
  return (
    <Frame x={x}>
      <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
        <Title x={x} />
        <Body x={x} />
        <div className={center ? 'flex justify-center' : ''}><Action x={x} /></div>
      </div>
    </Frame>
  );
}

export function ExtraSection({ x }: { x: LumeExtraSection }) {
  if (x.type === 'categories') return <CategoriesBlock x={x} />;
  if (x.type === 'imageText') return <ImageTextBlock x={x} />;
  return <RichTextBlock x={x} />;
}
