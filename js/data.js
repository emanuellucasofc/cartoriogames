/* =========================================================
   data.js — Dados base, constantes, cargos, etapas
   FASE 4: eventos aleatórios e conquistas
   ========================================================= */
var CS = {};

CS.STORAGE_KEY = 'cartorio_sim_save';
CS.MAX_COUNTERS_BASE = 3;

/* ---------- Tipos de Clientes e Etapas ---------- */
CS.ALL_STAGES = [
  { key: 'recepcao',   label: 'Recepção',           roleLabel: 'Auxiliar+',   minLevel: 1, okMsgs: ['Documentação recebida.', 'Triagem ok.', 'Senha emitida.'], noMsgs: ['Falta de cópia.', 'Documento ilegível.'] },
  { key: 'qualificacao',label: 'Qualificação',      roleLabel: 'Escrevente+', minLevel: 2, okMsgs: ['Dados conferidos.', 'Qualificação aceita.', 'Partes identificadas.'], noMsgs: ['Assinatura divergente.', 'Documento vencido.'] },
  { key: 'analise_cadeia',label:'Análise de Cadeia',roleLabel: 'Substituto+', minLevel: 3, okMsgs: ['Cadeia dominial íntegra.', 'Princípio da continuidade ok.', 'Matrícula anterior validada.'], noMsgs: ['Quebra de continuidade.', 'Ônus não baixado.'] },
  { key: 'lavratura',  label: 'Lavratura/Ato',      roleLabel: 'Substituto+', minLevel: 3, okMsgs: ['Ato lavrado com sucesso.', 'Registro efetivado.', 'Minuta aprovada.'], noMsgs: ['Erro no sistema TJ.', 'Falta de selo.'] },
  { key: 'assinatura', label: 'Assinatura Final',   roleLabel: 'Titular',     minLevel: 4, okMsgs: ['Assinado pelo Oficial.', 'Fé pública concedida.', 'Ato encerrado.'], noMsgs: ['Revisão pendente.', 'Oficial recusou.'] }
];

CS.LEGACY_STAGE_KEYS = ['recepcao', 'qualificacao', 'lavratura', 'assinatura'];

CS.CLIENT_TYPES = [
  { key: 'rcpn',   label: 'Certidão Nascimento', desc: 'Registro Civil', pay: 80,  patienceRange: [7, 12], stageKeys: ['recepcao', 'qualificacao', 'assinatura'], reqDocs: ['RG do Requerente', 'Dados do Livro e Folha'] },
  { key: 'notas',  label: 'Escritura Pública',   desc: 'Tabelionato',    pay: 350, patienceRange: [10, 16], stageKeys: ['recepcao', 'qualificacao', 'lavratura', 'assinatura'], reqDocs: ['RG e CPF originais', 'Certidão de Casamento', 'Guia do Imposto Paga', 'Certidão de Ônus'] },
  { key: 'protesto',label:'Protesto de Título',  desc: 'Títulos',        pay: 150, patienceRange: [6, 10], stageKeys: ['recepcao', 'qualificacao', 'assinatura'], reqDocs: ['Título Original (Boleto/Cheque)', 'Formulário de Apontamento'] },
  { key: 'rcpj',   label: 'Contrato Social',     desc: 'Pessoa Jurídica',pay: 220, patienceRange: [8, 14], stageKeys: ['recepcao', 'qualificacao', 'lavratura', 'assinatura'], reqDocs: ['Contrato Social Assinado', 'RG e CPF dos Sócios', 'Visto do Advogado'] },
  { key: 'imoveis',label: 'Registro de Imóvel',  desc: 'Reg. de Imóveis',pay: 550, patienceRange: [12, 18], stageKeys: ['recepcao', 'qualificacao', 'analise_cadeia', 'lavratura', 'assinatura'], reqDocs: ['Escritura Pública Original', 'Comprovante do ITBI', 'Certidões Negativas'] },
  { key: 'casamento',label: 'Casamento Civil',   desc: 'Sala VIP',       pay: 1200, patienceRange: [20, 30], stageKeys: ['recepcao', 'qualificacao', 'lavratura', 'assinatura'], reqDocs: ['Certidões de Nascimento', 'RG e CPF dos Noivos', 'Pacto Antenupcial'] }
];

