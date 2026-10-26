/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 打捞任务
   Arcade shell + 沉城抓钩 (a flooded gold-miner).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CW = window.CW;
  if (!CW || !CW.Hub) return;

  var clamp = CW.clamp;
  var lerp = CW.lerp;
  var rand = CW.rand;
  var chance = CW.chance;
  var mod = CW.mod;
  var TAU = CW.TAU;
  var fmt = CW.fmt;
  var MATERIALS = CW.MATERIALS;
  var MISSIONS = CW.MISSIONS;
  var CONDITIONS = (CW.CONDITIONS = [
    {
      id: 'calm', name: '静水', color: '#79d8ff',
      desc: '水面平稳：抓钩没有水雷，三消 +2 步；全收益 -10%',
      short: '无水雷 · +2 步 · 收益 -10%',
      credit: 0.9, mat: 0.9, mines: -1, time: 0, moves: 2, probes: 1, reel: 1
    },
    {
      id: 'storm', name: '雷区', color: '#ff8a5c',
      desc: '水雷密集：抓钩额外 3 颗水雷，三消 -2 步；打捞币 +30%',
      short: '水雷 +3 · -2 步 · 打捞币 +30%',
      credit: 1.3, mat: 1, mines: 3, time: 0, moves: -2, probes: -1, reel: 1
    },
    {
      id: 'rich', name: '富氧', color: '#9be2a9',
      desc: '海水富氧：抓钩 +2 秒，三消 +3 步；全收益 -8%',
      short: '+2 秒 / +3 步 · 收益 -8%',
      credit: 0.92, mat: 0.92, mines: 0, time: 2, moves: 3, probes: 1, reel: 1
    },
    {
      id: 'oil', name: '油污', color: '#ffb15e',
      desc: '海面浮油：抓钩回收 -12%，三消 -1 步；物资 +18%',
      short: '回收 -12% · -1 步 · 物资 +18%',
      credit: 1, mat: 1.18, mines: 0, time: 0, moves: -1, probes: -1, reel: 0.88
    }
  ]);

  function id(x) { return document.getElementById(x); }
  function hexA(hex, a) {
    var s = hex.replace('#', '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  function drawCover(ctx, img, w, h, fx, fy) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) * (fx == null ? 0.5 : fx), (h - dh) * (fy == null ? 0.5 : fy), dw, dh);
    return true;
  }

  var FILTER_IMAGE = new Image();
  FILTER_IMAGE.decoding = 'async';
  FILTER_IMAGE.src = 'assets/seawater-filter-icon.webp';

  var HOOK_BG = new Image();
  HOOK_BG.decoding = 'async';
  HOOK_BG.src = 'assets/bg-hook.webp';

  var HOOK_ICON = new Image();
  HOOK_ICON.src = 'assets/real/hook.webp';
  var PULLEY_ICON = new Image();
  PULLEY_ICON.src = 'assets/real/workshop.webp';
  var COLLECTIBLE_IMAGES = {};
  function collectibleImage(src) {
    if (!COLLECTIBLE_IMAGES[src]) {
      var img = new Image();
      img.decoding = 'async';
      img.src = src;
      COLLECTIBLE_IMAGES[src] = img;
    }
    return COLLECTIBLE_IMAGES[src];
  }

  var ITEM_IMAGES = {
    scrap: 'assets/real/scrap.webp',
    barrel: 'assets/real/fuel.webp',
    tarp: 'assets/real/fiber.webp',
    chip: 'assets/real/chip.webp',
    safe: 'assets/real/safe.webp',
    gold: 'assets/real/gold.webp',
    mine: 'assets/real/mine.webp'
  };
  for (var ik in ITEM_IMAGES) {
    if (!Object.prototype.hasOwnProperty.call(ITEM_IMAGES, ik)) continue;
    var im = new Image();
    im.src = ITEM_IMAGES[ik];
    ITEM_IMAGES[ik] = im;
  }

  /* ═══════════════════════════════════════════════════════════
     Arcade shell
     ═══════════════════════════════════════════════════════════ */
  function Arcade(hub) {
    this.hub = hub;
    this.audio = hub.audio;
    this.root = id('arcade');
    this.canvas = id('arcade-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.active = false;
    this.type = null;
    this.phase = 'closed';
    this.condition = null;
    this.game = null;
    this.countdown = 0;
    this.hudTimer = 0;
    this.lastLoot = '';
    this.lastHudScore = '';
    this.applied = null;
    this.pausedPhase = 'playing';
    this.best = 0;

    this.dom = {
      hud: id('arcade-hud'),
      kicker: id('arcade-kicker'),
      name: id('arcade-name'),
      statLabel: id('arcade-stat-label'),
      statValue: id('arcade-stat-value'),
      score: id('arcade-score'),
      loot: id('arcade-loot'),
      bottom: id('arcade-bottom'),
      hint: id('arcade-hint'),
      action: id('arcade-action'),
      countdown: id('arcade-countdown'),
      brief: id('arcade-brief'),
      briefKicker: id('brief-kicker'),
      briefTitle: id('brief-title'),
      briefCopy: id('brief-copy'),
      briefTime: id('brief-time'),
      briefCapacity: id('brief-capacity'),
      briefGoal: id('brief-goal'),
      briefCondition: id('brief-condition'),
      briefReward: id('brief-reward'),
      summary: id('arcade-summary'),
      summaryScore: id('summary-score'),
      summaryCredits: id('summary-credits'),
      summaryLoot: id('summary-loot'),
      summaryRare: id('summary-rare'),
      summaryCollect: id('summary-collect'),
      overflow: id('summary-overflow'),
      confirm: id('arcade-confirm')
    };

    this.resize();
    this.bind();
  }

  Arcade.prototype.resize = function () {
    this.w = Math.max(280, window.innerWidth);
    this.h = Math.max(280, window.innerHeight);
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var dpr = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    var maxPixels = 2600000;
    var raw = this.w * this.h * dpr * dpr;
    if (raw > maxPixels) dpr *= Math.sqrt(maxPixels / raw);
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.game) this.game.resize(this.w, this.h);
  };

  Arcade.prototype.bind = function () {
    var self = this;
    this.root.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!el) return;
      var action = el.getAttribute('data-action');
      if (action.indexOf('arcade-') !== 0) return;
      e.stopPropagation();
      self.onAction(action);
    });
    this.canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    this.canvas.addEventListener('pointerdown', function (e) {
      if (!self.active) return;
      e.preventDefault();
      self.audio.unlock();
      if (self.phase !== 'playing' || !self.game) return;
      var rect = self.canvas.getBoundingClientRect();
      self.game.pointerDown(e.clientX - rect.left, e.clientY - rect.top, e);
    });
    this.canvas.addEventListener('pointerup', function (e) {
      if (!self.active || self.phase !== 'playing' || !self.game) return;
      var rect = self.canvas.getBoundingClientRect();
      self.game.pointerUp(e.clientX - rect.left, e.clientY - rect.top, e);
    });
    window.addEventListener('keydown', function (e) {
      if (!self.active) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        self.back();
      }
    });
    window.addEventListener('resize', function () {
      if (!self.active) return;
      self.resize();
      self.updateHud();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        if (!self.active) return;
        self.resize();
      });
    }
  };

  Arcade.prototype.onAction = function (action) {
    if (action === 'arcade-back') this.back();
    else if (action === 'arcade-start') this.startCountdown();
    else if (action === 'arcade-close') this.close();
    else if (action === 'arcade-again') this.restart();
    else if (action === 'arcade-action') {
      if (this.phase === 'playing' && this.game && this.game.drop) this.game.drop();
    } else if (action === 'arcade-resume') this.resume();
    else if (action === 'arcade-quit') this.close();
  };

  Arcade.prototype.open = function (type) {
    if (this.active) return;
    this.active = true;
    this.type = type;
    this.phase = 'brief';
    this.applied = null;
    this.lastLoot = '';
    this.lastHudScore = '';
    document.body.classList.add('is-arcade');
    this.root.classList.remove('hidden');
    this.resize();
    this.createGame();
    this.fillBrief();
    this.dom.brief.classList.remove('hidden');
    this.dom.summary.classList.add('hidden');
    this.dom.confirm.classList.add('hidden');
    this.dom.countdown.classList.add('hidden');
    this.showPlayUI(false);
    this.audio.click();
    this.render();
  };

  Arcade.prototype.pickCondition = function () {
    var pick = CONDITIONS[(Math.random() * CONDITIONS.length) | 0];
    if (this.condition && CONDITIONS.length > 1 && pick.id === this.condition.id) {
      pick = CONDITIONS[(CONDITIONS.indexOf(pick) + 1) % CONDITIONS.length];
    }
    return pick;
  };

  Arcade.prototype.createGame = function () {
    this.condition = this.pickCondition();
    var config = {
      w: this.w,
      h: this.h,
      duration: this.hub.hookTime() + this.condition.time,
      moves: this.hub.matchMoves() + this.condition.moves,
      probes: this.hub.sonarProbes() + this.condition.probes,
      capacity: this.hub.capacity(),
      condition: this.condition
    };
    if (this.type === 'match' && CW.MatchGame) this.game = new CW.MatchGame(this, config);
    else if (this.type === 'sonar' && CW.SonarGame) this.game = new CW.SonarGame(this, config);
    else this.game = new CW.HookGame(this, config);
    if (this.condition && this.dom.kicker) {
      var mission = null;
      for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === this.type) mission = MISSIONS[i];
      if (mission) this.dom.kicker.textContent = mission.kicker + ' · ' + this.condition.name;
    }
  };

  Arcade.prototype.applyCondition = function (result) {
    if (!result || !this.condition) return result;
    var cond = this.condition;
    var out = {};
    for (var key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) out[key] = result[key];
    }
    out.credits = Math.round((result.credits || 0) * cond.credit);
    out.materials = {};
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      out.materials[m.id] = Math.round(((result.materials && result.materials[m.id]) || 0) * cond.mat);
    }
    out.condition = cond.id;
    return out;
  };

  Arcade.prototype.fillBrief = function () {
    var mission = null;
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === this.type) mission = MISSIONS[i];
    if (!mission) return;
    var isHook = this.type === 'hook';
    var cond = this.condition;
    this.dom.kicker.textContent = mission.kicker + (cond ? ' · ' + cond.name : '');
    this.dom.name.textContent = mission.name;
    this.dom.briefKicker.textContent = mission.kicker + (cond ? ' · ' + cond.name : '');
    this.dom.briefTitle.textContent = mission.name;
    this.dom.briefCopy.textContent = mission.desc;
    if (this.type === 'sonar') {
      this.dom.briefTime.textContent = (this.hub.sonarProbes() + (cond ? cond.probes : 0)) + ' 次';
    } else {
      this.dom.briefTime.textContent = isHook ? (this.hub.hookTime() + (cond ? cond.time : 0)) + ' 秒' : (this.hub.matchMoves() + (cond ? cond.moves : 0)) + ' 步';
    }
    if (this.dom.briefCondition && cond) {
      this.dom.briefCondition.classList.remove('hidden');
      this.dom.briefCondition.style.setProperty('--cond', cond.color);
      this.dom.briefCondition.innerHTML = '<span>本局海况</span><b>' + cond.name + '</b><em>' + cond.desc + '</em>';
    }
    var used = this.hub.used();
    var cap = this.hub.capacity();
    this.dom.briefCapacity.textContent = used + ' / ' + cap + (used >= cap ? ' · 满' : '');
    this.dom.briefGoal.textContent = this.type === 'sonar' ? '4 个隐藏货箱' : '废铁 / 燃料 / 纤维 / 芯片';
    var html = '<span class="reward-chip" style="--tone:var(--amber)">打捞币</span>';
    for (var m = 0; m < MATERIALS.length; m++) {
      html += '<span class="reward-chip" style="--tone:' + MATERIALS[m].color + '">' + MATERIALS[m].name + '</span>';
    }
    html += '<span class="reward-chip rare"><img src="assets/seawater-filter-icon.webp" alt="">稀有 · 海水过滤器</span>';
    this.dom.briefReward.innerHTML = html;
    if (this.hub.used() >= this.hub.capacity()) {
      this.dom.briefCapacity.textContent = '仓库已满';
    }
  };

  Arcade.prototype.startCountdown = function () {
    if (!this.game) return;
    this.audio.click();
    this.dom.brief.classList.add('hidden');
    this.dom.summary.classList.add('hidden');
    this.dom.confirm.classList.add('hidden');
    this.phase = 'countdown';
    this.countdown = 3;
    this.dom.countdown.textContent = '3';
    this.dom.countdown.classList.remove('hidden');
    this.showPlayUI(true);
    this.updateHud();
    this.dom.bottom.classList.add('hidden');
    this.dom.action.classList.add('hidden');
  };

  Arcade.prototype.update = function (dt) {
    if (!this.active) return;
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      var n = Math.max(1, Math.ceil(this.countdown));
      if (this.dom.countdown.textContent !== String(n)) this.dom.countdown.textContent = String(n);
      if (this.countdown <= 0) {
        this.dom.countdown.classList.add('hidden');
        this.phase = 'playing';
        this.game.begin();
        this.showPlayUI(true);
        this.updateHud();
      }
      return;
    }
    if (this.phase !== 'playing' || !this.game) return;
    this.game.update(dt);
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.updateHud();
    }
    if (this.game.done) {
      this.game.done = false;
      this.finish(this.game.result);
    }
  };

  Arcade.prototype.render = function () {
    if (!this.active) return;
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (this.game) this.game.render(ctx);
    else {
      ctx.fillStyle = '#021018';
      ctx.fillRect(0, 0, this.w, this.h);
    }
  };

  Arcade.prototype.showPlayUI = function (show) {
    this.dom.hud.classList.toggle('hidden', !show);
    this.dom.loot.classList.toggle('hidden', !show);
    this.dom.bottom.classList.toggle('hidden', !show);
  };

  Arcade.prototype.updateHud = function () {
    if (!this.game) return;
    var hud = this.game.getHud();
    this.dom.statLabel.textContent = hud.statLabel;
    this.dom.statValue.textContent = hud.stat;
    var score = fmt(this.game.getScore());
    if (score !== this.lastHudScore) {
      this.lastHudScore = score;
      this.dom.score.textContent = score;
    }
    this.dom.hint.textContent = hud.hint;
    this.dom.action.textContent = hud.actionLabel || '行动';
    var hasAction = !!hud.hasAction;
    this.dom.action.classList.toggle('hidden', !hasAction);
    this.dom.bottom.classList.toggle('has-action', hasAction);
    var lootHtml = '';
    var counts = hud.loot || {};
    if ((hud.filters || 0) > 0) {
      lootHtml += '<span class="loot-chip rare"><img src="assets/seawater-filter-icon.webp" alt="">海水过滤器 ×' + hud.filters + '</span>';
    }
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      if ((counts[m.id] || 0) > 0) {
        lootHtml += '<span class="loot-chip" style="--tone:' + m.color + '"><i></i>' + m.name + ' ' + counts[m.id] + '</span>';
      }
    }
    if (!lootHtml) lootHtml = '<span class="loot-chip">暂无物资</span>';
    if (lootHtml !== this.lastLoot) {
      this.lastLoot = lootHtml;
      this.dom.loot.innerHTML = lootHtml;
    }
  };

  Arcade.prototype.finish = function (result) {
    if (!result || this.phase === 'summary') return;
    this.phase = 'summary';
    var finalResult = this.applyCondition(result);
    this.finalResult = finalResult;
    this.applied = this.hub.applyRunResult(finalResult);
    this.dom.countdown.classList.add('hidden');
    this.showPlayUI(false);
    this.dom.brief.classList.add('hidden');
    this.dom.confirm.classList.add('hidden');
    this.dom.summaryScore.textContent = fmt(result.score || 0);
    this.dom.summaryCredits.textContent = fmt(this.applied.totalCredits);
    var chips = '';
    if (this.condition) {
      chips += '<span class="summary-chip condition" style="--tone:' + this.condition.color + '">海况 · ' + this.condition.name + '</span>';
    }
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      var n = this.applied.stored[m.id] || 0;
      if (n > 0) chips += '<span class="summary-chip" style="--tone:' + m.color + '"><i></i>' + m.name + ' +' + n + '</span>';
    }
    if (!chips) chips = '<span class="summary-chip">没有物资入库</span>';
    this.dom.summaryLoot.innerHTML = chips;
    if (this.applied.filters > 0) {
      this.dom.summaryRare.classList.remove('hidden');
      this.dom.summaryRare.innerHTML = '<img class="summary-rare-img" src="assets/seawater-filter-icon.webp" alt=""><span>稀有打捞 · <b>海水过滤器 ×' + this.applied.filters + '</b> 已存入避难所，不占仓库容量。</span>';
    } else {
      this.dom.summaryRare.classList.add('hidden');
    }
    var collectibles = this.applied.collectibles || [];
    if (collectibles.length && this.dom.summaryCollect) {
      this.dom.summaryCollect.classList.remove('hidden');
      var collectHtml = '<span>收藏品</span>';
      for (var ci = 0; ci < collectibles.length; ci++) {
        var col = collectibles[ci];
        collectHtml += '<span class="summary-collect-item" style="--tone:' + col.color + '"><img src="' + col.icon + '" alt="">' + col.name + '</span>';
      }
      this.dom.summaryCollect.innerHTML = collectHtml;
    } else if (this.dom.summaryCollect) {
      this.dom.summaryCollect.classList.add('hidden');
    }
    if (this.applied.overflowUnits > 0) {
      this.dom.overflow.classList.remove('hidden');
      this.dom.overflow.classList.remove('ok');
      this.dom.overflow.textContent = '仓库已满：' + this.applied.overflowUnits + ' 件多余物资已折算为 ' + this.applied.overflowCredits + ' 打捞币。';
    } else {
      this.dom.overflow.classList.remove('hidden');
      this.dom.overflow.classList.add('ok');
      this.dom.overflow.textContent = '入库后仓库占用：' + this.applied.used + ' / ' + this.applied.capacity;
    }
    this.dom.summary.classList.remove('hidden');
    this.audio.record();
  };

  Arcade.prototype.restart = function () {
    if (this.phase !== 'summary') return;
    this.dom.summary.classList.add('hidden');
    this.createGame();
    this.lastLoot = '';
    this.lastHudScore = '';
    this.startCountdown();
  };

  Arcade.prototype.back = function () {
    if (this.phase === 'brief' || this.phase === 'summary') {
      this.close();
    } else if (this.phase === 'playing') {
      this.pausedPhase = 'playing';
      this.phase = 'confirm';
      this.dom.confirm.classList.remove('hidden');
      this.dom.bottom.classList.add('hidden');
      this.audio.click();
    } else if (this.phase === 'countdown') {
      this.close();
    } else if (this.phase === 'confirm') {
      this.resume();
    }
  };

  Arcade.prototype.resume = function () {
    if (this.phase !== 'confirm') return;
    this.dom.confirm.classList.add('hidden');
    this.phase = 'playing';
    this.showPlayUI(true);
    this.updateHud();
    this.audio.click();
  };

  Arcade.prototype.close = function () {
    if (!this.active) return;
    this.active = false;
    this.phase = 'closed';
    this.game = null;
    this.root.classList.add('hidden');
    this.dom.brief.classList.add('hidden');
    this.dom.summary.classList.add('hidden');
    this.dom.confirm.classList.add('hidden');
    this.dom.countdown.classList.add('hidden');
    document.body.classList.remove('is-arcade');
    this.hub.onArcadeClosed();
    this.audio.click();
  };

  CW.Arcade = Arcade;

  /* ═══════════════════════════════════════════════════════════
     沉城抓钩
     ═══════════════════════════════════════════════════════════ */
  var ITEM_TYPES = {
    scrap: { name: '废钢', credits: 35, mats: { metal: 2 }, weight: 1.1, color: '#b8c5c6' },
    barrel: { name: '燃料桶', credits: 55, mats: { fuel: 2 }, weight: 1.55, color: '#ffb15e' },
    tarp: { name: '纤维捆', credits: 40, mats: { fiber: 2 }, weight: 0.9, color: '#9be2a9' },
    chip: { name: '芯片箱', credits: 85, mats: { chip: 2 }, weight: 1.75, color: '#79d8ff' },
    safe: { name: '保险箱', credits: 170, mats: { metal: 3, chip: 1 }, weight: 2.75, color: '#d9c7a1' },
    gold: { name: '金条', credits: 280, mats: {}, weight: 2.2, color: '#ffd166' },
    filter: { name: '海水过滤器', credits: 0, mats: {}, weight: 2.45, color: '#9feeff', rare: true },
    mine: { name: '水雷', credits: 0, mats: {}, weight: 0, color: '#ff6c55', mine: true }
  };

  function HookGame(arcade, config) {
    this.arcade = arcade;
    this.audio = arcade.audio;
    this.w = config.w;
    this.h = config.h;
    this.condition = config.condition || null;
    this.duration = config.duration || 60;
    this.remaining = this.duration;
    this.time = 0;
    this.state = 'waiting';
    this.done = false;
    this.result = null;
    this.credits = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.safeCount = 0;
    this.goldCount = 0;
    this.collectibles = [];
    this.filters = 0;
    this.rareFound = false;
    this.hasFilter = false;
    this.counts = { metal: 0, fuel: 0, fiber: 0, chip: 0 };
    this.items = [];
    this.particles = [];
    this.popups = [];
    this.attached = null;
    this.length = 62;
    this.angle = 0;
    this.swingTime = 0;
    this.flash = 0;
    this.shake = 0;
    this.itemScale = 1;
    this.bgCache = null;
    this.itemSprites = null;
    this.buildField();
  }

  HookGame.prototype.fieldTop = function () {
    return clamp(this.h * 0.3, 138, 232);
  };
  HookGame.prototype.fieldBottom = function () {
    var gap = this.w > this.h ? 72 : 100;
    return Math.max(this.fieldTop() + 70, this.h - gap);
  };
  HookGame.prototype.pivot = function () {
    return { x: this.w * 0.5, y: Math.max(78, Math.min(128, this.fieldTop() - 48)) };
  };
  HookGame.prototype.itemCount = function () {
    return clamp(Math.round(this.w * this.h / 18000), 14, 26);
  };

  HookGame.prototype.buildField = function () {
    this.items = [];
    this.counts = { metal: 0, fuel: 0, fiber: 0, chip: 0 };
    this.filters = 0;
    this.rareFound = false;
    this.hasFilter = false;
    this.attached = null;
    this.credits = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.safeCount = 0;
    this.goldCount = 0;
    this.collectibles = [];
    this.length = 62;
    this.swingTime = 0;
    this.angle = 0;
    this.itemScale = clamp(Math.min(this.w, this.h) / 520, 0.7, 1.15);
    var pool = ['scrap', 'scrap', 'scrap', 'barrel', 'barrel', 'barrel', 'tarp', 'tarp', 'tarp', 'chip', 'chip', 'safe', 'safe', 'gold', 'mine', 'mine', 'mine', 'scrap'];
    if (this.condition) {
      if (this.condition.mines < 0) pool = pool.filter(function (key) { return key !== 'mine'; });
      else for (var extraMine = 0; extraMine < this.condition.mines; extraMine++) pool.push('mine');
    }
    var n = this.itemCount();
    var top = this.fieldTop();
    var bottom = this.fieldBottom();
    var left = 42;
    var right = this.w - 42;
    var attempts = 0;
    while (this.items.length < n && attempts < 600) {
      attempts++;
      var x = rand(left, right);
      var y = rand(top, bottom);
      var tooClose = false;
      for (var i = 0; i < this.items.length; i++) {
        var it = this.items[i];
        var dx = it.x - x;
        var dy = it.y - y;
        if (dx * dx + dy * dy < 48 * 48 * this.itemScale * this.itemScale) { tooClose = true; break; }
      }
      if (tooClose) continue;
      var key = pool[(Math.random() * pool.length) | 0];
      var data = ITEM_TYPES[key];
      this.items.push({
        key: key,
        x: x,
        y: y,
        r: (key === 'safe' ? 20 : key === 'gold' ? 17 : 16) * this.itemScale,
        phase: Math.random() * TAU,
        grabbed: false,
        dead: false
      });
    }

    // In-run collectible: a real salvage object sits on the seabed and must be hooked.
    if (chance(0.22) && CW.rollCollectibleDef) {
      var cdef = CW.rollCollectibleDef();
      var cx = this.w * 0.5;
      var cy = (top + bottom) * 0.58;
      for (var ca = 0; ca < 70; ca++) {
        var ctx2 = rand(left, right);
        var cty = rand(top, bottom);
        var clear2 = true;
        for (var ci = 0; ci < this.items.length; ci++) {
          var oi = this.items[ci];
          var odx = oi.x - ctx2;
          var ody = oi.y - cty;
          if (odx * odx + ody * ody < 64 * 64 * this.itemScale * this.itemScale) { clear2 = false; break; }
        }
        if (clear2) { cx = ctx2; cy = cty; break; }
      }
      this.items.push({
        key: 'collectible',
        collectibleId: cdef.id,
        name: cdef.name,
        icon: cdef.icon,
        color: CW.COLLECTIBLE_RARITY_MAP[cdef.rarity].color,
        rarity: cdef.rarity,
        x: cx,
        y: cy,
        r: 18 * this.itemScale,
        phase: Math.random() * TAU,
        grabbed: false,
        dead: false
      });
    }

    // Rare salvage: one seawater filter appears in roughly 12% of dives,
    // or is guaranteed once the 8-run pity counter is full.
    var forceFilter = ((this.arcade.hub.data.filterPity || 0) >= 7);
    if (forceFilter || chance(0.12)) {
      this.hasFilter = true;
      var fx = this.w * 0.5;
      var fy = (top + bottom) * 0.54;
      for (var fa = 0; fa < 90; fa++) {
        var tx = rand(left, right);
        var ty = rand(top, bottom);
        var clear = true;
        for (var fi = 0; fi < this.items.length; fi++) {
          var other = this.items[fi];
          var ddx = other.x - tx;
          var ddy = other.y - ty;
          if (ddx * ddx + ddy * ddy < 66 * 66 * this.itemScale * this.itemScale) { clear = false; break; }
        }
        if (clear) { fx = tx; fy = ty; break; }
      }
      this.items.push({
        key: 'filter',
        x: fx,
        y: fy,
        r: 21 * this.itemScale,
        phase: Math.random() * TAU,
        grabbed: false,
        dead: false
      });
    }
  };

  HookGame.prototype.begin = function () {
    this.state = 'swing';
    this.remaining = this.duration;
    this.time = 0;
    this.swingTime = 0;
    this.length = 62;
    this.angle = 0;
    this.done = false;
    this.flash = 0;
    this.shake = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.safeCount = 0;
    this.goldCount = 0;
    this.collectibles = [];
    this.buildItemSprites();
    this.audio.click();
  };

  HookGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    var top = this.fieldTop();
    var bottom = this.fieldBottom();
    for (var i = 0; i < this.items.length; i++) {
      this.items[i].x = clamp(this.items[i].x, 36, w - 36);
      this.items[i].y = clamp(this.items[i].y, top, bottom);
    }
    this.itemScale = clamp(Math.min(w, h) / 520, 0.7, 1.15);
    this.bgCache = null;
    this.itemSprites = null;
  };

  HookGame.prototype.drop = function () {
    if (this.state !== 'swing') return;
    this.state = 'shoot';
    this.shootAngle = this.angle;
    this.length = 62;
    this.audio.dash();
  };

  HookGame.prototype.pointerDown = function (x, y, e) {
    if (this.state === 'swing') this.drop();
  };
  HookGame.prototype.pointerUp = function () {};

  HookGame.prototype.getScore = function () { return this.credits; };
  HookGame.prototype.getHud = function () {
    return {
      statLabel: '剩余时间',
      stat: Math.max(0, Math.ceil(this.remaining)) + 's',
      loot: this.counts,
      filters: this.filters,
      hasAction: true,
      actionLabel: '放下抓钩' + (this.combo > 1 ? ' · 连击×' + this.combo : ''),
      hint: '点击水面，抓钩会朝摆动方向下潜 · 连续抓取提高打捞币，水雷会清零'
    };
  };

  HookGame.prototype.hookTip = function () {
    var p = this.pivot();
    var a = this.state === 'swing' ? this.angle : this.shootAngle || this.angle;
    return { x: p.x + Math.sin(a) * this.length, y: p.y + Math.cos(a) * this.length, angle: a };
  };

  HookGame.prototype.update = function (dt) {
    if (this.state === 'waiting' || this.state === 'done') return;
    this.time += dt;
    this.remaining -= dt;
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.shake = Math.max(0, this.shake - dt * 4);
    this.swingTime += dt;
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.state === 'swing') {
      this.angle = Math.sin(this.swingTime * 1.28) * 0.98;
    } else if (this.state === 'shoot') {
      var speed = 760;
      var steps = 3;
      var step = speed * dt / steps;
      for (var s = 0; s < steps; s++) {
        this.length += step;
        if (this.checkHit()) break;
        var tip = this.hookTip();
        if (tip.x < -40 || tip.x > this.w + 40 || tip.y > this.h + 40 || this.length > this.h * 1.35) {
          this.state = 'retract';
          this.attached = null;
          break;
        }
      }
    } else if (this.state === 'retract') {
      var attachedWeight = this.attached && ITEM_TYPES[this.attached.key] ? ITEM_TYPES[this.attached.key].weight : 1.5;
      var rSpeed = this.attached ? clamp(300 / attachedWeight, 62, 260) : 980;
      if (this.condition && this.condition.reel) rSpeed *= this.condition.reel;
      this.length -= rSpeed * dt;
      if (this.attached) {
        var t = this.hookTip();
        this.attached.x = t.x;
        this.attached.y = t.y;
      }
      if (this.length <= 62) {
        this.length = 62;
        if (this.attached) this.collectAttached();
        this.state = 'swing';
      }
    }

    this.updateParticles(dt);
    if (this.remaining <= 0) this.finish();
  };

  HookGame.prototype.checkHit = function () {
    var tip = this.hookTip();
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.grabbed || it.dead) continue;
      var dx = tip.x - it.x;
      var dy = tip.y - it.y;
      var rr = it.r + 8;
      if (dx * dx + dy * dy <= rr * rr) {
        if (ITEM_TYPES[it.key] && ITEM_TYPES[it.key].mine) {
          it.dead = true;
          this.state = 'retract';
          this.attached = null;
          this.combo = 0;
          this.comboTimer = 0;
          this.remaining = Math.max(0, this.remaining - 5);
          this.flash = 1;
          this.shake = 10;
          this.audio.hurt();
          this.spawnBurst(it.x, it.y, [255, 109, 85], 28, 170);
          this.popups.push({ x: it.x, y: it.y - 14, text: '-5s', color: '#ff8a6b', life: 1.1, maxLife: 1.1 });
          this.items.splice(i, 1);
        } else {
          it.grabbed = true;
          this.attached = it;
          this.state = 'retract';
          this.audio.pickup(2);
        }
        return true;
      }
    }
    return false;
  };

  HookGame.prototype.collectAttached = function () {
    var it = this.attached;
    if (!it) return;
    if (it.key === 'collectible') {
      this.collectibles.push(it.collectibleId);
      this.popups.push({ x: it.x, y: it.y - 24, text: '收藏品！' + it.name, color: it.color, life: 2.0, maxLife: 2.0 });
      this.spawnBurst(it.x, it.y, it.color, 30, 150);
      this.audio.relic();
      this.flash = 0.35;
      var cidx = this.items.indexOf(it);
      if (cidx >= 0) this.items.splice(cidx, 1);
      this.attached = null;
      return;
    }
    var data = ITEM_TYPES[it.key];
    if (it.key === 'filter') {
      this.filters += 1;
      this.rareFound = true;
      this.popups.push({ x: it.x, y: it.y - 24, text: '稀有！海水过滤器', color: '#9feeff', life: 2.4, maxLife: 2.4 });
      this.spawnBurst(it.x, it.y, [121, 216, 255], 46, 190);
      this.audio.relic();
      this.flash = 0.55;
    } else {
      this.combo = Math.min(9, this.combo + 1);
      this.comboTimer = 6;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      if (it.key === 'safe') this.safeCount += 1;
      if (it.key === 'gold') this.goldCount += 1;
      var gained = Math.round(data.credits * (1 + (this.combo - 1) * 0.08));
      this.credits += gained;
      for (var key in data.mats) {
        if (Object.prototype.hasOwnProperty.call(data.mats, key)) this.counts[key] = (this.counts[key] || 0) + data.mats[key];
      }
      this.popups.push({ x: it.x, y: it.y - 20, text: '+' + gained, color: '#ffd166', life: 1.2, maxLife: 1.2 });
      if (this.combo > 1) this.popups.push({ x: it.x, y: it.y - 40, text: '连击 ×' + this.combo, color: '#9feeff', life: 1.2, maxLife: 1.2 });
      this.spawnBurst(it.x, it.y, data.color, 16, 110);
      this.audio.coin();
    }
    var idx = this.items.indexOf(it);
    if (idx >= 0) this.items.splice(idx, 1);
    this.attached = null;
  };

  HookGame.prototype.spawnBurst = function (x, y, color, count, speed) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * TAU;
      var v = rand(speed * 0.25, speed);
      this.particles.push({
        type: chance(0.35) ? 'bubble' : 'spark',
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.35, 0.9),
        maxLife: 0.9,
        size: rand(1.2, 3.8),
        color: color
      });
    }
    if (this.particles.length > 150) this.particles.splice(0, this.particles.length - 150);
  };

  HookGame.prototype.updateParticles = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'bubble') {
        p.vy -= 16 * dt;
        p.vx *= Math.pow(0.85, dt);
      } else {
        p.vx *= Math.pow(0.15, dt);
        p.vy *= Math.pow(0.22, dt);
        p.vy += 12 * dt;
      }
    }
    for (var j = this.popups.length - 1; j >= 0; j--) {
      var t = this.popups[j];
      t.life -= dt;
      t.y -= 28 * dt;
      if (t.life <= 0) this.popups.splice(j, 1);
    }
  };

  HookGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.state = 'done';
    this.popups = [];
    this.result = {
      type: 'hook',
      score: this.credits,
      credits: this.credits,
      filters: this.filters,
      bestCombo: this.bestCombo,
      safeCount: this.safeCount,
      goldCount: this.goldCount,
      collectibles: this.collectibles.slice(),
      materials: {
        metal: this.counts.metal,
        fuel: this.counts.fuel,
        fiber: this.counts.fiber,
        chip: this.counts.chip
      }
    };
  };

  HookGame.prototype.buildBgCache = function () {
    if (!HOOK_BG.complete || !HOOK_BG.naturalWidth) { this.bgCache = null; return; }
    var w = Math.max(1, Math.round(this.w));
    var h = Math.max(1, Math.round(this.h));
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#020e16';
    g.fillRect(0, 0, w, h);
    var ok = drawCover(g, HOOK_BG, w, h, 0.5, 0.48);
    g.fillStyle = 'rgba(1, 11, 18, 0.28)';
    g.fillRect(0, 0, w, h);
    var shade = g.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0, 8, 14, 0.62)');
    shade.addColorStop(0.3, 'rgba(0, 10, 16, 0.1)');
    shade.addColorStop(0.68, 'rgba(0, 8, 14, 0.22)');
    shade.addColorStop(1, 'rgba(0, 6, 11, 0.72)');
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
    if (!ok) {
      g.fillStyle = 'rgba(2, 22, 30, 0.9)';
      g.fillRect(0, 0, w, h);
    }
    this.bgCache = c;
  };

  HookGame.prototype.itemTypeRadius = function (key) {
    return (key === 'safe' ? 20 : key === 'gold' ? 17 : 16) * this.itemScale;
  };

  HookGame.prototype.buildItemSprites = function () {
    for (var k in ITEM_IMAGES) {
      if (!Object.prototype.hasOwnProperty.call(ITEM_IMAGES, k)) continue;
      var im = ITEM_IMAGES[k];
      if (!im.complete || !im.naturalWidth) { this.itemSprites = null; return; }
    }
    this.itemSprites = {};
    for (var key in ITEM_IMAGES) {
      if (!Object.prototype.hasOwnProperty.call(ITEM_IMAGES, key)) continue;
      var data = ITEM_TYPES[key];
      var s = this.itemTypeRadius(key);
      var size = Math.ceil(s * 4.8);
      var c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      var g = c.getContext('2d');
      g.translate(size / 2, size / 2);
      var glow = g.createRadialGradient(0, 0, 0, 0, 0, s * 2.3);
      glow.addColorStop(0, data.mine ? 'rgba(255, 90, 65, 0.2)' : data.color + '22');
      glow.addColorStop(1, data.mine ? 'rgba(255, 90, 65, 0)' : data.color + '00');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(0, 0, s * 2.3, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(1, 12, 18, 0.48)';
      g.beginPath();
      g.arc(0, 0, s * 1.12, 0, TAU);
      g.fill();
      g.save();
      g.beginPath();
      g.arc(0, 0, s * 0.98, 0, TAU);
      g.clip();
      g.drawImage(ITEM_IMAGES[key], -s * 0.98, -s * 0.98, s * 1.96, s * 1.96);
      g.fillStyle = data.mine ? 'rgba(255, 48, 34, 0.28)' : 'rgba(0, 10, 15, 0.12)';
      g.fillRect(-s, -s, s * 2, s * 2);
      g.restore();
      g.strokeStyle = data.mine ? 'rgba(255, 108, 85, 0.6)' : 'rgba(218, 255, 249, 0.2)';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(0, 0, s * 1.08, 0, TAU);
      g.stroke();
      this.itemSprites[key] = c;
    }
  };

  HookGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    if (!this.bgCache) this.buildBgCache();
    if (!this.itemSprites) this.buildItemSprites();
    var shakeX = this.shake > 0.2 ? rand(-this.shake, this.shake) : 0;
    var shakeY = this.shake > 0.2 ? rand(-this.shake, this.shake) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    var top = this.fieldTop();
    var bottom = this.fieldBottom();
    var pivot = this.pivot();

    if (this.bgCache) ctx.drawImage(this.bgCache, 0, 0, w, h);
    else {
      ctx.fillStyle = '#020e16';
      ctx.fillRect(0, 0, w, h);
    }

    // bubbles / suspended particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var b = 0; b < 22; b++) {
      var bx = mod(hash(b * 4.1) * w + Math.sin(this.time + b) * 8, w);
      var by = h - mod(this.time * (9 + hash(b) * 14) + hash(b * 3.3) * h, h - 100);
      ctx.strokeStyle = 'rgba(142, 244, 231, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, 1.5 + hash(b * 7.1) * 3, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // depth marks
    ctx.strokeStyle = 'rgba(140, 218, 210, 0.08)';
    ctx.fillStyle = 'rgba(140, 218, 210, 0.22)';
    ctx.font = '7px "Cascadia Mono", monospace';
    for (var d = 0; d < 5; d++) {
      var dy = top + d * ((bottom - top) / 5);
      ctx.beginPath();
      ctx.moveTo(w - 36, dy);
      ctx.lineTo(w - 18, dy);
      ctx.stroke();
      ctx.fillText(String(d * 10 + 10) + 'm', w - 16, dy + 2);
    }

    // items
    for (var it = 0; it < this.items.length; it++) {
      if (!this.items[it].grabbed) this.drawItem(ctx, this.items[it]);
    }

    // pulley, rope and image-based hook
    this.drawPulley(ctx, pivot);
    var tip = this.hookTip();
    ctx.strokeStyle = 'rgba(224, 210, 170, 0.58)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y - 1);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    this.drawHook(ctx, tip);
    if (this.attached) {
      this.drawItem(ctx, this.attached, true);
    }

    // particles and popups
    for (var p = 0; p < this.particles.length; p++) {
      var pt = this.particles[p];
      var a = clamp(pt.life / pt.maxLife, 0, 1);
      if (pt.type === 'bubble') {
        ctx.strokeStyle = 'rgba(154, 255, 239, ' + (a * 0.4).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var sp = 0; sp < this.particles.length; sp++) {
      var spark = this.particles[sp];
      if (spark.type !== 'spark') continue;
      var sa = clamp(spark.life / spark.maxLife, 0, 1);
      ctx.fillStyle = 'rgba(' + spark.color[0] + ',' + spark.color[1] + ',' + spark.color[2] + ',' + (sa * 0.7).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, Math.max(0.4, spark.size * sa), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.font = '800 13px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    for (var t = 0; t < this.popups.length; t++) {
      var pop = this.popups[t];
      var pa = clamp(pop.life / pop.maxLife, 0, 1);
      ctx.fillStyle = 'rgba(0, 9, 14, ' + (pa * 0.5).toFixed(3) + ')';
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = pa;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';

    // finish line at top of water
    ctx.strokeStyle = 'rgba(155, 245, 231, 0.09)';
    ctx.beginPath();
    ctx.moveTo(0, top - 14);
    ctx.lineTo(w, top - 14);
    ctx.stroke();

    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255, 125, 92, ' + (this.flash * 0.15).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  };

  HookGame.prototype.drawPulley = function (ctx, pivot) {
    ctx.save();
    ctx.translate(pivot.x, pivot.y);
    ctx.fillStyle = 'rgba(1, 12, 18, 0.58)';
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, TAU);
    ctx.fill();
    if (PULLEY_ICON.complete && PULLEY_ICON.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, TAU);
      ctx.clip();
      ctx.drawImage(PULLEY_ICON, -20, -20, 40, 40);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255, 192, 113, ' + (0.35 + Math.sin(this.time * 2.3) * 0.2).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(0, -20, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  HookGame.prototype.drawHook = function (ctx, tip) {
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(tip.angle + 0.42);
    ctx.fillStyle = 'rgba(1, 12, 18, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, TAU);
    ctx.fill();
    if (HOOK_ICON.complete && HOOK_ICON.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 14.5, 0, TAU);
      ctx.clip();
      ctx.drawImage(HOOK_ICON, -15, -15, 30, 30);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255, 206, 128, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 14.5, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  };

  HookGame.prototype.drawItem = function (ctx, item, carried) {
    var data = ITEM_TYPES[item.key];
    var x = item.x;
    var y = item.y;
    var s = item.r;
    ctx.save();
    ctx.translate(x, y);
    if (carried) ctx.scale(0.9, 0.9);

    if (item.key === 'collectible') {
      this.drawCollectibleItem(ctx, item, s);
      ctx.restore();
      this.drawItemLabel(ctx, x, y + s + 14, item.name, item.color);
      return;
    }

    if (item.key === 'filter') {
      this.drawFilterItem(ctx, s);
      ctx.restore();
      this.drawItemLabel(ctx, x, y + s + 14, data.name, '#bff8ff');
      return;
    }

    var sprite = this.itemSprites && this.itemSprites[item.key];
    if (sprite) {
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
      ctx.restore();
      this.drawItemLabel(ctx, x, y + s + 9, data.name, data.mine ? '#ff8a6b' : data.color);
      return;
    }

    var pulse = 0.5 + Math.sin(this.time * 2.6 + item.phase) * 0.5;
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.3);
    glow.addColorStop(0, data.mine ? 'rgba(255, 90, 65, 0.2)' : data.color + '22');
    glow.addColorStop(1, data.mine ? 'rgba(255, 90, 65, 0)' : data.color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(1, 12, 18, 0.48)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.12, 0, TAU);
    ctx.fill();

    var img = ITEM_IMAGES[item.key];
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, -s * 0.98, -s * 0.98, s * 1.96, s * 1.96);
    } else {
      ctx.fillStyle = data.color;
      ctx.font = '700 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.name.slice(0, 1), 0, 1);
    }

    ctx.strokeStyle = data.mine ? 'rgba(255, 108, 85, ' + (0.42 + pulse * 0.26).toFixed(3) + ')' : 'rgba(218, 255, 249, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.08, 0, TAU);
    ctx.stroke();
    if (data.mine) {
      ctx.fillStyle = 'rgba(255, 91, 65, ' + (0.4 + pulse * 0.4).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    this.drawItemLabel(ctx, x, y + s + 9, data.name, data.mine ? '#ff8a6b' : data.color);
  };

  HookGame.prototype.drawCollectibleItem = function (ctx, item, s) {
    var pulse = 0.5 + Math.sin(this.time * 2.4 + item.phase) * 0.5;
    var size = s * 2.25;
    var half = size / 2;
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.5);
    glow.addColorStop(0, hexA(item.color, 0.24 + pulse * 0.1));
    glow.addColorStop(1, hexA(item.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(1, 12, 18, 0.86)';
    ctx.beginPath();
    ctx.roundRect(-half - 3, -half - 3, size + 6, size + 6, 6);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, 4);
    ctx.clip();
    var img = collectibleImage(item.icon);
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, -half, -half, size, size);
      ctx.fillStyle = 'rgba(0, 12, 18, 0.14)';
      ctx.fillRect(-half, -half, size, size);
    } else {
      ctx.fillStyle = 'rgba(9, 45, 55, 0.95)';
      ctx.fillRect(-half, -half, size, size);
    }
    ctx.restore();
    ctx.strokeStyle = hexA(item.color, 0.78);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, 4);
    ctx.stroke();
  };

  HookGame.prototype.drawFilterItem = function (ctx, s) {
    var pulse = 0.5 + Math.sin(this.time * 2.6) * 0.5;
    var size = s * 2.15;
    var half = size / 2;
    ctx.save();
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.6);
    glow.addColorStop(0, 'rgba(121, 216, 255, ' + (0.28 + pulse * 0.14).toFixed(3) + ')');
    glow.addColorStop(0.55, 'rgba(76, 184, 255, 0.11)');
    glow.addColorStop(1, 'rgba(24, 100, 160, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.6, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.rotate(this.time * 0.55);
    ctx.strokeStyle = 'rgba(159, 238, 255, ' + (0.24 + pulse * 0.26).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.6, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // Photo token supplied by the user; no hand-drawn filter artwork.
    ctx.fillStyle = 'rgba(2, 19, 28, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-half - 3, -half - 3, size + 6, size + 6, 7);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, 4);
    ctx.clip();
    if (FILTER_IMAGE.complete && FILTER_IMAGE.naturalWidth) {
      ctx.drawImage(FILTER_IMAGE, -half, -half, size, size);
      ctx.fillStyle = 'rgba(1, 20, 30, 0.12)';
      ctx.fillRect(-half, -half, size, size);
    } else {
      ctx.fillStyle = 'rgba(9, 54, 74, 0.95)';
      ctx.fillRect(-half, -half, size, size);
      ctx.fillStyle = '#bff8ff';
      ctx.font = '700 8px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('稀有', 0, 3);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 214, 151, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(121, 232, 255, 0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-half - 3, -half - 3, size + 6, size + 6, 7);
    ctx.stroke();

    var shine = ctx.createLinearGradient(-half, -half, half, half);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    shine.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    shine.addColorStop(1, 'rgba(121, 232, 255, 0.08)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 226, 158, ' + (0.55 + pulse * 0.4).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(half + 5, -half - 9);
    ctx.lineTo(half + 9, -half - 5);
    ctx.lineTo(half + 5, -half - 1);
    ctx.lineTo(half + 1, -half - 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  HookGame.prototype.drawItemLabel = function (ctx, x, y, text, color) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '500 7px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(0, 8, 12, 0.6)';
    ctx.fillText(text, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.72;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  CW.HookGame = HookGame;
})();

