/* =========================================================
   state.js — Gerenciamento de estado, persistência e IDs
   FASE 6: time, history, avatars, export/import
   ========================================================= */
var CS = window.CS;

/* ---------- UI State (transitório) ---------- */
CS.uiState = {
  pendingResults: {},
  tutorialStep: 0,
  activeTab: 'guiches',
  levelUpLevel: null,
  activeModal: null, // 'stats', 'event', 'day-end'
  currentEvent: null,
  achievementQueue: [],
  achievementPopup: null,
  daySummary: null
};

/* ---------- Gerador de IDs (persistido) ---------- */
CS.nextId = function(prefix) {
  return prefix + (CS.state.nextId++);
};

/* ---------- Fábricas ---------- */
CS.mkEmployee = function(roleKey, forceId) {
  var role = CS.roleByKey(roleKey);
  var id = (forceId !== undefined) ? ('emp' + forceId) : CS.nextId('emp');
  var avatar = CS.AVATARS.employees[Math.floor(Math.random() * CS.AVATARS.employees.length)];
  return { id: id, role: roleKey, level: role.level, name: CS.randomName(), empXp: 0, avatar: avatar, energy: 100 };
};

CS.mkClient = function(type) {
  if (!type) type = CS.CLIENT_TYPES[Math.floor(Math.random() * CS.CLIENT_TYPES.length)];
  var protocol = String(CS.state.protocolSeq++).padStart(4, '0');
  var range = type.patienceRange;
  var patience = (range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1))) * 7;
  if (CS.state.upgrades && CS.state.upgrades.arCondicionado) patience += 21;
  var avatar = CS.AVATARS.clients[Math.floor(Math.random() * CS.AVATARS.clients.length)];
  
  // Fase 11: Auditoria Avançada
  var reqDocs = type.reqDocs ? type.reqDocs.slice() : [];
  var isFlawed = Math.random() < 0.3; // 30% de chance de irregularidade
  var presentedDocs = reqDocs.slice();
  var flawCategory = null;
  if (isFlawed && presentedDocs.length > 0) {
    var flawIdx = Math.floor(Math.random() * presentedDocs.length);
    var flawType = Math.random();
    if (flawType < 0.4) {
      // 40% Omissão
      presentedDocs.splice(flawIdx, 1);
      flawCategory = 'missing';
    } else if (flawType < 0.7) {
      // 30% Vencido
      presentedDocs[flawIdx] += " (Vencido há " + (Math.floor(Math.random()*10)+5) + " anos)";
      flawCategory = 'expired';
    } else if (flawType < 0.85) {
      // 15% Rasurado
      presentedDocs[flawIdx] += " (Documento Rasurado)";
      flawCategory = 'erased';
    } else {
      // 15% Cópia simples
      presentedDocs[flawIdx] += " (Cópia Simples sem Autenticação)";
      flawCategory = 'copy';
    }
  }

  // Pegar um Caso de Estudo aleatório compatível com esse ato
  var validCases = CS.STUDY_CASES.filter(function(c) { return c.atoCorreto === type.key; });
  var studyCaseId = null;
  if (validCases.length > 0) {
    studyCaseId = validCases[Math.floor(Math.random() * validCases.length)].id;
  }

  return {
    id: CS.nextId ? CS.nextId('cli') : 'C' + CS.state.nextId++,
    typeKey: type.key,
    protocol: protocol,
    stageIndex: 0,
    attempts: 0,
    stageKeys: type.stageKeys ? type.stageKeys.slice() : CS.LEGACY_STAGE_KEYS.slice(),
    patience: patience,
    waitedTicks: 0,
    avatar: avatar,
    docsStatus: isFlawed ? 'missing' : 'perfect',
    flawCategory: flawCategory,
    presentedDocs: presentedDocs,
    studyCaseId: studyCaseId,
    triageDone: false
  };
};

/* ---------- Progressão ---------- */
CS.xpForLevel = function(lvl) { return lvl * 120; };

/* ---------- Log ---------- */
CS.addLog = function(text, kind) {
  CS.state.log.unshift({ protocol: '', text: text, kind: kind || 'info' });
  if (CS.state.log.length > 40) CS.state.log.pop();
};

CS.addLogEntry = function(protocol, text, kind) {
  CS.state.log.unshift({ protocol: protocol, text: text, kind: kind });
  if (CS.state.log.length > 40) CS.state.log.pop();
};

/* ---------- Estado inicial ---------- */
CS.freshState = function() {
  return {
    version: 7, // Incrementada versão
    isOpen: true,
    nextId: 4,
    time: { day: 1, hour: 9, minute: 0 },
    weather: 'sunny',
    money: 1000,
    xp: 0,
    level: 1,
    reputation: 50,
    protocolSeq: 1,
    hireCounts: { auxiliar:0, escrevente:0, substituto:0, titular:0 },
    upgrades: {},
    employees: [
      CS.mkEmployee('auxiliar',   1),
      CS.mkEmployee('escrevente', 2),
      CS.mkEmployee('titular',    3)
    ],
    queue: [],
    counters: [null, null, null, null, null],
    clients: {},
    log: [],
    completed: 0,
    tutorialDone: false,
    darkMode: false,
    muted: false,
    achievements: {},
    unlockedTerms: [], // Vade Mecum unlocks
    history: [], // Histórico de faturamento
    decorations: {},
    weather: 'sunny',
    stats: {
      completed: 0,
      moneyEarned: 0,
      clientsLost: 0,
      eventsTriggered: 0,
      corruptionScore: 0
    }
  };
};