/* ---------- Cargos e Hierarquia ---------- */
CS.ROLES = [
  { key: 'auxiliar',   label: 'Auxiliar',       level: 1, baseCost: 100, salary: 80 },
  { key: 'escrevente', label: 'Escrevente',     level: 2, baseCost: 350, salary: 180 },
  { key: 'substituto', label: 'Substituto',     level: 3, baseCost: 800, salary: 350 },
  { key: 'titular',    label: 'Tabelião/Oficial',level: 4, baseCost: 2000, salary: 600 }
];

/* ---------- Avatares (Fase 6) ---------- */
CS.AVATARS = {
  employees: ['👩‍💼','👨‍💼','🧑‍💼','👩‍💻','👨‍💻','🧑‍💻','👨‍🦳','👩‍🦳','🧑‍🦳','👨‍🦲','👩‍🦲','🧑‍🦲'],
  clients: ['👱‍♂️','👱‍♀️','🧔','👨','👩','👴','👵','🙍‍♂️','🙍‍♀️','🙎‍♂️','🙎‍♀️','👩‍🦱','👨‍🦱','👩‍🦰','👨‍🦰']
};

/* ---------- Glossário Educacional (Vade Mecum) ---------- */
CS.GLOSSARY = {
  autenticacao: { title: 'Autenticação', desc: 'Ato pelo qual o tabelião atesta que a cópia de um documento é idêntica ao original apresentado.' },
  reconhecimento: { title: 'Reconhecimento de Firma', desc: 'Atesta a autoria da assinatura em um documento. Pode ser por "semelhança" (comparando com a ficha no cartório) ou "autenticidade" (assinado na frente do tabelião).' },
  procuracao: { title: 'Procuração Pública', desc: 'Documento que passa poderes de uma pessoa (outorgante) para outra (procurador). Fica registrado no livro do cartório.' },
  compra_venda: { title: 'Compra e Venda', desc: 'Escritura essencial para transferir imóveis. Exige o pagamento do ITBI (Imposto de Transmissão de Bens Imóveis) pago à prefeitura.' },
  certidao: { title: 'Certidão', desc: 'Cópia fiel ou resumo de um ato registrado no cartório, com fé pública.' },
  testamento: { title: 'Testamento', desc: 'Ato personalíssimo onde o testador define a distribuição de seus bens após a morte, respeitando a parte legítima dos herdeiros necessários.' },
  inventario: { title: 'Inventário Extrajudicial', desc: 'Feito em cartório de forma mais rápida, desde que todos os herdeiros sejam maiores, capazes, concordes e assistidos por um advogado.' },
  usucapiao: { title: 'Usucapião Extrajudicial', desc: 'Permite regularizar a propriedade de um imóvel pela posse contínua e pacífica, diretamente no cartório, sem ir ao juiz.' },
  pacto_antenupcial: { title: 'Pacto Antenupcial', desc: 'Contrato feito pelos noivos antes do casamento para estabelecer o regime de bens (ex: separação total) se for diferente do regime legal.' },
  divorcio: { title: 'Divórcio Extrajudicial', desc: 'Rápido e prático, feito no cartório se o casal estiver de acordo, não houver gravidez nem filhos menores ou incapazes. Exige advogado.' },
  apostilamento: { title: 'Apostila de Haia', desc: 'Selo que garante a autenticidade de documentos públicos emitidos no Brasil para que sejam aceitos em outros países.' },
  ITBI: { title: 'ITBI', desc: 'Imposto sobre Transmissão de Bens Imóveis, cobrado pela Prefeitura em vendas de imóveis.' },
  ITCMD: { title: 'ITCMD', desc: 'Imposto sobre Transmissão Causa Mortis e Doação, cobrado pelo Estado em heranças e doações.' }
};

