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
    'Roupas': ['T-shirts', 'Camisas', 'Blusas', 'Polos', 'Vestidos', 'Saias', 'Calças', 'Jeans', 'Shorts', 'Casacos', 'Blazers', 'Fatos e ternos', 'Macacões', 'Roupa interior', 'Pijamas', 'Roupa de praia', 'Roupa desportiva', 'Roupa de trabalho', 'Roupa tradicional', 'Roupa formal', 'Roupa casual', 'Roupa de dormir', 'Roupa plus size', 'Roupa de maternidade', 'Roupa religiosa', 'Fantasias e trajes'],
    'Calçados': ['Ténis', 'Sapatos', 'Sandálias', 'Chinelos', 'Botas', 'Sapatilhas', 'Mocassins', 'Saltos', 'Calçado infantil', 'Calçado desportivo'],
    'Bolsas e malas': ['Bolsas femininas', 'Bolsas masculinas', 'Mochilas', 'Malas de viagem', 'Carteiras', 'Porta-moedas', 'Malas de mão', 'Bolsas de cintura'],
    'Acessórios de moda': ['Cintos', 'Lenços', 'Cachecóis', 'Chapéus', 'Bonés', 'Óculos de sol', 'Óculos graduados', 'Luvas', 'Gravatas', 'Suspensórios', 'Acessórios para cabelo', 'Acessórios para relógios', 'Artigos de couro'],
    'Joias e bijuterias': ['Anéis', 'Colares', 'Pulseiras', 'Brincos', 'Tornozeleiras', 'Conjuntos'],
    'Relógios': ['Relógios masculinos', 'Relógios femininos', 'Relógios infantis', 'Smartwatches', 'Pulseiras inteligentes'],
    'Moda infantil': ['Bebé recém-nascido', 'Meninas', 'Meninos', 'Uniformes escolares', 'Uniformes'],
  },
  'Beleza e cuidados pessoais': {
    'Perfumes': ['Perfume feminino', 'Perfume masculino', 'Perfume unissexo', 'Eau de Parfum', 'Eau de Toilette', 'Body splash', 'Óleos perfumados'],
    'Maquilhagem': ['Base', 'Corretivo', 'Pó', 'Blush', 'Batom', 'Gloss', 'Máscara de pestanas', 'Delineador', 'Sombras', 'Iluminador', 'Contorno'],
    'Cabelo': ['Champô', 'Condicionador', 'Máscaras', 'Óleos', 'Cremes', 'Gel', 'Pomadas', 'Tranças', 'Extensões', 'Perucas', 'Apliques', 'Ferramentas de cabelo'],
    'Cuidados da pele': ['Limpeza facial', 'Hidratantes', 'Protetor solar', 'Séruns', 'Esfoliantes', 'Máscaras faciais', 'Cuidados corporais', 'Cuidados dos lábios'],
    'Unhas': ['Esmaltes', 'Gel', 'Unhas postiças', 'Alongamento', 'Acessórios de manicure'],
    'Higiene pessoal': ['Desodorizantes', 'Sabonetes', 'Higiene oral', 'Barbear', 'Depilação', 'Higiene íntima', 'Higiene feminina', 'Cuidados masculinos'],
    'Acessórios de beleza': ['Pincéis', 'Espelhos', 'Necessaires', 'Organizadores', 'Esponjas', 'Acessórios para maquilhagem'],
    'Cuidados para mãos e pés': ['Cuidados para mãos', 'Cuidados para pés', 'Máscaras para mãos', 'Hidratantes para pés'],
    'Produtos profissionais': ['Equipamentos de salão', 'Produtos de salão', 'Produtos para cabelo profissional', 'Produtos para cabelos naturais', 'Produtos para cabelos com textura', 'Produtos para cachos'],
    'Perfumes para ambiente': ['Difusores', 'Velas perfumadas', 'Sprays de ambiente', 'Incenso'],
  },
  'Eletrónica': {
    'Áudio': ['Fones de ouvido', 'Headphones', 'Colunas', 'Microfones', 'Áudio profissional', 'Acessórios de áudio'],
    'Televisores e vídeo': ['Televisores', 'Projetores', 'Monitores', 'Leitores multimédia', 'Acessórios de TV'],
    'Câmaras e fotografia': ['Câmaras', 'Lentes', 'Tripés', 'Iluminação', 'Acessórios para câmaras', 'Drones'],
    'Consolas e jogos': ['Consolas', 'Jogos', 'Comandos', 'Acessórios gaming', 'Cadeiras gaming'],
    'Acessórios eletrónicos': ['Cabos', 'Carregadores', 'Adaptadores', 'Baterias', 'Power banks', 'Suportes', 'Hubs', 'Tomadas inteligentes', 'Carregamento sem fios', 'Armazenamento externo', 'UPS e no-break', 'Leitores de cartões'],
    'Acessórios para telemóveis': ['Capas', 'Películas', 'Suportes para telemóvel', 'Carregadores de telemóvel', 'Acessórios diversos'],
    'Smart home': ['Tomadas inteligentes', 'Lâmpadas inteligentes', 'Assistentes de voz', 'Termostatos inteligentes', 'Fechaduras inteligentes', 'Campaínhas inteligentes'],
    'Segurança eletrónica': ['Câmaras de segurança', 'Alarmes', 'Videoporteiros', 'Fechaduras inteligentes', 'Rastreadores GPS', 'Gravadores de vídeo'],
    'Dispositivos de streaming': ['Chromecast', 'Fire TV', 'Apple TV', 'Leitores multimédia'],
    'Equipamentos POS': ['Terminais de pagamento', 'Impressoras de talão', 'Leitores de código de barras', 'Caixas registadoras'],
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
    'Organização da casa': ['Caixas de arrumação', 'Organizadores de gaveta', 'Cabides', 'Prateleiras', 'Cestos'],
    'Lavandaria': ['Detergentes', 'Amaciadores', 'Cestos de roupa', 'Estendedores', 'Sacos de lavandaria'],
    'Segurança doméstica': ['Detetores de fumo', 'Extintores', 'Câmaras', 'Fechaduras', 'Cofres'],
    'Bar e bebidas': ['Coqueteleiras', 'Abridores', 'Copos especializados', 'Acessórios de bar', 'Garrafeiras'],
    'Churrasco': ['Grelhadores', 'Carvão', 'Acessórios de churrasco', 'Espetos', 'Termómetros de carne'],
    'Decoração de exterior': ['Mobiliário de exterior', 'Plantas artificiais', 'Luzes de jardim', 'Fontes', 'Vasos de exterior'],
    'Mobiliário de escritório': ['Secretárias', 'Cadeiras de escritório', 'Estantes', 'Armários de arquivo'],
    'Produtos para bebé em casa': ['Banheiras', 'Monitores de bebé', 'Humidificadores', 'Aquecedores', 'Proteções'],
    'Produtos para animais': ['Camas para animais', 'Comedouros', 'Bebedouros', 'Cercas', 'Arranhadores'],
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
    'Produtos especiais': ['Orgânicos', 'Sem glúten', 'Sem açúcar', 'Vegetarianos e veganos', 'Gourmet', 'Importados', 'Naturais'],
    'Produtos congelados': ['Carnes congeladas', 'Peixe congelado', 'Legumes congelados', 'Refeições congeladas', 'Gelados'],
    'Confeitaria e pastelaria': ['Ingredientes para pastelaria', 'Farinhas especiais', 'Chocolates de culinária', 'Corantes e aromas', 'Formas e utensílios'],
    'Frutos secos e sementes': ['Amendoins', 'Cajus', 'Nozes', 'Sementes de girassol', 'Sementes de abóbora', 'Cereais'],
    'Produtos naturais': ['Mel', 'Compotas', 'Geleia', 'Produtos apícolas', 'Produtos da terra'],
    'Café e chá': ['Café em grão', 'Café moído', 'Café solúvel', 'Cápsulas', 'Chás e infusões', 'Acessórios para café'],
    'Alimentação para bebé': ['Papas', 'Purés', 'Sumos infantis', 'Snacks infantis', 'Leite em pó'],
  },
  'Desporto e fitness': {
    'Fitness': ['Pesos', 'Halteres', 'Elásticos', 'Tapetes de exercício', 'Equipamentos de ginásio'],
    'Futebol': ['Bolas', 'Chuteiras', 'Equipamentos', 'Luvas de guarda-redes', 'Acessórios'],
    'Corrida': ['Ténis de corrida', 'Roupa', 'Acessórios', 'Relógios desportivos'],
    'Ciclismo': ['Bicicletas', 'Capacetes', 'Peças', 'Acessórios', 'Roupa'],
    'Desportos de combate': ['Boxe', 'Artes marciais', 'Luvas', 'Proteções'],
    'Desportos aquáticos': ['Natação', 'Mergulho', 'Surf', 'Acessórios'],
    'Basquetebol': ['Bolas', 'Equipamentos', 'Calçado', 'Acessórios'],
    'Voleibol': ['Bolas', 'Redes', 'Equipamentos', 'Acessórios'],
    'Ténis e Padel': ['Raquetes de ténis', 'Raquetes de padel', 'Bolas', 'Roupa', 'Calçado', 'Acessórios'],
    'Atletismo': ['Calçado de atletismo', 'Roupa', 'Equipamentos de treino', 'Acessórios'],
    'Pesca': ['Canas de pesca', 'Anzóis', 'Iscos', 'Fatos impermeáveis', 'Acessórios de pesca'],
    'Campismo e montanhismo': ['Tendas', 'Sacos de dormir', 'Mochilas de montanha', 'Calçado de montanha', 'Iluminação', 'Equipamentos de sobrevivência'],
    'Treino em casa': ['Pesos e halteres', 'Barras de pull-up', 'Bancos', 'Tapetes', 'Cordas de saltar', 'Equipamentos multifunções'],
    'Proteção desportiva': ['Capacetes', 'Joelheiras', 'Cotoveleiras', 'Luvas desportivas', 'Protetores', 'Suportes musculares'],
  },
  'Bebés e crianças': {
    'Roupas de bebé': ['Bodies', 'Conjuntos', 'Pijamas', 'Casacos', 'Calçados'],
    'Alimentação': ['Biberões', 'Chupetas', 'Pratos', 'Talheres', 'Cadeiras de alimentação'],
    'Higiene': ['Fraldas', 'Toalhitas', 'Banho', 'Cuidados pessoais'],
    'Carrinhos e transporte': ['Carrinhos', 'Cadeiras auto', 'Mochilas porta-bebé'],
    'Brinquedos': ['Educativos', 'Bonecas', 'Carros', 'Jogos', 'Peluches'],
    'Berços e camas': ['Berços', 'Camas de bebé', 'Colchões de bebé', 'Roupa de cama infantil', 'Grades de proteção'],
    'Mobiliário infantil': ['Cómodas', 'Armários infantis', 'Mesas de muda', 'Cadeiras de baloiço', 'Banheiras'],
    'Amamentação': ['Bombas de leite', 'Discos de amamentação', 'Sutiãs de amamentação', 'Acessórios de amamentação'],
    'Segurança infantil': ['Monitores de bebé', 'Proteções para tomadas', 'Grades de escada', 'Protetores de canto', 'Intercomunicadores'],
    'Calçado infantil': ['Sapatilhas de bebé', 'Botas infantis', 'Sandálias infantis', 'Chinelos infantis'],
    'Material escolar infantil': ['Mochilas infantis', 'Lancheiras', 'Estojos infantis', 'Material de desenho infantil'],
  },
  'Brinquedos e jogos': {
    'Brinquedos': ['Bonecas', 'Carros', 'Figuras', 'Peluches', 'Construção', 'Educativos'],
    'Jogos': ['Jogos de tabuleiro', 'Cartas', 'Puzzles', 'Jogos eletrónicos'],
    'Hobbies': ['Colecionáveis', 'Modelismo', 'Artes e criatividade'],
  },
  'Automóveis e motociclos': {
    'Peças de automóvel': ['Motor', 'Travagem', 'Suspensão', 'Sistema elétrico', 'Iluminação', 'Interior', 'Exterior', 'Escape', 'Transmissão', 'Direção'],
    'Pneus e jantes': ['Pneus de verão', 'Pneus todo-o-terreno', 'Jantes de alumínio', 'Jantes de aço', 'Acessórios de pneus'],
    'Som e eletrónica automóvel': ['Rádios', 'Colunas', 'Amplificadores', 'Câmaras de marcha-atrás', 'GPS', 'Dashcams'],
    'Acessórios automóvel': ['Tapetes', 'Capas para banco', 'Organizadores', 'Suportes', 'Acessórios de segurança'],
    'Ferramentas e lubrificantes': ['Ferramentas auto', 'Óleos de motor', 'Fluidos', 'Lubrificantes', 'Compressores'],
    'Motociclos': ['Peças de moto', 'Pneus de moto', 'Capacetes', 'Luvas de moto', 'Equipamento de moto', 'Iluminação de moto', 'Acessórios de moto'],
    'Limpeza automóvel': ['Lavagem', 'Polimento', 'Ceras', 'Aspiradores auto', 'Produtos de limpeza interior'],
  },
  'Ferramentas, construção e jardim': {
    'Ferramentas manuais': ['Martelos', 'Chaves', 'Alicates', 'Serras', 'Fitas métricas', 'Ferramentas de corte'],
    'Ferramentas elétricas': ['Berbequins', 'Rebarbadoras', 'Serras elétricas', 'Lixadoras', 'Parafusadoras'],
    'Materiais de construção': ['Cimento', 'Areia e agregados', 'Tijolos e blocos', 'Tintas', 'Vernizes', 'Ferragens', 'Colas e adesivos'],
    'Canalização': ['Tubagens', 'Torneiras', 'Sifões', 'Acessórios de canalização', 'Bombas'],
    'Material elétrico': ['Fios e cabos', 'Tomadas', 'Disjuntores', 'Quadros elétricos', 'Interruptores'],
    'Acabamentos': ['Pavimentos', 'Revestimentos', 'Portas e janelas', 'Telhados', 'Isolamento'],
    'Jardim': ['Sementes', 'Vasos', 'Ferramentas de jardim', 'Irrigação', 'Adubos', 'Plantas'],
    'Energia': ['Painéis solares', 'Inversores', 'Baterias', 'Geradores', 'Lâmpadas'],
    'Equipamentos de proteção': ['Capacetes de obra', 'Luvas de proteção', 'Óculos de proteção', 'Botas de segurança', 'Coletes refletores'],
  },
  'Agricultura': {
    'Sementes e plantas': ['Sementes de hortícolas', 'Sementes de cereais', 'Sementes de flores', 'Plantas', 'Mudas'],
    'Fertilizantes e adubos': ['Fertilizantes químicos', 'Fertilizantes orgânicos', 'Adubo foliar', 'Corretores de solo'],
    'Pesticidas e fitossanitários': ['Herbicidas', 'Inseticidas', 'Fungicidas', 'Produtos biológicos'],
    'Ferramentas agrícolas': ['Enxadas', 'Pás', 'Ancilhas', 'Catanas', 'Pulverizadores manuais'],
    'Equipamentos agrícolas': ['Motocultivadores', 'Pulverizadores', 'Ceifeiras', 'Equipamento de rega'],
    'Irrigação': ['Bombas de água', 'Mangueiras', 'Aspersores', 'Sistemas de rega gota a gota', 'Filtros'],
    'Estufas e proteção': ['Estufas', 'Telas de cobertura', 'Tutores', 'Redes de proteção'],
    'Pecuária': ['Alimentação animal', 'Equipamentos para criação', 'Medicamentos veterinários', 'Acessórios'],
    'Horticultura': ['Substratos', 'Vasos de produção', 'Ferramentas de horticultura', 'Iluminação de estufa'],
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
    'Escritório': ['Impressoras', 'Consumíveis de impressão', 'Organização', 'Material de escritório', 'Calculadoras', 'Etiquetadoras'],
    'Equipamentos empresariais': ['Equipamentos POS', 'Terminais de pagamento', 'Cofres', 'Câmaras de segurança', 'Sistemas de alarme'],
    'Mobiliário empresarial': ['Secretárias', 'Cadeiras de escritório', 'Estantes', 'Salas de reunião', 'Receção'],
    'Material de apresentação': ['Quadros brancos', 'Flip charts', 'Projetores', 'Ecrãs de projeção', 'Ponteiros'],
    'Embalagens e logística': ['Caixas de cartão', 'Sacos', 'Fita adesiva', 'Papel de embrulho', 'Etiquetas', 'Material para lojas'],
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
    'Viagem': ['Malas de viagem', 'Mochilas de viagem', 'Necessaires', 'Organizadores de mala', 'Cadeados de viagem', 'Almofadas de pescoço'],
    'Camping e praia': ['Tendas de camping', 'Cadeiras de praia', 'Guarda-sóis', 'Neveiras portáteis', 'Colchões de ar', 'Lanternas de camping'],
    'Caminhada e natureza': ['Mochilas de caminhada', 'Bastões de caminhada', 'Calçado de trekking', 'Bússolas', 'Cantis'],
    'Segurança de viagem': ['Seguros de viagem', 'Cofres portáteis', 'Organizadores de documentos', 'Cadeados', 'Coletes'],
    'Organização': ['Caixas', 'Cestos', 'Organizadores', 'Armazenamento'],
    'Utilidades': ['Garrafas reutilizáveis', 'Canecas térmicas', 'Lanternas', 'Produtos reutilizáveis', 'Baterias portáteis'],
  },
  'Produtos digitais': {
    'Software': ['Aplicações', 'Templates', 'Plugins', 'Licenças'],
    'Conteúdo digital': ['E-books', 'Cursos', 'Fotografias', 'Vídeos', 'Música', 'Designs'],
    'Serviços digitais': ['Consultoria', 'Design', 'Marketing', 'Programação'],
  },
  'Serviços': {
    'Beleza': ['Cabeleireiro', 'Barbearia', 'Manicure', 'Pedicure', 'Maquilhagem profissional', 'Estética', 'Depilação'],
    'Casa': ['Limpeza doméstica', 'Canalização', 'Eletricista', 'Pintura', 'Reparações gerais', 'Jardinagem', 'Mudanças'],
    'Automóvel': ['Mecânica', 'Lavagem automóvel', 'Detailing', 'Serviço de pneus', 'Reparação de para-brisas'],
    'Tecnologia': ['Reparação de telemóveis', 'Reparação de computadores', 'Desenvolvimento web', 'Design gráfico', 'Instalação e suporte'],
    'Eventos': ['Fotografia de eventos', 'Vídeo e filmagem', 'Catering', 'Decoração de eventos', 'DJ', 'Som e iluminação'],
    'Educação': ['Explicações escolares', 'Cursos de línguas', 'Formação profissional', 'Tutoria online', 'Workshops'],
    'Saúde e bem-estar': ['Nutrição', 'Personal trainer', 'Fisioterapia', 'Massagens', 'Psicologia'],
    'Negócios': ['Contabilidade', 'Consultoria', 'Marketing digital', 'Tradução', 'Logística'],
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
