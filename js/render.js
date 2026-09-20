/* =========================================================
   render.js — Funções de renderização
   FASE 7: Visual Office (2D DOM Environment)
   ========================================================= */
var CS = window.CS;

CS.esc = function(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

/* ---------- 2D Visual Office ---------- */

CS.setupOfficeDOM = function() {
  if (document.getElementById('office-world')) return;
  var app = document.getElementById('app');
  var world = document.createElement('div');
  world.id = 'office-world';
  
  var bgHTML = '<div class="office-bg">';
  
  // Janela (Clima)
  bgHTML += '<div class="office-window" id="office-window"><div id="weather-anim"></div><div class="window-glass"></div><div class="window-frame"></div></div>';
  
  // 5 Guichês
  for (var i = 0; i < 5; i++) {
    bgHTML += '<div class="office-desk" id="desk-bg-'+i+'" style="left:'+(15 + i*17.5)+'%; top:42%;"></div>';
    bgHTML += '<div class="office-prop" id="pc-bg-'+i+'" style="left:'+(15 + i*17.5)+'%; top:38%; font-size:18px;">💻</div>';
  }
  
  // Tapete da fila
  bgHTML += '<div class="office-rug" style="left:50%; top:82%; width:75%; height:45px;"></div>';
  
  bgHTML += '</div><div id="office-sprites"></div>';
  
  bgHTML += '<div id="office-lighting"></div>'; // Camada de iluminação
  world.innerHTML = bgHTML;
  app.parentNode.insertBefore(world, app);
};

CS.getEmployeeAssignments = function() {
  var map = {};
  CS.state.counters.forEach(function(c, idx) {
    if (c && c.employeeId) map[c.employeeId] = idx;
  });
  return map;
};

CS.updateOfficeSprites = function() {
  var layer = document.getElementById('office-sprites');
  if (!layer) return;

  var activeIds = {};
  var assignments = CS.getEmployeeAssignments();
  var maxC = CS.maxCounters();

  // Esconder guichês não comprados
  for (var i = 0; i < 5; i++) {
    var desk = document.getElementById('desk-bg-'+i);
    var pc = document.getElementById('pc-bg-'+i);
    if (desk && pc) {
      var isUnlocked = i < maxC;
      desk.style.opacity = isUnlocked ? '1' : '0.2';
      pc.style.opacity = isUnlocked ? '1' : '0';
    }
  }

  // 1. Decorações Compradas
  CS.DECORATIONS.forEach(function(dec) {
    if (CS.state.decorations[dec.id]) {
      var id = 'dec-' + dec.id;
      activeIds[id] = true;
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.className = 'office-prop dec-item';
        el.innerHTML = dec.icon;
        el.style.left = dec.x + '%';
        el.style.top = dec.y + '%';
        layer.appendChild(el);
      }
    }
  });

  // 2. Atualizar Funcionários
  CS.state.employees.forEach(function(emp, index) {
    var id = 'sp-' + emp.id;
    activeIds[id] = true;
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'sprite emp-sprite';
      el.innerHTML = emp.avatar || '🧑‍💼';
      layer.appendChild(el);
    }
    
    var cIdx = assignments[emp.id];
    if (cIdx !== undefined) {
      // Trabalhando no guichê (atrás da mesa)
      el.style.left = (15 + cIdx * 17.5) + '%';
      el.style.top = '30%';
    } else {
      // Copa (descansando) - Canto superior direito
      el.style.left = (88 + (index%3)*4) + '%';
      el.style.top = (12 + Math.floor(index/3)*12) + '%';
    }
  });

  // 3. Atualizar Clientes (Fila)
  CS.state.queue.forEach(function(cliId, index) {
    var id = 'sp-' + cliId;
    activeIds[id] = true;
    var c = CS.state.clients[cliId];
    if (!c) return;
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'sprite cli-sprite';
      el.innerHTML = c.avatar || '👤';
      // Nasce na porta
      el.style.left = '5%';
      el.style.top = '110%';
      layer.appendChild(el);
    }
    
    // Animação indo pra fila
    setTimeout(function() {
      if(document.getElementById(id)) {
        el.style.left = (20 + (index * 12)) + '%';
        el.style.top = '82%';
      }
    }, 50);
  });

  // 4. Atualizar Clientes (No Guichê)
  CS.state.counters.forEach(function(counter, idx) {
    if (counter && counter.clientId) {
      var cliId = counter.clientId;
      var id = 'sp-' + cliId;
      activeIds[id] = true;
      var c = CS.state.clients[cliId];
      if (!c) return;
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.className = 'sprite cli-sprite';
        el.innerHTML = c.avatar || '👤';
        layer.appendChild(el);
      }
      // Cliente na frente do guichê
      el.style.left = (15 + idx * 17.5) + '%';
      el.style.top = '58%';
      
      // Feedback de exigência/sucesso no visual office
      var pending = CS.uiState.pendingResults[idx];
      if (pending === 'ok') {
        el.style.transform = 'translate(-50%, -50%) translateY(-10px)';
      } else if (pending === 'no') {
        el.style.transform = 'translate(-50%, -50%) translateX(5px)';
      } else {
        el.style.transform = 'translate(-50%, -50%)';
      }
    }
  });

  // 5. Lixeira (Remover quem já saiu)
  Array.from(layer.children).forEach(function(child) {
    if (!activeIds[child.id]) {
      child.style.left = '5%';
      child.style.top = '110%';
      child.style.opacity = '0';
      setTimeout(function() {
        if (child.parentNode) child.parentNode.removeChild(child);
      }, 1000);
    }
  });

  // 6. Iluminação e Clima Dinâmico
  var lighting = document.getElementById('office-lighting');
  var anim = document.getElementById('weather-anim');
  var win = document.getElementById('office-window');
  
  if (lighting && anim && win) {
    var h = CS.state.time.hour;
    var w = CS.state.weather;
    
    // Iluminação por hora
    if (w === 'rainy') lighting.className = 'light-rainy';
    else if (h < 13) lighting.className = 'light-morning';
    else if (h < 16) lighting.className = 'light-afternoon';
    else lighting.className = 'light-evening';
    
    // Animação na janela
    if (w === 'rainy') {
      anim.className = 'weather-rain';
      win.style.background = '#80a0b0'; // Cinza chuvoso
    } else {
      anim.className = '';
      if (h >= 16) win.style.background = '#f2a65a'; // Pôr-do-sol
      else win.style.background = '#a3d5e8'; // Céu azul
    }
  }
};


