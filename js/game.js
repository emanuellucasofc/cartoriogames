/* =========================================================
   game.js — Lógica do jogo (ações e mecânicas)
   FASE 6: tickTime, endOfDay, salários, ajustes de spawn
   ========================================================= */
var CS = window.CS;

/* ---------- Guichês ---------- */
CS.maxCounters = function() {
  var n = CS.MAX_COUNTERS_BASE;
  if (CS.state.upgrades.guiche4) n++;
  if (CS.state.upgrades.guiche5) n++;
  return n;
};

CS.busyEmployeeIds = function() {
  var busy = {};
  CS.state.counters.forEach(function(c) {
    if (c && c.employeeId) busy[c.employeeId] = true;
  });
  return busy;
};

/* ---------- Reputação ---------- */
CS.changeReputation = function(delta) {
  CS.state.reputation = Math.max(0, Math.min(100, CS.state.reputation + delta));
};

/* ---------- Seleção de tipo ---------- */
CS.pickClientType = function() {
  var rep = CS.state.reputation;
  var types = CS.CLIENT_TYPES;
  if (rep > 70) {
    var weights = types.map(function(t) { return t.pay; });
    return weightedRandom(types, weights);
  } else if (rep < 30) {
    var maxPay = Math.max.apply(null, types.map(function(t) { return t.pay; }));
    var weights = types.map(function(t) { return maxPay - t.pay + 20; });
    return weightedRandom(types, weights);
  }
  return types[Math.floor(Math.random() * types.length)];
};