/* ---------- Quizzes de Qualificação ---------- */
CS.QUIZZES = [
  {
    question: "O cliente quer fazer uma Escritura de Compra e Venda. Qual imposto deve ter sido recolhido previamente?",
    options: [
      { text: "IPVA", correct: false },
      { text: "ITBI", correct: true },
      { text: "IPTU", correct: false }
    ],
    explanation: "O ITBI (Imposto sobre Transmissão de Bens Imóveis) é o imposto municipal obrigatório para transferências onerosas de imóveis.",
    unlocks: 'ITBI'
  },
  {
    question: "Um casal deseja fazer o Divórcio no cartório. Qual requisito é OBRIGATÓRIO pela lei?",
    options: [
      { text: "Não podem ter filhos menores ou incapazes.", correct: true },
      { text: "Precisam estar casados há pelo menos 5 anos.", correct: false },
      { text: "Não precisam de advogado.", correct: false }
    ],
    explanation: "Se houver filhos menores ou incapazes, o divórcio deve ser feito obrigatoriamente na via judicial para proteger o direito dos menores.",
    unlocks: 'divorcio'
  },
  {
    question: "No Inventário Extrajudicial, qual imposto incide sobre a herança deixada?",
    options: [
      { text: "Imposto de Renda (IRPF)", correct: false },
      { text: "ISS", correct: false },
      { text: "ITCMD", correct: true }
    ],
    explanation: "O ITCMD (Imposto sobre Transmissão Causa Mortis e Doação) é o imposto estadual cobrado sobre heranças.",
    unlocks: 'ITCMD'
  },
  {
    question: "O cliente trouxe uma fotocópia para autenticar, mas ela está plastificada. O que você faz?",
    options: [
      { text: "Autentica, pois está bem conservada.", correct: false },
      { text: "Recusa, documentos plastificados não permitem verificar a autenticidade do papel.", correct: true }
    ],
    explanation: "Documentos originais plastificados impedem a análise de itens de segurança (como marca d'água e textura), sendo vedada sua autenticação.",
    unlocks: 'autenticacao'
  }
];

/* ---------- Upgrades ---------- */
CS.UPGRADES = [
  { key: 'marketing', label: 'Marketing Básico', desc: 'Atrai mais clientes de alto valor (VIPs).', cost: 1500, minLevel: 2 },
  { key: 'cafe', label: 'Cafeteira Expresso', desc: 'Recupera energia dos funcionários mais rápido.', cost: 800, minLevel: 1 },
  { key: 'treinamento', label: 'Capacitação em Lote', desc: 'Funcionários ganham 20% mais XP.', cost: 3000, minLevel: 3 },
  { key: 'guiche4', label: 'Construir Guichê 4', desc: 'Habilita o 4º guichê de atendimento.', cost: 5000, minLevel: 4 },
  { key: 'guiche5', label: 'Construir Guichê 5', desc: 'Habilita o 5º guichê de atendimento.', cost: 12000, minLevel: 5, requires: 'guiche4' },
  { key: 'casamento', label: 'Sala de Casamentos', desc: 'Atrai cerimônias vips super lucrativas.', cost: 8000, minLevel: 4 }
];

CS.WEATHER_TYPES = {
  sunny: { label: 'Ensolarado', icon: '☀️', spawnMod: 1.0, patienceMod: 1.0 },
  rainy: { label: 'Chuvoso', icon: '🌧️', spawnMod: 0.7, patienceMod: 1.3 }
};

