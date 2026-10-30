/* ═══════════════════════════════════════════════════════════════
   海沟回声 · 第十一个打捞任务
   拖动潜航器穿过回声海沟，收集声呐浮标与沉船遗物。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CW = window.CW;
  if (!CW) return;
  var clamp = CW.clamp;
  var rand = CW.rand;

  function TrenchGame(arcade, config) {
    this.arcade = arcade;
    this.audio = arcade.audio;
    this.w = config.w;
    this.h = config.h;
    this.duration = 50;
    this.remaining = this.duration;
    this.state = 'waiting';
    this.done = false;
    this.result = null;
    this.time = 0;
    this.credits = 0;
    this.combo = 0;
    this.hull = 3;
    this.counts = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.collectibles = [];
    this.bars = [];
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 0;
    this.itemTimer = 0.8;
    this.pingTimer = 0;
    this.shake = 0;
    this.player = { x: this.w / 2, y: this.h - 155, targetX: this.w / 2, invuln: 0, bob: 0 };
    this.subImg = new Image();
    this.subImg.src = 'assets/collectibles/diving-helmet.webp';
    this.bg = new Image();
    this.bg.src = 'assets/bg-sonar.webp';
  }

  TrenchGame.prototype.begin = function () {
    this.state = 'play';
    this.remaining = this.duration;
    this.time = 0;
    this.credits = 0;
    this.combo = 0;
    this.hull = 3;
    this.bars = [];
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.collectibles = [];
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.spawnTimer = 0.5;
    this.itemTimer = 1.0;
    this.pingTimer = 0;
    this.shake = 0;
    this.player.x = this.w / 2;
    this.player.targetX = this.w / 2;
    this.player.y = this.h - 155;
    this.player.invuln = 0;
    this.audio.click();
  };

  TrenchGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.player.y = h - 155;
    this.player.x = clamp(this.player.x, 40, w - 40);
    this.player.targetX = clamp(this.player.targetX, 40, w - 40);
  };

  TrenchGame.prototype.pointerMove = function (x) {
    this.player.targetX = clamp(x, 38, this.w - 38);
  };
  TrenchGame.prototype.pointerDown = function (x) {
    this.pointerMove(x);
  };
  TrenchGame.prototype.pointerUp = function () {};
  TrenchGame.prototype.getScore = function () { return this.credits; };
  TrenchGame.prototype.getHud = function () {
    return {
      statLabel: '剩余时间',
      stat: Math.max(0, Math.ceil(this.remaining)) + 's',
      loot: this.counts,
      filters: 0,
      hasAction: false,
      hint: '拖动 / 点击控制潜航器 · 穿过岩层缺口 · 收集回声浮标'
    };
  };

  TrenchGame.prototype.spawnBar = function () {
    var gapW = rand(180, 270);
    this.bars.push({
      y: -52,
      gapX: rand(gapW / 2 + 40, this.w - gapW / 2 - 40),
      gapW: gapW,
      hit: false,
      scored: false,
      seed: Math.random() * 100
    });
  };

  TrenchGame.prototype.spawnItem = function () {
    var roll = Math.random();
    var type = roll < 0.12 ? 'relic' : roll < 0.28 ? 'oxygen' : 'echo';
    this.items.push({
      type: type,
      x: rand(46, this.w - 46),
      y: -24,
      r: type === 'relic' ? 20 : 17,
      bob: Math.random() * Math.PI * 2
    });
  };

  TrenchGame.prototype.hitBar = function () {
    if (this.player.invuln > 0) return;
    this.hull -= 1;
    this.combo = 0;
    this.player.invuln = 1.4;
    this.shake = 0.35;
    this.remaining = Math.max(0, this.remaining - 4);
    this.popups.push({ x: this.player.x, y: this.player.y - 30, text: '船体受损！-4 秒', color: '#ff8a72', life: 1.2, maxLife: 1.2 });
    this.audio.hurt();
    for (var p = 0; p < 14; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: this.player.x, y: this.player.y, vx: Math.cos(a) * rand(40, 150), vy: Math.sin(a) * rand(40, 150), life: rand(.3, .8), maxLife: .8, size: rand(1, 3), color: '#ff8a72' });
    }
    if (this.hull <= 0) this.finish();
  };

  TrenchGame.prototype.collectItem = function (it) {
    if (it.type === 'echo') {
      this.combo = Math.min(9, this.combo + 1);
      var gain = Math.round(65 * (1 + (this.combo - 1) * 0.07));
      this.credits += gain;
      this.popups.push({ x: it.x, y: it.y, text: '+' + gain, color: '#8ff3e3', life: .9, maxLife: .9 });
      this.audio.coin();
    } else if (it.type === 'oxygen') {
      this.remaining = Math.min(this.duration, this.remaining + 3);
      this.popups.push({ x: it.x, y: it.y, text: '+3 秒', color: '#9be2ff', life: 1.1, maxLife: 1.1 });
      this.audio.claim();
    } else {
      var cdef = CW.rollCollectibleDef();
      this.collectibles.push(cdef.id);
      this.popups.push({ x: it.x, y: it.y - 22, text: '收藏！' + cdef.name, color: '#ffd98f', life: 1.5, maxLife: 1.5 });
      this.audio.claim();
    }
    for (var p = 0; p < 8; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: it.x, y: it.y, vx: Math.cos(a) * rand(20, 80), vy: Math.sin(a) * rand(20, 80), life: rand(.2, .5), maxLife: .5, size: rand(1, 2), color: '#9ff6e6' });
    }
  };

  TrenchGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining -= dt;
    this.pingTimer -= dt;
    this.player.invuln = Math.max(0, this.player.invuln - dt);
    this.shake = Math.max(0, this.shake - dt);
    var p = this.player;
    p.x += (p.targetX - p.x) * Math.min(1, dt * 8);
    p.x = clamp(p.x, 30, this.w - 30);
    p.bob += dt;
    if (this.pingTimer <= 0) {
      this.pingTimer = 2.4;
      this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: .8, maxLife: .8, size: 4, color: 'rgba(121,216,255,.5)', ring: true });
    }
    var speed = 105 + Math.min(110, this.time * 2.1);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.78, 1.22 - this.time * 0.008);
      this.spawnBar();
    }
    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.itemTimer = rand(1.1, 1.9);
      this.spawnItem();
    }
    for (var i = this.bars.length - 1; i >= 0; i--) {
      var b = this.bars[i];
      b.y += speed * dt;
      if (!b.hit && p.y + 20 > b.y && p.y - 20 < b.y + 42) {
        var inGap = p.x > b.gapX - b.gapW / 2 + 14 && p.x < b.gapX + b.gapW / 2 - 14;
        if (!inGap) { b.hit = true; this.hitBar(); }
      }
      if (!b.scored && b.y > p.y + 38) {
        b.scored = true;
        this.credits += 22;
        this.popups.push({ x: p.x, y: p.y - 46, text: '+22 通过', color: '#8ff3e3', life: .7, maxLife: .7 });
      }
      if (b.y > this.h + 60) this.bars.splice(i, 1);
    }
    for (var j = this.items.length - 1; j >= 0; j--) {
      var it = this.items[j];
      it.y += speed * 0.58 * dt;
      it.x += Math.sin(this.time * 1.4 + it.bob) * 10 * dt;
      if (it.y > this.h + 30) { this.items.splice(j, 1); continue; }
      var dx = it.x - p.x, dy = it.y - p.y;
      if (dx * dx + dy * dy < (it.r + 20) * (it.r + 20)) {
        this.collectItem(it);
        this.items.splice(j, 1);
      }
    }
    for (var k = this.particles.length - 1; k >= 0; k--) {
      var pt = this.particles[k];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(k, 1);
    }
    for (var q = this.popups.length - 1; q >= 0; q--) {
      this.popups[q].life -= dt;
      if (this.popups[q].life <= 0) this.popups.splice(q, 1);
    }
    if (this.remaining <= 0 || this.hull <= 0) this.finish();
  };

  TrenchGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.state = 'done';
    this.result = {
      type: 'trench',
      score: this.credits,
      credits: this.credits,
      collectibles: this.collectibles.slice(),
      filters: 0,
      materials: this.counts
    };
  };

  TrenchGame.prototype.render = function (ctx) {
    var w = this.w, h = this.h, p = this.player, t = this.time;
    var sea = ctx.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#041e2b');
    sea.addColorStop(0.45, '#063b4b');
    sea.addColorStop(1, '#02141f');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, w, h);
    if (this.bg && this.bg.complete && this.bg.naturalWidth) {
      ctx.save(); ctx.globalAlpha = 0.11; ctx.drawImage(this.bg, 0, 0, w, h); ctx.restore();
    }
    // sonar arcs
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (var a = 0; a < 4; a++) {
      var r = ((t * 52 + a * 110) % 420);
      ctx.strokeStyle = '#68d9e6'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    // side walls
    var wall = ctx.createLinearGradient(0, 0, w, 0);
    wall.addColorStop(0, 'rgba(1,13,20,.75)'); wall.addColorStop(.14, 'rgba(1,13,20,0)');
    wall.addColorStop(.86, 'rgba(1,13,20,0)'); wall.addColorStop(1, 'rgba(1,13,20,.75)');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h);

    ctx.save();
    if (this.shake > 0) ctx.translate(rand(-5, 5) * this.shake, rand(-5, 5) * this.shake);
    for (var bi = 0; bi < this.bars.length; bi++) {
      var b = this.bars[bi];
      var left = 0, right = b.gapX - b.gapW / 2;
      var midL = b.gapX + b.gapW / 2, midR = w;
      var top = b.y, bot = b.y + 42;
      ctx.fillStyle = '#112a33';
      ctx.strokeStyle = 'rgba(123,221,230,.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left, top + 8);
      for (var x = 0; x < right; x += 18) ctx.lineTo(x, top + Math.sin(x * .055 + b.seed + t * .4) * 8);
      ctx.lineTo(right, top); ctx.lineTo(right, bot); ctx.lineTo(left, bot); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midL, top);
      for (var x2 = midL; x2 < midR; x2 += 18) ctx.lineTo(x2, top + Math.sin(x2 * .05 + b.seed + t * .4) * 8);
      ctx.lineTo(midR, top); ctx.lineTo(midR, bot); ctx.lineTo(midL, bot); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(143,243,227,.35)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(right, top + 10); ctx.lineTo(right, bot - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midL, top + 10); ctx.lineTo(midL, bot - 10); ctx.stroke();
    }
    // items
    for (var ii = 0; ii < this.items.length; ii++) {
      var it = this.items[ii];
      var col = it.type === 'relic' ? '#ffd98f' : it.type === 'oxygen' ? '#79d8ff' : '#8ff3e3';
      var glyph = it.type === 'relic' ? '遗' : it.type === 'oxygen' ? '氧' : '声';
      ctx.save();
      ctx.fillStyle = 'rgba(3,27,36,.7)';
      ctx.beginPath(); ctx.arc(it.x, it.y, it.r + 5, 0, 7); ctx.fill();
      ctx.fillStyle = col;
      ctx.globalAlpha = .22;
      ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, 7); ctx.stroke();
      ctx.fillStyle = '#eafff6';
      ctx.font = '800 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(glyph, it.x, it.y + 1);
      ctx.restore();
    }
    // particles
    for (var pi = 0; pi < this.particles.length; pi++) {
      var pt = this.particles[pi];
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.strokeStyle = pt.color; ctx.fillStyle = pt.color;
      if (pt.ring) {
        ctx.lineWidth = 1.5;
        var rr = (1 - pt.life / pt.maxLife) * 55;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, rr, 0, 7); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    // player
    ctx.save();
    ctx.translate(p.x, p.y + Math.sin(p.bob * 3) * 2);
    ctx.fillStyle = 'rgba(121,216,255,.16)';
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill();
    if (this.subImg && this.subImg.complete && this.subImg.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 25, 0, 7); ctx.clip();
      ctx.drawImage(this.subImg, -25, -25, 50, 50); ctx.restore();
    } else {
      ctx.fillStyle = '#7bddd9'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = p.invuln > 0 && Math.sin(t * 26) > 0 ? .38 : 1;
    ctx.strokeStyle = p.invuln > 0 ? '#ffb18e' : '#a9fff0';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, 7); ctx.stroke();
    ctx.restore();
    // popups
    for (var qi = 0; qi < this.popups.length; qi++) {
      var pp = this.popups[qi];
      ctx.save(); ctx.globalAlpha = Math.max(0, pp.life / pp.maxLife);
      ctx.font = '800 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      var tw = ctx.measureText(pp.text).width;
      ctx.fillStyle = 'rgba(2,27,36,.7)';
      ctx.beginPath(); ctx.roundRect(pp.x - tw / 2 - 7, pp.y - 12, tw + 14, 23, 10); ctx.fill();
      ctx.fillStyle = pp.color; ctx.fillText(pp.text, pp.x, pp.y + 1);
      ctx.restore();
    }
    ctx.restore();
    // hud
    ctx.fillStyle = 'rgba(2,20,29,.8)'; ctx.fillRect(0, h - 66, w, 66);
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('海沟回声 · 连击 ×' + this.combo, w / 2, h - 40);
    ctx.fillStyle = 'rgba(190,247,240,.68)';
    ctx.font = '10px "Noto Sans SC", sans-serif';
    ctx.fillText('拖动控制方向 · 船体 ' + this.hull + ' / 3 · 氧气 ' + Math.max(0, Math.ceil(this.remaining)) + 's', w / 2, h - 20);
  };

  CW.TrenchGame = TrenchGame;
})();
