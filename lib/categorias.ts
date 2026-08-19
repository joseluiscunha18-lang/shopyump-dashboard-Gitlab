/**
 * Taxonomia de categorias do Shopyump — gerada a partir de
 * `Shopyump_Taxonomia_Categorias_e_Regras.json` (21 categorias de topo,
 * a maioria com subcategoria e sub-subcategoria; "Outros" e "Serviços"
 * seguem uma forma mais simples, ver `NoTaxonomia` abaixo).
 *
 * Este ficheiro é a fonte única da árvore de categorias usada pelo
 * `CategoryPicker` — a lógica de UX que a taxonomia pede (ver `ui_rules`
 * no JSON de origem) é:
 *   - pesquisa em primeiro lugar, com foco automático ao abrir;
 *   - pesquisa em todos os níveis (categoria, subcategoria, item final),
 *     mostrando sempre o caminho completo no resultado;
 *   - navegação por caminho quando não há pesquisa: Categoria >
 *     Subcategoria > Subcategoria final;
 *   - todas as categorias visíveis, sem cortes nem "ver mais";
 *   - sem ícones — o texto e a hierarquia bastam.
 *
 * `produto.categoria` continua a guardar o caminho todo como texto (ex:
 * "Moda › Calçados › Ténis"), tal como antes — não é preciso nenhuma
 * coluna nova na base de dados.
 */

export const SEPARADOR_CATEGORIA = ' › ';

/** Nó da taxonomia: ou uma lista direta de itens finais (ex: "Outros"),
 *  ou um mapa de subcategoria → itens finais (o caso mais comum). */
export type NoTaxonomia = string[] | Record<string, string[]>;

