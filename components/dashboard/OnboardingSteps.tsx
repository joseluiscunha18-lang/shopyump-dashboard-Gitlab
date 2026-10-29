'use client';

import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/ShopyumpButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { dispensarMarco } from '@/lib/mutations/lojaMarcos';
import type { MarcoOnboarding } from '@/types/database';
import { cn } from '@/lib/cn';
import { asset } from '@/lib/domains';
import { DESIGN_CARDS_IMG } from '@/lib/designCardsImg';

interface ItemConfig {
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  image: string;
  contentWidth: string;
  imgRight: string;
  imgTop: string;
  imgBottom: string;
  imgWidth: string;
  imgMaxWidth: string;
  imgScale?: number;
  /** Alinhamento da imagem dentro da caixa (objectPosition / transformOrigin). Por omissão: 'right center'. */
  imgAlign?: string;
}

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-card text-foreground text-[13.5px] font-semibold tracking-tight border border-border shadow-xs transition-all hover:bg-muted hover:border-border active:scale-[0.97] self-start whitespace-nowrap';

const PAGAMENTOS_ICON = asset('/images/card-pagamentos-v2.png');

function getItemConfig(marco: MarcoOnboarding): ItemConfig {
  switch (marco) {
    case 'primeiro_produto':
      return {
        title: 'Adiciona os teus produtos',
        subtitle: 'Cria o teu catálogo e prepara os teus produtos para vender.',
        ctaLabel: 'Criar produto',
        href: '/produtos/novo',
        image: asset('/images/criar-produto.webp'),
        contentWidth: '54%',
        imgRight: '22px', imgTop: '0px', imgBottom: '0px',
        imgWidth: '58%', imgMaxWidth: '300px',
        imgScale: 1.12,
        imgAlign: 'center',
      };
    case 'personalizar_loja':
      return {
        title: 'Personaliza a tua loja',
        subtitle: 'Adapta o visual e as informações à identidade do teu negócio.',
        ctaLabel: 'Personalizar',
        href: '/personalizar',
        image: DESIGN_CARDS_IMG,
        contentWidth: '52%',
        imgRight: '16px', imgTop: '14px', imgBottom: '14px',
        imgWidth: '40%', imgMaxWidth: '200px',
        imgAlign: 'center',
      };
    case 'configurar_pagamentos':
      return {
        title: 'Configura pagamentos',
        subtitle: 'Define as formas de pagamento disponíveis para os teus clientes.',
        ctaLabel: 'Configurar',
        href: '/configuracoes/pagamentos',
        image: PAGAMENTOS_ICON,
        contentWidth: '52%',
        imgRight: '10px', imgTop: '14px', imgBottom: '12px',
        imgWidth: '43%', imgMaxWidth: '182px',
      };
    case 'partilhar_loja':
      return {
        title: 'Divulga a tua loja',
        subtitle: 'Partilha o link da tua loja para chegar a mais clientes.',
        ctaLabel: 'Divulgar loja',
        href: '/divulgar',
        image: asset('/images/card-divulgacao-v2.png'),
        contentWidth: '54%',
        imgRight: '10px', imgTop: '8px', imgBottom: '8px',
        imgWidth: '46%', imgMaxWidth: '208px',
        imgAlign: 'center',
      };
  }
}

/**
 * Card individual memoizado — não re-renderiza quando o pai atualiza
 * (ex: outro card dispensado, contextos de nav mudam). Isso elimina o
 * flash da imagem que ocorria porque o React re-montava o <img>
 * desnecessariamente a cada re-render do componente pai.
 */
