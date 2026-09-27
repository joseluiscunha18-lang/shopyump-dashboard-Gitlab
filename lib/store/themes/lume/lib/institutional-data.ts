export type InstitutionalSection = {
  title: string;
  body?: string[];
  items?: string[];
  steps?: { title: string; description: string }[];
};

export type InstitutionalPageData = {
  eyebrow: string;
  title: string;
  introduction: string;
  updatedAt: string;
  sections: InstitutionalSection[];
  note: { title: string; description: string };
};

export const institutionalPages = {
  shipping: {
    eyebrow: "Informações da loja",
    title: "Envios e Entregas",
    introduction: "Tudo o que precisa de saber sobre a preparação, expedição e acompanhamento da sua encomenda.",
    updatedAt: "Atualizado em setembro de 2026",
    sections: [
      { title: "Processamento da encomenda", body: ["Após a confirmação do pagamento, a encomenda é preparada no prazo de 1 a 2 dias úteis. Em períodos de elevada procura, este prazo poderá sofrer um pequeno ajuste, sempre comunicado ao cliente."] },
      { title: "Modalidades de envio", items: ["Standard — entrega estimada entre 3 e 7 dias úteis após a expedição.", "Expressa — entrega estimada entre 1 e 3 dias úteis após a expedição.", "Os prazos são indicativos e podem variar conforme a localização e disponibilidade da transportadora."] },
      { title: "Rastreio da encomenda", body: ["Assim que a encomenda for expedida, enviaremos uma confirmação com o código de rastreio. O progresso poderá ser acompanhado através da ligação incluída nessa mensagem."] },
      { title: "Custos de envio", body: ["O custo é calculado no checkout de acordo com o destino, peso e modalidade escolhida. Campanhas de envio gratuito podem aplicar-se automaticamente quando disponíveis."] },
    ],
    note: { title: "Precisa de ajuda?", description: "Se o rastreio não atualizar durante mais de 48 horas, contacte-nos com o número da encomenda." },
  },
  returns: {
    eyebrow: "Comprar com confiança",
    title: "Trocas e Devoluções",
    introduction: "Criámos um processo simples e transparente para que possa comprar com tranquilidade.",
    updatedAt: "Atualizado em setembro de 2026",
    sections: [
      { title: "Prazo para devolução", body: ["Pode solicitar a troca ou devolução até 7 dias corridos após a receção da encomenda. O pedido deve ser registado dentro deste período."] },
      { title: "Condições dos artigos", items: ["O artigo deve estar sem sinais de uso, lavagem ou alteração.", "Etiquetas, acessórios e embalagem original devem permanecer intactos.", "Artigos personalizados ou de higiene não são elegíveis, salvo defeito comprovado."] },
      { title: "Como solicitar", steps: [{ title: "Envie o pedido", description: "Contacte o apoio com o número da encomenda e o motivo da troca ou devolução." }, { title: "Aguarde as instruções", description: "A nossa equipa confirma a elegibilidade e envia os dados para a devolução." }, { title: "Entregue o artigo", description: "Embale o produto em segurança e utilize o método de envio indicado." }] },
      { title: "Reembolsos", body: ["Após a receção e verificação do artigo, o reembolso é processado em até 7 dias úteis pelo mesmo método de pagamento. O prazo de disponibilização poderá depender da instituição financeira."] },
    ],
    note: { title: "Importante", description: "Guarde o comprovativo de envio até receber a confirmação de conclusão do processo." },
  },
  privacy: {
    eyebrow: "Transparência e segurança",
    title: "Termos e Privacidade",
    introduction: "Conheça as regras de utilização da loja e os compromissos que assumimos para proteger a sua informação.",
    updatedAt: "Atualizado em setembro de 2026",
    sections: [
      { title: "Termos de utilização", body: ["Ao navegar no site ou efetuar uma compra, o utilizador concorda em fornecer informações corretas e em utilizar os serviços de forma lícita. A disponibilidade, preços e condições podem ser atualizados sem aviso prévio, sem afetar encomendas já confirmadas."] },
      { title: "Dados pessoais", body: ["Recolhemos apenas os dados necessários para processar encomendas, prestar apoio e melhorar a experiência. A informação é protegida através de medidas técnicas e organizacionais, incluindo encriptação durante a transmissão."] },
      { title: "Partilha e conservação", items: ["Os dados não são vendidos a terceiros.", "A partilha limita-se a parceiros essenciais, como pagamentos e entregas.", "A informação é conservada apenas durante o período necessário ou legalmente exigido."] },
      { title: "Segurança de pagamento", body: ["Os pagamentos são processados por parceiros especializados em ambientes seguros. A loja não armazena os dados completos do cartão e aplica mecanismos de prevenção de fraude."] },
      { title: "Os seus direitos", body: ["Pode solicitar acesso, correção ou eliminação dos seus dados, bem como retirar consentimentos aplicáveis, através dos canais oficiais de contacto."] },
    ],
    note: { title: "Conteúdo demonstrativo", description: "Este texto deve ser revisto e adaptado à operação e legislação aplicável antes da publicação comercial." },
  },
} satisfies Record<string, InstitutionalPageData>;
