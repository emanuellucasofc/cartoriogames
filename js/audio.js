/* =========================================================
   audio.js — Sons procedurais via Web Audio API
   Sem dependências externas — tudo gerado em código
   ========================================================= */
var CS = window.CS;

CS.audioCtx = null;

CS.initAudio = function() {
  if (CS.audioCtx) return;
  try {
    CS.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { /* browser não suporta */ }
};

/* Som do carimbo — burst de ruído curto */
CS.playStampSound = function() {
  if (!CS.audioCtx || CS.state.muted) return;
  var ctx = CS.audioCtx;
  var now = ctx.currentTime;
  var len = Math.floor(ctx.sampleRate * 0.07);
  var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
  }
  var src = ctx.createBufferSource();
  src.buffer = buffer;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + 0.07);
};

/* Som de sucesso — dois tons ascendentes */
CS.playSuccessSound = function() {
  if (!CS.audioCtx || CS.state.muted) return;
  var ctx = CS.audioCtx;
  var now = ctx.currentTime;
  [520, 780].forEach(function(freq, i) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, now + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.09);
    osc.stop(now + i * 0.09 + 0.14);
  });
};

/* Som de falha — tom descendente */
CS.playFailSound = function() {
  if (!CS.audioCtx || CS.state.muted) return;
  var ctx = CS.audioCtx;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.linearRampToValueAtTime(160, now + 0.2);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
};

/* Som de level up — escala ascendente */
CS.playLevelUpSound = function() {
  if (!CS.audioCtx || CS.state.muted) return;
  var ctx = CS.audioCtx;
  var now = ctx.currentTime;
  [523, 659, 784, 1047].forEach(function(freq, i) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.10, now + i * 0.11);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.11);
    osc.stop(now + i * 0.11 + 0.18);
  });
};

/* Som de contratação / compra — click confirmação */
CS.playHireSound = function() {
  if (!CS.audioCtx || CS.state.muted) return;
  var ctx = CS.audioCtx;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.10, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
};

/* Som de cliente indo embora — tom triste descendente */
CS.playClientLeaveSound = function() {
  if (!CS.audioCtx || CS.state.muted) return;
  var ctx = CS.audioCtx;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.28);
};

window.CS = CS;
