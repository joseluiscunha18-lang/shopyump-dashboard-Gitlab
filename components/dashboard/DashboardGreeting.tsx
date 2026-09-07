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

const SUBTITULO: Record<DashboardGreetingProps['fase'], string> = {
  inicio: 'Vamos começar a preparar sua loja.',
  em_progresso: 'Sua loja está ganhando forma.',
  completo: 'Sua loja está pronta para vender.',
};

/**
 * Cabeçalho de saudação da Home — "Olá, {nome}" + subtítulo que muda
 * conforme a fase da jornada (ver `fase` acima). Fica sempre no topo da
 * página, acima de tudo (alerta de pedido, cards financeiros,
 * onboarding) — é o único elemento que não desaparece nem se reordena
 * conforme o estado da loja.
 */
export function DashboardGreeting({ name, fase }: DashboardGreetingProps) {
  return (
    <div>
      <h1 className="text-[22px] font-black leading-tight tracking-tight text-ink sm:text-[24px]">Olá, {name}</h1>
      <p className="mt-1 text-[14px] font-medium text-slate-500">{SUBTITULO[fase]}</p>
    </div>
  );
}
