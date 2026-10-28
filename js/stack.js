/* ═══════════════════════════════════════════════════════════════
   码头吊装 · 第九个打捞任务
   看准吊臂位置放下货箱，把六只箱子稳稳码上栈桥。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CW = window.CW;
  if (!CW) return;
  var clamp = CW.clamp;
  var rand = CW.rand;

  var CARGO = [
    { name: '废铁箱', img: 'assets/real/scrap.webp', color: '#b8c5c6', credits: 70, mats: { metal: 3 } },
    { name: '玻璃箱', img: 'assets/collectibles/sea-bottle.webp', color: '#8fe0d8', credits: 80, mats: { glass: 2 } },
    { name: '芯片箱', img: 'assets/real/chip.webp', color: '#79d8ff', credits: 110, mats: { chip: 2 } },
    { name: '保险箱', img: 'assets/real/safe.webp', color: '#ffcf72', credits: 180, mats: { metal: 2, chip: 1 } },
    { name: '金条箱', img: 'assets/real/gold.webp', color: '#ffdf72', credits: 240, mats: {} },
    { name: '燃料箱', img: 'assets/real/fuel.webp', color: '#ffb15e', credits: 90, mats: { fuel: 2 } }
  ];

  function StackGame(arcade, config) {
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
    this.counts = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.stack = [];
    this.delivered = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.crateW = 62;
    this.crateH = 40;
    this.crate = null;
    this.nextIndex = 0;
    this.flash = 0;
    this.popups = [];
    this.particles = [];
    this.sprites = [];
    for (var c = 0; c < CARGO.length; c++) {
      var img = new Image();
      img.src = CARGO[c].img;
      this.sprites.push(img);
    }
    this.spawnCrate();
  }

  StackGame.prototype.spawnCrate = function () {
    var idx = this.nextIndex % CARGO.length;
    var data = CARGO[idx];
    this.crate = {
      idx: idx, data: data,
      x: this.w * 0.5,
      y: 138,
      vy: 0,
      dropping: false,
      angle: Math.sin(this.time * 1.8) * 0.02,
      sway: Math.random() * Math.PI * 2
    };
    this.nextIndex += 1;
  };

  StackGame.prototype.baseY = function () { return this.h - 108; };
  StackGame.prototype.topY = function () { return this.baseY() - this.stack.length * this.crateH; };
  StackGame.prototype.begin = function () {
    this.state = 'play';
    this.remaining = this.duration;
    this.time = 0;
    this.credits = 0;
    this.stack = [];
    this.delivered = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.nextIndex = 0;
    this.popups = [];
    this.particles = [];
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.spawnCrate();
    this.audio.click();
  };
  StackGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    if (this.crate) this.crate.x = clamp(this.crate.x, 42, w - 42);
    for (var i = 0; i < this.stack.length; i++) this.stack[i].x = clamp(this.stack[i].x, 42, w - 42);
  };
  StackGame.prototype.pointerDown = function () {
    if (this.state !== 'play' || !this.crate || this.crate.dropping) return;
    this.crate.dropping = true;
    this.crate.vy = 190;
    this.audio.dash();
  };
  StackGame.prototype.pointerUp = function () {};
  StackGame.prototype.getScore = function () { return this.credits; };
  StackGame.prototype.getHud = function () {
    return {
      statLabel: '剩余货箱',
      stat: String(Math.max(0, 6 - this.delivered)),
      loot: this.counts,
      filters: 0,
      hasAction: true,
      actionLabel: '放下货箱',
      hint: '点击水面放下货箱 · 对准已有货箱或栈桥 · 完美对齐可累计连击 · 偏太多会掉进海里'
    };
  };

  StackGame.prototype.settleCrate = function () {
    var c = this.crate;
    var top = this.stack.length ? this.stack[this.stack.length - 1] : null;
    var diff = top ? Math.abs(c.x - top.x) : 0;
    var ok = !top || diff <= this.crateW * 0.58;
    if (ok) {
      this.stack.push({ x: c.x, idx: c.idx });
      this.delivered += 1;
      var data = c.data;
      var perfect = !top || diff <= 10;
      this.combo = perfect ? this.combo + 1 : 0;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      var bonus = perfect ? 25 * this.combo : 0;
      this.credits += data.credits + this.delivered * 20 + bonus;
      if (perfect) this.popups.push({ x: c.x, y: c.y - 24, text: '完美 ×' + this.combo + ' · +' + bonus, color: '#ffe18a', life: 1.4, maxLife: 1.4 });
      for (var k in data.mats) {
        if (Object.prototype.hasOwnProperty.call(data.mats, k)) this.counts[k] = (this.counts[k] || 0) + data.mats[k];
      }
      this.popups.push({ x: c.x, y: c.y, text: '+' + (data.credits + this.delivered * 20), color: data.color, life: 1.2, maxLife: 1.2 });
      for (var p = 0; p < 12; p++) {
        var a = Math.random() * Math.PI * 2;
        this.particles.push({ x: c.x, y: c.y, vx: Math.cos(a) * rand(20, 100), vy: Math.sin(a) * rand(20, 100) - 40, life: rand(0.3, 0.8), maxLife: 0.8, size: rand(1, 3), color: data.color });
      }
      this.audio.coin();
    } else {
      this.missed += 1;
      this.combo = 0;
      this.remaining = Math.max(0, this.remaining - 4);
      this.flash = 0.8;
      this.popups.push({ x: c.x, y: c.y, text: '偏了！-4 秒', color: '#ff7a62', life: 1.5, maxLife: 1.5 });
      this.audio.hurt();
    }
    this.crate = null;
    if (this.delivered + this.missed >= 6) {
      this.finish();
      return;
    }
    var self = this;
    window.setTimeout(function () { if (self.state === 'play') self.spawnCrate(); }, 330);
  };

  StackGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining -= dt;
    this.flash = Math.max(0, this.flash - dt * 2);
    if (this.crate) {
      var c = this.crate;
      if (!c.dropping) {
        c.x = this.w * 0.5 + Math.sin(this.time * 1.55 + c.sway) * (this.w * 0.32);
        c.x = clamp(c.x, 42, this.w - 42);
        c.y = 138;
      } else {
        c.vy += 680 * dt;
        c.y += c.vy * dt;
        var targetY = this.topY() - this.crateH;
        if (c.y >= targetY) {
          c.y = targetY;
          this.settleCrate();
        }
      }
    }
    for (var pi = this.particles.length - 1; pi >= 0; pi--) {
      var pt = this.particles[pi];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 120 * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(pi, 1);
    }
    for (var qi = this.popups.length - 1; qi >= 0; qi--) {
      this.popups[qi].life -= dt;
      if (this.popups[qi].life <= 0) this.popups.splice(qi, 1);
    }
    if (this.remaining <= 0) this.finish();
  };

  StackGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.state = 'done';
    this.result = {
      type: 'stack',
      score: this.credits,
      credits: this.credits,
      collectibles: [],
      filters: 0,
      materials: this.counts
    };
  };

  StackGame.prototype.drawCrate = function (ctx, x, y, idx) {
    var w = this.crateW;
    var h = this.crateH;
    var data = CARGO[idx];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(2, 24, 32, 0.32)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 3, -h / 2 + 5, w, h, 7);
    ctx.fill();
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();
    var img = this.sprites[idx];
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4);
      ctx.clip();
      var scale = Math.max((w - 8) / img.naturalWidth, (h - 8) / img.naturalHeight);
      ctx.drawImage(img, -(img.naturalWidth * scale) / 2, -(img.naturalHeight * scale) / 2, img.naturalWidth * scale, img.naturalHeight * scale);
      ctx.restore();
    }
    ctx.strokeStyle = '#fffdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(2, 31, 41, 0.7)';
    ctx.fillRect(-w / 2, h / 2 - 12, w, 12);
    ctx.fillStyle = '#eafff6';
    ctx.font = '700 7px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.name, 0, h / 2 - 6);
    ctx.restore();
  };

  StackGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#dff8ef');
    sky.addColorStop(0.42, '#8fe4e2');
    sky.addColorStop(0.55, '#2aa8b9');
    sky.addColorStop(1, '#07536b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 248, 225, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.16, h * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (var wv = 0; wv < 7; wv++) {
      var wy = h * 0.52 + wv * 16;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.bezierCurveTo(w * 0.3, wy - 7, w * 0.7, wy + 7, w, wy);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(23, 63, 71, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 96);
    ctx.lineTo(w, 96);
    ctx.stroke();
    var topY = this.baseY() - this.stack.length * this.crateH;
    ctx.strokeStyle = 'rgba(255, 205, 110, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.crate ? this.crate.x : w / 2, 98);
    ctx.lineTo(this.crate ? this.crate.x : w / 2, this.crate ? this.crate.y - 20 : 140);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, this.baseY() + 4);
    ctx.lineTo(w * 0.9, this.baseY() + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 246, 220, 0.65)';
    ctx.fillRect(w * 0.06, this.baseY() + 4, w * 0.88, 10);
    if (this.stack.length) {
      var top = this.stack[this.stack.length - 1];
      ctx.strokeStyle = 'rgba(255, 225, 138, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(top.x - this.crateW * 0.58, topY - this.crateH, this.crateW * 1.16, this.crateH);
      ctx.setLineDash([]);
    }
    for (var s = 0; s < this.stack.length; s++) {
      this.drawCrate(ctx, this.stack[s].x, this.baseY() - this.crateH / 2 - s * this.crateH, this.stack[s].idx);
    }
    if (this.crate) {
      ctx.save();
      ctx.translate(this.crate.x, this.crate.y);
      ctx.rotate(this.crate.dropping ? 0 : Math.sin(this.time * 2.2) * 0.08);
      ctx.translate(-this.crate.x, -this.crate.y);
      this.drawCrate(ctx, this.crate.x, this.crate.y, this.crate.idx);
      ctx.restore();
    }
    for (var pi = 0; pi < this.particles.length; pi++) {
      var pt = this.particles[pi];
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
    ctx.fillStyle = 'rgba(2, 31, 41, 0.84)';
    ctx.fillRect(0, h - 66, w, 66);
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 15px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('码头吊装 · 已卸 ' + this.delivered + ' / 6 · 完美 ×' + this.combo, w / 2, h - 38);
    ctx.fillStyle = 'rgba(198, 245, 239, 0.72)';
    ctx.font = '10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('点击水面放下货箱 · 对准再放', w / 2, h - 20);
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255, 100, 76, ' + (this.flash * 0.18).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  };

  CW.StackGame = StackGame;
})();