CS.DECORATIONS = [
  { id: 'plant_1', label: 'Planta Jiboia', desc: 'Deixa a recepção acolhedora (+5% paciência).', cost: 300, icon: '🪴', x: 6, y: 20 },
  { id: 'plant_2', label: 'Fícus Elegante', desc: 'Mais verde para o cartório (+5% paciência).', cost: 400, icon: '🪴', x: 94, y: 80 },
  { id: 'water', label: 'Bebedouro', desc: 'Água gelada acalma a fila (+10% paciência).', cost: 700, icon: '🚰', x: 92, y: 15 },
  { id: 'painting', label: 'Quadro Clássico', desc: 'Arte traz tranquilidade (+10% paciência).', cost: 1200, icon: '🖼️', x: 50, y: 10 },
  { id: 'sofa', label: 'Sofá de Espera', desc: 'Conforto extremo (+20% paciência).', cost: 2500, icon: '🛋️', x: 20, y: 80 }
];

/* ---------- Helpers de Consulta ---------- */
CS.roleByKey = function(key) {
  for (var i = 0; i < CS.ROLES.length; i++) if (CS.ROLES[i].key === key) return CS.ROLES[i];
  return CS.ROLES[0];
};

CS.nextRoleKey = function(currentKey) {
  for (var i = 0; i < CS.ROLES.length - 1; i++) {
    if (CS.ROLES[i].key === currentKey) return CS.ROLES[i+1].key;
  }
  return null;
};

CS.clientTypeByKey = function(key) {
  for (var i = 0; i < CS.CLIENT_TYPES.length; i++) if (CS.CLIENT_TYPES[i].key === key) return CS.CLIENT_TYPES[i];
  return CS.CLIENT_TYPES[0];
};

CS.stageByKey = function(key) {
  for (var i = 0; i < CS.ALL_STAGES.length; i++) if (CS.ALL_STAGES[i].key === key) return CS.ALL_STAGES[i];
  return CS.ALL_STAGES[0];
};

CS.getClientStages = function(client) {
  var keys = client.stageKeys || CS.LEGACY_STAGE_KEYS;
  return keys.map(function(k) { return CS.stageByKey(k); });
};

CS.randomName = function() {
  var nomes = ['Ana', 'Carlos', 'João', 'Maria', 'Pedro', 'Sofia', 'Lucas', 'Julia', 'Marta', 'José', 'Bia', 'Rui', 'Lara', 'Vitor'];
  var sobs = ['Silva', 'Santos', 'Oliveira', 'Costa', 'Pereira', 'Almeida', 'Gomes', 'Ferreira', 'Lima', 'Mendes', 'Nunes'];
  var n = nomes[Math.floor(Math.random() * nomes.length)];
  var s = sobs[Math.floor(Math.random() * sobs.length)];
  return n + ' ' + s;
};

/* ---------- Progressão e Custos ---------- */
CS.empXpForPromotion = function(nextLevel) { return nextLevel * 80; };
CS.PROMOTION_COST_FACTOR = 0.5;
CS.FIRE_COST_FACTOR = 0.3;

/* ---------- Tutorial ---------- */
CS.TUTORIAL_STEPS = [
  { trigger: 'call',    text: 'Clique em "Chamar próximo cliente" em um dos guichês para iniciar um atendimento.' },
  { trigger: 'assign',  text: 'Agora escolha um funcionário qualificado no dropdown para atribuí-lo à etapa.' },
  { trigger: 'process', text: 'Com o funcionário atribuído, clique em "Processar etapa" para avançar.' },
  { trigger: 'hire',    text: 'Ótimo! Use o dinheiro ganho para contratar mais funcionários e expandir o cartório.' }
];

/* ---------- Capacidade por cargo ---------- */
CS.roleCapabilityLabel = function(role) {
  if (role.level >= 3) return 'Todas as etapas';
  var stages = [];
  CS.ALL_STAGES.forEach(function(s) {
    if (s.minLevel <= role.level) stages.push(s.label);
  });
  return stages.join(', ');
};

