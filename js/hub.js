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
      max: 7,
      shelter: [1, 1, 1, 1, 1, 2, 4],
      costs: [
        { credits: 120, metal: 8, fiber: 4 },
        { credits: 300, metal: 16, fiber: 9, glass: 4 },
        { credits: 750, metal: 26, fiber: 15, copper: 6 },
        { credits: 1800, metal: 40, fiber: 24, glass: 10, copper: 8 },
        { credits: 4200, metal: 60, fiber: 36, glass: 18, copper: 14 },
        { credits: 9000, metal: 70, fiber: 45, glass: 22, copper: 18 },
        { credits: 20000, metal: 100, fiber: 60, glass: 35, copper: 30, chip: 20, rarities: { rare: 2 } }
      ]
    },
    {
      id: 'workshop', name: '打捞工坊', icon: '工', iconImg: 'assets/real/workshop.webp', tone: '#9dffc7',
      desc: '所有打捞币收益 +10%',
      max: 7,
      shelter: [1, 1, 1, 1, 1, 2, 4],
      costs: [
        { credits: 180, metal: 6, chip: 2 },
        { credits: 450, metal: 12, chip: 5, copper: 4 },
        { credits: 1000, metal: 20, chip: 9, glass: 5 },
        { credits: 2200, metal: 32, chip: 15, glass: 8, copper: 10 },
        { credits: 4800, metal: 50, chip: 24, glass: 16, copper: 16 },
        { credits: 10000, metal: 65, chip: 30, glass: 20, copper: 22, rarities: { rare: 2 } },
        { credits: 24000, metal: 90, chip: 45, glass: 30, copper: 35, rarities: { epic: 1 } }
      ]
    },
    {
      id: 'sonar', name: '声呐阵列', icon: '声', iconImg: 'assets/real/sonar.webp', tone: '#79d8ff',
      desc: '所有物资收益 +12%',
      max: 6,
      shelter: [1, 1, 1, 1, 2, 4],
      costs: [
        { credits: 260, fuel: 6, chip: 3 },
        { credits: 650, fuel: 12, chip: 7, glass: 3 },
        { credits: 1500, fuel: 20, chip: 12, copper: 5 },
        { credits: 3400, fuel: 32, chip: 20, glass: 8, copper: 8 },
        { credits: 7000, fuel: 50, chip: 30, glass: 20, copper: 18, rarities: { rare: 2 } },
        { credits: 16000, fuel: 75, chip: 50, glass: 30, copper: 30, rarities: { epic: 1 } }
      ]
    },
    {
      id: 'core', name: '聚变核心', icon: '核', iconImg: 'assets/real/core.webp', tone: '#ff8a5c',
      desc: '抓钩 +5 秒 · 三消 +2 步',
      max: 5,
      shelter: [1, 1, 1, 3, 5],
      costs: [
        { credits: 600, metal: 10, fuel: 8, fiber: 8, chip: 6 },
        { credits: 1600, metal: 18, fuel: 15, fiber: 15, chip: 11, copper: 5 },
        { credits: 3800, metal: 30, fuel: 26, fiber: 26, chip: 20, glass: 6, copper: 8 },
        { credits: 8000, metal: 50, fuel: 40, fiber: 40, chip: 30, glass: 15, copper: 15, rarities: { epic: 1 } },
        { credits: 18000, metal: 80, fuel: 60, fiber: 60, chip: 45, glass: 25, copper: 25, rarities: { epic: 2 } }
      ]
    },
    {
      id: 'purifier', name: '净水舱', icon: '水', tone: '#79d8ff',
      desc: '打捞币收益 +10% · 物资收益 +5%',
      max: 5, iconImg: 'assets/seawater-filter-icon.webp',
      shelter: [1, 1, 1, 3, 5],
      costs: [
        { credits: 500, filters: 1, metal: 8, fiber: 6, chip: 4 },
        { credits: 1400, filters: 1, metal: 14, fiber: 10, chip: 8, glass: 5 },
        { credits: 3200, filters: 1, metal: 22, fiber: 16, chip: 12, glass: 10, copper: 6 },
        { credits: 7000, filters: 1, metal: 35, fiber: 25, chip: 20, glass: 20, copper: 12 },
        { credits: 16000, filters: 1, metal: 55, fiber: 40, chip: 35, glass: 35, copper: 25, rarities: { legendary: 1 } }
      ]
    },
    {
      id: 'eel', name: '电鳗发电机', icon: '鳗', tone: '#9feeff',
      desc: '抓钩 +2 秒 · 声呐 +1 次',
      max: 3, iconImg: 'assets/collectibles/unique/eel-generator.webp',
      shelter: [3, 4, 5],
      requires: { collectible: 'eel-generator' },
      costs: [
        { credits: 12000, metal: 45, fuel: 40, chip: 25, glass: 20, copper: 20, rarities: { rare: 1 } },
        { credits: 26000, metal: 70, fuel: 60, chip: 40, glass: 30, copper: 30, rarities: { epic: 1 } },
        { credits: 50000, metal: 100, fuel: 90, chip: 60, glass: 45, copper: 45, rarities: { epic: 2 } }
      ]
    },
    {
      id: 'cannon', name: '黄金大炮', icon: '炮', tone: '#ffd166',
      desc: '所有打捞币收益 +5%',
      max: 3, iconImg: 'assets/collectibles/unique/golden-cannon.webp',
      shelter: [4, 4, 5],
      requires: { collectible: 'golden-cannon' },
      costs: [
        { credits: 18000, metal: 60, fuel: 50, chip: 35, glass: 25, copper: 35, rarities: { epic: 1 } },
        { credits: 36000, metal: 85, fuel: 70, chip: 50, glass: 35, copper: 50, rarities: { epic: 1, legendary: 1 } },
        { credits: 70000, metal: 120, fuel: 100, chip: 70, glass: 50, copper: 70, rarities: { legendary: 2 } }
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
    },
    {
      id: 'trawl', name: '潮汐拖网', icon: '网', iconImg: 'assets/real/hook.webp', kicker: 'MISSION 07',
      desc: '把渔网放进潮沟，接住随潮水落下的鱼获与货箱。锈雷会炸掉时间，黄金鱼和珍珠能带来惊喜。',
      tags: ['45 秒', '拖网', '收藏'], stat: 'time', goal: '接住 30 件海货'
    },
    {
      id: 'dive', name: '深海潜航', icon: '潜', iconImg: 'assets/collectibles/diving-helmet.webp', kicker: 'MISSION 08',
      desc: '穿上旧潜水服，在断裂的沉船断面间穿行。漂过来的货箱会带回材料，遗物则可能进入收藏档案。',
      tags: ['45 秒', '潜航', '收藏'], stat: 'time', goal: '带回 30 件漂浮物'
    },
    {
      id: 'stack', name: '码头吊装', icon: '吊', iconImg: 'assets/real/storage.webp', kicker: 'MISSION 09',
      desc: '旧码头的吊臂还能用。看准摆动位置放下货箱，把六只箱子稳稳码上栈桥；偏太多会掉进海里。',
      tags: ['6 箱', '吊装', '保险箱'], stat: 'time', goal: '码好 6 只货箱'
    }
  ]);

  function normalizeMissionRotation(active, candidates) {
    var valid = {};
    for (var i = 0; i < MISSIONS.length; i++) valid[MISSIONS[i].id] = true;
    var a = [], c = [];
    function place(list, id) {
      if (!valid[id] || a.indexOf(id) >= 0 || c.indexOf(id) >= 0) return;
      if (list === a && a.length < 3) a.push(id);
      else c.push(id);
    }
    var ra = Array.isArray(active) ? active : [];
    var rc = Array.isArray(candidates) ? candidates : [];
    for (var ai = 0; ai < ra.length; ai++) place(a, ra[ai]);
    for (var ci = 0; ci < rc.length; ci++) place(c, rc[ci]);
    for (var mi = 0; mi < MISSIONS.length && a.length < 3; mi++) place(a, MISSIONS[mi].id);
    for (var mj = 0; mj < MISSIONS.length; mj++) place(c, MISSIONS[mj].id);
    return { active: a, candidates: c };
  }

  CW.MISSION_LORE = {
    hook: [
      '旧城区在第一次涨潮时被整体放弃。写字楼、码头和一座没来得及剪彩的商场沉进同一片浅海，只剩吊车臂露出水面，像一排不肯沉下去的问号。',
      '阿盐把抓钩固定在避难所左舷。每天退潮，他都会把钩子放进同一片水域，捞上来的东西从钢筋、油桶到保险箱，偶尔还有密封得很好的旧世界。',
      '老船员说，沉城抓钩最重要的不是手快，而是知道什么时候放绳。钩子只认方向，不认后悔。'
    ],
    match: [
      '废料拼图发生在沉船的反应堆控制室。洪水灌进来时，值班员把最后一批物资塞进格子柜，然后锁上门，让压力把整间屋子压成了一个巨大的废料盒。',
      '三消台其实是一块旧控制屏。玩家每交换一次方块，屏幕背后的机械臂就会把对应的废料拨进回收槽；四连和五连会触发当年留下的应急程序。',
      '控制室至今还有电。没有人知道电从哪来，但每次五连清屏时，天花板的应急灯都会闪一下。'
    ],
    sonar: [
      '声呐扫掠使用的是一台从旧海军监听站拆下来的控制台。它的屏幕有裂纹，按键缺了三个，但还能听见海底的回声。',
      '货箱被故意分散埋在 6×6 的海床格子里。旧世界的走私者用距离差来标记藏货点，后来这变成了一套只有回波能读懂的地图。',
      '深层货箱需要二次探测。老陈说那不是技术问题，是海床在提醒你：有些东西只捞一次是带不走的。'
    ],
    cut: [
      '沉船切割台原本是旧港的拆船车间。洪水之后，人们把搁浅的船壳拖上来，切开，取出还能用的玻璃、铜线和钢板。',
      '切割线进入安全区时下手最稳。切得太早会伤到材料，切得太晚船壳会回弹。每一次精准切口，都是和一块不肯认输的钢板讲道理。',
      '车间墙上还挂着旧安全标语：慢一点，但别停。'
    ],
    sort: [
      '分拣传送带来自旧码头的自动货运线。它原本负责把集装箱送进仓库，现在负责把混在一起的废料送回正确的材料箱。',
      '六种材料对应六个箱子。点错并不会爆炸，但传送带会扣掉三秒，像在提醒你：旧世界的秩序已经没了，新世界的秩序得自己分。',
      '传送带尽头有一盏黄灯，至今没有人走到过。'
    ],
    beacon: [
      '灯塔信号来自外海最后一座还亮着的灯塔。它的看守人早已不在，但灯组仍按固定顺序闪烁，像一段没有收件人的坐标。',
      '四座信号灯分别是潮、火、风、星。复现顺序就能让灯塔把最后的航海数据发回来；看错一次，它会重新播放，耐心得不像一台旧机器。',
      '阿岚相信灯塔里还有人在值班。她说每次复现正确，灯就会多亮半秒。'
    ],
    trawl: [
      '潮汐拖网是避难所最年轻的岗位。渔网用旧缆绳和防雨布缝成，网眼大得能漏掉小鱼，却刚好兜住随潮水冲下来的货箱。',
      '鱼汛来的时候，海面会先浮起一层银色。阿盐说那是鱼群在换气，也是提醒：网要放低一点，锈雷也会跟着上来。',
      '珍珠是拖网最不可靠的收获。它们不属于任何一艘沉船，像是海自己长出来的东西。'
    ],
    dive: [
      '深海潜航沿着一条断裂的沉船断面进行。船体被海流撕成几层，货箱、玻璃瓶和旧罗盘卡在钢梁之间，像一座倒挂的仓库。',
      '小满负责这条线路。她说潜航最重要的不是游得快，而是知道哪里可以停：停错地方，海流会把你推向更深的一层。',
      '漂浮物里偶尔会混着旧船员的遗物。它们不属于任何材料清单，只会安静地跟着气泡一起浮上来。'
    ],
    stack: [
      '码头吊装是避难所最像旧世界的工作。吊臂从沉船里拆来，钢缆换过三次，操作员只有老周一个。',
      '货箱在钩下会来回摆动。放得太早，箱子会砸在栈桥边缘；放得太晚，吊臂会把它甩进海里。六只箱子码稳，才算一趟完整的卸货。',
      '老周说，码货和带人一样：位置差一点没关系，重心不能偏。'
    ]
  };

  CW.CREW_LORE = {
    fisher: [
      '阿盐在旧港长大，父亲是最后一代拖网渔船船长。洪水之后，他靠一根改装的抓钩把整条街的邻居从屋顶上接下来。',
      '他不喜欢别人叫他英雄，只承认自己比别人更熟悉潮沟。每次出航前他都会检查绳结，检查三遍。'
    ],
    diver: [
      '小满曾是旧城潜水学校的学员。学校沉没那天，她穿着训练服游了六个小时，最后抱着一块船板漂到避难所。',
      '她能在水下待很久，也会在夜里听见沉船敲击。她说那不是鬼，是金属在冷缩，但从不主动解释自己为什么不再夜潜。'
    ],
    sonar: [
      '老陈是旧海军监听站的最后一名技术员。他独自在站里守了两年，直到天线被盐雾腐蚀，才带着声呐核心离开。',
      '他能从回波里分辨出货箱、鱼群和空船。偶尔他会说听见了鲸歌，但仪器上什么也没有。'
    ],
    navigator: [
      '阿岚是避难所里唯一还相信海图的人。她的图筒里装着七张手绘海图，每一张都标着不同的浅滩和“不要在同一天去两次”。',
      '她算出过一次完美的航线，带着全船避开了风暴。第二天，那条航线从海图上消失了。'
    ],
    captain: [
      '老周当过拆船工、渔船长和码头调度。他说话慢，走路更慢，但每次远征都能把人和货一起带回来。',
      '他的打捞绞盘上刻着所有没能返航的名字。他说这不是纪念，是提醒：船可以旧，人得回来。'
    ]
  };

  CW.UPGRADE_LORE = {
    storage: '仓库扩建是把旧集装箱焊在驳船两侧。每多一格空间，避难所就多一分像家的可能。',
    workshop: '打捞工坊由旧船机舱改造。扳手、焊枪和一台不肯报废的台钳，负责把所有捞回来的东西变成能用的东西。',
    sonar: '声呐阵列最初只是监听站的一根天线。后来它长成了整座避难所的耳朵，替所有人听海底的回声。',
    core: '聚变核心是避难所的心脏。它不发光的时候像一块废铁，亮起来的时候整条船都会安静。',
    purifier: '净水舱是避难所最干净的房间。海水从一侧进来，盐和铁锈留在滤芯里，清水从另一侧流进每个人的杯子。',
  eel: '电鳗发电机被安置在船尾的铜壳里。电鳗游动时，整条船的灯会跟着明灭，像一颗缓慢呼吸的心脏。',
  cannon: '黄金大炮架在船首，炮口朝向没有海图的海域。它从不开火，只在发现新的打捞点时鸣响，提醒所有人：又往前走了一点。'
  };

  var MISSION_GRADES = (CW.MISSION_GRADES = {
    hook: { S: 1100, A: 750, B: 400 },
    match: { S: 2400, A: 1600, B: 800 },
    sonar: { S: 520, A: 380, B: 220 },
    cut: { S: 800, A: 550, B: 300 },
    sort: { S: 1050, A: 750, B: 400 },
    beacon: { S: 560, A: 400, B: 250 },
    trawl: { S: 1700, A: 1100, B: 600 },
    dive: { S: 1500, A: 950, B: 500 },
    stack: { S: 1200, A: 800, B: 420 }
  });
  var GRADE_RANK = { C: 0, B: 1, A: 2, S: 3 };
  var AUCTION_PRICES = { common: 180, uncommon: 450, rare: 1100, epic: 2600, legendary: 6000 };
  var MARKET_TICK_MS = 20000;
  var MARKET_URGENT_TICKS = 3;
  var MARKET_FEE_BUY = 0.05;
  var MARKET_FEE_SELL = 0.05;
  var MARKET_FEE_AUCTION = 0.08;
  var MARKET_FEE_LIST = 0.04;
  var MARKET_MATERIAL_BASE = { metal: 32, fuel: 44, fiber: 28, chip: 62, glass: 50, copper: 56 };
  var MARKET_COLLECTIBLE_BASE = { common: 260, uncommon: 680, rare: 1700, epic: 4000, legendary: 9500 };

  function marketHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function marketTick(now) { return Math.floor((now || Date.now()) / MARKET_TICK_MS); }
  function marketMultiplier(id, tick) {
    var h = marketHash(id) % 997;
    var wave = Math.sin(tick * 1.37 + h * 0.013) * 0.36;
    var slow = Math.sin(tick * 0.41 + h * 0.031) * 0.20;
    var jitter = (Math.sin(tick * 12.9898 + h * 0.17) * 43758.5453) % 1;
    return clamp(1 + wave + slow + jitter * 0.16, 0.7, 1.9);
  }

  function gradeFor(type, score) {
    var lines = MISSION_GRADES[type] || MISSION_GRADES.hook;
    score = Math.max(0, Number(score) || 0);
    if (score >= lines.S) return 'S';
    if (score >= lines.A) return 'A';
    if (score >= lines.B) return 'B';
    return 'C';
  }

  function gradeRank(grade) { return GRADE_RANK[grade] || 0; }

  var CREW = (CW.CREW = [
    {
      id: 'fisher', name: '阿盐', role: '老渔夫', iconImg: 'assets/real/hook.webp',
      duration: 180, cost: 250, desc: '熟悉旧城区的潮沟，带回归废铁和纤维。',
      credits: [180, 320], mats: { metal: [3, 6], fiber: [2, 4] }, collectibleChance: 0,
      gearName: '潮汐钩', gearCosts: [
        { credits: 500, metal: 6, fiber: 4 },
        { credits: 1600, metal: 14, fiber: 10, copper: 5 },
        { credits: 4000, metal: 24, fiber: 18, copper: 10 }
      ]
    },
    {
      id: 'diver', name: '小满', role: '潜水员', iconImg: 'assets/collectibles/diving-helmet.webp',
      duration: 480, cost: 700, desc: '能在沉船里待很久，专挑玻璃、铜线和旧收藏。',
      credits: [80, 160], mats: { glass: [3, 6], copper: [2, 4], chip: [1, 2] }, collectibleChance: 0.45,
      gearName: '深潜服', gearCosts: [
        { credits: 800, glass: 8, copper: 5 },
        { credits: 2200, glass: 16, copper: 10, chip: 5 },
        { credits: 5200, glass: 26, copper: 18, chip: 10 }
      ]
    },
    {
      id: 'sonar', name: '老陈', role: '声呐员', iconImg: 'assets/real/sonar.webp',
      duration: 900, cost: 1500, desc: '用旧声呐扫描外海，偶尔能带回净水核心。',
      credits: [700, 1300], mats: { chip: [3, 6], fuel: [2, 4] }, collectibleChance: 0, filterChance: 0.1,
      gearName: '声呐仪', gearCosts: [
        { credits: 1200, chip: 6, glass: 6 },
        { credits: 3200, chip: 14, glass: 12, copper: 8 },
        { credits: 7000, chip: 24, glass: 20, copper: 14 }
      ]
    },
    {
      id: 'navigator', name: '阿岚', role: '海图师', iconImg: 'assets/collectibles/chart-tube.webp', unlockLevel: 3,
      duration: 1200, cost: 2600, desc: '沿着旧海图找沉船，专带稀有收藏与玻璃铜件。',
      credits: [400, 700], mats: { glass: [5, 9], copper: [4, 7], chip: [2, 4] }, collectibleChance: 0.65,
      gearName: '海图仪', gearCosts: [
        { credits: 1800, glass: 10, chip: 8, copper: 6 },
        { credits: 4500, glass: 18, chip: 14, copper: 10 },
        { credits: 9000, glass: 28, chip: 22, copper: 16 }
      ]
    },
    {
      id: 'captain', name: '老周', role: '打捞长', iconImg: 'assets/collectibles/captain-log.webp', unlockLevel: 5,
      duration: 2100, cost: 5200, desc: '指挥整支打捞队，带回大批物资，偶尔有净水核心。',
      credits: [1500, 2600], mats: { metal: [8, 14], fiber: [6, 10], chip: [4, 8] }, collectibleChance: 0.2, filterChance: 0.18,
      gearName: '打捞绞盘', gearCosts: [
        { credits: 2800, metal: 16, fiber: 12, chip: 8 },
        { credits: 7000, metal: 28, fiber: 20, chip: 14, glass: 10 },
        { credits: 14000, metal: 44, fiber: 32, chip: 22, glass: 16 }
      ]
    }
  ]);

  var CREW_LEVEL_XP = [0, 1, 3, 6, 10];
  var CREW_EXPEDITION_COST = 2500;
  var CREW_EXPEDITION_TIME = 900;
  var CREW_WEATHERS = (CW.CREW_WEATHERS = [
    { id: 'calm', name: '平静海面', desc: '标准航程与收益', duration: 900, color: '#79d8ff' },
    { id: 'tailwind', name: '顺风', desc: '航程缩短 20%', duration: 720, color: '#9be2a9' },
    { id: 'shoal', name: '鱼汛', desc: '档案方向额外 +1 件收藏', duration: 900, color: '#d9b8ff' },
    { id: 'cold', name: '寒流', desc: '工程方向的芯片 / 铜翻倍', duration: 900, color: '#8fe0d8' },
    { id: 'storm', name: '风暴', desc: '所有打捞币 +25%，航程 +10%', duration: 990, color: '#ff8a6b' }
  ]);
  var COLLECTION_MILESTONES = (CW.COLLECTION_MILESTONES = [
    { count: 5, credits: 500, mats: { metal: 5, fiber: 5 } },
    { count: 10, credits: 1500, mats: { glass: 6, chip: 6 } },
    { count: 25, credits: 4000, mats: { copper: 10, chip: 10 } },
    { count: 50, credits: 9000, mats: { glass: 16, chip: 16, copper: 12 } },
    { count: 75, credits: 18000, mats: { glass: 24, chip: 24, copper: 20 }, filters: 1 },
    { count: 102, credits: 40000, mats: { metal: 40, fuel: 40, fiber: 40, chip: 40, glass: 40, copper: 40 }, filters: 2 }
  ]);

  var SHELTER_LEVELS = (CW.SHELTER_LEVELS = [
    null,
    { level: 2, credits: 4000, mats: { metal: 20, fiber: 20 }, unique: 4, runs: 10, unlock: '开放高级扩建等级' },
    { level: 3, credits: 12000, mats: { glass: 24, copper: 24 }, specials: { 'sonar-core': 1 }, unique: 8, runs: 25, unlock: '解锁「阿岚」与高级扩建' },
    { level: 4, credits: 30000, mats: { chip: 30, fuel: 24 }, specials: { 'pressure-valve': 1 }, unique: 12, runs: 50, unlock: '开放更多高级扩建' },
    { level: 5, credits: 80000, mats: { metal: 30, fiber: 30, chip: 20, glass: 20, copper: 20 }, specials: { 'tide-cell': 1 }, filters: 1, unique: 15, runs: 100, unlock: '解锁「老周」与终极扩建' }
  ]);

  function crewDef(id) {
    for (var i = 0; i < CREW.length; i++) if (CREW[i].id === id) return CREW[i];
    return null;
  }

  function crewLevelFromXp(xp) {
    xp = Math.max(0, Math.floor(Number(xp) || 0));
    var lvl = 1;
    for (var i = 0; i < CREW_LEVEL_XP.length; i++) if (xp >= CREW_LEVEL_XP[i]) lvl = i + 1;
    return lvl;
  }

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
    },
    {
      id: 'trawl-twice', name: '潮汐两网', iconImg: 'assets/real/hook.webp', metric: 'trawlRuns', mode: 'sum', target: 2,
      desc: '完成 2 次潮汐拖网。',
      reward: { credits: 210, mats: { fiber: 3, glass: 2 } }
    },
    {
      id: 'dive-twice', name: '断面试航', iconImg: 'assets/collectibles/diving-helmet.webp', metric: 'diveRuns', mode: 'sum', target: 2,
      desc: '完成 2 次深海潜航。',
      reward: { credits: 240, mats: { copper: 3, glass: 2 } }
    },
    {
      id: 'stack-twice', name: '六箱归位', iconImg: 'assets/real/storage.webp', metric: 'stackRuns', mode: 'sum', target: 2,
      desc: '完成 2 次码头吊装。',
      reward: { credits: 250, mats: { metal: 4, fuel: 2 } }
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
      id: 'level-ten', name: '设施总管', iconImg: 'assets/real/workshop.webp',
      metric: 'level', target: 10, desc: '五项设施等级合计达到 10 级。',
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
      id: 'all-six', name: '九面手', iconImg: 'assets/real/sonar.webp',
      metric: 'missionsPlayed', target: 9, desc: '九种打捞任务都至少完成一次。',
      reward: { credits: 900, mats: { metal: 6, fuel: 4, fiber: 4, chip: 4, glass: 4, copper: 4 } }
    },
    {
      id: 'first-s', name: '第一枚 S', iconImg: 'assets/real/gold.webp',
      metric: 'sGradesCount', target: 1, desc: '任意任务首次拿到 S 评级。',
      reward: { credits: 500, mats: { glass: 3, copper: 2 } }
    },
    {
      id: 'all-s', name: '九项全能 S', iconImg: 'assets/collectibles/tide-crown.webp',
      metric: 'sGradesCount', target: 9, desc: '九个打捞任务都拿到 S 评级。',
      reward: { credits: 1500, mats: { metal: 8, fuel: 6, fiber: 6, chip: 6, glass: 6, copper: 6 } }
    },
    {
      id: 'crew-veteran', name: '独当一面', iconImg: 'assets/real/hook.webp',
      metric: 'crewMaxed', target: 1, desc: '把任意一名船员练到 Lv.5。',
      reward: { credits: 600, mats: { glass: 4, copper: 3 } }
    },
    {
      id: 'crew-legend', name: '传奇船队', iconImg: 'assets/real/storage.webp',
      metric: 'crewMaxed', target: 3, desc: '三名核心船员都达到 Lv.5。',
      reward: { credits: 1800, mats: { metal: 10, fuel: 8, fiber: 8, chip: 8, glass: 8, copper: 8 } }
    },
    {
      id: 'shelter-five', name: '海上堡垒', iconImg: 'assets/real/workshop.webp',
      metric: 'shelterLevel', target: 5, desc: '把避难所等级提升到 Lv.5。',
      reward: { credits: 2600, mats: { metal: 12, fuel: 10, fiber: 10, chip: 10, glass: 10, copper: 10 } }
    },
    {
      id: 'gear-master', name: '改装大师', iconImg: 'assets/real/core.webp',
      metric: 'crewGearMax', target: 3, desc: '把任意一件船员工具升到 Lv.3。',
      reward: { credits: 900, mats: { chip: 6, copper: 5 } }
    },
    {
      id: 'expedition-first', name: '联合出航', iconImg: 'assets/real/hook.webp',
      metric: 'expeditionRuns', target: 1, desc: '完成一次联合远征。',
      reward: { credits: 800, mats: { metal: 6, fiber: 6, glass: 4 } }
    },
    {
      id: 'expedition-ten', name: '远海常客', iconImg: 'assets/collectibles/captain-log.webp',
      metric: 'expeditionRuns', target: 10, desc: '累计完成 10 次联合远征。',
      reward: { credits: 2400, mats: { metal: 10, fiber: 10, chip: 8, copper: 8 } }
    },
    {
      id: 'urgent-ten', name: '码头熟人', iconImg: 'assets/real/gold.webp',
      metric: 'urgentOrders', target: 10, desc: '累计完成 10 笔码头急单。',
      reward: { credits: 1500, mats: { glass: 8, copper: 6 } }
    },
    {
      id: 'set-master', name: '套装藏家', iconImg: 'assets/collectibles/tide-crown.webp',
      metric: 'setRewardsCount', target: 6, desc: '领取全部六套收藏的完成奖励。',
      reward: { credits: 2200, mats: { chip: 10, glass: 8 } }
    },
    {
      id: 'archive-complete', name: '完整档案', iconImg: 'assets/collectibles/silver-musicbox.webp',
      metric: 'collectionUnique', target: 102, desc: '发现全部 102 件沉船档案。',
      reward: { credits: 5000, mats: { metal: 12, fuel: 12, fiber: 12, chip: 12, glass: 12, copper: 12 } }
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
      specials: {},
      collectionMilestones: [],
      trackedCollection: '',
      setRewards: [],
      urgentDone: {},
      urgentStreak: 0,
      urgentLastWin: -1,
      marketPressure: { win: -1, counts: {} },
      equipped: [],
      contracts: makeContractSet(),
      shelterLevel: 1,
      quality: 'auto',
      crew: {},
      crewXp: {},
      crewGear: {},
      crewExpedition: null,
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
        beaconRuns: 0,
        trawlRuns: 0,
        diveRuns: 0,
        stackRuns: 0,
        expeditionRuns: 0,
        urgentOrders: 0
      },
      upgrades: { storage: 0, workshop: 0, sonar: 0, core: 0, purifier: 0 },
      best: { hook: 0, match: 0, sonar: 0, cut: 0, sort: 0, beacon: 0, trawl: 0, dive: 0, stack: 0 },
      grades: {},
      sGrades: {},
      taskChain: 0,
      taskChainTypes: [],
      lastTask: '',
      activeMissions: ['hook', 'match', 'sonar'],
      candidateMissions: ['cut', 'sort', 'beacon', 'trawl', 'dive', 'stack'],
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
        if (!CW.COLLECTIBLE_MAP[cid] || CW.COLLECTIBLE_MAP[cid].special) continue;
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
    data.specials = {};
    if (raw.specials && typeof raw.specials === 'object') {
      for (var spid in raw.specials) {
        if (!Object.prototype.hasOwnProperty.call(raw.specials, spid)) continue;
        if (CW.COLLECTIBLE_MAP[spid] && CW.COLLECTIBLE_MAP[spid].special === 'material') {
          data.specials[spid] = clamp(Math.floor(Number(raw.specials[spid]) || 0), 0, 999);
        }
      }
    }
    data.trackedCollection = CW.COLLECTIBLE_MAP[raw.trackedCollection] ? String(raw.trackedCollection) : '';
    data.collectionMilestones = [];
    if (Array.isArray(raw.collectionMilestones)) {
      for (var cmi = 0; cmi < raw.collectionMilestones.length; cmi++) {
        var cmv = Number(raw.collectionMilestones[cmi]);
        if (cmv) data.collectionMilestones.push(cmv);
      }
    }
    data.urgentStreak = Math.max(0, Math.floor(Number(raw.urgentStreak) || 0));
    data.urgentLastWin = Number.isFinite(Number(raw.urgentLastWin)) ? Math.floor(Number(raw.urgentLastWin)) : -1;
    data.marketPressure = { win: -1, counts: {} };
    if (raw.marketPressure && typeof raw.marketPressure === 'object') {
      data.marketPressure.win = Number.isFinite(Number(raw.marketPressure.win)) ? Math.floor(Number(raw.marketPressure.win)) : -1;
      if (raw.marketPressure.counts && typeof raw.marketPressure.counts === 'object') {
        for (var mp in raw.marketPressure.counts) {
          if (Object.prototype.hasOwnProperty.call(raw.marketPressure.counts, mp)) {
            var mval = Math.max(0, Math.floor(Number(raw.marketPressure.counts[mp]) || 0));
            if (mval) data.marketPressure.counts[mp] = mval;
          }
        }
      }
    }
    data.urgentDone = {};
    if (raw.urgentDone && typeof raw.urgentDone === 'object') {
      for (var ud in raw.urgentDone) {
        if (Object.prototype.hasOwnProperty.call(raw.urgentDone, ud) && raw.urgentDone[ud]) data.urgentDone[ud] = true;
      }
    }
    data.setRewards = [];
    if (Array.isArray(raw.setRewards)) {
      for (var sri = 0; sri < raw.setRewards.length; sri++) {
        var srv = String(raw.setRewards[sri]);
        for (var srs = 0; srs < CW.COLLECTION_SETS.length; srs++) if (CW.COLLECTION_SETS[srs].id === srv) data.setRewards.push(srv);
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
    data.stats.trawlRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.trawlRuns) || 0));
    data.stats.diveRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.diveRuns) || 0));
    data.stats.stackRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.stackRuns) || 0));
    data.stats.expeditionRuns = Math.max(0, Math.floor(Number(raw.stats && raw.stats.expeditionRuns) || 0));
    data.stats.urgentOrders = Math.max(0, Math.floor(Number(raw.stats && raw.stats.urgentOrders) || 0));
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
    data.best.trawl = Math.max(0, Number(raw.best.trawl) || 0);
    data.best.dive = Math.max(0, Number(raw.best.dive) || 0);
    data.best.stack = Math.max(0, Number(raw.best.stack) || 0);
    var rotation = normalizeMissionRotation(raw.activeMissions, raw.candidateMissions);
    data.activeMissions = rotation.active;
    data.candidateMissions = rotation.candidates;
      data.shelterLevel = clamp(Math.floor(Number(raw.shelterLevel) || 1), 1, 5);
      data.quality = ['auto', 'high', 'low'].indexOf(raw.quality) >= 0 ? raw.quality : 'auto';
      data.crewXp = {};
      if (raw.crewXp && typeof raw.crewXp === 'object') {
        for (var cx in raw.crewXp) {
          if (crewDef(cx)) data.crewXp[cx] = Math.max(0, Math.floor(Number(raw.crewXp[cx]) || 0));
        }
      }
      data.crewGear = {};
      if (raw.crewGear && typeof raw.crewGear === 'object') {
        for (var cg in raw.crewGear) {
          if (crewDef(cg)) data.crewGear[cg] = clamp(Math.floor(Number(raw.crewGear[cg]) || 0), 0, 3);
        }
      }
      data.crew = {};
      if (raw.crew && typeof raw.crew === 'object') {
        for (var cr in raw.crew) {
          if (!Object.prototype.hasOwnProperty.call(raw.crew, cr) || !crewDef(cr)) continue;
          var cjob = raw.crew[cr];
          if (cjob && (Number(cjob.remaining) > 0 || Number(cjob.until) > 0)) {
            var rem = cjob.remaining !== undefined ? Number(cjob.remaining) : Math.max(0, (Number(cjob.until) - Date.now()) / 1000);
            data.crew[cr] = { remaining: Math.max(0, rem), seed: Number(cjob.seed) || 0 };
          }
        }
      }
      data.crewExpedition = null;
      if (raw.crewExpedition && Array.isArray(raw.crewExpedition.members) && raw.crewExpedition.members.length === 2) {
        var exMembers = [];
        for (var emi = 0; emi < 2; emi++) if (crewDef(raw.crewExpedition.members[emi])) exMembers.push(raw.crewExpedition.members[emi]);
        if (exMembers.length === 2) {
          var exWeather = 'calm';
          for (var ewi = 0; ewi < CREW_WEATHERS.length; ewi++) if (CREW_WEATHERS[ewi].id === raw.crewExpedition.weather) exWeather = CREW_WEATHERS[ewi].id;
          data.crewExpedition = { members: exMembers, remaining: Math.max(0, Number(raw.crewExpedition.remaining) || 0), seed: Number(raw.crewExpedition.seed) || 0.5, weather: exWeather };
        }
      }
      data.grades = {};
      data.sGrades = {};
      if (raw.grades && typeof raw.grades === 'object') {
        for (var gk in raw.grades) {
          if (!Object.prototype.hasOwnProperty.call(raw.grades, gk)) continue;
          var gv = String(raw.grades[gk] || '');
          if (MISSION_GRADES[gk] && GRADE_RANK[gv] !== undefined) data.grades[gk] = gv;
        }
      }
      if (raw.sGrades && typeof raw.sGrades === 'object') {
        for (var sk in raw.sGrades) {
          if (Object.prototype.hasOwnProperty.call(raw.sGrades, sk) && MISSION_GRADES[sk] && raw.sGrades[sk]) data.sGrades[sk] = true;
        }
      }
      data.taskChain = clamp(Math.floor(Number(raw.taskChain) || 0), 0, 6);
      data.lastTask = ['hook', 'match', 'sonar', 'cut', 'sort', 'beacon'].indexOf(raw.lastTask) >= 0 ? raw.lastTask : '';
      data.taskChainTypes = [];
      if (Array.isArray(raw.taskChainTypes)) {
        for (var tc = 0; tc < raw.taskChainTypes.length && data.taskChainTypes.length < 6; tc++) {
          var tid = raw.taskChainTypes[tc];
          if (['hook', 'match', 'sonar', 'cut', 'sort', 'beacon'].indexOf(tid) >= 0 && data.taskChainTypes.indexOf(tid) < 0) {
            data.taskChainTypes.push(tid);
          }
        }
      }
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
    this.marketTab = 'materials';
    this.marketTimers = [];
    this.marketBusy = false;
    this.lastMarketTick = marketTick();
    this.lastCrewReady = -1;
    this.crewGearOpen = null;
    this.collectionFilter = 'all';
    this.autoLowFx = false;
    this.lowFx = false;
    this.fpsTime = 0;
    this.fpsFrames = 0;
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
      qualityToggle: document.querySelector('.quality-toggle span'),
    marketModal: id('market-modal'),
    marketBody: id('market-modal-body'),
    collectibleModal: id('collectible-modal'),
    collectibleBody: id('collectible-modal-body'),
    expeditionModal: id('expedition-modal'),
    expeditionBody: id('expedition-modal-body'),
    storyModal: id('story-modal'),
    storyBody: id('story-modal-body'),
      reset: id('reset-save'),
      toast: id('toast'),
      toastKicker: id('toast-kicker'),
      toastTitle: id('toast-title'),
      toastSub: id('toast-sub'),
      arcade: id('arcade')
    };

    this.applyQuality(false);
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
  Hub.prototype.shelterLevel = function () { return clamp(Math.floor(Number(this.data.shelterLevel) || 1), 1, 5); };
  Hub.prototype.shelterNext = function () { return SHELTER_LEVELS[this.shelterLevel()] || null; };
  Hub.prototype.shelterCollectibleChance = function () { return Math.min(0.2, (this.shelterLevel() - 1) * 0.045); };
  Hub.prototype.collectionArtifactUnique = function () {
    var n = 0;
    var map = this.data.collectibles || {};
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      var item = CW.COLLECTIBLES[i];
      if (!item.special && (map[item.id] || 0) > 0) n++;
    }
    return n;
  };
  Hub.prototype.capacity = function () { return 72 + (this.data.upgrades.storage || 0) * 30 + (this.shelterLevel() - 1) * 15; };
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

  Hub.prototype.salvageForUpgrade = function () {
    var map = this.data.collectibles || {};
    var order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    var picked = null;
    for (var r = 0; r < order.length && !picked; r++) {
      for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
        var item = CW.COLLECTIBLES[i];
        if (item.special || item.rarity !== order[r]) continue;
        if ((map[item.id] || 0) > 1) { picked = item; break; }
      }
    }
    if (!picked) {
      this.audio.warn();
      this.showToast('NO SPARE RELIC', '没有可拆的重复收藏', '每件藏品至少保留 1 份');
      return;
    }
    var yields = CW.DISMANTLE_YIELDS[picked.rarity] || {};
    var parts = [];
    map[picked.id] -= 1;
    if (map[picked.id] <= 0) delete map[picked.id];
    for (var key in yields) {
      if (!Object.prototype.hasOwnProperty.call(yields, key)) continue;
      this.data.materials[key] = (this.data.materials[key] || 0) + yields[key];
      parts.push((CW.MATERIALS.find(function (m) { return m.id === key; }) || {}).name + ' +' + yields[key]);
    }
    this.collectionCleanupEquipped();
    this.audio.craft();
    this.showToast('RELIC SALVAGED', '拆解 ' + picked.name, parts.join(' · ') + ' · 已直接补入仓库');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
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
    if (this.dom.collectibleModal && !this.dom.collectibleModal.classList.contains('hidden')) this.openCollectibleDetail(id);
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
    if (this.dom.collectibleModal && !this.dom.collectibleModal.classList.contains('hidden')) this.openCollectibleDetail(id);
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
    return 1 + (this.data.upgrades.workshop || 0) * 0.1 + (this.data.upgrades.purifier || 0) * 0.1 + (this.data.upgrades.cannon || 0) * 0.05 + setBonus.credit + relic.credit;
  };
  Hub.prototype.materialMult = function () {
    var setBonus = this.collectionSetBonuses();
    var relic = this.collectionRelicBonuses();
    return 1 + (this.data.upgrades.sonar || 0) * 0.12 + (this.data.upgrades.purifier || 0) * 0.05 + setBonus.mat + relic.mat;
  };
  Hub.prototype.hookTime = function () { return 60 + (this.data.upgrades.core || 0) * 5 + (this.data.upgrades.eel || 0) * 2 + this.collectionRelicBonuses().time; };
  Hub.prototype.matchMoves = function () { return 30 + (this.data.upgrades.core || 0) * 2 + this.collectionRelicBonuses().moves; };
  Hub.prototype.sonarProbes = function () { return 10 + Math.floor((this.data.upgrades.core || 0) / 2) + (this.data.upgrades.eel || 0) + this.collectionRelicBonuses().probes; };
  Hub.prototype.dayNumber = function () { return 1281 + this.data.runs * 2; };

  /* ── quality / resize / layout ───────────────────────────── */
  Hub.prototype.applyQuality = function (refresh) {
    var mode = (this.data && this.data.quality) || 'auto';
    var low = mode === 'low' || (mode === 'auto' && this.autoLowFx);
    this.lowFx = low;
    document.body.classList.toggle('low-fx', low);
    if (this.dom && this.dom.qualityToggle) {
      this.dom.qualityToggle.textContent = mode === 'high' ? '高' : mode === 'low' ? '省电' : (low ? '自动 · 省电' : '自动');
    }
    if (refresh) {
      this.resize();
      if (this.arcade) this.arcade.resize();
      this.buildRain();
    }
  };

  Hub.prototype.cycleQuality = function () {
    var order = ['auto', 'high', 'low'];
    var idx = order.indexOf(this.data.quality);
    this.data.quality = order[(idx + 1) % order.length];
    this.autoLowFx = false;
    this.applyQuality(true);
    this.saveGame();
    this.audio.click();
    var labels = { auto: '自动检测', high: '高画质', low: '省电' };
    this.showToast('DISPLAY', '画质 · ' + labels[this.data.quality], this.lowFx ? '已减少雨幕、粒子和像素密度' : '保留完整画面效果');
  };

  Hub.prototype.resize = function () {
    this.w = Math.max(280, window.innerWidth);
    this.h = Math.max(280, window.innerHeight);
    var dpr = Math.min(this.lowFx ? 1.0 : 1.5, window.devicePixelRatio || 1);
    var maxPixels = this.lowFx ? 1200000 : 2400000;
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
    this.fpsTime = (this.fpsTime || 0) + dt;
    this.fpsFrames = (this.fpsFrames || 0) + 1;
    if (this.fpsTime >= 1.5) {
      var fps = this.fpsFrames / this.fpsTime;
      this.fpsTime = 0;
      this.fpsFrames = 0;
      if (this.data && this.data.quality === 'auto' && !this.autoLowFx && fps < 38) {
        this.autoLowFx = true;
        this.applyQuality(true);
        this.showToast('DISPLAY', '已自动切换省电画质', '检测到帧率偏低 · 可在设置中改回高画质');
      }
    }

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
    var nowTick = marketTick();
    if (nowTick !== this.lastMarketTick) {
      this.lastMarketTick = nowTick;
      if (this.state === 'playing' && this.tab === 'warehouse' && this.warehouseView === 'market') this.renderPanel();
    }
    if (this.state === 'playing' && this.tab === 'warehouse' && this.warehouseView === 'market') {
      var clockEl = document.getElementById('market-clock-val');
      if (clockEl) clockEl.textContent = Math.max(0, Math.ceil((MARKET_TICK_MS - (Date.now() % MARKET_TICK_MS)) / 1000)) + 's';
      var urgentEl = document.getElementById('market-urgent-val');
      if (urgentEl) {
        var uwin = Math.floor(marketTick() / MARKET_URGENT_TICKS);
        urgentEl.textContent = Math.max(0, Math.ceil(((uwin + 1) * MARKET_URGENT_TICKS * MARKET_TICK_MS - Date.now()) / 1000));
      }
    }
    if (this.state === 'playing' && this.data && this.data.crew) {
      for (var cj = 0; cj < CREW.length; cj++) {
        var cjob = this.data.crew[CREW[cj].id];
        if (!cjob || Number(cjob.remaining) <= 0) continue;
        cjob.remaining = Math.max(0, Number(cjob.remaining) - dt);
        if (cjob.remaining <= 0) this.saveGame();
      }
      if (this.data.crewExpedition && Number(this.data.crewExpedition.remaining) > 0) {
        this.data.crewExpedition.remaining = Math.max(0, Number(this.data.crewExpedition.remaining) - dt);
        if (this.data.crewExpedition.remaining <= 0) this.saveGame();
      }
    }
    var crewReady = this.crewReadyCount();
    if (crewReady !== this.lastCrewReady) {
      this.lastCrewReady = crewReady;
      if (this.tab === 'crew') this.renderPanel();
      this.updatePanelMeta();
    }
    if (this.state === 'playing' && this.tab === 'crew') {
      var timers = document.querySelectorAll('[data-crew-id]');
      for (var ci = 0; ci < timers.length; ci++) {
        var tjob = this.crewJob(timers[ci].getAttribute('data-crew-id'));
        timers[ci].textContent = tjob ? this.crewTimeText(Number(tjob.remaining) * 1000) : '0:00';
      }
      var expTimer = document.querySelector('[data-expedition]');
      if (expTimer && this.data.crewExpedition) expTimer.textContent = this.crewTimeText(Number(this.data.crewExpedition.remaining) * 1000);
    }
    requestAnimationFrame(this.loop);
  };

  /* ── title / meta ────────────────────────────────────────── */
  Hub.prototype.refreshMeta = function () {
    if (!this.dom) return;
    var lvl = this.shelterLevel();
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
    var lvl = this.shelterLevel();
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
    var crewTab = document.querySelector('.panel-tab[data-tab="crew"]');
    if (crewTab) crewTab.classList.toggle('has-ready', this.crewReadyCount() > 0);
    if (this.tab === 'tasks') {
      this.dom.panelTitle.textContent = '打捞任务';
      this.dom.panelTag.textContent = (this.data.activeMissions || []).length + ' 个轮换';
      this.dom.panelNote.textContent = '完成一个任务后自动换入新的打捞点';
    } else if (this.tab === 'crew') {
      this.dom.panelTitle.textContent = '打捞队';
      this.dom.panelTag.textContent = this.crewReadyCount() ? this.crewReadyCount() + ' 可领取' : CREW.length + ' 个岗位';
      this.dom.panelNote.textContent = '雇佣 NPC 后等待返航 · 开启时计时';
    } else if (this.tab === 'contracts') {
      var contractReady = this.contractsReadyCount();
      this.dom.panelTitle.textContent = '打捞契约';
      this.dom.panelTag.textContent = '第 ' + Math.max(1, this.data.contractRound || 1) + ' 轮' + (contractReady ? ' · ' + contractReady + ' 可领' : '');
      this.dom.panelNote.textContent = '完成契约领取打捞币与补给';
    } else if (this.tab === 'warehouse') {
      this.dom.panelTitle.textContent = this.warehouseView === 'collection' ? '仓库 · 收藏' : this.warehouseView === 'market' ? '仓库 · 集市' : '仓库 · 物资';
      if (this.warehouseView === 'collection') {
        this.dom.panelTag.textContent = this.collectionUnique() + ' / ' + CW.COLLECTIBLES.length;
        this.dom.panelNote.textContent = '装备 3 件藏品 / 分解 / 合成';
      } else if (this.warehouseView === 'market') {
        this.dom.panelTag.textContent = '价格波动';
        this.dom.panelNote.textContent = '买卖材料与收藏 · 手续费已计入报价';
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
        this.dom.panelTag.textContent = '避难所 Lv.' + this.shelterLevel();
        this.dom.panelNote.textContent = '提升避难所等级，开放更高扩建与玩法';
      }
    }
  };

  /* ── panel rendering ─────────────────────────────────────── */
  Hub.prototype.renderPanel = function () {
    if (!this.dom.panelContent) return;
    var scroll = this.dom.panelContent.scrollTop;
    if (this.tab === 'tasks') this.renderTasks();
    else if (this.tab === 'crew') this.renderCrew();
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

  Hub.prototype.crewJob = function (id) {
    return this.data.crew && this.data.crew[id] ? this.data.crew[id] : null;
  };

  Hub.prototype.crewReadyCount = function () {
    var n = 0;
    for (var i = 0; i < CREW.length; i++) {
      if ((CREW[i].unlockLevel || 1) > this.shelterLevel()) continue;
      var job = this.crewJob(CREW[i].id);
      if (job && Number(job.remaining) <= 0) n++;
    }
    if (this.data.crewExpedition && Number(this.data.crewExpedition.remaining) <= 0) n++;
    return n;
  };

  Hub.prototype.crewExpeditionMembers = function () {
    var out = [];
    if (this.data.crewExpedition) return out;
    for (var i = 0; i < CREW.length; i++) {
      var def = CREW[i];
      if ((def.unlockLevel || 1) > this.shelterLevel()) continue;
      if (this.crewJob(def.id)) continue;
      out.push(def);
    }
    out.sort(function (a, b) {
      var sa = this.crewLevel(a.id) * 10 + this.crewGearLevel(a.id);
      var sb = this.crewLevel(b.id) * 10 + this.crewGearLevel(b.id);
      return sb - sa;
    }.bind(this));
    return out;
  };

  Hub.prototype.expeditionWeather = function () {
    var id = this.data.crewExpedition ? this.data.crewExpedition.weather : 'calm';
    for (var i = 0; i < CREW_WEATHERS.length; i++) if (CREW_WEATHERS[i].id === id) return CREW_WEATHERS[i];
    return CREW_WEATHERS[0];
  };

  Hub.prototype.startCrewExpedition = function () {
    if (this.shelterLevel() < 3) {
      this.audio.warn();
      this.showToast('LOCKED', '联合远征尚未开放', '避难所达到 Lv.3 后解锁');
      return;
    }
    if (this.data.crewExpedition) return;
    var candidates = this.crewExpeditionMembers();
    if (candidates.length < 2) {
      this.audio.warn();
      this.showToast('CREW BUSY', '需要 2 名空闲船员', '先等待当前作业结束');
      return;
    }
    if ((this.data.credits || 0) < CREW_EXPEDITION_COST) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '联合远征需要 ' + fmt(CREW_EXPEDITION_COST) + ' 打捞币', '再去集市或契约凑一凑');
      return;
    }
    this.data.credits -= CREW_EXPEDITION_COST;
    var weather = CREW_WEATHERS[(Math.random() * CREW_WEATHERS.length) | 0];
    this.data.crewExpedition = { members: [candidates[0].id, candidates[1].id], remaining: weather.duration, seed: Math.random(), weather: weather.id };
    this.audio.claim();
    this.showToast('JOINT EXPEDITION · ' + weather.name, candidates[0].name + ' + ' + candidates[1].name, weather.desc + ' · 保底稀有升级件');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.expeditionOptions = function () {
    var exp = this.data.crewExpedition;
    if (!exp) return [];
    var totalLevel = 0;
    var totalGear = 0;
    for (var i = 0; i < exp.members.length; i++) {
      totalLevel += this.crewLevel(exp.members[i]);
      totalGear += this.crewGearLevel(exp.members[i]);
    }
    var weather = this.expeditionWeather();
    var creditMult = weather.id === 'storm' ? 1.25 : 1;
    var base = Math.round((900 + totalLevel * 130 + totalGear * 90) * creditMult);
    var mats = { metal: 4 + totalLevel, fiber: 4 + totalLevel, glass: 3 + Math.floor(totalGear / 2), copper: 3 + Math.floor(totalGear / 2), chip: 2 + totalGear };
    var archiveBonus = weather.id === 'shoal' ? 1 : 0;
    var gearMats = { chip: 4 + totalGear, copper: 3 + Math.floor(totalGear / 2) };
    if (weather.id === 'cold') { gearMats.chip *= 2; gearMats.copper *= 2; }
    return [
      { id: 0, name: '满舱而归', icon: 'assets/real/gold.webp', desc: '优先带回打捞币与五大类材料，适合扩建。', credits: base, mats: mats, collectibles: 1, specials: 0 },
      { id: 1, name: '档案优先', icon: 'assets/collectibles/tide-crown.webp', desc: '少拿材料，多带两件随机收藏，适合补图鉴。', credits: Math.round(base * 0.55), mats: {}, collectibles: 2 + archiveBonus, specials: 0 },
      { id: 2, name: '工程优先', icon: 'assets/real/core.webp', desc: '保底一件稀有升级件，附带芯片与铜线。', credits: Math.round(base * 0.65), mats: gearMats, collectibles: 0, specials: 1 }
    ];
  };

  Hub.prototype.openExpeditionEvent = function () {
    var exp = this.data.crewExpedition;
    if (!exp || Number(exp.remaining) > 0 || !this.dom.expeditionModal) return;
    var opts = this.expeditionOptions();
    var weather = this.expeditionWeather();
    var html = '<div class="expedition-event"><p class="expedition-kicker">EXPEDITION RETURN · 远征返航</p><h3>选择带回什么</h3><p class="expedition-copy">船员已经靠岸，只能优先卸下其中一类收获。</p><p class="expedition-weather">海况 · <b>' + weather.name + '</b> · ' + weather.desc + '</p><div class="expedition-options">';
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      var reward = '+' + fmt(o.credits) + ' 币';
      if (o.collectibles) reward += ' · 收藏 ×' + o.collectibles;
      if (o.specials) reward += ' · 稀有升级件 ×' + o.specials;
      if (o.mats) {
        for (var mk in o.mats) {
          if (!Object.prototype.hasOwnProperty.call(o.mats, mk)) continue;
          var mn = null;
          for (var mi = 0; mi < MATERIALS.length; mi++) if (MATERIALS[mi].id === mk) mn = MATERIALS[mi].name;
          reward += ' · ' + (mn || mk) + '+' + o.mats[mk];
        }
      }
      html += '<button class="expedition-option" data-action="expedition-choose" data-choice="' + o.id + '"><img src="' + o.icon + '" alt=""><b>' + o.name + '</b><span>' + o.desc + '</span><em>' + reward + '</em></button>';
    }
    html += '</div></div>';
    this.dom.expeditionBody.innerHTML = html;
    this.dom.expeditionModal.classList.remove('hidden');
    this.dom.expeditionModal.setAttribute('aria-hidden', 'false');
    this.audio.tab();
  };

  Hub.prototype.closeExpeditionEvent = function () {
    if (!this.dom.expeditionModal) return;
    this.dom.expeditionModal.classList.add('hidden');
    this.dom.expeditionModal.setAttribute('aria-hidden', 'true');
  };

  Hub.prototype.chooseExpeditionReward = function (choice) {
    var exp = this.data.crewExpedition;
    if (!exp || Number(exp.remaining) > 0) return;
    var opts = this.expeditionOptions();
    var opt = opts[Number(choice)];
    if (!opt) return;
    var gained = this.grantContractReward({ credits: opt.credits, mats: opt.mats });
    var extras = [];
    for (var c = 0; c < opt.collectibles; c++) {
      var cdef = CW.rollCollectibleDef();
      this.data.collectibles[cdef.id] = (this.data.collectibles[cdef.id] || 0) + 1;
      extras.push(cdef.name);
    }
    for (var s = 0; s < opt.specials; s++) {
      var sid = CW.rollSpecialMaterial();
      var sdef = CW.COLLECTIBLE_MAP[sid];
      this.data.specials[sid] = (this.data.specials[sid] || 0) + 1;
      extras.push(sdef.name);
    }
    this.data.crewExpedition = null;
    this.data.stats.expeditionRuns = (this.data.stats.expeditionRuns || 0) + 1;
    this.closeExpeditionEvent();
    this.audio.relic();
    this.showToast('EXPEDITION RETURNED', '联合远征返航', '+' + fmt(gained.credits) + ' 打捞币' + (extras.length ? ' · ' + extras.join(' / ') : ''));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.claimCrewExpedition = function () {
    var exp = this.data.crewExpedition;
    if (!exp || Number(exp.remaining) > 0) return;
    this.openExpeditionEvent();
  };

  Hub.prototype.crewLevel = function (id) {
    return crewLevelFromXp(this.data.crewXp && this.data.crewXp[id]);
  };

  Hub.prototype.crewGearLevel = function (id) {
    return clamp(Math.floor(Number(this.data.crewGear && this.data.crewGear[id]) || 0), 0, 3);
  };

  Hub.prototype.crewGearMult = function (def) {
    return 1 + this.crewGearLevel(def.id) * 0.08;
  };

  Hub.prototype.crewDuration = function (def) {
    var lvl = this.crewLevel(def.id);
    var gear = this.crewGearLevel(def.id);
    return Math.round(def.duration * (1 - (lvl - 1) * 0.06) * (1 - gear * 0.04));
  };

  Hub.prototype.crewMasteryMult = function (def) {
    return 1 + (this.crewLevel(def.id) - 1) * 0.08;
  };

  Hub.prototype.upgradeCrewGear = function (id) {
    var def = crewDef(id);
    if (!def) return;
    if ((def.unlockLevel || 1) > this.shelterLevel()) return;
    var level = this.crewGearLevel(id);
    if (level >= 3) return;
    var cost = def.gearCosts[level];
    if (!cost || !this.canAfford(cost)) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '改装材料不足', def.gearName + ' 需要更多打捞币 / 材料');
      return;
    }
    this.data.credits -= cost.credits;
    for (var k = 0; k < MATERIALS.length; k++) {
      var m = MATERIALS[k];
      if (cost[m.id]) this.data.materials[m.id] -= cost[m.id];
    }
    this.data.crewGear[id] = level + 1;
    this.audio.craft();
    this.showToast('GEAR UPGRADED', def.name + ' · ' + def.gearName + ' Lv.' + (level + 1), '产出 +' + ((level + 1) * 8) + '% · 作业时长 -' + ((level + 1) * 4) + '%');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.crewReward = function (def) {
    var seed = 0.5;
    var job = this.data.crew[def.id];
    var mastery = this.crewMasteryMult(def) * this.crewGearMult(def);
    if (job) seed = Number(job.seed) || 0.5;
    function rnd(i) {
      var x = Math.sin(seed * 9173.13 + i * 47.71) * 43758.5453;
      return x - Math.floor(x);
    }
    var credits = Math.round((def.credits[0] + (def.credits[1] - def.credits[0]) * rnd(1)) * mastery);
    var mats = {};
    var i = 2;
    for (var key in def.mats) {
      if (!Object.prototype.hasOwnProperty.call(def.mats, key)) continue;
      var range = def.mats[key];
      mats[key] = Math.round((range[0] + (range[1] - range[0]) * rnd(i++)) * mastery);
    }
    var level = this.crewLevel(def.id);
    var gearLevel = this.crewGearLevel(def.id);
    var rareBonus = (level - 1) * 0.02 + gearLevel * 0.01;
    return {
      credits: credits, mats: mats,
      collectible: rnd(i++) < Math.min(1, (def.collectibleChance || 0) + rareBonus),
      filter: rnd(i + 4) < Math.min(1, (def.filterChance || 0) + rareBonus)
    };
  };

  Hub.prototype.hireCrew = function (id) {
    var def = crewDef(id);
    if (!def) return;
    if ((def.unlockLevel || 1) > this.shelterLevel()) {
      this.audio.warn();
      this.showToast('LOCKED', def.name + ' 尚未解锁', '需要避难所 Lv.' + def.unlockLevel);
      return;
    }
    if (this.data.crewExpedition && this.data.crewExpedition.members.indexOf(id) >= 0) {
      this.audio.warn();
      this.showToast('ON EXPEDITION', def.name + ' 正在远征', '等待联合远征返航');
      return;
    }
    var job = this.crewJob(id);
    if (job && Number(job.remaining) > 0) return;
    if ((this.data.credits || 0) < def.cost) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '打捞币不足', '雇佣 ' + def.name + ' 需要 ' + fmt(def.cost));
      return;
    }
    this.data.credits -= def.cost;
    var duration = this.crewDuration(def);
    this.data.crew[id] = { remaining: duration, seed: Math.random() };
    this.audio.claim();
    this.showToast('CREW DISPATCHED', def.name + ' · ' + def.role, 'Lv.' + this.crewLevel(id) + ' · 预计 ' + this.crewTimeText(duration * 1000) + ' 后返航');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.claimCrew = function (id) {
    var def = crewDef(id);
    var job = this.crewJob(id);
    if (!def || !job || Number(job.remaining) > 0) return;
    var reward = this.crewReward(def);
    var gained = this.grantContractReward({ credits: reward.credits, mats: reward.mats });
    var extras = [];
    if (reward.collectible && CW.rollCollectibleDef) {
      var cdef = CW.rollCollectibleDef();
      this.data.collectibles[cdef.id] = (this.data.collectibles[cdef.id] || 0) + 1;
      extras.push(cdef.name);
    }
    if (reward.filter) {
      this.data.filters = (this.data.filters || 0) + 1;
      this.data.filterPity = 0;
      extras.push('海水过滤器');
    }
    delete this.data.crew[id];
    var oldLevel = this.crewLevel(id);
    this.data.crewXp[id] = Math.max(0, Math.floor(Number(this.data.crewXp[id]) || 0)) + 1;
    var newLevel = this.crewLevel(id);
    this.audio.claim();
    this.showToast('CREW RETURNED', def.name + ' 返航', '+' + fmt(gained.credits) + ' 打捞币 · 材料已入库' + (extras.length ? ' · ' + extras.join(' / ') : '') + (newLevel > oldLevel ? ' · 熟练度 Lv.' + newLevel + '!' : ''));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.renderCrew = function () {
    var exp = this.data.crewExpedition;
    var expSaved = '';
    if (this.shelterLevel() < 3) {
      expSaved = '<div class="crew-expedition locked"><div class="crew-expedition-copy"><span>JOINT EXPEDITION · 联合远征</span><b>避难所 Lv.3 解锁</b><p>派出两名船员，15 分钟后带回打捞币、收藏与至少 1 件稀有升级件。</p></div><button disabled>未解锁</button></div>';
    } else if (exp) {
      var ready = Number(exp.remaining) <= 0;
      var weather = this.expeditionWeather();
      var expNames = [];
      for (var ei = 0; ei < exp.members.length; ei++) { var ed = crewDef(exp.members[ei]); if (ed) expNames.push(ed.name); }
      expSaved = '<div class="crew-expedition' + (ready ? ' ready' : ' running') + '"><div class="crew-expedition-copy"><span>JOINT EXPEDITION · 联合远征</span><b>' + expNames.join(' + ') + ' · ' + weather.name + '</b><p>' + weather.desc + ' · 保底 1 件收藏 + 1 件稀有升级件 · ' +
        (ready ? '已返航 · 三选一' : '剩余 <em data-expedition>' + this.crewTimeText(Number(exp.remaining) * 1000) + '</em>') + '</p></div><button data-action="crew-expedition-claim"' + (ready ? '' : ' disabled') + '>' + (ready ? '选择奖励' : '远征中') + '</button></div>';
    } else {
      var candidates = this.crewExpeditionMembers();
      var canStart = candidates.length >= 2 && (this.data.credits || 0) >= CREW_EXPEDITION_COST;
      expSaved = '<div class="crew-expedition"><div class="crew-expedition-copy"><span>JOINT EXPEDITION · 联合远征</span><b>两人一队，去更远的海域</b><p>消耗 ' + fmt(CREW_EXPEDITION_COST) + ' 币 · 约 15 分钟 · 海况随机 · 保底 1 件收藏 + 1 件稀有升级件 · 空闲船员 ' + candidates.length + ' 名</p></div>' +
        '<button data-action="crew-expedition-start"' + (canStart ? '' : ' disabled') + '>' + (candidates.length < 2 ? '需要 2 名空闲' : (this.data.credits || 0) < CREW_EXPEDITION_COST ? '打捞币不足' : '发起远征') + '</button></div>';
    }
    var html = '<div class="crew-head"><div><span>CREW DOCK · 打捞队</span><b>把等待变成下一船物资</b><p>雇佣后在避难所开启期间倒计时；每个船员一次只能跑一个岗位。</p></div><div class="crew-ready"><b>' + this.crewReadyCount() + '</b><span>可领取</span></div></div>' + expSaved + '<div class="crew-grid">';
    for (var i = 0; i < CREW.length; i++) {
      var def = CREW[i];
      var locked = (def.unlockLevel || 1) > this.shelterLevel();
      if (locked) {
        html += '<article class="crew-card locked"><div class="crew-photo"><img src="' + def.iconImg + '" alt=""><span>' + def.role + '</span><em class="crew-level">Lv.' + (def.unlockLevel || 1) + '</em><button class="img-detail" data-action="crew-detail" data-id="' + def.id + '" aria-label="查看 ' + def.name + ' 档案">i</button></div>' +
          '<div class="crew-copy"><div class="crew-name"><b>' + def.name + '</b><em>未解锁</em></div><p>' + def.desc + '</p><div class="crew-reward">避难所达到 Lv.' + (def.unlockLevel || 1) + ' 后开放</div></div>' +
          '<div class="crew-action"><button class="crew-btn" disabled>避难所 Lv.' + (def.unlockLevel || 1) + ' 解锁</button></div></article>';
        continue;
      }
      var job = this.crewJob(def.id);
      var level = this.crewLevel(def.id);
      var xp = Math.max(0, Number(this.data.crewXp[def.id]) || 0);
      var nextXp = level < 5 ? CREW_LEVEL_XP[level] : null;
      var curBase = CREW_LEVEL_XP[level - 1] || 0;
      var xpPct = nextXp ? Math.min(1, (xp - curBase) / Math.max(1, nextXp - curBase)) : 1;
      var mastery = Math.round((this.crewMasteryMult(def) - 1) * 100);
      var gearLv = this.crewGearLevel(def.id);
      var gearOpen = this.crewGearOpen === def.id;
      var gearCost = gearLv < 3 ? def.gearCosts[gearLv] : null;
      var gearAfford = gearCost ? this.canAfford(gearCost) : false;
      var onExpedition = !!(this.data.crewExpedition && this.data.crewExpedition.members.indexOf(def.id) >= 0);
      var ready = !!(job && Number(job.remaining) <= 0);
      var working = !!(job && !ready);
      var stateClass = ready ? ' ready' : working ? ' working' : ' idle';
      var rewardText = '约 ' + def.credits[0] + '–' + def.credits[1] + ' 币';
      for (var mk in def.mats) {
        if (!Object.prototype.hasOwnProperty.call(def.mats, mk)) continue;
        var mname = null;
        for (var mi = 0; mi < MATERIALS.length; mi++) if (MATERIALS[mi].id === mk) mname = MATERIALS[mi].name;
        rewardText += ' · ' + (mname || mk) + def.mats[mk][0] + '–' + def.mats[mk][1];
      }
      if (def.collectibleChance) rewardText += ' · 收藏概率 ' + Math.round(def.collectibleChance * 100) + '%';
      if (def.filterChance) rewardText += ' · 过滤器概率 ' + Math.round(def.filterChance * 100) + '%';
      var timer = '';
      var btn = '';
      if (ready) {
        btn = '<button class="crew-btn claim" data-action="crew-claim" data-id="' + def.id + '">领取收获</button>';
        timer = '<span class="crew-time ready">可以返航</span>';
      } else if (working) {
        btn = '<button class="crew-btn" disabled>作业中</button>';
        timer = '<span class="crew-time" data-crew-id="' + def.id + '">' + this.crewTimeText(Number(job.remaining) * 1000) + '</span>';
      } else if (onExpedition) {
        btn = '<button class="crew-btn" disabled>远征中</button>';
        timer = '<span class="crew-time ready">远航中</span>';
      } else {
        btn = '<button class="crew-btn hire" data-action="crew-hire" data-id="' + def.id + '"' + ((this.data.credits || 0) < def.cost ? ' disabled' : '') + '>雇佣 · ' + fmt(def.cost) + '</button>';
        timer = '<span class="crew-time">' + this.crewTimeText(this.crewDuration(def) * 1000) + '</span>';
      }
      var gearPanel = '';
      if (gearOpen) {
        var gearChips = '';
        if (gearCost) {
          gearChips += '<span class="' + ((this.data.credits || 0) < gearCost.credits ? 'poor' : '') + '">币 ' + fmt(gearCost.credits) + '</span>';
          for (var gi = 0; gi < MATERIALS.length; gi++) {
            var gm = MATERIALS[gi];
            if (gearCost[gm.id]) gearChips += '<span class="' + ((this.data.materials[gm.id] || 0) < gearCost[gm.id] ? 'poor' : '') + '">' + gm.name + ' ' + gearCost[gm.id] + '</span>';
          }
        }
        gearPanel = '<div class="crew-gear-panel"><div class="crew-gear-head"><b>' + def.gearName + ' Lv.' + gearLv + '/3</b><span>产出 +' + (gearLv * 8) + '% · 时长 -' + (gearLv * 4) + '%</span></div>' +
          (gearCost ? '<div class="crew-gear-costs">' + gearChips + '</div><button class="crew-gear-up" data-action="crew-gear-up" data-id="' + def.id + '"' + (gearAfford ? '' : ' disabled') + '>' + (gearAfford ? '升级工具' : '材料不足') + '</button>' :
            '<p class="crew-gear-max">工具已满级 · 稀有概率 +3%</p>') + '</div>';
      }
      html += '<article class="crew-card' + stateClass + '">' +
        '<div class="crew-photo"><img src="' + def.iconImg + '" alt=""><span>' + def.role + '</span><em class="crew-level">Lv.' + level + '</em><button class="img-detail" data-action="crew-detail" data-id="' + def.id + '" aria-label="查看 ' + def.name + ' 档案">i</button></div>' +
        '<div class="crew-copy"><div class="crew-name"><b>' + def.name + '</b><em>' + timer + '</em></div><p>' + def.desc + '</p>' +
          '<div class="crew-mastery"><span>熟练度 ' + (nextXp ? xp + ' / ' + nextXp : 'MAX') + '</span><i><b style="width:' + (xpPct * 100).toFixed(0) + '%"></b></i></div>' +
          '<div class="crew-reward">' + (mastery > 0 ? 'M Lv.' + level + ' · 产出 +' + mastery + '%' : '') + (gearLv ? ' · 工具 +' + (gearLv * 8) + '%' : '') + (mastery > 0 || gearLv ? '<br>' : '') + rewardText + '</div></div>' +
        '<div class="crew-action">' + btn + '<button class="crew-gear-btn" data-action="crew-gear" data-id="' + def.id + '">' + def.gearName + ' · Lv.' + gearLv + '</button>' + gearPanel + '</div>' +
      '</article>';
    }
    html += '</div><p class="crew-foot">收获会进入仓库；仓库满时材料按报价折算成打捞币。作业只在避难所开启时推进，关闭页面会暂停。</p>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.crewTimeText = function (ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  Hub.prototype.renderTaskChain = function () {
    var chain = clamp(Math.floor(Number(this.data.taskChain) || 0), 0, 6);
    var msg;
    if (chain >= 6) msg = '环线全开 · 本局 +20% 打捞币；下一次任务会重置';
    else if (chain >= 3) msg = '再完成 ' + (6 - chain) + ' 种新任务到达 +20% · 重复本环线任务会重置';
    else msg = '再完成 ' + (3 - chain) + ' 种新任务到达 +10% · 重复本环线任务会重置';
    var pips = '';
    for (var i = 0; i < 6; i++) pips += '<i class="' + (i < chain ? 'on' : '') + '"></i>';
    return '<div class="chain-card"><div class="chain-head"><span>ROUTE LINK · 环线连携</span><b>' + chain + ' / 6</b></div>' +
      '<p>' + msg + '</p><div class="chain-pips">' + pips + '</div></div>';
  };

  Hub.prototype.missionById = function (id) {
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i];
    return null;
  };

  Hub.prototype.rotateMission = function (finishedId) {
    if (!Array.isArray(this.data.activeMissions) || !Array.isArray(this.data.candidateMissions)) return;
    var at = this.data.activeMissions.indexOf(finishedId);
    if (at < 0) return;
    this.data.activeMissions.splice(at, 1);
    this.data.candidateMissions.push(finishedId);
    if (this.data.candidateMissions.length) this.data.activeMissions.push(this.data.candidateMissions.shift());
  };

  Hub.prototype.promoteMission = function (id) {
    if (!Array.isArray(this.data.candidateMissions) || this.data.candidateMissions.indexOf(id) < 0) return;
    if (!Array.isArray(this.data.activeMissions)) this.data.activeMissions = [];
    var outgoing = this.data.activeMissions.pop();
    this.data.candidateMissions.splice(this.data.candidateMissions.indexOf(id), 1);
    this.data.activeMissions.push(id);
    if (outgoing) this.data.candidateMissions.push(outgoing);
  };

  Hub.prototype.renderTrackCard = function () {
    var id = this.data.trackedCollection;
    var def = id ? CW.COLLECTIBLE_MAP[id] : null;
    if (!def) return '';
    var count = def.special === 'filter' ? (this.data.filters || 0) : def.special === 'material' ? (this.data.specials[id] || 0) : (this.data.collectibles[id] || 0);
    var sources = this.collectibleSources(id);
    var buttons = '';
    for (var i = 0; i < sources.length; i++) {
      var m = null;
      for (var mi = 0; mi < MISSIONS.length; mi++) if (MISSIONS[mi].id === sources[i]) m = MISSIONS[mi];
      if (m) buttons += '<button data-action="track-source" data-mission="' + m.id + '">' + m.name + '</button>';
    }
    return '<div class="track-card" style="--rarity:' + CW.COLLECTIBLE_RARITY_MAP[def.rarity].color + '"><img src="' + def.icon + '" alt=""><div class="track-copy"><span>ARCHIVE TRACK · 正在追踪</span><b>' + def.name + ' · ' + (count ? '已发现 ×' + count : '未发现') + '</b><p>从这些打捞点更容易带回它</p><div class="track-sources">' + buttons + '</div></div><button class="track-off" data-action="collectible-track" data-id="' + id + '">取消</button></div>';
  };

  Hub.prototype.renderTasks = function () {
    var html = this.renderDailyCard() + this.renderTaskChain() + this.renderTrackCard() + '<div class="mission-list">';
    var activeIds = Array.isArray(this.data.activeMissions) ? this.data.activeMissions : [];
    for (var i = 0; i < activeIds.length; i++) {
      var m = this.missionById(activeIds[i]);
      if (!m) continue;
      var best = this.data.best[m.id] || 0;
      var tags = m.tags.slice();
      if (m.id === 'trawl' || m.id === 'dive') tags[0] = '45 秒';
      else if (m.id === 'stack') tags[0] = '6 箱';
      else if (m.id === 'hook' || m.stat === 'time') tags[0] = this.hookTime() + ' 秒';
      if (m.id === 'match') tags[0] = this.matchMoves() + ' 步';
      if (m.id === 'sonar') tags[0] = this.sonarProbes() + ' 次声呐';
      html += '<article class="mission-card">' +
        '<div class="mission-icon' + (m.id === 'match' ? ' match' : '') + '"><img src="' + m.iconImg + '" alt=""><button class="img-detail" data-action="mission-detail" data-id="' + m.id + '" aria-label="查看 ' + m.name + ' 详情">i</button></div>' +
        '<div class="mission-copy">' +
          '<span class="mission-kicker">' + m.kicker + '</span>' +
          '<div class="mission-name">' + m.name +
            (this.data.grades[m.id] ? ' <span class="mission-grade grade-' + this.data.grades[m.id].toLowerCase() + '">' + this.data.grades[m.id] + '</span>' : '') +
            ' <span class="mission-best">最佳 ' + fmt(best) + '</span></div>' +
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
      case 'chips': return Math.max(0, Number((result.runMaterials || result.materials) && (result.runMaterials || result.materials).chip) || 0);
      case 'glass': return Math.max(0, Number((result.runMaterials || result.materials) && (result.runMaterials || result.materials).glass) || 0);
      case 'copper': return Math.max(0, Number((result.runMaterials || result.materials) && (result.runMaterials || result.materials).copper) || 0);
      case 'cutCuts': return Math.max(0, Number(result.cuts) || 0);
      case 'sortCorrect': return Math.max(0, Number(result.correct) || 0);
      case 'beaconRounds': return Math.max(0, Number(result.rounds) || 0);
      case 'trawlRuns': return result.type === 'trawl' ? 1 : 0;
      case 'diveRuns': return result.type === 'dive' ? 1 : 0;
      case 'stackRuns': return result.type === 'stack' ? 1 : 0;
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
      var item = CW.COLLECTIBLES[i];
      if (item.special === 'filter') {
        if ((this.data.filters || 0) > 0) n++;
      } else if (item.special === 'material') {
        if ((this.data.specials || {})[item.id] > 0) n++;
      } else if ((this.data.collectibles || {})[item.id] > 0) n++;
    }
    return n;
  };

  Hub.prototype.collectibleRarityAvailable = function (rarity) {
    var n = 0;
    var map = this.data.collectibles || {};
    var equipped = this.data.equipped || [];
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      var item = CW.COLLECTIBLES[i];
      if (item.special || item.rarity !== rarity) continue;
      if (equipped.indexOf(item.id) >= 0) continue;
      n += map[item.id] || 0;
    }
    return n;
  };

  Hub.prototype.consumeCollectibleRarity = function (rarity, amount) {
    var need = Math.max(0, Math.floor(Number(amount) || 0));
    if (!need) return true;
    var map = this.data.collectibles || {};
    var equipped = this.data.equipped || [];
    var pool = [];
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      var item = CW.COLLECTIBLES[i];
      if (item.special || item.rarity !== rarity) continue;
      if (equipped.indexOf(item.id) >= 0) continue;
      var count = map[item.id] || 0;
      if (count <= 0) continue;
      pool.push({ id: item.id, count: count });
    }
    var total = 0;
    for (var p = 0; p < pool.length; p++) total += pool[p].count;
    if (total < need) return false;
    pool.sort(function (a, b) { return b.count - a.count; });
    for (var q = 0; q < pool.length && need > 0; q++) {
      var used = Math.min(need, pool[q].count);
      map[pool[q].id] -= used;
      if (map[pool[q].id] <= 0) delete map[pool[q].id];
      need -= used;
    }
    return true;
  };

  Hub.prototype.collectionMilestoneClaimed = function (count) {
    return (this.data.collectionMilestones || []).indexOf(count) >= 0;
  };

  Hub.prototype.claimCollectionMilestone = function (count) {
    var def = null;
    for (var i = 0; i < COLLECTION_MILESTONES.length; i++) if (COLLECTION_MILESTONES[i].count === count) def = COLLECTION_MILESTONES[i];
    if (!def || this.collectionMilestoneClaimed(count) || this.collectionUnique() < count) return;
    var gained = this.grantContractReward({ credits: def.credits, mats: def.mats });
    if (def.filters) this.data.filters = (this.data.filters || 0) + def.filters;
    this.data.collectionMilestones.push(count);
    this.audio.claim();
    this.showToast('ARCHIVE REWARD', '图鉴里程碑 · ' + count + ' 件', '+' + fmt(gained.credits) + ' 打捞币 · 材料已入库' + (def.filters ? ' · 过滤器 +1' : ''));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.collectionTotal = function () {
    var n = this.data.filters || 0;
    var map = this.data.collectibles || {};
    for (var id in map) {
      if (Object.prototype.hasOwnProperty.call(map, id)) n += map[id];
    }
    for (var sid in this.data.specials) {
      if (Object.prototype.hasOwnProperty.call(this.data.specials, sid)) n += this.data.specials[sid];
    }
    return n;
  };

  Hub.prototype.collectionDuplicateStats = function () {
    var map = this.data.collectibles || {};
    var count = 0;
    var value = 0;
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      var item = CW.COLLECTIBLES[i];
      if (item.special) continue;
      var spare = Math.max(0, (map[item.id] || 0) - 1);
      if (!spare) continue;
      count += spare;
      value += spare * (AUCTION_PRICES[item.rarity] || 0);
    }
    return { count: count, value: value };
  };

  Hub.prototype.auctionDuplicates = function () {
    var stats = this.collectionDuplicateStats();
    if (!stats.count) {
      this.audio.warn();
      this.showToast('AUCTION EMPTY', '没有重复收藏', '每件藏品至少保留 1 份');
      return;
    }
    var map = this.data.collectibles || {};
    var gained = 0;
    var sold = 0;
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      var item = CW.COLLECTIBLES[i];
      if (item.special) continue;
      var spare = Math.max(0, (map[item.id] || 0) - 1);
      if (!spare) continue;
      var price = AUCTION_PRICES[item.rarity] || 0;
      map[item.id] -= spare;
      sold += spare;
      gained += spare * price;
    }
    this.data.credits += gained;
    this.collectionCleanupEquipped();
    this.audio.claim();
    this.showToast('AUCTION COMPLETE', '拍卖 ' + sold + ' 件重复收藏', '+' + fmt(gained) + ' 打捞币 · 每件保留 1 份');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.collectionRarityCount = function (rarity) {
    var n = 0;
    var map = this.data.collectibles || {};
    for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
      if (CW.COLLECTIBLES[i].special) continue;
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

  Hub.prototype.setRewardClaimed = function (setId) {
    return (this.data.setRewards || []).indexOf(setId) >= 0;
  };

  Hub.prototype.claimSetReward = function (setId) {
    var set = null;
    for (var i = 0; i < CW.COLLECTION_SETS.length; i++) if (CW.COLLECTION_SETS[i].id === setId) set = CW.COLLECTION_SETS[i];
    if (!set || !set.reward || this.setRewardClaimed(setId)) return;
    if (!this.collectionSetActive(set)) {
      this.audio.warn();
      this.showToast('SET INCOMPLETE', set.name + ' 尚未集齐', '集齐 ' + set.items.length + ' 件后可领取');
      return;
    }
    var gained = this.grantContractReward({ credits: set.reward.credits, mats: set.reward.mats });
    if (set.reward.filters) this.data.filters = (this.data.filters || 0) + set.reward.filters;
    this.data.setRewards.push(setId);
    this.audio.claim();
    this.showToast('SET COMPLETE', set.name + ' · 套装奖励', '+' + fmt(gained.credits) + ' 打捞币 · 材料已入库' + (set.reward.filters ? ' · 过滤器 +1' : ''));
    this.saveGame();
    this.updateUI();
    this.renderPanel();
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
      if (!def || def.special) continue;
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

  Hub.prototype.sellMaterials = function (qty) {
    qty = Math.max(1, Math.floor(Number(qty) || 10));
    var left = qty;
    var gained = 0;
    var sold = 0;
    var order = MATERIALS.slice().sort(function (a, b) {
      return (this.data.materials[b.id] || 0) - (this.data.materials[a.id] || 0);
    }.bind(this));
    for (var i = 0; i < order.length && left > 0; i++) {
      var m = order[i];
      var have = this.data.materials[m.id] || 0;
      var take = Math.min(left, have);
      if (take <= 0) continue;
      this.data.materials[m.id] -= take;
      left -= take;
      sold += take;
      gained += take * m.sell;
    }
    if (!sold) {
      this.audio.warn();
      this.showToast('WAREHOUSE EMPTY', '没有可回收的物资', '先去打捞一趟');
      return;
    }
    this.data.credits += gained;
    this.audio.claim();
    this.showToast('MATERIALS RECYCLED', '回收 ' + sold + ' 件物资', '+' + fmt(gained) + ' 打捞币 · 仓库空出 ' + sold + ' 格');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.marketUrgent = function (tick) {
    var t = tick === undefined ? marketTick() : tick;
    var win = Math.floor(t / MARKET_URGENT_TICKS);
    var r1 = (marketHash('urgent:a:' + win) % 10000) / 10000;
    var r2 = (marketHash('urgent:b:' + win) % 10000) / 10000;
    var r3 = (marketHash('urgent:c:' + win) % 10000) / 10000;
    var isCollectible = r1 < 0.38;
    var def = null;
    var quote = null;
    var qty = 1;
    if (isCollectible) {
      var pool = [];
      for (var i = 0; i < CW.COLLECTIBLES.length; i++) if (!CW.COLLECTIBLES[i].special) pool.push(CW.COLLECTIBLES[i]);
      def = pool[(r2 * pool.length) | 0];
      quote = this.marketCollectibleQuote(def, t);
      qty = 1;
    } else {
      def = MATERIALS[(r2 * MATERIALS.length) | 0];
      quote = this.marketMaterialQuote(def.id, t);
      qty = 3 + Math.floor(r3 * 4);
    }
    var streak = this.data.urgentLastWin === win - 1 ? (this.data.urgentStreak || 0) : 0;
    var rawMult = 0.93 + r3 * 0.04 + streak * 0.02;
    var unit = Math.max(1, Math.min(Math.round(quote.price * 1.04), Math.round(quote.price * rawMult)));
    var until = (win + 1) * MARKET_URGENT_TICKS * MARKET_TICK_MS;
    return {
      win: win, kind: isCollectible ? 'collectible' : 'material',
      id: def.id, name: def.name, icon: def.iconImg || def.icon, qty: qty,
      unit: unit, total: unit * qty, remaining: Math.max(0, until - Date.now()),
      done: !!this.data.urgentDone[win], quote: quote, streak: streak
    };
  };

  Hub.prototype.fulfillUrgent = function () {
    var urgent = this.marketUrgent();
    if (!urgent || urgent.done) return;
    var have = urgent.kind === 'material' ? (this.data.materials[urgent.id] || 0) : (this.data.collectibles[urgent.id] || 0);
    if (have < urgent.qty) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '急单数量不足', '需要 ' + urgent.qty + ' × ' + urgent.name);
      return;
    }
    if (urgent.kind === 'material') {
      this.data.materials[urgent.id] -= urgent.qty;
    } else {
      this.data.collectibles[urgent.id] -= urgent.qty;
      if (this.data.collectibles[urgent.id] <= 0) delete this.data.collectibles[urgent.id];
      if (!(this.data.collectibles[urgent.id] > 0)) {
        var at = this.data.equipped.indexOf(urgent.id);
        if (at >= 0) this.data.equipped.splice(at, 1);
      }
    }
    this.data.credits += urgent.total;
    this.data.stats.urgentOrders = (this.data.stats.urgentOrders || 0) + 1;
    this.data.urgentStreak = this.data.urgentLastWin === urgent.win - 1 ? (this.data.urgentStreak || 0) + 1 : 1;
    this.data.urgentLastWin = urgent.win;
    this.data.urgentDone[String(urgent.win)] = true;
    this.audio.claim();
    this.showToast('URGENT DELIVERY', '码头急单完成', '+' + fmt(urgent.total) + ' 打捞币');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.marketScarcityCount = function (id, tick) {
    var t = tick === undefined ? marketTick() : tick;
    var win = Math.floor(t / MARKET_URGENT_TICKS);
    var pressure = this.data.marketPressure || { win: -1, counts: {} };
    if (pressure.win !== win || !pressure.counts) return 0;
    return Math.max(0, Math.floor(Number(pressure.counts[id]) || 0));
  };

  Hub.prototype.marketMaterialQuote = function (id, tick) {
    var base = MARKET_MATERIAL_BASE[id] || 10;
    var t = tick === undefined ? marketTick() : tick;
    var price = Math.round(base * marketMultiplier('mat:' + id, t));
    var pressure = this.marketScarcityCount(id, t);
    var scarcity = 1 + Math.min(3, pressure * 0.25);
    return {
      price: price,
      buy: Math.round(price * (1 + MARKET_FEE_BUY) * scarcity),
      sell: Math.round(price * (1 - MARKET_FEE_SELL)),
      prev: Math.round(base * marketMultiplier('mat:' + id, t - 1)),
      pressure: pressure,
      scarcityPct: Math.round((scarcity - 1) * 100)
    };
  };

  Hub.prototype.marketCollectibleQuote = function (def, tick) {
    var base = MARKET_COLLECTIBLE_BASE[def.rarity] || 200;
    var t = tick === undefined ? marketTick() : tick;
    var price = Math.round(base * marketMultiplier('col:' + def.id, t));
    return {
      price: price,
      buy: Math.round(price * (1 + MARKET_FEE_BUY)),
      sell: Math.round(price * (1 - MARKET_FEE_SELL)),
      prev: Math.round(base * marketMultiplier('col:' + def.id, t - 1))
    };
  };

  Hub.prototype.collectibleSources = function (id) {
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def) return [];
    if (id === 'seawater-filter') return ['hook', 'sonar'];
    if (def.special) return ['hook', 'match'];
    return ['hook', 'match', 'sonar', 'trawl'];
  };

  Hub.prototype.trackCollectible = function (id) {
    if (!CW.COLLECTIBLE_MAP[id]) return;
    this.data.trackedCollection = this.data.trackedCollection === id ? '' : id;
    this.audio.tab();
    if (this.data.trackedCollection) this.showToast('ARCHIVE TRACKED', '正在追踪 · ' + CW.COLLECTIBLE_MAP[id].name, '任务页会标出能带回它的打捞点');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    if (this.dom.collectibleModal && !this.dom.collectibleModal.classList.contains('hidden')) this.openCollectibleDetail(id);
  };

  Hub.prototype.openStoryDetail = function (kind, id) {
    if (!this.dom.storyModal) return;
    var title = '', kicker = '', icon = '', tags = '', paras = [], actions = '';
    if (kind === 'mission') {
      var m = this.missionById(id);
      if (!m) return;
      title = m.name;
      kicker = m.kicker + ' · MISSION FILE';
      icon = m.iconImg;
      tags = m.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('');
      paras = CW.MISSION_LORE[id] || [m.desc];
      var best = this.data.best[id] || 0;
      var grade = this.data.grades[id] || '—';
      paras = paras.slice();
      actions = this.arcade && this.arcade.active ?
        '<button class="story-action" data-action="story-close">返回简报</button>' :
        '<button class="story-action primary" data-action="story-start-mission" data-mission="' + id + '">开始打捞</button><button class="story-action" data-action="story-close">关闭</button>';
      tags += '<span>最佳 ' + fmt(best) + '</span><span>评级 ' + grade + '</span>';
    } else if (kind === 'crew') {
      var c = crewDef(id);
      if (!c) return;
      title = c.name;
      kicker = 'CREW FILE · ' + c.role;
      icon = c.iconImg;
      tags = '<span>熟练度 Lv.' + this.crewLevel(id) + '</span><span>' + c.gearName + ' Lv.' + this.crewGearLevel(id) + '</span><span>' + c.desc + '</span>';
      paras = CW.CREW_LORE[id] || [c.desc];
      actions = '<button class="story-action" data-action="story-close">关闭</button>';
    } else if (kind === 'upgrade') {
      var u = null;
      for (var ui = 0; ui < UPGRADES.length; ui++) if (UPGRADES[ui].id === id) u = UPGRADES[ui];
      if (!u) return;
      title = u.name;
      kicker = 'FACILITY FILE · 设施档案';
      icon = u.iconImg || 'assets/real/workshop.webp';
      tags = '<span>Lv.' + (this.data.upgrades[id] || 0) + ' / ' + u.max + '</span><span>' + u.desc + '</span>';
      paras = [CW.UPGRADE_LORE[id] || u.desc];
      actions = '<button class="story-action" data-action="story-close">关闭</button>';
    } else return;
    var body = '<div class="story-detail"><div class="story-hero"><img src="' + icon + '" alt=""><span>' + kicker + '</span></div><div class="story-copy"><p class="story-kicker">SUNKEN COAST · 档案记录</p><h3>' + title + '</h3><div class="story-tags">' + tags + '</div><div class="story-text">' + paras.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div><div class="story-actions">' + actions + '</div></div></div>';
    this.dom.storyBody.innerHTML = body;
    this.dom.storyModal.classList.remove('hidden');
    this.dom.storyModal.setAttribute('aria-hidden', 'false');
    this.audio.tab();
  };

  Hub.prototype.closeStoryDetail = function () {
    if (!this.dom.storyModal) return;
    this.dom.storyModal.classList.add('hidden');
    this.dom.storyModal.setAttribute('aria-hidden', 'true');
  };

  Hub.prototype.openCollectibleDetail = function (id) {
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def || !this.dom.collectibleModal) return;
    var rarity = CW.COLLECTIBLE_RARITY_MAP[def.rarity];
    var count = def.special === 'filter' ? (this.data.filters || 0) : def.special === 'material' ? (this.data.specials[id] || 0) : (this.data.collectibles[id] || 0);
    var isSpecial = !!def.special;
    var equipped = !isSpecial && this.data.equipped.indexOf(id) >= 0;
    var relic = CW.COLLECTIBLE_RELICS[id];
    var set = null;
    for (var i = 0; i < CW.COLLECTION_SETS.length; i++) {
      if (CW.COLLECTION_SETS[i].items.indexOf(id) >= 0) { set = CW.COLLECTION_SETS[i]; break; }
    }
    var uses = [];
    if (id === 'seawater-filter') uses.push('净水舱升级');
    for (var s = 1; s < SHELTER_LEVELS.length; s++) {
      var req = SHELTER_LEVELS[s];
      if (req && req.specials && req.specials[id]) uses.push('避难所 Lv.' + req.level + ' 升级');
    }
    if (!isSpecial) {
      for (var ui = 0; ui < UPGRADES.length; ui++) {
        var uu = UPGRADES[ui];
        for (var ci = 0; ci < uu.costs.length; ci++) {
          var uc = uu.costs[ci];
          if (uc.rarities && uc.rarities[def.rarity]) {
            var useName = uu.name + ' Lv.' + (ci + 1);
            if (uses.indexOf(useName) < 0) uses.push(useName);
          }
        }
      }
    }
    var source = isSpecial ? '来源：抓钩的沉船秘宝 / 黄金宝箱，或三消高分深海馈赠' : '来源：抓钩、三消、声呐、拖网等打捞结算';
    var tracked = this.data.trackedCollection === id;
    var actions = '<button class="detail-action' + (tracked ? ' tracking' : '') + '" data-action="collectible-track" data-id="' + id + '">' + (tracked ? '取消追踪' : '追踪这件') + '</button>';
    if (count > 0 && !isSpecial) {
      actions += '<button class="detail-action primary" data-action="equip-collectible" data-id="' + id + '">' + (equipped ? '从档案卸下' : '装备到档案') + '</button>';
    }
    actions += '<button class="detail-action" data-action="collectible-close">关闭</button>';
    var html = '<div class="collectible-detail' + (count ? '' : ' unknown') + '" style="--rarity:' + rarity.color + '">' +
      '<div class="collectible-detail-hero"><img src="' + def.icon + '" alt=""><span class="detail-rarity">' + rarity.name + '</span><span class="detail-count">' + (count ? '拥有 ×' + count : '未发现') + '</span></div>' +
      '<div class="collectible-detail-copy"><p class="detail-kicker">SUNKEN ARCHIVE · 收藏详情</p><h3>' + def.name + '</h3>' +
        '<p class="detail-desc">' + (count ? def.desc : '档案里只有一张模糊的照片。继续打捞或完成小游戏，才能看清它。') + '</p>' +
        '<div class="detail-chips"><span>' + rarity.name + '</span><span>' + (equipped ? '已装备' : isSpecial ? (id === 'seawater-filter' ? '净水核心' : '稀有升级件') : '可装备') + '</span>' + (tracked ? '<span>追踪中</span>' : '') + (set ? '<span>' + set.name + ' ' + this.collectionSetOwned(set) + '/' + set.items.length + '</span>' : '') + '</div>' +
        ((CW.COLLECTIBLE_LORE && CW.COLLECTIBLE_LORE[id]) ? '<div class="detail-block detail-lore"><b>档案记录</b>' + CW.COLLECTIBLE_LORE[id].map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' : '') +
        (uses.length ? '<div class="detail-block"><b>用途</b><p>' + uses.join(' · ') + '</p></div>' : '') +
        (!isSpecial && relic ? '<div class="detail-block"><b>档案效果</b><p>' + relic.label + (equipped ? ' · 当前生效' : '') + '</p></div>' : '') +
        (set ? '<div class="detail-block"><b>套装</b><p>' + set.desc + ' · ' + set.bonusText + '</p></div>' : '') +
        '<div class="detail-block source"><b>获取</b><p>' + source + '</p></div>' +
        '<div class="detail-actions">' + actions + '</div>' +
      '</div></div>';
    this.dom.collectibleBody.innerHTML = html;
    this.dom.collectibleModal.classList.remove('hidden');
    this.dom.collectibleModal.setAttribute('aria-hidden', 'false');
    this.audio.tab();
  };

  Hub.prototype.closeCollectibleDetail = function () {
    if (!this.dom.collectibleModal) return;
    this.dom.collectibleModal.classList.add('hidden');
    this.dom.collectibleModal.setAttribute('aria-hidden', 'true');
  };

  Hub.prototype.openMarketModal = function (html) {
    if (!this.dom.marketModal) return;
    this.dom.marketModal.classList.remove('hidden');
    this.dom.marketModal.setAttribute('aria-hidden', 'false');
    this.dom.marketBody.innerHTML = html;
  };

  Hub.prototype.closeMarketModal = function () {
    if (this.marketBusy) return;
    for (var i = 0; i < this.marketTimers.length; i++) clearTimeout(this.marketTimers[i]);
    this.marketTimers = [];
    if (this.dom.marketModal) {
      this.dom.marketModal.classList.remove('locked');
      this.dom.marketModal.classList.add('hidden');
      this.dom.marketModal.setAttribute('aria-hidden', 'true');
    }
  };

  Hub.prototype.marketTimer = function (fn, ms) {
    var self = this;
    var t = setTimeout(function () { fn.call(self); }, ms);
    this.marketTimers.push(t);
    return t;
  };

  Hub.prototype.openMarketListing = function (id) {
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def || def.special || (this.data.collectibles[id] || 0) < 1) return;
    var quote = this.marketCollectibleQuote(def);
    var opts = [
      { mult: 0.85, label: '快速出手', chance: '约 92%' },
      { mult: 1.0, label: '随行就市', chance: '约 78%' },
      { mult: 1.2, label: '小幅溢价', chance: '约 55%' },
      { mult: 1.5, label: '愿者上钩', chance: '约 32%' }
    ];
    var html = '<p class="market-modal-kicker">CONSIGNMENT · 挂单</p><h3>' + def.name + '</h3><p class="market-modal-copy">当前行情参考 <b>' + fmt(quote.price) + '</b> 打捞币。挂牌费 4%，成交再扣 8% 交易费。</p><div class="market-list-options">';
    for (var i = 0; i < opts.length; i++) {
      var ask = Math.round(quote.price * opts[i].mult);
      var fee = Math.max(10, Math.round(ask * MARKET_FEE_LIST));
      html += '<button class="market-list-option" data-action="market-list-confirm" data-id="' + id + '" data-mult="' + opts[i].mult + '">' +
        '<b>' + opts[i].label + '</b><span>标价 ' + fmt(ask) + '</span><em>挂牌费 ' + fmt(fee) + ' · 成交' + opts[i].chance + '</em></button>';
    }
    html += '</div>';
    this.openMarketModal(html);
  };

  Hub.prototype.confirmMarketListing = function (id, mult) {
    if (this.marketBusy) return;
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def || def.special || (this.data.collectibles[id] || 0) < 1) return;
    mult = Number(mult) || 1;
    var quote = this.marketCollectibleQuote(def);
    var ask = Math.round(quote.price * mult);
    var fee = Math.max(10, Math.round(ask * MARKET_FEE_LIST));
    if (this.data.credits < fee) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '打捞币不足', '挂牌费需要 ' + fmt(fee));
      return;
    }
    this.data.credits -= fee;
    this.marketBusy = true;
    this.dom.marketModal.classList.add('locked');
    this.openMarketModal('<p class="market-modal-kicker">MATCHING · 撮合中</p><h3>' + def.name + '</h3><div class="market-progress"><i></i></div><p class="market-modal-copy">经纪人正在联系码头买家… 标价 <b>' + fmt(ask) + '</b>，挂牌费 ' + fmt(fee) + ' 已支付。</p>');
    this.renderPanel();
    this.marketTimer(function () {
      var chance = mult <= 0.9 ? 0.92 : mult <= 1.05 ? 0.78 : mult <= 1.25 ? 0.55 : 0.32;
      var sold = Math.random() < chance;
      var net = 0;
      if (sold) {
        var tradeFee = Math.max(10, Math.round(ask * MARKET_FEE_SELL));
        net = Math.max(0, ask - tradeFee);
        this.data.collectibles[id] -= 1;
        if (this.data.collectibles[id] <= 0) delete this.data.collectibles[id];
        this.collectionCleanupEquipped();
        this.data.credits += net;
        this.saveGame();
        this.updateUI();
        this.renderPanel();
        this.audio.claim();
        this.showToast('MARKET SOLD', def.name + ' 已挂单成交', '+' + fmt(net) + ' 打捞币 · 含交易费');
      } else {
        this.saveGame();
        this.audio.warn();
        this.showToast('NO BUYER', def.name + ' 暂无人接手', '藏品保留 · 挂牌费 ' + fmt(fee) + ' 已消耗');
      }
      this.marketBusy = false;
      this.dom.marketModal.classList.remove('locked');
      this.openMarketModal('<p class="market-modal-kicker">CONSIGNMENT RESULT</p><h3>' + (sold ? '成交' : '流拍') + '</h3><p class="market-modal-copy">' + (sold ? '成交价 <b>' + fmt(ask) + '</b>，到手 <b>' + fmt(net) + '</b>。' : '没有买家接受这个价格，' + def.name + ' 已退回档案。') + '</p><div class="market-modal-actions"><button class="btn primary" data-action="market-modal-close">返回集市</button></div>');
    }, 1800);
  };

  Hub.prototype.openMarketAuction = function (id) {
    if (this.marketBusy) return;
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def || def.special || (this.data.collectibles[id] || 0) < 1) return;
    var quote = this.marketCollectibleQuote(def);
    var gross = Math.round(quote.price * (0.35 + Math.random() * 1.75));
    var fee = Math.round(gross * MARKET_FEE_AUCTION);
    var net = Math.max(0, gross - fee);
    var names = ['戴草帽的船长', '码头会计', '玻璃眼商人', '灯塔守夜人'];
    this.marketBusy = true;
    this.dom.marketModal.classList.add('locked');
    this.openMarketModal('<p class="market-modal-kicker">LIVE AUCTION · 实时拍卖</p><h3>' + def.name + '</h3><p class="market-modal-copy">行情参考 <b>' + fmt(quote.price) + '</b> · 拍卖成交后扣 8% 佣金。叫价可能很高，也可能很低。</p><div class="auction-stage"><div class="auction-price" id="auction-price">' + fmt(Math.round(gross * 0.35)) + '</div><div class="auction-bids" id="auction-bids"></div></div><div class="market-progress"><i></i></div>');
    var steps = 4;
    for (var s = 0; s < steps; s++) {
      (function (step) {
        this.marketTimer(function () {
          var bid = Math.round(gross * (0.35 + 0.65 * (step + 1) / steps));
          var priceEl = document.getElementById('auction-price');
          var bidsEl = document.getElementById('auction-bids');
          if (priceEl) priceEl.textContent = fmt(bid);
          if (bidsEl) {
            var row = document.createElement('div');
            row.className = 'auction-bid';
            row.innerHTML = '<b>' + names[step % names.length] + '</b><span>' + fmt(bid) + '</span>';
            bidsEl.appendChild(row);
            while (bidsEl.children.length > 3) bidsEl.removeChild(bidsEl.firstChild);
          }
          this.audio.matchLine(step + 2);
        }, 650 * (step + 1));
      }).call(this, s);
    }
    this.marketTimer(function () {
      this.data.collectibles[id] -= 1;
      if (this.data.collectibles[id] <= 0) delete this.data.collectibles[id];
      this.collectionCleanupEquipped();
      this.data.credits += net;
      this.marketBusy = false;
      this.dom.marketModal.classList.remove('locked');
      this.saveGame();
      this.updateUI();
      this.renderPanel();
      this.audio.claim();
      this.showToast('AUCTION SOLD', def.name + ' 拍卖成交', '成交 ' + fmt(gross) + ' · 到手 ' + fmt(net));
      this.openMarketModal('<p class="market-modal-kicker">AUCTION HAMMER · 落槌</p><h3>' + fmt(gross) + '</h3><p class="market-modal-copy">' + def.name + ' 成交，佣金 8%（' + fmt(fee) + '），实际到手 <b>' + fmt(net) + '</b> 打捞币。</p><div class="market-modal-actions"><button class="btn primary" data-action="market-modal-close">返回集市</button></div>');
    }, 650 * (steps + 1) + 350);
  };

  Hub.prototype.renderMarket = function () {
    var tick = marketTick();
    var remain = Math.max(0, Math.ceil((MARKET_TICK_MS - (Date.now() % MARKET_TICK_MS)) / 1000));
    var html = this.warehouseSwitch() +
      '<div class="market-head"><div class="market-title"><span>OPEN MARKET · 自由集市</span><b>价格每 20 秒大幅波动</b><p>买入含 5% 手续费，卖出扣 8%；挂单与拍卖另计。</p></div><div class="market-clock"><span>下次刷新</span><b id="market-clock-val">' + remain + 's</b></div></div>' +
      '<div class="market-switch"><button class="' + (this.marketTab === 'collectibles' ? '' : 'active') + '" data-action="market-tab" data-view="materials">材料行情</button><button class="' + (this.marketTab === 'collectibles' ? 'active' : '') + '" data-action="market-tab" data-view="collectibles">藏品行情</button></div>';
    var urgent = this.marketUrgent(tick);
    var urgentHave = urgent.kind === 'material' ? (this.data.materials[urgent.id] || 0) : (this.data.collectibles[urgent.id] || 0);
    var urgentSecs = Math.max(0, Math.ceil(urgent.remaining / 1000));
    var urgentStreakText = urgent.streak > 0 ? '连续 ' + urgent.streak + ' 单 · ' : '';
    html += '<div class="market-urgent' + (urgent.done ? ' done' : '') + '"><img src="' + urgent.icon + '" alt=""><div class="market-urgent-copy"><span>DOCK ORDER · 码头急单</span><b>' + (urgent.done ? '本单已交付' : '收购 ' + urgent.qty + ' × ' + urgent.name) + '</b><p>' + (urgent.done ? '下一单即将刷新 · ' : urgentStreakText + '净价 ' + fmt(urgent.unit) + '/件 · ') + '剩余 <em id="market-urgent-val">' + urgentSecs + '</em>s · 持有 ' + urgentHave + '</p></div>' +
      '<button data-action="market-urgent"' + (urgent.done || urgentHave < urgent.qty ? ' disabled' : '') + '>' + (urgent.done ? '已交付' : urgentHave < urgent.qty ? '数量不足' : '交付 · +' + fmt(urgent.total)) + '</button></div>';
    if (this.marketTab === 'collectibles') {
      html += '<div class="market-note">买下藏品会直接进入档案；挂单按你定的价格撮合，拍卖则可能捡漏也可能砸价。</div><div class="market-items">';
      for (var i = 0; i < CW.COLLECTIBLES.length; i++) {
        var item = CW.COLLECTIBLES[i];
        if (item.special) continue;
        var quote = this.marketCollectibleQuote(item, tick);
        var owned = (this.data.collectibles[item.id] || 0);
        var trend = quote.buy - Math.round((quote.prev || quote.price) * (1 + MARKET_FEE_BUY));
        var trendPct = Math.round((quote.buy / Math.max(1, Math.round((quote.prev || quote.price) * (1 + MARKET_FEE_BUY))) - 1) * 100);
        html += '<article class="market-item" style="--rarity:' + CW.COLLECTIBLE_RARITY_MAP[item.rarity].color + '">' +
          '<div class="market-item-head"><img src="' + item.icon + '" alt=""><div><b>' + item.name + '</b><span>' + CW.COLLECTIBLE_RARITY_MAP[item.rarity].name + ' · 持有 ' + owned + '</span></div></div>' +
          '<div class="market-quote"><span>买入 <b>' + fmt(quote.buy) + '</b></span><span>卖出 <b>' + fmt(quote.sell) + '</b></span><em class="' + (trendPct >= 0 ? 'up' : 'down') + '">' + (trendPct >= 0 ? '↑' : '↓') + Math.abs(trendPct) + '%</em></div>' +
          '<div class="market-actions"><button class="market-buy" data-action="market-buy-collectible" data-id="' + item.id + '"' + (this.data.credits < quote.buy ? ' disabled' : '') + '>买入</button>' +
            (owned > 0 ? '<button class="market-list" data-action="market-list" data-id="' + item.id + '">挂单</button><button class="market-auction" data-action="market-auction" data-id="' + item.id + '">拍卖</button>' : '') +
          '</div></article>';
      }
      html += '</div>';
    } else {
      html += '<div class="market-note">局内不再直接产出物资，只能分解藏品或在此购入。每买 1 件，本窗口内同种物资再贵 25%，称为「物资匮乏」。</div><div class="market-materials">';
      for (var k = 0; k < MATERIALS.length; k++) {
        var m = MATERIALS[k];
        var mq = this.marketMaterialQuote(m.id, tick);
        var prevBuy = Math.round((mq.prev || mq.price) * (1 + MARKET_FEE_BUY));
        var pct = Math.round((mq.buy / Math.max(1, prevBuy) - 1) * 100);
        var have = this.data.materials[m.id] || 0;
        html += '<div class="market-mat"><img src="' + m.iconImg + '" alt=""><div class="market-mat-copy"><b>' + m.name + '</b><span>持有 ' + have + (mq.pressure ? ' · 物资匮乏 +' + mq.scarcityPct + '%' : '') + '</span></div>' +
          '<div class="market-mat-quote"><span>买 ' + fmt(mq.buy) + '</span><span>卖 ' + fmt(mq.sell) + '</span><em class="' + (pct >= 0 ? 'up' : 'down') + '">' + (pct >= 0 ? '↑' : '↓') + Math.abs(pct) + '%</em></div>' +
          '<div class="market-mat-actions"><button data-action="market-buy-material" data-id="' + m.id + '">买1</button><button data-action="market-sell-material" data-id="' + m.id + '"' + (have < 1 ? ' disabled' : '') + '>卖1</button></div></div>';
      }
      html += '</div>';
    }
    html += '<p class="market-foot">集市只接受本局内主动买卖；价格随时间变化，不产生离线收益。</p>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.marketBuyMaterial = function (id) {
    var def = null;
    for (var i = 0; i < MATERIALS.length; i++) if (MATERIALS[i].id === id) def = MATERIALS[i];
    if (!def) return;
    if (this.used() >= this.capacity()) {
      this.audio.warn();
      this.showToast('WAREHOUSE FULL', '仓库已满', '先回收或扩建仓库');
      return;
    }
    var quote = this.marketMaterialQuote(id);
    if (this.data.credits < quote.buy) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '打捞币不足', '买入需要 ' + fmt(quote.buy));
      return;
    }
    this.data.credits -= quote.buy;
    this.data.materials[id] = (this.data.materials[id] || 0) + 1;
    var pressureWin = Math.floor(marketTick() / MARKET_URGENT_TICKS);
    if (!this.data.marketPressure || this.data.marketPressure.win !== pressureWin) {
      this.data.marketPressure = { win: pressureWin, counts: {} };
    }
    this.data.marketPressure.counts[id] = (this.data.marketPressure.counts[id] || 0) + 1;
    this.audio.claim();
    this.showToast('MARKET BUY', def.name + ' ×1', '-' + fmt(quote.buy) + ' 打捞币 · 物资匮乏，下一件更贵');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.marketSellMaterial = function (id) {
    var def = null;
    for (var i = 0; i < MATERIALS.length; i++) if (MATERIALS[i].id === id) def = MATERIALS[i];
    if (!def || (this.data.materials[id] || 0) < 1) return;
    var quote = this.marketMaterialQuote(id);
    this.data.materials[id] -= 1;
    this.data.credits += quote.sell;
    this.audio.claim();
    this.showToast('MARKET SELL', def.name + ' ×1', '+' + fmt(quote.sell) + ' 打捞币 · 已扣卖出手续费');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.marketBuyCollectible = function (id) {
    var def = CW.COLLECTIBLE_MAP[id];
    if (!def || def.special) return;
    var quote = this.marketCollectibleQuote(def);
    if (this.data.credits < quote.buy) {
      this.audio.warn();
      this.showToast('NOT ENOUGH', '打捞币不足', '买入需要 ' + fmt(quote.buy));
      return;
    }
    this.data.credits -= quote.buy;
    this.data.collectibles[id] = (this.data.collectibles[id] || 0) + 1;
    this.audio.claim();
    this.showToast('MARKET BUY', def.name, '-' + fmt(quote.buy) + ' 打捞币 · 含买入手续费');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.warehouseSwitch = function () {
    return '<div class="warehouse-switch">' +
      '<button class="' + (this.warehouseView === 'materials' ? 'active' : '') + '" data-action="warehouse-view" data-view="materials">物资</button>' +
      '<button class="' + (this.warehouseView === 'collection' ? 'active' : '') + '" data-action="warehouse-view" data-view="collection">收藏</button>' +
      '<button class="' + (this.warehouseView === 'market' ? 'active' : '') + '" data-action="warehouse-view" data-view="market">集市</button>' +
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
      if (!item.special && item.rarity === fromRarity && (this.data.collectibles[item.id] || 0) > 0) {
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
    if (['all', 'owned', 'set', 'special'].indexOf(this.collectionFilter) < 0) this.collectionFilter = 'all';
    var unique = this.collectionUnique();
    var total = this.collectionTotal();
    var map = this.data.collectibles || {};
    var filterCount = this.data.filters || 0;
    var equipped = Array.isArray(this.data.equipped) ? this.data.equipped : [];
    var dup = this.collectionDuplicateStats();
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
    var auctionHtml = '<div class="auction-bar"><div class="auction-copy"><b>拍卖重复件</b><span>每件保留 1 份，余量换成打捞币；已装备的藏品也会保留。</span></div>' +
      '<button class="auction-btn" data-action="auction-duplicates"' + (dup.count ? '' : ' disabled') + '>' +
      (dup.count ? '拍卖 ' + dup.count + ' 件 · +' + fmt(dup.value) : '暂无重复件') +
      '</button></div>';
    var milestoneHtml = '<div class="collection-milestones"><div class="collection-milestone-head"><span>图鉴里程碑</span><small>已发现 ' + unique + ' / ' + CW.COLLECTIBLES.length + '</small></div><div class="collection-milestone-list">';
    for (var cm = 0; cm < COLLECTION_MILESTONES.length; cm++) {
      var ms = COLLECTION_MILESTONES[cm];
      var claimed = this.collectionMilestoneClaimed(ms.count);
      var canClaim = !claimed && unique >= ms.count;
      milestoneHtml += '<button class="collection-milestone' + (claimed ? ' claimed' : canClaim ? ' ready' : '') + '" data-action="claim-collection-milestone" data-count="' + ms.count + '"' + (canClaim ? '' : ' disabled') + '>' +
        '<b>' + ms.count + ' 件</b><span>' + (claimed ? '已领取' : canClaim ? '领取 +' + fmt(ms.credits) : '还差 ' + Math.max(0, ms.count - unique) + ' 件') + '</span></button>';
    }
    milestoneHtml += '</div></div>';
    var filterHtml = '<div class="collection-filters">';
    var filters = [
      ['all', '全部'], ['owned', '已拥有'], ['set', '套装'], ['special', '升级件']
    ];
    for (var ff = 0; ff < filters.length; ff++) {
      filterHtml += '<button class="' + (this.collectionFilter === filters[ff][0] ? 'active' : '') + '" data-action="collection-filter" data-filter="' + filters[ff][0] + '">' + filters[ff][1] + '</button>';
    }
    filterHtml += '</div>';
    var html = this.warehouseSwitch() + '<div class="collection-summary">' +
      '<span class="collection-kicker">SUNKEN ARCHIVE · 沉船收藏</span>' +
      '<div class="collection-headline"><b>' + unique + ' / ' + CW.COLLECTIBLES.length + '</b><span>已发现 · 共 ' + total + ' 件</span></div>' +
      '<p>收藏品不占仓库容量，会在局内作为普通掉落出现。装备最多 3 件可激活本局加成，重复件可拍卖、分解或合成；海水过滤器也收录在档案里，并作为净水舱材料。</p>' +
      '</div>' + milestoneHtml + filterHtml + relicHtml + auctionHtml + '<div class="craft-board">' +
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
      var setClaimed = this.setRewardClaimed(set.id);
      var setRewardText = fmt(set.reward.credits) + ' 币';
      for (var srm in set.reward.mats) {
        if (!Object.prototype.hasOwnProperty.call(set.reward.mats, srm)) continue;
        var srmd = null;
        for (var srmi = 0; srmi < MATERIALS.length; srmi++) if (MATERIALS[srmi].id === srm) srmd = MATERIALS[srmi];
        setRewardText += ' · ' + (srmd ? srmd.name : srm) + set.reward.mats[srm];
      }
      if (set.reward.filters) setRewardText += ' · 过滤器1';
      html += '<div class="set-card' + (active ? ' active' : '') + (setClaimed ? ' claimed' : '') + '" style="--set-color:' + set.color + '">' +
        '<div class="set-icons">' + icons + '</div>' +
        '<div class="set-copy"><b>' + set.name + '</b><span>' + set.desc + '</span></div>' +
        '<div class="set-status"><b>' + owned + ' / ' + set.items.length + '</b><em>' + set.bonusText + '</em></div>' +
        '<div class="set-reward"><span>' + setRewardText + '</span><button data-action="claim-set-reward" data-set="' + set.id + '"' + (active && !setClaimed ? '' : ' disabled') + '>' + (setClaimed ? '已领取' : active ? '领取' : '未集齐') + '</button></div>' +
      '</div>';
    }
    html += '</div></div>';
    var setIds = {};
    for (var ss = 0; ss < CW.COLLECTION_SETS.length; ss++) {
      for (var sii = 0; sii < CW.COLLECTION_SETS[ss].items.length; sii++) setIds[CW.COLLECTION_SETS[ss].items[sii]] = true;
    }
    var shownTotal = 0;
    for (var q = 0; q < CW.COLLECTIBLE_RARITIES.length; q++) {
      var rarity = CW.COLLECTIBLE_RARITIES[q];
      var group = [];
      for (var i = 0; i < CW.COLLECTIBLES.length; i++) if (CW.COLLECTIBLES[i].rarity === rarity.id) group.push(CW.COLLECTIBLES[i]);
      var discovered = 0;
      for (var d = 0; d < group.length; d++) {
        var gd = group[d];
        var ownedCount = gd.special === 'filter' ? filterCount : gd.special === 'material' ? (this.data.specials[gd.id] || 0) : (map[gd.id] || 0);
        if (ownedCount > 0) discovered++;
      }
      var visible = [];
      for (var vq = 0; vq < group.length; vq++) {
        var vItem = group[vq];
        var vn = vItem.special === 'filter' ? filterCount : vItem.special === 'material' ? (this.data.specials[vItem.id] || 0) : (map[vItem.id] || 0);
        var pass = vn > 0 && (
          this.collectionFilter === 'all' ||
          this.collectionFilter === 'owned' ||
          (this.collectionFilter === 'set' && !!setIds[vItem.id]) ||
          (this.collectionFilter === 'special' && !!vItem.special));
        if (pass) visible.push(vItem);
      }
      if (!visible.length) continue;
      html += '<section class="collection-group" style="--rarity:' + rarity.color + '">' +
        '<header><b>' + rarity.name + '</b><span>' + discovered + ' / ' + group.length + '</span></header><div class="collectible-grid">';
      for (var g = 0; g < visible.length; g++) {
        var item = visible[g];
        var isSpecial = !!item.special;
        var n = item.special === 'filter' ? filterCount : item.special === 'material' ? (this.data.specials[item.id] || 0) : (map[item.id] || 0);
        var isEquipped = !isSpecial && equipped.indexOf(item.id) >= 0;
        var relicInfo = CW.COLLECTIBLE_RELICS[item.id];
        shownTotal++;
        html += '<article class="collectible-card' + (n ? '' : ' unknown') + (isEquipped ? ' equipped' : '') + (isSpecial ? ' special' : '') + (this.data.trackedCollection === item.id ? ' tracked' : '') + '" style="--rarity:' + rarity.color + '">' +
          '<button class="collectible-open" data-action="collectible-detail" data-id="' + item.id + '" aria-label="查看 ' + item.name + ' 详情"></button>' +
          '<span class="collectible-art"><img src="' + item.icon + '" alt=""><button class="img-detail collectible-detail-btn" data-action="collectible-detail" data-id="' + item.id + '" aria-label="查看 ' + item.name + ' 详情">i</button></span>' +
          '<span class="collectible-copy"><b>' + item.name + '</b><em>' + (n ? '×' + n : '未发现') + '</em>' +
            (n && relicInfo ? '<span class="collectible-power">' + relicInfo.label + '</span>' : '') +
            (n && isSpecial ? '<span class="collectible-power">' + (item.special === 'filter' ? '净水核心 · 净水舱材料' : '稀有升级件 · 避难所材料') + '</span>' : '') + '</span>' +
          (n && !isSpecial ? '<span class="collectible-actions">' +
            '<button class="collectible-equip' + (isEquipped ? ' active' : '') + '" data-action="equip-collectible" data-id="' + item.id + '">' + (isEquipped ? '卸下' : '装备') + '</button>' +
            '<button class="collectible-dismantle" data-action="dismantle" data-id="' + item.id + '" title="分解 1 件为材料">分解</button>' +
          '</span>' : '') +
          (n && isSpecial ? '<span class="collectible-special-mark">' + (item.special === 'filter' ? '净水舱' : '升级件') + '</span>' : '') +
          (this.data.trackedCollection === item.id ? '<span class="collectible-tracked">追踪</span>' : '') +
        '</article>';
      }
      html += '</div></section>';
    }
    if (!shownTotal) html += '<div class="collection-empty">' + (unique ? '没有符合当前筛选的收藏。' : '还没有藏品。去打捞一局，结算会带回新的沉船档案。') + '</div>';
    html += '<p class="collection-note">打捞结算时按表现提高收藏掉落率；史诗与传说也可以由低级收藏逐级合成。</p>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.renderWarehouse = function () {
    if (this.warehouseView === 'collection') { this.renderCollection(); return; }
    if (this.warehouseView === 'market') { this.renderMarket(); return; }
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
      '<p class="capacity-note">仓库满了以后，多出来的物资会按废料价折算成打捞币。扩建仓库或回收物资都能腾出空间。</p>' +
      '<div class="capacity-actions"><button class="mat-sell-btn" data-action="sell-materials"' + (used <= 0 ? ' disabled' : '') + '>回收 10 件物资</button><span>自动从数量最多的材料开始出售</span></div>' +
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
      case 'expeditionRuns': return this.data.stats.expeditionRuns || 0;
      case 'urgentOrders': return this.data.stats.urgentOrders || 0;
      case 'shelterLevel': return this.shelterLevel();
      case 'crewGearMax': {
        var gm = 0;
        for (var cgi = 0; cgi < CREW.length; cgi++) gm = Math.max(gm, this.crewGearLevel(CREW[cgi].id));
        return gm;
      }
      case 'setRewardsCount': return (this.data.setRewards || []).length;
      case 'collectionUnique': return this.collectionUnique();
      case 'crewMaxed': {
        var cm = 0;
        for (var ci2 = 0; ci2 < CREW.length; ci2++) if (this.crewLevel(CREW[ci2].id) >= 5) cm++;
        return cm;
      }
      case 'sGradesCount': {
        var sc = 0;
        for (var sk2 in this.data.sGrades) if (Object.prototype.hasOwnProperty.call(this.data.sGrades, sk2) && this.data.sGrades[sk2]) sc++;
        return sc;
      }
      case 'missionsPlayed': {
        var n = 0;
        if ((this.data.best.hook || 0) > 0) n++;
        if ((this.data.best.match || 0) > 0) n++;
        if ((this.data.best.sonar || 0) > 0) n++;
        if ((this.data.stats.cutRuns || 0) > 0) n++;
        if ((this.data.stats.sortRuns || 0) > 0) n++;
        if ((this.data.stats.beaconRuns || 0) > 0) n++;
        if ((this.data.stats.trawlRuns || 0) > 0) n++;
        if ((this.data.stats.diveRuns || 0) > 0) n++;
        if ((this.data.stats.stackRuns || 0) > 0) n++;
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
    var lvl = this.shelterLevel();
    var next = this.shelterNext();
    var canLevel = this.shelterRequirementsMet();
    var levelCard = '<div class="shelter-level-card"><div class="shelter-level-copy"><span>REFUGE LEVEL · 避难所等级</span><b>Lv.' + lvl + (next ? ' / 5' : ' · 满级') + '</b>' +
      '<p>收藏掉落加成 +' + Math.round(this.shelterCollectibleChance() * 100) + '% · 仓库容量 +' + ((lvl - 1) * 15) + ' 格 · 设施 ' + this.level() + ' 级</p>' +
      (next ? '<div class="shelter-req"><span class="' + (this.data.credits >= next.credits ? 'ok' : '') + '">币 ' + fmt(next.credits) + '</span>' +
        Object.keys(next.mats).map(function (id) {
          var md = null; for (var q = 0; q < MATERIALS.length; q++) if (MATERIALS[q].id === id) md = MATERIALS[q];
          return '<span class="' + ((this.data.materials[id] || 0) >= next.mats[id] ? 'ok' : '') + '">' + (md ? md.name : id) + ' ' + next.mats[id] + '</span>';
        }, this).join('') +
        '<span class="' + (this.collectionArtifactUnique() >= next.unique ? 'ok' : '') + '">收藏 ' + Math.min(this.collectionArtifactUnique(), next.unique) + '/' + next.unique + '</span>' +
        '<span class="' + (this.data.runs >= next.runs ? 'ok' : '') + '">出航 ' + Math.min(this.data.runs || 0, next.runs) + '/' + next.runs + '</span>' +
        (next.specials ? Object.keys(next.specials).map(function (id) {
          var sd = CW.COLLECTIBLE_MAP[id];
          return '<span class="' + ((this.data.specials[id] || 0) >= next.specials[id] ? 'ok' : '') + '">' + (sd ? sd.name : id) + ' ' + Math.min(this.data.specials[id] || 0, next.specials[id]) + '/' + next.specials[id] + '</span>';
        }, this).join('') : '') +
        (next.filters ? '<span class="' + ((this.data.filters || 0) >= next.filters ? 'ok' : '') + '">过滤器 ' + Math.min(this.data.filters || 0, next.filters) + '/' + next.filters + '</span>' : '') +
        '</div>' : '') +
      '<div class="shelter-unlock">' + (next ? '下级解锁：' + next.unlock : '全部扩建与船员已解锁') + '</div></div>' +
      '<button class="shelter-up-btn" data-action="shelter-levelup"' + (!next || !canLevel ? ' disabled' : '') + '>' + (next ? (canLevel ? '升级避难所' : '条件不足') : 'MAX') + '</button></div>';
    var stages = [
      { lvl: 1, num: '01', name: '驳船甲板', img: 'assets/bg-hub.webp', desc: '驳船、旧钢板和浮筒拼成的主平台。' },
      { lvl: 2, num: '02', name: '净水舱', img: 'assets/seawater-filter.webp', desc: '把海水滤成能喝的淡水，舱壁开始像家。' },
      { lvl: 3, num: '03', name: '声呐桅杆', img: 'assets/real/sonar.webp', desc: '桅杆上的旧声呐，替避难所听见海底。' },
      { lvl: 4, num: '04', name: '工作间', img: 'assets/real/workshop.webp', desc: '维修、拆解和改装都在这里完成。' },
      { lvl: 5, num: '05', name: '潮汐核心', img: 'assets/real/core.webp', desc: '稳定整座漂浮避难所的能源心脏。' }
    ];
    var refugeView = '<div class="refuge-view"><div class="refuge-hero"><span>REFUGE APPEARANCE · 当前外观</span><b>Lv.' + lvl + ' 漂浮避难所</b><p>等级提升会逐步补齐甲板、净水舱、声呐桅杆、工作间与潮汐核心。</p></div><div class="refuge-modules">';
    for (var si = 0; si < stages.length; si++) {
      var st = stages[si];
      var unlocked = lvl >= st.lvl;
      var current = lvl === st.lvl;
      refugeView += '<article class="refuge-module ' + (unlocked ? 'unlocked' : 'locked') + (current ? ' current' : '') + '"><img src="' + st.img + '" alt=""><div><span>' + st.num + ' · ' + (unlocked ? (current ? '当前' : '已解锁') : 'Lv.' + st.lvl + ' 解锁') + '</span><b>' + st.name + '</b><small>' + st.desc + '</small></div></article>';
    }
    refugeView += '</div></div>';
    var html = this.shelterSwitch() + levelCard + refugeView + '<div class="shelter-head"><span>设施等级</span><b>Lv.' + this.level() + '</b></div><div class="upgrade-list">';
    for (var i = 0; i < UPGRADES.length; i++) {
      var up = UPGRADES[i];
      var level = this.data.upgrades[up.id] || 0;
      var maxed = level >= up.max;
      var cost = maxed ? null : up.costs[level];
      var needShelter = up.shelter ? (up.shelter[level] || 1) : 1;
      var reqCollectible = up.requires && up.requires.collectible;
      var hasRequiredCollectible = !reqCollectible || (this.data.collectibles[reqCollectible] || 0) > 0;
      var locked = !maxed && (needShelter > lvl || !hasRequiredCollectible);
      var afford = !maxed && !locked && this.canAfford(cost);
      var missingFilter = !!(cost && cost.filters && (this.data.filters || 0) < cost.filters);
      var missingMats = false;
      if (cost) {
        for (var mm = 0; mm < MATERIALS.length; mm++) {
          if (cost[MATERIALS[mm].id] && (this.data.materials[MATERIALS[mm].id] || 0) < cost[MATERIALS[mm].id]) {
            missingMats = true; break;
          }
        }
      }
      var missingRarity = false;
    if (cost && cost.rarities) {
      for (var mr in cost.rarities) {
        if (Object.prototype.hasOwnProperty.call(cost.rarities, mr) && this.collectibleRarityAvailable(mr) < cost.rarities[mr]) { missingRarity = true; break; }
      }
    }
    var canSalvage = !maxed && !locked && !missingFilter && !missingRarity && missingMats && this.collectionDuplicateStats().count > 0;
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
        if (cost.rarities) {
          for (var rq in cost.rarities) {
            if (!Object.prototype.hasOwnProperty.call(cost.rarities, rq)) continue;
            var rdef = CW.COLLECTIBLE_RARITY_MAP[rq];
            var have = this.collectibleRarityAvailable(rq);
            chips += '<span class="cost-chip' + (have < cost.rarities[rq] ? ' poor' : '') + '" style="--tone:' + (rdef ? rdef.color : '#d9b8ff') + '">' + (rdef ? rdef.name : rq) + '收藏 ' + have + '/' + cost.rarities[rq] + '</span>';
          }
        }
      }
      var iconHtml = up.iconImg ? '<img src="' + up.iconImg + '" alt="">' : up.icon;
      html += '<div class="upgrade-card' + (up.id === 'purifier' ? ' rare' : '') + (locked ? ' locked' : '') + '">' +
        '<span class="upgrade-icon" style="--tone:' + up.tone + '">' + iconHtml + '<button class="img-detail" data-action="upgrade-detail" data-id="' + up.id + '" aria-label="查看 ' + up.name + ' 档案">i</button></span>' +
        '<div class="upgrade-info">' +
          '<div class="upgrade-name">' + up.name + ' <span class="pips">' + pips + '</span> <span class="upgrade-level">Lv.' + level + '/' + up.max + '</span></div>' +
          '<div class="upgrade-effect">' + up.desc + (reqCollectible ? ' · 核心藏品：' + ((CW.COLLECTIBLE_MAP[reqCollectible] || {}).name || reqCollectible) + (hasRequiredCollectible ? '（已拥有）' : '（未拥有）') : '') + '</div>' +
          '<div class="upgrade-costs">' + (maxed ? '<span class="cost-chip" style="--tone:var(--aqua)">已满级</span>' : chips) + '</div>' +
        '</div>' +
        '<div class="upgrade-actions">' +
          '<button class="buy-btn' + (maxed ? ' max' : '') + '" data-action="upgrade" data-upgrade="' + up.id + '"' +
            (maxed || locked || !afford ? ' disabled' : '') + '>' + (maxed ? 'MAX' : (locked ? (!hasRequiredCollectible ? '需核心藏品' : '需避难所 Lv.' + needShelter) : (afford ? '强化' : (missingFilter ? '缺过滤器' : '材料不足')))) + '</button>' +
          (canSalvage ? '<button class="upgrade-salvage" data-action="upgrade-salvage" data-upgrade="' + up.id + '">藏品补料</button>' : '') +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    this.dom.panelContent.innerHTML = html;
  };

  Hub.prototype.shelterRequirementsMet = function () {
    var next = this.shelterNext();
    if (!next) return false;
    if ((this.data.credits || 0) < next.credits) return false;
    if ((this.data.runs || 0) < next.runs) return false;
    if (this.collectionArtifactUnique() < next.unique) return false;
    for (var i = 0; i < MATERIALS.length; i++) {
      var m = MATERIALS[i];
      if (next.mats[m.id] && (this.data.materials[m.id] || 0) < next.mats[m.id]) return false;
    }
    if (next.specials) {
      for (var sp in next.specials) {
        if (!Object.prototype.hasOwnProperty.call(next.specials, sp)) continue;
        if ((this.data.specials[sp] || 0) < next.specials[sp]) return false;
      }
    }
    if (next.filters && (this.data.filters || 0) < next.filters) return false;
    return true;
  };

  Hub.prototype.upgradeShelter = function () {
    var next = this.shelterNext();
    if (!next || !this.shelterRequirementsMet()) {
      this.audio.warn();
      this.showToast('NOT READY', '避难所升级条件不足', '需要打捞币、材料、收藏与出航次数');
      return;
    }
    this.data.credits -= next.credits;
    for (var id in next.mats) {
      if (!Object.prototype.hasOwnProperty.call(next.mats, id)) continue;
      this.data.materials[id] -= next.mats[id];
    }
    if (next.specials) {
      for (var sp in next.specials) {
        if (Object.prototype.hasOwnProperty.call(next.specials, sp)) this.data.specials[sp] = Math.max(0, (this.data.specials[sp] || 0) - next.specials[sp]);
      }
    }
    if (next.filters) this.data.filters = Math.max(0, (this.data.filters || 0) - next.filters);
    this.data.shelterLevel = Math.min(5, this.shelterLevel() + 1);
    this.audio.claim();
    this.showToast('SHELTER UPGRADED', '避难所 Lv.' + this.data.shelterLevel, next.unlock + ' · 收藏几率与仓库容量提升');
    this.saveGame();
    this.updateUI();
    this.renderPanel();
  };

  Hub.prototype.canAfford = function (cost) {
    if (!cost) return false;
    if (this.data.credits < cost.credits) return false;
    if (cost.filters && (this.data.filters || 0) < cost.filters) return false;
    if (cost.rarities) {
      for (var r in cost.rarities) {
        if (Object.prototype.hasOwnProperty.call(cost.rarities, r) && this.collectibleRarityAvailable(r) < cost.rarities[r]) return false;
      }
    }
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
    if (up.shelter && (up.shelter[level] || 1) > this.shelterLevel()) {
      this.audio.warn();
      this.showToast('LOCKED', '需要更高避难所等级', '先提升避难所等级');
      return;
    }
    if (up.requires && up.requires.collectible && (this.data.collectibles[up.requires.collectible] || 0) < 1) {
      this.audio.warn();
      var need = CW.COLLECTIBLE_MAP[up.requires.collectible];
      this.showToast('ARCHIVE REQUIRED', '缺少设施核心', '需要收藏「' + (need ? need.name : up.requires.collectible) + '」');
      return;
    }
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
    if (cost.rarities) {
      for (var rr in cost.rarities) {
        if (Object.prototype.hasOwnProperty.call(cost.rarities, rr)) this.consumeCollectibleRarity(rr, cost.rarities[rr]);
      }
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
    if (this.data.activeMissions.indexOf(type) < 0 && this.data.candidateMissions.indexOf(type) >= 0) {
      this.promoteMission(type);
      this.saveGame();
    }
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
    var runMaterials = result.materials || {};
    result.runMaterials = runMaterials;
    result.materials = {};
    var chainTypes = Array.isArray(this.data.taskChainTypes) ? this.data.taskChainTypes.slice() : [];
    if (chainTypes.indexOf(taskType) >= 0 || taskType === this.data.lastTask) chainTypes = [];
    chainTypes.push(taskType);
    if (chainTypes.length > 6) chainTypes = chainTypes.slice(-6);
    this.data.taskChainTypes = chainTypes;
    var chain = chainTypes.length;
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
    else if (result.type === 'trawl') this.data.stats.trawlRuns = (this.data.stats.trawlRuns || 0) + 1;
    else if (result.type === 'dive') this.data.stats.diveRuns = (this.data.stats.diveRuns || 0) + 1;
    else if (result.type === 'stack') this.data.stats.stackRuns = (this.data.stats.stackRuns || 0) + 1;
    var key = ['hook', 'match', 'sonar', 'cut', 'sort', 'beacon', 'trawl', 'dive', 'stack'].indexOf(result.type) >= 0 ? result.type : 'hook';
    this.data.best[key] = Math.max(this.data.best[key] || 0, Math.round(result.score || 0));
    var grade = gradeFor(key, result.score);
    if (gradeRank(grade) > gradeRank(this.data.grades[key])) this.data.grades[key] = grade;
    var sBonus = 0;
    if (grade === 'S' && !this.data.sGrades[key]) {
      this.data.sGrades[key] = true;
      sBonus = 300;
      this.data.credits += sBonus;
    }
    var shelterChance = this.shelterCollectibleChance();
    if (shelterChance > 0 && CW.rollCollectibleDef && Math.random() < shelterChance) {
      if (!Array.isArray(result.collectibles)) result.collectibles = [];
      result.collectibles.push(CW.rollCollectibleDef().id);
    }
    if (!Array.isArray(result.collectibles)) result.collectibles = [];
    var bonusDrops = 1 + (Math.random() < 0.35 ? 1 : 0);
    for (var bd = 0; bd < bonusDrops; bd++) {
      result.collectibles.push(CW.rollCollectibleDef().id);
    }
    var collectibles = this.registerCollectibles(result);
    result.collectibles = collectibles;
    var gainedSpecials = [];
    if (Array.isArray(result.specials)) {
      for (var spi = 0; spi < result.specials.length; spi++) {
        var sid = result.specials[spi];
        var sdef = CW.COLLECTIBLE_MAP[sid];
        if (!sdef || sdef.special !== 'material') continue;
        this.data.specials[sid] = (this.data.specials[sid] || 0) + 1;
        gainedSpecials.push(sid);
      }
    }
    this.applyContractProgress(result);
    this.applyDailyProgress(result);
    var stats = this.data.stats;
    stats.bestCombo = Math.max(stats.bestCombo || 0, Math.floor(Number(result.bestCombo) || 0));
    stats.safeTotal = (stats.safeTotal || 0) + Math.max(0, Math.floor(Number(result.safeCount) || 0));
    stats.goldTotal = (stats.goldTotal || 0) + Math.max(0, Math.floor(Number(result.goldCount) || 0));
    stats.filtersFound = (stats.filtersFound || 0) + filtersGained;
    stats.collectiblesFound = (stats.collectiblesFound || 0) + collectibles.length;
    stats.creditsEarned = (stats.creditsEarned || 0) + creditGain + overflowCredits + chainBonus + sBonus;
    if (result.type === 'sonar' && Number(result.found || 0) >= 4) stats.sonarPerfect = (stats.sonarPerfect || 0) + 1;
    this.rotateMission(key);
    this.saveGame();
    this.updateUI();
    this.renderPanel();
    return {
      creditGain: creditGain,
      chain: chain,
      chainMult: chainMult,
      chainBonus: chainBonus,
      grade: grade,
      sBonus: sBonus,
      overflowCredits: overflowCredits,
      totalCredits: creditGain + overflowCredits + chainBonus + sBonus,
      stored: stored,
      overflowUnits: overflowUnits,
      filters: filtersGained,
      filtersTotal: this.data.filters,
      capacity: cap,
      used: cap - storeSpace,
      collectibles: collectibles,
      specials: gainedSpecials
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
        else if (action === 'quality') self.cycleQuality();
        else if (action === 'reset-save') self.resetSave();
        else if (action === 'mission') self.startMission(actionEl.getAttribute('data-mission'));
        else if (action === 'mission-detail') self.openStoryDetail('mission', actionEl.getAttribute('data-id'));
        else if (action === 'crew-detail') self.openStoryDetail('crew', actionEl.getAttribute('data-id'));
        else if (action === 'upgrade-detail') self.openStoryDetail('upgrade', actionEl.getAttribute('data-id'));
        else if (action === 'story-close') self.closeStoryDetail();
        else if (action === 'arcade-story' && self.arcade && self.arcade.type) self.openStoryDetail('mission', self.arcade.type);
        else if (action === 'story-start-mission') {
          var storyMission = actionEl.getAttribute('data-mission');
          self.closeStoryDetail();
          self.startMission(storyMission);
        }
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
        else if (action === 'collectible-detail') self.openCollectibleDetail(actionEl.getAttribute('data-id'));
        else if (action === 'collectible-close') self.closeCollectibleDetail();
        else if (action === 'collectible-track') self.trackCollectible(actionEl.getAttribute('data-id'));
        else if (action === 'track-source') self.startMission(actionEl.getAttribute('data-mission'));
        else if (action === 'collection-filter') {
          self.collectionFilter = actionEl.getAttribute('data-filter') || 'all';
          self.audio.tab();
          self.renderPanel();
        }
        else if (action === 'claim-collection-milestone') self.claimCollectionMilestone(Number(actionEl.getAttribute('data-count')));
        else if (action === 'claim-set-reward') self.claimSetReward(actionEl.getAttribute('data-set'));
        else if (action === 'auction-duplicates') self.auctionDuplicates();
        else if (action === 'sell-materials') self.sellMaterials(10);
        else if (action === 'upgrade-salvage') self.salvageForUpgrade(actionEl.getAttribute('data-upgrade'));
        else if (action === 'dismantle') self.dismantle(actionEl.getAttribute('data-id'));
        else if (action === 'market-tab') {
          self.marketTab = actionEl.getAttribute('data-view') === 'collectibles' ? 'collectibles' : 'materials';
          self.audio.tab();
          self.renderPanel();
        } else if (action === 'market-buy-material') self.marketBuyMaterial(actionEl.getAttribute('data-id'));
        else if (action === 'market-sell-material') self.marketSellMaterial(actionEl.getAttribute('data-id'));
        else if (action === 'market-buy-collectible') self.marketBuyCollectible(actionEl.getAttribute('data-id'));
        else if (action === 'market-list') self.openMarketListing(actionEl.getAttribute('data-id'));
        else if (action === 'market-list-confirm') self.confirmMarketListing(actionEl.getAttribute('data-id'), actionEl.getAttribute('data-mult'));
        else if (action === 'market-auction') self.openMarketAuction(actionEl.getAttribute('data-id'));
        else if (action === 'market-modal-close') self.closeMarketModal();
        else if (action === 'crew-hire') self.hireCrew(actionEl.getAttribute('data-id'));
        else if (action === 'crew-claim') self.claimCrew(actionEl.getAttribute('data-id'));
        else if (action === 'crew-gear') {
          var gearId = actionEl.getAttribute('data-id');
          self.crewGearOpen = self.crewGearOpen === gearId ? null : gearId;
          self.audio.tab();
          self.renderPanel();
        }
        else if (action === 'crew-gear-up') self.upgradeCrewGear(actionEl.getAttribute('data-id'));
        else if (action === 'crew-expedition-start') self.startCrewExpedition();
        else if (action === 'crew-expedition-claim') self.claimCrewExpedition();
        else if (action === 'expedition-close') self.closeExpeditionEvent();
        else if (action === 'expedition-choose') self.chooseExpeditionReward(Number(actionEl.getAttribute('data-choice')));
        else if (action === 'shelter-levelup') self.upgradeShelter();
        else if (action === 'market-urgent') self.fulfillUrgent();
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

    if (this.dom.collectibleModal) {
      this.dom.collectibleModal.addEventListener('click', function (e) {
        if (e.target === self.dom.collectibleModal) self.closeCollectibleDetail();
      });
    }
    if (this.dom.expeditionModal) {
      this.dom.expeditionModal.addEventListener('click', function (e) {
        if (e.target === self.dom.expeditionModal) self.closeExpeditionEvent();
      });
    }
    if (this.dom.storyModal) {
      this.dom.storyModal.addEventListener('click', function (e) {
        if (e.target === self.dom.storyModal) self.closeStoryDetail();
      });
    }

    window.addEventListener('keydown', function (e) {
      self.audio.unlock();
      if (e.repeat) return;
      if (e.code === 'KeyM') { self.toggleMute(); return; }
      if (e.code === 'Escape') {
        if (self.dom.storyModal && !self.dom.storyModal.classList.contains('hidden')) self.closeStoryDetail();
        else if (self.dom.expeditionModal && !self.dom.expeditionModal.classList.contains('hidden')) self.closeExpeditionEvent();
        else if (self.dom.collectibleModal && !self.dom.collectibleModal.classList.contains('hidden')) self.closeCollectibleDetail();
        else if (self.dom.marketModal && !self.dom.marketModal.classList.contains('hidden')) self.closeMarketModal();
        else if (!self.dom.guide.classList.contains('hidden')) self.closeGuide();
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

