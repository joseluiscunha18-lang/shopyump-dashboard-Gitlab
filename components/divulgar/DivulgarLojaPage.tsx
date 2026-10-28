'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, ExternalLink, Printer, QrCode, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/ShopyumpButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { marcarMarcoConcluido } from '@/lib/mutations/lojaMarcos';

type Platform = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok';


function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Regista a orientação "Partilha a tua loja" como concluída (idempotente). Só chamar depois de uma ação que resultou. */
function registarPartilha(lojaId: string) {
  marcarMarcoConcluido(lojaId, 'partilhar_loja').catch(() => {});
}

function useCopy(url: string, lojaId: string) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = useCallback(async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Fallback para navegadores sem Clipboard API: só conta se o execCommand disser que copiou.
      const t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      t.remove();
    }
    if (!ok) {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 3000);
      return;
    }
    setCopied(true);
    registarPartilha(lojaId);
    window.setTimeout(() => setCopied(false), 2000);
  }, [url, lojaId]);
  return { copied, failed, copy };
}

/* ---------------- Ilustrações ---------------- */

const BrandCtx = createContext({ name: 'A sua loja', link: 'shopyump.com', handle: 'asualoja' });
function useBrand() {
  const b = useContext(BrandCtx);
  return { ...b, initial: (b.name.trim()[0] || 'L').toUpperCase() };
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[22px] border border-border bg-card p-3 shadow-md">
      {children}
    </div>
  );
}

function Hl({ children, className = 'text-primary ring-primary/30 bg-primary/10' }: { children: ReactNode; className?: string }) {
  return <span className={`relative inline-block max-w-full truncate rounded-md px-1.5 py-0.5 align-bottom font-semibold ring-2 ${className}`}>{children}</span>;
}

