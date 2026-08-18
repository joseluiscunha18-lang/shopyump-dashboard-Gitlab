import { TAMANHOS_CALCADO, TAMANHOS_LETRA, TAMANHOS_NUMERO } from '@/lib/sugestoesOpcao';
import { CARACTERISTICAS_SUGERIDAS } from '@/types/database';

/**
 * Motor de sugestões contextuais: em vez de uma biblioteca única e genérica
 * de características ("Cor, Tamanho, Material, Capacidade, Género" sempre,
 * para qualquer produto), este ficheiro guarda, por categoria e
 * subcategoria, quais características costumam fazer sentido — e com que
 * valores. Ninguém é obrigado a nada disto: são só as primeiras opções que
 * o lojista vê; "+ Adicionar outra característica" continua a dar acesso a
 * tudo (ver `TODAS_AS_CARACTERISTICAS` no fim).
 *
 * `produto.categoria` guarda o caminho todo como texto, ex:
 * "Moda › Calçados › Ténis" — assim não é preciso nenhuma coluna nova na
 * base de dados, e categorias antigas gravadas só com "Moda" continuam
 * válidas (caem no nó de topo, sem sub-refinamento).
 */
export const SEPARADOR_CATEGORIA = ' › ';

export interface CaracteristicaContextual {
  nome: string;
  /** Só decide a ORDEM em que aparece (recomendadas primeiro) — nunca
   *  impede o lojista de escolher uma "opcional" ou uma característica
   *  completamente fora da lista. */
  recomendado: boolean;
  valoresSugeridos?: string[];
}

interface NoCategoria {
  caracteristicas: CaracteristicaContextual[];
  filhas?: Record<string, NoCategoria>;
}

const ARMAZENAMENTO = ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];
const RAM = ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'];
const VOLUME_PERFUME = ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml'];

const r = (nome: string, recomendado: boolean, valoresSugeridos?: string[]): CaracteristicaContextual => ({
  nome,
  recomendado,
  valoresSugeridos,
});

/**
 * Árvore de categorias → subcategorias. As chaves de topo espelham as
 * mesmas usadas em `CategoryPicker` (Moda, Beleza, Casa, Eletrónica,
 * Acessórios, Alimentação) — adicionar aqui uma nova subcategoria não
 * exige tocar em mais nenhum ficheiro além deste, é só acrescentar uma
 * entrada.
 */