const OnboardingCard = memo(function OnboardingCard({
  marco,
  item,
  onDismiss,
}: {
  marco: MarcoOnboarding;
  item: ItemConfig;
  onDismiss: (m: MarcoOnboarding) => void;
}) {
  const content = (
    <div
      className={cn(
        'relative mx-auto min-h-[192px] w-full max-w-[560px] overflow-hidden rounded-[20px] p-3.5 sm:p-4 @container',
        ELEVATED_SURFACE,
        'shadow-[0_1px_0_rgba(15,23,42,0.10),0_6px_13px_-6px_rgba(15,23,42,0.10),0_15px_22px_-16px_rgba(15,23,42,0.06)]',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(marco);
        }}
        aria-label="Dispensar"
        className="absolute right-2 top-1.5 z-20 flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground active:scale-95"
      >
        <X size={17} strokeWidth={2.5} />
      </button>

      <div
        className="relative z-10 flex h-full min-h-[160px] flex-col items-start justify-center gap-3"
        style={{ width: item.contentWidth }}
      >
        <div>
          <p className="whitespace-nowrap text-[clamp(13px,4cqw,20px)] font-bold leading-[1.15] tracking-[-0.02em] text-foreground">
            {item.title}
          </p>
          <p className="mt-1 max-w-[260px] text-[clamp(12.5px,3.8cqw,14.5px)] font-medium leading-[1.35] text-muted-foreground">
            {item.subtitle}
          </p>
        </div>
        <span className={cta}>{item.ctaLabel}</span>
      </div>

      {/*
        Imagem decorativa como fundo CSS (NÃO uma tag <img>) — de propósito.
        Com <img>, o Chrome Android mostra sempre no toque longo o menu
        "Transferir imagem / Abrir imagem / Copiar imagem", e não há forma
        garantida de o desativar por JavaScript (o listener de contextmenu
        é pouco fiável no Android). Sem nenhum elemento de imagem real no
        DOM, esse menu simplesmente não tem o que mostrar: nada para
        transferir, copiar, abrir ou inspecionar.
        `pointerEvents: 'none'` evita ainda qualquer interação própria
        (toque longo, arrastar) nesta área — o card inteiro já é clicável
        via <Link>, por isso a imagem não precisa de reagir a nada sozinha.
      */}
      <div
        role="img"
        aria-label=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: item.imgRight,
          top: item.imgTop,
          bottom: item.imgBottom,
          width: item.imgWidth,
          maxWidth: item.imgMaxWidth,
          height: `calc(100% - ${item.imgTop} - ${item.imgBottom})`,
          borderRadius: 14,
          backgroundImage: `url(${item.image})`,
          backgroundSize: 'contain',
          backgroundPosition: item.imgAlign ?? 'right center',
          backgroundRepeat: 'no-repeat',
          transform: item.imgScale ? `scale(${item.imgScale})` : undefined,
          transformOrigin: item.imgAlign ?? 'right center',
          pointerEvents: 'none',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );

  return (
    <Link href={item.href} className="block transition-transform active:scale-[0.99]">
      {content}
    </Link>
  );
});

/**
 * Cartões de orientação. Mostra exatamente os `marcos` recebidos (a decisão de quais é de
 * `calcularOnboarding`). O × NÃO remove o cartão: abre um diálogo de confirmação. Só "Ocultar cartão"
 * dispensa — o cartão some já (otimista) e fica gravado na base de dados; se a gravação falhar, o cartão
 * volta e o utilizador é avisado. "Cancelar" não altera nada. Dispensar NUNCA marca como concluído.
 */
export function OnboardingSteps({
  lojaId,
  marcos,
  onDispensar,
  onDispensarFalhou,
}: {
  lojaId: string;
  marcos: MarcoOnboarding[];
  onDispensar: (m: MarcoOnboarding) => void;
  onDispensarFalhou: (m: MarcoOnboarding) => void;
}) {
  const { show } = useToast();
  // Cartão a aguardar confirmação (null = diálogo fechado).
  const [aConfirmar, setAConfirmar] = useState<MarcoOnboarding | null>(null);

  const pedirConfirmacao = useCallback((marco: MarcoOnboarding) => setAConfirmar(marco), []);

  const confirmarOcultar = useCallback(async () => {
    const marco = aConfirmar;
    if (!marco) return;
    setAConfirmar(null); // fecha primeiro: evita duplo clique e repetição do pedido
    onDispensar(marco);
    const r = await dispensarMarco(lojaId, marco).catch(() => ({ ok: false as const }));
    if (!r.ok) {
      onDispensarFalhou(marco);
      show('Não foi possível ocultar o cartão. Tenta novamente.', 'error');
    }
  }, [aConfirmar, lojaId, onDispensar, onDispensarFalhou, show]);

  return (
    <>
      {marcos.length > 0 && (
        <div className="flex flex-col gap-4">
          {marcos.map((marco) => (
            <OnboardingCard key={marco} marco={marco} item={getItemConfig(marco)} onDismiss={pedirConfirmacao} />
          ))}
        </div>
      )}

      <Dialog open={aConfirmar !== null} onOpenChange={(aberto) => { if (!aberto) setAConfirmar(null); }}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ocultar esta orientação?</DialogTitle>
            <DialogDescription>
              Queres remover este cartão da página inicial? Podes continuar a aceder a esta funcionalidade através do menu da loja.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setAConfirmar(null)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmarOcultar}>Ocultar cartão</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
