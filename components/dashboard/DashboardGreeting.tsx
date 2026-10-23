interface DashboardGreetingProps {
  /**
   * Nome usado na saudação. Não existe (ainda) um nome pessoal do
   * vendedor no schema — só `loja.nome` (nome da loja) — por isso é
   * isso que `page.tsx` passa aqui. Se um dia existir um nome pessoal
   * (ex: tabela `perfis`), troca-se só o valor passado pelo chamador;
   * este componente não muda.
   */
  name: string;
  /**
   * Em que fase da jornada o vendedor está — decide só o subtítulo,
   * nunca o "Olá, {name}" em si:
   * - 'inicio': ainda sem nenhum produto publicado. A loja está vazia,
   *   por isso a mensagem é sobre COMEÇAR ("vamos preparar"), não sobre
   *   progresso — não existe progresso ainda.
   * - 'em_progresso': já tem pelo menos 1 produto mas ainda falta pelo
   *   menos 1 dos outros marcos (personalizar/pagamentos/divulgar). Já
   *   existe uma loja de verdade, então "vamos preparar" soa estranho
   *   (como se ainda estivesse no zero) — mas "pronta para vender"
   *   também é cedo demais, porque falta configurar. "Ganhando forma"
   *   fica no meio: reconhece o progresso sem prometer o que não é
   *   verdade ainda.
   * - 'completo': todos os marcos concluídos ou dispensados — aí sim a
   *   promessa de "pronta para vender" já é honesta.
   */
  fase: 'inicio' | 'em_progresso' | 'completo';
}

const TEXTO: Record<DashboardGreetingProps['fase'], { eyebrow: string; titulo: string; sub: string }> = {
  inicio: { eyebrow: 'Início · Primeiro acesso', titulo: 'Vamos preparar a tua loja?', sub: 'Adiciona o teu primeiro produto e dá o primeiro passo para começares a vender.' },
  em_progresso: { eyebrow: 'Início · Primeiro produto criado', titulo: 'A tua loja está a ganhar forma!', sub: 'O teu primeiro produto já está criado. Continua a preparar a tua loja para receber clientes.' },
  completo: { eyebrow: 'Início', titulo: 'A tua loja está pronta para crescer.', sub: 'Aqui está o que está a acontecer na tua loja.' },
};

/** Saudação da Home — o "Olá" mantém-se; título e texto evoluem com a fase. */
export function DashboardGreeting({ name, fase }: DashboardGreetingProps) {
  const t = TEXTO[fase];
  return (
    <div className="dashboard-greeting px-1">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t.eyebrow}</p>
      <p className="mt-3 text-[17px] font-semibold text-foreground">Olá, {name}!</p>
      <h1 className="mt-1 text-[28px] font-black leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[32px]">{t.titulo}</h1>
      <p className="mt-2 text-[15px] font-medium text-muted-foreground">{t.sub}</p>
    </div>
  );
}