export const TAXONOMIA_CATEGORIAS: Record<string, string[] | Record<string, string[]>> = {
  'Moda': {
    'Roupas': ['T-shirts', 'Camisas', 'Blusas', 'Polos', 'Vestidos', 'Saias', 'Calças', 'Jeans', 'Shorts', 'Casacos', 'Blazers', 'Fatos e ternos', 'Macacões', 'Roupa interior', 'Pijamas', 'Roupa de praia', 'Roupa desportiva', 'Roupa de trabalho', 'Roupa tradicional'],
    'Calçados': ['Ténis', 'Sapatos', 'Sandálias', 'Chinelos', 'Botas', 'Sapatilhas', 'Mocassins', 'Saltos', 'Calçado infantil', 'Calçado desportivo'],
    'Bolsas e malas': ['Bolsas femininas', 'Bolsas masculinas', 'Mochilas', 'Malas de viagem', 'Carteiras', 'Porta-moedas', 'Malas de mão', 'Bolsas de cintura'],
    'Acessórios de moda': ['Cintos', 'Lenços', 'Cachecóis', 'Chapéus', 'Bonés', 'Óculos de sol', 'Luvas', 'Gravatas', 'Suspensórios'],
    'Joias e bijuterias': ['Anéis', 'Colares', 'Pulseiras', 'Brincos', 'Tornozeleiras', 'Conjuntos'],
    'Relógios': ['Relógios masculinos', 'Relógios femininos', 'Relógios infantis', 'Smartwatches', 'Pulseiras inteligentes'],
    'Moda infantil': ['Bebé', 'Meninas', 'Meninos', 'Uniformes escolares'],
  },
  'Beleza e cuidados pessoais': {
    'Perfumes': ['Perfume feminino', 'Perfume masculino', 'Perfume unissexo', 'Eau de Parfum', 'Eau de Toilette', 'Body splash', 'Óleos perfumados'],
    'Maquilhagem': ['Base', 'Corretivo', 'Pó', 'Blush', 'Batom', 'Gloss', 'Máscara de pestanas', 'Delineador', 'Sombras', 'Iluminador', 'Contorno'],
    'Cabelo': ['Champô', 'Condicionador', 'Máscaras', 'Óleos', 'Cremes', 'Gel', 'Pomadas', 'Tranças', 'Extensões', 'Perucas', 'Apliques', 'Ferramentas de cabelo'],
    'Cuidados da pele': ['Limpeza facial', 'Hidratantes', 'Protetor solar', 'Séruns', 'Esfoliantes', 'Máscaras faciais', 'Cuidados corporais', 'Cuidados dos lábios'],
    'Unhas': ['Esmaltes', 'Gel', 'Unhas postiças', 'Alongamento', 'Acessórios de manicure'],
    'Higiene pessoal': ['Desodorizantes', 'Sabonetes', 'Higiene oral', 'Barbear', 'Depilação', 'Higiene íntima'],
    'Acessórios de beleza': ['Pincéis', 'Espelhos', 'Necessaires', 'Organizadores', 'Esponjas'],
  },
  'Eletrónica': {
    'Áudio': ['Fones de ouvido', 'Headphones', 'Colunas', 'Microfones', 'Áudio profissional', 'Acessórios de áudio'],
    'Televisores e vídeo': ['Televisores', 'Projetores', 'Monitores', 'Leitores multimédia', 'Acessórios de TV'],
    'Câmaras e fotografia': ['Câmaras', 'Lentes', 'Tripés', 'Iluminação', 'Acessórios para câmaras', 'Drones'],
    'Consolas e jogos': ['Consolas', 'Jogos', 'Comandos', 'Acessórios gaming', 'Cadeiras gaming'],
    'Acessórios eletrónicos': ['Cabos', 'Carregadores', 'Adaptadores', 'Baterias', 'Power banks', 'Suportes', 'Hubs', 'Tomadas inteligentes'],
  },
  'Telemóveis e informática': {
    'Telemóveis': ['Smartphones', 'Telefones básicos', 'Telemóveis recondicionados'],
    'Tablets': ['Tablets', 'Capas para tablets', 'Canetas digitais'],
    'Computadores': ['Portáteis', 'Desktops', 'All-in-one', 'Mini PCs'],
    'Componentes': ['Processadores', 'Placas gráficas', 'Memória RAM', 'Discos SSD', 'Discos HDD', 'Placas-mãe', 'Fontes de alimentação', 'Caixas'],
    'Periféricos': ['Teclados', 'Ratos', 'Webcams', 'Monitores', 'Impressoras', 'Scanners', 'Tapetes de rato'],
    'Redes': ['Routers', 'Modems', 'Switches', 'Access points', 'Antenas', 'Cabos de rede'],
  },
  'Casa e decoração': {
    'Móveis': ['Sofás', 'Camas', 'Mesas', 'Cadeiras', 'Armários', 'Estantes', 'Cómodas', 'Secretárias'],
    'Cozinha': ['Panelas', 'Frigideiras', 'Pratos', 'Copos', 'Talheres', 'Utensílios', 'Organização', 'Eletrodomésticos de cozinha'],
    'Quarto': ['Roupa de cama', 'Almofadas', 'Cobertores', 'Edredons', 'Colchões', 'Cortinas'],
    'Casa de banho': ['Toalhas', 'Tapetes', 'Organizadores', 'Acessórios de banho'],
    'Decoração': ['Quadros', 'Espelhos', 'Vasos', 'Relógios de parede', 'Velas', 'Objetos decorativos', 'Tapetes'],
    'Iluminação': ['Lâmpadas', 'Candeeiros', 'Lustres', 'Fitas LED', 'Luzes solares'],
    'Limpeza': ['Produtos de limpeza', 'Vassouras', 'Baldes', 'Esfregonas', 'Organização e armazenamento'],
  },
  'Eletrodomésticos': {
    'Cozinha': ['Frigoríficos', 'Congeladores', 'Fogões', 'Fornos', 'Micro-ondas', 'Liquidificadores', 'Batedeiras', 'Air fryers', 'Máquinas de café', 'Torradeiras', 'Fritadeiras'],
    'Lavandaria': ['Máquinas de lavar', 'Secadoras', 'Ferros de engomar'],
    'Climatização': ['Ar condicionado', 'Ventoinhas', 'Aquecedores', 'Desumidificadores'],
    'Cuidados pessoais': ['Secadores', 'Modeladores', 'Máquinas de barbear', 'Escovas elétricas'],
  },
  'Alimentação e bebidas': {
    'Alimentos': ['Arroz', 'Massas', 'Cereais', 'Farinha', 'Açúcar', 'Óleo e azeite', 'Enlatados', 'Molhos', 'Temperos', 'Snacks', 'Chocolates', 'Doces'],
    'Padaria e pastelaria': ['Pão', 'Bolos', 'Cupcakes', 'Biscoitos', 'Pastéis', 'Doces'],
    'Bebidas': ['Água', 'Sumos', 'Refrigerantes', 'Café', 'Chá', 'Bebidas energéticas', 'Bebidas alcoólicas'],
    'Produtos frescos': ['Frutas', 'Legumes', 'Carnes', 'Peixe e marisco', 'Laticínios', 'Ovos'],
    'Alimentação preparada': ['Pratos preparados', 'Fast food', 'Comida tradicional', 'Catering'],
  },
  'Desporto e fitness': {
    'Fitness': ['Pesos', 'Halteres', 'Elásticos', 'Tapetes de exercício', 'Equipamentos de ginásio'],
    'Futebol': ['Bolas', 'Chuteiras', 'Equipamentos', 'Luvas de guarda-redes', 'Acessórios'],
    'Corrida': ['Ténis de corrida', 'Roupa', 'Acessórios', 'Relógios desportivos'],
    'Ciclismo': ['Bicicletas', 'Capacetes', 'Peças', 'Acessórios', 'Roupa'],
    'Desportos de combate': ['Boxe', 'Artes marciais', 'Luvas', 'Proteções'],
    'Desportos aquáticos': ['Natação', 'Mergulho', 'Surf', 'Acessórios'],
  },
  'Bebés e crianças': {
    'Roupas de bebé': ['Bodies', 'Conjuntos', 'Pijamas', 'Casacos', 'Calçados'],
    'Alimentação': ['Biberões', 'Chupetas', 'Pratos', 'Talheres', 'Cadeiras de alimentação'],
    'Higiene': ['Fraldas', 'Toalhitas', 'Banho', 'Cuidados pessoais'],
    'Carrinhos e transporte': ['Carrinhos', 'Cadeiras auto', 'Mochilas porta-bebé'],
    'Brinquedos': ['Educativos', 'Bonecas', 'Carros', 'Jogos', 'Peluches'],
  },
  'Brinquedos e jogos': {
    'Brinquedos': ['Bonecas', 'Carros', 'Figuras', 'Peluches', 'Construção', 'Educativos'],
    'Jogos': ['Jogos de tabuleiro', 'Cartas', 'Puzzles', 'Jogos eletrónicos'],
    'Hobbies': ['Colecionáveis', 'Modelismo', 'Artes e criatividade'],
  },
  'Automóveis e motociclos': {
    'Automóveis': ['Peças', 'Pneus', 'Jantes', 'Óleos e fluidos', 'Acessórios', 'Som automóvel', 'Ferramentas'],
    'Motociclos': ['Peças', 'Pneus', 'Capacetes', 'Luvas', 'Acessórios', 'Equipamento'],
    'Limpeza e manutenção': ['Lavagem', 'Polimento', 'Produtos de manutenção', 'Ferramentas'],
  },
  'Ferramentas, construção e jardim': {
    'Ferramentas manuais': ['Martelos', 'Chaves', 'Alicates', 'Serras', 'Fitas métricas', 'Ferramentas de corte'],
    'Ferramentas elétricas': ['Berbequins', 'Rebarbadoras', 'Serras elétricas', 'Lixadoras', 'Parafusadoras'],
    'Construção': ['Materiais', 'Tintas', 'Cimentos', 'Ferragens', 'Colas e adesivos', 'Equipamentos de proteção'],
    'Jardim': ['Sementes', 'Vasos', 'Ferramentas de jardim', 'Irrigação', 'Adubos', 'Plantas'],
    'Energia': ['Painéis solares', 'Inversores', 'Baterias', 'Geradores', 'Lâmpadas'],
  },
  'Saúde e bem-estar': {
    'Cuidados pessoais': ['Termómetros', 'Balanças', 'Massajadores', 'Apoios e ortopedia'],
    'Fitness e bem-estar': ['Yoga', 'Relaxamento', 'Massagem', 'Sono'],
    'Equipamentos de saúde': ['Tensiómetros', 'Oxímetros', 'Nebulizadores', 'Equipamentos de monitorização'],
    'Suplementos': ['Vitaminas', 'Proteínas', 'Minerais', 'Suplementos desportivos'],
  },
  'Animais de estimação': {
    'Cães': ['Alimentação', 'Brinquedos', 'Coleiras e trelas', 'Camas', 'Higiene'],
    'Gatos': ['Alimentação', 'Areia', 'Brinquedos', 'Arranhadores', 'Camas'],
    'Aves': ['Alimentação', 'Gaiolas', 'Acessórios'],
    'Peixes': ['Aquários', 'Alimentação', 'Filtros', 'Decoração'],
    'Outros animais': ['Alimentação', 'Acessórios', 'Higiene'],
  },
  'Livros, papelaria e escritório': {
    'Livros': ['Ficção', 'Educação', 'Infantil', 'Religião', 'Negócios', 'Tecnologia'],
    'Papelaria': ['Cadernos', 'Canetas', 'Lápis', 'Marcadores', 'Papel', 'Agendas'],
    'Material escolar': ['Mochilas', 'Estojos', 'Material de desenho', 'Calculadoras'],
    'Escritório': ['Impressoras', 'Organização', 'Mobiliário', 'Material de escritório'],
  },
  'Música e instrumentos': {
    'Instrumentos': ['Guitarras', 'Baixos', 'Teclados', 'Pianos', 'Baterias', 'Percussão', 'Instrumentos de sopro'],
    'Equipamento de áudio': ['Amplificadores', 'Mesas de mistura', 'Microfones', 'Colunas', 'Cabos'],
    'Acessórios': ['Cordas', 'Palhetas', 'Suportes', 'Capas', 'Afinadores'],
  },
  'Arte, artesanato e festas': {
    'Arte': ['Pintura', 'Desenho', 'Tela', 'Pincéis', 'Materiais artísticos'],
    'Artesanato': ['Tecidos', 'Fios', 'Contas', 'Materiais DIY', 'Ferramentas'],
    'Festas': ['Decoração', 'Balões', 'Convites', 'Lembranças', 'Artigos para festas'],
    'Presentes': ['Cestas', 'Personalizados', 'Cartões', 'Embalagens'],
  },
  'Viagem e utilidades': {
    'Viagem': ['Malas', 'Mochilas', 'Necessaires', 'Organizadores', 'Acessórios de viagem'],
    'Organização': ['Caixas', 'Cestos', 'Organizadores', 'Armazenamento'],
    'Utilidades': ['Garrafas', 'Canecas', 'Lanternas', 'Produtos reutilizáveis'],
  },
  'Produtos digitais': {
    'Software': ['Aplicações', 'Templates', 'Plugins', 'Licenças'],
    'Conteúdo digital': ['E-books', 'Cursos', 'Fotografias', 'Vídeos', 'Música', 'Designs'],
    'Serviços digitais': ['Consultoria', 'Design', 'Marketing', 'Programação'],
  },
  'Serviços': {
    'Beleza': ['Cabeleireiro', 'Barbearia', 'Manicure', 'Estética'],
    'Casa': ['Limpeza', 'Manutenção', 'Jardinagem'],
    'Tecnologia': ['Reparação', 'Instalação', 'Suporte'],
    'Eventos': ['Fotografia', 'Vídeo', 'Catering', 'Decoração'],
    'Educação': ['Aulas', 'Tutoria', 'Cursos'],
  },
  'Outros': ['Produtos diversos', 'Produtos personalizados', 'Produtos artesanais', 'Categoria não encontrada'],
};

