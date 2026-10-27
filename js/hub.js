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
    { id: 'metal', name: '废铁', icon: '铁', iconImg: 'assets/real/scrap.webp', color: '#a9bec2', sell: 8, desc: '锈蚀的船板、钢梁和齿轮' },
    { id: 'fuel', name: '燃料', icon: '油', iconImg: 'assets/real/fuel.webp', color: '#ffb15e', sell: 10, desc: '旧世界的柴油、丙烷和火种' },
    { id: 'fiber', name: '纤维', icon: '纤', iconImg: 'assets/real/fiber.webp', color: '#9be2a9', sell: 8, desc: '尼龙、帆布和还能用的绳索' },
    { id: 'chip', name: '芯片', icon: '芯', iconImg: 'assets/real/chip.webp', color: '#79d8ff', sell: 16, desc: '控制板、电池和文明残片' },
    { id: 'glass', name: '玻璃', icon: '玻', iconImg: 'assets/collectibles/sea-bottle.webp', color: '#8fe0d8', sell: 12, desc: '完整瓶身、镜片和还能透光的舷窗' },
    { id: 'copper', name: '铜', icon: '铜', iconImg: 'assets/collectibles/brass-compass.webp', color: '#e2a06a', sell: 14, desc: '线圈、阀门和旧仪器里的铜件' }
  ]);

  var UPGRADES = (CW.UPGRADES = [
    {
      id: 'storage', name: '仓库扩容', icon: '仓', iconImg: 'assets/real/storage.webp', tone: '#ffc46b',
      desc: '仓库容量 +30',
      max: 5,
      costs: [
        { credits: 120, metal: 8, fiber: 4 },
        { credits: 300, metal: 16, fiber: 9, glass: 4 },
        { credits: 750, metal: 26, fiber: 15, copper: 6 },
        { credits: 1800, metal: 40, fiber: 24, glass: 10, copper: 8 },
        { credits: 4200, metal: 60, fiber: 36, glass: 18, copper: 14 }
      ]
    },
    {
      id: 'workshop', name: '打捞工坊', icon: '工', iconImg: 'assets/real/workshop.webp', tone: '#9dffc7',
      desc: '所有打捞币收益 +10%',
      max: 5,
      costs: [
        { credits: 180, metal: 6, chip: 2 },
        { credits: 450, metal: 12, chip: 5, copper: 4 },
        { credits: 1000, metal: 20, chip: 9, glass: 5 },
        { credits: 2200, metal: 32, chip: 15, glass: 8, copper: 10 },
        { credits: 4800, metal: 50, chip: 24, glass: 16, copper: 16 }
      ]
    },
    {
      id: 'sonar', name: '声呐阵列', icon: '声', iconImg: 'assets/real/sonar.webp', tone: '#79d8ff',
      desc: '所有物资收益 +12%',
      max: 4,
      costs: [
        { credits: 260, fuel: 6, chip: 3 },
        { credits: 650, fuel: 12, chip: 7, glass: 3 },
        { credits: 1500, fuel: 20, chip: 12, copper: 5 },
        { credits: 3400, fuel: 32, chip: 20, glass: 8, copper: 8 }
      ]
    },
    {
      id: 'core', name: '聚变核心', icon: '核', iconImg: 'assets/real/core.webp', tone: '#ff8a5c',
      desc: '抓钩 +5 秒 · 三消 +2 步',
      max: 3,
      costs: [
        { credits: 600, metal: 10, fuel: 8, fiber: 8, chip: 6 },
        { credits: 1600, metal: 18, fuel: 15, fiber: 15, chip: 11, copper: 5 },
        { credits: 3800, metal: 30, fuel: 26, fiber: 26, chip: 20, glass: 6, copper: 8 }
      ]
    },
    {
      id: 'purifier', name: '净水舱', icon: '水', tone: '#79d8ff',
      desc: '打捞币收益 +10% · 物资收益 +5%',
      max: 3, iconImg: 'assets/seawater-filter-icon.webp',
      costs: [
        { credits: 500, filters: 1, metal: 8, fiber: 6, chip: 4 },
        { credits: 1400, filters: 1, metal: 14, fiber: 10, chip: 8, glass: 5 },
        { credits: 3200, filters: 1, metal: 22, fiber: 16, chip: 12, glass: 10, copper: 6 }
      ]
    }
  ]);

  var MISSIONS = (CW.MISSIONS = [
    {
      id: 'hook', name: '沉城抓钩', icon: '钩', iconImg: 'assets/real/hook.webp', kicker: 'MISSION 01',
      desc: '沉在旧城区里的钢梁、油桶和保险箱。抓钩会来回摆动，水雷会浪费五秒。',
      tags: ['60 秒', '抓钩', '稀有过滤器']
    },
    {
      id: 'match', name: '废料拼图', icon: '消', iconImg: 'assets/real/puzzle.webp', kicker: 'MISSION 02',
      desc: '在反应堆控制室里分拣废料。滑动交换，四连扫线、五连清同色。',
      tags: ['30 步', '三消', '稀有过滤器']
    },
    {
      id: 'sonar', name: '声呐扫掠', icon: '声', iconImg: 'assets/real/sonar.webp', kicker: 'MISSION 03',
      desc: '在锈蚀控制台前发射声呐，用距离回波定位隐藏货箱。有些货箱埋在深层，需要二次探测；找到货箱会连锁揭示一格。',
      tags: ['10 次声呐', '探索', '稀有过滤器']
    },
    {
      id: 'cut', name: '沉船切割', icon: '切', iconImg: 'assets/real/workshop.webp', kicker: 'MISSION 04',
      desc: '把锈死的船壳拖上拆解台，在切割线进入安全区时下手。切得越准，玻璃和铜件越完整。',
      tags: ['60 秒', '节奏', '玻璃 / 铜'], stat: 'time', goal: '6 个精准切口'
    },
    {
      id: 'sort', name: '分拣传送带', icon: '拣', iconImg: 'assets/real/storage.webp', kicker: 'MISSION 05',
      desc: '旧码头的传送带又转起来了。看清中央货物，点选底部对应材料箱，别把铜线丢进玻璃箱。',
      tags: ['12 件', '反应', '六种材料'], stat: 'time', goal: '分拣 12 件货物'
    },
    {
      id: 'beacon', name: '灯塔信号', icon: '灯', iconImg: 'assets/real/core.webp', kicker: 'MISSION 06',
      desc: '外海灯塔还在发送最后的坐标。记住四座信号灯的闪烁顺序，复现三轮就能带回导航核心。',
      tags: ['3 组', '记忆', '芯片 / 玻璃'], stat: 'time', goal: '复现 3 组信号'
    }
  ]);

  var CONTRACTS = (CW.CONTRACTS = [
    {
      id: 'safe', name: '保险箱回收', iconImg: 'assets/real/safe.webp', metric: 'safe', mode: 'sum', target: 5,
      desc: '在沉城抓钩里累计抓回 5 个保险箱。',
      reward: { credits: 180, mats: { metal: 4 } }
    },
    {
      id: 'combo', name: '连击专家', iconImg: 'assets/real/hook.webp', metric: 'bestCombo', mode: 'max', target: 6,
      desc: '单局抓钩最高连击达到 6。',
      reward: { credits: 220, mats: { chip: 2 } }
    },
    {
      id: 'score', name: '高分分拣', iconImg: 'assets/real/puzzle.webp', metric: 'matchScore', mode: 'max', target: 1800,
      desc: '单局废料拼图达到 1,800 分。',
      reward: { credits: 240, mats: { fiber: 4 } }
    },
    {
      id: 'runs', name: '连续作业', iconImg: 'assets/real/sonar.webp', metric: 'runs', mode: 'sum', target: 3,
      desc: '完成 3 次打捞。',
      reward: { credits: 160, mats: { fuel: 3 } }
    },
    {
      id: 'chips', name: '芯片储备', iconImg: 'assets/real/chip.webp', metric: 'chips', mode: 'sum', target: 12,
      desc: '累计获得 12 个芯片。',
      reward: { credits: 200, mats: { fiber: 2 } }
    },
    {
      id: 'gold', name: '金条猎人', iconImg: 'assets/real/gold.webp', metric: 'gold', mode: 'sum', target: 2,
      desc: '抓钩累计抓回 2 根金条。',
      reward: { credits: 220, mats: { chip: 1 } }
    },
    {
      id: 'sonar', name: '声呐猎手', iconImg: 'assets/real/sonar.webp', metric: 'sonarFinds', mode: 'max', target: 3,
      desc: '单局声呐扫掠找到 3 个货箱。',
      reward: { credits: 230, mats: { chip: 2 } }
    },
    {
      id: 'collector', name: '沉船收藏家', iconImg: 'assets/collectibles/tide-crown.webp', metric: 'collectibles', mode: 'sum', target: 3,
      desc: '累计从打捞中带回 3 件收藏品。',
      reward: { credits: 260, mats: { fiber: 2 } }
    },
    {
      id: 'glass-stock', name: '玻璃储备', iconImg: 'assets/collectibles/sea-bottle.webp', metric: 'glass', mode: 'sum', target: 8,
      desc: '累计带回 8 单位玻璃。',
      reward: { credits: 220, mats: { fiber: 2 } }
    },
    {
      id: 'copper-stock', name: '铜线储备', iconImg: 'assets/collectibles/brass-compass.webp', metric: 'copper', mode: 'sum', target: 8,
      desc: '累计带回 8 单位铜。',
      reward: { credits: 240, mats: { fuel: 2 } }
    },
    {
      id: 'cut-contract', name: '精准拆解', iconImg: 'assets/real/workshop.webp', metric: 'cutCuts', mode: 'sum', target: 8,
      desc: '累计完成 8 个沉船切割切口。',
      reward: { credits: 240, mats: { glass: 2, copper: 1 } }
    },
    {
      id: 'sort-contract', name: '流水线熟手', iconImg: 'assets/real/storage.webp', metric: 'sortCorrect', mode: 'sum', target: 10,
      desc: '累计正确分拣 10 件货物。',
      reward: { credits: 250, mats: { chip: 2, glass: 2 } }
    },
    {
      id: 'beacon-contract', name: '守灯人', iconImg: 'assets/real/core.webp', metric: 'beaconRounds', mode: 'sum', target: 3,
      desc: '累计复现 3 组灯塔信号。',
      reward: { credits: 260, mats: { copper: 2, chip: 1 } }
    },
    {
      id: 'perfect-sonar', name: '全图回收', iconImg: 'assets/real/sonar.webp', metric: 'sonarPerfect', mode: 'max', target: 1, rare: true,
      desc: '单局声呐扫掠找回全部 4 个货箱。',
      reward: { credits: 520, mats: { chip: 4 } }
    },
    {
      id: 'storm-run', name: '风暴猎手', iconImg: 'assets/real/mine.webp', metric: 'stormRun', mode: 'max', target: 1, rare: true,
      desc: '在雷区、赤潮或包含它们的双重海况下完成一局。',
      reward: { credits: 480, mats: { fuel: 4, fiber: 2 } }
    }
  ]);

  var DAILY_CHALLENGES = (CW.DAILY_CHALLENGES = [
    {
      id: 'daily-safe', name: '保险箱大丰收', iconImg: 'assets/real/safe.webp',
      metric: 'safe', mode: 'max', target: 4,
      desc: '单局抓钩带回 4 个保险箱。',
      reward: { credits: 320, mats: { metal: 5, fiber: 3 } }
    },
    {
      id: 'daily-combo', name: '潮汐连击', iconImg: 'assets/real/hook.webp',
      metric: 'bestCombo', mode: 'max', target: 6,
      desc: '单局抓钩最高连击达到 6。',
      reward: { credits: 340, mats: { chip: 3 } }
    },
    {
      id: 'daily-score', name: '高分分拣', iconImg: 'assets/real/puzzle.webp',
      metric: 'matchScore', mode: 'max', target: 1800,
      desc: '单局废料拼图达到 1,800 分。',
      reward: { credits: 360, mats: { fiber: 4 } }
    },
    {
      id: 'daily-sonar', name: '全货箱回收', iconImg: 'assets/real/sonar.webp',
      metric: 'sonarFinds', mode: 'max', target: 4,
      desc: '单局声呐扫掠找回全部 4 个货箱。',
      reward: { credits: 340, mats: { chip: 3 } }
    },
    {
      id: 'daily-runs', name: '三次出航', iconImg: 'assets/real/storage.webp',
      metric: 'runs', mode: 'sum', target: 3,
      desc: '今天完成 3 次打捞。',
      reward: { credits: 260, mats: { fuel: 4 } }
    },
    {
      id: 'daily-collect', name: '海边拾遗', iconImg: 'assets/collectibles/tide-crown.webp',
      metric: 'collectibles', mode: 'sum', target: 2,
      desc: '今天从局内带回 2 件收藏品。',
      reward: { credits: 300, mats: { fiber: 3, chip: 1 } }
    },
    {
      id: 'daily-cut', name: '精准切口', iconImg: 'assets/real/workshop.webp',
      metric: 'cutCuts', mode: 'max', target: 4,
      desc: '单局沉船切割完成 4 个精准切口。',
      reward: { credits: 320, mats: { glass: 3, copper: 1 } }
    },
    {
      id: 'daily-sort', name: '分拣快手', iconImg: 'assets/real/storage.webp',
      metric: 'sortCorrect', mode: 'max', target: 8,
      desc: '单局分拣传送带正确分拣 8 件。',
      reward: { credits: 330, mats: { chip: 2, glass: 2 } }
    },
    {
      id: 'daily-beacon', name: '信号复现', iconImg: 'assets/real/core.webp',
      metric: 'beaconRounds', mode: 'max', target: 2,
      desc: '单局灯塔信号复现 2 组。',
      reward: { credits: 330, mats: { copper: 2, chip: 2 } }
    }
  ]);

  var ACHIEVEMENTS = (CW.ACHIEVEMENTS = [
    {
      id: 'first-run', name: '第一次下潜', iconImg: 'assets/real/hook.webp',
      metric: 'runs', target: 1, desc: '完成第一次打捞。',
      reward: { credits: 120, mats: { metal: 2 } }
    },
    {
      id: 'ten-runs', name: '十次出航', iconImg: 'assets/real/storage.webp',
      metric: 'runs', target: 10, desc: '累计完成 10 次打捞。',
      reward: { credits: 320, mats: { fuel: 3 } }
    },
    {
      id: 'combo-nine', name: '九层连击', iconImg: 'assets/real/hook.webp',
      metric: 'bestCombo', target: 9, desc: '单局抓钩达到 9 层连击。',
      reward: { credits: 420, mats: { chip: 2 } }
    },
    {
      id: 'match-2500', name: '分拣大师', iconImg: 'assets/real/puzzle.webp',
      metric: 'matchScore', target: 2500, desc: '单局废料拼图达到 2,500 分。',
      reward: { credits: 420, mats: { fiber: 3 } }
    },
    {
      id: 'sonar-perfect', name: '全图回收', iconImg: 'assets/real/sonar.webp',
      metric: 'sonarPerfect', target: 1, desc: '完成一次全部 4 货箱的声呐扫掠。',
      reward: { credits: 360, mats: { chip: 2 } }
    },
    {
      id: 'filter-three', name: '净水收藏', iconImg: 'assets/seawater-filter-icon.webp',
      metric: 'filtersFound', target: 3, desc: '累计获得 3 台海水过滤器。',
      reward: { credits: 500, mats: { fiber: 4 } }
    },
    {
      id: 'archive-ten', name: '沉船档案', iconImg: 'assets/collectibles/tide-crown.webp',
      metric: 'collectiblesFound', target: 10, desc: '累计带回 10 件收藏品。',
      reward: { credits: 460, mats: { chip: 2 } }
    },
    {
      id: 'streak-seven', name: '一周潮汐', iconImg: 'assets/real/sonar.webp',
      metric: 'dailyStreak', target: 7, desc: '连续领取 7 天每日潮汐奖励。',
      reward: { credits: 520, mats: { fuel: 4 } }
    },
    {
      id: 'safe-twenty', name: '保险箱猎人', iconImg: 'assets/real/safe.webp',
      metric: 'safeTotal', target: 20, desc: '累计抓回 20 个保险箱。',
      reward: { credits: 480, mats: { metal: 6, fiber: 3 } }
    },
    {
      id: 'level-ten', name: '海岸据点', iconImg: 'assets/real/workshop.webp',
      metric: 'level', target: 10, desc: '把避难所升到 Lv.10。',
      reward: { credits: 800, mats: { metal: 8, fuel: 6, fiber: 6, chip: 4 } }
    },
    {
      id: 'cut-first', name: '第一道切口', iconImg: 'assets/real/workshop.webp',
      metric: 'cutRuns', target: 1, desc: '完成一次沉船切割。',
      reward: { credits: 200, mats: { glass: 2, copper: 1 } }
    },
    {
      id: 'sort-first', name: '流水线开张', iconImg: 'assets/real/storage.webp',
      metric: 'sortRuns', target: 1, desc: '完成一次分拣传送带。',
      reward: { credits: 200, mats: { chip: 1, glass: 1 } }
    },
    {
      id: 'beacon-first', name: '最后的灯塔', iconImg: 'assets/real/core.webp',
      metric: 'beaconRuns', target: 1, desc: '完成一次灯塔信号。',
      reward: { credits: 200, mats: { copper: 1, chip: 1 } }
    },
    {
      id: 'all-six', name: '六面手', iconImg: 'assets/real/sonar.webp',
      metric: 'missionsPlayed', target: 6, desc: '六种打捞任务都至少完成一次。',
      reward: { credits: 900, mats: { metal: 6, fuel: 4, fiber: 4, chip: 4, glass: 4, copper: 4 } }
    }
  ]);

  function achievementDef(achievementId) {
    for (var i = 0; i < ACHIEVEMENTS.length; i++) if (ACHIEVEMENTS[i].id === achievementId) return ACHIEVEMENTS[i];
    return null;
  }

  function dailyDef(dailyId) {
    for (var i = 0; i < DAILY_CHALLENGES.length; i++) if (DAILY_CHALLENGES[i].id === dailyId) return DAILY_CHALLENGES[i];
    return null;
  }

  function dayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function dayNumber(date) {
    var d = date || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  function parseDayKey(key) {
    var parts = String(key || '').split('-');
    if (parts.length !== 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function contractDef(contractId) {
    for (var i = 0; i < CONTRACTS.length; i++) if (CONTRACTS[i].id === contractId) return CONTRACTS[i];
    return null;
  }

  function makeContractSet() {
    var normal = [];
    var rare = [];
    for (var i = 0; i < CONTRACTS.length; i++) {
      if (CONTRACTS[i].rare) rare.push(CONTRACTS[i]);
      else normal.push(CONTRACTS[i]);
    }
    var out = [];
    if (rare.length && chance(0.22)) {
      var r = rare[(Math.random() * rare.length) | 0];
      out.push({ id: r.id, progress: 0, claimed: false });
    }
    while (out.length < 3 && normal.length) {
      var idx = (Math.random() * normal.length) | 0;
      var def = normal.splice(idx, 1)[0];
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
      materials: { metal: 0, fuel: 0, fiber: 0, chip: 0, glass: 0, copper: 0 },
      filters: 0,
      filterPity: 0,
      collectibles: {},
      equipped: [],
      contracts: makeContractSet(),
      contractRound: 1,
      contractRerollUsed: false,
      daily: null,
      dailyStreak: 0,
      lastDailyClaim: '',
      achievements: {},
      stats: {
        bestCombo: 0,
        sonarPerfect: 0,
        filtersFound: 0,
        collectiblesFound: 0,
        creditsEarned: 0,
        safeTotal: 0,
        goldTotal: 0,
        cutRuns: 0,
        sortRuns: 0,
        beaconRuns: 0
      },
      upgrades: { storage: 0, workshop: 0, sonar: 0, core: 0, purifier: 0 },
      best: { hook: 0, match: 0, sonar: 0, cut: 0, sort: 0, beacon: 0 },
      taskChain: 0,
      lastTask: '',
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
    data.equipped = [];
    if (Array.isArray(raw.equipped)) {
      for (var eq = 0; eq < raw.equipped.length && data.equipped.length < 3; eq++) {
        var eid = raw.equipped[eq];
        if (data.collectibles[eid] > 0 && data.equipped.indexOf(eid) < 0) data.equipped.push(eid);
      }
    }
    data.achievements = {};
    if (raw.achievements && typeof raw.achievements === 'object') {
      for (var aid in raw.achievements) {
        if (!Object.prototype.hasOwnProperty.call(raw.achievements, aid)) continue;
        if (achievementDef(aid) && raw.achievements[aid]) data.achievements[aid] = true;
      }
    }
    var collTotal = 0;
    for (var ck in data.collectibles) {
      if (Object.prototype.hasOwnProperty.call(data.collectibles, ck)) collTotal += data.collectibles[ck];
    }
    data.stats.bestCombo = Math.max(0, Math.floor(Number(raw.stats && raw.stats.bestCombo) || 0));
    data.stats.sonarPerfect = Math.max(0, Math.floor(Number(raw.stats && raw.stats.sonarPerfect) || 0));
    data.stats.filtersFound = Math.max(0, Math.floor(Number(raw.stats && raw.stats.filtersFound) || data.filters));
    data.stats.collectiblesFound = Math.max(0, Math.floor(Number(raw.stats && raw.stats.collectiblesFound) || collTotal));
    data.stats.creditsEarned = Math.max(0, Number(raw.stats && raw.stats.creditsEarned) || 0);
    data.stats.safeTotal = Math.max(0, Math.floor(Number(raw.stats && raw.stats.safeTotal) || 0));
    data.stats.goldTotal = Math.max(0, Math.floor(Number(raw.stats && raw.stats.goldTotal) || 0));
    data.stats.cutRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.cutRuns) || 0));
    data.stats.sortRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.sortRuns) || 0));
    data.stats.beaconRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.beaconRuns) || 0));
    data.contracts = normalizeContractSet(raw.contracts);
    data.contractRound = Math.max(1, Math.floor(Number(raw.contractRound) || 1));
    data.contractRerollUsed = !!raw.contractRerollUsed;
    data.dailyStreak = clamp(Math.floor(Number(raw.dailyStreak) || 0), 0, 999);
    data.lastDailyClaim = typeof raw.lastDailyClaim === 'string' ? raw.lastDailyClaim : '';
    if (raw.daily && typeof raw.daily === 'object') {
      var ddef = dailyDef(String(raw.daily.id || ''));
      if (ddef && raw.daily.date === dayKey()) {
        data.daily = {
          date: raw.daily.date,
          id: ddef.id,
          progress: clamp(Math.floor(Number(raw.daily.progress) || 0), 0, ddef.target),
          claimed: !!raw.daily.claimed
        };
      }
    }
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
      data.best.cut = Math.max(0, Number(raw.best.cut) || 0);
      data.best.sort = Math.max(0, Number(raw.best.sort) || 0);
      data.best.beacon = Math.max(0, Number(raw.best.beacon) || 0);
      data.taskChain = clamp(Math.floor(Number(raw.taskChain) || 0), 0, 6);
      data.lastTask = ['hook', 'match', 'sonar', 'cut', 'sort', 'beacon'].indexOf(raw.lastTask) >= 0 ? raw.lastTask : '';
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
    this.ensureDaily();
    this.state = 'title';
    this.tab = 'tasks';
    this.warehouseView = 'materials';
    this.shelterView = 'upgrades';
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
  Hub.prototype.capacity = function () { return 72 + (this.data.upgrades.storage || 0) * 30; };
  Hub.prototype.used = function () {
    var sum = 0;
    for (var i = 0; i < MATERIALS.length; i++) sum += this.data.materials[MATERIALS[i].id] || 0;
    return sum;
  };
  Hub.prototype.collectionRelicBonuses = function () {
    var out = { credit: 0, mat: 0, time: 0, moves: 0, probes: 0 };
    var list = this.data.equipped || [];
    for (var i = 0; i < list.length && i < 3; i++) {
      var id = list[i];
      if (!(this.data.collectibles[id] > 0)) continue;
      var relic = CW.COLLECTIBLE_RELICS[id];
      if (!relic) continue;
      out.credit += relic.bonus.credit || 0;
      out.mat += relic.bonus.mat || 0;
      out.time += relic.bonus.time || 0;
      out.moves += relic.bonus.moves || 0;
      out.probes += relic.bonus.probes || 0;
    }
    return out;
  };

  Hub.prototype.collectionEquip = function (id) {
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def || !((this.data.collectibles || {})[id] > 0)) return;
    if (!Array.isArray(this.data.equipped)) this.data.equipped = [];
    if (this.data.equipped.indexOf(id) >= 0) {
      this.collectionUnequip(id);
      return;
    }
    if (this.data.equipped.length >= 3) {
      this.audio.warn();
      this.showToast('ARCHIVE FULL', '藏品栏已满', '先卸下一件藏品再装备');
      return;
    }
    this.data.equipped.push(id);
    this.audio.craft();
    this.showToast('RELIC EQUIPPED', def.name, CW.COLLECTIBLE_RELICS[id] ? CW.COLLECTIBLE_RELICS[id].label : '已装备');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.collectionUnequip = function (id) {
    if (!Array.isArray(this.data.equipped)) return;
    var at = this.data.equipped.indexOf(id);
    if (at < 0) return;
    this.data.equipped.splice(at, 1);
    this.audio.click();
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.collectionCleanupEquipped = function () {
    if (!Array.isArray(this.data.equipped)) { this.data.equipped = []; return; }
    var out = [];
    for (var i = 0; i < this.data.equipped.length && out.length < 3; i++) {
      var id = this.data.equipped[i];
      if ((this.data.collectibles[id] || 0) > 0 && out.indexOf(id) < 0) out.push(id);
    }
    this.data.equipped = out;
  };

  Hub.prototype.creditMult = function () {
    var setBonus = this.collectionSetBonuses();
    var relic = this.collectionRelicBonuses();
    return 1 + (this.data.upgrades.workshop || 0) * 0.1 + (this.data.upgrades.purifier || 0) * 0.1 + setBonus.credit + relic.credit;
  };
  Hub.prototype.materialMult = function () {
    var setBonus = this.collectionSetBonuses();
    var relic = this.collectionRelicBonuses();
    return 1 + (this.data.upgrades.sonar || 0) * 0.12 + (this.data.upgrades.purifier || 0) * 0.05 + setBonus.mat + relic.mat;
  };
  Hub.prototype.hookTime = function () { return 60 + (this.data.upgrades.core || 0) * 5 + this.collectionRelicBonuses().time; };
  Hub.prototype.matchMoves = function () { return 30 + (this.data.upgrades.core || 0) * 2 + this.collectionRelicBonuses().moves; };
  Hub.prototype.sonarProbes = function () { return 10 + Math.floor((this.data.upgrades.core || 0) / 2) + this.collectionRelicBonuses().probes; };
  Hub.prototype.dayNumber = function () { return 1281 + this.data.runs * 2; };

  /* ── resize / layout ─────────────────────────────────────── */
  Hub.prototype.resize = function () {
    this.w = Math.max(280, window.innerWidth);
    this.h = Math.max(280, window.innerHeight);
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var maxPixels = 2400000;
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
    this.audio.setScene('hub');
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
      // The hub backdrop is a slow, ambient scene. 30fps cuts canvas and
      // compositor work in half without changing the feel of the rain.
      this.hubAccum = (this.hubAccum || 0) + dt;
      if (this.hubAccum >= 1 / 30) {
        this.updateScene(this.hubAccum);
        this.renderScene();
        this.hubAccum = 0;
      }
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
    var warehouseTab = document.querySelector('.panel-tab[data-tab="warehouse"]');
    if (warehouseTab) warehouseTab.classList.toggle('has-ready', this.collectionCanCraftAny());
    var tasksTab = document.querySelector('.panel-tab[data-tab="tasks"]');
    if (tasksTab) tasksTab.classList.toggle('has-ready', this.dailyReady() || this.contractsReadyCount() > 0);
    var shelterTab = document.querySelector('.panel-tab[data-tab="shelter"]');
    if (shelterTab) shelterTab.classList.toggle('has-ready', this.achievementsReadyCount() > 0);
    if (this.tab === 'tasks') {
      this.dom.panelTitle.textContent = '打捞任务';
      this.dom.panelTag.textContent = MISSIONS.length + ' 个任务';
      this.dom.panelNote.textContent = '今日挑战与物资都会存进避难所';
    } else if (this.tab === 'contracts') {
      var contractReady = this.contractsReadyCount();
      this.dom.panelTitle.textContent = '打捞契约';
      this.dom.panelTag.textContent = '第 ' + Math.max(1, this.data.contractRound || 1) + ' 轮' + (contractReady ? ' · ' + contractReady + ' 可领' : '');
      this.dom.panelNote.textContent = '完成契约领取打捞币与补给';
    } else if (this.tab === 'warehouse') {
      this.dom.panelTitle.textContent = this.warehouseView === 'collection' ? '仓库 · 收藏' : '仓库 · 物资';
      if (this.warehouseView === 'collection') {
        this.dom.panelTag.textContent = this.collectionUnique() + ' / ' + CW.COLLECTIBLES.length;
        this.dom.panelNote.textContent = '装备 3 件藏品 / 分解 / 合成';
      } else {
        this.dom.panelTag.textContent = used + ' / ' + cap;
        this.dom.panelNote.textContent = '超出容量的物资会折算成打捞币';
      }
    } else {
      var achievementsReady = this.achievementsReadyCount();
      if (this.shelterView === 'log') {
        this.dom.panelTitle.textContent = '航海日志';
        this.dom.panelTag.textContent = this.achievementUnlocked() + ' / ' + ACHIEVEMENTS.length;
        this.dom.panelNote.textContent = achievementsReady ? achievementsReady + ' 项成就可领取' : '长期记录与一次性里程碑';
      } else {
        this.dom.panelTitle.textContent = '扩建疯狂号';
        this.dom.panelTag.textContent = 'Lv.' + this.level();
        this.dom.panelNote.textContent = '升级消耗打捞币与仓库材料';
      }
    }
  };

  /* ── panel rendering ─────────────────────────────────────── */
  Hub.prototype.renderPanel = function () {
    if (!this.dom.panelContent) return;
    var scroll = this.dom.panelContent.scrollTop;
    if (this.tab === 'tasks') this.renderTasks();
    else if (this.tab === 'contracts') this.renderContracts();
    else if (this.tab === 'warehouse') this.renderWarehouse();
    else this.renderShelter();
    this.dom.panelContent.scrollTop = scroll;
    this.updatePanelMeta();
  };

  Hub.prototype.renderDailyCard = function () {
    var daily = this.ensureDaily();
    var def = dailyDef(daily.id);
    if (!def) return '';
    var progress = Math.min(def.target, daily.progress || 0);
    var ready = !daily.claimed && progress >= def.target;
    var pct = clamp(progress / def.target, 0, 1);
    var streak = this.data.dailyStreak || 0;
    var reward = def.reward;
    var mats = [];
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      var amount = reward.mats && reward.mats[m.id];
      if (amount) mats.push('<span><img src="' + m.iconImg + '" alt="">' + m.name + ' +' + amount + '</span>');
    }
    var stateText = daily.claimed ? '今日已领取' : ready ? '可领取' : '进行中';
    return '<article class="daily-card' + (ready ? ' ready' : '') + (daily.claimed ? ' claimed' : '') + '">' +
      '<div class="daily-top"><span>DAILY TIDE · 今日潮汐</span><em>连续 ' + streak + ' 天</em></div>' +
      '<div class="daily-main">' +
        '<div class="daily-icon"><img src="' + def.iconImg + '" alt=""></div>' +
        '<div class="daily-copy"><b>' + def.name + '</b><p>' + def.desc + '</p></div>' +
      '</div>' +
      '<div class="daily-progress"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
      '<div class="daily-foot">' +
        '<span class="daily-count">' + progress + ' / ' + def.target + ' · ' + stateText + '</span>' +
        '<div class="daily-rewards"><span class="daily-credit">打捞币 +' + reward.credits + '</span>' + mats.join('') + '</div>' +
      '</div>' +
      '<button class="daily-claim' + (ready ? ' ready' : '') + '" data-action="claim-daily"' + (ready ? '' : ' disabled') + '>' +
        (daily.claimed ? '今日已完成' : ready ? '领取今日奖励' : '继续打捞') +
      '</button>' +
    '</article>';
  };

  Hub.prototype.renderTaskChain = function () {
    var chain = clamp(Math.floor(Number(this.data.taskChain) || 0), 0, 6);
    var msg;
    if (chain >= 6) msg = '环线全开 · 换任务仍保持 +20% 打捞币';
    else if (chain >= 3) msg = '再换 ' + (6 - chain) + ' 种任务到达 +20% · 重复同一任务会重置';
    else msg = '再换 ' + (3 - chain) + ' 种不同任务到达 +10% · 重复同一任务会重置';
    var pips = '';
    for (var i = 0; i < 6; i++) pips += '<i class="' + (i < chain ? 'on' : '') + '"></i>';
    return '<div class="chain-card"><div class="chain-head"><span>ROUTE LINK · 环线连携</span><b>' + chain + ' / 6</b></div>' +
      '<p>' + msg + '</p><div class="chain-pips">' + pips + '</div></div>';
  };

  Hub.prototype.renderTasks = function () {
    var html = this.renderDailyCard() + this.renderTaskChain() + '<div class="mission-list">';
    for (var i = 0; i < MISSIONS.length; i++) {
      var m = MISSIONS[i];
      var best = this.data.best[m.id] || 0;
      var tags = m.tags.slice();
      if (m.id === 'hook' || m.stat === 'time') tags[0] = this.hookTime() + ' 秒';
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
      case 'glass': return Math.max(0, Number(result.materials && result.materials.glass) || 0);
      case 'copper': return Math.max(0, Number(result.materials && result.materials.copper) || 0);
      case 'cutCuts': return Math.max(0, Number(result.cuts) || 0);
      case 'sortCorrect': return Math.max(0, Number(result.correct) || 0);
      case 'beaconRounds': return Math.max(0, Number(result.rounds) || 0);
      case 'sonarFinds': return Math.max(0, Number(result.found) || 0);
      case 'sonarPerfect': return result.type === 'sonar' && Number(result.found || 0) >= 4 ? 1 : 0;
      case 'stormRun': {
        var cid = String(result.condition || '');
        return cid.indexOf('storm') >= 0 || cid.indexOf('redtide') >= 0 ? 1 : 0;
      }
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

  Hub.prototype.ensureDaily = function () {
    var today = dayKey();
    if (!this.data.daily || this.data.daily.date !== today) {
      var def = DAILY_CHALLENGES[mod(dayNumber(), DAILY_CHALLENGES.length)];
      this.data.daily = { date: today, id: def.id, progress: 0, claimed: false };
    }
    return this.data.daily;
  };

  Hub.prototype.dailyReady = function () {
    var daily = this.ensureDaily();
    var def = dailyDef(daily.id);
    return !!(def && !daily.claimed && daily.progress >= def.target);
  };

  Hub.prototype.dailyValue = function (def, result) {
    switch (def.metric) {
      case 'safe': return Math.max(0, Number(result.safeCount) || 0);
      case 'bestCombo': return Math.max(0, Number(result.bestCombo) || 0);
      case 'matchScore': return result.type === 'match' ? Math.max(0, Number(result.score) || 0) : 0;
      case 'sonarFinds': return Math.max(0, Number(result.found) || 0);
      case 'runs': return 1;
      case 'cutCuts': return Math.max(0, Number(result.cuts) || 0);
      case 'sortCorrect': return Math.max(0, Number(result.correct) || 0);
      case 'beaconRounds': return Math.max(0, Number(result.rounds) || 0);
      case 'collectibles': return Array.isArray(result.collectibles) ? result.collectibles.length : 0;
      default: return 0;
    }
  };

  Hub.prototype.applyDailyProgress = function (result) {
    var daily = this.ensureDaily();
    if (daily.claimed) return;
    var def = dailyDef(daily.id);
    if (!def) return;
    var value = this.dailyValue(def, result);
    if (def.mode === 'max') daily.progress = Math.max(daily.progress || 0, value);
    else daily.progress = Math.min(def.target, (daily.progress || 0) + value);
  };

  Hub.prototype.claimDaily = function () {
    var daily = this.ensureDaily();
    var def = dailyDef(daily.id);
    if (!def || daily.claimed || daily.progress < def.target) return;
    daily.claimed = true;
    var today = dayKey();
    var last = this.data.lastDailyClaim;
    var streak = this.data.dailyStreak || 0;
    if (last) {
      var diff = dayNumber() - dayNumber(parseDayKey(last));
      if (diff === 1) streak += 1;
      else if (diff <= 0) streak = Math.max(1, streak);
      else streak = 1;
    } else {
      streak = 1;
    }
    var bonus = Math.min(3, Math.max(0, streak - 1)) * 40;
    this.data.dailyStreak = streak;
    this.data.lastDailyClaim = today;
    var reward = this.grantContractReward({
      credits: (def.reward.credits || 0) + bonus,
      mats: def.reward.mats || {}
    });
    this.audio.claim();
    this.showToast('DAILY TIDE', '连续 ' + streak + ' 天 · ' + def.name, '+' + fmt(reward.credits) + ' 打捞币' + (reward.overflow ? ' · 仓库溢出已折算' : ''));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
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
    this.audio.claim();
    var allClaimed = true;
    for (var i = 0; i < this.data.contracts.length; i++) {
      if (!this.data.contracts[i].claimed) { allClaimed = false; break; }
    }
    if (allClaimed) {
      var clearBonus = this.grantContractReward({ credits: 120, mats: { metal: 4, fiber: 2 } });
      this.data.contracts = makeContractSet();
      this.data.contractRound = Math.max(1, this.data.contractRound || 1) + 1;
      this.data.contractRerollUsed = false;
      this.showToast('CONTRACT ROUND', '第 ' + this.data.contractRound + ' 轮契约', '全清额外 +' + fmt(clearBonus.credits) + ' 打捞币 · 新目标已刷新');
    } else {
      this.showToast('CONTRACT CLAIMED', def.name, '+' + fmt(reward.credits) + ' 打捞币' + (reward.overflow ? ' · 仓库溢出已折算' : ''));
    }
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.rerollContracts = function () {
    if (this.data.contractRerollUsed) return;
    if ((this.data.credits || 0) < 80) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '刷新需要 80 打捞币', '再捞一趟再来换目标');
      return;
    }
    this.data.credits -= 80;
    var kept = [];
    for (var i = 0; i < this.data.contracts.length; i++) {
      if (this.data.contracts[i] && this.data.contracts[i].claimed) kept.push(this.data.contracts[i]);
    }
    var fresh = makeContractSet();
    var chosen = {};
    var out = [];
    for (var k = 0; k < kept.length; k++) {
      out.push(kept[k]);
      chosen[kept[k].id] = true;
    }
    for (var f = 0; f < fresh.length && out.length < 3; f++) {
      if (chosen[fresh[f].id]) continue;
      out.push(fresh[f]);
      chosen[fresh[f].id] = true;
    }
    var guard = 0;
    while (out.length < 3 && guard++ < 30) {
      var extra = makeContractSet();
      for (var e = 0; e < extra.length && out.length < 3; e++) {
        if (chosen[extra[e].id]) continue;
        out.push(extra[e]);
        chosen[extra[e].id] = true;
      }
    }
    this.data.contracts = out;
    this.data.contractRerollUsed = true;
    this.audio.buy();
    this.showToast('CONTRACTS REROLLED', '契约已刷新', '已领取的契约保留 · 本轮不能再刷新');
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

  Hub.prototype.collectionSetOwned = function (set) {
    var n = 0;
    var map = this.data.collectibles || {};
    for (var i = 0; i < set.items.length; i++) if ((map[set.items[i]] || 0) > 0) n++;
    return n;
  };

  Hub.prototype.collectionSetActive = function (set) {
    return this.collectionSetOwned(set) >= set.items.length;
  };

  Hub.prototype.collectionSetBonuses = function () {
    var out = { credit: 0, mat: 0, active: 0 };
    for (var i = 0; i < CW.COLLECTION_SETS.length; i++) {
      var set = CW.COLLECTION_SETS[i];
      if (!this.collectionSetActive(set)) continue;
      out.active += 1;
      out.credit += set.bonus.credit || 0;
      out.mat += set.bonus.mat || 0;
    }
    return out;
  };

  Hub.prototype.registerCollectibles = function (result) {
    if (!this.data.collectibles) this.data.collectibles = {};
    var out = [];
    if (!Array.isArray(result.collectibles)) return out;
    for (var i = 0; i < result.collectibles.length; i++) {
      var id = result.collectibles[i];
      var def = CW.COLLECTIBLE_MAP[id];
      if (!def) continue;
      this.data.collectibles[id] = (this.data.collectibles[id] || 0) + 1;
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

  Hub.prototype.dismantle = function (id) {
    if (!this.data.collectibles) this.data.collectibles = {};
    var def = CW.COLLECTIBLE_MAP[id];
    var count = this.data.collectibles[id] || 0;
    if (!def || count < 1) return;
    var yieldMats = CW.DISMANTLE_YIELDS[def.rarity] || {};
    this.data.collectibles[id] -= 1;
    if (this.data.collectibles[id] <= 0) delete this.data.collectibles[id];
    var gained = this.grantContractReward({ credits: 0, mats: yieldMats });
    this.collectionCleanupEquipped();
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    this.audio.dismantle();
    this.showToast('COLLECTION DISMANTLED', def.name, '分解为材料' + (gained.overflow ? ' · 仓库溢出已折算' : ''));
  };

  Hub.prototype.warehouseSwitch = function () {
    return '<div class="warehouse-switch">' +
      '<button class="' + (this.warehouseView === 'materials' ? 'active' : '') + '" data-action="warehouse-view" data-view="materials">物资</button>' +
      '<button class="' + (this.warehouseView === 'collection' ? 'active' : '') + '" data-action="warehouse-view" data-view="collection">收藏</button>' +
    '</div>';
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
    var equippedNow = Array.isArray(this.data.equipped) ? this.data.equipped : [];
    source.sort(function (a, b) {
      var ae = equippedNow.indexOf(a.id) >= 0 ? 1 : 0;
      var be = equippedNow.indexOf(b.id) >= 0 ? 1 : 0;
      if (ae !== be) return ae - be;
      return b.count - a.count;
    });
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
    this.collectionCleanupEquipped();
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    this.audio.craft();
    var rarity = CW.COLLECTIBLE_RARITY_MAP[result.rarity];
    this.showToast('COLLECTION CRAFTED', result.name, '合成消耗 3 件 · ' + rarity.name + '级收藏');
  };

  Hub.prototype.renderContracts = function () {
    var round = Math.max(1, this.data.contractRound || 1);
    var ready = this.contractsReadyCount();
    var rerollUsed = !!this.data.contractRerollUsed;
    var canReroll = !rerollUsed && (this.data.credits || 0) >= 80;
    var html = '<div class="contract-intro">' +
      '<span class="contract-kicker">CONTRACT BOARD · 第 ' + round + ' 轮</span>' +
      '<p>完成打捞目标领取额外补给。三项全部领取后自动刷新下一轮，不需要等待时间。</p>' +
      '<div class="contract-intro-foot"><span class="contract-count">' + (ready ? ready + ' 项可领取' : '进行中') + '</span>' +
        '<button class="contract-reroll" data-action="reroll-contracts"' + (canReroll ? '' : ' disabled') + '>' +
          (rerollUsed ? '本轮已刷新' : '刷新悬赏 · 80') +
        '</button>' +
      '</div>' +
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
      html += '<article class="contract-card' + (def.rare ? ' rare' : '') + (isReady ? ' ready' : '') + (c.claimed ? ' claimed' : '') + '">' +
        '<div class="contract-icon"><img src="' + def.iconImg + '" alt=""></div>' +
        '<div class="contract-body">' +
          '<div class="contract-title"><b>' + def.name + (def.rare ? ' <em class="contract-rare">稀有</em>' : '') + '</b><span>' + progress + ' / ' + def.target + '</span></div>' +
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
    var equipped = Array.isArray(this.data.equipped) ? this.data.equipped : [];
    var relic = this.collectionRelicBonuses();
    var bonusParts = [];
    if (relic.credit) bonusParts.push('打捞币 +' + Math.round(relic.credit * 100) + '%');
    if (relic.mat) bonusParts.push('物资 +' + Math.round(relic.mat * 100) + '%');
    if (relic.time) bonusParts.push('抓钩 +' + relic.time + ' 秒');
    if (relic.moves) bonusParts.push('三消 +' + relic.moves + ' 步');
    if (relic.probes) bonusParts.push('声呐 +' + relic.probes + ' 次');
    var relicHtml = '<div class="relic-board"><div class="relic-head"><span>藏品栏 · 3 格</span><small>装备后本局生效</small></div><div class="relic-slots">';
    for (var rs = 0; rs < 3; rs++) {
      var rid = equipped[rs];
      var rdef = rid ? CW.COLLECTIBLE_MAP[rid] : null;
      if (rdef) {
        var rpower = CW.COLLECTIBLE_RELICS[rid];
        relicHtml += '<button class="relic-slot filled" data-action="equip-collectible" data-id="' + rid + '" title="点击卸下">' +
          '<img src="' + rdef.icon + '" alt=""><b>' + rdef.name + '</b><span>' + (rpower ? rpower.label : '') + '</span>' +
        '</button>';
      } else {
        relicHtml += '<div class="relic-slot empty"><b>+</b><span>空槽</span></div>';
      }
    }
    relicHtml += '</div><div class="relic-bonus">' +
      (bonusParts.length ? '本局加成 · ' + bonusParts.join(' · ') : '尚未装备藏品 · 在下方收藏卡点击「装备」') +
      '</div></div>';
    var html = this.warehouseSwitch() + '<div class="collection-summary">' +
      '<span class="collection-kicker">SUNKEN ARCHIVE · 沉船收藏</span>' +
      '<div class="collection-headline"><b>' + unique + ' / ' + CW.COLLECTIBLES.length + '</b><span>已发现 · 共 ' + total + ' 件</span></div>' +
      '<p>收藏品不占仓库容量，会在局内作为普通掉落出现。装备最多 3 件可激活本局加成，重复件还能分解或合成更高稀有度。</p>' +
      '</div>' + relicHtml + '<div class="craft-board">' +
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
    html += '<div class="set-board"><div class="set-head"><span>收藏套装</span><small>集齐整套获得永久加成</small></div><div class="set-list">';
    for (var si = 0; si < CW.COLLECTION_SETS.length; si++) {
      var set = CW.COLLECTION_SETS[si];
      var owned = this.collectionSetOwned(set);
      var active = owned >= set.items.length;
      var icons = '';
      for (var ii = 0; ii < set.items.length; ii++) {
        var setItem = CW.COLLECTIBLE_MAP[set.items[ii]];
        icons += '<img class="' + ((map[setItem.id] || 0) > 0 ? '' : 'missing') + '" src="' + setItem.icon + '" alt="" title="' + setItem.name + '">';
      }
      html += '<div class="set-card' + (active ? ' active' : '') + '" style="--set-color:' + set.color + '">' +
        '<div class="set-icons">' + icons + '</div>' +
        '<div class="set-copy"><b>' + set.name + '</b><span>' + set.desc + '</span></div>' +
        '<div class="set-status"><b>' + owned + ' / ' + set.items.length + '</b><em>' + set.bonusText + '</em></div>' +
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
        var isEquipped = equipped.indexOf(item.id) >= 0;
        var relicInfo = CW.COLLECTIBLE_RELICS[item.id];
        html += '<article class="collectible-card' + (n ? '' : ' unknown') + (isEquipped ? ' equipped' : '') + '" title="' + item.desc + (relicInfo ? ' · ' + relicInfo.label : '') + '" style="--rarity:' + rarity.color + '">' +
          '<span class="collectible-art"><img src="' + item.icon + '" alt=""></span>' +
          '<span class="collectible-copy"><b>' + item.name + '</b><em>' + (n ? '×' + n : '未发现') + '</em>' +
            (n && relicInfo ? '<span class="collectible-power">' + relicInfo.label + '</span>' : '') + '</span>' +
          (n ? '<span class="collectible-actions">' +
            '<button class="collectible-equip' + (isEquipped ? ' active' : '') + '" data-action="equip-collectible" data-id="' + item.id + '">' + (isEquipped ? '卸下' : '装备') + '</button>' +
            '<button class="collectible-dismantle" data-action="dismantle" data-id="' + item.id + '" title="分解 1 件为材料">分解</button>' +
          '</span>' : '') +
        '</article>';
      }
      html += '</div></section>';
    }
    html += '<p class="collection-note">打捞结算时按表现提高收藏掉落率；史诗与传说也可以由低级收藏逐级合成。</p>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.renderWarehouse = function () {
    if (this.warehouseView === 'collection') { this.renderCollection(); return; }
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
    var html = this.warehouseSwitch() + '<div class="capacity-card">' +
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

  Hub.prototype.shelterSwitch = function () {
    return '<div class="warehouse-switch shelter-switch">' +
      '<button class="' + (this.shelterView === 'upgrades' ? 'active' : '') + '" data-action="shelter-view" data-view="upgrades">扩建</button>' +
      '<button class="' + (this.shelterView === 'log' ? 'active' : '') + '" data-action="shelter-view" data-view="log">航海日志</button>' +
    '</div>';
  };

  Hub.prototype.achievementValue = function (def) {
    switch (def.metric) {
      case 'runs': return this.data.runs || 0;
      case 'bestCombo': return this.data.stats.bestCombo || 0;
      case 'matchScore': return this.data.best.match || 0;
      case 'sonarPerfect': return this.data.stats.sonarPerfect || 0;
      case 'filtersFound': return this.data.stats.filtersFound || 0;
      case 'collectiblesFound': return this.data.stats.collectiblesFound || 0;
      case 'dailyStreak': return this.data.dailyStreak || 0;
      case 'safeTotal': return this.data.stats.safeTotal || 0;
      case 'cutRuns': return this.data.stats.cutRuns || 0;
      case 'sortRuns': return this.data.stats.sortRuns || 0;
      case 'beaconRuns': return this.data.stats.beaconRuns || 0;
      case 'missionsPlayed': {
        var n = 0;
        if ((this.data.best.hook || 0) > 0) n++;
        if ((this.data.best.match || 0) > 0) n++;
        if ((this.data.best.sonar || 0) > 0) n++;
        if ((this.data.stats.cutRuns || 0) > 0) n++;
        if ((this.data.stats.sortRuns || 0) > 0) n++;
        if ((this.data.stats.beaconRuns || 0) > 0) n++;
        return n;
      }
      case 'level': return this.level();
      default: return 0;
    }
  };

  Hub.prototype.achievementUnlocked = function () {
    var n = 0;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) if (this.data.achievements[ACHIEVEMENTS[i].id]) n++;
    return n;
  };

  Hub.prototype.achievementsReadyCount = function () {
    var n = 0;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var def = ACHIEVEMENTS[i];
      if (!this.data.achievements[def.id] && this.achievementValue(def) >= def.target) n++;
    }
    return n;
  };

  Hub.prototype.claimAchievement = function (achievementId) {
    var def = achievementDef(achievementId);
    if (!def || this.data.achievements[def.id]) return;
    if (this.achievementValue(def) < def.target) return;
    this.data.achievements[def.id] = true;
    var reward = this.grantContractReward(def.reward);
    this.audio.claim();
    this.showToast('LOG ENTRY', def.name, '+' + fmt(reward.credits) + ' 打捞币' + (reward.overflow ? ' · 仓库溢出已折算' : ''));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.renderAchievements = function () {
    var ready = this.achievementsReadyCount();
    var unlocked = this.achievementUnlocked();
    var list = ACHIEVEMENTS.slice().sort(function (a, b) {
      var self = this;
      var ar = !self.data.achievements[a.id] && self.achievementValue(a) >= a.target ? 1 : 0;
      var br = !self.data.achievements[b.id] && self.achievementValue(b) >= b.target ? 1 : 0;
      if (ar !== br) return br - ar;
      var ac = self.data.achievements[a.id] ? 1 : 0;
      var bc = self.data.achievements[b.id] ? 1 : 0;
      return ac - bc;
    }.bind(this));
    var html = this.shelterSwitch() +
      '<div class="achievement-summary">' +
        '<span class="collection-kicker">SHIP\'S LOG · 航海日志</span>' +
        '<div class="collection-headline"><b>' + unlocked + ' / ' + ACHIEVEMENTS.length + '</b><span>已解锁' + (ready ? ' · ' + ready + ' 项可领' : '') + '</span></div>' +
        '<p>长期记录会自动累积，不需要重复刷取；每个里程碑只能领取一次。</p>' +
      '</div>' +
      '<div class="achievement-stats">' +
        '<span><b>' + this.data.stats.bestCombo + '</b>最高连击</span>' +
        '<span><b>' + this.data.stats.sonarPerfect + '</b>声呐全图</span>' +
        '<span><b>' + this.data.stats.collectiblesFound + '</b>累计收藏</span>' +
      '</div>' +
      '<div class="achievement-list">';
    for (var i = 0; i < list.length; i++) {
      var def = list[i];
      var claimed = !!this.data.achievements[def.id];
      var value = this.achievementValue(def);
      var progress = Math.min(def.target, value);
      var isReady = !claimed && progress >= def.target;
      var pct = clamp(progress / def.target, 0, 1);
      var mats = [];
      for (var m = 0; m < MATERIALS.length; m++) {
        var mat = MATERIALS[m];
        var amount = def.reward.mats && def.reward.mats[mat.id];
        if (amount) mats.push('<span><img src="' + mat.iconImg + '" alt="">' + mat.name + ' +' + amount + '</span>');
      }
      html += '<article class="achievement-card' + (isReady ? ' ready' : '') + (claimed ? ' claimed' : '') + '">' +
        '<span class="achievement-icon"><img src="' + def.iconImg + '" alt=""></span>' +
        '<div class="achievement-copy">' +
          '<div class="achievement-title"><b>' + def.name + '</b><em>' + progress + ' / ' + def.target + '</em></div>' +
          '<p>' + def.desc + '</p>' +
          '<div class="achievement-track"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
          '<div class="achievement-reward"><span>打捞币 +' + def.reward.credits + '</span>' + mats.join('') + '</div>' +
        '</div>' +
        '<button class="achievement-claim' + (isReady ? ' ready' : '') + '" data-action="claim-achievement" data-id="' + def.id + '"' + (isReady ? '' : ' disabled') + '>' +
          (claimed ? '已领取' : isReady ? '领取' : '未达成') +
        '</button>' +
      '</article>';
    }
    html += '</div>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.renderShelter = function () {
    if (this.shelterView === 'log') { this.renderAchievements(); return; }
    var lvl = this.level();
    var html = this.shelterSwitch() + '<div class="shelter-head"><span>避难所等级</span><b>Lv.' + lvl + '</b></div><div class="upgrade-list">';
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
    var taskType = result.type || 'hook';
    var chain = taskType !== this.data.lastTask ? Math.min(6, (this.data.taskChain || 0) + 1) : 1;
    this.data.taskChain = chain;
    this.data.lastTask = taskType;
    var chainMult = chain >= 6 ? 1.2 : chain >= 3 ? 1.1 : 1;
    var cap = this.capacity();
    var used = this.used();
    var storeSpace = Math.max(0, cap - used);
    var creditGain = Math.round((result.credits || 0) * this.creditMult());
    var chainBonus = Math.round(creditGain * (chainMult - 1));
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
    this.data.credits += creditGain + overflowCredits + chainBonus;
    var filtersGained = Math.max(0, Math.floor(Number(result.filters) || 0));
    this.data.filters = (this.data.filters || 0) + filtersGained;
    if (filtersGained > 0) this.data.filterPity = 0;
    else this.data.filterPity = Math.min(7, (this.data.filterPity || 0) + 1);
    this.data.runs += 1;
    if (result.type === 'cut') this.data.stats.cutRuns = (this.data.stats.cutRuns || 0) + 1;
    else if (result.type === 'sort') this.data.stats.sortRuns = (this.data.stats.sortRuns || 0) + 1;
    else if (result.type === 'beacon') this.data.stats.beaconRuns = (this.data.stats.beaconRuns || 0) + 1;
    var key = ['hook', 'match', 'sonar', 'cut', 'sort', 'beacon'].indexOf(result.type) >= 0 ? result.type : 'hook';
    this.data.best[key] = Math.max(this.data.best[key] || 0, Math.round(result.score || 0));
    var collectibles = this.registerCollectibles(result);
    result.collectibles = collectibles;
    this.applyContractProgress(result);
    this.applyDailyProgress(result);
    var stats = this.data.stats;
    stats.bestCombo = Math.max(stats.bestCombo || 0, Math.floor(Number(result.bestCombo) || 0));
    stats.safeTotal = (stats.safeTotal || 0) + Math.max(0, Math.floor(Number(result.safeCount) || 0));
    stats.goldTotal = (stats.goldTotal || 0) + Math.max(0, Math.floor(Number(result.goldCount) || 0));
    stats.filtersFound = (stats.filtersFound || 0) + filtersGained;
    stats.collectiblesFound = (stats.collectiblesFound || 0) + collectibles.length;
    stats.creditsEarned = (stats.creditsEarned || 0) + creditGain + overflowCredits + chainBonus;
    if (result.type === 'sonar' && Number(result.found || 0) >= 4) stats.sonarPerfect = (stats.sonarPerfect || 0) + 1;
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    return {
      creditGain: creditGain,
      chain: chain,
      chainMult: chainMult,
      chainBonus: chainBonus,
      overflowCredits: overflowCredits,
      totalCredits: creditGain + overflowCredits + chainBonus,
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
    this.audio.tab();
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
        else if (action === 'reroll-contracts') self.rerollContracts();
        else if (action === 'claim-daily') self.claimDaily();
        else if (action === 'craft') self.craft(actionEl.getAttribute('data-rarity'));
        else if (action === 'claim-achievement') self.claimAchievement(actionEl.getAttribute('data-id'));
        else if (action === 'shelter-view') {
          self.shelterView = actionEl.getAttribute('data-view');
          self.audio.tab();
          self.renderPanel();
        }
        else if (action === 'warehouse-view') {
          self.warehouseView = actionEl.getAttribute('data-view');
          self.audio.click();
          self.renderPanel();
        } else if (action === 'equip-collectible') self.collectionEquip(actionEl.getAttribute('data-id'));
        else if (action === 'dismantle') self.dismantle(actionEl.getAttribute('data-id'));
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

  function bootHub() {
    var canvas = document.getElementById('scene');
    if (!canvas) return;
    var hub = new Hub(canvas);
    window.__cw = hub;
  }

  // Start the UI as soon as the DOM is ready. Large local photos / audio can
  // still be streaming, but the title, HUD and panels must not wait for `load`.
  if (document.readyState === 'complete') {
    bootHub();
  } else {
    document.addEventListener('DOMContentLoaded', bootHub, { once: true });
  }
})();

