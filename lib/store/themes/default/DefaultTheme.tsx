import type { StoreThemeProps } from '../types';

/**
 * Tema 'default' — NÃO é o design definitivo da loja Shopyump.
 *
 * É a implementação mais simples possível que ainda é uma loja de
 * verdade (nome, descrição, banner, produtos com preço, botão de
 * compra, contactos) — existe só para provar que a cadeia completa
 * funciona: URL → slug → loja → theme_id → StoreRenderer → tema →
 * produtos reais.
 *
 * Quando o tema visual definitivo estiver pronto, ele substitui este
 * ficheiro (ou entra como um novo tema no registry e este passa a ser
 * só o fallback) — a rota pública, as queries e o StoreRenderer não
 * mudam nada disso.
 */
function formatMzn(value: number): string {
  return `${value.toLocaleString('pt-MZ')} MZN`;
}

function whatsappHref(numero: string | null, mensagem: string): string | null {
  if (!numero) return null;
  const digits = numero.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`;
}

export function DefaultTheme({ loja, produtos }: StoreThemeProps) {
  const linksRedes = [
    loja.mostrar_instagram && loja.instagram ? { label: 'Instagram', href: loja.instagram } : null,
    loja.mostrar_facebook && loja.facebook ? { label: 'Facebook', href: loja.facebook } : null,
    loja.mostrar_tiktok && loja.tiktok ? { label: 'TikTok', href: loja.tiktok } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-white text-[#171717]">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between border-b border-[#E5E3E0] px-4 py-4">
        <span className="text-[17px] font-black tracking-tight">{loja.nome}</span>
      </header>

      {/* Banner */}
      {loja.banner_url && (
        <div className="h-40 w-full overflow-hidden bg-[#F4F4F3] sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={loja.banner_url} alt={loja.nome} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Nome + descrição */}
      <div className="flex flex-col gap-1 px-4 py-4">
        <h1 className="text-[20px] font-black tracking-tight">{loja.nome}</h1>
        {loja.descricao && <p className="text-[13px] text-[#78716C]">{loja.descricao}</p>}
      </div>

      {/* Produtos */}
      <main className="flex-1 px-4 pb-10">
        {produtos.length === 0 ? (
          <p className="py-16 text-center text-[13px] font-medium text-[#A8A29E]">
            Esta loja ainda não tem produtos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {produtos.map((p) => {
              const foto = p.fotos[0];
              const comprarHref = whatsappHref(loja.whatsapp, `Olá! Tenho interesse em "${p.nome}".`);
              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-[10px] border border-[#E5E3E0]">
                  <div className="aspect-square w-full overflow-hidden bg-[#F4F4F3]">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt={p.nome} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 p-2.5">
                    <span className="truncate text-[12.5px] font-semibold">{p.nome}</span>
                    <span className="text-[12px] font-bold">
                      {formatMzn(p.preco_promo ?? p.preco)}
                      {p.preco_promo && (
                        <span className="ml-1.5 text-[10px] font-medium text-[#A8A29E] line-through">
                          {formatMzn(p.preco)}
                        </span>
                      )}
                    </span>
                    {comprarHref ? (
                      <a
                        href={comprarHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 rounded-[8px] bg-[#111110] px-2 py-1.5 text-center text-[11px] font-bold text-white"
                      >
                        Comprar
                      </a>
                    ) : (
                      <span className="mt-1 rounded-[8px] bg-[#F4F4F3] px-2 py-1.5 text-center text-[11px] font-bold text-[#A8A29E]">
                        Ver produto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Informações básicas / contactos */}
      {(linksRedes.length > 0 || (loja.mostrar_sobre && loja.conteudo_sobre) || (loja.mostrar_entrega && loja.conteudo_entrega) || (loja.mostrar_termos && loja.conteudo_termos)) && (
        <footer className="flex flex-col gap-3 border-t border-[#E5E3E0] px-4 py-6 text-[12px] text-[#78716C]">
          {loja.mostrar_sobre && loja.conteudo_sobre && (
            <div>
              <span className="block font-bold text-[#171717]">Sobre</span>
              <p>{loja.conteudo_sobre}</p>
            </div>
          )}
          {loja.mostrar_entrega && loja.conteudo_entrega && (
            <div>
              <span className="block font-bold text-[#171717]">Entrega</span>
              <p>{loja.conteudo_entrega}</p>
            </div>
          )}
          {loja.mostrar_termos && loja.conteudo_termos && (
            <div>
              <span className="block font-bold text-[#171717]">Termos</span>
              <p>{loja.conteudo_termos}</p>
            </div>
          )}
          {linksRedes.length > 0 && (
            <div className="flex gap-3">
              {linksRedes.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="font-bold text-[#171717] underline">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