/** Categorias de topo, pela ordem definida na taxonomia. */
export const CATEGORIAS_TOPO: string[] = Object.keys(TAXONOMIA_CATEGORIAS);

/** Uma categoria "folha" pesquisável — o nível mais específico que o
 *  lojista pode escolher, com o caminho completo até lá. */
export interface CategoriaFolha {
  /** Segmentos do caminho, ex: ['Moda', 'Calçados', 'Ténis']. Para nós
   *  do tipo lista simples (ex: "Outros") tem só 2 segmentos. */
  caminho: string[];
  /** Caminho pronto a guardar em `produto.categoria`, ex: "Moda › Calçados › Ténis". */
  texto: string;
  /** Categoria de topo — usada para agrupar resultados de pesquisa. */
  topo: string;
  /** Versão em minúsculas e sem acentos, para pesquisa tolerante a acentuação. */
  chaveBusca: string;
}

/** Remove acentos para a pesquisa não depender de o vendedor escrever
 *  "eletronica" vs "eletrónica" — ambos têm de encontrar a categoria. */
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function construirFolhas(): CategoriaFolha[] {
  const folhas: CategoriaFolha[] = [];

  for (const topo of CATEGORIAS_TOPO) {
    const no = TAXONOMIA_CATEGORIAS[topo];

    if (Array.isArray(no)) {
      // Nó simples: topo → item final diretamente (ex: "Outros").
      for (const item of no) {
        const caminho = [topo, item];
        folhas.push({
          caminho,
          texto: caminho.join(SEPARADOR_CATEGORIA),
          topo,
          chaveBusca: normalizar(caminho.join(' ')),
        });
      }
      continue;
    }

    // Nó normal: topo → subcategoria → itens finais.
    for (const [sub, itens] of Object.entries(no)) {
      for (const item of itens) {
        const caminho = [topo, sub, item];
        folhas.push({
          caminho,
          texto: caminho.join(SEPARADOR_CATEGORIA),
          topo,
          chaveBusca: normalizar(caminho.join(' ')),
        });
      }
    }
  }

  return folhas;
}

