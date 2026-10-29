/* 疯狂水世界 · 30 秒 Canvas 宣传片
   AI EXPERIMENT / BUILD 7.28
*/
(function () {
  'use strict';

  var W = 1920;
  var H = 1080;
  var DUR = 30;
  var canvas = document.getElementById('promo');
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('overlay');
  var startBtn = document.getElementById('start-btn');
  var query = new URLSearchParams(location.search);
  var recordMode = query.has('record');
  var noAudio = query.has('noaudio');
  var preferVp8 = query.get('codec') === 'vp8';

  var assets = {};
  var ASSET_LIST = {
    bgTitle: '../assets/bg-title.webp',
    bgHub: '../assets/bg-hub.webp',
    bgHook: '../assets/bg-hook.webp',
    bgSonar: '../assets/bg-sonar.webp',
    bgMatch: '../assets/bg-match.webp',
    tasks: '../docs/preview-tasks.webp',
    collection: '../docs/preview-collection.webp',
    market: '../docs/preview-market.webp',
    story: '../docs/preview-story.webp',
    filter: '../assets/seawater-filter.webp'
  };
  var MISSIONS = [
    ['沉城抓钩', '../assets/real/hook.webp'],
    ['废料拼图', '../assets/real/puzzle.webp'],
    ['声呐扫掠', '../assets/real/sonar.webp'],
    ['沉船切割', '../assets/real/workshop.webp'],
    ['分拣传送带', '../assets/real/storage.webp'],
    ['灯塔信号', '../assets/real/core.webp'],
    ['潮汐拖网', '../assets/real/hook.webp'],
    ['深海潜航', '../assets/collectibles/diving-helmet.webp'],
    ['码头吊装', '../assets/real/storage.webp'],
    ['黄金炮击', '../assets/collectibles/unique-v2/golden-cannon.webp']
  ];
  var ARCHIVE_IDS = [
    'rusty-watch', 'brass-compass', 'captain-log', 'diving-helmet', 'sea-bottle', 'tide-crown',
    'sonar-core', 'golden-cannon', 'eel-generator', 'captain-sword', 'moon-anchor', 'first-light',
    'storm-glass', 'sunken-piano', 'lighthouse-lens', 'porthole-shard', 'old-radio', 'crystal-radio',
    'sextant', 'brass-barometer', 'tide-clock', 'ship-bell', 'rescue-buoy', 'salt-idol',
    'deep-tape', 'morse-key', 'silver-musicbox', 'camera-lens', 'signal-flag', 'tide-organ'
  ];

  var missionImgs = [];
  var archiveImgs = [];
  var noisePattern = null;
  var raf = 0;
  var running = false;
  var startAt = 0;
  var ended = false;
  var audioCtx = null;
  var master = null;
  var audioDest = null;
  var padOsc = [];
  var nextPulse = 0;
  var recorder = null;
  var recordChunks = [];
  var recordStopping = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function buildNoise() {
    var c = document.createElement('canvas');
    c.width = 160; c.height = 160;
    var nc = c.getContext('2d');
    var data = nc.createImageData(160, 160);
    for (var i = 0; i < data.data.length; i += 4) {
      var v = Math.floor(Math.random() * 255);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v;
      data.data[i + 3] = Math.floor(Math.random() * 17);
    }
    nc.putImageData(data, 0, 0);
    noisePattern = ctx.createPattern(c, 'repeat');
  }

  function loadAll() {
    var keys = Object.keys(ASSET_LIST);
    var total = keys.length + MISSIONS.length + ARCHIVE_IDS.length;
    var done = 0;
    function tick() {
      done++;
      if (done % 8 === 0) startBtn.textContent = '装载素材 ' + Math.round(done / total * 100) + '%';
    }
    var jobs = keys.map(function (k) {
      return loadImage(ASSET_LIST[k]).then(function (img) { assets[k] = img; tick(); });
    });
    jobs = jobs.concat(MISSIONS.map(function (m) {
      return loadImage(m[1]).then(function (img) { missionImgs.push(img); tick(); });
    }));
    jobs = jobs.concat(ARCHIVE_IDS.map(function (id) {
      return loadImage('../assets/collectibles/thumbs/' + id + '.webp?v=102').then(function (img) { archiveImgs.push(img); tick(); });
    }));
    return Promise.all(jobs).then(function () {
      return document.fonts && document.fonts.ready ? document.fonts.ready : null;
    }).then(function () {
      buildNoise();
      startBtn.disabled = false;
      startBtn.textContent = recordMode ? '开始录制宣传片' : '播放宣传片';
      window.__promoReady = true;
    });
  }

  function roundPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCover(img, x, y, w, h, zoom, panX, panY, alpha) {
    if (!img || !img.naturalWidth) {
      var g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#073b45'); g.addColorStop(1, '#0b5b60');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      return;
    }
    zoom = zoom || 1;
    panX = panX || 0; panY = panY || 0;
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.drawImage(img, x + (w - dw) / 2 + panX, y + (h - dh) / 2 + panY, dw, dh);
    ctx.restore();
  }

  function drawCoverRound(img, x, y, w, h, r, zoom, alpha) {
    ctx.save();
    roundPath(x, y, w, h, r);
    ctx.clip();
    drawCover(img, x, y, w, h, zoom || 1, 0, 0, alpha);
    ctx.restore();
  }

  function text(str, x, y, size, color, weight, align, spacing) {
    ctx.save();
    ctx.font = (weight || 500) + ' ' + size + 'px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = color || '#f6fff8';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    if (spacing && ctx.letterSpacing !== undefined) ctx.letterSpacing = spacing + 'px';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function mono(str, x, y, size, color, align, spacing) {
    ctx.save();
    ctx.font = '600 ' + size + 'px "Cascadia Code", "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = color || '#ffd98d';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    if (spacing && ctx.letterSpacing !== undefined) ctx.letterSpacing = spacing + 'px';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function line(x1, y1, x2, y2, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function chip(label, x, y, color, size) {
    size = size || 12;
    ctx.save();
    ctx.font = '600 ' + size + 'px "Cascadia Code", Consolas, monospace';
    var tw = ctx.measureText(label).width;
    var w = tw + 24;
    roundPath(x, y - 14, w, 28, 14);
    ctx.fillStyle = 'rgba(245,255,249,.08)';
    ctx.fill();
    ctx.strokeStyle = color || 'rgba(245,255,249,.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color || '#d8f8ef';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 12, y + 1);
    ctx.restore();
    return w;
  }

  function drawWaves(t, y, color, amp, speed, offset) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var x = -40; x <= W + 40; x += 18) {
      var yy = y + Math.sin(x * 0.008 + t * speed + offset) * amp + Math.sin(x * 0.021 - t * speed * 1.7) * amp * 0.36;
      if (x === -40) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawVignette(strength) {
    var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.72, 'rgba(0,0,0,' + (strength || 0.24) + ')');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength || 0.24) * 1.85 + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function drawNoise(t) {
    if (!noisePattern) return;
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = noisePattern;
    ctx.translate((t * 23) % 160, (t * 16) % 160);
    ctx.fillRect(-160, -160, W + 320, H + 320);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#9ff6e9';
    for (var y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.restore();
  }

  function drawGrid(alpha, t) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(125,238,224,.14)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 80) {
      var xx = x + ((t * 22) % 80);
      ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += 80) {
      var yy = y + ((t * 16) % 80);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBubble(x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(194,255,244,.48)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(194,255,244,.08)';
    ctx.fill();
    ctx.restore();
  }

  function decodeText(str, x, y, size, color) {
    text(str, x, y, size, color, 800);
  }

  /* ── scenes ──────────────────────────────────────────────── */

  function sceneIntro(t) {
    var l = clamp(t, 0, 5);
    var enter = easeOut(l / 1.1);
    var zoom = 1.08 + l * 0.012;
    drawCover(assets.bgTitle, 0, 0, W, H, zoom, -20 + l * 5, 0);
    var g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(2,36,45,.88)');
    g.addColorStop(0.5, 'rgba(2,36,45,.38)');
    g.addColorStop(1, 'rgba(2,36,45,.05)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var g2 = ctx.createLinearGradient(0, H * 0.4, 0, H);
    g2.addColorStop(0, 'rgba(2,31,40,0)'); g2.addColorStop(1, 'rgba(2,31,40,.72)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    mono('AN EXPERIMENT IN PUBLIC / 01', 128, 190, 13, '#ffd98d', 'left', 5);
    line(128, 220, 128 + 210 * enter, 220, 'rgba(255,217,141,.8)', 1);

    ctx.save();
    ctx.globalAlpha = enter;
    var y1 = 330 + (1 - enter) * 50;
    text('一场正在发生的实验', 124, y1, 92, '#f6fff8', 800, 'left', 3);
    var y2 = 470 + (1 - enter) * 65;
    text('疯狂水世界', 120, y2, 166, '#ffdfa0', 900, 'left', 6);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = easeOut((l - 1.3) / 1.1);
    text('潮水退去之后，我们还在打捞明天。', 132, 606, 32, 'rgba(234,255,248,.84)', 500, 'left', 2);
    mono('A GAME MADE ENTIRELY BY AI · UPDATED EVERY 2 HOURS', 134, 662, 14, 'rgba(198,248,237,.72)', 'left', 3);
    ctx.restore();

    var bx = 132;
    ctx.save(); ctx.globalAlpha = easeOut((l - 2.2) / 1);
    bx += chip('10 MINIGAMES', bx, 736, 'rgba(143,235,222,.7)', 14) + 8;
    bx += chip('102 ARCHIVES', bx, 736, 'rgba(255,217,141,.75)', 14) + 8;
    chip('AI BUILT / 0 OFFLINE', bx, 736, 'rgba(255,255,255,.48)', 14);
    ctx.restore();

    drawWaves(t, 870, 'rgba(178,255,242,.2)', 13, 0.9, 1);
    drawWaves(t, 930, 'rgba(255,220,148,.12)', 9, 1.2, 2);

    ctx.save();
    ctx.globalAlpha = 0.9;
    drawBubble(1530 + Math.sin(t) * 12, 420, 80, .22);
    drawBubble(1690, 590 + Math.cos(t * 0.7) * 20, 32, .26);
    drawBubble(1430, 690, 10, .34);
    ctx.restore();

    mono('SUNKEN COAST / 2026', 128, 968, 10, 'rgba(218,252,244,.36)', 'left', 4);
    mono('30 SEC / BUILD 7.28', W - 128, 968, 10, 'rgba(218,252,244,.36)', 'right', 4);
  }

  function sceneAI(t) {
    var l = clamp(t, 0, 5);
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#041f29'); bg.addColorStop(0.52, '#062e37'); bg.addColorStop(1, '#06171e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawGrid(0.78, t);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#12b9b0';
    ctx.beginPath(); ctx.arc(1500, 150, 470, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    mono('THE METHOD / 02', 128, 190, 13, '#ffd98d', 'left', 5);
    var enter = easeOut(l / 0.9);
    ctx.save(); ctx.globalAlpha = enter;
    text('完全由 AI', 120, 318, 86, '#f6fff8', 800, 'left', 3);
    text('独立制作', 120, 420, 86, '#ffdfa0', 800, 'left', 3);
    ctx.restore();

    ctx.save(); ctx.globalAlpha = easeOut((l - 0.8) / 0.8);
    text('从第一行代码，到最后一版更新。', 124, 514, 27, 'rgba(229,255,247,.82)', 500);
    text('代码、系统、文案、界面、数值、测试。', 124, 560, 27, 'rgba(229,255,247,.82)', 500);
    text('没有人类团队，只有一次次提交。', 124, 606, 27, '#ffd98f', 700);
    ctx.restore();

    var sx = 124;
    ctx.save(); ctx.globalAlpha = easeOut((l - 1.8) / 0.7);
    text('100%', sx, 748, 68, '#8ff3e3', 900, 'left', 4);
    mono('AI-GENERATED ITERATION', sx, 792, 13, 'rgba(151,239,226,.6)', 'left', 3);
    text('02:00', sx + 300, 748, 68, '#ffd98f', 900, 'left', 2);
    mono('UPDATE CYCLE', sx + 300, 792, 13, 'rgba(255,217,143,.62)', 'left', 3);
    ctx.restore();

    // terminal
    var tx = 1010, ty = 190, tw = 770, th = 535;
    ctx.save();
    ctx.globalAlpha = easeOut((l - 0.6) / 0.8);
    roundPath(tx, ty, tw, th, 22);
    ctx.fillStyle = 'rgba(3,20,27,.9)'; ctx.fill();
    ctx.strokeStyle = 'rgba(137,255,238,.32)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(120,240,221,.08)';
    ctx.fillRect(tx, ty, tw, 42);
    ctx.fillStyle = '#ff7e62'; ctx.beginPath(); ctx.arc(tx + 24, ty + 21, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf6e'; ctx.beginPath(); ctx.arc(tx + 42, ty + 21, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#7fe1bb'; ctx.beginPath(); ctx.arc(tx + 60, ty + 21, 5, 0, 7); ctx.fill();
    mono('crazy-water-world / deploy.log', tx + 88, ty + 22, 11, 'rgba(178,255,241,.48)', 'left', 1);
    var lines = [
      ['$ init crazy-water-world', '#8ff3e3'],
      ['> world.generated()', 'rgba(228,255,248,.7)'],
      ['> systems.balanced()', 'rgba(228,255,248,.7)'],
      ['> story.written()', 'rgba(228,255,248,.7)'],
      ['> tests.passing()', '#94e9ad'],
      ['> deploy(v7.28) ✓', '#ffd98f'],
      ['> next_iteration in 02:00:00', 'rgba(255,159,118,.9)']
    ];
    var visible = Math.floor(clamp((l - 1.2) / 2.6, 0, 1) * (lines.length + 1));
    for (var i = 0; i < lines.length; i++) {
      if (i >= visible) break;
      mono(lines[i][0], tx + 34, ty + 92 + i * 48, 18, lines[i][1], 'left', 0);
    }
    if (visible < lines.length + 1) {
      var blink = Math.sin(t * 12) > 0 ? 1 : 0;
      if (blink) { ctx.fillStyle = '#8ff3e3'; ctx.fillRect(tx + 34, ty + 92 + visible * 48 - 9, 11, 19); }
    }
    ctx.restore();

    mono('COMMIT HISTORY: 28 ITERATIONS / STILL RUNNING', 128, 946, 10, 'rgba(178,255,241,.42)', 'left', 3);
  }

  function drawPhone(img, x, y, w, h, rot, alpha, label) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    roundPath(-w / 2, -h / 2, w, h, 34);
    ctx.fillStyle = '#0b2027'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.stroke();
    roundPath(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 26);
    ctx.clip();
    drawCover(img, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 1, 0, 0, 1);
    ctx.restore();
    if (label) {
      ctx.save(); ctx.globalAlpha = alpha;
      mono(label, x + w / 2, y + h + 28, 12, 'rgba(228,255,248,.55)', 'center', 3);
      ctx.restore();
    }
  }

  function sceneGame(t) {
    var l = clamp(t, 0, 5);
    drawCover(assets.bgHook, 0, 0, W, H, 1.12 + l * 0.008, 50, 0);
    var ov = ctx.createLinearGradient(0, 0, W, 0);
    ov.addColorStop(0, 'rgba(2,33,42,.94)'); ov.addColorStop(0.55, 'rgba(2,33,42,.62)'); ov.addColorStop(1, 'rgba(2,33,42,.16)');
    ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);

    mono('THE GAME / 03', 128, 175, 13, '#ffd98d', 'left', 5);
    var enter = easeOut(l / 1);
    ctx.save(); ctx.globalAlpha = enter;
    text('10 种打捞', 124, 290, 86, '#f6fff8', 800, 'left', 3);
    text('1 套世界', 124, 390, 86, '#ffdfa0', 800, 'left', 3);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = easeOut((l - 0.7) / 0.9);
    text('抓钩、拼图、声呐、切割、分拣、', 128, 480, 26, 'rgba(232,255,249,.8)', 500);
    text('灯塔、拖网、潜航、吊装、炮击。', 128, 524, 26, 'rgba(232,255,249,.8)', 500);
    text('每一局都从同一座避难所出发。', 128, 582, 26, '#ffd18e', 700);
    ctx.restore();

    var metrics = [['10', 'MINIGAMES'], ['102', 'ARCHIVES'], ['03', 'DAILY']];
    for (var i = 0; i < metrics.length; i++) {
      var mx = 128 + i * 208;
      ctx.save(); ctx.globalAlpha = easeOut((l - 1.5 - i * 0.12) / 0.7);
      text(metrics[i][0], mx, 716, 50, i === 1 ? '#ffd98f' : '#93f6e6', 900, 'left', 2);
      mono(metrics[i][1], mx, 750, 9, 'rgba(211,255,245,.55)', 'left', 2);
      ctx.restore();
    }

    drawWaves(t, 930, 'rgba(142,255,236,.13)', 11, 1, 1);

    var fade = easeOut((l - 0.5) / 0.8);
    drawPhone(assets.tasks, 1000, 190, 316, 666, -0.075, fade * 0.88, 'MISSION DECK');
    drawPhone(assets.collection, 1270, 165, 316, 666, 0.035, fade * 0.93, 'SUNKEN ARCHIVE');
    drawPhone(assets.market, 1530, 210, 300, 632, 0.09, fade * 0.86, 'OPEN MARKET');

    text('打开任务页，直接出海。', 1005, 922, 22, 'rgba(235,255,250,.8)', 600);
    mono('NO STAMINA / NO OFFLINE INCOME', 1005, 958, 9, 'rgba(206,255,245,.44)', 'left', 2);
  }

  function sceneIteration(t) {
    var l = clamp(t, 0, 5);
    drawCover(assets.bgSonar, 0, 0, W, H, 1.16 + l * 0.01, 0, 0);
    var ov = ctx.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, 'rgba(3,28,37,.92)'); ov.addColorStop(0.6, 'rgba(3,35,44,.68)'); ov.addColorStop(1, 'rgba(2,20,28,.94)');
    ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
    drawGrid(0.24, t);

    mono('THE EXPERIMENT / 04', 128, 170, 13, '#ffd98d', 'left', 5);
    ctx.save(); ctx.globalAlpha = easeOut(l / 1);
    text('每 2 小时', 122, 310, 138, '#f6fff8', 900, 'left', 6);
    text('版本向前一步', 128, 440, 56, '#ffd98f', 700, 'left', 3);
    ctx.restore();

    ctx.save(); ctx.globalAlpha = easeOut((l - 1) / 0.8);
    text('不是一次发布，而是持续 28 次以上的公开迭代。', 132, 520, 26, 'rgba(228,255,248,.82)', 500);
    text('每次更新：新玩法、扩充、修复、测试、重新部署。', 132, 566, 26, 'rgba(228,255,248,.82)', 500);
    ctx.restore();

    var lineY = 690;
    line(130, lineY, 1780, lineY, 'rgba(146,255,238,.18)', 2);
    var prog = easeInOut((l - 1.1) / 2.8);
    line(130, lineY, 130 + (1780 - 130) * prog, lineY, 'rgba(255,216,137,.9)', 3);
    var versions = ['v7.15', 'v7.16', 'v7.17', 'v7.18', 'v7.19', 'v7.20', 'v7.21', 'v7.22', 'v7.23', 'v7.24', 'v7.25', 'v7.26', 'v7.27', 'v7.28'];
    for (var i = 0; i < versions.length; i++) {
      var x = 130 + (1780 - 130) * (i / (versions.length - 1));
      var on = i / (versions.length - 1) <= prog;
      ctx.save(); ctx.globalAlpha = on ? 0.95 : 0.3;
      ctx.fillStyle = on ? '#ffd98f' : 'rgba(200,255,245,.35)';
      ctx.beginPath(); ctx.arc(x, lineY, on ? 5 : 3, 0, 7); ctx.fill();
      mono(versions[i], x, lineY + 34, 12, on ? 'rgba(255,231,170,.75)' : 'rgba(196,255,244,.26)', 'center', 0);
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = prog;
    ctx.fillStyle = '#ffd98f'; ctx.beginPath(); ctx.arc(130 + (1780 - 130) * prog, lineY, 11, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(130 + (1780 - 130) * prog, lineY, 24, 0, 7); ctx.fill();
    ctx.restore();

    ctx.save(); ctx.globalAlpha = 0.07;
    text('028', 1110, 430, 360, '#bafff3', 900, 'right', 2);
    ctx.restore();

    var bx = 130;
    bx += chip('NO OFFLINE INCOME', bx, 860, 'rgba(255,217,141,.7)', 13) + 8;
    bx += chip('NO STAMINA', bx, 860, 'rgba(147,246,230,.65)', 13) + 8;
    chip('NO FINAL BUILD', bx, 860, 'rgba(255,255,255,.45)', 13);

    ctx.save(); ctx.globalAlpha = easeOut((l - 2.4) / 0.6);
    mono('02:00:00', 1520, 566, 48, '#ffd98f', 'right', 2);
    mono('NEXT ITERATION', 1520, 600, 13, 'rgba(255,225,170,.55)', 'right', 3);
    ctx.restore();
  }

  function sceneExperiment(t) {
    var l = clamp(t, 0, 5);
    drawCover(assets.bgHub, 0, 0, W, H, 1.18 + l * 0.007, -40, 0);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(3,31,39,.9)'); g.addColorStop(0.5, 'rgba(3,31,39,.58)'); g.addColorStop(1, 'rgba(2,20,28,.92)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    mono('THE POINT / 05', 128, 178, 13, '#ffd98d', 'left', 5);
    ctx.save(); ctx.globalAlpha = easeOut(l / 0.9);
    text('不是游戏。', 124, 340, 118, '#f6fff8', 900, 'left', 5);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = easeOut((l - 0.55) / 0.9);
    text('是一场实验。', 124, 500, 154, '#ffdfa0', 900, 'left', 5);
    ctx.restore();

    ctx.save(); ctx.globalAlpha = easeOut((l - 1.35) / 0.9);
    text('它会在你睡觉时继续被改写。', 132, 610, 30, 'rgba(233,255,248,.88)', 500);
    text('你看到的每一版，都是下一次实验的起点。', 132, 660, 30, 'rgba(233,255,248,.88)', 500);
    ctx.restore();

    var stats = [['AI', '独立制作'], ['2H', '一次迭代'], ['∞', '没有终版']];
    for (var i = 0; i < stats.length; i++) {
      var x = 132 + i * 280;
      ctx.save(); ctx.globalAlpha = easeOut((l - 2 - i * 0.15) / 0.7);
      mono(stats[i][0], x, 806, 48, i === 1 ? '#ffd98f' : '#8ff3e3', 'left', 2);
      text(stats[i][1], x + 84, 812, 14, 'rgba(228,255,248,.64)', 500);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.6 * (0.5 + 0.5 * Math.sin(t * 5));
    mono('LIVE / BUILD 7.28 / RUNNING', 1490, 952, 10, '#ffbe8a', 'right', 3);
    ctx.restore();
    drawWaves(t, 960, 'rgba(255,215,143,.14)', 10, 1.1, 1);
  }

  function sceneEnd(t) {
    var l = clamp(t, 0, 5);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H);
    var wash = ctx.createRadialGradient(1450, 180, 20, 1450, 180, 700);
    wash.addColorStop(0, 'rgba(255,215,143,.42)'); wash.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.9;
    for (var i = 0; i < 10; i++) {
      var ang = t * 0.25 + i * Math.PI * 2 / 10;
      var r = 420;
      var x = W / 2 + Math.cos(ang) * (r + 90 * Math.sin(t * 0.5 + i));
      var y = H / 2 + Math.sin(ang) * (r * 0.62 + 40 * Math.cos(t * 0.4 + i));
      var img = missionImgs[i];
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(x, y, 31, 0, 7); ctx.fillStyle = '#d6e9df'; ctx.fill();
      if (img) {
        ctx.beginPath(); ctx.arc(x, y, 27, 0, 7); ctx.clip();
        ctx.drawImage(img, x - 27, y - 27, 54, 54);
      }
      ctx.restore();
    }
    ctx.restore();

    mono('THE NEXT DIVE / 06', 128, 150, 13, '#b96a3c', 'left', 5);
    var enter = easeOut(l / 1);
    ctx.save(); ctx.globalAlpha = enter;
    text('下一船，', 120, 300, 108, '#123f45', 900, 'left', 4);
    text('等你。', 120, 418, 108, '#0b7774', 900, 'left', 4);
    ctx.restore();

    ctx.save(); ctx.globalAlpha = easeOut((l - 0.75) / 0.9);
    text('一个完全由 AI 制作、每 2 小时继续生长的世界。', 128, 526, 26, '#557477', 500);
    text('不是游戏，是一场持续进行的实验。', 128, 570, 26, '#a05b33', 700);
    ctx.restore();

    ctx.save(); ctx.globalAlpha = easeOut((l - 1.2) / 0.8);
    roundPath(128, 642, 870, 92, 16);
    ctx.fillStyle = '#0b7774'; ctx.fill();
    ctx.fillStyle = '#fff8e8';
    ctx.font = '800 32px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('yhsome.github.io/crazy-water-world', 166, 690);
    mono('PLAY NOW ↗', 950, 690, 12, '#ffd88d', 'right', 3);
    ctx.restore();

    mono('BUILD 7.28 / UPDATED EVERY 2 HOURS / MADE BY AI', 128, 806, 12, '#8b9e98', 'left', 2);
    mono('CRAZY WATER WORLD · SUNKEN COAST', 128, 838, 12, '#b0bcb5', 'left', 2);

    // final fade
    if (l > 4.45) {
      ctx.fillStyle = 'rgba(2,19,26,' + smooth((l - 4.45) / 0.55) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── composition ─────────────────────────────────────────── */

  var SCENES = [
    [0, 5, sceneIntro],
    [5, 5, sceneAI],
    [10, 5, sceneGame],
    [15, 5, sceneIteration],
    [20, 5, sceneExperiment],
    [25, 5, sceneEnd]
  ];

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var found = SCENES[SCENES.length - 1];
    for (var i = 0; i < SCENES.length; i++) {
      if (t >= SCENES[i][0] && t < SCENES[i][0] + SCENES[i][1]) { found = SCENES[i]; break; }
    }
    var local = t - found[0];
    var alpha = 1;
    if (local < 0.62) alpha = easeOut(local / 0.62);
    if (local > found[1] - 0.5 && found !== SCENES[SCENES.length - 1]) alpha = 1 - smooth((local - (found[1] - 0.5)) / 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    found[2](local);
    ctx.restore();

    // transition lines
    for (var b = 1; b < SCENES.length; b++) {
      var boundary = SCENES[b][0];
      var d = t - boundary;
      if (d >= -0.35 && d <= 0.35) {
        var p = (d + 0.35) / 0.7;
        ctx.save();
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.8;
        var x = W * easeInOut(p);
        line(x, 0, x, H, 'rgba(255,225,155,.6)', 1.5);
        ctx.restore();
      }
    }

    drawNoise(t);
    drawVignette(0.3);
    mono('AI EXPERIMENT / 30 SEC', 36, 34, 9, 'rgba(214,255,247,.3)', 'left', 2);

    // title fade at very end
    if (t > DUR - 0.85) {
      ctx.fillStyle = 'rgba(2,19,26,' + smooth((t - (DUR - 0.85)) / 0.85) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function loop(now) {
    if (!running) return;
    var t = (now - startAt) / 1000;
    if (t < 0) t = 0;
    draw(Math.min(t, DUR));
    if (t >= DUR) {
      running = false;
      ended = true;
      if (recorder && recorder.state === 'recording') {
        recordStopping = true;
        recorder.stop();
      }
      window.__promoFinished = true;
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  /* ── audio ───────────────────────────────────────────────── */

  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    master = audioCtx.createGain();
    master.gain.value = 0.15;
    master.connect(audioCtx.destination);
    audioDest = audioCtx.createMediaStreamDestination();
    master.connect(audioDest);

    var chords = [
      [130.81, 164.81, 196.00],
      [110.00, 146.83, 174.61],
      [116.54, 146.83, 174.61],
      [98.00, 130.81, 164.81],
      [87.31, 130.81, 155.56],
      [130.81, 174.61, 220.00]
    ];
    for (var i = 0; i < 3; i++) {
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.value = chords[0][i];
      osc.detune.value = (i - 1) * 5;
      g.gain.value = 0.022;
      var filt = audioCtx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 720;
      osc.connect(filt); filt.connect(g); g.connect(master);
      osc.start();
      padOsc.push({ osc: osc, gain: g, filter: filt });
    }

    // soft ocean noise
    var len = audioCtx.sampleRate * 4;
    var buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var n = 0; n < len; n++) data[n] = (Math.random() * 2 - 1) * 0.18;
    var noise = audioCtx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    var nf = audioCtx.createBiquadFilter();
    nf.type = 'lowpass'; nf.frequency.value = 420;
    var ng = audioCtx.createGain(); ng.gain.value = 0.09;
    noise.connect(nf); nf.connect(ng); ng.connect(master);
    noise.start();

    var chordIdx = 0;
    setInterval(function () {
      if (!audioCtx) return;
      chordIdx = (chordIdx + 1) % chords.length;
      var now = audioCtx.currentTime;
      for (var j = 0; j < padOsc.length; j++) {
        padOsc[j].osc.frequency.setTargetAtTime(chords[chordIdx][j], now, 1.2);
        padOsc[j].gain.gain.setTargetAtTime(0.018 + (j === 2 ? 0.005 : 0), now, 1.4);
      }
    }, 5000);
  }

  function pulseTone() {
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.75);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + 0.85);
  }

  /* ── recording ──────────────────────────────────────────── */

  function pickMime() {
    var options = preferVp8 ? [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm'
    ] : [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (var i = 0; i < options.length; i++) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(options[i])) return options[i];
    }
    return '';
  }

  function startRecording() {
    try { initAudio(); } catch (e) { audioCtx = null; audioDest = null; }
    if (!window.MediaRecorder) {
      startBtn.textContent = '浏览器不支持录制，请用播放模式';
      return;
    }
    window.__promoRecState = 'capture';
    var stream;
    try { stream = canvas.captureStream(30); } catch (e) {
      window.__promoRecError = e.name + ':' + e.message;
      startBtn.textContent = '画布录制失败：' + e.name;
      return;
    }
    window.__promoRecState = 'stream';
    if (!noAudio && audioDest && audioDest.stream) {
      audioDest.stream.getAudioTracks().forEach(function (track) { stream.addTrack(track); });
    }
    var mime = pickMime();
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 9000000, audioBitsPerSecond: 128000 } : undefined);
    } catch (e) {
      window.__promoRecError = e.name + ':' + e.message;
      startBtn.textContent = '录制初始化失败：' + e.name;
      return;
    }
    window.__promoRecState = 'recorder';
    recorder.onerror = function (ev) {
      window.__promoRecError = 'recorder:' + (ev.error && ev.error.name ? ev.error.name : 'error');
    };
    recordChunks = [];
    recordStopping = false;
    recorder.ondataavailable = function (e) {
      window.__promoChunkCount = (window.__promoChunkCount || 0) + (e.data && e.data.size ? 1 : 0);
      if (e.data && e.data.size) recordChunks.push(e.data);
    };
    recorder.onstop = function () {
      var chain = Promise.resolve();
      recordChunks.forEach(function (blob) {
        chain = chain.then(function () {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function () {
              var resultStr = String(reader.result);
              var b64At = resultStr.indexOf(';base64,');
              var b64 = b64At >= 0 ? resultStr.slice(b64At + 8) : '';
              if (window.saveChunk) window.saveChunk(b64); else window.__promoBase64 = (window.__promoBase64 || '') + b64;
              resolve();
            };
            reader.onerror = resolve;
            reader.readAsDataURL(blob);
          });
        });
      });
      chain.then(function () {
        window.__promoDone = true;
        window.__promoFinished = true;
      });
    };
    overlay.classList.add('hidden');
    startAt = performance.now() + 120;
    running = true;
    recorder.start(600);
    window.__promoRecState = 'recording';
    raf = requestAnimationFrame(loop);
  }

  function startPlayback() {
    try { initAudio(); } catch (e) { audioCtx = null; audioDest = null; }
    overlay.classList.add('hidden');
    startAt = performance.now() + 120;
    running = true;
    ended = false;
    raf = requestAnimationFrame(loop);
  }

  /* ── public controls ────────────────────────────────────── */

  window.stopPromoRecording = function () {
    running = false;
    if (recorder && recorder.state === 'recording') {
      recordStopping = true;
      recorder.stop();
    }
  };

  window.renderAt = function (t) {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    overlay.classList.add('hidden');
    draw(clamp(t, 0, DUR));
  };

  window.promoReplay = function () {
    overlay.classList.remove('hidden');
    startBtn.textContent = recordMode ? '开始录制宣传片' : '重播宣传片';
  };

  startBtn.addEventListener('click', function () {
    if (startBtn.disabled) return;
    if (recordMode) startRecording(); else startPlayback();
  });

  loadAll().then(function () {
    draw(0);
    if (recordMode) {
      // recorder must start from a user gesture; the start button is exposed.
      window.__promoRecordMode = true;
    }
  });
})();
