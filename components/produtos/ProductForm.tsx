'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileEdit } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Switch } from '@/components/ui/Switch';
import { PhotoUploader } from '@/components/produtos/PhotoUploader';
import { CategoryPicker } from '@/components/produtos/CategoryPicker';
import { VariantEditor, type VariantesState } from '@/components/produtos/VariantEditor';
import { PesoPadraoInput } from '@/components/produtos/PesoPadraoInput';
import { StockSection } from '@/components/produtos/StockSection';
import { MoreOptions } from '@/components/produtos/MoreOptions';
import { useToast } from '@/components/ui/Toast';
import { useProductFormGuard } from '@/components/produtos/ProductFormGuardContext';
import { usePublishing } from '@/components/produtos/PublishingContext';
import { createProduto, updateProduto } from '@/lib/mutations/produtos';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { totalEstoque } from '@/lib/variantes';
import { pesoParaKg, type UnidadePeso } from '@/lib/peso';
import {
  readProdutoDraft,
  writeProdutoDraft,
  clearProdutoDraft,
  isDraftMeaningful,
  type ProdutoDraft,
} from '@/lib/produtos/draft';
import type { Produto, ProdutoMaisOpcoes } from '@/types/database';

/* ── Primitivos de layout ──────────────────────────────────────────────────── */

/**
 * Superfície de secção — o único nível de "cartão" da página. Agrupa vários
 * campos relacionados (ex: Nome + Descrição + Categoria) numa única
 * superfície branca com borda extremamente discreta. Os campos lá dentro
 * nunca ganham a sua própria caixa — só um título e o espaçamento vertical
 * fazem a hierarquia dentro da secção.
 */
function FormSection({
  title,
  description,
  right,
  children,
}: {
  title?: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#EDEBE8] bg-white p-5 sm:p-6">
      {(title || right) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            {title && (
              <h2 className="text-[13.5px] font-semibold tracking-[0.01em] text-[#3F3F46]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[13px] font-normal text-[#52525B]">{description}</p>
            )}
          </div>
          {right && <div className="shrink-0 text-[11.5px] font-semibold text-[#71717A]">{right}</div>}
        </div>
      )}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

/* ── Linha de controlo leve (Estoque / Peso) ───────────────────────────────
   Vive dentro de uma FormSection — por isso nunca tem borda ou fundo
   próprios; é só um título + descrição + switch, com o campo condicional
   a aparecer por baixo. A secção-mãe já define os limites do grupo. */

function ConfigRow({
  title,
  description,
  checked,
  onToggle,
  ariaLabel,
  children,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  ariaLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold text-[#111110]">{title}</span>
          {description && (
            <span className="text-[13px] font-medium leading-snug text-[#71717A]">{description}</span>
          )}
        </div>
        <Switch checked={checked} onChange={onToggle} ariaLabel={ariaLabel} size="sm" />
      </div>
      {children}
    </div>
  );
}

/* ── Rótulo com tag "opcional" ─────────────────────────────────────────────── */

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 pl-0.5">
      <span className="text-[13.5px] font-semibold tracking-[0.01em] text-[#3F3F46]">
        {label}
      </span>
      {optional && (
        <span className="text-[11.5px] font-semibold normal-case tracking-normal text-[#71717A]">
          opcional
        </span>
      )}
    </div>
  );
}

/* ── ProductForm ───────────────────────────────────────────────────────────── */