/** Todas as categorias finais, já achatadas — usado pela pesquisa
 *  ("search_all_levels" + "show_full_path_in_results" da taxonomia). */
export const TODAS_CATEGORIAS: CategoriaFolha[] = construirFolhas();

/** Subcategorias (nível 2) disponíveis para uma categoria de topo — vazio
 *  para nós do tipo lista simples (ex: "Outros"), que não têm nível 2. */
export function subcategoriasDe(topo: string): string[] {
  const no = TAXONOMIA_CATEGORIAS[topo];
  if (!no || Array.isArray(no)) return [];
  return Object.keys(no);
}

/** Itens finais (nível 3, ou nível 2 quando o nó de topo é uma lista
 *  simples) para um caminho já escolhido. */
export function itensDe(topo: string, sub?: string): string[] {
  const no = TAXONOMIA_CATEGORIAS[topo];
  if (!no) return [];
  if (Array.isArray(no)) return no;
  if (!sub) return [];
  return no[sub] ?? [];
}

/**
 * Pesquisa em todos os níveis da taxonomia (categoria, subcategoria e
 * item final) e devolve categorias finais cujo caminho completo contém o
 * termo — é isso que permite escrever "ténis" e encontrar
 * "Moda › Calçados › Ténis", ou escrever "moda" e ver todas as categorias
 * de Moda. Sem limite de resultados ("limit_visible_categories": false).
 */
export function buscarCategorias(termo: string): CategoriaFolha[] {
  const chave = normalizar(termo);
  if (!chave) return [];
  return TODAS_CATEGORIAS.filter((c) => c.chaveBusca.includes(chave));
}

/** Divide "Moda › Calçados › Ténis" em ['Moda', 'Calçados', 'Ténis'] —
 *  tolera categorias antigas gravadas sem o separador (caem só no nome). */
export function segmentosCategoria(categoria: string | null | undefined): string[] {
  return (categoria ?? '')
    .split(SEPARADOR_CATEGORIA)
    .map((s) => s.trim())
    .filter(Boolean);
}
