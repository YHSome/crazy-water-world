/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 末日打捞站
   Hub state, common currency, warehouse, shelter upgrades.
   No offline income: every scrap must be earned in a run.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CW = (window.CW = window.CW || {});
  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function chance(p) { return Math.random() < p; }
  function mod(n, m) { return ((n % m) + m) % m; }
  function trimZero(s) { return s.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1'); }
  function fmt(n) {
    n = Number(n) || 0;
    if (n < 0) n = 0;
    if (n < 10) return trimZero((Math.round(n * 10) / 10).toFixed(1));
    if (n < 10000) return Math.floor(n).toLocaleString('en-US');
    if (n < 100000000) return trimZero((n / 10000).toFixed(1)) + '万';
    if (n < 1000000000000) return trimZero((n / 100000000).toFixed(2)) + '亿';
    return n.toExponential(1).replace('e+', 'e');
  }
  function fmtInt(n) { return Math.floor(n).toLocaleString('en-US'); }
  function rgba(c, a) {
    return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')';
  }

  var MATERIALS = (CW.MATERIALS = [
    { id: 'metal', name: '废铁', icon: '铁', iconImg: 'assets/icons/scrap.svg', color: '#a9bec2', sell: 8, desc: '锈蚀的船板、钢梁和齿轮' },
    { id: 'fuel', name: '燃料', icon: '油', iconImg: 'assets/icons/fuel.svg', color: '#ffb15e', sell: 10, desc: '旧世界的柴油、丙烷和火种' },
    { id: 'fiber', name: '纤维', icon: '纤', iconImg: 'assets/icons/fiber.svg', color: '#9be2a9', sell: 8, desc: '尼龙、帆布和还能用的绳索' },
    { id: 'chip', name: '芯片', icon: '芯', iconImg: 'assets/icons/chip.svg', color: '#79d8ff', sell: 16, desc: '控制板、电池和文明残片' }
  ]);

  var UPGRADES = (CW.UPGRADES = [
    {
      id: 'storage', name: '仓库扩容', icon: '仓', iconImg: 'assets/icons/storage.svg', tone: '#ffc46b',
      desc: '仓库容量 +30',
      max: 5,
      costs: [
        { credits: 120, metal: 8, fiber: 4 },
        { credits: 300, metal: 16, fiber: 9 },
        { credits: 750, metal: 26, fiber: 15 },
        { credits: 1800, metal: 40, fiber: 24 },
        { credits: 4200, metal: 60, fiber: 36 }
      ]
    },
    {
      id: 'workshop', name: '打捞工坊', icon: '工', iconImg: 'assets/icons/workshop.svg', tone: '#9dffc7',
      desc: '所有打捞币收益 +10%',
      max: 5,
      costs: [
        { credits: 180, metal: 6, chip: 2 },
        { credits: 450, metal: 12, chip: 5 },
        { credits: 1000, metal: 20, chip: 9 },
        { credits: 2200, metal: 32, chip: 15 },
        { credits: 4800, metal: 50, chip: 24 }
      ]
    },
    {
      id: 'sonar', name: '声呐阵列', icon: '声', iconImg: 'assets/icons/sonar.svg', tone: '#79d8ff',
      desc: '所有物资收益 +12%',
      max: 4,
      costs: [
        { credits: 260, fuel: 6, chip: 3 },
        { credits: 650, fuel: 12, chip: 7 },
        { credits: 1500, fuel: 20, chip: 12 },
        { credits: 3400, fuel: 32, chip: 20 }
      ]
    },
    {
      id: 'core', name: '聚变核心', icon: '核', iconImg: 'assets/icons/core.svg', tone: '#ff8a5c',
      desc: '抓钩 +5 秒 · 三消 +2 步',
      max: 3,
      costs: [
        { credits: 600, metal: 10, fuel: 8, fiber: 8, chip: 6 },
        { credits: 1600, metal: 18, fuel: 15, fiber: 15, chip: 11 },
        { credits: 3800, metal: 30, fuel: 26, fiber: 26, chip: 20 }
      ]
    },
    {
      id: 'purifier', name: '净水舱', icon: '水', tone: '#79d8ff',
      desc: '打捞币收益 +10% · 物资收益 +5%',
      max: 3, iconImg: 'assets/seawater-filter-icon.webp',
      costs: [
        { credits: 500, filters: 1, metal: 8, fiber: 6, chip: 4 },
        { credits: 1400, filters: 1, metal: 14, fiber: 10, chip: 8 },
        { credits: 3200, filters: 1, metal: 22, fiber: 16, chip: 12 }
      ]
    }
  ]);

  var MISSIONS = (CW.MISSIONS = [
    {
      id: 'hook', name: '沉城抓钩', icon: '钩', iconImg: 'assets/icons/hook.svg', kicker: 'MISSION 01',
      desc: '沉在旧城区里的钢梁、油桶和保险箱。抓钩会来回摆动，水雷会浪费五秒。',
      tags: ['60 秒', '抓钩', '稀有过滤器']
    },
    {
      id: 'match', name: '废料拼图', icon: '消', iconImg: 'assets/icons/puzzle.svg', kicker: 'MISSION 02',
      desc: '在反应堆控制室里分拣废料。交换相邻箱子，三连消除，连锁会给更多分。',
      tags: ['30 步', '三消', '稀有过滤器']
    }
  ]);

  var SAVE_KEY = 'crazywater.floodline.v1';

  function makeDefault() {
    return {
      v: 1,
      started: false,
      credits: 0,
      materials: { metal: 0, fuel: 0, fiber: 0, chip: 0 },
      filters: 0,
      filterPity: 0,
      upgrades: { storage: 0, workshop: 0, sonar: 0, core: 0, purifier: 0 },
      best: { hook: 0, match: 0 },
      runs: 0
    };
  }

  function loadSave() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (err) { raw = null; }
    if (!raw || typeof raw !== 'object') return null;
    var data = makeDefault();
    data.started = raw.started !== false;
    data.credits = Math.max(0, Number(raw.credits) || 0);
    data.filters = Math.max(0, Math.floor(Number(raw.filters) || 0));
    data.filterPity = clamp(Math.floor(Number(raw.filterPity) || 0), 0, 7);
    data.runs = Math.max(0, Math.floor(Number(raw.runs) || 0));
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      data.materials[m.id] = clamp(Math.floor(Number(raw.materials && raw.materials[m.id]) || 0), 0, 100000000);
    }
    for (var j = 0; j < UPGRADES.length; j++) {
      var up = UPGRADES[j];
      data.upgrades[up.id] = clamp(Math.floor(Number(raw.upgrades && raw.upgrades[up.id]) || 0), 0, up.max);
    }
    if (raw.best) {
      data.best.hook = Math.max(0, Number(raw.best.hook) || 0);
      data.best.match = Math.max(0, Number(raw.best.match) || 0);
    }
    return data;
  }

  function persistSave(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (err) {} }

  function id(x) { return document.getElementById(x); }

  function Hub(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.audio = new HW.AudioEngine();

    var loaded = loadSave();
    this.hasSave = !!loaded;
    this.data = loaded || makeDefault();
    this.state = 'title';
    this.tab = 'tasks';
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.time = 0;
    this.last = 0;
    this.waterline = 0;
    this.targetWaterline = 0;
    this.sideLayout = false;
    this.rain = [];
    this.lightning = 0;
    this.lightningTimer = 9;
    this.toastTimer = 0;
    this.resetArmed = false;
    this.resetting = false;
    this.resetTimer = 0;
    this.arcade = null;

    this.dom = {
      hud: id('hud'),
      day: id('hud-day'),
      level: id('hud-level'),
      credits: id('hud-credits'),
      store: id('hud-store'),
      storeCap: id('hud-store-cap'),
      storeFill: id('hud-store-fill'),
      panel: id('hub-panel'),
      panelTitle: id('panel-title'),
      panelTag: id('panel-tag'),
      panelNote: id('panel-note'),
      panelContent: id('panel-content'),
      tabs: document.querySelectorAll('.panel-tab'),
      title: id('title-screen'),
      titleLevel: id('title-level'),
      titleCredits: id('title-credits'),
      titleStore: id('title-store'),
      titleNote: id('title-note'),
      startBtn: id('start-btn'),
      startLabel: id('start-btn') ? id('start-btn').querySelector('span') : null,
      guide: id('guide-screen'),
      settings: id('settings-screen'),
      reset: id('reset-save'),
      toast: id('toast'),
      toastKicker: id('toast-kicker'),
      toastTitle: id('toast-title'),
      toastSub: id('toast-sub'),
      arcade: id('arcade')
    };

    this.resize();
    this.initScene();
    if (window.CW && CW.Arcade) this.arcade = new CW.Arcade(this);
    this.bindEvents();
    this.syncMuteUi();
    this.refreshMeta();
    this.renderPanel();
    this.setState('title');
    this.hudVisible(false);
    this.panelVisible(false);
    this.updateLayout(true);
    this.loop = this.loop.bind(this);
    this.last = 0;
    requestAnimationFrame(this.loop);
  }

  /* ── derived values ──────────────────────────────────────── */
  Hub.prototype.level = function () {
    var sum = 0;
    for (var i = 0; i < UPGRADES.length; i++) sum += this.data.upgrades[UPGRADES[i].id] || 0;
    return 1 + sum;
  };
  Hub.prototype.capacity = function () { return 60 + (this.data.upgrades.storage || 0) * 30; };
  Hub.prototype.used = function () {
    var sum = 0;
    for (var i = 0; i < MATERIALS.length; i++) sum += this.data.materials[MATERIALS[i].id] || 0;
    return sum;
  };
  Hub.prototype.creditMult = function () {
    return 1 + (this.data.upgrades.workshop || 0) * 0.1 + (this.data.upgrades.purifier || 0) * 0.1;
  };
  Hub.prototype.materialMult = function () {
    return 1 + (this.data.upgrades.sonar || 0) * 0.12 + (this.data.upgrades.purifier || 0) * 0.05;
  };
  Hub.prototype.hookTime = function () { return 60 + (this.data.upgrades.core || 0) * 5; };
  Hub.prototype.matchMoves = function () { return 30 + (this.data.upgrades.core || 0) * 2; };
  Hub.prototype.dayNumber = function () { return 1281 + this.data.runs * 2; };

  /* ── resize / layout ─────────────────────────────────────── */
  Hub.prototype.resize = function () {
    this.w = Math.max(280, window.innerWidth);
    this.h = Math.max(280, window.innerHeight);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var maxPixels = 4200000;
    var raw = this.w * this.h * dpr * dpr;
    if (raw > maxPixels) dpr *= Math.sqrt(maxPixels / raw);
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.sceneUnit = clamp(Math.min(this.w, this.h) / 820, 0.54, 1.15);
    if (this.rain && this.rain.length) this.resizeScene();
    if (this.arcade) this.arcade.resize();
    this.updateLayout(true);
  };

  Hub.prototype.updateLayout = function (instant) {
    if (!this.dom.panel) return;
    var rect = this.dom.panel.getBoundingClientRect();
    var visible = this.state === 'playing' && !this.dom.panel.classList.contains('hidden');
    var side = visible && rect.width > 0 && rect.left > this.w * 0.35;
    this.sideLayout = side;
    var target;
    if (!visible) target = this.h * (this.h < 620 ? 0.92 : 0.76);
    else if (side) target = this.h * 0.61;
    else target = rect.top - clamp(this.h * 0.14, 40, 130);
    this.targetWaterline = clamp(target, this.h * 0.22, this.h * 0.84);
    if (instant) this.waterline = this.targetWaterline;
  };

  /* ── lifecycle ───────────────────────────────────────────── */
  Hub.prototype.setState = function (state) {
    this.state = state;
    document.body.classList.toggle('is-title', state === 'title');
    document.body.classList.toggle('is-playing', state === 'playing');
  };

  Hub.prototype.hudVisible = function (visible) {
    if (!this.dom.hud) return;
    this.dom.hud.classList.toggle('hidden', !visible);
    this.dom.hud.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };
  Hub.prototype.panelVisible = function (visible) {
    if (!this.dom.panel) return;
    this.dom.panel.classList.toggle('hidden', !visible);
  };

  Hub.prototype.enterHub = function () {
    if (this.state === 'playing') return;
    this.audio.unlock();
    this.audio.click();
    if (!this.data.started) {
      this.data.started = true;
      this.hasSave = true;
      this.saveGame();
    }
    this.setState('playing');
    this.hideOverlay(this.dom.title);
    this.hudVisible(true);
    this.panelVisible(true);
    this.updateUI();
    this.renderPanel();
    var self = this;
    requestAnimationFrame(function () { self.updateLayout(); });
    window.setTimeout(function () { self.updateLayout(); }, 300);
    if (this.data.runs === 0) {
      window.setTimeout(function () {
        if (self.state === 'playing') {
          self.showToast('DAY 1281', '两处打捞点已标记', '去沉城里捞回第一船物资');
        }
      }, 700);
    }
  };

  Hub.prototype.loop = function (ts) {
    if (!this.last) this.last = ts;
    var dt = (ts - this.last) / 1000;
    this.last = ts;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    this.time += dt;

    if (this.arcade && this.arcade.active) {
      this.arcade.update(dt);
      this.arcade.render();
    } else {
      this.updateScene(dt);
      this.renderScene();
    }
    requestAnimationFrame(this.loop);
  };

  /* ── title / meta ────────────────────────────────────────── */
  Hub.prototype.refreshMeta = function () {
    if (!this.dom) return;
    var lvl = this.level();
    var cap = this.capacity();
    var used = this.used();
    if (this.dom.titleLevel) this.dom.titleLevel.textContent = String(lvl);
    if (this.dom.titleCredits) this.dom.titleCredits.textContent = fmt(this.data.credits);
    if (this.dom.titleStore) this.dom.titleStore.textContent = used + ' / ' + cap;
    if (this.dom.startLabel) this.dom.startLabel.textContent = this.hasSave ? '返回避难所' : '开始新生活';
    if (this.dom.titleNote) this.dom.titleNote.textContent = '没有离线收益 · 每一份物资都要亲自捞';
  };

  Hub.prototype.updateUI = function () {
    if (!this.dom) return;
    var used = this.used();
    var cap = this.capacity();
    var lvl = this.level();
    if (this.dom.day) this.dom.day.textContent = fmtInt(this.dayNumber());
    if (this.dom.level) this.dom.level.textContent = String(lvl);
    if (this.dom.credits) this.dom.credits.textContent = fmt(this.data.credits);
    if (this.dom.store) this.dom.store.textContent = String(used);
    if (this.dom.storeCap) this.dom.storeCap.textContent = String(cap);
    if (this.dom.storeFill) this.dom.storeFill.style.width = (clamp(used / cap, 0, 1) * 100).toFixed(1) + '%';
    this.refreshMeta();
    this.updatePanelMeta();
  };

  Hub.prototype.updatePanelMeta = function () {
    if (!this.dom || !this.dom.panelTitle) return;
    var used = this.used();
    var cap = this.capacity();
    if (this.tab === 'tasks') {
      this.dom.panelTitle.textContent = '打捞任务';
      this.dom.panelTag.textContent = '2 个任务';
      this.dom.panelNote.textContent = '物资会存进避难所仓库';
    } else if (this.tab === 'warehouse') {
      this.dom.panelTitle.textContent = '避难所仓库';
      this.dom.panelTag.textContent = used + ' / ' + cap;
      this.dom.panelNote.textContent = '超出容量的物资会折算成打捞币';
    } else {
      this.dom.panelTitle.textContent = '扩建疯狂号';
      this.dom.panelTag.textContent = 'Lv.' + this.level();
      this.dom.panelNote.textContent = '升级消耗打捞币与仓库材料';
    }
  };

  /* ── panel rendering ─────────────────────────────────────── */
  Hub.prototype.renderPanel = function () {
    if (!this.dom.panelContent) return;
    var scroll = this.dom.panelContent.scrollTop;
    if (this.tab === 'tasks') this.renderTasks();
    else if (this.tab === 'warehouse') this.renderWarehouse();
    else this.renderShelter();
    this.dom.panelContent.scrollTop = scroll;
    this.updatePanelMeta();
  };

  Hub.prototype.renderTasks = function () {
    var html = '<div class="mission-list">';
    for (var i = 0; i < MISSIONS.length; i++) {
      var m = MISSIONS[i];
      var best = this.data.best[m.id] || 0;
      var tags = m.tags.slice();
      if (m.id === 'hook') tags[0] = this.hookTime() + ' 秒';
      if (m.id === 'match') tags[0] = this.matchMoves() + ' 步';
      html += '<article class="mission-card">' +
        '<div class="mission-icon' + (m.id === 'match' ? ' match' : '') + '"><img src="' + m.iconImg + '" alt=""></div>' +
        '<div class="mission-copy">' +
          '<span class="mission-kicker">' + m.kicker + '</span>' +
          '<div class="mission-name">' + m.name + ' <span class="mission-best">最佳 ' + fmt(best) + '</span></div>' +
          '<p class="mission-desc">' + m.desc + '</p>' +
          '<div class="mission-tags">' + tags.map(function (t) {
            if (t === '稀有过滤器') return '<span class="mission-tag rare"><img src="assets/seawater-filter-icon.webp" alt="">稀有过滤器</span>';
            return '<span class="mission-tag">' + t + '</span>';
          }).join('') + '</div>' +
        '</div>' +
        '<button class="mission-btn" data-action="mission" data-mission="' + m.id + '">开始打捞</button>' +
      '</article>';
    }
    html += '</div>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.renderWarehouse = function () {
    var used = this.used();
    var cap = this.capacity();
    var pct = clamp(used / cap, 0, 1);
    var filters = this.data.filters || 0;
    var filterPity = Math.min(7, this.data.filterPity || 0);
    var purifierMax = 3;
    for (var u = 0; u < UPGRADES.length; u++) if (UPGRADES[u].id === 'purifier') purifierMax = UPGRADES[u].max;
    var purifierMaxed = (this.data.upgrades.purifier || 0) >= purifierMax;
    var filterButton = purifierMaxed ? '净水舱满级' : (filters > 0 ? '去安装' : '去捞一个');
    var filterTab = purifierMaxed || filters > 0 ? 'shelter' : 'tasks';
    var html = '<div class="capacity-card">' +
      '<div class="capacity-head"><span>仓库占用</span><b>' + used + ' / ' + cap + '</b></div>' +
      '<div class="capacity-track"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
      '<p class="capacity-note">仓库满了以后，多出来的物资会按废料价折算成打捞币。扩建仓库可以提高上限。</p>' +
      '</div>' +
      '<div class="rare-card">' +
        '<span class="rare-img-wrap"><img class="rare-img" src="assets/seawater-filter.webp" alt="海水过滤器"></span>' +
        '<div class="rare-info">' +
          '<span class="rare-kicker">RARE SALVAGE · 稀有打捞</span>' +
          '<div class="rare-title">海水过滤器 <b>×' + filters + '</b></div>' +
          '<p>从沉船医疗舱里捞出的净水核心。装上它，海水就会变成能喝的水。</p>' +
          '<span class="rare-note">不占仓库容量 · 用于建造「净水舱」</span>' +
          '<span class="rare-pity">保底进度 ' + filterPity + ' / 8 · ' + (filterPity >= 7 ? '下一局必出' : '再 ' + (8 - filterPity) + ' 局必出') + '</span>' +
        '</div>' +
        '<button class="btn ghost rare-link" data-tab="' + filterTab + '"' + (purifierMaxed ? ' disabled' : '') + '>' + filterButton + '</button>' +
      '</div><div class="mat-grid">';
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      var n = this.data.materials[m.id] || 0;
      html += '<div class="mat-row">' +
        '<span class="mat-icon" style="--tone:' + m.color + '"><img src="' + m.iconImg + '" alt=""></span>' +
        '<span><span class="mat-name">' + m.name + '</span><span class="mat-desc">' + m.desc + '</span></span>' +
        '<span class="mat-count' + (n === 0 ? ' low' : '') + '">' + n + '</span>' +
      '</div>';
    }
    html += '</div><p class="warehouse-note">拿去升级仓库、打捞工坊、声呐阵列和聚变核心。材料不会自己变多——每一块都要下潜去捞。海水过滤器用于净水舱，别当废铁卖了。</p>' +
      '<button class="btn ghost wide panel-action" data-tab="shelter">去扩建仓库</button>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.renderShelter = function () {
    var lvl = this.level();
    var html = '<div class="shelter-head"><span>避难所等级</span><b>Lv.' + lvl + '</b></div><div class="upgrade-list">';
    for (var i = 0; i < UPGRADES.length; i++) {
      var up = UPGRADES[i];
      var level = this.data.upgrades[up.id] || 0;
      var maxed = level >= up.max;
      var cost = maxed ? null : up.costs[level];
      var afford = !maxed && this.canAfford(cost);
      var missingFilter = !!(cost && cost.filters && (this.data.filters || 0) < cost.filters);
      var pips = '';
      for (var p = 0; p < up.max; p++) pips += '<span class="pip ' + (p < level ? 'on' : '') + '"></span>';
      var chips = '';
      if (cost) {
        chips += '<span class="cost-chip' + (this.data.credits < cost.credits ? ' poor' : '') + '" style="--tone:var(--amber)">' + fmt(cost.credits) + '</span>';
        if (cost.filters) {
          chips += '<span class="cost-chip filter' + ((this.data.filters || 0) < cost.filters ? ' poor' : '') + '">过滤器 ×' + cost.filters + '</span>';
        }
        for (var k = 0; k < MATERIALS.length; k++) {
          var m = MATERIALS[k];
          if (!cost[m.id]) continue;
          chips += '<span class="cost-chip' + ((this.data.materials[m.id] || 0) < cost[m.id] ? ' poor' : '') + '" style="--tone:' + m.color + '">' + cost[m.id] + ' ' + m.name + '</span>';
        }
      }
      var iconHtml = up.iconImg ? '<img src="' + up.iconImg + '" alt="">' : up.icon;
      html += '<div class="upgrade-card' + (up.id === 'purifier' ? ' rare' : '') + '">' +
        '<span class="upgrade-icon" style="--tone:' + up.tone + '">' + iconHtml + '</span>' +
        '<div class="upgrade-info">' +
          '<div class="upgrade-name">' + up.name + ' <span class="pips">' + pips + '</span> <span class="upgrade-level">Lv.' + level + '/' + up.max + '</span></div>' +
          '<div class="upgrade-effect">' + up.desc + '</div>' +
          '<div class="upgrade-costs">' + (maxed ? '<span class="cost-chip" style="--tone:var(--aqua)">已满级</span>' : chips) + '</div>' +
        '</div>' +
        '<button class="buy-btn' + (maxed ? ' max' : '') + '" data-action="upgrade" data-upgrade="' + up.id + '"' +
          (maxed || !afford ? ' disabled' : '') + '>' + (maxed ? 'MAX' : (afford ? '强化' : (missingFilter ? '缺过滤器' : '材料不足'))) + '</button>' +
      '</div>';
    }
    html += '</div>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.canAfford = function (cost) {
    if (!cost) return false;
    if (this.data.credits < cost.credits) return false;
    if (cost.filters && (this.data.filters || 0) < cost.filters) return false;
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      if (cost[m.id] && (this.data.materials[m.id] || 0) < cost[m.id]) return false;
    }
    return true;
  };

  Hub.prototype.buyUpgrade = function (upgradeId) {
    var up = null;
    for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === upgradeId) up = UPGRADES[i];
    if (!up) return;
    var level = this.data.upgrades[up.id] || 0;
    if (level >= up.max) return;
    var cost = up.costs[level];
    if (!this.canAfford(cost)) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '材料不足', '再去海里捞一趟');
      return;
    }
    this.data.credits -= cost.credits;
    if (cost.filters) this.data.filters = Math.max(0, (this.data.filters || 0) - cost.filters);
    for (var k = 0; k < MATERIALS.length; k++) {
      var m = MATERIALS[k];
      if (cost[m.id]) this.data.materials[m.id] -= cost[m.id];
    }
    this.data.upgrades[up.id] = level + 1;
    this.saveGame();
    this.audio.buy();
    this.updateUI();
    this.renderPanel();
    this.showToast('UPGRADED', up.name + ' · Lv.' + (level + 1), '疯狂号又结实了一点');
  };

  /* ── missions & rewards ──────────────────────────────────── */
  Hub.prototype.startMission = function (type) {
    if (this.state !== 'playing' || !this.arcade) return;
    var def = null;
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === type) def = MISSIONS[i];
    if (!def) return;
    this.audio.click();
    this.hudVisible(false);
    this.panelVisible(false);
    this.arcade.open(type);
  };

  Hub.prototype.onArcadeClosed = function () {
    this.hudVisible(true);
    this.panelVisible(true);
    this.updateUI();
    this.renderPanel();
    this.saveGame();
    var self = this;
    requestAnimationFrame(function () { self.updateLayout(); });
    window.setTimeout(function () { self.updateLayout(); }, 260);
  };

  Hub.prototype.applyRunResult = function (result) {
    var cap = this.capacity();
    var used = this.used();
    var storeSpace = Math.max(0, cap - used);
    var creditGain = Math.round((result.credits || 0) * this.creditMult());
    var stored = {};
    var overflowUnits = 0;
    var overflowCredits = 0;
    var matFactor = this.materialMult();
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      var raw = Math.round((result.materials && result.materials[m.id]) || 0);
      var amount = Math.round(raw * matFactor);
      var store = Math.min(amount, storeSpace);
      stored[m.id] = store;
      storeSpace -= store;
      var over = amount - store;
      if (over > 0) {
        overflowUnits += over;
        overflowCredits += over * m.sell;
      }
      this.data.materials[m.id] = (this.data.materials[m.id] || 0) + store;
    }
    this.data.credits += creditGain + overflowCredits;
    var filtersGained = Math.max(0, Math.floor(Number(result.filters) || 0));
    this.data.filters = (this.data.filters || 0) + filtersGained;
    if (filtersGained > 0) this.data.filterPity = 0;
    else this.data.filterPity = Math.min(7, (this.data.filterPity || 0) + 1);
    this.data.runs += 1;
    var key = result.type === 'match' ? 'match' : 'hook';
    this.data.best[key] = Math.max(this.data.best[key] || 0, Math.round(result.score || 0));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    return {
      creditGain: creditGain,
      overflowCredits: overflowCredits,
      totalCredits: creditGain + overflowCredits,
      stored: stored,
      overflowUnits: overflowUnits,
      filters: filtersGained,
      filtersTotal: this.data.filters,
      capacity: cap,
      used: cap - storeSpace
    };
  };

  /* ── save / toast ────────────────────────────────────────── */
  Hub.prototype.saveGame = function () {
    if (this.resetting || !this.data || !this.data.started) return;
    persistSave(this.data);
  };

  Hub.prototype.showToast = function (kicker, title, sub) {
    if (!this.dom.toast) return;
    this.dom.toastKicker.textContent = kicker;
    this.dom.toastTitle.textContent = title;
    this.dom.toastSub.textContent = sub;
    this.dom.toast.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    var toast = this.dom.toast;
    this.toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 3000);
  };

  /* ── overlays & settings ─────────────────────────────────── */
  Hub.prototype.showOverlay = function (el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
  };
  Hub.prototype.hideOverlay = function (el) {
    if (!el) return;
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  };
  Hub.prototype.isAnyModalOpen = function () {
    return (!this.dom.guide.classList.contains('hidden')) || (!this.dom.settings.classList.contains('hidden')) || (this.arcade && this.arcade.active);
  };
  Hub.prototype.openGuide = function () {
    this.audio.click();
    this.hideOverlay(this.dom.settings);
    this.showOverlay(this.dom.guide);
  };
  Hub.prototype.closeGuide = function () {
    this.audio.click();
    this.hideOverlay(this.dom.guide);
  };
  Hub.prototype.openSettings = function () {
    this.audio.click();
    this.hideOverlay(this.dom.guide);
    this.showOverlay(this.dom.settings);
  };
  Hub.prototype.closeSettings = function () {
    this.audio.click();
    this.hideOverlay(this.dom.settings);
    this.resetArmed = false;
    if (this.dom.reset) {
      this.dom.reset.classList.remove('armed');
      this.dom.reset.textContent = '清空避难所';
    }
  };
  Hub.prototype.toggleMute = function () {
    this.audio.unlock();
    var muted = this.audio.toggleMuted();
    this.syncMuteUi();
    if (!muted) this.audio.click();
  };
  Hub.prototype.syncMuteUi = function () {
    document.body.classList.toggle('muted', this.audio.muted);
    var buttons = document.querySelectorAll('[data-action="mute"]');
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-label', this.audio.muted ? '开启声音' : '静音');
    var labels = document.querySelectorAll('.settings-row .toggle > span');
    for (var j = 0; j < labels.length; j++) labels[j].textContent = this.audio.muted ? '关闭' : '开启';
  };
  Hub.prototype.resetSave = function () {
    this.audio.click();
    if (!this.resetArmed) {
      this.resetArmed = true;
      if (this.dom.reset) {
        this.dom.reset.classList.add('armed');
        this.dom.reset.textContent = '再点一次，清空一切';
      }
      if (this.resetTimer) clearTimeout(this.resetTimer);
      var self = this;
      this.resetTimer = window.setTimeout(function () {
        self.resetArmed = false;
        if (self.dom.reset) {
          self.dom.reset.classList.remove('armed');
          self.dom.reset.textContent = '清空避难所';
        }
      }, 4500);
      return;
    }
    this.resetting = true;
    try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
    location.reload();
  };

  Hub.prototype.setTab = function (tab) {
    if (tab === this.tab) return;
    this.audio.click();
    this.tab = tab;
    for (var i = 0; i < this.dom.tabs.length; i++) {
      var b = this.dom.tabs[i];
      var active = b.getAttribute('data-tab') === tab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    this.dom.panelContent.scrollTop = 0;
    this.renderPanel();
  };

  /* ── events ──────────────────────────────────────────────── */
  Hub.prototype.bindEvents = function () {
    var self = this;
    document.addEventListener('pointerdown', function () { self.audio.unlock(); }, { once: true });

    document.addEventListener('click', function (e) {
      var actionEl = e.target.closest ? e.target.closest('[data-action]') : null;
      if (actionEl) {
        var action = actionEl.getAttribute('data-action');
        if (action === 'start') self.enterHub();
        else if (action === 'guide') self.openGuide();
        else if (action === 'close-guide') self.closeGuide();
        else if (action === 'settings') self.openSettings();
        else if (action === 'close-settings') self.closeSettings();
        else if (action === 'mute') self.toggleMute();
        else if (action === 'reset-save') self.resetSave();
        else if (action === 'mission') self.startMission(actionEl.getAttribute('data-mission'));
        else if (action === 'upgrade') self.buyUpgrade(actionEl.getAttribute('data-upgrade'));
        return;
      }
      var tabEl = e.target.closest ? e.target.closest('[data-tab]') : null;
      if (tabEl) {
        self.setTab(tabEl.getAttribute('data-tab'));
        return;
      }
      if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        if (!self.dom.guide.classList.contains('hidden')) self.closeGuide();
        else if (!self.dom.settings.classList.contains('hidden')) self.closeSettings();
      }
    });

    window.addEventListener('keydown', function (e) {
      self.audio.unlock();
      if (e.repeat) return;
      if (e.code === 'KeyM') { self.toggleMute(); return; }
      if (e.code === 'Escape') {
        if (!self.dom.guide.classList.contains('hidden')) self.closeGuide();
        else if (!self.dom.settings.classList.contains('hidden')) self.closeSettings();
        return;
      }
      if (e.code === 'Enter' && self.state === 'title' && !self.isAnyModalOpen()) self.enterHub();
    });

    window.addEventListener('resize', function () {
      self.resize();
      self.updateLayout();
      self.renderScene();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        self.resize();
        self.updateLayout();
      });
    }
    window.addEventListener('pagehide', function () { self.saveGame(); });
    window.addEventListener('beforeunload', function () { self.saveGame(); });
    window.addEventListener('blur', function () { self.saveGame(); });
  };

  CW.Hub = Hub;
  CW.SAVE_KEY = SAVE_KEY;
  CW.fmt = fmt;
  CW.fmtInt = fmtInt;
  CW.clamp = clamp;
  CW.lerp = lerp;
  CW.rand = rand;
  CW.chance = chance;
  CW.mod = mod;
  CW.rgba = rgba;
  CW.TAU = TAU;

  window.addEventListener('load', function () {
    var canvas = document.getElementById('scene');
    if (!canvas) return;
    var hub = new Hub(canvas);
    window.__cw = hub;
  });
})();
