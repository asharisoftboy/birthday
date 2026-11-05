/* ═══════════════════════════════════════════
   PROJECT ASHARI — THE MIDNIGHT BIRTHDAY
   Interaction Engine
   ═══════════════════════════════════════════ */
'use strict';

const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const WIB = 'Asia/Jakarta';
const SECRET_CODE = '061108';
const AGE = 18; // ← ubah ke null jika tidak ingin menampilkan usia

let currentPage = 1;
let transitioning = false;

/* ────────────────────────────────────────────
   WEB AUDIO ENGINE (tanpa autoplay — hanya
   dipicu oleh interaksi pengguna)
   ──────────────────────────────────────────── */
let actx = null;
let masterGain = null;
let muted = false;

function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    masterGain = actx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function noiseBuffer(dur) {
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
/* Whoosh tirai: noise lewat bandpass yang bergeser */
function sfxCurtain() {
  if (!ensureAudio() || muted) return;
  const t = actx.currentTime;
  const src = actx.createBufferSource(); src.buffer = noiseBuffer(2.4);
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(240, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + 1.5);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
  src.connect(bp); bp.connect(g); g.connect(masterGain);
  src.start(t); src.stop(t + 2.4);
}
/* Nada lembut (sine) dengan envelope */
function tone(freq, start, dur, vol, type) {
  const t = actx.currentTime + start;
  const o = actx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(masterGain);
  o.start(t); o.stop(t + dur + 0.05);
}
function sfxClick()  { if (!ensureAudio() || muted) return; tone(880, 0, 0.07, 0.12, 'triangle'); }
function sfxDenied() {
  if (!ensureAudio() || muted) return;
  tone(160, 0, 0.22, 0.22, 'sawtooth');
  tone(110, 0.06, 0.3, 0.22, 'sawtooth');
  tone(82, 0.14, 0.38, 0.2, 'square');
}
function sfxGranted() {
  if (!ensureAudio() || muted) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.9, 0.16, 'sine'));
}
function sfxReveal() {
  if (!ensureAudio() || muted) return;
  [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.09, 1.4, 0.12, 'sine'));
}
function sfxPop() {
  if (!ensureAudio() || muted) return;
  const t = actx.currentTime;
  const src = actx.createBufferSource(); src.buffer = noiseBuffer(0.25);
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  const g = actx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  src.connect(lp); lp.connect(g); g.connect(masterGain);
  src.start(t);
}
function sfxBlow() {
  if (!ensureAudio() || muted) return;
  const t = actx.currentTime;
  const src = actx.createBufferSource(); src.buffer = noiseBuffer(1.2);
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + 1.1);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
  src.connect(lp); lp.connect(g); g.connect(masterGain);
  src.start(t);
}

const muteBtn = $('#muteBtn');
muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.classList.toggle('muted', muted);
  if (!muted) { ensureAudio(); sfxClick(); }
});

/* ────────────────────────────────────────────
   NAVIGATION ENGINE (tanpa reload)
   ──────────────────────────────────────────── */
const overlay = $('#pageTransition');
function showPage(n, instant) {
  if (transitioning || n === currentPage) return;
  transitioning = true;
  const swap = () => {
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#page' + n).classList.add('active');
    document.body.dataset.page = n;
    currentPage = n;
    onPageEnter(n);
    overlay.classList.remove('on');
    setTimeout(() => { transitioning = false; }, 750);
  };
  if (instant) { overlay.style.transition = 'none'; swap(); requestAnimationFrame(() => { overlay.style.transition = ''; }); return; }
  overlay.classList.add('on');
  setTimeout(swap, 720);
}

/* ────────────────────────────────────────────
   PAGE 1 — GRAND ENTRANCE
   ──────────────────────────────────────────── */
const ticks = $('#clockTicks');
for (let i = 0; i < 60; i++) {
  const s = document.createElement('span');
  s.style.transform = `rotate(${i * 6}deg)`;
  if (i % 5 === 0) s.className = 'major';
  ticks.appendChild(s);
}

const fmtTime = new Intl.DateTimeFormat('id-ID', { timeZone: WIB, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function tickClock() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: WIB }));
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
  $('#handHour').style.transform   = `rotate(${(h % 12) * 30 + m * 0.5 + s * (0.5 / 60)}deg)`;
  $('#handMinute').style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
  $('#handSecond').style.transform = `rotate(${s * 6 + ms * 0.006}deg)`;
  $('#digitalClock').textContent = fmtTime.format(new Date()).replace(/\./g, ':') + ' WIB';
}
tickClock();
setInterval(tickClock, 200);

let started = false;
$('#startBtn').addEventListener('click', () => {
  if (started) return;
  started = true;
  ensureAudio();
  sfxCurtain();
  $('#theatre').classList.add('dim');
  setTimeout(() => document.body.classList.add('curtains-open'), 450);
  setTimeout(() => showPage(2), 3400);
});

