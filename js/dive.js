/* ═══════════════════════════════════════════════════════════════
   深海潜航 · 第八个打捞任务
   拖动潜水员在断面间穿行，收集漂浮货箱与旧世界遗物。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CW = window.CW;
  if (!CW) return;
  var clamp = CW.clamp;
  var rand = CW.rand;

  var LOOT = {
    glass: { name: '玻璃瓶', glyph: '玻', img: 'assets/collectibles/sea-bottle.webp', color: '#8fe0d8', credits: 32, mats: { glass: 2 } },
    copper: { name: '铜罗盘', glyph: '铜', img: 'assets/collectibles/brass-compass.webp', color: '#e2a06a', credits: 50, mats: { copper: 2 } },
    chip: { name: '芯片箱', glyph: '芯', img: 'assets/real/chip.webp', color: '#79d8ff', credits: 70, mats: { chip: 2 } },
    gold: { name: '金条', glyph: '金', img: 'assets/real/gold.webp', color: '#ffdf72', credits: 160, mats: {} },
    relic: { name: '沉船遗物', glyph: '遗', img: 'assets/collectibles/captain-log.webp', color: '#d9b8ff', credits: 95, collectible: true },
    oxygen: { name: '氧气瓶', glyph: '氧', img: 'assets/seawater-filter-icon.webp', color: '#9feeff', power: 'oxygen' },
    shield: { name: '潜航护盾', glyph: '盾', img: 'assets/real/core.webp', color: '#ffd166', power: 'shield' },
    magnet: { name: '磁力钩', glyph: '磁', img: 'assets/real/sonar.webp', color: '#79d8ff', power: 'magnet' },
    mine: { name: '漂浮水雷', glyph: '雷', img: 'assets/real/mine.webp', color: '#ff7a62', mine: true }
  };

  function DiveGame(arcade, config) {
    this.arcade = arcade;
    this.audio = arcade.audio;
    this.w = config.w;
    this.h = config.h;
    this.duration = 45;
    this.remaining = this.duration;
    this.state = 'waiting';
    this.done = false;
    this.result = null;
    this.time = 0;
    this.credits = 0;
    this.counts = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.collectibles = [];
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 0;
    this.spawnGap = 0.62;
    this.player = { x: this.w * 0.24, y: this.h * 0.55, targetY: this.h * 0.55, r: 24 };
    this.combo = 0;
    this.caught = 0;
    this.effects = { magnet: 0, shield: 0 };
    this.sprites = {};
    for (var key in LOOT) {
      if (!Object.prototype.hasOwnProperty.call(LOOT, key)) continue;
      var img = new Image();
      img.src = LOOT[key].img;
      this.sprites[key] = img;
    }
    this.diverImg = new Image();
    this.diverImg.src = 'assets/collectibles/diving-helmet.webp';
  }

  DiveGame.prototype.begin = function () {
    this.state = 'play';
    this.remaining = this.duration;
    this.time = 0;
    this.credits = 0;
    this.combo = 0;
    this.caught = 0;
    this.effects = { magnet: 0, shield: 0 };
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.collectibles = [];
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.player.x = this.w * 0.24;
    this.player.y = this.h * 0.55;
    this.player.targetY = this.player.y;
    this.spawnTimer = 0.35;
    this.spawnGap = 0.62;
    this.audio.click();
  };

  DiveGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.player.x = w * 0.24;
    this.player.y = clamp(this.player.y, 130, h - 150);
    this.player.targetY = this.player.y;
  };

  DiveGame.prototype.pointerDown = function (x, y) {
    this.player.targetY = clamp(y, 130, this.h - 150);
  };
  DiveGame.prototype.pointerMove = function (x, y) { this.pointerDown(x, y); };
  DiveGame.prototype.pointerUp = function () {};

  DiveGame.prototype.getScore = function () { return this.credits; };
  DiveGame.prototype.getHud = function () {
    return {
      statLabel: '剩余时间',
      stat: Math.max(0, Math.ceil(this.remaining)) + 's',
      loot: this.counts,
      filters: 0,
      hasAction: false,
      hint: '点击 / 拖动深海断面移动潜水员 · 氧气 +10 秒 · 护盾 / 磁力钩随机出现 · 水雷扣 4 秒'
    };
  };

  DiveGame.prototype.spawn = function () {
    var roll = Math.random();
    var key = 'glass';
    if (roll < 0.12) key = 'mine';
    else {
      var pick = Math.random();
      if (pick < 0.04) key = 'oxygen';
      else if (pick < 0.08) key = 'shield';
      else if (pick < 0.12) key = 'magnet';
      else if (pick < 0.22) key = 'relic';
      else if (pick < 0.38) key = 'gold';
      else if (pick < 0.62) key = 'chip';
      else if (pick < 0.82) key = 'copper';
    }
    var item = {
      key: key,
      x: this.w + 36,
      y: rand(140, this.h - 170),
      vx: -rand(88, 142) - Math.min(35, this.time * 0.45),
      bob: Math.random() * Math.PI * 2,
      r: key === 'gold' ? 19 : key === 'relic' ? 18 : 16
    };
    this.items.push(item);
  };

  DiveGame.prototype.catchItem = function (item) {
    var data = LOOT[item.key];
    if (data.power) {
      if (data.power === 'oxygen') {
        this.remaining += 10;
        this.popups.push({ x: item.x, y: item.y, text: '氧气 +10 秒', color: data.color, life: 1.5, maxLife: 1.5 });
      } else if (data.power === 'shield') {
        this.effects.shield = 1;
        this.popups.push({ x: item.x, y: item.y, text: '潜航护盾 就绪', color: data.color, life: 1.5, maxLife: 1.5 });
      } else {
        this.effects.magnet = 6;
        this.popups.push({ x: item.x, y: item.y, text: '磁力钩 6 秒', color: data.color, life: 1.5, maxLife: 1.5 });
      }
      this.audio.relic();
      return;
    }
    if (data.mine) {
      if (this.effects.shield > 0) {
        this.effects.shield = 0;
        this.popups.push({ x: item.x, y: item.y, text: '护盾挡下水雷', color: '#ffd166', life: 1.5, maxLife: 1.5 });
        this.audio.relic();
        return;
      }
      this.remaining = Math.max(0, this.remaining - 4);
      this.combo = 0;
      this.popups.push({ x: item.x, y: item.y, text: '水雷！-4 秒', color: '#ff7a62', life: 1.2, maxLife: 1.2 });
      this.audio.hurt();
      return;
    }
    this.caught += 1;
    this.combo = Math.min(9, this.combo + 1);
    var gained = Math.round(data.credits * (1 + (this.combo - 1) * 0.06));
    this.credits += gained;
    for (var k in data.mats) {
      if (Object.prototype.hasOwnProperty.call(data.mats, k)) this.counts[k] = (this.counts[k] || 0) + data.mats[k];
    }
    if (data.collectible && CW.rollCollectibleDef) {
      var cdef = CW.rollCollectibleDef();
      this.collectibles.push(cdef.id);
      this.popups.push({ x: item.x, y: item.y - 22, text: '收藏！' + cdef.name, color: '#d9b8ff', life: 1.7, maxLife: 1.7 });
      this.audio.relic();
    }
    this.popups.push({ x: item.x, y: item.y, text: '+' + gained, color: data.color, life: 1.0, maxLife: 1.0 });
    if (this.combo > 1) this.popups.push({ x: item.x, y: item.y - 38, text: '连收 ×' + this.combo, color: '#ffe18a', life: 1.0, maxLife: 1.0 });
    for (var p = 0; p < 10; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: item.x, y: item.y, vx: Math.cos(a) * rand(20, 90), vy: Math.sin(a) * rand(20, 90), life: rand(0.3, 0.7), maxLife: 0.7, size: rand(1, 2.8), color: data.color });
    }
    this.audio.coin();
  };

  DiveGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining -= dt;
    this.effects.magnet = Math.max(0, this.effects.magnet - dt);
    this.spawnTimer -= dt;
    this.spawnGap = Math.max(0.34, 0.62 - this.time * 0.004);
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnGap;
      this.spawn();
    }
    var p = this.player;
    p.y += clamp(p.targetY - p.y, -360 * dt, 360 * dt);
    for (var i = this.items.length - 1; i >= 0; i--) {
      var it = this.items[i];
      it.x += it.vx * dt;
      it.y += Math.sin(this.time * 2 + it.bob) * 12 * dt;
      if (this.effects.magnet > 0 && it.x < this.w * 0.85) {
        it.x += clamp(p.x - it.x, -150 * dt, 150 * dt);
        it.y += clamp(p.y - it.y, -110 * dt, 110 * dt);
      }
      var dx = it.x - p.x;
      var dy = it.y - p.y;
      if (dx * dx + dy * dy < (p.r + it.r) * (p.r + it.r)) {
        this.catchItem(it);
        this.items.splice(i, 1);
        continue;
      }
      if (it.x < -50) this.items.splice(i, 1);
    }
    for (var pi = this.particles.length - 1; pi >= 0; pi--) {
      var pt = this.particles[pi];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(pi, 1);
    }
    for (var qi = this.popups.length - 1; qi >= 0; qi--) {
      this.popups[qi].life -= dt;
      if (this.popups[qi].life <= 0) this.popups.splice(qi, 1);
    }
    if (this.remaining <= 0) this.finish();
  };

  DiveGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.state = 'done';
    this.result = {
      type: 'dive',
      score: this.credits,
      credits: this.credits,
      collectibles: this.collectibles.slice(),
      filters: 0,
      materials: this.counts
    };
  };

  DiveGame.prototype.drawSprite = function (ctx, key, x, y, r) {
    var data = LOOT[key];
    var img = this.sprites[key];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0, 24, 34, 0.32)';
    ctx.beginPath();
    ctx.arc(3, 4, r + 2, 0, Math.PI * 2);
    ctx.fill();
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      var scale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
      ctx.drawImage(img, -img.naturalWidth * scale / 2, -img.naturalHeight * scale / 2, img.naturalWidth * scale, img.naturalHeight * scale);
      ctx.restore();
    } else {
      ctx.fillStyle = data.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = data.mine ? '#ff7a62' : data.color;
    ctx.lineWidth = data.mine ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(2, 31, 41, 0.78)';
    ctx.beginPath();
    ctx.arc(r * 0.68, r * 0.68, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 7px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.glyph, r * 0.68, r * 0.68 + 0.5);
    ctx.restore();
  };

  DiveGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    var ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#bff8f1');
    ocean.addColorStop(0.34, '#39c3cc');
    ocean.addColorStop(0.7, '#0b6a8a');
    ocean.addColorStop(1, '#04364f');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (var b = 0; b < 26; b++) {
      var bx = (w - ((this.time * (18 + b * 2.3) + b * 71) % (w + 80))) + 40;
      var by = h - ((this.time * (9 + b * 1.7) + b * 47) % h);
      ctx.strokeStyle = 'rgba(220,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(bx, by, 1.8 + (b % 4), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(2, 39, 51, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - 80);
    ctx.quadraticCurveTo(w * 0.25, h - 130, w * 0.5, h - 94);
    ctx.quadraticCurveTo(w * 0.76, h - 60, w, h - 105);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      this.drawSprite(ctx, it.key, it.x, it.y, it.r);
    }
    var p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = 'rgba(190, 255, 250, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 8, 0, Math.PI * 2);
    ctx.stroke();
    var dimg = this.diverImg;
    if (dimg && dimg.complete && dimg.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.clip();
      var ds = Math.max((p.r * 2) / dimg.naturalWidth, (p.r * 2) / dimg.naturalHeight);
      ctx.drawImage(dimg, -dimg.naturalWidth * ds / 2, -dimg.naturalHeight * ds / 2, dimg.naturalWidth * ds, dimg.naturalHeight * ds);
      ctx.restore();
    }
    ctx.strokeStyle = '#eafff6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    for (var pti = 0; pti < this.particles.length; pti++) {
      var pt = this.particles[pti];
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
      ctx.fillStyle = 'rgba(2, 36, 45, 0.7)';
      var tw = ctx.measureText(pp.text).width;
      ctx.beginPath();
      ctx.roundRect(pp.x - tw / 2 - 7, pp.y - 12, tw + 14, 23, 10);
      ctx.fill();
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y + 1);
    }
    ctx.globalAlpha = 1;
    var effectParts = [];
    if (this.effects.magnet > 0) effectParts.push('磁力钩 ' + Math.ceil(this.effects.magnet) + 's');
    if (this.effects.shield > 0) effectParts.push('潜航护盾 就绪');
    if (effectParts.length) {
      ctx.font = '800 10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      var et = effectParts.join(' · ');
      var ew = ctx.measureText(et).width;
      ctx.fillStyle = 'rgba(2, 36, 45, 0.7)';
      ctx.beginPath();
      ctx.roundRect(w / 2 - ew / 2 - 8, h - 88, ew + 16, 20, 9);
      ctx.fill();
      ctx.fillStyle = '#c8fff3';
      ctx.fillText(et, w / 2, h - 75);
    }
    ctx.fillStyle = 'rgba(2, 31, 41, 0.84)';
    ctx.fillRect(0, h - 66, w, 66);
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 15px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('深海潜航 · 连收 ×' + this.combo, w / 2, h - 38);
    ctx.fillStyle = 'rgba(198, 245, 239, 0.72)';
    ctx.font = '10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('点击或拖动水域移动潜水员', w / 2, h - 20);
  };

  CW.DiveGame = DiveGame;
})();

