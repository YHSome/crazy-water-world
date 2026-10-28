/* ═══════════════════════════════════════════════════════════════
   潮汐拖网 · 第七个打捞任务
   拖动/点击移动渔网，接住下落的海货，避开锈雷。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CW = window.CW;
  if (!CW) return;
  var clamp = CW.clamp;
  var rand = CW.rand;

  var TILE = {
    fish: { name: '银鱼', glyph: '鱼', color: '#8fe7ff', value: 55, mats: { fiber: 1 } },
    crate: { name: '漂流货箱', glyph: '箱', color: '#ffcf72', value: 95, mats: { metal: 2, glass: 1 } },
    gold: { name: '黄金鱼', glyph: '金', color: '#ffdf72', value: 220, mats: { chip: 1 } },
    pearl: { name: '深海珍珠', glyph: '珠', color: '#d9b8ff', value: 140, collectible: true },
    mine: { name: '锈雷', glyph: '雷', color: '#ff7a62', value: 0, mine: true }
  };

  function TrawlGame(arcade, config) {
    this.arcade = arcade;
    this.audio = arcade.audio;
    this.w = config.w;
    this.h = config.h;
    this.condition = config.condition || null;
    this.duration = 45;
    this.remaining = this.duration;
    this.state = 'waiting';
    this.done = false;
    this.result = null;
    this.time = 0;
    this.credits = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.counts = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.collectibles = [];
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.netX = this.w * 0.5;
    this.targetX = this.netX;
    this.spawnTimer = 0;
    this.spawnGap = 0.65;
    this.flash = 0;
    this.shake = 0;
    this.caught = 0;
    this.netW = 0;
  }

  TrawlGame.prototype.netY = function () { return this.h - Math.max(96, this.h * 0.14); };
  TrawlGame.prototype.begin = function () {
    this.state = 'play';
    this.remaining = this.duration;
    this.time = 0;
    this.credits = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.collectibles = [];
    this.caught = 0;
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.netW = clamp(this.w * 0.24, 92, 150);
    this.netX = this.w * 0.5;
    this.targetX = this.netX;
    this.spawnTimer = 0.3;
    this.spawnGap = 0.65;
    this.flash = 0;
    this.shake = 0;
    this.audio.click();
  };

  TrawlGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.netW = clamp(w * 0.24, 92, 150);
    this.netX = clamp(this.netX, this.netW / 2, w - this.netW / 2);
    this.targetX = this.netX;
  };

  TrawlGame.prototype.pointerDown = function (x) {
    this.targetX = clamp(x, this.netW / 2, this.w - this.netW / 2);
  };
  TrawlGame.prototype.pointerUp = function () {};
  TrawlGame.prototype.pointerMove = function (x) { this.pointerDown(x); };

  TrawlGame.prototype.getScore = function () { return this.credits; };
  TrawlGame.prototype.getHud = function () {
    return {
      statLabel: '剩余时间',
      stat: Math.max(0, Math.ceil(this.remaining)) + 's',
      loot: this.counts,
      filters: 0,
      hasAction: false,
      hint: '点击/拖动水面移动渔网 · 接住鱼获与货箱 · 锈雷会扣 4 秒'
    };
  };

  TrawlGame.prototype.spawn = function () {
    var roll = Math.random();
    var key = 'fish';
    var mineChance = 0.08;
    if (this.condition && this.condition.mines < 0) mineChance = 0;
    else if (this.condition && this.condition.mines > 0) mineChance = Math.min(0.22, 0.08 + this.condition.mines * 0.03);
    if (roll < mineChance) key = 'mine';
    else if (roll < 0.18) key = 'pearl';
    else if (roll < 0.31) key = 'gold';
    else if (roll < 0.56) key = 'crate';
    var item = {
      key: key,
      x: rand(this.netW * 0.55, this.w - this.netW * 0.55),
      y: -24,
      vy: rand(88, 138) + Math.min(42, this.time * 0.7),
      drift: rand(-12, 12),
      phase: Math.random() * Math.PI * 2,
      spin: rand(-1.2, 1.2),
      r: key === 'gold' ? 17 : key === 'mine' ? 15 : key === 'pearl' ? 15 : 14
    };
    this.items.push(item);
  };

  TrawlGame.prototype.catchItem = function (item) {
    var data = TILE[item.key];
    if (data.mine) {
      this.remaining = Math.max(0, this.remaining - 4);
      this.combo = 0;
      this.flash = 0.8;
      this.shake = 9;
      this.popups.push({ x: item.x, y: item.y, text: '锈雷！-4 秒', color: '#ff7a62', life: 1.2, maxLife: 1.2 });
      this.audio.hurt();
      return;
    }
    this.caught += 1;
    this.combo = Math.min(9, this.combo + 1);
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    var gained = Math.round(data.value * (1 + (this.combo - 1) * 0.07));
    this.credits += gained;
    for (var key in data.mats) {
      if (Object.prototype.hasOwnProperty.call(data.mats, key)) this.counts[key] = (this.counts[key] || 0) + data.mats[key];
    }
    if (data.collectible && CW.rollCollectibleDef) {
      var cdef = CW.rollCollectibleDef();
      this.collectibles.push(cdef.id);
      this.popups.push({ x: item.x, y: item.y - 22, text: '收藏！' + cdef.name, color: cdef.color || '#d9b8ff', life: 1.7, maxLife: 1.7 });
      this.audio.relic();
    }
    this.popups.push({ x: item.x, y: item.y, text: '+' + gained, color: data.color, life: 1.0, maxLife: 1.0 });
    if (this.combo > 1) this.popups.push({ x: item.x, y: item.y - 38, text: '连收 ×' + this.combo, color: '#ffe18a', life: 1.1, maxLife: 1.1 });
    for (var p = 0; p < 12; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: item.x, y: item.y, vx: Math.cos(a) * rand(25, 110), vy: Math.sin(a) * rand(25, 110), life: rand(0.3, 0.7), maxLife: 0.7, size: rand(1, 3), color: data.color });
    }
    this.audio.coin();
  };

  TrawlGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining -= dt;
    this.flash = Math.max(0, this.flash - dt * 2);
    this.shake = Math.max(0, this.shake - dt * 10);
    this.spawnGap = Math.max(0.34, 0.65 - this.time * 0.005);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnGap;
      this.spawn();
    }
    var diff = this.targetX - this.netX;
    this.netX += clamp(diff, -520 * dt, 520 * dt);
    var netY = this.netY();
    for (var i = this.items.length - 1; i >= 0; i--) {
      var it = this.items[i];
      it.y += it.vy * dt;
      it.x += Math.sin(this.time * 1.4 + it.phase) * it.drift * dt;
      if (it.y >= netY - 6 && it.y <= netY + 18 && Math.abs(it.x - this.netX) <= this.netW / 2) {
        this.catchItem(it);
        this.items.splice(i, 1);
        continue;
      }
      if (it.y > this.h + 30) this.items.splice(i, 1);
    }
    for (var pi = this.particles.length - 1; pi >= 0; pi--) {
      var p = this.particles[pi];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(pi, 1);
    }
    for (var qi = this.popups.length - 1; qi >= 0; qi--) {
      this.popups[qi].life -= dt;
      if (this.popups[qi].life <= 0) this.popups.splice(qi, 1);
    }
    if (this.remaining <= 0) this.finish();
  };

  TrawlGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.state = 'done';
    this.result = {
      type: 'trawl',
      score: this.credits,
      credits: this.credits,
      collectibles: this.collectibles.slice(),
      filters: 0,
      materials: this.counts
    };
  };

  TrawlGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    var shakeX = this.shake > 0.2 ? rand(-this.shake, this.shake) : 0;
    var shakeY = this.shake > 0.2 ? rand(-this.shake, this.shake) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#dff9f1');
    sky.addColorStop(0.46, '#84e4e4');
    sky.addColorStop(0.56, '#28a8bc');
    sky.addColorStop(1, '#07506b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.35;
    for (var wv = 0; wv < 9; wv++) {
      var wy = h * 0.42 + wv * 16 + Math.sin(this.time * 1.3 + wv) * 4;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.16 - wv * 0.012) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.bezierCurveTo(w * 0.3, wy - 8, w * 0.65, wy + 8, w, wy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var netY = this.netY();
    var nw = this.netW;
    var boatY = netY - 48;
    ctx.strokeStyle = 'rgba(255, 248, 214, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.netX - nw * 0.34, boatY + 14);
    ctx.lineTo(this.netX - nw / 2, netY);
    ctx.moveTo(this.netX + nw * 0.34, boatY + 14);
    ctx.lineTo(this.netX + nw / 2, netY);
    ctx.stroke();
    ctx.save();
    ctx.translate(this.netX, boatY);
    ctx.fillStyle = '#fff4da';
    ctx.beginPath();
    ctx.moveTo(-nw * 0.34, 0);
    ctx.lineTo(nw * 0.34, 0);
    ctx.lineTo(nw * 0.25, 18);
    ctx.quadraticCurveTo(0, 25, -nw * 0.25, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(23, 63, 71, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e06d4b';
    ctx.beginPath();
    ctx.roundRect(-nw * 0.17, -15, nw * 0.34, 15, 4);
    ctx.fill();
    ctx.fillStyle = '#77d8d8';
    ctx.fillRect(-nw * 0.11, -12, nw * 0.1, 7);
    ctx.fillRect(nw * 0.02, -12, nw * 0.1, 7);
    ctx.strokeStyle = '#31595c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, -30);
    ctx.stroke();
    ctx.fillStyle = '#ffcf72';
    ctx.beginPath();
    ctx.arc(0, -32, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 248, 214, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.netX - nw / 2, netY);
    ctx.quadraticCurveTo(this.netX, netY + 26, this.netX + nw / 2, netY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    for (var n = 1; n < 7; n++) {
      var nx = this.netX - nw / 2 + (nw / 7) * n;
      ctx.beginPath();
      ctx.moveTo(nx, netY + 3);
      ctx.lineTo(nx, netY + 21);
      ctx.stroke();
    }
    for (var k = 0; k < this.items.length; k++) {
      var it = this.items[k];
      var data = TILE[it.key];
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.fillStyle = 'rgba(0, 24, 34, 0.32)';
      ctx.beginPath();
      ctx.arc(2, 3, it.r + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = data.color;
      ctx.beginPath();
      ctx.arc(0, 0, it.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = data.mine ? 'rgba(255, 88, 66, 0.9)' : 'rgba(255,255,255,0.86)';
      ctx.lineWidth = data.mine ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = '#0b3b46';
      ctx.font = '800 ' + Math.round(it.r * 0.95) + 'px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.glyph, 0, 1);
      ctx.restore();
    }
    for (var p = 0; p < this.particles.length; p++) {
      var pt = this.particles[p];
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var q = 0; q < this.popups.length; q++) {
      var pp = this.popups[q];
      ctx.globalAlpha = Math.max(0, pp.life / pp.maxLife);
      ctx.font = '800 12px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(2, 36, 45, 0.72)';
      var tw = ctx.measureText(pp.text).width;
      ctx.beginPath();
      ctx.roundRect(pp.x - tw / 2 - 7, pp.y - 12, tw + 14, 23, 10);
      ctx.fill();
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y + 1);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(2, 31, 41, 0.84)';
    ctx.fillRect(0, h - 66, w, 66);
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 15px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('潮汐拖网 · 连收 ×' + this.combo, w / 2, h - 38);
    ctx.fillStyle = 'rgba(198, 245, 239, 0.72)';
    ctx.font = '10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('点击或拖动水面移动渔网', w / 2, h - 20);
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255, 100, 76, ' + (this.flash * 0.2).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  };

  CW.TrawlGame = TrawlGame;
})();