const ARVORE: Record<string, NoCategoria> = {
  Moda: {
    caracteristicas: [r('Tamanho', true, TAMANHOS_LETRA), r('Cor', true), r('Material', false), r('Género', false)],
    filhas: {
      Camisas: {
        caracteristicas: [
          r('Tamanho', true, TAMANHOS_LETRA),
          r('Cor', true),
          r('Material', false),
          r('Género', false),
          r('Corte', false, ['Slim', 'Regular', 'Oversized']),
        ],
      },
      'T-shirts': {
        caracteristicas: [r('Tamanho', true, TAMANHOS_LETRA), r('Cor', true), r('Material', false), r('Género', false)],
      },
      Calças: {
        caracteristicas: [
          r('Tamanho', true, TAMANHOS_NUMERO),
          r('Cor', true),
          r('Material', false),
          r('Género', false),
          r('Corte', false, ['Skinny', 'Reto', 'Largo', 'Cargo']),
        ],
      },
      Vestidos: {
        caracteristicas: [
          r('Tamanho', true, TAMANHOS_LETRA),
          r('Cor', true),
          r('Comprimento', false, ['Curto', 'Midi', 'Longo']),
          r('Material', false),
          r('Género', false),
        ],
      },
      Calçados: {
        caracteristicas: [r('Tamanho', true, TAMANHOS_CALCADO), r('Cor', true), r('Material', false), r('Género', false)],
        filhas: {
          Ténis: {
            caracteristicas: [r('Tamanho', true, TAMANHOS_CALCADO), r('Cor', true), r('Material', false), r('Género', false)],
          },
          Sandálias: {
            caracteristicas: [
              r('Tamanho', true, TAMANHOS_CALCADO),
              r('Cor', true),
              r('Material', false),
              r('Género', false),
              r('Estilo', false, ['Rasteira', 'Salto', 'Anabela', 'Plataforma']),
            ],
          },
          Botas: {
            caracteristicas: [r('Tamanho', true, TAMANHOS_CALCADO), r('Cor', true), r('Material', false), r('Género', false)],
          },
        },
      },
      Acessórios: {
        caracteristicas: [r('Cor', true), r('Tamanho', false, TAMANHOS_LETRA), r('Material', false)],
      },
    },
  },

  Beleza: {
    caracteristicas: [r('Volume', true, VOLUME_PERFUME), r('Tipo', false), r('Cor', false)],
    filhas: {
      Perfumes: {
        caracteristicas: [r('Volume', true, VOLUME_PERFUME), r('Fragrância', true), r('Género', false), r('Tipo', false, ['Eau de Parfum', 'Eau de Toilette', 'Colónia'])],
      },
      Maquilhagem: {
        caracteristicas: [r('Cor', true), r('Tom', false), r('Volume', false, ['5 ml', '10 ml', '15 ml', '30 ml'])],
      },
      'Cuidados de pele': {
        caracteristicas: [r('Volume', true, ['30 ml', '50 ml', '100 ml', '200 ml', '250 ml']), r('Tipo de pele', false, ['Normal', 'Oleosa', 'Seca', 'Mista'])],
      },
    },
  },

  Eletrónica: {
    caracteristicas: [r('Cor', true), r('Modelo', false)],
    filhas: {
      Smartphones: {
        caracteristicas: [r('Cor', true), r('Armazenamento', true, ARMAZENAMENTO), r('RAM', false, RAM), r('Modelo', false)],
      },
      Computadores: {
        caracteristicas: [r('Processador', true), r('RAM', true, RAM), r('Armazenamento', false, ARMAZENAMENTO), r('Cor', false)],
      },
      'Auscultadores': {
        caracteristicas: [r('Cor', true), r('Modelo', false)],
      },
      Acessórios: {
        caracteristicas: [r('Cor', true), r('Modelo', false), r('Compatibilidade', false)],
      },
    },
  },

  Casa: {
    caracteristicas: [r('Cor', true), r('Material', false), r('Tamanho', false)],
    filhas: {
      Móveis: {
        caracteristicas: [r('Cor', true), r('Material', true), r('Tamanho', false)],
        filhas: {
          Sofás: {
            caracteristicas: [r('Cor', true), r('Material', true), r('Número de lugares', true, ['2 lugares', '3 lugares', '4 lugares', 'Canto']), r('Tamanho', false)],
          },
          Mesas: {
            caracteristicas: [r('Cor', true), r('Material', true), r('Tamanho', false, ['Pequena', 'Média', 'Grande'])],
          },
        },
      },
      'Cama, mesa e banho': {
        caracteristicas: [r('Cor', true), r('Tamanho', true, ['Solteiro', 'Casal', 'Queen', 'King']), r('Material', false)],
      },
      Decoração: {
        caracteristicas: [r('Cor', true), r('Material', false), r('Tamanho', false)],
      },
    },
  },

  Acessórios: {
    caracteristicas: [r('Cor', true), r('Material', false), r('Tamanho', false)],
    filhas: {
      Bolsas: { caracteristicas: [r('Cor', true), r('Material', true), r('Tamanho', false, ['Pequena', 'Média', 'Grande'])] },
      Joias: { caracteristicas: [r('Material', true), r('Cor', false), r('Tamanho', false)] },
      Óculos: { caracteristicas: [r('Cor', true), r('Material', false)] },
    },
  },

  Alimentação: {
    caracteristicas: [r('Sabor', false), r('Peso', false, ['250g', '500g', '1kg', '2kg'])],
  },

  /** Sem características típicas — sempre cai no fallback genérico dentro
   *  de `caracteristicasSugeridasPara()`, mas precisa de existir aqui para
   *  aparecer como opção clicável no primeiro passo do CategoryPicker. */
  Outros: {
    caracteristicas: [],
  },
};

/** Divide "Moda › Calçados › Ténis" em ['Moda', 'Calçados', 'Ténis'] — tolera categorias antigas sem separador. */
export function segmentosCategoria(categoria: string | null | undefined): string[] {
  return (categoria ?? '').split(SEPARADOR_CATEGORIA).map((s) => s.trim()).filter(Boolean);
}

/** Percorre a árvore ao longo do caminho e devolve todos os nós visitados
 *  (do mais genérico ao mais específico) — segmentos que não têm match
 *  (ex: "Outra categoria" escrita à mão) simplesmente param a descida ali,
 *  sem dar erro. */