/* ---------- Renderização DOM Tradicional ---------- */

CS.renderSeal = function() {
  return '<svg class="seal" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="30" cy="30" r="27" fill="none" stroke="#24392c" stroke-width="2"/>' +
    '<circle cx="30" cy="30" r="21" fill="none" stroke="#a9803f" stroke-width="1.2"/>' +
    '<text x="30" y="36" text-anchor="middle" font-family="Source Serif 4, serif" font-weight="700" font-size="18" fill="#24392c">CC</text>' +
  '</svg>';
};

CS.renderHeader = function() {
  var xpNeed = CS.xpForLevel(CS.state.level);
  var pct = Math.min(100, Math.round((CS.state.xp / xpNeed) * 100));
  var rep = CS.state.reputation;
  var repClass = rep > 70 ? 'rep-good' : (rep >= 40 ? 'rep-mid' : 'rep-bad');
  var muteIcon = CS.state.muted ? '🔇' : '🔊';
  var darkIcon = CS.state.darkMode ? '☀️' : '🌙';
  
  var t = CS.state.time;
  var timeStr = 'Dia ' + t.day + ' - ' + String(t.hour).padStart(2, '0') + ':' + String(t.minute).padStart(2, '0');

  return (
    '<header class="letterhead" id="main-header">' +
      '<div class="brand">' + CS.renderSeal() +
        '<div class="brand-text">' +
          '<h1>Cartório Central</h1>' +
          '<p>simulador notarial</p>' +
        '</div>' +
      '</div>' +
      '<div class="header-right">' +
        '<div class="stats">' +
          '<div class="stat-chip time-chip"><div class="k">Expediente</div><div class="v">' + timeStr + '</div></div>' +
          '<div class="stat-chip"><div class="k">Saldo</div><div class="v">R$ ' + CS.state.money.toLocaleString('pt-BR') + '</div></div>' +
          '<div class="stat-chip"><div class="k">Nível</div><div class="v">' + CS.state.level + '</div>' +
            '<div class="xp-bar"><div style="width:' + pct + '%"></div></div>' +
          '</div>' +
          '<div class="stat-chip"><div class="k">Reputação</div><div class="v ' + repClass + '">★ ' + rep + '</div></div>' +
          '<div class="stat-chip" style="cursor:pointer; user-select:none; background:' + (CS.state.isOpen ? 'var(--green)' : 'var(--wine)') + '; color:white; border:none;" data-action="toggle-open" title="Clique para abrir ou fechar o cartório">' +
            '<div class="k" style="color:rgba(255,255,255,0.8);">Status</div><div class="v">' + (CS.state.isOpen ? 'Aberto' : 'Fechado') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="header-tools">' +
          '<button class="tool-btn" data-action="open-vade" title="Códex Notarial">🏛️</button>' +
          '<button class="tool-btn" data-action="open-stats" title="Estatísticas">🏆</button>' +
          '<button class="tool-btn" data-action="toggle-mute" title="Som">' + muteIcon + '</button>' +
          '<button class="tool-btn" data-action="toggle-dark" title="Tema">' + darkIcon + '</button>' +
        '</div>' +
      '</div>' +
    '</header>'
  );
};

CS.renderTutorialBanner = function() {
  if (CS.state.tutorialDone || CS.uiState.tutorialStep >= CS.TUTORIAL_STEPS.length) return '';
  var s = CS.TUTORIAL_STEPS[CS.uiState.tutorialStep || 0];
  return '<div class="tutorial-banner">' +
    '<span class="tutorial-step">' + ((CS.uiState.tutorialStep||0) + 1) + '/' + CS.TUTORIAL_STEPS.length + '</span>' +
    '<span class="tutorial-text">' + s.text + '</span>' +
    '<button class="tutorial-skip" data-action="skip-tutorial">Pular</button>' +
  '</div>';
};

CS.renderMobileTabs = function() {
  var active = CS.uiState.activeTab || 'guiches';
  return '<div class="mobile-tabs">' +
    '<button class="mobile-tab' + (active === 'equipe' ? ' active' : '') + '" data-action="tab" data-tab="equipe">Equipe</button>' +
    '<button class="mobile-tab' + (active === 'guiches' ? ' active' : '') + '" data-action="tab" data-tab="guiches">Guichês</button>' +
    '<button class="mobile-tab' + (active === 'fila' ? ' active' : '') + '" data-action="tab" data-tab="fila">Fila</button>' +
  '</div>';
};

