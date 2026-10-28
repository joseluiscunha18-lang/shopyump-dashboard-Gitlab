/**
 * Fotos de produto que ainda NÃO estão no Storage e por isso têm de ser enviadas ao guardar:
 *  - `blob:` — ficheiro escolhido ou recorte feito no editor de fotos;
 *  - `data:` — imagem da biblioteca (que vive no navegador, por loja).
 * Qualquer outra coisa já é um URL final. Gravar um `data:` na base de dados seria guardar a imagem
 * inteira em texto base64 dentro da linha do produto.
 */
export function aindaLocal(foto: string): boolean {
  return foto.startsWith('blob:') || foto.startsWith('data:');
}
