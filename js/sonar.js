/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 声呐扫掠
   A six-by-six sonar deduction board. Each ping returns the
   Manhattan distance to the nearest hidden cargo crate.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CW = window.CW;
  if (!CW || !CW.Arcade) return;
  var clamp = CW.clamp;
  var rand = CW.rand;
  var chance = CW.chance;
  var TAU = CW.TAU;
  var fmt = CW.fmt;

  var SONAR_BG = new Image();
  SONAR_BG.decoding = 'async';
  SONAR_BG.src = 'assets/bg-sonar.webp';

  var CARGO = {
    safe: { name: '保险箱', icon: 'assets/real/safe.webp', credits: 150, mats: { metal: 3, chip: 1 }, color: '#d9c7a1' },
    barrel: { name: '燃料桶', icon: 'assets/real/fuel.webp', credits: 80, mats: { fuel: 3 }, color: '#ffb15e' },
    chip: { name: '芯片箱', icon: 'assets/real/chip.webp', credits: 110, mats: { chip: 3 }, color: '#79d8ff' },
    gold: { name: '金条', icon: 'assets/real/gold.webp', credits: 230, mats: {}, color: '#ffd166' },
    filter: { name: '海水过滤器', icon: 'assets/seawater-filter-icon.webp', credits: 0, mats: {}, color: '#9feeff', rare: true }
  };
  var CARGO_IMAGES = {};
  for (var ck in CARGO) {
    if (!Object.prototype.hasOwnProperty.call(CARGO, ck)) continue;
    var ci = new Image();
    ci.decoding = 'async';
    ci.src = CARGO[ck].icon;
    CARGO_IMAGES[ck] = ci;
  }

  function drawCover(ctx, img, w, h, fx, fy) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) * (fx == null ? 0.5 : fx), (h - dh) * (fy == null ? 0.5 : fy), dw, dh);
    return true;
  }

  function SonarGame(arcade, config) {
    this.arcade = arcade;
    this.audio = arcade.audio;
    this.w = config.w;
    this.h = config.h;
    this.probesStart = Math.max(4, Number(config.probes) || 10);
    this.probesLeft = this.probesStart;
    this.condition = config.condition || null;
    this.rows = 6;
    this.cols = 6;
    this.phase = 'waiting';
    this.done = false;
    this.result = null;
    this.time = 0;
    this.score = 0;
    this.credits = 0;
    this.found = 0;
    this.filters = 0;
    this.collectibles = [];
    this.counts = { metal: 0, fuel: 0, fiber: 0, chip: 0 };
    this.revealed = [];
    this.clues = [];
    this.cargo = {};
    this.rings = [];
    this.particles = [];
    this.popups = [];
    this.flash = 0;
    this.ending = 0;
    this.cell = 48;
    this.boardX = 0;
    this.boardY = 0;
    this.boardW = 0;
    this.boardH = 0;
    this.bgCache = null;
    this.buildBoard();
    this.layout();
  }

  SonarGame.prototype.buildBoard = function () {
    this.revealed = [];
    this.clues = [];
    this.cargo = {};
    this.found = 0;
    this.score = 0;
    this.credits = 0;
    this.filters = 0;
    this.collectibles = [];
    this.counts = { metal: 0, fuel: 0, fiber: 0, chip: 0 };
    for (var r = 0; r < this.rows; r++) {
      var row = [];
      var clueRow = [];
      for (var c = 0; c < this.cols; c++) {
        row.push(false);
        clueRow.push(null);
      }
      this.revealed.push(row);
      this.clues.push(clueRow);
    }
    var positions = [];
    while (positions.length < 4) {
      var r2 = (Math.random() * this.rows) | 0;
      var c2 = (Math.random() * this.cols) | 0;
      var key = r2 + ':' + c2;
      if (positions.indexOf(key) < 0) positions.push(key);
    }
    var types = ['safe', 'barrel', 'chip', 'gold'];
    for (var t = types.length - 1; t > 0; t--) {
      var j = (Math.random() * (t + 1)) | 0;
      var tmp = types[t];
      types[t] = types[j];
      types[j] = tmp;
    }
    var forceFilter = ((this.arcade.hub.data.filterPity || 0) >= 7);
    var filterIndex = (forceFilter || chance(0.08)) ? (Math.random() * 4) | 0 : -1;
    for (var i = 0; i < positions.length; i++) {
      var parts = positions[i].split(':');
      this.cargo[positions[i]] = {
        key: i === filterIndex ? 'filter' : types[i],
        found: false,
        r: Number(parts[0]),
        c: Number(parts[1])
      };
    }
    if (CW.rollCollectibleDef && chance(0.3)) {
      var keys = Object.keys(this.cargo);
      var pick = keys[(Math.random() * keys.length) | 0];
      var cdef = CW.rollCollectibleDef();
      this.cargo[pick].collectible = cdef.id;
      this.cargo[pick].collectibleName = cdef.name;
    }
  };

  SonarGame.prototype.layout = function () {
    var top = clamp(this.h * 0.22, 130, 220);
    var bottomGap = this.w > this.h ? 70 : 120;
    var available = Math.max(150, this.h - top - bottomGap);
    var cell = clamp(Math.floor(Math.min(this.w * 0.86, available) / this.cols), 28, 62);
    this.cell = cell;
    this.boardW = cell * this.cols;
    this.boardH = cell * this.rows;
    this.boardX = (this.w - this.boardW) / 2;
    this.boardY = top + Math.max(0, (available - this.boardH) / 2);
    this.bgCache = null;
  };

  SonarGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.layout();
  };

  SonarGame.prototype.buildBgCache = function () {
    if (!SONAR_BG.complete || !SONAR_BG.naturalWidth) { this.bgCache = null; return; }
    var w = Math.max(1, Math.round(this.w));
    var h = Math.max(1, Math.round(this.h));
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#021018';
    g.fillRect(0, 0, w, h);
    drawCover(g, SONAR_BG, w, h, 0.5, 0.45);
    g.fillStyle = 'rgba(1, 14, 22, 0.46)';
    g.fillRect(0, 0, w, h);
    var shade = g.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0, 7, 13, 0.68)');
    shade.addColorStop(0.38, 'rgba(0, 10, 16, 0.08)');
    shade.addColorStop(1, 'rgba(0, 6, 11, 0.76)');
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
    this.bgCache = c;
  };

  SonarGame.prototype.begin = function () {
    this.phase = 'playing';
    this.time = 0;
    this.rings = [];
    this.particles = [];
    this.popups = [];
    this.ending = 0;
    this.audio.click();
  };

  SonarGame.prototype.cellAt = function (x, y) {
    if (x < this.boardX || x > this.boardX + this.boardW || y < this.boardY || y > this.boardY + this.boardH) return null;
    var c = Math.floor((x - this.boardX) / this.cell);
    var r = Math.floor((y - this.boardY) / this.cell);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return { r: r, c: c };
  };

  SonarGame.prototype.nearest = function (r, c) {
    var best = 99;
    for (var key in this.cargo) {
      if (!Object.prototype.hasOwnProperty.call(this.cargo, key)) continue;
      var item = this.cargo[key];
      if (item.found) continue;
      best = Math.min(best, Math.abs(item.r - r) + Math.abs(item.c - c));
    }
    return best;
  };

  SonarGame.prototype.pointerDown = function (x, y) {
    if (this.phase !== 'playing' || this.done || this.ending > 0) return;
    var cell = this.cellAt(x, y);
    if (!cell || this.revealed[cell.r][cell.c]) return;
    this.probesLeft -= 1;
    this.revealed[cell.r][cell.c] = true;
    var key = cell.r + ':' + cell.c;
    var item = this.cargo[key];
    var cx = this.boardX + cell.c * this.cell + this.cell / 2;
    var cy = this.boardY + cell.r * this.cell + this.cell / 2;
    if (item) {
      item.found = true;
      this.found += 1;
      var data = CARGO[item.key];
      this.score += data.credits;
      this.credits += data.credits;
      for (var mk in data.mats) {
        if (Object.prototype.hasOwnProperty.call(data.mats, mk)) this.counts[mk] += data.mats[mk];
      }
      if (item.key === 'filter') this.filters = 1;
      if (item.collectible) {
        this.collectibles.push(item.collectible);
        this.popups.push({
          x: cx, y: cy - this.cell * 0.8,
          text: '收藏品！' + item.collectibleName,
          color: CW.COLLECTIBLE_RARITY_MAP[CW.COLLECTIBLE_MAP[item.collectible].rarity].color,
          life: 1.5, maxLife: 1.5
        });
      }
      this.rings.push({ x: cx, y: cy, life: 0.65, maxLife: 0.65, color: data.color, big: true });
      this.popups.push({
        x: cx, y: cy - this.cell * 0.5,
        text: data.name, color: data.color, life: 1.1, maxLife: 1.1
      });
      this.spawnBurst(cx, cy, data.color, item.key === 'filter' ? 28 : 16);
      this.audio.record();
      if (item.key === 'filter') this.flash = 0.35;
    } else {
      var dist = this.nearest(cell.r, cell.c);
      this.clues[cell.r][cell.c] = dist;
      this.rings.push({ x: cx, y: cy, life: 0.55, maxLife: 0.55, color: '#79d8ff', big: false });
      this.audio.warn();
    }
    if (this.found >= 4 || this.probesLeft <= 0) this.ending = 0.55;
  };

  SonarGame.prototype.pointerUp = function () {};

  SonarGame.prototype.spawnBurst = function (x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * TAU;
      var v = rand(28, 120);
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: rand(0.3, 0.8), maxLife: 0.8,
        size: rand(1, 3.2), color: color
      });
    }
    if (this.particles.length > 120) this.particles.splice(0, this.particles.length - 120);
  };

  SonarGame.prototype.update = function (dt) {
    if (this.phase === 'waiting' || this.phase === 'done') return;
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt * 2.8);
    for (var i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }
    for (var p = this.particles.length - 1; p >= 0; p--) {
      var pt = this.particles[p];
      pt.life -= dt;
      if (pt.life <= 0) { this.particles.splice(p, 1); continue; }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(0.2, dt);
      pt.vy *= Math.pow(0.2, dt);
    }
    for (var q = this.popups.length - 1; q >= 0; q--) {
      this.popups[q].life -= dt;
      this.popups[q].y -= 24 * dt;
      if (this.popups[q].life <= 0) this.popups.splice(q, 1);
    }
    if (this.ending > 0) {
      this.ending -= dt;
      if (this.ending <= 0) this.finish();
    }
  };

  SonarGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.phase = 'done';
    var bonus = this.found >= 4 ? 90 : 0;
    this.credits += bonus;
    this.score += bonus;
    this.result = {
      type: 'sonar',
      score: this.score,
      credits: this.credits,
      filters: this.filters,
      found: this.found,
      collectibles: this.collectibles.slice(),
      materials: {
        metal: this.counts.metal,
        fuel: this.counts.fuel,
        fiber: this.counts.fiber,
        chip: this.counts.chip
      }
    };
  };

  SonarGame.prototype.getHud = function () {
    return {
      statLabel: '剩余声呐',
      stat: String(this.probesLeft),
      loot: {
        metal: this.counts.metal,
        fuel: this.counts.fuel,
        fiber: this.counts.fiber,
        chip: this.counts.chip
      },
      hasAction: false,
      hint: '点击格子发射声呐 · 数字是离最近货箱的格数'
    };
  };

  SonarGame.prototype.getScore = function () { return this.score; };

  SonarGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    if (!this.bgCache) this.buildBgCache();
    if (this.bgCache) ctx.drawImage(this.bgCache, 0, 0, w, h);
    else {
      ctx.fillStyle = '#021018';
      ctx.fillRect(0, 0, w, h);
    }

    var bx = this.boardX;
    var by = this.boardY;
    var cell = this.cell;
    var boardW = this.boardW;
    var boardH = this.boardH;

    // board housing
    ctx.save();
    ctx.fillStyle = 'rgba(1, 14, 20, 0.68)';
    ctx.beginPath();
    ctx.roundRect(bx - 14, by - 38, boardW + 28, boardH + 58, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(115, 227, 218, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(121, 216, 255, 0.7)';
    ctx.font = '600 8px "Cascadia Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SONAR ARRAY · 06 × 06', bx, by - 20);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(159, 238, 255, 0.65)';
    ctx.fillText('PROBES ' + this.probesLeft, bx + boardW, by - 20);

    // radar sweep
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, boardW, boardH);
    ctx.clip();
    var sweep = (this.time * 0.7) % TAU;
    var rg = ctx.createRadialGradient(bx + boardW / 2, by + boardH / 2, 0, bx + boardW / 2, by + boardH / 2, boardW * 0.7);
    rg.addColorStop(0, 'rgba(121, 232, 255, 0.045)');
    rg.addColorStop(1, 'rgba(121, 232, 255, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(bx, by, boardW, boardH);
    ctx.strokeStyle = 'rgba(121, 232, 255, 0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + boardW / 2, by + boardH / 2);
    ctx.lineTo(bx + boardW / 2 + Math.cos(sweep) * boardW, by + boardH / 2 + Math.sin(sweep) * boardH);
    ctx.stroke();
    ctx.restore();

    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        this.drawCell(ctx, bx + c * cell + cell / 2, by + r * cell + cell / 2, r, c);
      }
    }

    // rings
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.rings.length; i++) {
      var ring = this.rings[i];
      var a = clamp(ring.life / ring.maxLife, 0, 1);
      ctx.strokeStyle = hexA(ring.color, a * (ring.big ? 0.8 : 0.45));
      ctx.lineWidth = ring.big ? 2 : 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, cell * (0.4 + (1 - a) * (ring.big ? 2 : 1.2)), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var p = 0; p < this.particles.length; p++) {
      var pt = this.particles[p];
      var pa = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.fillStyle = hexA(pt.color, pa * 0.8);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * pa, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // popups
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var q = 0; q < this.popups.length; q++) {
      var pop = this.popups[q];
      var poa = clamp(pop.life / pop.maxLife, 0, 1);
      ctx.font = '800 10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(0, 8, 13, ' + (poa * 0.5).toFixed(3) + ')';
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = poa;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // found counter
    ctx.textAlign = 'left';
    ctx.font = '600 8px "Cascadia Mono", monospace';
    ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
    ctx.fillText('RECOVERED ' + this.found + ' / 4', bx, by + boardH + 25);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(159, 238, 255, 0.44)';
    ctx.fillText('回波数字 = 最近货箱距离', bx + boardW, by + boardH + 25);
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(159, 238, 255, ' + (this.flash * 0.28).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  };

  SonarGame.prototype.drawCell = function (ctx, cx, cy, r, c) {
    var cell = this.cell;
    var s = cell * 0.84;
    var revealed = this.revealed[r][c];
    var key = r + ':' + c;
    var item = this.cargo[key];
    var data = item ? CARGO[item.key] : null;
    var clue = this.clues[r][c];
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(0, 5, 9, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-s / 2 + 1, -s / 2 + 3, s, s, s * 0.16);
    ctx.fill();
    ctx.fillStyle = revealed ? 'rgba(4, 27, 33, 0.92)' : 'rgba(5, 35, 43, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.15);
    ctx.fill();
    ctx.strokeStyle = item && item.found ? hexA(data.color, 0.8) : 'rgba(115, 227, 218, 0.18)';
    ctx.lineWidth = item && item.found ? 1.4 : 1;
    ctx.stroke();

    if (!revealed) {
      ctx.strokeStyle = 'rgba(121, 232, 255, ' + (0.13 + Math.sin(this.time * 1.4 + r + c) * 0.04).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.26, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(121, 232, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, 1.2, 0, TAU);
      ctx.fill();
    } else if (item && item.found) {
      var img = CARGO_IMAGES[item.key];
      ctx.fillStyle = hexA(data.color, 0.12);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.38, 0, TAU);
      ctx.fill();
      if (img && img.complete && img.naturalWidth) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.32, 0, TAU);
        ctx.clip();
        ctx.drawImage(img, -s * 0.34, -s * 0.34, s * 0.68, s * 0.68);
        ctx.restore();
      }
    } else {
      var tone = clue <= 2 ? '#ff8a5c' : clue <= 4 ? '#ffd166' : '#79d8ff';
      ctx.fillStyle = 'rgba(121, 232, 255, 0.06)';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.36, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hexA(tone, 0.18);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.31, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = tone;
      ctx.font = '800 ' + (s * 0.36) + 'px "Cascadia Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(clue), 0, 1);
    }
    ctx.restore();
  };

  function hexA(hex, a) {
    var s = hex.replace('#', '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  CW.SonarGame = SonarGame;
})();