/* ────────────────────────────────────────────
   PAGE 2 — SECRET ACCESS
   ──────────────────────────────────────────── */
const pinPanel = $('#pinPanel');
const pinBoxes = $$('.pin-box');
const pinProgress = $('#pinProgress');
const pinStatus = $('#pinStatus');
for (let i = 0; i < 6; i++) pinProgress.appendChild(document.createElement('i'));
const dots = $$('#pinProgress i');
let pin = '';
let pinLocked = false;

function renderPin() {
  pinBoxes.forEach((b, i) => {
    b.textContent = pin[i] ? '•' : '';
    b.classList.toggle('filled', i < pin.length);
  });
  dots.forEach((d, i) => d.classList.toggle('on', i < pin.length));
}
function resetPinUI() {
  pin = ''; pinLocked = false;
  pinPanel.classList.remove('denied', 'granted', 'shake');
  pinStatus.textContent = 'ENTER ACCESS CODE';
  renderPin();
}
$('#keypad').addEventListener('click', e => {
  const key = e.target.closest('.key');
  if (!key || pinLocked) return;
  ensureAudio();
  const k = key.dataset.key;
  if (k === 'delete') {
    pin = pin.slice(0, -1); sfxClick(); renderPin();
    return;
  }
  if (k === 'enter') {
    if (pin.length < 6) {
      pinStatus.textContent = 'CODE INCOMPLETE';
      pinPanel.classList.remove('shake'); void pinPanel.offsetWidth;
      pinPanel.classList.add('shake');
      sfxClick();
      setTimeout(() => { if (!pinLocked) pinStatus.textContent = 'ENTER ACCESS CODE'; }, 900);
      return;
    }
    pinLocked = true;
    if (pin === SECRET_CODE) {
      pinPanel.classList.add('granted');
      pinStatus.textContent = 'ACCESS GRANTED';
      sfxGranted();
      spawnGrantedParticles();
      setTimeout(() => { resetPinUI(); showPage(3); }, 2000);
    } else {
      pinPanel.classList.add('denied');
      pinPanel.classList.add('shake');
      pinStatus.textContent = 'ACCESS DENIED';
      sfxDenied();
      const go = $('#glitchOverlay');
      go.classList.remove('on'); void go.offsetWidth; go.classList.add('on');
      setTimeout(() => { go.classList.remove('on'); }, 950);
      setTimeout(() => {
        pinPanel.classList.remove('denied', 'shake');
        pin = ''; pinLocked = false;
        pinStatus.textContent = 'ENTER ACCESS CODE';
        renderPin();
      }, 1600);
    }
    return;
  }
  if (pin.length < 6) { pin += k; sfxClick(); renderPin(); }
});
function spawnGrantedParticles() {
  const holder = $('#grantedParticles');
  holder.innerHTML = '';
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('span');
    const ang = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 190;
    p.style.setProperty('--tx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--ty', Math.sin(ang) * dist + 'px');
    p.style.background = ['#EAF2FF', '#8DBBFF', '#ffffff'][i % 3];
    p.style.animationDelay = (Math.random() * 0.25) + 's';
    holder.appendChild(p);
  }
}

/* ────────────────────────────────────────────
   PAGE 3 — NAME REVEAL
   ──────────────────────────────────────────── */
const NAME = 'ASHARI';
let revealDone = false;

function resetReveal() {
  revealDone = false;
  const stage = $('#nameStage');
  stage.classList.remove('complete');
  stage.innerHTML = '';
  $('#p3Subtitle').classList.remove('show');
  $('#continueBtn').classList.remove('show');
}
function playReveal() {
  resetReveal();
  const stage = $('#nameStage');
  const letters = [];
  NAME.split('').forEach((ch, i) => {
    const el = document.createElement('span');
    el.className = 'name-letter';
    el.textContent = ch;
    const sx = (Math.random() * 2 - 1) * 55;            // vw offset
    const sy = (Math.random() * 2 - 1) * 42;            // vh offset
    const rz = (Math.random() * 2 - 1) * 260;           // rotasi
    const sc = 0.3 + Math.random() * 0.9;
    el.style.transform = `translate(${sx}vw, ${sy}vh) rotate(${rz}deg) scale(${sc})`;
    el.style.opacity = '0';
    el.style.transition = 'none';
    stage.appendChild(el);
    letters.push({ el, i, sx, sy, rz });
  });
  // fase 1: huruf muncul melayang / berputar
  requestAnimationFrame(() => requestAnimationFrame(() => {
    letters.forEach(L => {
      L.el.style.transition = `transform ${2.2 + Math.random() * 1.6}s cubic-bezier(.25,.8,.25,1), opacity .9s ease`;
      L.el.style.transform = `translate(${L.sx * 0.35}vw, ${L.sy * 0.35}vh) rotate(${L.rz * 0.4}deg) scale(.85)`;
      L.el.style.opacity = '0.85';
    });
  }));
  // fase 2: konvergensi presisi ke tengah
  setTimeout(() => {
    letters.forEach(L => {
      L.el.style.transition = `transform ${1.5 + Math.random() * 0.5}s cubic-bezier(.2,.85,.25,1), opacity .8s ease`;
      L.el.style.transform = 'translate(0,0) rotate(0deg) scale(1)';
      L.el.style.opacity = '1';
    });
  }, 2900);
  // fase 3: selesai — kilau cahaya
  setTimeout(() => {
    stage.classList.add('complete');
    sfxReveal();
    setTimeout(() => $('#p3Subtitle').classList.add('show'), 700);
    setTimeout(() => $('#continueBtn').classList.add('show'), 1500);
    revealDone = true;
  }, 4700);
}
$('#continueBtn').addEventListener('click', () => { ensureAudio(); sfxClick(); showPage(4); });