CS.renderAchievementToast = function() {
  if (!CS.uiState.achievementPopup) return '';
  var a = CS.uiState.achievementPopup;
  return '<div class="achieve-toast">' +
    '<div class="achieve-icon">' + a.icon + '</div>' +
    '<div class="achieve-text">' +
      '<strong>' + a.name + '</strong>' +
      '<span>Conquista desbloqueada!</span>' +
    '</div>' +
  '</div>';
};

CS.renderModals = function() {
  if (!CS.uiState.activeModal) return '';
  var html = '<div class="modal-overlay">';

  if (CS.uiState.activeModal === 'event' && CS.uiState.currentEvent) {
    var ev = CS.uiState.currentEvent;
    html += '<div class="modal event-modal">' +
      '<h2>⚠️ ' + CS.esc(ev.title) + '</h2>' +
      '<p>' + CS.esc(ev.text) + '</p>' +
      '<div class="modal-actions" style="flex-direction: column;">';
    
    if (ev.choices) {
      ev.choices.forEach(function(choice, idx) {
        html += '<button class="btn" style="margin-bottom: 8px;" data-action="resolve-choice" data-idx="' + idx + '">' + CS.esc(choice.text) + '</button>';
      });
    } else {
      // Fallback for older events
      html += '<button class="btn" data-action="resolve-choice" data-idx="0">' + CS.esc(ev.btn || 'Ok') + '</button>';
    }
    
    html += '</div></div>';
  } 
  else if (CS.uiState.activeModal === 'triage' && CS.uiState.triageData) {
    var tData = CS.uiState.triageData;
    var client = CS.state.clients[CS.state.counters[tData.counterIndex].clientId];
    var studyCase = CS.STUDY_CASES.find(function(c) { return c.id === client.studyCaseId; });
    
    html += '<div class="modal doc-modal" style="display:flex; max-width:800px; padding:0;">' +
      '<div style="flex:1; padding:20px; border-right:2px dashed #90a4ae; background:#fdfbf7;">' +
        '<h2 style="color:#1e3c72;">🏛️ Qualificação Notarial</h2>' +
        '<div style="text-align:center; font-size:48px; margin: 16px 0;">' + client.avatar + '</div>' +
        '<div style="background:#fff; border:1px solid #cfd8dc; padding:16px; border-radius:8px; font-family:\'Georgia\', serif; font-size:16px; color:#37474f; font-style:italic; margin-bottom:16px;">' +
          '"' + CS.esc(studyCase.relato) + '"' +
        '</div>' +
        '<div style="background:#e8eaf6; border-left:4px solid #1e3c72; padding:12px; font-size:14px; font-weight:bold; color:#1a237e;">' +
          '⚖️ Base Legal: ' + CS.esc(studyCase.baseLegal) + 
        '</div>' +
      '</div>' +
      '<div style="flex:1; padding:20px; background:#eceff1; display:flex; flex-direction:column; justify-content:center;">' +
        '<h3 style="margin-top:0; color:#455a64; text-align:center;">Qual é o ato adequado?</h3>' +
        '<div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">';
    
    studyCase.opcoes.forEach(function(opt) {
      var isCorrect = (opt === studyCase.actLabel) ? 'true' : 'false';
      html += '<button class="btn secondary" data-action="resolve-triage" data-correct="' + isCorrect + '" style="text-align:left; padding:12px; font-size:15px; border-radius:6px; font-weight:bold;">📝 ' + CS.esc(opt) + '</button>';
    });
    
    html += '</div></div></div>';
  }
  else if (CS.uiState.activeModal === 'inspector-quiz' && CS.uiState.inspectorQuizData) {
    var qData = CS.uiState.inspectorQuizData;
    html += '<div class="modal event-modal" style="max-width:600px;">' +
      '<h2 style="color:#8e0000; text-align:center;">🚨 Sabatina da Corregedoria</h2>' +
      '<p style="font-size:16px; font-weight:bold; text-align:center; margin-bottom:20px;">' + CS.esc(qData.question) + '</p>' +
      '<div class="modal-actions" style="flex-direction: column;">';
    
    qData.options.forEach(function(opt, idx) {
      html += '<button class="btn secondary" style="margin-bottom: 12px; text-align: left; padding: 12px; font-size:14px;" data-action="answer-inspector" data-correct="' + (opt.correct ? 'true' : 'false') + '">' + CS.esc(opt.text) + '</button>';
    });
    
    html += '</div></div>';
  }
  else if (CS.uiState.activeModal === 'quiz' && CS.uiState.quizData) {
    var isConcurso = CS.uiState.quizData.isConcurso;
    var isCorregedor = CS.uiState.quizData.isCorregedor;
    var qData = CS.uiState.quizData.quiz;
    var costStr = isConcurso ? ' (Custo da Prova: R$ ' + CS.uiState.quizData.cost + ')' : '';
    
    var title = '⚖️ Teste de Conhecimento';
    if (isConcurso) title = '🎓 Concurso de Promoção' + costStr;
    if (isCorregedor) title = '👨‍⚖️ Sabatina do Corregedor';
    
    html += '<div class="modal event-modal">' +
      '<h2>' + title + '</h2>' +
      '<p><strong>' + CS.esc(qData.question) + '</strong></p>' +
      '<div class="modal-actions" style="flex-direction: column;">';
    
    qData.options.forEach(function(opt, idx) {
      html += '<button class="btn" style="margin-bottom: 8px; text-align: left;" data-action="answer-quiz" data-correct="' + (opt.correct ? 'true' : 'false') + '">' + CS.esc(opt.text) + '</button>';
    });
    
    if (isConcurso) {
       html += '<button class="btn secondary" style="margin-top: 10px;" data-action="close-modal">Cancelar Concurso</button>';
    }
    
    html += '</div></div>';
  }
  else if (CS.uiState.activeModal === 'doc-check' && CS.uiState.docCheckData) {
    var dData = CS.uiState.docCheckData;
    var client = CS.state.clients[CS.state.counters[dData.counterIndex].clientId];
    var type = CS.clientTypeByKey(client.typeKey);
    var reqDocs = type.reqDocs || [];
    var presentedDocs = client.presentedDocs || [];
    
    html += '<div class="modal doc-modal">' +
      '<h2>Auditoria Documental</h2>' +
      '<p>Verifique se os papéis apresentados conferem com a exigência legal.</p>' +
      '<div class="doc-table">' +
        '<div class="doc-col">' +
          '<h3>📄 Papéis do Cliente</h3>' +
          '<ul style="list-style:none; padding:0;">';
    presentedDocs.forEach(function(doc) {
      html += '<li style="margin-bottom:8px; padding:8px; background:#fff; border:1px solid #ccc; border-radius:4px;">✔️ ' + CS.esc(doc) + '</li>';
    });
    if (presentedDocs.length === 0) html += '<li><em>Nenhum documento!</em></li>';
    html += '</ul></div>' +
        '<div class="doc-col cola-col">' +
          '<h3>📋 Exigência Legal (Cola)</h3>' +
          '<ul style="list-style:none; padding:0; margin-bottom: 10px;">';
    reqDocs.forEach(function(doc) {
      html += '<li style="margin-bottom:8px; padding:8px; background:rgba(255,255,255,0.5); border-left:4px solid #c5a059; border-radius:4px;">' + CS.esc(doc) + '</li>';
    });
    var studyCase = CS.STUDY_CASES.find(function(c) { return c.id === client.studyCaseId; });
    var lawHint = studyCase ? studyCase.baseLegal : 'Provimento Geral CNJ';
    html += '</ul>' +
      '<div style="padding:10px; background:#fffdf7; border: 1px solid #c5a059; border-radius:4px; font-size:13px; color:#5d4037;">' +
      '<strong>⚖️ Fundamentação Legal:</strong><br>' + CS.esc(lawHint) + '</div>' +
    '</div>' +
    '</div>' +
      '</div>';
      
    if (CS.uiState.docCheckData.showRejectReasons) {
      html += '<div class="modal-actions" style="margin-top:20px; flex-direction:column; gap:10px;">' +
        '<h3 style="margin: 0; text-align: center; color: #8e0000;">Motivo da Exigência:</h3>' +
        '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; width:100%;">' +
          '<button class="btn secondary" data-action="submit-reject" data-reason="missing">Falta Documento Essencial</button>' +
          '<button class="btn secondary" data-action="submit-reject" data-reason="expired">Documento Vencido</button>' +
          '<button class="btn secondary" data-action="submit-reject" data-reason="erased">Documento Rasurado (Indícios de Falsificação)</button>' +
          '<button class="btn secondary" data-action="submit-reject" data-reason="copy">Cópia Simples não autenticada</button>' +
        '</div>' +
        '<button class="btn" style="background:#546e7a; margin-top:10px; width: 150px; align-self: center;" data-action="cancel-reject">⬅️ Voltar</button>' +
      '</div></div>';
    } else {
      html += '<div class="modal-actions" style="margin-top:20px; justify-content:space-between;">' +
        '<button class="btn danger" data-action="doc-reject">❌ Recusar (Gerar Exigência)</button>' +
        '<button class="btn" style="background:#27ae60;" data-action="doc-approve">✅ Aprovar (Deferir)</button>' +
      '</div></div>';
    }
  }
  else if (CS.uiState.activeModal === 'minigame-lavratura' && CS.uiState.minigameData) {
    var mg = CS.MINIGAMES[CS.uiState.minigameData.gameId];
    if (mg) {
      var text = mg.text;
      for (var k in mg.options) {
        var sel = '<select id="minigame-sel-' + k + '" class="minigame-select" style="font-size:16px; padding:4px; margin: 0 4px; border-radius: 4px; border: 1px solid #c5a059;"><option value="">-- selecione --</option>';
        for (var i = 0; i < mg.options[k].length; i++) {
          sel += '<option value="' + i + '">' + CS.esc(mg.options[k][i]) + '</option>';
        }
        sel += '</select>';
        text = text.replace('[' + k + ']', sel);
      }
      
      html += '<div class="modal doc-modal" style="max-width: 600px;">' +
        '<div class="modal-head"><h2>✍️ ' + CS.esc(mg.title) + '</h2></div>' +
        '<div class="doc-body" style="font-size: 18px; line-height: 1.8; padding: 20px;">' +
          text +
        '</div>' +
        '<div class="modal-actions" style="margin-top:20px; justify-content:center;">' +
          '<button class="btn" style="background:#27ae60; width: 250px;" data-action="submit-minigame">Assinar e Lavrar</button>' +
        '</div>' +
      '</div>';
    }
  }
  else if (CS.uiState.activeModal === 'info-docs' && CS.uiState.infoDocsKey) {
    var typeInfo = CS.clientTypeByKey(CS.uiState.infoDocsKey);
    html += '<div class="modal event-modal">' +
      '<h2>📋 Exigências: ' + typeInfo.label + '</h2>' +
      '<ul style="text-align:left; line-height: 1.6; font-size: 16px; margin: 20px 0;">';
    typeInfo.reqDocs.forEach(function(doc) {
      html += '<li>✔️ ' + CS.esc(doc) + '</li>';
    });
    html += '</ul>' +
      '<div class="modal-actions"><button class="btn" data-action="close-modal">Entendi</button></div>' +
    '</div>';
  }
  else if (CS.uiState.activeModal === 'vade') {
    html += '<div class="modal stats-modal" style="max-height: 85vh; max-width: 800px; overflow-y: auto;">' +
      '<h2>🏛️ Códex Notarial e Registral</h2>' +
      '<p>Consulte aqui as leis e princípios fundamentais do serviço extrajudicial.</p>' +
      '<div style="text-align:left; margin-bottom: 20px;">';
    
    for (var key in CS.CODEX) {
      var lei = CS.CODEX[key];
      html += '<div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.03); border: 1px solid #d4c5b0; border-radius: 6px;">' +
        '<h3 style="color: var(--gold); margin-top: 0; margin-bottom: 6px;">📜 ' + CS.esc(lei.title) + '</h3>' +
        '<p style="font-style: italic; margin-bottom: 12px; font-size: 14px;">' + CS.esc(lei.desc) + '</p>';
      
      lei.articles.forEach(function(art) {
        html += '<div style="margin-bottom: 8px; padding-left: 10px; border-left: 3px solid #8e0000;">' +
          '<strong>' + CS.esc(art.art) + ' - </strong> ' + CS.esc(art.text) +
        '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>' +
      '<div class="modal-actions"><button class="btn" data-action="close-modal">Fechar Códex</button></div>' +
    '</div>';
  }
  else if (CS.uiState.activeModal === 'day-end' && CS.uiState.daySummary) {
    var d = CS.uiState.daySummary;
    html += '<div class="modal day-modal">' +
      '<h2>🌙 Fim do Expediente — Dia ' + d.day + '</h2>' +
      '<p>O cartório fechou as portas por hoje. Aqui está o balanço financeiro:</p>' +
      '<div class="day-stats">' +
        '<div class="d-row"><span>Atendimentos Concluídos:</span><strong>' + d.served + '</strong></div>' +
        '<div class="d-row"><span>Receita Gerada:</span><strong class="green">+ R$ ' + d.revenue.toLocaleString('pt-BR') + '</strong></div>' +
        '<div class="d-row"><span>Salários da Equipe:</span><strong class="red">- R$ ' + d.salaries.toLocaleString('pt-BR') + '</strong></div>' +
        '<div class="d-row"><span>Aluguel da Serventia:</span><strong class="red">- R$ ' + d.rent.toLocaleString('pt-BR') + '</strong></div>' +
        '<div class="d-row"><span>Sistemas e Backup:</span><strong class="red">- R$ ' + d.software.toLocaleString('pt-BR') + '</strong></div>' +
        '<div class="d-row"><span>Imposto (ISS):</span><strong class="red">- R$ ' + d.taxes.toLocaleString('pt-BR') + '</strong></div>' +
        '<hr>' +
        '<div class="d-row"><span>Lucro Líquido:</span><strong class="' + (d.profit >= 0 ? 'green' : 'red') + '">R$ ' + d.profit.toLocaleString('pt-BR') + '</strong></div>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn" data-action="start-next-day">Iniciar Próximo Dia</button></div>' +
    '</div>';
  }
  else if (CS.uiState.activeModal === 'stats') {
    var st = CS.state.stats;
    var unlocks = 0;
    CS.ACHIEVEMENTS.forEach(function(a) { if (CS.state.achievements[a.id]) unlocks++; });

    html += '<div class="modal stats-modal">' +
      '<div class="modal-head"><h2>Estatísticas & Conquistas</h2>' +
      '<button class="close-btn" data-action="close-modal">&times;</button></div>' +
      
      '<div class="stats-grid">' +
        '<div class="s-box"><div class="sv">' + CS.state.completed + '</div><div class="sl">Total Atendidos</div></div>' +
        '<div class="s-box"><div class="sv">R$ ' + st.moneyEarned.toLocaleString('pt-BR') + '</div><div class="sl">Receita Bruta Total</div></div>' +
        '<div class="s-box"><div class="sv">' + st.clientsLost + '</div><div class="sl">Clientes Perdidos</div></div>' +
        '<div class="s-box"><div class="sv">' + st.eventsTriggered + '</div><div class="sl">Eventos Enfrentados</div></div>' +
      '</div>';

    html += '<h3>Desempenho Financeiro (Últimos 7 dias)</h3><div class="chart-container">';
    if (CS.state.history.length === 0) {
      html += '<p class="empty-note">Nenhum dia concluído ainda.</p>';
    } else {
      var maxProfit = Math.max.apply(null, CS.state.history.map(function(h){return Math.max(h.profit, 100);}));
      html += '<div class="chart">';
      CS.state.history.forEach(function(h) {
        var hPct = Math.max(5, Math.min(100, Math.round((Math.abs(h.profit) / maxProfit) * 100)));
        var color = h.profit >= 0 ? 'var(--green)' : 'var(--wine)';
        html += '<div class="chart-bar-wrap" title="Dia '+h.day+': R$ '+h.profit+'">' +
          '<div class="chart-bar" style="height:'+hPct+'%; background:'+color+';"></div>' +
          '<div class="chart-lbl">D'+h.day+'</div>' +
        '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    html += '<h3>Conquistas (' + unlocks + '/' + CS.ACHIEVEMENTS.length + ')</h3>' +
      '<div class="achieve-list">';
      CS.ACHIEVEMENTS.forEach(function(a) {
        var unl = !!CS.state.achievements[a.id];
        html += '<div class="achieve-row' + (unl ? ' unlocked' : '') + '">' +
          '<div class="a-ic">' + (unl ? a.icon : '🔒') + '</div>' +
          '<div class="a-info"><strong>' + a.name + '</strong><span>' + a.desc + '</span></div>' +
        '</div>';
      });
    html += '</div>';
    
    html += '<h3>Backup de Progresso</h3>' +
      '<div class="save-tools">' +
        '<button class="btn small" data-action="export-save">Gerar Código de Save</button>' +
        '<button class="btn small secondary" data-action="import-save">Importar Código</button>' +
      '</div>';

    html += '</div></div>';
  }
  else if (CS.uiState.activeModal === 'inspector') {
    var score = CS.state.stats.corruptionScore || 0;
    html += '<div class="modal event-modal">' +
      '<h2 style="color:var(--wine); border-bottom: 2px solid var(--wine); padding-bottom: 8px;">🚨 Corregedoria do Tribunal</h2>' +
      '<p>O Inspetor-Geral acabou de chegar para uma correição surpresa nos protocolos do cartório.</p>';
      
    if (score > 0) {
      html += '<p>Ele está analisando os documentos... e <strong>encontrou ' + score + ' irregularidades graves</strong> aprovadas recentemente!</p>' +
              '<p>Isso vai custar caro. (Multa: R$ ' + (score * 1500) + ' / Perda de ' + (score * 20) + ' Estrelas)</p>';
    } else {
      html += '<p>O Inspetor analisou os protocolos e não encontrou <strong>nenhuma</strong> irregularidade. Tudo perfeito!</p>';
    }

    html += '<div class="modal-actions"><button class="btn" data-action="resolve-inspector">Entendido</button></div>' +
    '</div>';
  }

  html += '</div>';
  return html;
};

CS.renderRoster = function() {
  var busy = CS.busyEmployeeIds();
  var html = '<div class="panel"><span class="panel-tab">Corpo Funcional</span><div class="panel-body">';
  if (CS.state.employees.length === 0) html += '<p class="empty-note">Nenhum funcionário.</p>';

  CS.state.employees.forEach(function(emp) {
    var role = CS.roleByKey(emp.role);
    var isBusy = !!busy[emp.id];
    var promo = CS.canPromote(emp);
    
    html += '<div class="employee' + (isBusy ? ' busy' : '') + '"><div class="emp-header">' +
      '<div style="display:flex;gap:12px;align-items:center;"><div class="avatar-small">' + (emp.avatar||'🧑‍💼') + '</div>' +
      '<div style="width:140px;"><div class="name">' + CS.esc(emp.name) + '</div><div class="role">' + role.label + ' (R$ ' + role.salary + '/d)</div>' +
      '<div style="font-size:11px; color:#555; margin-top:2px; font-weight:bold;">Energia: ' + (emp.energy || 0) + '%</div>' +
      '<div class="xp-bar" style="height:4px; margin-top:2px;"><div style="width:' + (emp.energy || 0) + '%; background:' + ((emp.energy || 0) < 30 ? 'red' : ((emp.energy || 0) < 60 ? 'orange' : '#27ae60')) + ';"></div></div>' +
      '</div></div>' +
      '<span class="badge">' + (isBusy ? 'Ocupado' : 'Disponível') + '</span></div>';

    if (CS.nextRoleKey(emp.role)) {
      var nRole = CS.roleByKey(CS.nextRoleKey(emp.role));
      var xpNeeded = CS.empXpForPromotion(nRole.level);
      var pct = Math.min(100, Math.round((emp.empXp / xpNeeded) * 100));
      html += '<div class="emp-xp"><div class="emp-xp-bar"><div style="width:'+pct+'%"></div></div>' +
        '<span class="emp-xp-label">' + emp.empXp + '/' + xpNeeded + ' XP</span></div>';
    }

    var acts = '';
    if (promo && CS.state.money >= promo.cost) acts += '<button class="btn small" data-action="promote" data-emp="'+emp.id+'">Promover (R$ '+promo.cost.toLocaleString('pt-BR')+')</button>';
    if (!isBusy && CS.state.employees.length > 1) acts += '<button class="btn small danger" data-action="fire" data-emp="'+emp.id+'">Demitir</button>';
    if (acts) html += '<div class="emp-actions">' + acts + '</div>';
    html += '</div>';
  });

  html += '<div class="hire-list">';
  CS.ROLES.forEach(function(role) {
    var cost = CS.hireCost(role.key);
    var cap = CS.roleCapabilityLabel(role);
    html += '<div class="hire-row">' +
      '<div><span class="lbl">' + role.label + '</span><span class="rank">Custo: R$ ' + cost.toLocaleString('pt-BR') + ' · Salário: R$ ' + role.salary + '/dia<br>Capacidade: ' + cap + '</span></div>';
    
    if (role.key === 'titular') {
      html += '<button class="btn small" disabled>Único (Você)</button>';
    } else {
      html += '<button class="btn small" data-action="hire" data-role="' + role.key + '" ' + (CS.state.money >= cost ? '' : 'disabled') + '>Contratar</button>';
    }
    html += '</div>';
  });
  html += '</div></div></div>';
  return html;
};

CS.renderUpgrades = function() {
  var html = '<div class="panel"><span class="panel-tab">Melhorias</span><div class="panel-body">';
  CS.UPGRADES.forEach(function(up) {
    var owned = !!CS.state.upgrades[up.key];
    var levelOk = CS.state.level >= up.minLevel;
    var reqOk = !up.requires || !!CS.state.upgrades[up.requires];
    var locked = !owned && (!levelOk || !reqOk);

    html += '<div class="upgrade-row' + (owned ? ' purchased' : '') + (locked ? ' locked' : '') + '">' +
      '<div><span class="lbl">' + up.label + '</span>';

    if (owned) html += '<span class="rank">✓ Adquirido</span>';
    else if (!levelOk) html += '<span class="rank">Requer nível ' + up.minLevel + '</span>';
    else if (!reqOk) html += '<span class="rank">Requer: ' + up.requires + '</span>';
    else html += '<span class="rank">R$ ' + up.cost.toLocaleString('pt-BR') + ' — ' + up.desc + '</span>';

    html += '</div>';
    if (!owned && !locked) html += '<button class="btn small" data-action="buy-upgrade" data-key="' + up.key + '" ' + (CS.state.money >= up.cost ? '' : 'disabled') + '>Comprar</button>';
    html += '</div>';
  });

  html += '</div><span class="panel-tab" style="margin-top:20px;">Loja de Decorações (Ambiente 2D)</span><div class="panel-body">';
  
  CS.DECORATIONS.forEach(function(dec) {
    var owned = !!CS.state.decorations[dec.id];
    html += '<div class="upgrade-row' + (owned ? ' purchased' : '') + '">' +
      '<div><span class="lbl">' + dec.icon + ' ' + dec.label + '</span>';
      
    if (owned) html += '<span class="rank">✓ Adquirido e Instalado</span>';
    else html += '<span class="rank">R$ ' + dec.cost.toLocaleString('pt-BR') + ' — ' + dec.desc + '</span>';
    
    html += '</div>';
    if (!owned) html += '<button class="btn small" data-action="buy-decoration" data-id="' + dec.id + '" ' + (CS.state.money >= dec.cost ? '' : 'disabled') + '>Comprar</button>';
    html += '</div>';
  });

  html += '</div></div>';
  return html;
};

CS.renderCounters = function() {
  var n = CS.maxCounters();
  var busy = CS.busyEmployeeIds();
  var html = '<div class="panel"><span class="panel-tab">Painel de Guichês</span><div class="panel-body"><div class="counters">';

  for (var i = 0; i < n; i++) {
    var counter = CS.state.counters[i];
    var pending = CS.uiState.pendingResults[i];
    html += '<div class="counter">';

    if (counter && CS.state.clients[counter.clientId]) {
      var client = CS.state.clients[counter.clientId];
      var type = CS.clientTypeByKey(client.typeKey);
      var stages = CS.getClientStages(client);
      var stage = stages[client.stageIndex];

      html += '<div class="counter-head"><span>Guichê ' + (i+1) + '</span><span class="protocol">Nº ' + CS.esc(client.protocol) + '</span></div>' +
        '<div class="counter-body">';
      
      if (pending) {
        var stampText = 'Deferido';
        if (pending === 'ok') {
          if (stage.key === 'lavratura_notas' || stage.key === 'protesto_ato') stampText = 'Lavrado';
          else if (stage.key === 'registro_ri' || stage.key === 'registro_pj' || stage.key === 'assento') stampText = 'Registrado';
          else if (stage.key === 'assinatura') stampText = 'Assinado';
          else if (stage.key === 'certidao' || stage.key === 'traslado') stampText = 'Emitido';
        } else {
          stampText = 'Exigência';
        }
        html += '<div class="stamp"><div class="mark ' + pending + '">' + stampText + '</div></div>';
      }

      html += '<div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;"><div class="avatar-small">' + (client.avatar||'👤') + '</div>' +
        '<div><div class="client-type">' + type.label + (type.reqDocs ? ' <button style="background:none;border:none;cursor:pointer;padding:0;font-size:16px;" data-action="info-docs" data-type="' + type.key + '">ℹ️</button>' : '') + '</div><div class="client-desc">' + type.desc + '</div></div></div>';
        
      html += '<div class="stage-track">';
      for (var s = 0; s < stages.length; s++) {
        var cls = s < client.stageIndex ? 'done' : (s === client.stageIndex ? 'current' : '');
        html += '<div class="stage-dot ' + cls + '" title="' + stages[s].label + '"></div>';
      }
      html += '</div><div class="stage-name">Etapa ' + (client.stageIndex+1) + '/' + stages.length + ' — ' + stage.label + '</div>' +
        '<div class="stage-req">Requer: ' + stage.roleLabel + '</div>';

      var eligible = CS.state.employees.filter(function(e) { return e.level >= stage.minLevel && (!busy[e.id] || e.id === counter.employeeId); });
      html += '<select class="assign" data-action="assign" data-idx="' + i + '"><option value="">— atribuir funcionário —</option>';
      eligible.forEach(function(e) {
        html += '<option value="' + e.id + '"' + (counter.employeeId === e.id ? ' selected' : '') + '>' + (e.avatar||'🧑‍💼') + ' ' + CS.esc(e.name) + ' (' + CS.roleByKey(e.role).label + ')</option>';
      });
      html += '</select><div class="counter-actions"><button class="btn" data-action="process" data-idx="' + i + '" ' + (counter.employeeId && !pending ? '' : 'disabled') + '>Processar etapa</button></div></div>';
    } else {
      if (counter) CS.state.counters[i] = null;
      var canCall = CS.state.queue.length > 0;
      html += '<div class="counter-head"><span>Guichê ' + (i+1) + '</span></div><div class="counter-empty"><span>Guichê livre.</span>' +
        '<button class="btn secondary" data-action="call" data-idx="' + i + '" ' + (canCall ? '' : 'disabled') + '>Chamar cliente</button></div>';
    }
    html += '</div>';
  }
  html += '</div></div></div>';
  return html;
};

CS.renderQueueAndLog = function() {
  var html = '<div class="panel"><span class="panel-tab">Fila de Espera</span><div class="panel-body">';
  if (CS.state.queue.length === 0) html += '<p class="empty-note">Nenhum cliente aguardando no momento.</p>';

  CS.state.queue.forEach(function(id) {
    var c = CS.state.clients[id];
    if (!c) return;
    var type = CS.clientTypeByKey(c.typeKey);
    var patiencePct = Math.max(0, Math.round(((c.patience - c.waitedTicks) / c.patience) * 100));
    var pColor = patiencePct > 60 ? 'var(--green)' : (patiencePct > 30 ? 'var(--gold)' : 'var(--wine)');

    html += '<div class="ticket">' +
      '<div class="tinfo"><div class="avatar-small">' + (c.avatar||'👤') + '</div><div><div class="tt">' + type.label + '</div><div class="tp">Nº ' + CS.esc(c.protocol) + '</div></div></div>' +
      '<div class="patience-bar" title="Paciência: ' + patiencePct + '%"><div class="patience-fill" style="width:' + patiencePct + '%;background:' + pColor + '"></div></div>' +
    '</div>';
  });

  html += '<div class="ledger" aria-live="polite">';
  if (CS.state.log.length === 0) html += '<div class="ledger-entry">Livro de ocorrências vazio.</div>';
  CS.state.log.forEach(function(entry) {
    html += '<div class="ledger-entry ' + (entry.kind || '') + '">' + (entry.protocol ? '<span class="p">Nº ' + CS.esc(entry.protocol) + '</span>' : '') + CS.esc(entry.text) + '</div>';
  });
  html += '</div></div></div>';
  return html;
};

CS.render = function() {
  document.documentElement.setAttribute('data-theme', CS.state.darkMode ? 'dark' : 'light');
  var activeTab = CS.uiState.activeTab || 'guiches';
  var app = document.getElementById('app');

  app.innerHTML =
    CS.renderHeader() +
    CS.renderTutorialBanner() +
    CS.renderMobileTabs() +
    '<div class="layout">' +
      '<div class="left-col' + (activeTab === 'equipe' ? ' tab-active' : '') + '" data-panel="equipe">' +
        CS.renderRoster() + CS.renderUpgrades() +
      '</div>' +
      '<div class="' + (activeTab === 'guiches' ? 'tab-active' : '') + '" data-panel="guiches">' +
        CS.renderCounters() +
      '</div>' +
      '<div class="' + (activeTab === 'fila' ? 'tab-active' : '') + '" data-panel="fila" id="panel-fila">' +
        CS.renderQueueAndLog() +
      '</div>' +
    '</div>' +
    (CS.uiState.levelUpLevel ? '<div class="level-up-banner"><div class="level-up-content"><div class="level-up-icon">🎉</div><div class="level-up-text"><strong>Nível '+CS.uiState.levelUpLevel+'!</strong><span>Novos benefícios desbloqueados.</span></div><button class="btn small" data-action="dismiss-levelup">OK</button></div></div>' : '') +
    CS.renderAchievementToast() +
    CS.renderModals() +
    '<footer class="foot">Baseado na Lei 8.935/1994 — simulação livre e fictícia para fins de jogo. ' +
      '<button class="reset-link" data-action="reset">Reiniciar simulação</button>' +
    '</footer>';

  // Sincroniza o Visual Office após renderizar a DOM
  CS.updateOfficeSprites();
};

CS.renderTick = function() {
  var header = document.getElementById('main-header');
  if (header) {
    var dummy = document.createElement('div');
    dummy.innerHTML = CS.renderHeader();
    header.parentNode.replaceChild(dummy.firstChild, header);
  }
  var fila = document.getElementById('panel-fila');
  if (fila) {
    fila.innerHTML = CS.renderQueueAndLog();
  }
  if (CS.updateOfficeSprites) CS.updateOfficeSprites();
};

window.CS = CS;
