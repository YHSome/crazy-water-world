/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 打捞任务 04–06
   CutGame / SortGame / BeaconGame: three small canvas games that
   share the existing Arcade HUD, rewards and sea conditions.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CW = (window.CW = window.CW || {});
  var TAU = Math.PI * 2;

  var CUT_BG = new Image(); CUT_BG.src = 'assets/bg-hook.webp';
  var SORT_BG = new Image(); SORT_BG.src = 'assets/bg-match.webp';
  var BEACON_BG = new Image(); BEACON_BG.src = 'assets/bg-sonar.webp';
  var MAT_IMAGES = {};
  if (CW.MATERIALS) {
    for (var mi = 0; mi < CW.MATERIALS.length; mi++) {
      var mimg = new Image();
      mimg.src = CW.MATERIALS[mi].iconImg;
      MAT_IMAGES[CW.MATERIALS[mi].id] = mimg;
    }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function cover(ctx, img, w, h) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var iw = img.naturalWidth * s;
    var ih = img.naturalHeight * s;
    ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    return true;
  }
  function counts() {
    var out = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) out[CW.MATERIALS[i].id] = 0;
    return out;
  }
  function base(arcade, config) {
    return {
      arcade: arcade, audio: arcade.audio, w: config.w, h: config.h,
      duration: config.duration || 60, remaining: config.duration || 60,
      time: 0, done: false, score: 0
    };
  }

  /* ── MISSION 04 · 沉船切割 ─────────────────────────────────── */
  function CutGame(arcade, config) {
    var b = base(arcade, config);
    this.arcade = b.arcade; this.audio = b.audio; this.w = b.w; this.h = b.h;
    this.duration = b.duration; this.remaining = b.remaining; this.time = 0; this.done = false;
    this.cuts = 0; this.targetCuts = 6; this.misses = 0; this.score = 0;
    this.perfectCuts = 0; this.perfectNotice = 0;
    this.needle = 0.5; this.dir = 1; this.target = 0.5; this.zone = 0.18;
    this.flash = 0; this.shake = 0; this.state = 'play'; this.spark = 0;
    this.bg = CUT_BG;
    this.newTarget();
  }
  CutGame.prototype.newTarget = function () {
    this.target = 0.22 + Math.random() * 0.56;
    this.zone = Math.max(0.09, 0.18 - this.cuts * 0.012);
  };
  CutGame.prototype.begin = function () {};
  CutGame.prototype.pointerDown = function () {
    if (this.state !== 'play') return;
    var d = Math.abs(this.needle - this.target);
    if (d <= this.zone / 2) {
      var perfect = d <= this.zone * 0.22;
      this.cuts += 1;
      this.score += perfect ? 160 : 100;
      if (perfect) {
        this.perfectCuts += 1;
        this.perfectNotice = 1.1;
        this.remaining = Math.min(this.duration, this.remaining + 1);
        this.flash = 0.3;
        this.audio.claim();
      } else {
        this.flash = 0.22;
      }
      this.spark = 0.3;
      this.audio.matchLine(this.cuts);
      if (this.cuts >= this.targetCuts) { this.finish(); return; }
      this.newTarget();
    } else {
      this.misses += 1; this.remaining = Math.max(0, this.remaining - 3);
      this.shake = 0.22; this.flash = -0.18; this.audio.error();
      if (this.remaining <= 0) this.finish();
    }
  };
  CutGame.prototype.pointerUp = function () {};
  CutGame.prototype.getScore = function () { return this.score; };
  CutGame.prototype.getHud = function () {
    return {
      statLabel: '切口', stat: this.cuts + ' / ' + this.targetCuts + (this.perfectCuts ? ' · 完美' + this.perfectCuts : ''),
      loot: counts(), hasAction: false,
      hint: '等切割线进入绿色安全区时点击 · 命中中心金色窄带触发完美 +1 秒 · 失误 -3 秒'
    };
  };
  CutGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    var speed = 0.54 + this.cuts * 0.075;
    this.needle += this.dir * speed * dt;
    if (this.needle >= 1) { this.needle = 1; this.dir = -1; }
    if (this.needle <= 0) { this.needle = 0; this.dir = 1; }
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.spark = Math.max(0, this.spark - dt * 3);
    this.perfectNotice = Math.max(0, this.perfectNotice - dt);
    if (this.remaining <= 0) this.finish();
  };
  CutGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true; this.state = 'done';
    var m = counts();
    m.metal = 2 + this.cuts;
    m.copper = 1 + Math.floor(this.cuts / 2);
    m.glass = 1;
    this.result = {
      type: 'cut', score: this.score + this.cuts * 60, cuts: this.cuts, perfectCuts: this.perfectCuts,
      credits: 90 + this.cuts * 65, filters: 0,
      materials: m, collectibles: [], bestCombo: this.cuts
    };
  };
  CutGame.prototype.render = function (ctx) {
    var w = this.w, h = this.h;
    if (!cover(ctx, this.bg, w, h)) { ctx.fillStyle = '#07363b'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(2, 18, 22, 0.68)';
    ctx.fillRect(0, 0, w, h);
    var sx = this.shake > 0 ? Math.sin(this.time * 80) * 5 : 0;
    ctx.save(); ctx.translate(sx, 0);
    var railW = Math.min(w * 0.82, 640), railX = (w - railW) / 2, railY = h * 0.56;
    ctx.textAlign = 'left';
    ctx.font = '800 11px "Cascadia Mono", monospace';
    ctx.fillStyle = 'rgba(255, 205, 128, 0.9)';
    ctx.fillText('CUT LINE · 沉船切割', railX, railY - 54);
    ctx.font = '800 23px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#f5fff8';
    ctx.fillText(this.cuts >= this.targetCuts ? '切割完成' : '瞄准绿色安全区', railX, railY - 24);
    // plate
    ctx.fillStyle = 'rgba(22, 53, 58, 0.9)';
    rr(ctx, railX - 12, railY - 10, railW + 24, 72, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1; ctx.stroke();
    // rail
    ctx.fillStyle = '#102f35';
    rr(ctx, railX, railY + 8, railW, 30, 15); ctx.fill();
    // target
    var tx = railX + (this.target - this.zone / 2) * railW;
    var tw = this.zone * railW;
    ctx.fillStyle = 'rgba(77, 225, 174, 0.62)';
    rr(ctx, tx, railY + 8, tw, 30, 12); ctx.fill();
    ctx.strokeStyle = '#d9fff0'; ctx.lineWidth = 2; ctx.stroke();
    var pw = Math.max(4, tw * 0.22);
    ctx.fillStyle = 'rgba(255, 224, 138, 0.8)';
    rr(ctx, railX + this.target * railW - pw / 2, railY + 9, pw, 28, 7); ctx.fill();
    // needle
    var nx = railX + this.needle * railW;
    ctx.strokeStyle = this.flash > 0 ? '#ffffff' : '#ff9a5c';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(nx, railY + 1); ctx.lineTo(nx, railY + 45); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(nx, railY + 4, 5, 0, TAU); ctx.fill();
    if (this.perfectNotice > 0) {
      ctx.globalAlpha = Math.min(1, this.perfectNotice * 2);
      ctx.fillStyle = '#ffe08a';
      ctx.font = '800 14px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PERFECT · +1 秒', railX + railW / 2, railY - 66);
      ctx.globalAlpha = 1;
    }
    // cut marks
    for (var i = 0; i < this.targetCuts; i++) {
      var mx = railX + i * (railW / this.targetCuts) + 12;
      ctx.fillStyle = i < this.cuts ? '#ffcf72' : 'rgba(216, 240, 235, 0.22)';
      ctx.beginPath(); ctx.arc(mx, railY + 60, 4, 0, TAU); ctx.fill();
    }
    // timer
    ctx.textAlign = 'right';
    ctx.font = '700 24px "Cascadia Mono", monospace';
    ctx.fillStyle = this.remaining < 10 ? '#ff8a6a' : '#f5fff8';
    ctx.fillText(Math.ceil(this.remaining) + 's', railX + railW, railY - 26);
    ctx.textAlign = 'left';
    ctx.font = '600 10px "Cascadia Mono", monospace';
    ctx.fillStyle = 'rgba(230, 255, 246, 0.56)';
    ctx.fillText(this.misses ? 'MISS ' + this.misses : '保持节奏 · 每次切割 +65 币', railX, railY + 88);
    ctx.restore();
  };
  CW.CutGame = CutGame;

  /* ── MISSION 05 · 分拣传送带 ───────────────────────────────── */
  function SortGame(arcade, config) {
    var b = base(arcade, config);
    this.arcade = b.arcade; this.audio = b.audio; this.w = b.w; this.h = b.h;
    this.duration = b.duration; this.remaining = b.remaining; this.time = 0; this.done = false;
    this.score = 0; this.correct = 0; this.wrong = 0; this.total = 12; this.left = 12;
    this.combo = 0; this.bestCombo = 0; this.comboNotice = 0;
    this.flash = 0; this.shake = 0; this.state = 'play';
    this.bins = this.pickBins();
    this.counts = counts();
    this.current = this.nextItem();
    this.bg = SORT_BG;
  }
  SortGame.prototype.pickBins = function () {
    var pool = CW.MATERIALS.slice();
    var out = [];
    while (out.length < 4 && pool.length) out.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    return out;
  };
  SortGame.prototype.nextItem = function () {
    var b = this.bins[(Math.random() * this.bins.length) | 0];
    return { id: b.id, name: b.name, color: b.color, icon: b.iconImg };
  };
  SortGame.prototype.begin = function () {};
  SortGame.prototype.pointerDown = function (x, y) {
    if (this.state !== 'play') return;
    var w = this.w, h = this.h;
    if (y < h * 0.62) return;
    var pad = w * 0.055, gap = w * 0.018;
    var bw = (w - pad * 2 - gap * 3) / 4;
    var idx = Math.floor((x - pad) / (bw + gap));
    if (idx < 0 || idx > 3) return;
    var bin = this.bins[idx];
    if (!bin) return;
    if (bin.id === this.current.id) {
      this.correct += 1; this.left -= 1;
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += 80 + Math.min(100, (this.combo - 1) * 15);
      if (this.combo > 0 && this.combo % 5 === 0) {
        this.remaining = Math.min(this.duration, this.remaining + 2);
        this.comboNotice = 1.2;
        this.flash = 0.3;
        this.audio.claim();
      }
      this.counts[bin.id] = (this.counts[bin.id] || 0) + 1;
      this.flash = 0.2; this.audio.matchLine(this.correct);
      if (this.left <= 0) { this.finish(); return; }
      this.current = this.nextItem();
    } else {
      this.wrong += 1; this.combo = 0; this.remaining = Math.max(0, this.remaining - 3);
      this.shake = 0.2; this.flash = -0.18; this.audio.error();
      if (this.remaining <= 0) this.finish();
    }
  };
  SortGame.prototype.pointerUp = function () {};
  SortGame.prototype.getScore = function () { return this.score; };
  SortGame.prototype.getHud = function () {
    return {
      statLabel: '待分拣', stat: String(this.left) + (this.combo ? ' · 连' + this.combo : ''),
      loot: this.counts, hasAction: false,
      hint: '看清货物点对应料箱 · 连续分拣提高得分，5 连 +2 秒 · 点错 -3 秒'
    };
  };
  SortGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.comboNotice = Math.max(0, this.comboNotice - dt);
    if (this.remaining <= 0) this.finish();
  };
  SortGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true; this.state = 'done';
    var m = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) m[CW.MATERIALS[i].id] = 0;
    for (var id in this.counts) if (this.counts[id]) m[id] = this.counts[id];
    this.result = {
      type: 'sort', score: this.score + this.correct * 30, correct: this.correct, bestCombo: this.bestCombo,
      credits: 100 + this.correct * 45, filters: 0,
      materials: m, collectibles: []
    };
  };
  SortGame.prototype.render = function (ctx) {
    var w = this.w, h = this.h;
    if (!cover(ctx, this.bg, w, h)) { ctx.fillStyle = '#0b3b39'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(2, 20, 22, 0.67)'; ctx.fillRect(0, 0, w, h);
    var sx = this.shake > 0 ? Math.sin(this.time * 80) * 5 : 0;
    ctx.save(); ctx.translate(sx, 0);
    ctx.textAlign = 'center';
    ctx.font = '800 11px "Cascadia Mono", monospace';
    ctx.fillStyle = 'rgba(255, 205, 128, 0.9)';
    ctx.fillText('SORTING LINE · 分拣传送带', w / 2, h * 0.16);
    ctx.font = '800 24px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#f5fff8';
    ctx.fillText('把货物送进对应料箱', w / 2, h * 0.21);
    // conveyor
    ctx.fillStyle = 'rgba(4, 35, 36, 0.88)';
    rr(ctx, w * 0.06, h * 0.30, w * 0.88, h * 0.22, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; ctx.stroke();
    for (var i = 0; i < 12; i++) {
      var lx = w * 0.08 + ((this.time * 26 + i * 31) % (w * 0.84));
      ctx.fillStyle = 'rgba(159, 226, 219, 0.16)';
      ctx.fillRect(lx, h * 0.34, 12, 2);
    }
    var cx = w / 2, cy = h * 0.41;
    ctx.fillStyle = this.flash > 0 ? 'rgba(117, 255, 199, 0.5)' : this.flash < 0 ? 'rgba(255, 105, 90, 0.5)' : 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.arc(cx, cy, 48, 0, TAU); ctx.fill();
    ctx.strokeStyle = this.current.color; ctx.lineWidth = 3; ctx.stroke();
    var im = MAT_IMAGES[this.current.id];
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, cx - 32, cy - 32, 64, 64);
    ctx.fillStyle = '#fffdf6';
    ctx.font = '800 17px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(this.current.name, cx, cy + 72);
    // timer
    ctx.textAlign = 'right'; ctx.font = '700 22px "Cascadia Mono", monospace';
    ctx.fillStyle = this.remaining < 10 ? '#ff8a6a' : '#f5fff8';
    ctx.fillText(Math.ceil(this.remaining) + 's', w * 0.94, h * 0.19);
    // bins
    var pad = w * 0.055, gap = w * 0.018;
    var bw = (w - pad * 2 - gap * 3) / 4;
    for (var bi = 0; bi < this.bins.length; bi++) {
      var bin = this.bins[bi], bx = pad + bi * (bw + gap), by = h * 0.64, bh = h * 0.22;
      ctx.fillStyle = 'rgba(255, 252, 243, 0.93)';
      rr(ctx, bx, by, bw, bh, 14); ctx.fill();
      ctx.strokeStyle = bin.color; ctx.lineWidth = 2.5; ctx.stroke();
      var bi2 = MAT_IMAGES[bin.id];
      if (bi2 && bi2.complete && bi2.naturalWidth) ctx.drawImage(bi2, bx + bw / 2 - 22, by + 12, 44, 44);
      ctx.fillStyle = '#173f47'; ctx.textAlign = 'center';
      ctx.font = '800 11px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(bin.name, bx + bw / 2, by + bh - 20);
    }
    ctx.fillStyle = 'rgba(230, 255, 246, 0.58)';
    ctx.font = '600 10px "Cascadia Mono", monospace';
    ctx.fillText('CORRECT ' + this.correct + ' · COMBO ' + this.combo + ' · MISS ' + this.wrong, w / 2, h * 0.93);
    if (this.comboNotice > 0) {
      ctx.globalAlpha = Math.min(1, this.comboNotice * 2);
      ctx.fillStyle = '#ffe08a';
      ctx.font = '800 15px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(this.combo + ' 连 · +2 秒', w / 2, h * 0.27);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
  CW.SortGame = SortGame;

  /* ── MISSION 06 · 灯塔信号 ─────────────────────────────────── */
  function BeaconGame(arcade, config) {
    var b = base(arcade, config);
    this.arcade = b.arcade; this.audio = b.audio; this.w = b.w; this.h = b.h;
    this.duration = b.duration; this.remaining = b.remaining; this.time = 0; this.done = false;
    this.score = 0; this.rounds = 0; this.targetRounds = 3;
    this.seq = []; this.input = []; this.showTimer = 0; this.showIndex = 0;
    this.state = 'show'; this.flash = [0, 0, 0, 0]; this.between = 0; this.wrong = 0;
    this.colors = ['#ff8a5c', '#79d8ff', '#9be2a9', '#ffd166'];
    this.names = ['潮', '火', '风', '星'];
    this.bg = BEACON_BG;
    this.nextRound();
  }
  BeaconGame.prototype.nextRound = function () {
    if (this.rounds >= this.targetRounds) { this.finish(); return; }
    this.seq = [];
    var len = 2 + this.rounds;
    for (var i = 0; i < len; i++) this.seq.push((Math.random() * 4) | 0);
    this.input = []; this.showIndex = 0; this.showTimer = 0.5; this.state = 'show';
  };
  BeaconGame.prototype.begin = function () {};
  BeaconGame.prototype.pointerDown = function (x, y) {
    if (this.state !== 'input') return;
    var w = this.w, h = this.h;
    var gx = w * 0.12, gy = h * 0.25, gw = w * 0.76, gh = h * 0.48;
    var cw = gw / 2, ch = gh / 2;
    if (x < gx || x > gx + gw || y < gy || y > gy + gh) return;
    var idx = (y - gy > ch ? 2 : 0) + (x - gx > cw ? 1 : 0);
    this.flash[idx] = 0.3;
    if (this.seq[this.input.length] === idx) {
      this.input.push(idx);
      this.audio.sonarPing();
      if (this.input.length >= this.seq.length) {
        this.rounds += 1; this.score += 100 * this.rounds;
        if (this.rounds >= this.targetRounds) { this.finish(); return; }
        this.state = 'between'; this.between = 0.8;
      }
    } else {
      this.wrong += 1; this.remaining = Math.max(0, this.remaining - 5);
      this.input = []; this.showIndex = 0; this.showTimer = 0.6; this.state = 'show';
      this.audio.error();
      if (this.remaining <= 0) this.finish();
    }
  };
  BeaconGame.prototype.pointerUp = function () {};
  BeaconGame.prototype.getScore = function () { return this.score; };
  BeaconGame.prototype.getHud = function () {
    return {
      statLabel: '信号组', stat: Math.min(this.rounds, this.targetRounds) + ' / ' + this.targetRounds,
      loot: counts(), hasAction: false,
      hint: this.state === 'show' ? '先记住亮灯顺序 · 再按相同顺序点击' : '按顺序点击四座灯塔 · 看错会扣 5 秒'
    };
  };
  BeaconGame.prototype.update = function (dt) {
    if (this.state === 'done' || this.done) return;
    this.time += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    for (var f = 0; f < 4; f++) this.flash[f] = Math.max(0, this.flash[f] - dt * 3);
    if (this.state === 'show') {
      this.showTimer -= dt;
      if (this.showTimer <= 0) {
        if (this.showIndex < this.seq.length) {
          this.flash[this.seq[this.showIndex]] = 0.38;
          this.audio.sonarPing();
          this.showIndex += 1;
          this.showTimer = 0.62;
        } else {
          this.state = 'input';
        }
      }
    } else if (this.state === 'between') {
      this.between -= dt;
      if (this.between <= 0) this.nextRound();
    }
    if (this.remaining <= 0) this.finish();
  };
  BeaconGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true; this.state = 'done';
    var m = counts();
    m.chip = 1 + this.rounds;
    m.glass = 1 + Math.floor(this.rounds / 2);
    m.copper = 1;
    this.result = {
      type: 'beacon', score: this.score, rounds: this.rounds,
      credits: 100 + this.rounds * 90, filters: 0,
      materials: m, collectibles: []
    };
  };
  BeaconGame.prototype.render = function (ctx) {
    var w = this.w, h = this.h;
    if (!cover(ctx, this.bg, w, h)) { ctx.fillStyle = '#132f35'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(3, 20, 24, 0.72)'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.font = '800 11px "Cascadia Mono", monospace';
    ctx.fillStyle = 'rgba(255, 205, 128, 0.9)';
    ctx.fillText('BEACON ARRAY · 灯塔信号', w / 2, h * 0.14);
    ctx.font = '800 24px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#f5fff8';
    ctx.fillText(this.state === 'show' ? '记住亮灯顺序' : this.state === 'input' ? '按顺序点亮' : '信号锁定', w / 2, h * 0.19);
    var gx = w * 0.12, gy = h * 0.25, gw = w * 0.76, gh = h * 0.48;
    var cw = gw / 2, ch = gh / 2;
    for (var i = 0; i < 4; i++) {
      var bx = gx + (i % 2) * cw + 6, by = gy + ((i / 2) | 0) * ch + 6;
      var bw = cw - 12, bh = ch - 12;
      ctx.fillStyle = this.colors[i];
      ctx.globalAlpha = 0.18 + this.flash[i] * 1.5;
      rr(ctx, bx, by, bw, bh, 22); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.flash[i] > 0 ? '#ffffff' : this.colors[i];
      ctx.lineWidth = this.flash[i] > 0 ? 5 : 2;
      rr(ctx, bx, by, bw, bh, 22); ctx.stroke();
      ctx.fillStyle = this.flash[i] > 0 ? '#ffffff' : this.colors[i];
      ctx.beginPath(); ctx.arc(bx + bw / 2, by + bh / 2 - 7, 16, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
      ctx.font = '800 20px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(this.names[i], bx + bw / 2, by + bh / 2 + 26);
    }
    ctx.fillStyle = 'rgba(230, 255, 246, 0.6)';
    ctx.font = '600 10px "Cascadia Mono", monospace';
    ctx.fillText('ROUND ' + Math.min(this.rounds + 1, this.targetRounds) + ' / ' + this.targetRounds + ' · ' + Math.ceil(this.remaining) + 's', w / 2, h * 0.81);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.86)';
    ctx.fillText(this.state === 'show' ? 'WATCH' : this.state === 'input' ? 'REPEAT' : '...', w / 2, h * 0.86);
  };
  CW.BeaconGame = BeaconGame;
})();