export function ProductForm({ lojaId, produto }: { lojaId: string; produto?: Produto }) {
  const [nome, setNome]               = useState(produto?.nome ?? '');
  const [descricao, setDescricao]     = useState(produto?.descricao ?? '');
  const [categoria, setCategoria]     = useState(produto?.categoria ?? '');
  const [preco, setPreco]             = useState(produto ? String(produto.preco) : '');
  const [precoPromo, setPrecoPromo]   = useState(produto?.preco_promo ? String(produto.preco_promo) : '');
  const [fotos, setFotos]             = useState<string[]>(produto?.fotos ?? []);

  const [variantes, setVariantes] = useState<VariantesState>({
    raiz:                     produto?.variantes?.raiz                     ?? null,
    filha:                    produto?.variantes?.filha                    ?? null,
    neta:                     produto?.variantes?.neta                     ?? null,
    versoes:                  produto?.variantes?.versoes                  ?? [],
    imagensPorCaracteristica: produto?.variantes?.imagensPorCaracteristica ?? undefined,
  });

  const genero = produto?.genero ?? null;

  const [controlarEstoque, setControlarEstoque] = useState(typeof produto?.estoque === 'number');
  const [estoqueSimples, setEstoqueSimples]     = useState(
    typeof produto?.estoque === 'number' ? String(produto.estoque) : ''
  );

  const [controlarPeso, setControlarPeso]         = useState(typeof produto?.mais_opcoes?.peso === 'number');
  const [pesoPadraoUnidade, setPesoPadraoUnidade] = useState<UnidadePeso>('kg');
  const [pesoPadraoValor, setPesoPadraoValor]     = useState(
    typeof produto?.mais_opcoes?.peso === 'number' ? String(produto.mais_opcoes.peso) : ''
  );
  const pesoPadraoKg = useMemo(() => {
    if (pesoPadraoValor.trim() === '' || Number.isNaN(Number(pesoPadraoValor))) return null;
    return pesoParaKg(Number(pesoPadraoValor), pesoPadraoUnidade);
  }, [pesoPadraoValor, pesoPadraoUnidade]);

  const [maisOpcoes, setMaisOpcoes] = useState<Omit<ProdutoMaisOpcoes, 'peso'>>(produto?.mais_opcoes ?? {});
  const [saving, setSaving]         = useState(false);

  // ── Validação ao publicar ──────────────────────────────────────────────
  // Sem lista de erros antes de o lojista tentar — só depois de um "Publicar
  // produto" falhado é que os campos em falta ganham estado de erro visível.
  const [showErrors, setShowErrors] = useState(false);
  const fotosSectionRef = useRef<HTMLDivElement>(null);
  const nomeInputRef    = useRef<HTMLInputElement>(null);
  const categoriaRef    = useRef<HTMLDivElement>(null);
  const precoInputRef   = useRef<HTMLInputElement>(null);

  const router      = useRouter();
  const { show }    = useToast();
  const { setDirty, setMode, requestExit, registerSaveAsDraft, registerDiscard } = useProductFormGuard();
  const { startPublish, resolvePublish, failPublish } = usePublishing();
  const hasVariants = !!variantes.raiz || !!variantes.filha || !!variantes.neta;

  // ── Descartar alterações ao sair (editar) / sair sem guardar (criar) ──────
  // Compara os campos "leves" do formulário com o estado inicial. Fotos e
  // variantes ficam de fora do "sujo" propositalmente simples — o essencial
  // é não deixar o lojista perder texto/preço escritos por um toque errado.
  const initialSnapshotRef = useRef(
    JSON.stringify({ nome, descricao, categoria, preco, precoPromo })
  );

  useEffect(() => {
    setMode(produto ? 'editar' : 'criar');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aquece a rota /produtos assim que o formulário monta — o bundle e o
  // layout ficam prontos em segundo plano, para que o router.push() no
  // fim da submissão não tenha de esperar por isso também. Não resolve a
  // espera do upload/insert em si, mas remove a parcela de "trocar de
  // página" desse tempo total.
  useEffect(() => {
    router.prefetch('/produtos');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Registar callbacks no contexto para a TopBar os invocar ─────────────
  useEffect(() => {
    // "Guardar como rascunho" — só disponível no fluxo de criação.
    // Guarda o produto com ativo=false e rascunho=true, depois sai.
    registerSaveAsDraft(async () => {
      if (produto) return; // edição não usa este callback
      setSaving(true);
      const payload = {
        loja_id:     lojaId,
        nome:        nome.trim() || 'Produto sem nome',
        preco:       Number(preco) || 0,
        preco_promo: precoPromo ? Number(precoPromo) : null,
        categoria:   categoria.trim() || '',
        descricao:   descricao.trim() || null,
        genero,
        fotos:       fotos.filter((f) => !f.startsWith('blob:')), // exclui blobs não enviados
        variantes:   hasVariants
          ? {
              raiz:    variantes.raiz,
              filha:   variantes.filha,
              neta:    variantes.neta,
              versoes: variantes.versoes,
              imagensPorCaracteristica: variantes.imagensPorCaracteristica,
            }
          : null,
        estoque:     null,
        mais_opcoes: null,
        ativo:       false,
        rascunho:    true,
      };
      const res = await createProduto(payload);
      setSaving(false);
      if (!res.ok) return show(res.error ?? 'Não foi possível guardar o rascunho.', 'error');
      show('Rascunho guardado.');
      clearProdutoDraft(lojaId);
      setDirty(false);
      router.push('/produtos');
      router.refresh();
    });

    // "Descartar" — comportamento difere por modo.
    // Criar: apaga rascunho local e sai.
    // Editar: restaura estado inicial e sai (ou apenas sai — o guard já cobre).
    registerDiscard(() => {
      if (!produto) {
        clearProdutoDraft(lojaId);
      }
      setDirty(false);
      router.push('/produtos');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, descricao, categoria, preco, precoPromo, fotos, variantes, hasVariants, genero]);

  useEffect(() => {
    const current = JSON.stringify({ nome, descricao, categoria, preco, precoPromo });
    setDirty(current !== initialSnapshotRef.current);
  }, [nome, descricao, categoria, preco, precoPromo, setDirty]);

  // ── Rascunho automático (só ao criar um produto novo) ─────────────────────
  const draftAppliedRef = useRef(false);
  const [draftPendente, setDraftPendente] = useState<ProdutoDraft | null>(null);

  // Bloqueia o scroll do body enquanto o modal de rascunho está aberto.
  useEffect(() => {
    if (!draftPendente) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [draftPendente]);

  useEffect(() => {
    if (produto || draftAppliedRef.current) return;
    draftAppliedRef.current = true;
    const draft = readProdutoDraft(lojaId);
    if (!isDraftMeaningful(draft)) return;
    const t = setTimeout(() => setDraftPendente(draft), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAceitarDraft() {
    if (!draftPendente) return;
    setNome(draftPendente.nome);
    setDescricao(draftPendente.descricao);
    setCategoria(draftPendente.categoria);
    setPreco(draftPendente.preco);
    setPrecoPromo(draftPendente.precoPromo);
    initialSnapshotRef.current = JSON.stringify({
      nome: draftPendente.nome,
      descricao: draftPendente.descricao,
      categoria: draftPendente.categoria,
      preco: draftPendente.preco,
      precoPromo: draftPendente.precoPromo,
    });
    setDirty(false);
    setDraftPendente(null);
  }

  function handleRejeitarDraft() {
    clearProdutoDraft(lojaId);
    setDraftPendente(null);
  }

  useEffect(() => {
    if (produto) return; // rascunho é só para criação
    const semConteudo = !nome.trim() && !descricao.trim() && !categoria.trim() && !preco.trim();
    if (semConteudo) return;
    const id = setTimeout(() => {
      writeProdutoDraft(lojaId, { nome, descricao, categoria, preco, precoPromo });
    }, 500);
    return () => clearTimeout(id);
  }, [produto, lojaId, nome, descricao, categoria, preco, precoPromo]);

  // Só o mínimo indispensável para uma loja visual: imagem, nome, categoria
  // e preço. Tudo o resto (descrição, estoque, peso, variantes, SKU…) fica
  // opcional de propósito — cada produto é diferente e obrigar campos que
  // talvez não sejam relevantes só cria fricção.
  const fotosValidas     = fotos.length > 0;
  const nomeValido       = nome.trim().length > 1;
  const categoriaValida  = categoria.trim().length > 0;
  const precoValido      = Number(preco) > 0;

  const valid = fotosValidas && nomeValido && categoriaValida && precoValido;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!valid) {
      setShowErrors(true);

      const emFalta: { chave: 'fotos' | 'nome' | 'categoria' | 'preco'; label: string }[] = [];
      if (!fotosValidas)    emFalta.push({ chave: 'fotos',     label: 'Imagem' });
      if (!nomeValido)      emFalta.push({ chave: 'nome',      label: 'Nome' });
      if (!categoriaValida) emFalta.push({ chave: 'categoria', label: 'Categoria' });
      if (!precoValido)     emFalta.push({ chave: 'preco',     label: 'Preço base' });

      // Mensagem específica quando só falta imagem — mais útil do que um
      // genérico "preencha os campos obrigatórios" para o caso mais comum.
      if (emFalta.length === 1 && emFalta[0].chave === 'fotos') {
        show('Adicione pelo menos uma imagem do produto.', 'error');
      } else {
        show(
          `Não foi possível publicar\nComplete os campos obrigatórios para continuar.\n\n${emFalta
            .map((f) => `• ${f.label}`)
            .join('\n')}`,
          'error'
        );
      }

      // Leva o lojista direto ao primeiro campo em falta, na ordem em que
      // aparecem no ecrã.
      const primeiro = emFalta[0];
      if (primeiro?.chave === 'fotos') {
        fotosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (primeiro?.chave === 'nome') {
        nomeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nomeInputRef.current?.focus();
      } else if (primeiro?.chave === 'categoria') {
        categoriaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (primeiro?.chave === 'preco') {
        precoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        precoInputRef.current?.focus();
      }

      return;
    }

    setSaving(true);

    const estoque = !controlarEstoque
      ? null
      : hasVariants
        ? totalEstoque(variantes.versoes)
        : estoqueSimples === ''
          ? null
          : Number(estoqueSimples);

    const maisOpcoesFinal: ProdutoMaisOpcoes = {
      ...maisOpcoes,
      peso: controlarPeso ? pesoPadraoKg : null,
    };

    // ── Edição: mesma lógica de navegação garantida da criação. ───────────
    // Antes esperava a rede (upload + update) por inteiro antes de sair do
    // formulário — daí a variação 4-8s conforme a ligação. Agora o upload
    // e o update seguem em segundo plano (fora do "await" que bloquearia a
    // navegação) e a saída para /produtos é sempre disparada aos 3
    // segundos exatos, sucesso ou erro. Um erro em segundo plano ainda
    // aparece — via toast, que sobrevive à troca de página porque o
    // ToastProvider vive no layout raiz — só que já não impede a saída.
    if (produto) {
      const MIN_GUARDAR_MS = 2500;
      setTimeout(() => {
        // Sem router.refresh() aqui: é ele que obriga a troca de página a
        // esperar por uma resposta nova do Supabase (o atraso variável
        // que não queríamos) e é também a causa do "piscar" para lista
        // vazia — a atualização real dos dados já é feita mais abaixo,
        // pelo router.refresh() chamado quando o update em segundo plano
        // termina de facto (nunca antes disso).
        router.push('/produtos');
      }, MIN_GUARDAR_MS);

      (async () => {
        let fotosFinais: string[];
        try {
          fotosFinais = await Promise.all(
            fotos.map(async (foto) => {
              if (!foto.startsWith('blob:')) return foto;
              const res  = await fetch(foto);
              const blob = await res.blob();
              const file = new File([blob], `foto.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
              const { url, error } = await uploadImage(BUCKETS.produtos, file, lojaId);
              if (error || !url) throw new Error(error ?? 'Não foi possível enviar uma das imagens.');
              return url;
            })
          );
        } catch (err) {
          show(err instanceof Error ? err.message : 'Não foi possível enviar uma das imagens.', 'error');
          return;
        }

        const payload = {
          loja_id:    lojaId,
          nome:       nome.trim(),
          preco:      Number(preco),
          preco_promo: precoPromo ? Number(precoPromo) : null,
          categoria,
          descricao:  descricao.trim() || null,
          genero,
          fotos:      fotosFinais,
          variantes:  hasVariants
            ? {
                raiz:  variantes.raiz,
                filha: variantes.filha,
                neta:  variantes.neta,
                versoes: variantes.versoes,
                imagensPorCaracteristica: variantes.imagensPorCaracteristica,
              }
            : null,
          estoque,
          mais_opcoes: Object.values(maisOpcoesFinal).some((v) => v !== undefined && v !== null && v !== '')
            ? maisOpcoesFinal
            : null,
          ativo: produto.ativo,
        };

        const res = await updateProduto(produto.id, payload);
        if (!res.ok) return show(res.error ?? 'Não foi possível guardar o produto.', 'error');
        show('Produto atualizado.');
        router.refresh();
      })();

      setDirty(false);
      return;
    }

    // ── Criação: publicação otimista ────────────────────────────────────
    // Regista já o produto (com a foto ainda local, em blob:) — o upload +
    // insert seguem em segundo plano, fora do "await" que bloquearia a
    // navegação, e só comunicam o resultado via toast/PublishingContext,
    // nunca via estado local do formulário — ele já vai ter desmontado
    // quando esse trabalho terminar. O blob: URL continua válido porque a
    // navegação do Next.js aqui é client-side (sem recarregar o documento).
    //
    // A navegação em si, porém, é propositadamente segurada por
    // MIN_BOTAO_PUBLICAR_MS: sem isso o botão "Publicar produto" mal chega
    // a mostrar o spinner antes de a página trocar, e o lojista nunca vê a
    // confirmação de que o clique foi registado. Este atraso não bloqueia
    // o trabalho em fundo (que já começou), só a troca de ecrã.
    const tempId = crypto.randomUUID();
    const precoNum      = Number(preco) || 0;
    const precoPromoNum = precoPromo ? Number(precoPromo) : 0;
    const precoLabel    = (precoPromoNum > 0 ? precoPromoNum : precoNum).toLocaleString('pt-MZ');

    startPublish({
      tempId,
      nome: nome.trim(),
      precoLabel,
      categoria,
      fotoPreview: fotos[0] ?? null,
    });

    clearProdutoDraft(lojaId);
    setDirty(false);

    const MIN_BOTAO_PUBLICAR_MS = 2500;
    setTimeout(() => {
      // Sem setSaving(false) aqui de propósito: se o resetássemos antes do
      // router.push, o botão voltava a "Publicar produto" por um instante
      // (a navegação não é instantânea) antes de a página trocar — o
      // lojista chegava a ver o CTA normal a piscar entre o processamento
      // e a saída do ecrã. O formulário vai desmontar assim que a
      // navegação completar, por isso não há necessidade de repor
      // `saving`: o botão fica a processar até ao redirecionamento em si.
      //
      // SEM router.refresh() aqui: obrigava a troca de ecrã a esperar por
      // uma resposta nova do Supabase (o atraso variável que não
      // queremos) e era também a causa do "piscar" para lista vazia
      // logo a seguir a chegar à página. A lista fica correta sozinha
      // quando o upload+insert em segundo plano terminar de facto —
      // resolvePublish já chama router.refresh() nesse momento, via
      // PublishingContext.
      router.push('/produtos');
    }, MIN_BOTAO_PUBLICAR_MS);

    (async () => {
      let fotosFinais: string[];
      try {
        fotosFinais = await Promise.all(
          fotos.map(async (foto) => {
            if (!foto.startsWith('blob:')) return foto;
            const res  = await fetch(foto);
            const blob = await res.blob();
            const file = new File([blob], `foto.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
            const { url, error } = await uploadImage(BUCKETS.produtos, file, lojaId);
            if (error || !url) throw new Error(error ?? 'Não foi possível enviar uma das imagens.');
            return url;
          })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível enviar uma das imagens.';
        failPublish(tempId, message);
        show(message, 'error');
        return;
      }

      const payload = {
        loja_id:    lojaId,
        nome:       nome.trim(),
        preco:      Number(preco),
        preco_promo: precoPromo ? Number(precoPromo) : null,
        categoria,
        descricao:  descricao.trim() || null,
        genero,
        fotos:      fotosFinais,
        variantes:  hasVariants
          ? {
              raiz:  variantes.raiz,
              filha: variantes.filha,
              neta:  variantes.neta,
              versoes: variantes.versoes,
              imagensPorCaracteristica: variantes.imagensPorCaracteristica,
            }
          : null,
        estoque,
        mais_opcoes: Object.values(maisOpcoesFinal).some((v) => v !== undefined && v !== null && v !== '')
          ? maisOpcoesFinal
          : null,
        ativo: true,
      };

      const res = await createProduto(payload);
      if (!res.ok) {
        failPublish(tempId, res.error ?? 'Não foi possível guardar o produto.');
        show(res.error ?? 'Não foi possível guardar o produto.', 'error');
        return;
      }
      resolvePublish(tempId, { produtoId: res.id ?? '', foto: fotosFinais[0] });
    })();
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6 pb-4">

      {/* ── 1. Imagens — sem cartão externo, a imagem fica logo no topo,
          é a primeira associação que o lojista faz com o produto. Só a
          área de upload em si tem contorno tracejado; a secção não. ── */}
      <div ref={fotosSectionRef} className="flex flex-col gap-3">
        <h2 className="pl-0.5 text-[13.5px] font-semibold tracking-[0.01em] text-[#3F3F46]">
          Imagens
        </h2>
        <PhotoUploader photos={fotos} onChange={setFotos} lojaId={lojaId} error={showErrors && !fotosValidas} />
      </div>

      {/* ── 2–4. Nome, Descrição, Categoria — sem título de cartão: os
          campos já se autoexplicam, o título só ocupava espaço. ── */}
      <FormSection>
        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Nome" />
          <Input
            ref={nomeInputRef}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Camisola de linho bege"
            error={showErrors && !nomeValido ? 'Campo obrigatório' : undefined}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Descrição" optional />
          <Textarea
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreve o produto…"
          />
        </div>

        <div ref={categoriaRef}>
          <CategoryPicker value={categoria} onChange={setCategoria} error={showErrors && !categoriaValida} />
        </div>
      </FormSection>

      {/* ── 5. Preço ── */}
      <FormSection title="Preço">
        {/* Preço principal — destaque visual */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Preço regular" />
          <div className="relative">
            <Input
              ref={precoInputRef}
              type="number"
              min={0}
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0"
              error={showErrors && !precoValido ? 'Campo obrigatório' : undefined}
              className="text-[17px] font-extrabold tracking-tight pr-14"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#52525B]">
              MZN
            </span>
          </div>
        </div>

        {/* Preço promocional — secundário */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Preço promocional" optional />
          <div className="relative">
            <Input
              type="number"
              min={0}
              value={precoPromo}
              onChange={(e) => setPrecoPromo(e.target.value)}
              placeholder="0"
              className="pr-14"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#52525B]">
              MZN
            </span>
          </div>
        </div>
      </FormSection>

      {/* ── 6–7. Inventário: Estoque + Peso — duas configurações relacionadas,
          na mesma superfície. Uma divisória subtil entre as duas ajuda aqui
          porque são dois interruptores distintos a partilhar um cartão. */}
      <FormSection title="Inventário">
        <ConfigRow
          title="Controlar stock"
          description={controlarEstoque ? undefined : 'Sem limite de quantidade'}
          checked={controlarEstoque}
          onToggle={setControlarEstoque}
          ariaLabel="Controlar stock"
        >
          {controlarEstoque && !hasVariants && (
            <Input
              type="number"
              min={0}
              value={estoqueSimples}
              onChange={(e) => setEstoqueSimples(e.target.value)}
              placeholder="0"
              label="Quantidade"
            />
          )}
          {controlarEstoque && hasVariants && (
            <p className="text-[12px] font-medium text-[#71717A]">
              Define o stock de cada combinação em &ldquo;Variantes&rdquo;.
            </p>
          )}
        </ConfigRow>

        <div className="h-px bg-[#F0EEEB]" />

        <ConfigRow
          title="Controlar peso"
          checked={controlarPeso}
          onToggle={setControlarPeso}
          ariaLabel="Controlar peso"
        >
          {controlarPeso && (
            <PesoPadraoInput
              valor={pesoPadraoValor}
              unidade={pesoPadraoUnidade}
              onChangeValor={setPesoPadraoValor}
              onChangeUnidade={setPesoPadraoUnidade}
            />
          )}
        </ConfigRow>
      </FormSection>

      {/* ── 8–9. Variantes: Opções do produto + Versões geradas ── */}
      <FormSection title="Variantes">
        <VariantEditor state={variantes} onChange={setVariantes} />

        {/* Só aparece quando já existem valores reais (ex: "Vermelho" em
        "COR") — com a característica criada mas ainda vazia, "versoes"
        continua [] e esta secção fica escondida para não mostrar uma
        caixa vazia sem préço/estoque para preencher. */}
        {variantes.versoes.length > 0 && (
          <>
            <div className="h-px bg-[#F0EEEB]" />
            <StockSection
              raiz={variantes.raiz}
              filha={variantes.filha}
              neta={variantes.neta}
              versoes={variantes.versoes}
              onVersoesChange={(versoes) => setVariantes((v) => ({ ...v, versoes }))}
              controlarEstoque={controlarEstoque}
              controlarPeso={controlarPeso}
              precoBase={Number(preco) || 0}
              pesoPadrao={pesoPadraoKg}
              fotos={fotos}
              onAddFoto={(url) => setFotos((f) => (f.includes(url) ? f : [...f, url]))}
              lojaId={lojaId}
              imagensPorCaracteristica={variantes.imagensPorCaracteristica}
              onChangeImagensCaracteristica={(nomeCaracteristica, valor, urls) =>
                setVariantes((v) => ({
                  ...v,
                  imagensPorCaracteristica: {
                    ...(v.imagensPorCaracteristica ?? {}),
                    [nomeCaracteristica]: {
                      ...(v.imagensPorCaracteristica?.[nomeCaracteristica] ?? {}),
                      [valor]: urls,
                    },
                  },
                }))
              }
            />
          </>
        )}
      </FormSection>

      {/* ── 10. Mais opções ── */}
      <MoreOptions value={maisOpcoes} onChange={setMaisOpcoes} />

      {/* ── 11. Ação ──
      O CTA nunca fica realmente "disabled": parece acinzentado quando
      faltam campos obrigatórios, mas continua clicável — um clique aqui
      dispara sempre a validação atual (toast + campo em erro), em vez de
      simplesmente não fazer nada. */}
      <div className="flex gap-3">
        {produto ? (
          <Button
            type="submit"
            loading={saving}
            className={cn('w-full', !valid && !saving && 'opacity-50 hover:opacity-50')}
          >
            Guardar
          </Button>
        ) : (
          <Button
              type="submit"
              loading={saving}
              className={cn('w-full', !valid && !saving && 'opacity-50 hover:opacity-50')}
            >
              Publicar produto
            </Button>
        )}
      </div>
    </form>

    {/* ── Modal de rascunho pendente ── */}
    {draftPendente && (
      <div
        className="animate-modal-overlay fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
        onClick={handleRejeitarDraft}
      >
        <div
          className="animate-modal-card w-full max-w-sm rounded-[20px] bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ícone */}
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F4F3]">
            <FileEdit size={18} strokeWidth={2} className="text-[#52525B]" />
          </div>

          <h3 className="text-[16px] font-extrabold text-[#111110]">
            Continuar rascunho?
          </h3>
          <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-[#71717A]">
            {draftPendente.nome
              ? <>Tens um produto não finalizado — <span className="font-semibold text-[#3F3F46]">{draftPendente.nome}</span>. Desejas continuar de onde paraste?</>
              : 'Tens um produto não finalizado. Desejas continuar de onde paraste?'
            }
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleAceitarDraft}
              className="w-full rounded-[12px] bg-[#111110] px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#27272A] active:scale-[0.99]"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={handleRejeitarDraft}
              className="w-full rounded-[12px] border border-[#E5E3E0] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#3F3F46] transition-colors hover:bg-[#F4F4F3] active:scale-[0.99]"
            >
              Começar novo
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