/* ────────────────────────────────────────────
   STARFIELD (halaman 3–5)
   ──────────────────────────────────────────── */
const starCv = $('#starCanvas');
const starCx = starCv.getContext('2d');
let stars = [], dust = [];
function sizeStars() {
  starCv.width = innerWidth * devicePixelRatio;
  starCv.height = innerHeight * devicePixelRatio;
  starCx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  stars = Array.from({ length: 130 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * 1.5 + 0.3, p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.5
  }));
}
sizeStars();
addEventListener('resize', sizeStars);
function drawStars(t) {
  starCx.clearRect(0, 0, innerWidth, innerHeight);
  const on = ['3', '4', '5'].includes(document.body.dataset.page);
  if (on) {
    stars.forEach(st => {
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.001 * st.s + st.p));
      starCx.globalAlpha = a;
      starCx.fillStyle = '#bcd6ff';
      starCx.beginPath(); starCx.arc(st.x, st.y, st.r, 0, 7); starCx.fill();
    });
    starCx.globalAlpha = 1;
  }
}

/* debu bercahaya halaman 3 */
const dustHolder = $('#p3Dust');
for (let i = 0; i < 16; i++) {
  const d = document.createElement('span');
  const sz = 2 + Math.random() * 4;
  d.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 30}%;width:${sz}px;height:${sz}px;
    animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 12}s;opacity:.4`;
  dustHolder.appendChild(d);
}

/* ────────────────────────────────────────────
   PAGE 4 — CELEBRATION (fireworks + confetti)
   ──────────────────────────────────────────── */
const fwCv = $('#fireworkCanvas'), fwCx = fwCv.getContext('2d');
const cfCv = $('#confettiCanvas'), cfCx = cfCv.getContext('2d');
let rockets = [], sparks = [], confetti = [];
let fwTimer = null, cfTimer = null;

function sizeFx() {
  [fwCv, cfCv].forEach(cv => {
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  });
  fwCx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  cfCx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
sizeFx();
addEventListener('resize', sizeFx);

const FW_COLORS = ['#EAF2FF', '#8DBBFF', '#164E91', '#ffffff', '#5b8fd6', '#ffd166'];
function launchRocket() {
  rockets.push({
    x: innerWidth * (0.15 + Math.random() * 0.7),
    y: innerHeight + 10,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -(6.2 + Math.random() * 2.6),
    color: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)],
    trail: []
  });
}
function explode(x, y, color) {
  const n = 42 + Math.floor(Math.random() * 26);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
    const sp = 1.6 + Math.random() * 3.4;
    sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: 0.011 + Math.random() * 0.014, color: Math.random() < 0.25 ? '#ffffff' : color, r: 1 + Math.random() * 1.8 });
  }
  sfxPop();
}
function drawFireworks() {
  fwCx.clearRect(0, 0, innerWidth, innerHeight);
  fwCx.globalCompositeOperation = 'lighter';
  rockets = rockets.filter(rk => {
    rk.trail.push({ x: rk.x, y: rk.y });
    if (rk.trail.length > 7) rk.trail.shift();
    rk.x += rk.vx; rk.y += rk.vy; rk.vy += 0.045;
    fwCx.strokeStyle = rk.color; fwCx.lineWidth = 2; fwCx.globalAlpha = 0.9;
    fwCx.beginPath();
    rk.trail.forEach((p, i) => i ? fwCx.lineTo(p.x, p.y) : fwCx.moveTo(p.x, p.y));
    fwCx.lineTo(rk.x, rk.y); fwCx.stroke();
    if (rk.vy > -1.4) { explode(rk.x, rk.y, rk.color); return false; }
    return true;
  });
  sparks = sparks.filter(sp => {
    sp.x += sp.vx; sp.y += sp.vy; sp.vx *= 0.985; sp.vy = sp.vy * 0.985 + 0.028; sp.life -= sp.decay;
    if (sp.life <= 0) return false;
    fwCx.globalAlpha = Math.max(sp.life, 0);
    fwCx.fillStyle = sp.color;
    fwCx.beginPath(); fwCx.arc(sp.x, sp.y, sp.r, 0, 7); fwCx.fill();
    return true;
  });
  fwCx.globalAlpha = 1;
  fwCx.globalCompositeOperation = 'source-over';
}
const CF_COLORS = ['#EAF2FF', '#8DBBFF', '#164E91', '#ffffff', '#b9d4ff'];
function spawnConfetti() {
  confetti.push({
    x: Math.random() * innerWidth, y: -12,
    w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
    vy: 1 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 0.8,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.14,
    color: CF_COLORS[Math.floor(Math.random() * CF_COLORS.length)],
    sway: Math.random() * Math.PI * 2, sw: 0.5 + Math.random() * 1
  });
}
function drawConfetti() {
  cfCx.clearRect(0, 0, innerWidth, innerHeight);
  confetti = confetti.filter(c => {
    c.sway += 0.03 * c.sw;
    c.x += c.vx + Math.sin(c.sway) * 0.6;
    c.y += c.vy; c.rot += c.vr;
    if (c.y > innerHeight + 20) return false;
    cfCx.save();
    cfCx.translate(c.x, c.y); cfCx.rotate(c.rot);
    cfCx.globalAlpha = 0.9;
    cfCx.fillStyle = c.color;
    cfCx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    cfCx.restore();
    return true;
  });
}

/* usia opsional */
const ageText = $('#ageText');
if (AGE != null) ageText.textContent = `TURNING ${AGE} TONIGHT`; else ageText.style.display = 'none';

/* mulai / berhentikan efek halaman 4 */
function startCelebrationFx() {
  stopCelebrationFx();
  rockets = []; sparks = []; confetti = [];
  fwTimer = setInterval(() => { if (rockets.length < 5) launchRocket(); }, 950);
  cfTimer = setInterval(() => { for (let i = 0; i < 3; i++) spawnConfetti(); }, 120);
  setTimeout(launchRocket, 400);
}
function stopCelebrationFx() {
  clearInterval(fwTimer); clearInterval(cfTimer);
  fwTimer = cfTimer = null;
  fwCx.clearRect(0, 0, innerWidth, innerHeight);
  cfCx.clearRect(0, 0, innerWidth, innerHeight);
}

/* tiup lilin */
let wishShown = false;
$('#blowBtn').addEventListener('click', () => {
  if (wishShown) return;
  wishShown = true;
  ensureAudio();
  sfxBlow();
  $('.cake').classList.add('out');
  $('#blowBtn').classList.remove('show');
  setTimeout(() => $('#wishText').classList.add('show'), 700);
  setTimeout(() => $('#lastThingBtn').classList.add('show'), 3200);
});
$('#lastThingBtn').addEventListener('click', () => { ensureAudio(); sfxClick(); showPage(5); });

function resetCelebration() {
  wishShown = false;
  $('.cake').classList.remove('out');
  $('#wishText').classList.remove('show');
  $('#lastThingBtn').classList.remove('show');
  setTimeout(() => { if (currentPage === 4) $('#blowBtn').classList.add('show'); }, 2600);
}

/* ────────────────────────────────────────────
   PAGE 5 — REPLAY
   ──────────────────────────────────────────── */
$('#replayBtn').addEventListener('click', () => {
  ensureAudio(); sfxClick();
  stopCelebrationFx();
  resetPinUI();
  started = false;
  document.body.classList.remove('curtains-open');
  $('#theatre').classList.remove('dim');
  showPage(1);
});

/* ────────────────────────────────────────────
   ROUTER: hook masuk tiap halaman
   ──────────────────────────────────────────── */
function onPageEnter(n) {
  if (n === 3) playReveal();
  if (n === 4) { resetCelebration(); startCelebrationFx(); } else stopCelebrationFx();
}

/* ────────────────────────────────────────────
   MASTER RAF LOOP (performa ringan untuk HP)
   ──────────────────────────────────────────── */
function loop(t) {
  if (document.body.dataset.page === '4') { drawFireworks(); drawConfetti(); }
  drawStars(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ────────────────────────────────────────────
   LOADER
   ──────────────────────────────────────────── */
addEventListener('load', () => {
  setTimeout(() => $('#loader').classList.add('done'), 1900);
});
setTimeout(() => $('#loader').classList.add('done'), 3200); // fallback