function InstagramIllustration() {
  const { name, link, handle, initial } = useBrand();
  return (
    <PhoneFrame>
      <p className="truncate text-[11px] font-bold text-foreground">{handle}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-brand-ig-1 via-brand-ig-3 to-brand-ig-4 p-[2px]">
          <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-card bg-muted text-sm font-bold text-foreground">{initial}</div>
        </div>
        <div className="grid flex-1 grid-cols-3 text-center text-[10px] text-muted-foreground">
          <span><b className="block text-[11px] text-foreground">86</b>Posts</span>
          <span><b className="block text-[11px] text-foreground">2,4 mil</b>Seguid.</span>
          <span><b className="block text-[11px] text-foreground">310</b>A seguir</span>
        </div>
      </div>
      <p className="mt-2 truncate text-[11px] font-bold text-foreground">{name}</p>
      <p className="text-[10px] text-foreground">Conheça os nossos produtos ↓</p>
      <p className="mt-1 text-[10px]"><Hl className="bg-brand-ig-blue/10 text-brand-ig-blue ring-brand-ig-blue/40">{link}</Hl></p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <span className="rounded-md bg-brand-ig-blue py-1 text-center text-[10px] font-semibold text-brand-on">Seguir</span>
        <span className="rounded-md bg-muted py-1 text-center text-[10px] font-semibold text-foreground">Mensagem</span>
      </div>
      <div className="mt-2 flex gap-2">
        {['Novidades', 'Promoções', 'Clientes'].map((t) => (
          <div key={t} className="flex flex-col items-center gap-0.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-ig-2 to-brand-ig-4 p-[2px]"><div className="h-full w-full rounded-full border-2 border-card bg-muted" /></div>
            <span className="text-[8px] text-muted-foreground">{t}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

function WhatsAppIllustration() {
  const { name, link, initial } = useBrand();
  return (
    <PhoneFrame>
      <div className="-mx-3 -mt-3 flex items-center gap-2 bg-brand-wa px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-on/90 text-[11px] font-bold text-brand-wa">{initial}</div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-brand-on">{name}</p>
          <p className="text-[9px] text-brand-on/80">Conta comercial</p>
        </div>
      </div>
      <div className="-mx-3 space-y-1.5 bg-brand-wa-bg p-2">
        <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-sm bg-brand-wa-bubble p-2 text-[10px] text-foreground shadow-sm">
          Já conhece a {name}? Descubra os nossos produtos aqui:
          <div className="mt-1"><Hl className="bg-brand-wa/10 text-brand-wa ring-brand-wa/40">{link}</Hl></div>
          <p className="mt-0.5 text-right text-[8px] text-muted-foreground">10:24 <span className="text-brand-wa-tick">✓✓</span></p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[9px] text-muted-foreground">
        <span className="h-3 w-3 rounded-full border-2 border-brand-wa" />
        Estado · visível para os seus contactos
      </div>
    </PhoneFrame>
  );
}

function FacebookIllustration() {
  const { name, link, initial } = useBrand();
  return (
    <PhoneFrame>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-fb text-[11px] font-bold text-brand-on">{initial}</div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-foreground">{name}</p>
          <p className="text-[9px] text-muted-foreground">Página · Agora</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-foreground">Novidades na loja! Veja a coleção completa e encomende online.</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-border">
        <div className="grid h-14 grid-cols-3 gap-px bg-border">
          <div className="bg-brand-fb/20" /><div className="bg-brand-fb/10" /><div className="bg-brand-fb/25" />
        </div>
        <div className="flex items-center justify-between gap-2 bg-muted/60 p-2">
          <p className="min-w-0 truncate text-[9px] uppercase text-muted-foreground">{link}</p>
          <span className="shrink-0 rounded-md bg-brand-fb px-2 py-1 text-[9px] font-bold text-brand-on ring-2 ring-brand-fb/30">Visitar loja</span>
        </div>
      </div>
      <div className="mt-2 flex justify-around text-[9px] font-semibold text-muted-foreground">
        <span className="text-brand-fb">👍 Gosto</span><span>Comentar</span><span>Partilhar</span>
      </div>
    </PhoneFrame>
  );
}

function TikTokIllustration() {
  const { link, handle, initial } = useBrand();
  return (
    <PhoneFrame>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background shadow-[-2px_-2px_0_var(--brand-tt-cyan),2px_2px_0_var(--brand-tt-red)]">{initial}</div>
        <p className="mt-1.5 max-w-full truncate text-[11px] font-bold text-foreground">@{handle}</p>
        <div className="mt-1 flex gap-3 text-[9px] text-muted-foreground">
          <span><b className="text-foreground">120</b> A seguir</span>
          <span><b className="text-foreground">8,1 mil</b> Seguidores</span>
        </div>
        <span className="mt-1.5 rounded-md bg-brand-tt-red px-5 py-1 text-[10px] font-semibold text-brand-on">Seguir</span>
        <p className="mt-1.5 text-[10px] text-foreground">Encomende pelo link ↓</p>
        <p className="mt-1 max-w-full text-[10px]"><Hl className="bg-brand-tt-red/10 text-brand-tt-red ring-brand-tt-red/40">{link}</Hl></p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {['from-brand-tt-cyan/40', 'from-brand-tt-red/40', 'from-foreground/30'].map((c, i) => (
          <div key={i} className={`relative aspect-[3/4] rounded bg-gradient-to-b ${c} to-muted`}>
            {i === 0 && <span className="absolute inset-x-1 bottom-1 rounded bg-card/90 px-1 text-[8px] font-semibold text-foreground">Link na bio</span>}
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

/* ---------------- Conteúdo dos guias ---------------- */

interface Guide {
  name: string;
  illustration: () => ReactNode;
  cardTitle: string;
  cardText: string;
  guideTitle: string;
  steps: string[];
  note?: string;
  openLabel: string;
  openUrl: (storeUrl: string) => string;
  /** true se o botão abre uma janela de partilha COM o link da loja (conta como partilha). Abrir só a rede não conta. */
  contaComoPartilha: boolean;
}

const GUIDES: Record<Platform, Guide> = {
  instagram: {
    name: 'Instagram',
    illustration: InstagramIllustration,
    cardTitle: 'Coloque o link no seu perfil',
    cardText: 'Quem visita o seu perfil encontra a loja num só toque.',
    guideTitle: 'Como adicionar o link da sua loja ao Instagram',
    steps: [
      'Copie o link da sua loja no Shopyump.',
      'Abra o Instagram e aceda ao seu perfil.',
      'Toque em “Editar perfil”.',
      'Procure a área de links ou de site e escolha adicionar um link.',
      'Cole o link da sua loja e guarde as alterações.',
    ],
    note: 'Os nomes e a localização das opções podem mudar com as atualizações do Instagram.',
    openLabel: 'Abrir Instagram',
    openUrl: () => 'https://www.instagram.com/accounts/edit/',
    contaComoPartilha: false,
  },
  whatsapp: {
    name: 'WhatsApp Business',
    illustration: WhatsAppIllustration,
    cardTitle: 'Partilhe em conversas e no Estado',
    cardText: 'Envie a loja aos seus clientes e adicione-a ao perfil da empresa.',
    guideTitle: 'Como partilhar a sua loja no WhatsApp Business',
    steps: [
      'Copie o link da sua loja.',
      'Para o perfil: abra o WhatsApp Business, vá a Ferramentas da empresa → Perfil, toque em Website, cole o link e guarde.',
      'Para uma conversa: abra a conversa com o cliente, cole o link e envie.',
      'Para o Estado: crie um novo Estado de texto, cole o link e publique.',
    ],
    note: 'Nada é enviado automaticamente — é sempre você que escolhe o contacto e envia.',
    openLabel: 'Abrir WhatsApp',
    openUrl: (u) => `https://api.whatsapp.com/send?text=${encodeURIComponent(u)}`,
    contaComoPartilha: true,
  },
  facebook: {
    name: 'Facebook',
    illustration: FacebookIllustration,
    cardTitle: 'Publique a loja na sua página',
    cardText: 'Uma publicação com o link leva os seguidores direto aos produtos.',
    guideTitle: 'Como partilhar a sua loja no Facebook',
    steps: [
      'Copie o link da sua loja.',
      'Abra o Facebook e entre na sua página comercial (ou no seu perfil).',
      'Crie uma nova publicação com uma mensagem curta sobre os seus produtos.',
      'Cole o link — a pré-visualização da loja aparece automaticamente.',
      'Publique. Pode também afixar a publicação no topo da página.',
    ],
    note: 'O botão abaixo abre a janela de partilha do Facebook; a publicação só é feita se a confirmar.',
    openLabel: 'Partilhar no Facebook',
    openUrl: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    contaComoPartilha: true,
  },
  tiktok: {
    name: 'TikTok',
    illustration: TikTokIllustration,
    cardTitle: 'Leve os seguidores até à loja',
    cardText: 'Use o link no perfil e diga nos vídeos onde podem comprar.',
    guideTitle: 'Como direcionar os seguidores do TikTok para a sua loja',
    steps: [
      'Copie o link da sua loja.',
      'Abra o TikTok, aceda ao perfil e toque em “Editar perfil”.',
      'Se a opção de site estiver disponível, cole o link da loja e guarde.',
      'Se ainda não tiver essa opção, escreva o endereço da loja na biografia.',
      'Nos vídeos, diga “link na bio” e mostre o endereço no ecrã ou na legenda.',
    ],
    note: 'A opção de adicionar um link depende do tipo de conta e dos requisitos do TikTok, que podem variar.',
    openLabel: 'Abrir TikTok',
    openUrl: () => 'https://www.tiktok.com/',
    contaComoPartilha: false,
  },
};

/* ---------------- Página ---------------- */

export function DivulgarLojaPage({ lojaId, storeName, storeUrl }: { lojaId: string; storeName: string; storeUrl: string }) {
  const { copied, failed, copy } = useCopy(storeUrl, lojaId);
  const [canShare, setCanShare] = useState(false);
  const [guide, setGuide] = useState<Platform | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => setCanShare(typeof navigator !== 'undefined' && !!navigator.share), []);

  const share = async () => {
    if (!canShare) return copy();
    try {
      await navigator.share({ title: storeName, url: storeUrl });
      registarPartilha(lojaId);
    } catch {
      /* partilha cancelada */
    }
  };

  const active = guide ? GUIDES[guide] : null;
  const brand = useMemo(
    () => ({ name: storeName, link: displayUrl(storeUrl), handle: storeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '') || 'asualoja' }),
    [storeName, storeUrl],
  );

  return (
    <BrandCtx.Provider value={brand}>
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pt-2 pb-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Divulgar loja</h1>
        <p className="text-sm text-muted-foreground">Ajude mais pessoas a descobrir os seus produtos.</p>
      </header>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">O link da sua loja</h2>
          <p className="text-sm text-muted-foreground">Partilhe o endereço da sua loja para que os clientes possam encontrar os seus produtos.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{displayUrl(storeUrl)}</span>
            <button
              type="button"
              onClick={copy}
              aria-label="Copiar link"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
          </div>
          <p aria-live="polite" className={`mt-1.5 h-4 text-xs ${failed ? 'text-destructive' : 'text-primary'}`}>{copied ? 'Link copiado' : failed ? 'Não foi possível copiar o link.' : ''}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copiado' : 'Copiar link'}</Button>
            <Button onClick={share} variant="primary">
              <Share2 size={16} />Partilhar loja
            </Button>
          </div>
          {!canShare && <p className="mt-2 text-xs text-muted-foreground">Este dispositivo não tem partilha nativa — “Partilhar loja” copia o link.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={storeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-foreground hover:bg-muted">
              <ExternalLink size={14} />Ver loja
            </a>
            <Button variant="ghost" size="sm" onClick={() => setQrOpen(true)}><QrCode size={14} />Gerar QR Code</Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Aprenda a divulgar a sua loja</h2>
          <p className="text-sm text-muted-foreground">Veja como apresentar a sua loja nas redes sociais e facilite o acesso dos clientes aos seus produtos.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.keys(GUIDES) as Platform[]).map((key) => {
            const g = GUIDES[key];
            const Illu = g.illustration;
            return (
              <article key={key} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <div className="bg-muted/50 px-4 py-5"><Illu /></div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{g.name}</p>
                  <h3 className="text-sm font-bold text-foreground">{g.cardTitle}</h3>
                  <p className="text-sm text-muted-foreground">{g.cardText}</p>
                  <Button variant="secondary" size="sm" className="mt-3 self-start" onClick={() => setGuide(key)}>Ver como fazer</Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setGuide(null)}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.guideTitle}</DialogTitle>
                <DialogDescription>{active.name}</DialogDescription>
              </DialogHeader>
              <div className="rounded-xl bg-muted/50 p-4"><active.illustration /></div>
              <ol className="flex flex-col gap-3">
                {active.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
              {active.note && <p className="text-xs text-muted-foreground">{active.note}</p>}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Link copiado' : 'Copiar link da loja'}</Button>
                <a
                  href={active.openUrl(storeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => { if (active.contaComoPartilha) registarPartilha(lojaId); }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:bg-muted"
                >
                  <ExternalLink size={16} />{active.openLabel}
                </a>
              </div>
              <Button variant="ghost" onClick={() => setGuide(null)}>Fechar</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <QrDialog open={qrOpen} onClose={() => setQrOpen(false)} storeName={storeName} storeUrl={storeUrl} onUsed={() => registarPartilha(lojaId)} />
    </div>
    </BrandCtx.Provider>
  );
}

function QrDialog({ open, onClose, storeName, storeUrl, onUsed }: { open: boolean; onClose: () => void; storeName: string; storeUrl: string; onUsed: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(storeUrl, { width: 768, margin: 2, errorCorrectionLevel: 'M' }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [open, storeUrl]);

  const fileName = `qr-${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  const print = () => {
    if (!dataUrl) return;
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) return;
    onUsed();
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
    w.document.write(`<!doctype html><html><head><title>${esc(storeName)}</title><style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:95vh;margin:0;text-align:center}h1{font-size:28px;margin:0 0 8px}p{color:#444;margin:4px 0}img{width:320px;height:320px;margin:24px 0}</style></head><body><h1>${esc(storeName)}</h1><p>Aponte a câmara do telemóvel para visitar a nossa loja</p><img src="${dataUrl}" alt="QR Code"/><p>${esc(displayUrl(storeUrl))}</p><script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>QR Code da loja</DialogTitle>
          <DialogDescription>{storeName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl border border-border bg-white p-3">
            {dataUrl ? <img src={dataUrl} alt={`QR Code de ${storeName}`} className="h-56 w-56" /> : <div className="h-56 w-56 animate-pulse rounded bg-muted" />}
          </div>
          <p className="text-center text-xs text-muted-foreground break-all">{displayUrl(storeUrl)}</p>
          <p className="text-center text-sm text-muted-foreground">Coloque-o no balcão, em embalagens ou cartões. Os clientes apontam a câmara e abrem a loja.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={dataUrl ?? undefined}
            download={fileName}
            aria-disabled={!dataUrl}
            onClick={() => { if (dataUrl) onUsed(); }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download size={16} />Guardar
          </a>
          <Button variant="secondary" onClick={print} disabled={!dataUrl}><Printer size={16} />Imprimir</Button>
        </div>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}