function weightedRandom(items, weights) {
  var total = weights.reduce(function(a, b) { return a + b; }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/* ---------- Relógio e Fim de Dia ---------- */
CS.tickTime = function() {
  var t = CS.state.time;
  t.minute += 1; // 1 segundo na vida real = 1 minuto no jogo (Dia dura 9 minutos reais)
  if (t.minute >= 60) {
    t.minute = 0;
    t.hour++;
  }
  
  if (t.hour >= 18) {
    CS.endOfDay();
  }
  
  // Fase 11: Regeneração de Energia
  var busyMap = CS.busyEmployeeIds();
  var regen = (CS.state.upgrades && CS.state.upgrades.cafe) ? 5 : 2;
  CS.state.employees.forEach(function(emp) {
    if (!busyMap[emp.id]) {
      emp.energy = Math.min(100, (emp.energy || 0) + regen);
    }
  });
};

CS.endOfDay = function() {
  var s = CS.state;
  var totalSalaries = 0;
  var servedToday = s.stats.moneyEarned;
  
  if (!s.dayIncome) s.dayIncome = 0;
  if (!s.dayServed) s.dayServed = 0;

  s.employees.forEach(function(emp) {
    if (emp.role !== 'titular') {
      var role = CS.roleByKey(emp.role);
      totalSalaries += role.salary;
    }
  });

  var dailyRent = 250;
  var softwareLicense = 50;
  var issTax = Math.round(s.dayIncome * 0.05); // ISS (5%)
  
  var totalExpenses = totalSalaries + dailyRent + softwareLicense + issTax;

  var lostInQueue = s.queue.length;
  if (lostInQueue > 0) {
    CS.changeReputation(- (lostInQueue * 2));
    CS.addLogEntry('', lostInQueue + ' clientes foram dispensados devido ao fim do expediente.', 'no');
    s.stats.clientsLost += lostInQueue;
  }
  
  s.queue.forEach(function(id) { delete s.clients[id]; });
  s.queue = [];

  s.money -= totalExpenses;
  
  if (s.money < 0) {
    CS.changeReputation(-10);
    CS.addLogEntry('', 'Fundo de caixa negativo! A Corregedoria aplicou uma penalidade.', 'no');
  }
  
  var profit = s.dayIncome - totalExpenses;
  s.history.push({
    day: s.time.day,
    revenue: s.dayIncome,
    expenses: totalExpenses,
    profit: profit,
    served: s.dayServed
  });
  
  if (s.history.length > 7) s.history.shift();

  CS.uiState.daySummary = {
    day: s.time.day,
    revenue: s.dayIncome,
    salaries: totalSalaries,
    rent: dailyRent,
    software: softwareLicense,
    taxes: issTax,
    expenses: totalExpenses,
    profit: profit,
    served: s.dayServed
  };
  
  s.dayIncome = 0;
  s.dayServed = 0;

  CS.uiState.activeModal = 'day-end';
  CS.saveState();
  CS.render();
};

CS.startNextDay = function() {
  CS.uiState.activeModal = null;
  CS.uiState.daySummary = null;
  
  var t = CS.state.time;
  t.day++;
  t.hour = 9;
  t.minute = 0;
  
  // Sortear clima do dia
  var weathers = Object.keys(CS.WEATHER_TYPES);
  var roll = Math.random();
  if (roll < 0.25) CS.state.weather = 'rainy';
  else CS.state.weather = 'sunny';

  var wInfo = CS.WEATHER_TYPES[CS.state.weather];
  CS.addLog('Início do Dia ' + t.day + ' — ' + wInfo.icon + ' Tempo ' + wInfo.label, 'info');
  
  // Eventos de falência
  if (CS.state.money < 0) {
    CS.changeReputation(-20);
    CS.addLog('ATENÇÃO: Conta no vermelho! Reputação caiu bruscamente.', 'no');
  }

  CS.saveState();
  CS.render();
};


/* ---------- Clientes ---------- */
CS.spawnClient = function() {
  // Como o dia agora dura 9 minutos reais (540s), reduzimos a chance para 4% por tick
  // Isso dá uma média de ~20 clientes espalhados ao longo do dia inteiro.
  var wInfo = CS.WEATHER_TYPES[CS.state.weather];
  var chance = 0.04 * wInfo.spawnMod;
  if (Math.random() > chance) return;
  if (CS.state.queue.length >= 6) return;
  
  var type = CS.pickClientType();
  if (type.key === 'casamento' && (!CS.state.upgrades || !CS.state.upgrades.casamento)) {
    // Re-pick if VIP chosen but no upgrade
    type = CS.CLIENT_TYPES[0]; // Fallback
  }
  var c = CS.mkClient(type);
  CS.state.clients[c.id] = c;
  CS.state.queue.push(c.id);
  CS.addLogEntry(c.protocol, 'Cliente chega para ' + type.label + '.', 'info');
  
  // Vade Mecum - Desbloqueio automático
  if (CS.GLOSSARY[type.key] && CS.state.unlockedTerms.indexOf(type.key) === -1) {
    CS.state.unlockedTerms.push(type.key);
    CS.addLog('📖 Novo termo desbloqueado no Vade Mecum: ' + CS.GLOSSARY[type.key].title, 'ok');
  }
};

CS.callToCounter = function(counterIndex) {
  if (CS.state.counters[counterIndex]) return;
  if (CS.state.queue.length === 0) return;
  var clientId = CS.state.queue.shift();
  CS.state.counters[counterIndex] = { clientId: clientId, employeeId: null };
  CS.advanceTutorial('call');
  CS.saveState();
  CS.render();
};

/* ---------- Paciência ---------- */
CS.tickPatience = function() {
  var lost = [];
  var wInfo = CS.WEATHER_TYPES[CS.state.weather];
  
  // Calcular bônus das decorações
  var decBonus = 0;
  if (CS.state.decorations.water) decBonus += 0.10;
  if (CS.state.decorations.painting) decBonus += 0.10;
  if (CS.state.decorations.sofa) decBonus += 0.20;
  if (CS.state.decorations.plant_1) decBonus += 0.05;
  if (CS.state.decorations.plant_2) decBonus += 0.05;

  for (var i = CS.state.queue.length - 1; i >= 0; i--) {
    var id = CS.state.queue[i];
    var client = CS.state.clients[id];
    if (!client) continue;
    
    // Calcula paciência máxima ajustada (reduz com chuva, aumenta com decorações)
    var effectivePatience = client.patience * (1 + decBonus) / wInfo.patienceMod;

    client.waitedTicks++;
    if (client.waitedTicks >= effectivePatience) {
      lost.push(id);
      CS.state.queue.splice(i, 1);
      var type = CS.clientTypeByKey(client.typeKey);
      CS.addLogEntry(client.protocol, 'Cliente (' + type.label + ') foi embora — paciência esgotada!', 'no');
      delete CS.state.clients[id];
      CS.changeReputation(-5);
      CS.state.stats.clientsLost++;
    }
  }
  if (lost.length > 0) CS.playClientLeaveSound();
  return lost.length > 0;
};

/* ---------- Atribuição ---------- */
CS.assignEmployee = function(counterIndex, employeeId) {
  var counter = CS.state.counters[counterIndex];
  if (!counter) return;
  counter.employeeId = employeeId || null;
  CS.advanceTutorial('assign');
  CS.saveState();
  CS.render();
};

/* ---------- Processamento ---------- */
CS.successChance = function(employee, stage) {
  var over = employee.level - stage.minLevel;
  var chance = 0.52 + over * 0.15 + (CS.state.level - 1) * 0.03;
  if (CS.state.upgrades.sistemaDigital) chance += 0.10;
  
  // Fase 11: Fadiga
  if ((employee.energy || 0) < 30) chance -= 0.30;
  
  return Math.max(0.12, Math.min(0.94, chance));
};

CS.processCounter = function(counterIndex) {
  var counter = CS.state.counters[counterIndex];
  if (!counter || !counter.employeeId) return;
  if (CS.uiState.pendingResults[counterIndex]) return;

  var client = CS.state.clients[counter.clientId];
  var stages = CS.getClientStages(client);
  var stage = stages[client.stageIndex];
  var employee = null;
  for (var i = 0; i < CS.state.employees.length; i++) {
    if (CS.state.employees[i].id === counter.employeeId) employee = CS.state.employees[i];
  }
  if (!employee) return;

  CS.advanceTutorial('process');

  if (CS.state.upgrades.arquivoOrganizado && stage.key === 'qualificacao' && Math.random() < 0.30) {
    CS.uiState.pendingResults[counterIndex] = 'ok';
    CS.playStampSound();
    CS.render();
    setTimeout(function() {
      CS.addLogEntry(client.protocol, stage.label + ': Sistema automatizado concluiu a qualificação.', 'ok');
      employee.empXp += stage.minLevel * 8 + 5;
      if (employee.role === 'auxiliar' && !CS.state.achievements.fast) {
        CS.state.achievements.fast = true;
        CS.queueAchievement('fast');
      }
      advanceClient(counterIndex, client, stages, employee, counter);
      delete CS.uiState.pendingResults[counterIndex];
      CS.saveState();
      CS.render();
    }, 650);
    return;
  }

  // Fase 10 & 11: Qualificação e Triagem
  var needsAudit = (stage.key === 'qualificacao' || stage.key === 'recepcao' || stage.key === 'conferencia' || stage.key === 'prenotacao' || stage.key === 'exame_formal');
  if (needsAudit && !client.docCheckDone) {
    if (client.studyCaseId && !client.triageDone) {
      CS.uiState.triageData = { counterIndex: counterIndex, employeeId: employee.id };
      CS.uiState.activeModal = 'triage';
      CS.render();
      return;
    }
    client.docCheckDone = true;
    CS.uiState.docCheckData = { counterIndex: counterIndex, employeeId: employee.id };
    CS.uiState.activeModal = 'doc-check';
    CS.render();
    return;
  }

  // Minigame de Lavratura (Fase 3)
  var isLavratura = (stage.key === 'minuta' || stage.key === 'lavratura_notas' || stage.key === 'registro_ri' || stage.key === 'assento' || stage.key === 'registro_pj' || stage.key === 'protesto_ato');
  if (isLavratura && CS.MINIGAMES[client.typeKey] && !client.minigameDone) {
    CS.uiState.minigameData = { counterIndex: counterIndex, employeeId: employee.id, gameId: client.typeKey };
    CS.uiState.activeModal = 'minigame-lavratura';
    CS.render();
    return;
  }

  // Fase 9: Quizzes Educacionais
  if (!client.quizDone && Math.random() < 0.05 && CS.QUIZZES.length > 0) {
    client.quizDone = true;
    var quiz = CS.QUIZZES[Math.floor(Math.random() * CS.QUIZZES.length)];
    CS.uiState.quizData = { quiz: quiz, counterIndex: counterIndex, employeeId: employee.id };
    CS.uiState.activeModal = 'quiz';
    CS.render();
    return;
  }

  client.attempts++;
  var success = Math.random() < CS.successChance(employee, stage);

  CS.uiState.pendingResults[counterIndex] = success ? 'ok' : 'no';
  CS.playStampSound();
  CS.render();

  setTimeout(function() {
    if (success) {
      var msg = stage.okMsgs[Math.floor(Math.random() * stage.okMsgs.length)];
      CS.addLogEntry(client.protocol, stage.label + ': ' + msg, 'ok');
      employee.empXp += stage.minLevel * 8 + 5;
      advanceClient(counterIndex, client, stages, employee, counter);
    } else {
      var fmsg = stage.noMsgs[Math.floor(Math.random() * stage.noMsgs.length)];
      CS.addLogEntry(client.protocol, stage.label + ': ' + fmsg, 'no');
      CS.changeReputation(-1);
      CS.playFailSound();
    }
    delete CS.uiState.pendingResults[counterIndex];
    CS.saveState();
    CS.render();
  }, 650);
};

CS.answerQuiz = function(isCorrect) {
  var qData = CS.uiState.quizData;
  if (!qData) return;
  var counterIndex = qData.counterIndex;
  var counter = CS.state.counters[counterIndex];
  if (!counter) {
    CS.uiState.activeModal = null;
    CS.uiState.quizData = null;
    CS.render();
    return;
  }
  
  var client = CS.state.clients[counter.clientId];
  var stages = CS.getClientStages(client);
  var stage = stages[client.stageIndex];
  var employee = null;
  for (var i = 0; i < CS.state.employees.length; i++) {
    if (CS.state.employees[i].id === qData.employeeId) employee = CS.state.employees[i];
  }
  
  // Desbloqueia termo no vade mecum, se houver
  var unlock = qData.quiz.unlocks;
  if (unlock && CS.state.unlockedTerms.indexOf(unlock) === -1) {
    CS.state.unlockedTerms.push(unlock);
    CS.addLog('📖 Novo termo desbloqueado no Vade Mecum: ' + CS.GLOSSARY[unlock].title, 'info');
  }

  CS.uiState.activeModal = null;
  CS.uiState.quizData = null;
  
  CS.uiState.pendingResults[counterIndex] = isCorrect ? 'ok' : 'no';
  CS.playStampSound();
  CS.render();

  setTimeout(function() {
    if (isCorrect && employee) {
      CS.addLogEntry(client.protocol, 'Você acertou a qualificação! Etapa concluída com sucesso.', 'ok');
      employee.empXp += stage.minLevel * 15 + 10; // Bônus extra por acertar o quiz
      advanceClient(counterIndex, client, stages, employee, counter);
    } else {
      CS.addLogEntry(client.protocol, 'Você errou a qualificação! O cliente caiu em exigência.', 'no');
      CS.changeReputation(-2);
      CS.playFailSound();
    }
    delete CS.uiState.pendingResults[counterIndex];
    CS.saveState();
    CS.render();
  }, 650);
};

CS.resolveDocCheck = function(action) {
  var data = CS.uiState.docCheckData;
  if (!data) return;
  var counterIndex = data.counterIndex;
  var counter = CS.state.counters[counterIndex];
  
  if (!counter) {
    CS.uiState.activeModal = null;
    CS.uiState.docCheckData = null;
    CS.render();
    return;
  }
  
  var client = CS.state.clients[counter.clientId];
  var stages = CS.getClientStages(client);
  var stage = stages[client.stageIndex];
  var employee = CS.state.employees.find(function(e) { return e.id === data.employeeId; });
  
  var isMissing = client.docsStatus === 'flawed';
  var isApproved = action === 'approve';

  CS.uiState.activeModal = null;
  CS.uiState.docCheckData = null;
  CS.uiState.pendingResults[counterIndex] = isApproved ? 'ok' : 'no';
  
  if (isApproved) CS.playStampSound();
  CS.render();

  setTimeout(function() {
    if (isApproved && !isMissing) {
      CS.addLogEntry(client.protocol, 'Documentação em ordem. Avançando etapa.', 'ok');
      if (employee) employee.empXp += stage.minLevel * 10 + 5;
      advanceClient(counterIndex, client, stages, employee, counter);
    } 
    else if (!isApproved && isMissing) {
      CS.addLogEntry(client.protocol, 'Você barrou documentos incompletos! Cliente em exigência.', 'info');
      CS.changeReputation(1);
      CS.playFailSound();
      counter.clientId = null;
    }
    else if (!isApproved && !isMissing) {
      CS.addLogEntry(client.protocol, 'Exigência indevida! A documentação estava correta. Cliente furioso.', 'no');
      CS.changeReputation(-3);
      CS.playFailSound();
      counter.clientId = null;
    }
    else if (isApproved && isMissing) {
      CS.addLogEntry(client.protocol, 'Você aprovou documentação irregular! Risco assumido.', 'no');
      if (employee) employee.empXp += stage.minLevel * 10;
      advanceClient(counterIndex, client, stages, employee, counter);
      
      CS.addLog('Propina (R$ 200) pela vista grossa. Risco de Corregedoria aumentado!', 'info');
      CS.state.money += 200;
      CS.state.stats.corruptionScore = (CS.state.stats.corruptionScore || 0) + 1;
    }
    
    delete CS.uiState.pendingResults[counterIndex];
    CS.saveState();
    CS.render();
  }, 800);
};

CS.resolveDocCheckWithReason = function(reason) {
  var data = CS.uiState.docCheckData;
  if (!data) return;
  var counterIndex = data.counterIndex;
  var counter = CS.state.counters[counterIndex];
  
  if (!counter) {
    CS.uiState.activeModal = null;
    CS.uiState.docCheckData = null;
    CS.render();
    return;
  }
  
  var client = CS.state.clients[counter.clientId];
  var isMissing = client.docsStatus === 'flawed';
  
  CS.uiState.activeModal = null;
  CS.uiState.docCheckData = null;
  CS.uiState.pendingResults[counterIndex] = 'no';
  CS.render();

  setTimeout(function() {
    if (!isMissing) {
      CS.addLogEntry(client.protocol, 'Exigência indevida! A documentação estava correta. Cliente furioso.', 'no');
      CS.changeReputation(-3);
      CS.playFailSound();
      counter.clientId = null;
    } else {
      if (client.flawCategory === reason) {
        CS.addLogEntry(client.protocol, 'Exigência exata! Você fundamentou a recusa perfeitamente.', 'ok');
        CS.changeReputation(2);
        CS.playStampSound();
        counter.clientId = null;
      } else {
        CS.addLogEntry(client.protocol, 'Você barrou os documentos, mas o motivo da exigência estava incorreto!', 'info');
        CS.changeReputation(-1);
        CS.playFailSound();
        counter.clientId = null;
      }
    }
    
    delete CS.uiState.pendingResults[counterIndex];
    CS.saveState();
    CS.render();
  }, 800);
};


function advanceClient(counterIndex, client, stages, employee, counter) {
  // Fase 11: Drenar Energia
  if (employee) employee.energy = Math.max(0, (employee.energy || 0) - 15);

  client.stageIndex++;
  if (client.stageIndex >= stages.length) {
    var type = CS.clientTypeByKey(client.typeKey);
    
    var finalPay = type.pay;
    if (client.typeKey === 'imoveis' || client.typeKey === 'notas') {
      var propValue = Math.floor(Math.random() * 400000) + 100000;
      var emolumentos = Math.floor(propValue * 0.005); // 0.5% do valor do imóvel
      finalPay = Math.max(type.pay, emolumentos);
      CS.addLogEntry(client.protocol, 'Base de cálculo (imóvel): R$ ' + propValue.toLocaleString('pt-BR') + '. Emolumentos calculados: R$ ' + finalPay.toLocaleString('pt-BR'), 'info');
    }
    
    CS.state.money += finalPay;
    CS.state.stats.moneyEarned += finalPay;
    if (!CS.state.dayIncome) CS.state.dayIncome = 0;
    CS.state.dayIncome += finalPay;
    
    CS.state.completed++;
    if (!CS.state.dayServed) CS.state.dayServed = 0;
    CS.state.dayServed++;

    var xpGain = Math.round(finalPay / 8);
    CS.state.xp += xpGain;
    
    var repGain = 3 + Math.round(finalPay / 40);
    CS.changeReputation(repGain);
    
    CS.addLogEntry(client.protocol,
      'Atendimento concluído (' + type.label + '). +R$' + finalPay.toLocaleString('pt-BR') + ' / +' + xpGain + ' XP / +' + repGain + '★', 'ok');
    CS.playSuccessSound();

    while (CS.state.xp >= CS.xpForLevel(CS.state.level)) {
      CS.state.xp -= CS.xpForLevel(CS.state.level);
      CS.state.level++;
      CS.addLog('O cartório subiu para o nível ' + CS.state.level + '!', 'info');
      CS.uiState.levelUpLevel = CS.state.level;
      CS.playLevelUpSound();
      setTimeout(function() {
        CS.uiState.levelUpLevel = null;
        CS.render();
      }, 3500);
    }

    delete CS.state.clients[client.id];
    CS.state.counters[counterIndex] = null;
  } else {
    var nextStage = stages[client.stageIndex];
    if (employee.level < nextStage.minLevel) counter.employeeId = null;
  }
}

/* ---------- RH & Upgrades ---------- */
CS.hireCost = function(roleKey) {
  var role = CS.roleByKey(roleKey);
  var count = CS.state.hireCounts[roleKey] || 0;
  return Math.round(role.baseCost * Math.pow(1.32, count));
};

CS.hireEmployee = function(roleKey) {
  var role = CS.roleByKey(roleKey);
  var cost = CS.hireCost(roleKey);
  if (CS.state.money < cost) return;
  CS.state.money -= cost;
  CS.state.hireCounts[roleKey] = (CS.state.hireCounts[roleKey] || 0) + 1;
  var emp = CS.mkEmployee(roleKey);
  CS.state.employees.push(emp);
  CS.addLog(emp.name + ' foi contratado(a) como ' + role.label + '.', 'info');
  CS.playHireSound();
  CS.advanceTutorial('hire');
  CS.saveState();
  CS.render();
};

CS.buyDecoration = function(id) {
  var dec = null;
  for (var i=0; i<CS.DECORATIONS.length; i++) {
    if (CS.DECORATIONS[i].id === id) dec = CS.DECORATIONS[i];
  }
  if (!dec || CS.state.decorations[id] || CS.state.money < dec.cost) return;

  CS.state.money -= dec.cost;
  CS.state.decorations[id] = true;
  CS.addLog('Comprou decoração: ' + dec.label, 'info');
  CS.saveState();
  CS.render();
};

CS.canPromote = function(emp) {
  var nextKey = CS.nextRoleKey(emp.role);
  if (!nextKey) return null;
  var nextRole = CS.roleByKey(nextKey);
  var xpNeeded = CS.empXpForPromotion(nextRole.level);
  var cost = Math.round(nextRole.baseCost * CS.PROMOTION_COST_FACTOR);
  if (emp.empXp < xpNeeded) return null;
  return { nextKey: nextKey, nextRole: nextRole, cost: cost, xpNeeded: xpNeeded };
};

CS.promoteEmployee = function(empId) {
  var emp = null;
  for (var i = 0; i < CS.state.employees.length; i++) {
    if (CS.state.employees[i].id === empId) { emp = CS.state.employees[i]; break; }
  }
  if (!emp) return;
  var info = CS.canPromote(emp);
  if (!info || CS.state.money < info.cost) return;
  CS.state.money -= info.cost;
  var oldRole = CS.roleByKey(emp.role);
  emp.role = info.nextKey;
  emp.level = info.nextRole.level;
  emp.empXp = 0;
  CS.addLog(emp.name + ' foi promovido(a) de ' + oldRole.label + ' para ' + info.nextRole.label + '!', 'info');
  CS.playHireSound();
  CS.saveState();
  CS.render();
};

CS.fireCost = function(emp) { return Math.round(CS.roleByKey(emp.role).baseCost * CS.FIRE_COST_FACTOR); };

CS.fireEmployee = function(empId) {
  if (CS.state.employees.length <= 1) return;
  var busy = CS.busyEmployeeIds();
  var emp = null, empIdx = -1;
  for (var i = 0; i < CS.state.employees.length; i++) {
    if (CS.state.employees[i].id === empId) { emp = CS.state.employees[i]; empIdx = i; break; }
  }
  if (!emp || busy[emp.id]) return;
  var cost = CS.fireCost(emp);
  if (!confirm('Demitir ' + emp.name + ' (' + CS.roleByKey(emp.role).label + ')? Rescisão: R$ ' + cost.toLocaleString('pt-BR'))) return;
  CS.state.money -= cost;
  CS.state.employees.splice(empIdx, 1);
  CS.addLog(emp.name + ' foi desligado(a). Rescisão: R$ ' + cost + '.', 'no');
  CS.saveState();
  CS.render();
};

CS.canBuyUpgrade = function(upgradeKey) {
  var upgrade = null;
  for (var i = 0; i < CS.UPGRADES.length; i++) {
    if (CS.UPGRADES[i].key === upgradeKey) { upgrade = CS.UPGRADES[i]; break; }
  }
  if (!upgrade || CS.state.upgrades[upgradeKey]) return null;
  if (CS.state.level < upgrade.minLevel) return null;
  if (upgrade.requires && !CS.state.upgrades[upgrade.requires]) return null;
  if (CS.state.money < upgrade.cost) return null;
  return upgrade;
};

CS.purchaseUpgrade = function(upgradeKey) {
  var upgrade = CS.canBuyUpgrade(upgradeKey);
  if (!upgrade) return;
  CS.state.money -= upgrade.cost;
  CS.state.upgrades[upgradeKey] = true;
  CS.addLog('Melhoria adquirida: ' + upgrade.label + '!', 'info');
  CS.playHireSound();
  CS.saveState();
  CS.render();
};

/* ---------- Eventos Aleatórios e Conquistas ---------- */
CS.tickRandomEvent = function() {
  if (CS.uiState.activeModal) return;
  
  // Fase 11: Corregedoria (Sabatina de Estudo)
  if (CS.state.level >= 2 && Math.random() < 0.005) {
    var quiz = CS.INSPECTOR_QUIZZES[Math.floor(Math.random() * CS.INSPECTOR_QUIZZES.length)];
    CS.uiState.inspectorQuizData = quiz;
    CS.uiState.activeModal = 'inspector-quiz';
    CS.playFailSound();
    CS.render();
    return;
  }

  if (Math.random() > 0.003) return; // 0.3% por segundo para manter a média de 1 a 2 eventos num dia de 9 minutos

  var valid = CS.EVENTS.filter(function(e) { return e.condition(CS.state); });
  if (valid.length === 0) return;

  var ev = valid[Math.floor(Math.random() * valid.length)];
  CS.uiState.currentEvent = ev;
  CS.uiState.activeModal = 'event';
  CS.state.stats.eventsTriggered++;
  CS.playFailSound();
  CS.render();
};

CS.resolveChoice = function(choiceIdx) {
  var ev = CS.uiState.currentEvent;
  if (ev && ev.choices && ev.choices[choiceIdx]) {
    var choice = ev.choices[choiceIdx];
    if (choice.rep) CS.changeReputation(choice.rep);
    if (choice.money) CS.state.money += choice.money;
    if (choice.xp) CS.state.xp += choice.xp;
    if (choice.action) choice.action(CS.state);
    if (choice.log) CS.addLog(choice.log, choice.rep >= 0 ? 'info' : 'no');
  } else if (ev && ev.effect) {
    // Fallback for older events if any
    ev.effect(CS.state);
    CS.addLog('Evento: ' + ev.title, 'info');
  }
  CS.uiState.activeModal = null;
  CS.saveState();
  CS.render();
};

CS.resolveInspector = function() {
  var score = CS.state.stats.corruptionScore || 0;
  if (score > 0) {
    var fine = score * 1500;
    var repLoss = score * 20;
    CS.state.money -= fine;
    CS.changeReputation(-repLoss);
    CS.addLog('A Corregedoria aplicou multa de R$ ' + fine + ' por irregularidades sistêmicas.', 'no');
    CS.playFailSound();
  } else {
    CS.changeReputation(5);
    CS.addLog('A Corregedoria elogiou suas práticas! Reputação aumentada.', 'ok');
    CS.playSuccessSound();
  }
  CS.state.stats.corruptionScore = 0;
  CS.uiState.activeModal = null;
  CS.saveState();
  CS.render();
};

CS.queueAchievement = function(id) {
  var a = CS.ACHIEVEMENTS.find(function(ach) { return ach.id === id; });
  if (!a) return;
  CS.uiState.achievementQueue.push(a);
  CS.addLog('Conquista desbloqueada: ' + a.name, 'ok');
  CS.showNextAchievement();
};

CS.showNextAchievement = function() {
  if (CS.uiState.achievementPopup) return;
  if (CS.uiState.achievementQueue.length === 0) return;
  
  CS.uiState.achievementPopup = CS.uiState.achievementQueue.shift();
  CS.playLevelUpSound();
  CS.render();
  
  setTimeout(function() {
    CS.uiState.achievementPopup = null;
    CS.render();
    CS.showNextAchievement();
  }, 4500);
};

CS.checkAchievements = function() {
  var s = CS.state;
  CS.ACHIEVEMENTS.forEach(function(a) {
    if (s.achievements[a.id]) return;
    var req = false;
    
    if (a.id === 'first_blood' && s.completed >= 1) req = true;
    else if (a.id === 'level_5' && s.level >= 5) req = true;
    else if (a.id === 'max_rep' && s.reputation >= 100) req = true;
    else if (a.id === 'full_counters' && CS.maxCounters() >= 5) req = true;
    else if (a.id === 'titular' && s.employees.some(function(e) { return e.role === 'titular'; })) req = true;
    else if (a.id === 'rich' && s.money >= 10000) req = true;
    
    if (req) {
      s.achievements[a.id] = true;
      CS.queueAchievement(a.id);
    }
  });
};

CS.resolveTriage = function(isCorrect) {
  var cIdx = CS.uiState.triageData.counterIndex;
  var c = CS.state.clients[CS.state.counters[cIdx].clientId];
  c.triageDone = true;
  CS.uiState.activeModal = null;
  
  if (isCorrect) {
    CS.addLogEntry(c.protocol, 'Triagem correta! Ato bem qualificado.', 'ok');
    CS.processCounter(cIdx);
  } else {
    CS.addLogEntry(c.protocol, 'Triagem incorreta. Cliente foi embora frustrado.', 'no');
    CS.state.reputation -= 5;
    if (CS.state.reputation < 0) CS.state.reputation = 0;
    CS.state.counters[cIdx].clientId = null;
    CS.saveState();
    CS.render();
  }
};

CS.resolveInspectorQuiz = function(isCorrect) {
  CS.uiState.activeModal = null;
  if (isCorrect) {
    CS.state.reputation += 20;
    if (CS.state.reputation > 100) CS.state.reputation = 100;
    CS.addLog('Corregedoria: Resposta correta! O Inspetor elogiou seu conhecimento.', 'ok');
    CS.playStampSound();
  } else {
    CS.state.money -= 1500;
    CS.state.reputation -= 15;
    if (CS.state.reputation < 0) CS.state.reputation = 0;
    CS.addLog('Corregedoria: Resposta errada! Multa de R$ 1500 aplicada por falha técnica.', 'no');
    CS.playFailSound();
  }
  CS.uiState.inspectorQuizData = null;
  CS.saveState();
  CS.render();
};

window.CS = CS;


CS.resolveMinigame = function() {
  var data = CS.uiState.minigameData;
  if (!data) return;
  var counterIndex = data.counterIndex;
  var counter = CS.state.counters[counterIndex];
  if (!counter) return;

  var client = CS.state.clients[counter.clientId];
  var stages = CS.getClientStages(client);
  var employee = CS.state.employees.find(function(e) { return e.id === data.employeeId; });
  
  var mg = CS.MINIGAMES[data.gameId];
  if (!mg) return;

  var isAllCorrect = true;
  for (var k in mg.answers) {
    var sel = document.getElementById('minigame-sel-' + k);
    if (!sel || parseInt(sel.value) !== mg.answers[k]) {
      isAllCorrect = false;
      break;
    }
  }

  CS.uiState.activeModal = null;
  CS.uiState.minigameData = null;

  if (isAllCorrect) {
    CS.uiState.pendingResults[counterIndex] = 'ok';
    CS.playStampSound();
    CS.render();
    setTimeout(function() {
      CS.addLogEntry(client.protocol, 'Documento preenchido perfeitamente! Avançando...', 'ok');
      if (employee) employee.empXp += 50;
      CS.state.money += 50;
      advanceClient(counterIndex, client, stages, employee, counter);
      delete CS.uiState.pendingResults[counterIndex];
      CS.saveState();
      CS.render();
    }, 800);
  } else {
    CS.uiState.pendingResults[counterIndex] = 'no';
    CS.playFailSound();
    CS.render();
    setTimeout(function() {
      CS.addLogEntry(client.protocol, 'Erro na lavratura! O documento continha vícios jurídicos. Cliente furioso.', 'no');
      CS.changeReputation(-5);
      counter.clientId = null;
      delete CS.uiState.pendingResults[counterIndex];
      CS.saveState();
      CS.render();
    }, 800);
  }
};
