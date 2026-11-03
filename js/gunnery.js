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
    this.specialCharge = 0;
    this.spreadReady = false;
    this.spreadShots = 0;
    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = 0;
    this.supplies = [];
    this.suppliesCollected = 0;
    this.supplyBonus = false;
    this.goldenSupply = false;
    this.goldenCollected = 0;
    this.supplyBonusCredits = 0;
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
    this.specialCharge = 0;
    this.spreadReady = false;
    this.spreadShots = 0;
    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = 0;
    this.supplies = [];
    this.suppliesCollected = 0;
    this.supplyBonus = false;
    this.goldenSupply = false;
    this.goldenCollected = 0;
    this.supplyBonusCredits = 0;
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
    var spread = this.spreadReady;
    p.cooldown = spread ? 0.34 : 0.24;
    if (spread) {
      this.spreadReady = false;
      this.spreadShots += 1;
      this.popups.push({ x: p.x, y: p.y - 42, text: '散射炮 ×3', color: '#ffdf72', life: 1.1, maxLife: 1.1 });
    }
    var angles = spread ? [a - 0.14, a, a + 0.14] : [a];
    for (var ai = 0; ai < angles.length; ai++) {
      var aa = angles[ai];
      this.bullets.push({ x: p.x + Math.cos(aa) * 30, y: p.y + Math.sin(aa) * 30, vx: Math.cos(aa) * 720, vy: Math.sin(aa) * 720, life: 1.2, special: spread });
    }
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
      hint: '点击海面瞄准开炮 · 每命中 5 次装填散射炮 · 15 秒后走私炮艇出现 · 水雷扣 3 秒'
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

  GunneryGame.prototype.spawnBoss = function () {
    this.bossSpawned = true;
    this.boss = { x: this.w + 64, y: rand(150, this.h * 0.4), vx: -52, hp: 3, r: 40, phase: 0 };
    this.popups.push({ x: this.w / 2, y: 160, text: '走私炮艇接近！', color: '#ffcf72', life: 1.8, maxLife: 1.8 });
    this.audio.claim();
  };

  GunneryGame.prototype.hitBoss = function (boss) {
    boss.hp -= 1;
    this.audio.hit ? this.audio.hit() : this.audio.click();
    this.particles.push({ x: boss.x, y: boss.y, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, size: 8, color: '#ffcf72' });
    this.popups.push({ x: boss.x, y: boss.y - 46, text: '炮艇装甲 -1', color: '#ffcf72', life: 0.8, maxLife: 0.8 });
    if (boss.hp > 0) return;
    this.boss = null;
    this.bossDefeated += 1;
    this.spawnBossSupplies(boss.x, boss.y);
    this.credits += 500;
    if (CW.rollCollectibleDef) {
      var cdef = CW.rollCollectibleDef();
      this.collectibles.push(cdef.id);
      this.popups.push({ x: boss.x, y: boss.y - 76, text: '炮艇击沉 · 收藏 ' + cdef.name, color: '#ffdf72', life: 2.0, maxLife: 2.0 });
    }
    this.popups.push({ x: boss.x, y: boss.y - 54, text: '走私炮艇击沉 +500', color: '#ffe18a', life: 1.8, maxLife: 1.8 });
    for (var p = 0; p < 34; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * rand(50, 220), vy: Math.sin(a) * rand(50, 220), life: rand(0.4, 1), maxLife: 1, size: rand(2, 5), color: '#ffcf72' });
    }
    this.audio.claim();
  };

  GunneryGame.prototype.spawnBossSupplies = function (x, y) {
    var baseX = Math.min(this.w - 80, Math.max(80, x));
    for (var i = 0; i < 3; i++) {
      var sx = Math.min(this.w - 36, Math.max(36, baseX + (i - 1) * 34));
      this.supplies.push({ x: sx, y: y + 8, vx: (i - 1) * 16, vy: 24, r: 15, life: 5, phase: Math.random() * Math.PI * 2 });
    }
    this.popups.push({ x: this.w / 2, y: y + 56, text: '炮艇残骸 · 3 个补给箱', color: '#ffdf72', life: 1.8, maxLife: 1.8 });
  };

  GunneryGame.prototype.collectSupply = function (index) {
    var s = this.supplies[index];
    if (!s) return;
    this.supplies.splice(index, 1);
    if (s.golden) {
      this.credits += 400;
      this.goldenCollected = 1;
      if (CW.rollCollectibleDef) this.collectibles.push(CW.rollCollectibleDef().id);
      this.popups.push({ x: s.x, y: s.y - 30, text: '黄金补给 · +400 · 收藏 +1', color: '#fff1b0', life: 2, maxLife: 2 });
      for (var gp = 0; gp < 24; gp++) {
        var ga = Math.random() * Math.PI * 2;
        this.particles.push({ x: s.x, y: s.y, vx: Math.cos(ga) * rand(40, 150), vy: Math.sin(ga) * rand(40, 150), life: rand(0.3, 0.8), maxLife: 0.8, size: rand(1.5, 4), color: '#fff1b0' });
      }
      this.audio.coin();
      return;
    }
    this.suppliesCollected += 1;
    this.credits += 120;
    if (this.suppliesCollected >= 3 && !this.supplyBonus) {
      this.supplyBonus = true;
      this.supplyBonusCredits = 300;
      this.credits += 300;
      if (CW.rollCollectibleDef) this.collectibles.push(CW.rollCollectibleDef().id);
      this.popups.push({ x: s.x, y: s.y - 50, text: '补给全清 · +300 · 收藏 +1', color: '#fff1b0', life: 1.9, maxLife: 1.9 });
      this.spawnGoldenSupply(s.x, s.y - 24);
    }
    if (CW.rollCollectibleDef && Math.random() < 0.3) {
      var cdef = CW.rollCollectibleDef();
      this.collectibles.push(cdef.id);
      this.popups.push({ x: s.x, y: s.y - 32, text: '补给收藏！' + cdef.name, color: '#ffdf72', life: 1.5, maxLife: 1.5 });
    }
    this.popups.push({ x: s.x, y: s.y, text: '补给箱 +120', color: '#ffdf72', life: 1.0, maxLife: 1.0 });
    for (var p = 0; p < 10; p++) {
      var a = Math.random() * Math.PI * 2;
      this.particles.push({ x: s.x, y: s.y, vx: Math.cos(a) * rand(30, 110), vy: Math.sin(a) * rand(30, 110), life: rand(0.25, 0.6), maxLife: 0.6, size: rand(1, 3), color: '#ffdf72' });
    }
    this.audio.coin();
  };

  GunneryGame.prototype.spawnGoldenSupply = function (x, y) {
    this.goldenSupply = true;
    this.supplies.push({ x: Math.min(this.w - 70, Math.max(70, x)), y: Math.max(110, y), vx: 0, vy: 18, r: 20, life: 7, phase: Math.random() * Math.PI * 2, golden: true });
    this.popups.push({ x: this.w / 2, y: y - 24, text: '黄金补给出现 · 7 秒', color: '#fff1b0', life: 1.8, maxLife: 1.8 });
  };

  GunneryGame.prototype.drawSupply = function (ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y + Math.sin(s.phase * 4) * 2);
    ctx.fillStyle = 'rgba(2, 24, 32, 0.3)';
    ctx.beginPath(); ctx.ellipse(2, 6, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = s.golden ? '#8d650d' : '#5a3d16';
    ctx.strokeStyle = s.golden ? '#fff1b0' : '#ffdf72';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.roundRect(-16, -13, 32, 26, 5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 223, 114, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 13); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.stroke();
    ctx.fillStyle = '#ffe9a5';
    ctx.font = '800 10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.golden ? '★' : '补', 0, 1);
    ctx.restore();
  };

  GunneryGame.prototype.drawBoss = function (ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y + Math.sin(boss.phase * 2) * 4);
    ctx.fillStyle = 'rgba(2, 24, 32, 0.38)';
    ctx.beginPath(); ctx.ellipse(3, 6, 47, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b3038';
    ctx.strokeStyle = '#ffcf72';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-45, 4); ctx.lineTo(-27, -17); ctx.lineTo(26, -17); ctx.lineTo(45, 4); ctx.lineTo(28, 22); ctx.lineTo(-28, 22); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffcf72';
    ctx.fillRect(-20, -10, 40, 7);
    ctx.fillStyle = '#ff8a5c';
    ctx.beginPath(); ctx.arc(-24, 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe18a';
    ctx.font = '800 9px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('走私炮艇', 0, 51);
    for (var hp = 0; hp < 3; hp++) {
      ctx.fillStyle = hp < boss.hp ? '#ffcf72' : 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.arc(-14 + hp * 14, 37, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
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
    this.specialCharge += 1;
    if (this.specialCharge >= 5) {
      this.specialCharge = 0;
      this.spreadReady = true;
      this.popups.push({ x: this.player.x, y: this.player.y - 48, text: '散射炮已装填 · 下一发 ×3', color: '#ffdf72', life: 1.5, maxLife: 1.5 });
      this.audio.claim();
    }
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
    if (!this.bossSpawned && this.time >= 15) this.spawnBoss();
    if (this.boss) {
      this.boss.x += this.boss.vx * dt;
      this.boss.phase += dt;
      if (this.boss.x < -80) this.boss = null;
    }
    for (var sup = this.supplies.length - 1; sup >= 0; sup--) {
      var su = this.supplies[sup];
      su.x += su.vx * dt;
      su.y += su.vy * dt;
      su.phase += dt;
      su.life -= dt;
      if (su.life <= 0 || su.y > this.h - 90) this.supplies.splice(sup, 1);
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
      var supplyHit = false;
      for (var si = this.supplies.length - 1; si >= 0; si--) {
        var sp = this.supplies[si];
        if (Math.hypot(bu.x - sp.x, bu.y - sp.y) < sp.r + 5) {
          this.bullets.splice(b, 1);
          this.collectSupply(si);
          supplyHit = true;
          break;
        }
      }
      if (supplyHit) continue;
      if (this.boss && Math.hypot(bu.x - this.boss.x, bu.y - this.boss.y) < this.boss.r + 6) {
        this.bullets.splice(b, 1);
        this.hitBoss(this.boss);
        break;
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
      materials: this.counts,
      spreadShots: this.spreadShots,
      bossDefeated: this.bossDefeated,
      suppliesCollected: this.suppliesCollected,
      supplyBonus: this.supplyBonus,
      supplyBonusCredits: this.supplyBonusCredits,
      goldenSupply: this.goldenCollected
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
    if (this.boss) this.drawBoss(ctx, this.boss);
    for (var si = 0; si < this.supplies.length; si++) this.drawSupply(ctx, this.supplies[si]);
    for (var b = 0; b < this.bullets.length; b++) {
      var bu = this.bullets[b];
      ctx.fillStyle = bu.special ? '#fff1b0' : '#ffe6a1';
      ctx.beginPath();
      ctx.arc(bu.x, bu.y, bu.special ? 6 : 5, 0, Math.PI * 2);
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
    if (this.spreadReady) {
      ctx.strokeStyle = '#fff1b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 33 + Math.sin(this.time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    if (this.spreadReady) {
      ctx.save();
      ctx.fillStyle = 'rgba(2,25,34,.78)';
      ctx.font = '800 10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      var sw = ctx.measureText('散射炮就绪').width;
      ctx.beginPath(); ctx.roundRect(p.x - sw / 2 - 7, p.y - 52, sw + 14, 18, 8); ctx.fill();
      ctx.fillStyle = '#ffdf72';
      ctx.fillText('散射炮就绪', p.x, p.y - 39);
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




