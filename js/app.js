/* =========================================================
   app.js — Bootstrap, event delegation e loop principal
   FASE 6: tickTime, import/export, start-next-day, 1s loop
   ========================================================= */
var CS = window.CS;

(function() {

  var app = document.getElementById('app');

  /* ---------- Event Delegation ---------- */
  app.addEventListener('click', function(e) {
    CS.initAudio();

    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    var idx, empId, key, role, tab;

    switch (action) {
      case 'hire':
        role = el.getAttribute('data-role');
        if (role) CS.hireEmployee(role);
        break;
      case 'call':
        idx = parseInt(el.getAttribute('data-idx'), 10);
        if (!isNaN(idx)) CS.callToCounter(idx);
        break;
      case 'process':
        idx = parseInt(el.getAttribute('data-idx'), 10);
        if (!isNaN(idx)) CS.processCounter(idx);
        break;
      case 'promote':
        empId = el.getAttribute('data-emp');
        if (empId) CS.promoteEmployee(empId);
        break;
      case 'fire':
        empId = el.getAttribute('data-emp');
        if (empId) CS.fireEmployee(empId);
        break;
      case 'buy-upgrade':
        key = el.getAttribute('data-key');
        if (key) CS.purchaseUpgrade(key);
        break;
      case 'buy-decoration':
        var decId = el.getAttribute('data-id');
        if (decId) CS.buyDecoration(decId);
        break;
      case 'toggle-mute':
        CS.state.muted = !CS.state.muted;
        CS.saveState();
        CS.render();
        break;
      case 'toggle-dark':
        CS.state.darkMode = !CS.state.darkMode;
        CS.saveState();
        CS.render();
        break;
      case 'toggle-open':
        CS.state.isOpen = !CS.state.isOpen;
        CS.saveState();
        CS.render();
        break;
      case 'open-vade':
        CS.uiState.activeModal = 'vade';
        CS.render();
        break;
      case 'answer-quiz':
        var isCorrect = el.getAttribute('data-correct') === 'true';
        CS.answerQuiz(isCorrect);
        break;
      case 'doc-approve':
        CS.resolveDocCheck('approve');
        break;
      case 'doc-reject':
        CS.uiState.docCheckData.showRejectReasons = true;
        CS.render();
        break;
      case 'cancel-reject':
        CS.uiState.docCheckData.showRejectReasons = false;
        CS.render();
        break;
      case 'submit-reject':
        var reason = el.getAttribute('data-reason');
        CS.resolveDocCheckWithReason(reason);
        break;
      case 'info-docs':
        var tk = el.getAttribute('data-type');
        CS.uiState.infoDocsKey = tk;
        CS.uiState.activeModal = 'info-docs';
        CS.render();
        break;
      case 'resolve-choice':
        var choiceIdx = parseInt(el.getAttribute('data-idx'), 10);
        CS.resolveChoice(choiceIdx);
        break;
      case 'resolve-inspector':
        CS.resolveInspector();
        break;
      case 'resolve-triage':
        var isTriageCorrect = el.getAttribute('data-correct') === 'true';
        CS.resolveTriage(isTriageCorrect);
        break;
      case 'answer-inspector':
        var isInspectorCorrect = el.getAttribute('data-correct') === 'true';
        CS.resolveInspectorQuiz(isInspectorCorrect);
        break;
      case 'tab':
        tab = el.getAttribute('data-tab');
        if (tab) { CS.uiState.activeTab = tab; CS.render(); }
        break;
      case 'skip-tutorial':
        CS.skipTutorial();
        break;
      case 'dismiss-levelup':
        CS.uiState.levelUpLevel = null;
        CS.render();
        break;
      case 'open-stats':
        CS.uiState.activeModal = 'stats';
        CS.render();
        break;
      case 'close-modal':
        CS.uiState.activeModal = null;
        CS.render();
        break;
      case 'resolve-event':
        CS.resolveChoice(0);
        break;
      case 'start-next-day':
        CS.startNextDay();
        break;
      case 'export-save':
        var code = CS.exportSave();
        prompt('Copie o código de save abaixo:', code);
        break;
      case 'import-save':
        var input = prompt('Cole o código de save aqui:');
        if (input) {
          CS.importSave(input);
        }
        break;
      case 'reset':
        CS.resetGame();
        break;
    }
  });

  app.addEventListener('change', function(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.getAttribute('data-action') === 'assign') {
      var idx = parseInt(el.getAttribute('data-idx'), 10);
      if (!isNaN(idx)) CS.assignEmployee(idx, el.value);
    }
  });

  /* ---------- Boot ---------- */
  CS.loadState(function(loaded) {
    CS.state = loaded;
    document.documentElement.setAttribute('data-theme', CS.state.darkMode ? 'dark' : 'light');

    if (CS.state.log.length === 0) {
      CS.addLog('Bem-vindo(a) ao Cartório Central de Vila Nova. Contrate a equipe, chame os clientes e conduza cada atendimento.', 'info');
    }

    CS.setupOfficeDOM();
    CS.render();

    // Loop principal (1s em vez de 7s)
    setInterval(function() {
      // Pausa o jogo (e evita que a tela pisque) se houver qualquer janela modal aberta
      if (CS.uiState.activeModal) return;

      if (CS.state.isOpen) {
        CS.tickTime();
        CS.spawnClient();
        CS.tickPatience();
        CS.tickRandomEvent();
      }
      
      CS.checkAchievements();
      
      // Correção: não apaga a tela (render) se o usuário estiver com o dropdown aberto
      var activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'SELECT') {
        // Apenas atualiza os bonequinhos, mas não destroi o HTML onde ele está clicando
        if (CS.updateOfficeSprites) CS.updateOfficeSprites();
      } else {
        CS.render();
      }
      
      CS.saveState();
    }, 1000);

    if (CS.state.queue.length === 0 && Object.keys(CS.state.clients).length === 0) {
      CS.spawnClient();
      CS.render();
    }
  });

  /* ---------- PWA Service Worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js').catch(function(){});
    });
  }

})();
