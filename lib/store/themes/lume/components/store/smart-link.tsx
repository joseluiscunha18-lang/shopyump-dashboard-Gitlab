'use client';

import type { AnchorHTMLAttributes } from 'react';
import { Link } from '../../router';
import { THEME_PAGE_ROUTE } from '@/theme-editor/themes/lume/page-text';
import { categorySlug } from '../../lib/store-data';
import type { LumeLink } from '../../lib/personalizacao';
import { useLumeLoja } from './lume-loja-context';

/**
 * Link de um botão personalizado no editor (já validado no servidor).
 * Página/categoria navegam dentro da loja; endereço abre noutra aba; WhatsApp usa
 * o número da loja (sem número não há destino, por isso não desenha nada).
 */
export function SmartLink({ link, children, ...rest }: { link: LumeLink } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { contactos } = useLumeLoja();
  if (link.kind === 'url') return <a href={link.value} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
  if (link.kind === 'whatsapp') {
    const n = contactos.whatsapp?.replace(/\D/g, '');
    if (!n) return null;
    const text = link.message ? `?text=${encodeURIComponent(link.message)}` : '';
    return <a href={`https://wa.me/${n}${text}`} target="_blank" rel="noreferrer" {...rest}>{children}</a>;
  }
  if (link.kind === 'category') return <Link to="/produtos" search={{ categoria: categorySlug(link.value) }} {...rest}>{children}</Link>;
  const route = THEME_PAGE_ROUTE[link.value];
  if (!route || link.value === 'cart') return null;
  return <Link to={route as '/'} {...rest}>{children}</Link>;
}