/* ---------- Fase 4: Conquistas ---------- */
CS.ACHIEVEMENTS = [
  { id: 'first_blood', icon: '📜', name: 'Primeiro Selo', desc: 'Conclua o primeiro atendimento.' },
  { id: 'level_5', icon: '🏛️', name: 'Cartório Reconhecido', desc: 'Alcance o nível 5.' },
  { id: 'max_rep', icon: '⭐', name: 'Excelência Notarial', desc: 'Alcance 100 de reputação.' },
  { id: 'full_counters', icon: '🏢', name: 'Operação Máxima', desc: 'Desbloqueie todos os guichês.' },
  { id: 'titular', icon: '🎩', name: 'O Titular', desc: 'Tenha um funcionário no cargo de Tabelião/Oficial.' },
  { id: 'rich', icon: '💰', name: 'Lucratividade', desc: 'Acumule R$ 10.000 de saldo.' },
  { id: 'fast', icon: '⚡', name: 'Flash', desc: 'Processe uma etapa com Auxiliar ganhando a qualificação grátis.' }
];

/* ---------- Fase 9: Eventos Dilemas Morais (Educacionais) ---------- */
CS.EVENTS = [
  {
    id: 'suborno',
    condition: function(s) { return s.queue.length >= 2 && s.reputation > 40; },
    title: 'Dilema Ético: O Apressadinho',
    text: 'Um cliente está atrasado e oferece uma "gorjeta" de R$ 300 para passar na frente da fila. O que você faz?',
    choices: [
      { text: 'Aceitar os R$ 300 (Antiético)', rep: -30, money: 300, xp: 0, log: 'Você aceitou suborno. Um cliente viu e fez uma denúncia na Corregedoria!' },
      { text: 'Recusar (Ético)', rep: 10, money: 0, xp: 50, log: 'Você seguiu o Princípio da Impessoalidade. A fila respeitou sua postura.' }
    ]
  },
  {
    id: 'falsidade',
    condition: function(s) { return s.level >= 2 && Object.keys(s.clients).length > 0; },
    title: 'Dilema Legal: Documento Suspeito',
    text: 'Você nota que o RG apresentado parece falso (foto colada por cima). O cliente pressiona dizendo que conhece o juiz.',
    choices: [
      { text: 'Fingir que não viu (Perigoso)', rep: -40, money: 50, xp: 0, log: 'O documento falso gerou uma fraude. O cartório responde solidariamente!' },
      { text: 'Reter o documento (Correto)', rep: 15, money: 0, xp: 100, log: 'Você cumpriu seu papel de dar Segurança Jurídica e evitou uma fraude.' }
    ]
  },
  {
    id: 'inspecao_corregedoria',
    condition: function(s) { return s.level >= 3; },
    title: 'Inspeção Extraordinária',
    text: 'O Juiz Corregedor chegou de surpresa para fiscalizar o cartório.',
    choices: [
      { text: 'Prestar Esclarecimentos', action: function(s) {
          if (s.reputation > 60 && s.queue.length <= 3) {
            s.money += 500;
            return { log: 'Correição foi um sucesso! Cartório elogiado.' };
          } else {
            s.money -= 800;
            return { log: 'O Corregedor encontrou desorganização. O cartório foi multado!' };
          }
        }
      }
    ]
  }
];

