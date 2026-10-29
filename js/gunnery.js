/* ═══════════════════════════════════════════════════════════════
   黄金炮击 · 第十个打捞任务
   转动船首炮，击中来袭货箱，避开或清理水雷。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CW = window.CW;
  if (!CW) return;
  var clamp = CW.clamp;
  var rand = CW.rand;

  var TARGETS = {
    crate: { name: '漂流货箱', glyph: '箱', color: '#ffcf72', img: 'assets/real/storage.webp', credits: 70, mats: { metal: 2, glass: 1 } },
    gold: { name: '金条箱', glyph: '金', color: '#ffdf72', img: 'assets/real/gold.webp', credits: 160, mats: {} },
    chip: { name: '芯片箱', glyph: '芯', color: '#79d8ff', img: 'assets/real/chip.webp', credits: 95, mats: { chip: 2 } },
    relic: { name: '沉船遗物', glyph: '遗', color: '#d9b8ff', img: 'assets/collectibles/captain-log.webp', credits: 120, collectible: true },
    mine: { name: '漂浮水雷', glyph: '雷', color: '#ff7a62', img: 'assets/real/mine.webp', mine: true }
  };

  function GunneryGame(arcade, config) {
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
    this.caught = 0;
    this.combo = 0;
    this.counts = {};
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.collectibles = [];
    this.targets = [];
    this.bullets = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 0.3;
    this.player = { x: this.w / 2, y: this.h - 76, angle: -Math.PI / 2, cooldown: 0 };
    this.sprites = {};
    for (var key in TARGETS) {
      if (!Object.prototype.hasOwnProperty.call(TARGETS, key)) continue;
      var img = new Image();
      img.src = TARGETS[key].img;
      this.sprites[key] = img;
    }
    this.cannonImg = new Image();
    this.cannonImg.src = 'assets/collectibles/unique-v2/golden-cannon.webp';
  }

  GunneryGame.prototype.begin = function () {
    this.state = 'play';
    this.remaining = this.duration;
    this.time = 0;
    this.credits = 0;
    this.caught = 0;
    this.combo = 0;
    this.targets = [];
    this.bullets = [];
    this.particles = [];
    this.popups = [];
    this.collectibles = [];
    for (var i = 0; i < CW.MATERIALS.length; i++) this.counts[CW.MATERIALS[i].id] = 0;
    this.spawnTimer = 0.3;
    this.player.x = this.w / 2;
    this.player.y = this.h - 76;
    this.player.angle = -Math.PI / 2;
    this.player.cooldown = 0;
    this.audio.click();
  };

  GunneryGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.player.x = w / 2;
    this.player.y = h - 76;
  };

  GunneryGame.prototype.pointerDown = function (x, y) {
    if (this.state !== 'play' || this.player.cooldown > 0) return;
    var p = this.player;
    var a = Math.atan2(y - p.y, x - p.x);
    if (a > -0.18) a = -0.18;
    p.angle = a;
    p.cooldown = 0.24;
    var mx = p.x + Math.cos(a) * 30;
    var my = p.y + Math.sin(a) * 30;
    this.bullets.push({ x: mx, y: my, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, life: 1.2 });
    this.audio.click();
  };
  GunneryGame.prototype.pointerMove = function (x, y) {
    if (this.state !== 'play') return;
    var p = this.player;
    var a = Math.atan2(y - p.y, x - p.x);
    if (a > -0.18) a = -0.18;
    p.angle = a;
  };
  GunneryGame.prototype.pointerUp = function () {};
  GunneryGame.prototype.getScore = function () { return this.credits; };
  GunneryGame.prototype.getHud = function () {
    return {
      statLabel: '剩余时间',
      stat: Math.max(0, Math.ceil(this.remaining)) + 's',
      loot: this.counts,
      filters: 0,
      hasAction: false,
      hint: '点击海面瞄准并开炮 · 击落货箱与金条 · 水雷会扣 3 秒'
    };
  };

  GunneryGame.prototype.spawn = function () {
    var roll = Math.random();
    var key = 'crate';
    if (roll < 0.16) key = 'mine';
    else if (roll < 0.26) key = 'relic';
    else if (roll < 0.40) key = 'gold';
    else if (roll < 0.64) key = 'chip';
    this.targets.push({
      key: key,
      x: rand(50, this.w - 50),
      y: -30,
      vx: rand(-32, 32),
      vy: rand(42, 72) + Math.min(30, this.time * 0.45),
      r: key === 'gold' ? 20 : 18,
      bob: Math.random() * Math.PI * 2
    });
  };

  GunneryGame.prototype.hit = function (t) {
    var data = TARGETS[t.key];
    if (data.mine) {
      this.remaining = Math.max(0, this.remaining - 3);
      this.combo = 0;
      this.popups.push({ x: t.x, y: t.y, text: '水雷！-3 秒', color: data.color, life: 1.3, maxLife: 1.3 });
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
      this.popups.push({ x: t.x, y: t.y - 24, text: '收藏！' + cdef.name, color: data.color, life: 1.6, maxLife: 1.6 });
    }
    this.popups.push({ x: t.x, y: t.y, text: '+' + gained, color: data.color, life: 1.0, maxLife: 1.0 });
    for (var p = 0; p < 11; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: t.x, y: t.y, vx: Math.cos(a) * rand(30, 120), vy: Math.sin(a) * rand(30, 120), life: rand(0.25, 0.65), maxLife: 0.65, size: rand(1, 3), color: data.color });
    }
    this.audio.coin();
  };

  GunneryGame.prototype.update = function (dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.remaining -= dt;
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.28, 0.62 - this.time * 0.006);
      this.spawn();
    }
    for (var i = this.targets.length - 1; i >= 0; i--) {
      var t = this.targets[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      if (t.x < 30 || t.x > this.w - 30) t.vx *= -1;
      if (t.y > this.h - 120) {
        if (!TARGETS[t.key].mine) {
          this.remaining = Math.max(0, this.remaining - 2);
          this.popups.push({ x: t.x, y: this.h - 130, text: '漏掉了 -2 秒', color: '#ff9b78', life: 1.1, maxLife: 1.1 });
        }
        this.targets.splice(i, 1);
      }
    }
    for (var b = this.bullets.length - 1; b >= 0; b--) {
      var bu = this.bullets[b];
      bu.x += bu.vx * dt;
      bu.y += bu.vy * dt;
      bu.life -= dt;
      if (bu.x < -20 || bu.x > this.w + 20 || bu.y < -20 || bu.life <= 0) {
        this.bullets.splice(b, 1);
        continue;
      }
      for (var ti = this.targets.length - 1; ti >= 0; ti--) {
        var tt = this.targets[ti];
        var dx = bu.x - tt.x;
        var dy = bu.y - tt.y;
        if (dx * dx + dy * dy < (tt.r + 5) * (tt.r + 5)) {
          this.hit(tt);
          this.bullets.splice(b, 1);
          this.targets.splice(ti, 1);
          break;
        }
      }
    }
    for (var p = this.particles.length - 1; p >= 0; p--) {
      var pt = this.particles[p];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(p, 1);
    }
    for (var q = this.popups.length - 1; q >= 0; q--) {
      this.popups[q].life -= dt;
      if (this.popups[q].life <= 0) this.popups.splice(q, 1);
    }
    if (this.remaining <= 0) this.finish();
  };

  GunneryGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.state = 'done';
    this.result = {
      type: 'gunnery',
      score: this.credits,
      credits: this.credits,
      collectibles: this.collectibles.slice(),
      filters: 0,
      materials: this.counts
    };
  };

  GunneryGame.prototype.drawTarget = function (ctx, t) {
    var data = TARGETS[t.key];
    var img = this.sprites[t.key];
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = 'rgba(0, 24, 34, 0.32)';
    ctx.beginPath();
    ctx.arc(2, 3, t.r + 2, 0, Math.PI * 2);
    ctx.fill();
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, t.r, 0, Math.PI * 2);
      ctx.clip();
      var s = Math.max((t.r * 2) / img.naturalWidth, (t.r * 2) / img.naturalHeight);
      ctx.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
      ctx.restore();
    } else {
      ctx.fillStyle = data.color;
      ctx.beginPath();
      ctx.arc(0, 0, t.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = data.mine ? '#ff6b55' : data.color;
    ctx.lineWidth = data.mine ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, t.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(2,31,41,.8)';
    ctx.beginPath();
    ctx.arc(t.r * 0.65, t.r * 0.65, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 7px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.glyph, t.r * 0.65, t.r * 0.65 + 0.5);
    ctx.restore();
  };

  GunneryGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    var sea = ctx.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#bdf6ec');
    sea.addColorStop(0.38, '#32b9c3');
    sea.addColorStop(0.74, '#09647d');
    sea.addColorStop(1, '#043347');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (var wv = 0; wv < 8; wv++) {
      var wy = h * 0.35 + wv * 22;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.bezierCurveTo(w * 0.3, wy - 6, w * 0.7, wy + 6, w, wy);
      ctx.stroke();
    }
    for (var i = 0; i < this.targets.length; i++) this.drawTarget(ctx, this.targets[i]);
    for (var b = 0; b < this.bullets.length; b++) {
      var bu = this.bullets[b];
      ctx.fillStyle = '#ffe6a1';
      ctx.beginPath();
      ctx.arc(bu.x, bu.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 230, 161, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bu.x, bu.y);
      ctx.lineTo(bu.x - bu.vx * 0.012, bu.y - bu.vy * 0.012);
      ctx.stroke();
    }
    var p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle + Math.PI / 2);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-6, -44, 12, 48);
    ctx.fillStyle = 'rgba(255, 225, 138, 0.55)';
    ctx.fillRect(-3, -52, 6, 12);
    ctx.restore();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(255, 230, 160, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    var cimg = this.cannonImg;
    if (cimg && cimg.complete && cimg.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.clip();
      var cs = Math.max(52 / cimg.naturalWidth, 52 / cimg.naturalHeight);
      ctx.drawImage(cimg, -cimg.naturalWidth * cs / 2, -cimg.naturalHeight * cs / 2, cimg.naturalWidth * cs, cimg.naturalHeight * cs);
      ctx.restore();
    }
    ctx.strokeStyle = '#ffe6a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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
      ctx.fillStyle = 'rgba(2,36,45,.72)';
      var tw = ctx.measureText(pp.text).width;
      ctx.beginPath();
      ctx.roundRect(pp.x - tw / 2 - 7, pp.y - 12, tw + 14, 23, 10);
      ctx.fill();
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y + 1);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(2,31,41,.86)';
    ctx.fillRect(0, h - 66, w, 66);
    ctx.fillStyle = '#eafff6';
    ctx.font = '800 15px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('黄金炮击 · 连击 ×' + this.combo, w / 2, h - 38);
    ctx.fillStyle = 'rgba(198,245,239,.72)';
    ctx.font = '10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('点击海面瞄准开炮 · 水雷会扣 3 秒', w / 2, h - 20);
  };

  CW.GunneryGame = GunneryGame;
})();