function nosDoCaminho(caminho: string[]): NoCategoria[] {
  const nos: NoCategoria[] = [];
  let nivel = ARVORE;
  for (const segmento of caminho) {
    const no = nivel[segmento];
    if (!no) break;
    nos.push(no);
    nivel = no.filhas ?? {};
  }
  return nos;
}

/**
 * Características sugeridas para o caminho de categoria mais específico
 * disponível — junta o nó mais fundo encontrado com os ancestrais (uma
 * subcategoria herda, por exemplo, "Cor" da categoria-mãe mesmo que não a
 * repita explicitamente), sem duplicar nomes, e ordena recomendadas antes
 * de opcionais. Sem categoria nenhuma (ou sem match), cai na lista
 * genérica antiga — nunca fica vazio.
 */
export function caracteristicasSugeridasPara(categoria: string | null | undefined): CaracteristicaContextual[] {
  const nos = nosDoCaminho(segmentosCategoria(categoria));
  if (nos.length === 0) {
    return CARACTERISTICAS_SUGERIDAS.map((nome) => r(nome, true));
  }

  const vistas = new Set<string>();
  const resultado: CaracteristicaContextual[] = [];
  // Do mais específico para o mais genérico, para a versão "mais afinada"
  // de cada nome (ex: Tamanho com TAMANHOS_CALCADO em vez do genérico) ganhar.
  for (let i = nos.length - 1; i >= 0; i--) {
    for (const c of nos[i].caracteristicas) {
      if (vistas.has(c.nome)) continue;
      vistas.add(c.nome);
      resultado.push(c);
    }
  }
  // Categoria mapeada mas sem características próprias (ex: "Outros") —
  // mesma rede de segurança do caso "sem categoria nenhuma".
  if (resultado.length === 0) {
    return CARACTERISTICAS_SUGERIDAS.map((nome) => r(nome, true));
  }
  return resultado.sort((a, b) => Number(b.recomendado) - Number(a.recomendado));
}

/** Valores sugeridos para uma característica dentro do contexto da
 *  categoria — usado em vez do genérico `sugestoesParaCaracteristica()`
 *  sempre que a categoria tiver uma lista mais específica (ex: Tamanho em
 *  "Moda › Calçados" usa números de calçado, não P/M/G). Devolve
 *  `undefined` quando não há override — quem chama cai então para a
 *  sugestão genérica por nome. */
export function valoresSugeridosContextual(categoria: string | null | undefined, nomeCaracteristica: string): string[] | undefined {
  const alvo = nomeCaracteristica.trim().toLowerCase();
  const nos = nosDoCaminho(segmentosCategoria(categoria));
  for (let i = nos.length - 1; i >= 0; i--) {
    const match = nos[i].caracteristicas.find((c) => c.nome.toLowerCase() === alvo);
    if (match?.valoresSugeridos) return match.valoresSugeridos;
  }
  return undefined;
}

/** Subcategorias disponíveis para um caminho já escolhido — usado pelo
 *  CategoryPicker para saber que lista mostrar no passo seguinte. Vazio
 *  quando a categoria não tem subcategorias mapeadas (ex: "Outros"). */
export function subcategoriasDe(caminho: string[]): string[] {
  const nos = nosDoCaminho(caminho);
  const ultimo = nos[nos.length - 1];
  const nivel = caminho.length === 0 ? ARVORE : ultimo?.filhas;
  return nivel ? Object.keys(nivel) : [];
}

/**
 * Biblioteca ampla de nomes de característica para a pesquisa de "+
 * Adicionar outra característica" — junta tudo o que está mapeado em
 * qualquer categoria (para nunca faltar nada já conhecido do sistema) com
 * a lista genérica antiga, sem repetir.
 */
export const TODAS_AS_CARACTERISTICAS: string[] = (() => {
  const nomes = new Set<string>(CARACTERISTICAS_SUGERIDAS);
  function visitar(no: NoCategoria) {
    for (const c of no.caracteristicas) nomes.add(c.nome);
    if (no.filhas) Object.values(no.filhas).forEach(visitar);
  }
  Object.values(ARVORE).forEach(visitar);
  return Array.from(nomes).sort((a, b) => a.localeCompare(b, 'pt'));
})();
