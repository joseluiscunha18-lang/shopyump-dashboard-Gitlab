/** Passa a primeira mensagem (e anexos) da caixa da Home para a página do assistente. Só em memória. */
export interface Anexo { id: string; nome: string; tipo: string; url: string; }
export interface PedidoInicial { texto: string; anexos: Anexo[]; }

let pendente: PedidoInicial | null = null;
export function entregarPedido(p: PedidoInicial) { pendente = p; }
export function recolherPedido(): PedidoInicial | null { const p = pendente; pendente = null; return p; }

export function ficheirosParaAnexos(files: FileList | null): Anexo[] {
  if (!files) return [];
  return Array.from(files).map((f) => ({ id: crypto.randomUUID(), nome: f.name, tipo: f.type, url: URL.createObjectURL(f) }));
}