/* ---------- Casos de Estudo (Triagem / Qualificação) ---------- */
CS.STUDY_CASES = [
  { 
    id: 'divorcio', atoCorreto: 'casamento', actLabel: 'Divórcio Extrajudicial',
    relato: 'Eu e minha esposa decidimos nos separar amigavelmente. Já dividimos os bens e não temos filhos menores ou incapazes.', 
    baseLegal: 'Art. 733 do CPC e Resolução 35 do CNJ', 
    opcoes: ['Divórcio Extrajudicial', 'Inventário', 'Ata Notarial', 'Escritura de Imóvel'] 
  },
  { 
    id: 'compra_venda', atoCorreto: 'imoveis', actLabel: 'Escritura Pública',
    relato: 'Vou comprar o apartamento do Sr. Roberto. Já fechamos o valor e quero transferir pro meu nome.', 
    baseLegal: 'Art. 108 do Código Civil (Ato > 30 salários mínimos)', 
    opcoes: ['Escritura Pública', 'Procuração Pública', 'Pacto Antenupcial', 'Contrato Social'] 
  },
  { 
    id: 'testamento', atoCorreto: 'notas', actLabel: 'Testamento',
    relato: 'Quero deixar documentado como meus bens serão divididos entre meus filhos após o meu falecimento.', 
    baseLegal: 'Art. 1.864 do Código Civil', 
    opcoes: ['Testamento', 'Inventário Extrajudicial', 'Procuração', 'Autenticação'] 
  },
  { 
    id: 'procuracao', atoCorreto: 'notas', actLabel: 'Procuração Pública',
    relato: 'Vou viajar para o exterior e preciso que minha irmã assine documentos no banco para mim enquanto estiver fora.', 
    baseLegal: 'Art. 653 do Código Civil', 
    opcoes: ['Procuração Pública', 'Contrato Social', 'Ata Notarial', 'Usucapião'] 
  },
  { 
    id: 'inventario', atoCorreto: 'notas', actLabel: 'Inventário Extrajudicial',
    relato: 'Nosso pai faleceu deixando uma casa. Todos os irmãos são maiores, concordam com a divisão e temos advogado.', 
    baseLegal: 'Art. 610, §§ 1º e 2º do CPC e Resolução 35 CNJ', 
    opcoes: ['Inventário Extrajudicial', 'Reconhecimento de Firma', 'Divórcio', 'Testamento'] 
  },
  {
    id: 'certidao_nascimento', atoCorreto: 'rcpn', actLabel: 'Certidão de Nascimento',
    relato: 'Meu filho acabou de nascer no hospital. A maternidade me deu a DNV (Declaração de Nascido Vivo) e vim registrar.',
    baseLegal: 'Art. 50 da Lei de Registros Públicos (Lei 6.015/73)',
    opcoes: ['Certidão de Nascimento', 'Registro de Imóvel', 'Ata Notarial', 'Reconhecimento de Firma']
  }
];

/* ---------- Sabatina da Corregedoria ---------- */
CS.INSPECTOR_QUIZZES = [
  {
    question: "Durante a Correição, o Inspetor pergunta: Um jovem de 17 anos (emancipado) deseja ser testemunha em um testamento público. É permitido?",
    options: [
      { text: "Sim, pois os maiores de 16 anos podem testemunhar.", correct: false },
      { text: "Não. A testemunha testamentária não pode ser menor de 18 anos, mesmo emancipada.", correct: true },
      { text: "Sim, se estiver assistido pelos pais.", correct: false }
    ],
    explanation: "Base Legal: O Art. 228 do Código Civil c/c jurisprudência majoritária afirma que menores de 18 anos não podem ser testemunhas de testamento."
  },
  {
    question: "Um cliente pede para lavrar uma Procuração de 'Venda de Imóvel' sem especificar qual imóvel. O Inspetor avalia sua conduta:",
    options: [
      { text: "Lavar o ato. A procuração pode ser genérica para venda.", correct: false },
      { text: "Recusar ou alertar. A alienação de imóveis exige poderes ESPECIAIS e EXPRESSOS com descrição do bem.", correct: true }
    ],
    explanation: "Base Legal: Art. 661, § 1º do Código Civil."
  },
  {
    question: "O selo de autenticidade (Selo Digital) serve para...",
    options: [
      { text: "Evitar fraudes e permitir o rastreamento do ato no Tribunal de Justiça.", correct: true },
      { text: "Apenas para cobrar mais emolumentos do cliente.", correct: false },
      { text: "Substituir a assinatura do Oficial.", correct: false }
    ],
    explanation: "O Selo Digital de Fiscalização é mecanismo garantidor de autenticidade, publicidade e rastreabilidade (Provimentos Estaduais/CNJ)."
  }
];

window.CS = CS;
