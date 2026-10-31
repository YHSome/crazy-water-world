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
    },
    {
      id: 'redtide', name: '赤潮', color: '#ff7a8a',
      desc: '赤潮翻涌：水雷 +1，抓钩 -2 秒，三消 +1 步；物资 +22%，打捞币 +8%',
      short: '水雷 +1 · 物资 +22% · 打捞币 +8%',
      credit: 1.08, mat: 1.22, mines: 1, time: -2, moves: 1, probes: 0, reel: 0.96
    },
    {
      id: 'tailwind', name: '顺风', color: '#8ee6d4',
      desc: '顺风平流：抓钩 +3 秒，三消 +2 步，声呐 +1；全收益 -6%',
      short: '+3 秒 / +2 步 / +1 声呐 · 收益 -6%',
      credit: 0.94, mat: 0.94, mines: 0, time: 3, moves: 2, probes: 1, reel: 1.08
    }
  ]);

  var PERMITS = (CW.PERMITS = [
    {
      id: 'steady', name: '稳潮许可', color: '#14b8b2',
      desc: '本局 +8 秒 / +3 步 / +2 声呐；全收益 -8%',
      short: '+8 秒 · +3 步 · +2 声呐 · 收益 -8%',
      credit: 0.92, mat: 0.92, time: 8, moves: 3, probes: 2
    },
    {
      id: 'profit', name: '高价许可', color: '#ffb547',
      desc: '本局打捞币 +25%；-5 秒 / -2 步 / -2 声呐',
      short: '打捞币 +25% · -5 秒 / -2 步 / -2 声呐',
      credit: 1.25, mat: 1, time: -5, moves: -2, probes: -2
    },
    {
      id: 'cargo', name: '满载许可', color: '#8ee6d4',
      desc: '本局物资 +25%；-4 秒 / -2 步 / -2 声呐',
      short: '物资 +25% · -4 秒 / -2 步 / -2 声呐',
      credit: 1, mat: 1.25, time: -4, moves: -2, probes: -2
    }
  ]);

  function combineConditions(a, b) {
    return {
      id: a.id + '+' + b.id,
      name: a.name + '·' + b.name,
      color: a.color,
      desc: '双重海况：' + a.short + '；' + b.short,
      short: a.short + '；' + b.short,
      credit: a.credit * b.credit,
      mat: a.mat * b.mat,
      mines: a.mines + b.mines,
      time: a.time + b.time,
      moves: a.moves + b.moves,
      probes: a.probes + b.probes,
      reel: a.reel * b.reel,
      combo: true
    };
  }

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
    glass: 'assets/collectibles/sea-bottle.webp',
    copper: 'assets/collectibles/brass-compass.webp',
    safe: 'assets/real/safe.webp',
    gold: 'assets/real/gold.webp',
    relic: 'assets/collectibles/captain-log.webp',
    treasure: 'assets/collectibles/tide-crown.webp',
    drone: 'assets/real/sonar.webp',
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
    this.permit = null;
    this.permitOptions = [];
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
      briefPermits: id('brief-permits'),
      briefReward: id('brief-reward'),
      summary: id('arcade-summary'),
      summaryScore: id('summary-score'),
      summaryGrade: id('summary-grade'),
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
    var lowFx = this.hub && this.hub.lowFx;
    var dpr = Math.min(lowFx ? 1.0 : 1.5, window.devicePixelRatio || 1);
    var maxPixels = lowFx ? 1100000 : 2200000;
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
      self.onAction(action, el);
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
    this.canvas.addEventListener('pointermove', function (e) {
      if (!self.active || self.phase !== 'playing' || !self.game) return;
      if (!self.game.pointerMove) return;
      if (e.pointerType === 'mouse' && !e.buttons) return;
      var rect = self.canvas.getBoundingClientRect();
      self.game.pointerMove(e.clientX - rect.left, e.clientY - rect.top, e);
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

  Arcade.prototype.onAction = function (action, el) {
    if (action === 'arcade-back') this.back();
    else if (action === 'arcade-permit') this.choosePermit(el ? el.getAttribute('data-permit') : null);
    else if (action === 'arcade-start') this.startCountdown();
    else if (action === 'arcade-close') this.close();
  else if (action === 'arcade-retry') this.retryRun();
  else if (action === 'arcade-next') this.nextRun();
    else if (action === 'arcade-story') this.hub.openStoryDetail('mission', this.type);
    else if (action === 'arcade-action') {
      if (this.phase === 'playing' && this.game && this.game.drop) this.game.drop();
    } else if (action === 'arcade-resume') this.resume();
    else if (action === 'arcade-quit') this.close();
  };

  Arcade.prototype.open = function (type) {
    if (this.active) return;
    this.active = true;
    this.type = type;
    this.audio.setScene(type);
    this.phase = 'brief';
    this.applied = null;
    this.lastLoot = '';
    this.lastHudScore = '';
    this.permit = null;
    this.condition = this.pickCondition();
    this.pickPermitOptions();
    document.body.classList.add('is-arcade');
    this.root.classList.remove('hidden');
    this.resize();
    this.createGame(true);
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
    if (this.condition && CONDITIONS.length > 1 && this.condition.id === pick.id) {
      pick = CONDITIONS[(CONDITIONS.indexOf(pick) + 1) % CONDITIONS.length];
    }
    if (chance(0.3)) {
      var second = CONDITIONS[(Math.random() * CONDITIONS.length) | 0];
      var guard = 0;
      while (second.id === pick.id && guard++ < 20) {
        second = CONDITIONS[(Math.random() * CONDITIONS.length) | 0];
      }
      if (second.id !== pick.id) return combineConditions(pick, second);
    }
    return pick;
  };

  Arcade.prototype.pickPermitOptions = function () {
    var pool = PERMITS.slice();
    var out = [];
    while (out.length < 2 && pool.length) {
      var idx = (Math.random() * pool.length) | 0;
      out.push(pool.splice(idx, 1)[0]);
    }
    this.permitOptions = out;
  };

  Arcade.prototype.choosePermit = function (permitId) {
    var picked = null;
    for (var i = 0; i < this.permitOptions.length; i++) {
      if (this.permitOptions[i].id === permitId) picked = this.permitOptions[i];
    }
    if (!picked) return;
    this.permit = this.permit && this.permit.id === picked.id ? null : picked;
    this.createGame(true);
    this.fillBrief();
    this.audio.click();
  };

  Arcade.prototype.createGame = function (keepCondition) {
    if (!keepCondition) this.condition = this.pickCondition();
    var permit = this.permit;
    var perkTime = permit ? permit.time : 0;
    var perkMoves = permit ? permit.moves : 0;
    var perkProbes = permit ? permit.probes : 0;
    var config = {
      w: this.w,
      h: this.h,
      duration: this.hub.hookTime() + this.condition.time + perkTime,
      moves: this.hub.matchMoves() + this.condition.moves + perkMoves,
      probes: this.hub.sonarProbes() + this.condition.probes + perkProbes,
      capacity: this.hub.capacity(),
      condition: this.condition
    };
    if (this.type === 'match' && CW.MatchGame) this.game = new CW.MatchGame(this, config);
    else if (this.type === 'sonar' && CW.SonarGame) this.game = new CW.SonarGame(this, config);
    else if (this.type === 'cut' && CW.CutGame) this.game = new CW.CutGame(this, config);
    else if (this.type === 'sort' && CW.SortGame) this.game = new CW.SortGame(this, config);
    else if (this.type === 'beacon' && CW.BeaconGame) this.game = new CW.BeaconGame(this, config);
    else if (this.type === 'trawl' && CW.TrawlGame) this.game = new CW.TrawlGame(this, config);
    else if (this.type === 'dive' && CW.DiveGame) this.game = new CW.DiveGame(this, config);
    else if (this.type === 'stack' && CW.StackGame) this.game = new CW.StackGame(this, config);
    else if (this.type === 'gunnery' && CW.GunneryGame) this.game = new CW.GunneryGame(this, config);
    else if (this.type === 'trench' && CW.TrenchGame) this.game = new CW.TrenchGame(this, config);
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
    var permit = this.permit;
    var creditMult = cond.credit * (permit ? permit.credit : 1);
    var matMult = cond.mat * (permit ? permit.mat : 1);
    var out = {};
    for (var key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) out[key] = result[key];
    }
    out.credits = Math.round((result.credits || 0) * creditMult);
    out.materials = {};
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      out.materials[m.id] = Math.round(((result.materials && result.materials[m.id]) || 0) * matMult);
    }
    out.condition = cond.id;
    out.permit = permit ? permit.id : null;
    return out;
  };

  Arcade.prototype.fillBrief = function () {
    var mission = null;
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === this.type) mission = MISSIONS[i];
    if (!mission) return;
    var mode = mission.stat || (this.type === 'sonar' ? 'probes' : this.type === 'match' ? 'moves' : 'time');
    var cond = this.condition;
    this.dom.kicker.textContent = mission.kicker + (cond ? ' · ' + cond.name : '');
    this.dom.name.textContent = mission.name;
    this.dom.briefKicker.textContent = mission.kicker + (cond ? ' · ' + cond.name : '');
    this.dom.briefTitle.textContent = mission.name;
    this.dom.briefCopy.textContent = mission.desc;
    var permit = this.permit;
    var permitTime = permit ? permit.time : 0;
    var permitMoves = permit ? permit.moves : 0;
    var permitProbes = permit ? permit.probes : 0;
    if (mode === 'probes') {
      this.dom.briefTime.textContent = (this.hub.sonarProbes() + (cond ? cond.probes : 0) + permitProbes) + ' 次';
    } else if (mode === 'moves') {
      this.dom.briefTime.textContent = (this.hub.matchMoves() + (cond ? cond.moves : 0) + permitMoves) + ' 步';
    } else {
      this.dom.briefTime.textContent = (this.hub.hookTime() + (cond ? cond.time : 0) + permitTime) + ' 秒';
    }
    if (this.dom.briefCondition && cond) {
      this.dom.briefCondition.classList.remove('hidden');
      this.dom.briefCondition.style.setProperty('--cond', cond.color);
      this.dom.briefCondition.innerHTML = '<span>本局海况</span><b>' + cond.name + '</b><em>' + cond.desc + '</em>';
    }
    if (this.dom.briefPermits) {
      if (!this.permitOptions.length) this.pickPermitOptions();
      var permitHtml = '<span class="permit-title">出航许可 · 二选一（可不选）</span><div class="permit-row">';
      for (var pi = 0; pi < this.permitOptions.length; pi++) {
        var p = this.permitOptions[pi];
        permitHtml += '<button class="permit-card' + (permit && permit.id === p.id ? ' active' : '') + '" data-action="arcade-permit" data-permit="' + p.id + '" style="--permit:' + p.color + '">' +
          '<b>' + p.name + '</b><span>' + p.short + '</span>' +
        '</button>';
      }
      permitHtml += '</div>';
      this.dom.briefPermits.innerHTML = permitHtml;
    }
    var used = this.hub.used();
    var cap = this.hub.capacity();
    this.dom.briefCapacity.textContent = used + ' / ' + cap + (used >= cap ? ' · 满' : '');
    this.dom.briefGoal.textContent = mission.goal || (this.type === 'sonar' ? '4 个隐藏货箱' : '废铁 / 燃料 / 纤维 / 芯片 / 玻璃 / 铜');
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
    if (!lootHtml) lootHtml = '<span class="loot-chip empty">暂无物资</span>';
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
    if (this.dom.summaryGrade) {
      this.dom.summaryGrade.className = 'summary-grade grade-' + String(this.applied.grade || 'C').toLowerCase();
      this.dom.summaryGrade.textContent = this.applied.grade || 'C';
      this.dom.summaryGrade.title = this.applied.sBonus ? '首次 S 评级 · +' + this.applied.sBonus + ' 打捞币' : '本局评级';
    }
    this.dom.summaryCredits.textContent = fmt(this.applied.totalCredits);
    var chips = '';
    if (this.condition) {
      chips += '<span class="summary-chip condition" style="--tone:' + this.condition.color + '">海况 · ' + this.condition.name + '</span>';
    }
    if (this.permit) {
      chips += '<span class="summary-chip permit" style="--tone:' + this.permit.color + '">许可 · ' + this.permit.name + '</span>';
    }
    if (this.applied.recommended) {
      chips += '<span class="summary-chip recommend" style="--tone:#e0a13c">今日推荐 · +20%' + (this.applied.recommendBonus ? ' · 首胜 +1 收藏' : '') + '</span>';
    }
    if (this.applied.masteryLevel > 0) {
      chips += '<span class="summary-chip mastery" style="--tone:#0f8f8a">熟练 Lv.' + this.applied.masteryLevel + ' · +' + (this.applied.masteryLevel * 3) + '%</span>';
    }
    if (this.applied.perfectCount > 0) {
      chips += '<span class="summary-chip precision" style="--tone:#ffcf6e">精准投放 ×' + this.applied.perfectCount + ' · 已计入分数</span>';
    }
    if (this.applied.hookDrones > 0) {
      chips += '<span class="summary-chip hook-drone" style="--tone:#79d8ff">走私无人机 · ' + this.applied.hookDrones + ' 架</span>';
    }
    if (this.applied.trenchDepth > 0) {
      chips += '<span class="summary-chip depth" style="--tone:#79d8ff">海沟深度 · ' + this.applied.trenchDepth + ' / 5 层</span>';
    }
    if (this.applied.diveLowCaught > 0) {
      chips += '<span class="summary-chip low-oxygen" style="--tone:#ffb070">低氧冲刺 · ' + this.applied.diveLowCaught + ' 次收集</span>';
    }
    if (this.applied.spreadShots > 0) {
      chips += '<span class="summary-chip spread" style="--tone:#ffdf72">散射炮 · ' + this.applied.spreadShots + ' 轮</span>';
    }
    if (this.applied.trawlPerfect > 0) {
      chips += '<span class="summary-chip perfect-catch" style="--tone:#ffe08a">完美接取 · ' + this.applied.trawlPerfect + ' 次</span>';
    }
    if (this.applied.trawlFrenzy > 0) {
      chips += '<span class="summary-chip net-frenzy" style="--tone:#ffcf72">满网 · ' + this.applied.trawlFrenzy + ' 次</span>';
    }
    if (this.applied.cutPerfect > 0) {
      chips += '<span class="summary-chip cut-perfect" style="--tone:#ffe08a">完美切口 · ' + this.applied.cutPerfect + ' 次</span>';
    }
    if (this.applied.sortCombo > 0) {
      chips += '<span class="summary-chip sort-combo" style="--tone:#9be2a9">分拣连击 · ×' + this.applied.sortCombo + '</span>';
    }
    if (this.applied.stackGolden > 0) {
      chips += '<span class="summary-chip golden-crate" style="--tone:#ffe08a">黄金货箱 · ' + this.applied.stackGolden + ' 箱</span>';
    }
    if (this.applied.beaconPairs > 0) {
      chips += '<span class="summary-chip beacon-pair" style="--tone:#79d8ff">双灯信号 · ' + this.applied.beaconPairs + ' 组</span>';
    }
    if (this.applied.sonarStreak > 0) {
      chips += '<span class="summary-chip sonar-streak" style="--tone:#79d8ff">声呐连找 · ×' + this.applied.sonarStreak + '</span>';
    }
    if (this.applied.sonarPerfect) {
      chips += '<span class="summary-chip sonar-perfect" style="--tone:#8ff3e3">无空探 · +250</span>';
    }
    if (this.applied.matchOverdrive > 0) {
      chips += '<span class="summary-chip match-overdrive" style="--tone:#ffcf72">深海连锁 · ' + this.applied.matchOverdrive + ' 次</span>';
    }
    if (this.applied.seaBonus > 0) {
      chips += '<span class="summary-chip sea-codex-chip" style="--tone:#79d8ff">海况图鉴 · +' + Math.round(this.applied.seaBonus * 100) + '%</span>';
    }
    if (this.applied.seaDiscoveries && this.applied.seaDiscoveries.length) {
      chips += '<span class="summary-chip sea-new" style="--tone:#ffcf6e">新海况 · ' + this.applied.seaDiscoveries.join(' / ') + ' +' + (this.applied.seaDiscoveries.length * 120) + '</span>';
    }
    if (this.hub.data.equipped && this.hub.data.equipped.length) {
      chips += '<span class="summary-chip relic" style="--tone:#18b8b0">藏品 · ' + this.hub.data.equipped.length + ' 件</span>';
    }
    if (this.applied.chain >= 2) {
      chips += '<span class="summary-chip chain" style="--tone:#e0a13c">环线 · ' + this.applied.chain + '/6' + (this.applied.chainBonus > 0 ? ' · +' + Math.round((this.applied.chainMult - 1) * 100) + '%' : '') + '</span>';
    }
    if (this.applied.sBonus > 0) {
      chips += '<span class="summary-chip grade-bonus" style="--tone:#b77b22">首次 ' + this.applied.grade + ' · +' + this.applied.sBonus + '</span>';
    }
    if (this.applied.specials && this.applied.specials.length) {
      for (var si = 0; si < this.applied.specials.length; si++) {
        var sdef = CW.COLLECTIBLE_MAP[this.applied.specials[si]];
        if (sdef) chips += '<span class="summary-chip special" style="--tone:' + CW.COLLECTIBLE_RARITY_MAP[sdef.rarity].color + '">稀有升级件 · ' + sdef.name + ' +1</span>';
      }
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
    this.phase = 'brief';
    this.permit = null;
    this.condition = this.pickCondition();
    this.pickPermitOptions();
    this.createGame(true);
    this.fillBrief();
    this.lastLoot = '';
    this.lastHudScore = '';
    this.showPlayUI(false);
    this.dom.brief.classList.remove('hidden');
    this.audio.click();
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

  Arcade.prototype.retryRun = function () {
    var type = this.type;
    this.close();
    if (type) this.hub.startMission(type);
  };

  Arcade.prototype.nextRun = function () {
    var next = this.hub.data.activeMissions && this.hub.data.activeMissions[0];
    this.close();
    this.hub.startMission(next || 'hook');
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
    this.audio.setScene('hub');
    this.hub.onArcadeClosed();
    this.audio.click();
  };

  CW.Arcade = Arcade;

  /* ═══════════════════════════════════════════════════════════
     沉城抓钩
     ═══════════════════════════════════════════════════════════ */
  var ITEM_TYPES = {
    scrap: { name: '废钢', credits: 35, mats: { metal: 2 }, weight: 1.1, color: '#b8c5c6', tier: 'low' },
    barrel: { name: '燃料桶', credits: 55, mats: { fuel: 2 }, weight: 1.55, color: '#ffb15e', tier: 'low' },
    tarp: { name: '纤维捆', credits: 40, mats: { fiber: 2 }, weight: 0.9, color: '#9be2a9', tier: 'low' },
    glass: { name: '玻璃瓶', credits: 45, mats: { glass: 2 }, weight: 1.0, color: '#8fe0d8', tier: 'low' },
    copper: { name: '铜线圈', credits: 70, mats: { copper: 2 }, weight: 1.25, color: '#e2a06a', tier: 'low' },
    chip: { name: '芯片箱', credits: 85, mats: { chip: 2 }, weight: 1.75, color: '#79d8ff', tier: 'mid' },
    safe: { name: '保险箱', credits: 170, mats: { metal: 3, chip: 1 }, weight: 2.75, color: '#d9c7a1', tier: 'high' },
    gold: { name: '金条', credits: 280, mats: {}, weight: 2.2, color: '#ffd166', tier: 'high' },
    relic: { name: '沉船秘宝', credits: 420, mats: { chip: 2, glass: 2, copper: 2 }, weight: 3.0, color: '#d9b8ff', tier: 'high', specialDrop: 0.35 },
    treasure: { name: '黄金宝箱', credits: 680, mats: { chip: 3, glass: 3, copper: 3 }, weight: 3.4, color: '#ffe18a', tier: 'high', specialDrop: 0.6 },
    filter: { name: '海水过滤器', credits: 0, mats: {}, weight: 2.45, color: '#9feeff', rare: true, tier: 'special' },
    drone: { name: '走私无人机', credits: 300, mats: { chip: 1, copper: 1 }, weight: 1.4, color: '#79d8ff', tier: 'high', drone: true },
    mine: { name: '水雷', credits: 0, mats: {}, weight: 0, color: '#ff6c55', mine: true }
  };

  function emptyMaterialCounts() {
    var out = {};
    for (var i = 0; i < MATERIALS.length; i++) out[MATERIALS[i].id] = 0;
    return out;
  }

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
    this.specials = [];
    this.filters = 0;
    this.lowStreak = 0;
    this.highCaught = 0;
    this.precisionStreak = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.dropQuality = 0;
    this.rareFound = false;
    this.hasFilter = false;
    this.droneTimer = 12;
    this.droneCount = 0;
    this.counts = emptyMaterialCounts();
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
    this.counts = emptyMaterialCounts();
    this.filters = 0;
    this.rareFound = false;
    this.hasFilter = false;
    this.droneTimer = 12;
    this.droneCount = 0;
    this.attached = null;
    this.credits = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.safeCount = 0;
    this.goldCount = 0;
    this.collectibles = [];
    this.specials = [];
    this.lowStreak = 0;
    this.highCaught = 0;
    this.precisionStreak = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.dropQuality = 0;
    this.length = 62;
    this.swingTime = 0;
    this.angle = 0;
    this.itemScale = clamp(Math.min(this.w, this.h) / 400, 0.9, 1.2);
    var pool = [
      'scrap', 'scrap', 'barrel', 'barrel', 'tarp', 'tarp', 'glass', 'copper',
      'chip', 'chip', 'safe', 'safe', 'gold', 'gold', 'relic', 'relic', 'treasure',
      'mine', 'mine', 'collectible', 'collectible'
    ];
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
      var item = {
        key: key,
        x: x,
        y: y,
        r: (key === 'treasure' ? 22 : key === 'safe' ? 20 : key === 'relic' ? 19 : key === 'gold' ? 18 : 16) * this.itemScale,
        phase: Math.random() * TAU,
        grabbed: false,
        dead: false
      };
      if (key === 'collectible' && CW.rollCollectibleDef) {
        var cdef = CW.rollCollectibleDef();
        item.collectibleId = cdef.id;
        item.name = cdef.name;
        item.icon = cdef.icon;
        item.color = CW.COLLECTIBLE_RARITY_MAP[cdef.rarity].color;
        item.rarity = cdef.rarity;
        item.r = 18 * this.itemScale;
      }
      this.items.push(item);
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

  HookGame.prototype.spawnDrone = function () {
    var cargo = (CW.rollCollectibleDef && Math.random() < 0.45) ? CW.rollCollectibleDef() : null;
    this.items.push({
      key: 'drone',
      x: -26,
      y: rand(this.fieldTop() + 18, this.fieldBottom() - 18),
      r: 17 * this.itemScale,
      phase: Math.random() * TAU,
      grabbed: false,
      dead: false,
      vx: rand(52, 78),
      drone: true,
      collectibleId: cargo ? cargo.id : null,
      collectibleName: cargo ? cargo.name : null
    });
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
    this.specials = [];
    this.lowStreak = 0;
    this.highCaught = 0;
    this.precisionStreak = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.dropQuality = 0;
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
    var aim = Math.abs(this.angle);
    this.dropQuality = aim < 0.12 ? 2 : aim < 0.28 ? 1 : 0;
    if (this.dropQuality === 2) {
      this.perfectCount += 1;
      this.precisionStreak += 1;
      this.flash = Math.max(this.flash, 0.28);
      this.popups.push({ x: this.pivot().x, y: this.pivot().y + 24, text: 'PERFECT · 精准 +20%', color: '#ffe08a', life: 1.0, maxLife: 1.0 });
    } else if (this.dropQuality === 1) {
      this.goodCount += 1;
      this.precisionStreak = 0;
      this.popups.push({ x: this.pivot().x, y: this.pivot().y + 24, text: 'GOOD · +10%', color: '#9feeff', life: 0.8, maxLife: 0.8 });
    } else {
      this.precisionStreak = 0;
    }
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
      hint: '点击水面放下抓钩 · 中心松手精准 +20% · 走私无人机会横穿水域 · 水雷清零连击'
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
    this.droneTimer -= dt;
    if (this.droneTimer <= 0) {
      this.droneTimer = rand(14, 20);
      this.spawnDrone();
    }
    for (var di = this.items.length - 1; di >= 0; di--) {
      var ditem = this.items[di];
      if (ditem.drone && !ditem.grabbed) {
        ditem.x += ditem.vx * dt;
        ditem.y = ditem.y + Math.sin(this.time * 2.2 + ditem.phase) * 8 * dt;
        if (ditem.x > this.w + 40) this.items.splice(di, 1);
      }
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
          this.precisionStreak = 0;
          this.dropQuality = 0;
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
      if (data.drone) {
        this.droneCount += 1;
        this.popups.push({ x: it.x, y: it.y - 56, text: '走私无人机 · +' + data.credits, color: '#79d8ff', life: 1.6, maxLife: 1.6 });
        if (it.collectibleId) {
          this.collectibles.push(it.collectibleId);
          this.popups.push({ x: it.x, y: it.y - 82, text: '无人机货舱 · ' + it.collectibleName, color: '#d9b8ff', life: 1.9, maxLife: 1.9 });
        }
        this.flash = Math.max(this.flash, 0.25);
      }
      var highTier = data.tier === 'high';
      this.lowStreak = highTier ? 0 : this.lowStreak + 1;
      if (highTier) this.highCaught += 1;
      var gained = Math.round(data.credits * (1 + (this.combo - 1) * 0.08) * (1 + this.dropQuality * 0.1));
      var crit = Math.random() < 0.15;
      if (crit) gained *= 2;
      this.credits += gained;
      for (var key in data.mats) {
        if (Object.prototype.hasOwnProperty.call(data.mats, key)) this.counts[key] = (this.counts[key] || 0) + data.mats[key];
      }
      this.popups.push({ x: it.x, y: it.y - 20, text: '+' + gained + (crit ? ' 暴击×2' : '') + (this.dropQuality === 2 ? ' 精准' : this.dropQuality === 1 ? ' 良好' : ''), color: crit ? '#ff9a5c' : '#ffd166', life: crit ? 1.5 : 1.2, maxLife: crit ? 1.5 : 1.2 });
      if (this.dropQuality === 2 && this.precisionStreak === 3) {
        this.credits += 120;
        this.flash = 0.32;
        this.popups.push({ x: it.x, y: it.y - 80, text: '精准三连 +120', color: '#ffe08a', life: 1.7, maxLife: 1.7 });
      }
      this.dropQuality = 0;
      if (this.combo > 1) this.popups.push({ x: it.x, y: it.y - 40, text: '连击 ×' + this.combo, color: '#9feeff', life: 1.2, maxLife: 1.2 });
      if (this.combo === 4 || this.combo === 7) {
        var comboBonus = this.combo === 4 ? 80 : 180;
        this.credits += comboBonus;
        this.flash = 0.2;
        this.popups.push({ x: it.x, y: it.y - 61, text: '连击奖励 +' + comboBonus, color: '#ffcf72', life: 1.6, maxLife: 1.6 });
      }
      if (data.specialDrop && Math.random() < data.specialDrop) {
        var sid = CW.rollSpecialMaterial();
        var sdef = CW.COLLECTIBLE_MAP[sid];
        this.specials.push(sid);
        this.flash = 0.38;
        this.popups.push({ x: it.x, y: it.y - 78, text: '稀有升级件！' + sdef.name, color: '#d9b8ff', life: 2.2, maxLife: 2.2 });
        this.spawnBurst(it.x, it.y, '#d9b8ff', 34, 170);
      } else if (highTier && this.highCaught >= 4 && !this.specials.length) {
        var gsid = CW.rollSpecialMaterial();
        var gsdef = CW.COLLECTIBLE_MAP[gsid];
        this.specials.push(gsid);
        this.flash = 0.35;
        this.popups.push({ x: it.x, y: it.y - 78, text: '打捞保底 · ' + gsdef.name, color: '#d9b8ff', life: 2.2, maxLife: 2.2 });
        this.spawnBurst(it.x, it.y, '#d9b8ff', 30, 160);
      }
      if (this.lowStreak >= 4) {
        this.lowStreak = 0;
        var converted = false;
        for (var li = 0; li < this.items.length; li++) {
          var litem = this.items[li];
          if (litem === it || litem.grabbed) continue;
          if (ITEM_TYPES[litem.key] && ITEM_TYPES[litem.key].tier === 'low') {
            litem.key = 'treasure';
            litem.r = 22 * this.itemScale;
            converted = true;
            this.popups.push({ x: litem.x, y: litem.y - 24, text: '深海馈赠 · 宝箱出现', color: '#ffe18a', life: 2.0, maxLife: 2.0 });
            this.spawnBurst(litem.x, litem.y, '#ffd166', 20, 120);
            break;
          }
        }
        if (!converted) this.credits += 120;
      }
      this.spawnBurst(it.x, it.y, data.color, highTier ? 30 : 16, highTier ? 160 : 110);
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
      perfectCount: this.perfectCount,
      droneCount: this.droneCount,
      safeCount: this.safeCount,
      goldCount: this.goldCount,
      collectibles: this.collectibles.slice(),
      specials: this.specials.slice(),
      materials: this.counts
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
      glow.addColorStop(0, data.mine ? 'rgba(255, 90, 65, 0.2)' : data.tier === 'high' ? hexA(data.color, 0.38) : hexA(data.color, 0.15));
      glow.addColorStop(1, data.mine ? 'rgba(255, 90, 65, 0)' : hexA(data.color, 0));
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
      g.strokeStyle = data.mine ? 'rgba(255, 108, 85, 0.65)' : data.tier === 'high' ? data.color : data.tier === 'mid' ? 'rgba(121, 216, 255, 0.65)' : 'rgba(218, 255, 249, 0.28)';
      g.lineWidth = data.tier === 'high' ? 3 : data.tier === 'mid' ? 2 : 1;
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

    // center aim guide: the rope turns gold near the perfect angle
    var aimGood = this.state === 'swing' && Math.abs(this.angle) < 0.12;
    ctx.save();
    ctx.setLineDash([3, 8]);
    ctx.strokeStyle = 'rgba(255, 224, 138, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y + 12);
    ctx.lineTo(pivot.x, bottom + 8);
    ctx.stroke();
    ctx.restore();
    // pulley, rope and image-based hook
    this.drawPulley(ctx, pivot);
    var tip = this.hookTip();
    ctx.strokeStyle = aimGood ? 'rgba(255, 224, 138, 0.95)' : 'rgba(224, 210, 170, 0.58)';
    ctx.lineWidth = aimGood ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y - 1);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    if (aimGood) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffe08a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
      if (item.collectibleId) {
        ctx.strokeStyle = '#ffdf72';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, s + 3, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#ffdf72';
        ctx.beginPath(); ctx.arc(s * 0.7, -s * 0.7, 3, 0, TAU); ctx.fill();
      }
      ctx.restore();
      this.drawItemLabel(ctx, x, y + s + 13, (data.tier === 'high' ? '★ ' : '') + data.name + (item.collectibleId ? ' · 藏' : ''), data.mine ? '#ff8a6b' : data.color);
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
    ctx.textBaseline = 'middle';
    ctx.font = '800 11px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    var tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(255, 252, 244, 0.96)';
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 6, y - 9, tw + 12, 18, 9);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = color === '#ff8a6b' ? '#b9472c' : '#24555a';
    ctx.fillText(text, x, y + 0.5);
    ctx.restore();
  };

  CW.HookGame = HookGame;
})();

