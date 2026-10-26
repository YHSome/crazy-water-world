/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 沉船收藏
   15 collectible artefacts, five rarity tiers, and the forge recipes.
   Icons are local SVG files sourced from Game-icons.net.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CW = (window.CW = window.CW || {});

  var RARITIES = (CW.COLLECTIBLE_RARITIES = [
    { id: 'common', name: '普通', color: '#a9bec2', order: 0 },
    { id: 'uncommon', name: '精良', color: '#9be2a9', order: 1 },
    { id: 'rare', name: '稀有', color: '#79d8ff', order: 2 },
    { id: 'epic', name: '史诗', color: '#c9a6ff', order: 3 },
    { id: 'legendary', name: '传说', color: '#ffd166', order: 4 }
  ]);

  var COLLECTIBLES = (CW.COLLECTIBLES = [
    { id: 'rusty-watch', name: '锈蚀怀表', rarity: 'common', icon: 'assets/collectibles/rusty-watch.webp', desc: '表针停在洪水来临的 03:17。' },
    { id: 'brass-key', name: '旧船门钥', rarity: 'common', icon: 'assets/collectibles/brass-key.webp', desc: '钥匙还插在门锁里，门已经不在。' },
    { id: 'sea-bottle', name: '海水玻璃瓶', rarity: 'common', icon: 'assets/collectibles/sea-bottle.webp', desc: '瓶口封着蜡，里面没有信。' },
    { id: 'old-coin', name: '旧时代硬币', rarity: 'common', icon: 'assets/collectibles/old-coin.webp', desc: '正面是已经消失的国徽。' },
    { id: 'crew-badge', name: '船员勋章', rarity: 'common', icon: 'assets/collectibles/crew-badge.webp', desc: '玻璃匣里别着三枚旧勋章。' },
    { id: 'brass-compass', name: '黄铜罗盘', rarity: 'uncommon', icon: 'assets/collectibles/brass-compass.webp', desc: '指针不再指北，只在水下轻轻发抖。' },
    { id: 'waterproof-camera', name: '防水相机', rarity: 'uncommon', icon: 'assets/collectibles/waterproof-camera.webp', desc: '胶卷里可能还有最后一张照片。' },
    { id: 'chart-tube', name: '航线图筒', rarity: 'uncommon', icon: 'assets/collectibles/chart-tube.webp', desc: '一张被海水泡软的海图，墨迹仍然可辨。' },
    { id: 'copper-telescope', name: '铜制望远镜', rarity: 'uncommon', icon: 'assets/collectibles/copper-telescope.webp', desc: '镜片有一条裂纹，但还能看很远。' },
    { id: 'silver-musicbox', name: '旧式留声机', rarity: 'rare', icon: 'assets/collectibles/silver-musicbox.webp', desc: '铜喇叭还能转，唱针已经锈住。' },
    { id: 'diving-helmet', name: '深海潜水盔', rarity: 'rare', icon: 'assets/collectibles/diving-helmet.webp', desc: '铜面罩上有一道爪痕。' },
    { id: 'ship-bell', name: '沉船船钟', rarity: 'rare', icon: 'assets/collectibles/ship-bell.webp', desc: '敲响时，声音像从很深的地方传来。' },
    { id: 'captain-log', name: '船长航海日志', rarity: 'epic', icon: 'assets/collectibles/captain-log.webp', desc: '最后一页只写了两个字：上浮。' },
    { id: 'black-box', name: '黑匣子', rarity: 'epic', icon: 'assets/collectibles/black-box.webp', desc: '记录着沉没前最后十七分钟的无线电。' },
    { id: 'tide-crown', name: '潮汐王冠', rarity: 'legendary', icon: 'assets/collectibles/tide-crown.webp', desc: '不是黄金，是被海水压成王冠形状的月光。' }
  ]);

  var MAP = (CW.COLLECTIBLE_MAP = {});
  for (var i = 0; i < COLLECTIBLES.length; i++) MAP[COLLECTIBLES[i].id] = COLLECTIBLES[i];
  var RARITY_MAP = (CW.COLLECTIBLE_RARITY_MAP = {});
  for (var j = 0; j < RARITIES.length; j++) RARITY_MAP[RARITIES[j].id] = RARITIES[j];

  CW.CRAFT_RECIPES = [
    { from: 'common', to: 'uncommon', cost: 150 },
    { from: 'uncommon', to: 'rare', cost: 400 },
    { from: 'rare', to: 'epic', cost: 1000 },
    { from: 'epic', to: 'legendary', cost: 2500 }
  ];

  CW.COLLECTIBLE_WEIGHTS = [
    { rarity: 'common', weight: 52 },
    { rarity: 'uncommon', weight: 27 },
    { rarity: 'rare', weight: 13 },
    { rarity: 'epic', weight: 6 },
    { rarity: 'legendary', weight: 2 }
  ];

  CW.COLLECTION_SETS = [
    {
      id: 'navigator', name: '航海官', color: '#9be2a9',
      desc: '黄铜罗盘、航线图筒、铜制望远镜',
      items: ['brass-compass', 'chart-tube', 'copper-telescope'],
      bonus: { credit: 0.1, mat: 0 },
      bonusText: '打捞币 +10%'
    },
    {
      id: 'deepsea', name: '深潜者', color: '#79d8ff',
      desc: '旧式留声机、深海潜水盔、沉船船钟',
      items: ['silver-musicbox', 'diving-helmet', 'ship-bell'],
      bonus: { credit: 0, mat: 0.1 },
      bonusText: '物资 +10%'
    },
    {
      id: 'captain', name: '船长遗物', color: '#ffd166',
      desc: '船长航海日志、黑匣子、潮汐王冠',
      items: ['captain-log', 'black-box', 'tide-crown'],
      bonus: { credit: 0.1, mat: 0.1 },
      bonusText: '打捞币 +10% · 物资 +10%'
    }
  ];

  CW.collectiblesOfRarity = function (rarity) {
    var out = [];
    for (var k = 0; k < COLLECTIBLES.length; k++) {
      if (COLLECTIBLES[k].rarity === rarity) out.push(COLLECTIBLES[k]);
    }
    return out;
  };

  CW.DISMANTLE_YIELDS = {
    common: { metal: 2, fiber: 1 },
    uncommon: { metal: 3, chip: 1 },
    rare: { metal: 4, fuel: 1, chip: 2 },
    epic: { metal: 6, fuel: 2, fiber: 2, chip: 3 },
    legendary: { metal: 10, fuel: 4, fiber: 4, chip: 5 }
  };

  CW.rollCollectibleDef = function () {
    var total = 0;
    for (var i = 0; i < CW.COLLECTIBLE_WEIGHTS.length; i++) total += CW.COLLECTIBLE_WEIGHTS[i].weight;
    var roll = Math.random() * total;
    var rarity = CW.COLLECTIBLE_WEIGHTS[0].rarity;
    for (var j = 0; j < CW.COLLECTIBLE_WEIGHTS.length; j++) {
      roll -= CW.COLLECTIBLE_WEIGHTS[j].weight;
      if (roll <= 0) { rarity = CW.COLLECTIBLE_WEIGHTS[j].rarity; break; }
    }
    var pool = CW.collectiblesOfRarity(rarity);
    return pool[(Math.random() * pool.length) | 0];
  };
})();