/* ---------- Migração de saves antigos ---------- */
CS.migrateState = function(s) {
  if (s.nextId === undefined) {
    var maxId = 0;
    (s.employees || []).forEach(function(e) {
      var n = parseInt(e.id.replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > maxId) maxId = n;
    });
    Object.keys(s.clients || {}).forEach(function(k) {
      var n = parseInt(s.clients[k].id.replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > maxId) maxId = n;
    });
    s.nextId = maxId + 1;
  }
  
  if (!s.time) s.time = { day: 1, hour: 9, minute: 0 };
  if (s.isOpen === undefined) s.isOpen = true;
  if (!s.history) s.history = [];
  if (!s.unlockedTerms) s.unlockedTerms = [];
  if (!s.stats.corruptionScore) s.stats.corruptionScore = 0;

  if (s.reputation === undefined) s.reputation = 50;
  if (s.upgrades === undefined) s.upgrades = {};
  if (s.level >= 4 && !s.upgrades.guiche4) s.upgrades.guiche4 = true;
  while (s.counters.length < 5) s.counters.push(null);
  
  (s.employees || []).forEach(function(e) { 
    if (e.empXp === undefined) e.empXp = 0; 
    if (e.energy === undefined) e.energy = 100;

    if (!e.avatar) e.avatar = CS.AVATARS.employees[Math.floor(Math.random() * CS.AVATARS.employees.length)];
  });
  
  Object.keys(s.clients || {}).forEach(function(k) {
    var c = s.clients[k];
    if (c.patience === undefined) c.patience = 84;
    // Se o save antigo tinha paciência pequena (ex: 12), adaptamos para o novo tick (x7)
    if (c.patience < 30) c.patience *= 7; 
    if (c.waitedTicks === undefined) c.waitedTicks = 0;
    if (!c.avatar) c.avatar = CS.AVATARS.clients[Math.floor(Math.random() * CS.AVATARS.clients.length)];
  });
  
  if (s.completed === undefined) s.completed = 0;
  if (s.hireCounts === undefined) s.hireCounts = { auxiliar:0, escrevente:0, substituto:0, titular:0 };
  if (s.tutorialDone === undefined) s.tutorialDone = true;
  if (s.darkMode === undefined) s.darkMode = false;
  if (s.muted === undefined) s.muted = false;
  
  if (s.achievements === undefined) s.achievements = {};
  if (s.stats === undefined) s.stats = {
    moneyEarned: s.money || 1000,
    clientsLost: 0,
    eventsTriggered: 0
  };

  s.counters.forEach(function(c) { if (c) delete c._pendingResult; });
  return s;
};

/* ---------- Persistência ---------- */
CS.saveState = function() {
  try {
    var json = JSON.stringify(CS.state);
    if (window.storage) window.storage.set(CS.STORAGE_KEY, json, false).catch(function(){});
    else localStorage.setItem(CS.STORAGE_KEY, json);
  } catch (e) {}
};

CS.loadState = function(cb) {
  function tryParse(raw) {
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.employees) return CS.migrateState(parsed);
    } catch(e) {}
    return null;
  }
  if (window.storage) {
    try {
      window.storage.get(CS.STORAGE_KEY, false).then(function(res) {
        var s = tryParse(res && res.value);
        if (s) { cb(s); return; }
        s = tryParse(localStorage.getItem(CS.STORAGE_KEY));
        cb(s || CS.freshState());
      }).catch(function() {
        var s = tryParse(localStorage.getItem(CS.STORAGE_KEY));
        cb(s || CS.freshState());
      });
      return;
    } catch(e) {}
  }
  try {
    var s = tryParse(localStorage.getItem(CS.STORAGE_KEY));
    cb(s || CS.freshState());
  } catch(e) { cb(CS.freshState()); }
};

CS.resetGame = function() {
  if (!confirm('Reiniciar a simulação do zero? O progresso salvo será apagado.')) return;
  var wasDark = CS.state.darkMode;
  CS.state = CS.freshState();
  CS.state.darkMode = wasDark;
  CS.uiState.pendingResults = {};
  CS.uiState.tutorialStep = 0;
  CS.uiState.levelUpLevel = null;
  CS.uiState.activeModal = null;
  CS.uiState.achievementQueue = [];
  CS.uiState.achievementPopup = null;
  CS.uiState.daySummary = null;
  CS.addLog('Nova simulação iniciada.', 'info');
  CS.saveState();
  CS.render();
};

/* ---------- Export / Import ---------- */
CS.exportSave = function() {
  try {
    var json = JSON.stringify(CS.state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    return '';
  }
};

CS.importSave = function(b64) {
  try {
    var json = decodeURIComponent(escape(atob(b64)));
    var parsed = JSON.parse(json);
    if (parsed && parsed.employees) {
      CS.state = CS.migrateState(parsed);
      CS.saveState();
      alert('Progresso importado com sucesso!');
      CS.render();
      return true;
    }
  } catch (e) {}
  alert('Código de save inválido ou corrompido.');
  return false;
};

CS.advanceTutorial = function(action) {
  if (CS.state.tutorialDone) return;
  var step = CS.uiState.tutorialStep || 0;
  if (step >= CS.TUTORIAL_STEPS.length) return;
  if (CS.TUTORIAL_STEPS[step].trigger === action) {
    CS.uiState.tutorialStep = step + 1;
    if (CS.uiState.tutorialStep >= CS.TUTORIAL_STEPS.length) {
      CS.state.tutorialDone = true;
      CS.saveState();
    }
  }
};

CS.skipTutorial = function() {
  CS.state.tutorialDone = true;
  CS.uiState.tutorialStep = CS.TUTORIAL_STEPS.length;
  CS.saveState();
  CS.render();
};

CS.state = null;
window.CS = CS;
