export function InstitutionalView({ eyebrow, titulo, conteudo }: { eyebrow: string; titulo: string; conteudo: string }) {
  return (
    <article>
      <header className="border-b border-[oklch(0.88224_0_0)] bg-[oklch(0.95213_0_0)]/40">
        <div className="px-4 py-9">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[oklch(0.52081_0_0)]">{eyebrow}</p>
          <h1 className="mt-2 font-[family-name:'Manrope',_sans-serif] text-[24px] font-extrabold leading-tight text-[oklch(0.24353_0_0)]">
            {titulo}
          </h1>
        </div>
      </header>
      <div className="px-4 py-8">
        <p className="whitespace-pre-line text-[13.5px] leading-7 text-[oklch(0.24353_0_0)]">{conteudo}</p>
      </div>
    </article>
  );
}
