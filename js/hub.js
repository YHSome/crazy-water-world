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
      desc: '在反应堆控制室里分拣废料。滑动交换，四连扫线、五连清同色。',
      tags: ['30 步', '三消', '稀有过滤器']
    },
    {
      id: 'sonar', name: '声呐扫掠', icon: '声', iconImg: 'assets/icons/sonar.svg', kicker: 'MISSION 03',
      desc: '在锈蚀控制台前发射声呐，用距离回波定位隐藏货箱。每格只能探测一次，声呐次数有限。',
      tags: ['10 次声呐', '探索', '稀有过滤器']
    }
  ]);

  var CONTRACTS = (CW.CONTRACTS = [
    {
      id: 'safe', name: '保险箱回收', iconImg: 'assets/icons/safe.svg', metric: 'safe', mode: 'sum', target: 5,
      desc: '在沉城抓钩里累计抓回 5 个保险箱。',
      reward: { credits: 180, mats: { metal: 4 } }
    },
    {
      id: 'combo', name: '连击专家', iconImg: 'assets/icons/hook.svg', metric: 'bestCombo', mode: 'max', target: 6,
      desc: '单局抓钩最高连击达到 6。',
      reward: { credits: 220, mats: { chip: 2 } }
    },
    {
      id: 'score', name: '高分分拣', iconImg: 'assets/icons/puzzle.svg', metric: 'matchScore', mode: 'max', target: 1800,
      desc: '单局废料拼图达到 1,800 分。',
      reward: { credits: 240, mats: { fiber: 4 } }
    },
    {
      id: 'runs', name: '连续作业', iconImg: 'assets/icons/sonar.svg', metric: 'runs', mode: 'sum', target: 3,
      desc: '完成 3 次打捞。',
      reward: { credits: 160, mats: { fuel: 3 } }
    },
    {
      id: 'chips', name: '芯片储备', iconImg: 'assets/icons/chip.svg', metric: 'chips', mode: 'sum', target: 12,
      desc: '累计获得 12 个芯片。',
      reward: { credits: 200, mats: { fiber: 2 } }
    },
    {
      id: 'gold', name: '金条猎人', iconImg: 'assets/icons/gold.svg', metric: 'gold', mode: 'sum', target: 2,
      desc: '抓钩累计抓回 2 根金条。',
      reward: { credits: 220, mats: { chip: 1 } }
    },
    {
      id: 'sonar', name: '声呐猎手', iconImg: 'assets/icons/sonar.svg', metric: 'sonarFinds', mode: 'max', target: 3,
      desc: '单局声呐扫掠找到 3 个货箱。',
      reward: { credits: 230, mats: { chip: 2 } }
    },
    {
      id: 'collector', name: '沉船收藏家', iconImg: 'assets/collectibles/tide-crown.svg', metric: 'collectibles', mode: 'sum', target: 3,
      desc: '累计从打捞中带回 3 件收藏品。',
      reward: { credits: 260, mats: { fiber: 2 } }
    }
  ]);

  function contractDef(contractId) {
    for (var i = 0; i < CONTRACTS.length; i++) if (CONTRACTS[i].id === contractId) return CONTRACTS[i];
    return null;
  }

  function makeContractSet() {
    var pool = CONTRACTS.slice();
    var out = [];
    while (out.length < 3 && pool.length) {
      var idx = (Math.random() * pool.length) | 0;
      var def = pool.splice(idx, 1)[0];
      out.push({ id: def.id, progress: 0, claimed: false });
    }
    return out;
  }

  function normalizeContractSet(raw) {
    if (!Array.isArray(raw) || raw.length !== 3) return makeContractSet();
    var out = [];
    var seen = {};
    for (var i = 0; i < raw.length; i++) {
      var item = raw[i] || {};
      var def = contractDef(String(item.id || ''));
      if (!def || seen[def.id]) continue;
      seen[def.id] = true;
      out.push({
        id: def.id,
        progress: clamp(Math.floor(Number(item.progress) || 0), 0, def.target),
        claimed: !!item.claimed
      });
    }
    var fill = makeContractSet();
    for (var j = 0; out.length < 3 && j < fill.length; j++) {
      if (!seen[fill[j].id]) { seen[fill[j].id] = true; out.push(fill[j]); }
    }
    while (out.length < 3) out.push({ id: CONTRACTS[out.length % CONTRACTS.length].id, progress: 0, claimed: false });
    return out;
  }

  var SAVE_KEY = 'crazywater.floodline.v1';

  function makeDefault() {
    return {
      v: 1,
      started: false,
      credits: 0,
      materials: { metal: 0, fuel: 0, fiber: 0, chip: 0 },
      filters: 0,
      filterPity: 0,
      collectibles: {},
      contracts: makeContractSet(),
      contractRound: 1,
      upgrades: { storage: 0, workshop: 0, sonar: 0, core: 0, purifier: 0 },
      best: { hook: 0, match: 0, sonar: 0 },
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
    data.collectibles = {};
    if (raw.collectibles && typeof raw.collectibles === 'object') {
      for (var cid in raw.collectibles) {
        if (!Object.prototype.hasOwnProperty.call(raw.collectibles, cid)) continue;
        if (!CW.COLLECTIBLE_MAP[cid]) continue;
        var cnum = Math.floor(Number(raw.collectibles[cid]) || 0);
        if (cnum > 0) data.collectibles[cid] = Math.min(9999, cnum);
      }
    }
    data.contracts = normalizeContractSet(raw.contracts);
    data.contractRound = Math.max(1, Math.floor(Number(raw.contractRound) || 1));
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
      data.best.sonar = Math.max(0, Number(raw.best.sonar) || 0);
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
  Hub.prototype.sonarProbes = function () { return 10 + Math.floor((this.data.upgrades.core || 0) / 2); };
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
    var contractTab = document.querySelector('.panel-tab[data-tab="contracts"]');
    if (contractTab) {
      var readyCount = this.contractsReadyCount();
      contractTab.classList.toggle('has-ready', readyCount > 0);
      contractTab.setAttribute('data-ready', String(readyCount));
    }
    var collectionTab = document.querySelector('.panel-tab[data-tab="collection"]');
    if (collectionTab) collectionTab.classList.toggle('has-ready', this.collectionCanCraftAny());
    if (this.tab === 'tasks') {
      this.dom.panelTitle.textContent = '打捞任务';
      this.dom.panelTag.textContent = MISSIONS.length + ' 个任务';
      this.dom.panelNote.textContent = '物资会存进避难所仓库';
    } else if (this.tab === 'contracts') {
      var contractReady = this.contractsReadyCount();
      this.dom.panelTitle.textContent = '打捞契约';
      this.dom.panelTag.textContent = '第 ' + Math.max(1, this.data.contractRound || 1) + ' 轮' + (contractReady ? ' · ' + contractReady + ' 可领' : '');
      this.dom.panelNote.textContent = '完成契约领取打捞币与补给';
    } else if (this.tab === 'collection') {
      this.dom.panelTitle.textContent = '沉船收藏';
      this.dom.panelTag.textContent = this.collectionUnique() + ' / ' + CW.COLLECTIBLES.length;
      this.dom.panelNote.textContent = '3 件同级 + 打捞币可合成更高稀有度';
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
    else if (this.tab === 'contracts') this.renderContracts();
    else if (this.tab === 'collection') this.renderCollection();
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
      if (m.id === 'sonar') tags[0] = this.sonarProbes() + ' 次声呐';
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

  Hub.prototype.contractValue = function (def, result) {
    switch (def.metric) {
      case 'safe': return Math.max(0, Number(result.safeCount) || 0);
      case 'gold': return Math.max(0, Number(result.goldCount) || 0);
      case 'bestCombo': return Math.max(0, Number(result.bestCombo) || 0);
      case 'matchScore': return result.type === 'match' ? Math.max(0, Number(result.score) || 0) : 0;
      case 'runs': return 1;
      case 'chips': return Math.max(0, Number(result.materials && result.materials.chip) || 0);
      case 'sonarFinds': return Math.max(0, Number(result.found) || 0);
      case 'collectibles': return Array.isArray(result.collectibles) ? result.collectibles.length : 0;
      default: return 0;
    }
  };

  Hub.prototype.applyContractProgress = function (result) {
    if (!Array.isArray(this.data.contracts) || !this.data.contracts.length) {
      this.data.contracts = makeContractSet();
      this.data.contractRound = Math.max(1, this.data.contractRound || 1);
    }
    for (var i = 0; i < this.data.contracts.length; i++) {
      var c = this.data.contracts[i];
      if (!c || c.claimed) continue;
      var def = contractDef(c.id);
      if (!def) continue;
      var value = this.contractValue(def, result);
      if (def.mode === 'max') c.progress = Math.max(c.progress || 0, value);
      else c.progress = Math.min(def.target, (c.progress || 0) + value);
    }
  };

  Hub.prototype.contractsReadyCount = function () {
    var n = 0;
    if (!Array.isArray(this.data.contracts)) return 0;
    for (var i = 0; i < this.data.contracts.length; i++) {
      var c = this.data.contracts[i];
      var def = c && contractDef(c.id);
      if (c && def && !c.claimed && c.progress >= def.target) n++;
    }
    return n;
  };

  Hub.prototype.grantContractReward = function (reward) {
    var credits = Math.max(0, Math.round(reward.credits || 0));
    this.data.credits += credits;
    var space = Math.max(0, this.capacity() - this.used());
    var overflow = 0;
    var overflowCredits = 0;
    var stored = {};
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      var amount = Math.max(0, Math.round((reward.mats && reward.mats[m.id]) || 0));
      var put = Math.min(amount, space);
      stored[m.id] = put;
      space -= put;
      this.data.materials[m.id] = (this.data.materials[m.id] || 0) + put;
      var extra = amount - put;
      if (extra > 0) {
        overflow += extra;
        overflowCredits += extra * m.sell;
      }
    }
    this.data.credits += overflowCredits;
    return { credits: credits + overflowCredits, stored: stored, overflow: overflow };
  };

  Hub.prototype.claimContract = function (index) {
    var c = this.data.contracts && this.data.contracts[index];
    if (!c || c.claimed) return;
    var def = contractDef(c.id);
    if (!def || c.progress < def.target) return;
    c.claimed = true;
    var reward = this.grantContractReward(def.reward);
    this.audio.buy();
    var allClaimed = true;
    for (var i = 0; i < this.data.contracts.length; i++) {
      if (!this.data.contracts[i].claimed) { allClaimed = false; break; }
    }
    if (allClaimed) {
      this.data.contracts = makeContractSet();
      this.data.contractRound = Math.max(1, this.data.contractRound || 1) + 1;
      this.showToast('CONTRACT ROUND', '第 ' + this.data.contractRound + ' 轮契约', '新目标已刷新 · 继续打捞');
    } else {
      this.showToast('CONTRACT CLAIMED', def.name, '+' + fmt(reward.credits) + ' 打捞币' + (reward.overflow ? ' · 仓库溢出已折算' : ''));
    }
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.collectionUnique = function () {
    var n = 0;
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      if ((this.data.collectibles || {})[CW.COLLECTIBLES[i].id] > 0) n++;
    }
    return n;
  };

  Hub.prototype.collectionTotal = function () {
    var n = 0;
    var map = this.data.collectibles || {};
    for (var id in map) {
      if (Object.prototype.hasOwnProperty.call(map, id)) n += map[id];
    }
    return n;
  };

  Hub.prototype.collectionRarityCount = function (rarity) {
    var n = 0;
    var map = this.data.collectibles || {};
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      if (CW.COLLECTIBLES[i].rarity === rarity) n += map[CW.COLLECTIBLES[i].id] || 0;
    }
    return n;
  };

  Hub.prototype.collectionCanCraftAny = function () {
    for (var i = 0; i < CW.CRAFT_RECIPES.length; i++) {
      var r = CW.CRAFT_RECIPES[i];
      if (this.collectionRarityCount(r.from) >= 3 && this.data.credits >= r.cost) return true;
    }
    return false;
  };

  Hub.prototype.rollCollectibles = function (result) {
    if (!CW.COLLECTIBLES || !CW.COLLECTIBLES.length) return [];
    if (!this.data.collectibles) this.data.collectibles = {};
    var dropChance = 0.55;
    if (result.type === 'hook') dropChance += clamp((Number(result.score) || 0) / 4000, 0, 0.3);
    else if (result.type === 'match') dropChance += clamp((Number(result.score) || 0) / 6000, 0, 0.3);
    else dropChance += Math.max(0, Number(result.found) || 0) * 0.07;
    dropChance = Math.min(0.95, dropChance);
    var count = Math.random() < dropChance ? 1 : 0;
    if (count && dropChance > 0.85 && chance(0.28)) count += 1;
    var out = [];
    for (var d = 0; d < count; d++) {
      var total = 0;
      for (var w = 0; w < CW.COLLECTIBLE_WEIGHTS.length; w++) total += CW.COLLECTIBLE_WEIGHTS[w].weight;
      var roll = Math.random() * total;
      var rarity = CW.COLLECTIBLE_WEIGHTS[0].rarity;
      for (var j = 0; j < CW.COLLECTIBLE_WEIGHTS.length; j++) {
        roll -= CW.COLLECTIBLE_WEIGHTS[j].weight;
        if (roll <= 0) { rarity = CW.COLLECTIBLE_WEIGHTS[j].rarity; break; }
      }
      var pool = CW.collectiblesOfRarity(rarity);
      if (!pool.length) continue;
      var def = pool[(Math.random() * pool.length) | 0];
      this.data.collectibles[def.id] = (this.data.collectibles[def.id] || 0) + 1;
      out.push({
        id: def.id,
        name: def.name,
        rarity: def.rarity,
        color: CW.COLLECTIBLE_RARITY_MAP[def.rarity].color,
        icon: def.icon
      });
    }
    return out;
  };

  Hub.prototype.craft = function (fromRarity) {
    if (!this.data.collectibles) this.data.collectibles = {};
    var recipe = null;
    for (var i = 0; i < CW.CRAFT_RECIPES.length; i++) {
      if (CW.CRAFT_RECIPES[i].from === fromRarity) recipe = CW.CRAFT_RECIPES[i];
    }
    if (!recipe || this.collectionRarityCount(fromRarity) < 3 || this.data.credits < recipe.cost) return;
    var source = [];
    for (var s = 0; s < CW.COLLECTIBLES.length; s++) {
      var item = CW.COLLECTIBLES[s];
      if (item.rarity === fromRarity && (this.data.collectibles[item.id] || 0) > 0) {
        source.push({ id: item.id, count: this.data.collectibles[item.id] });
      }
    }
    source.sort(function (a, b) { return b.count - a.count; });
    var left = 3;
    for (var k = 0; k < source.length && left > 0; k++) {
      var take = Math.min(left, source[k].count);
      this.data.collectibles[source[k].id] -= take;
      if (this.data.collectibles[source[k].id] <= 0) delete this.data.collectibles[source[k].id];
      left -= take;
    }
    var pool = CW.collectiblesOfRarity(recipe.to);
    var result = pool[(Math.random() * pool.length) | 0];
    this.data.collectibles[result.id] = (this.data.collectibles[result.id] || 0) + 1;
    this.data.credits -= recipe.cost;
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    this.audio.record();
    var rarity = CW.COLLECTIBLE_RARITY_MAP[result.rarity];
    this.showToast('COLLECTION CRAFTED', result.name, '合成消耗 3 件 · ' + rarity.name + '级收藏');
  };

  Hub.prototype.renderContracts = function () {
    var round = Math.max(1, this.data.contractRound || 1);
    var ready = this.contractsReadyCount();
    var html = '<div class="contract-intro">' +
      '<span class="contract-kicker">CONTRACT BOARD · 第 ' + round + ' 轮</span>' +
      '<p>完成打捞目标领取额外补给。三项全部领取后自动刷新下一轮，不需要等待时间。</p>' +
      '<span class="contract-count">' + (ready ? ready + ' 项可领取' : '进行中') + '</span>' +
      '</div><div class="contract-list">';
    for (var i = 0; i < this.data.contracts.length; i++) {
      var c = this.data.contracts[i];
      var def = contractDef(c.id);
      if (!def) continue;
      var progress = Math.min(def.target, c.progress || 0);
      var pct = clamp(progress / def.target, 0, 1);
      var isReady = !c.claimed && progress >= def.target;
      var rewardHtml = '<span>打捞币 +' + fmt(def.reward.credits) + '</span>';
      for (var m = 0; m < MATERIALS.length; m++) {
        var mat = MATERIALS[m];
        var amount = def.reward.mats && def.reward.mats[mat.id];
        if (amount) rewardHtml += '<span><img src="' + mat.iconImg + '" alt="">' + mat.name + ' +' + amount + '</span>';
      }
      html += '<article class="contract-card' + (isReady ? ' ready' : '') + (c.claimed ? ' claimed' : '') + '">' +
        '<div class="contract-icon"><img src="' + def.iconImg + '" alt=""></div>' +
        '<div class="contract-body">' +
          '<div class="contract-title"><b>' + def.name + '</b><span>' + progress + ' / ' + def.target + '</span></div>' +
          '<p class="contract-desc">' + def.desc + '</p>' +
          '<div class="contract-track"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
          '<div class="contract-reward">' + rewardHtml + '</div>' +
        '</div>' +
        '<button class="contract-claim' + (isReady ? ' ready' : '') + '" data-action="claim-contract" data-contract="' + i + '"' +
          (c.claimed || !isReady ? ' disabled' : '') + '>' + (c.claimed ? '已领取' : isReady ? '领取' : '进行中') + '</button>' +
      '</article>';
    }
    html += '</div><p class="contract-footnote">契约进度在每次打捞结算时更新，关闭页面不会自动增长。</p>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.renderCollection = function () {
    var unique = this.collectionUnique();
    var total = this.collectionTotal();
    var map = this.data.collectibles || {};
    var html = '<div class="collection-summary">' +
      '<span class="collection-kicker">SUNKEN ARCHIVE · 沉船收藏</span>' +
      '<div class="collection-headline"><b>' + unique + ' / ' + CW.COLLECTIBLES.length + '</b><span>已发现 · 共 ' + total + ' 件</span></div>' +
      '<p>收藏品不占仓库容量，从打捞结算中随机带回。重复件可以在合成台合并。</p>' +
      '</div><div class="craft-board">' +
      '<div class="craft-head"><span>合成台</span><small>3 件同级 + 打捞币 → 1 件更高稀有度</small></div><div class="craft-list">';
    for (var r = 0; r < CW.CRAFT_RECIPES.length; r++) {
      var rec = CW.CRAFT_RECIPES[r];
      var from = CW.COLLECTIBLE_RARITY_MAP[rec.from];
      var to = CW.COLLECTIBLE_RARITY_MAP[rec.to];
      var have = this.collectionRarityCount(rec.from);
      var can = have >= 3 && this.data.credits >= rec.cost;
      html += '<div class="craft-row">' +
        '<span class="craft-source" style="--rarity:' + from.color + '">3 × ' + from.name + '</span>' +
        '<span class="craft-arrow">→</span>' +
        '<span class="craft-target" style="--rarity:' + to.color + '">1 × ' + to.name + '</span>' +
        '<button class="craft-btn' + (can ? ' ready' : '') + '" data-action="craft" data-rarity="' + rec.from + '"' + (can ? '' : ' disabled') + '>' +
          (can ? '合成 · ' + fmt(rec.cost) : (have < 3 ? '缺 ' + (3 - have) + ' 件' : '缺打捞币')) +
        '</button>' +
      '</div>';
    }
    html += '</div></div>';
    for (var q = 0; q < CW.COLLECTIBLE_RARITIES.length; q++) {
      var rarity = CW.COLLECTIBLE_RARITIES[q];
      var group = [];
      for (var i = 0; i < CW.COLLECTIBLES.length; i++) if (CW.COLLECTIBLES[i].rarity === rarity.id) group.push(CW.COLLECTIBLES[i]);
      var discovered = 0;
      for (var d = 0; d < group.length; d++) if ((map[group[d].id] || 0) > 0) discovered++;
      html += '<section class="collection-group" style="--rarity:' + rarity.color + '">' +
        '<header><b>' + rarity.name + '</b><span>' + discovered + ' / ' + group.length + '</span></header><div class="collectible-grid">';
      for (var g = 0; g < group.length; g++) {
        var item = group[g];
        var n = map[item.id] || 0;
        html += '<article class="collectible-card' + (n ? '' : ' unknown') + '" title="' + item.desc + '" style="--rarity:' + rarity.color + '">' +
          '<span class="collectible-art"><img src="' + item.icon + '" alt=""></span>' +
          '<span class="collectible-copy"><b>' + item.name + '</b><em>' + (n ? '×' + n : '未发现') + '</em></span>' +
        '</article>';
      }
      html += '</div></section>';
    }
    html += '<p class="collection-note">打捞结算时按表现提高收藏掉落率；史诗与传说也可以由低级收藏逐级合成。</p>';
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
    window.setTimeout(function () {
      var n = self.contractsReadyCount();
      if (n > 0 && self.state === 'playing') {
        self.showToast('CONTRACT READY', n + ' 份契约可领取', '打开「契约」标签领取打捞币与补给');
      }
    }, 520);
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
    var key = result.type === 'match' ? 'match' : result.type === 'sonar' ? 'sonar' : 'hook';
    this.data.best[key] = Math.max(this.data.best[key] || 0, Math.round(result.score || 0));
    var collectibles = this.rollCollectibles(result);
    result.collectibles = collectibles;
    this.applyContractProgress(result);
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
      used: cap - storeSpace,
      collectibles: collectibles
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
        else if (action === 'claim-contract') self.claimContract(parseInt(actionEl.getAttribute('data-contract'), 10));
        else if (action === 'craft') self.craft(actionEl.getAttribute('data-rarity'));
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
