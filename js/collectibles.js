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
    { id: 'rusty-watch', name: '锈蚀怀表', rarity: 'common', icon: 'assets/collectibles/rusty-watch.svg', desc: '表针停在洪水来临的 03:17。' },
    { id: 'brass-key', name: '黄铜钥匙', rarity: 'common', icon: 'assets/collectibles/brass-key.svg', desc: '不知道还能打开哪扇门。' },
    { id: 'sea-bottle', name: '海水玻璃瓶', rarity: 'common', icon: 'assets/collectibles/sea-bottle.svg', desc: '瓶口封着蜡，里面没有信。' },
    { id: 'old-coin', name: '旧时代硬币', rarity: 'common', icon: 'assets/collectibles/old-coin.svg', desc: '正面是已经消失的国徽。' },
    { id: 'crew-badge', name: '船员徽章', rarity: 'common', icon: 'assets/collectibles/crew-badge.svg', desc: '别针还在，主人不在了。' },
    { id: 'brass-compass', name: '黄铜罗盘', rarity: 'uncommon', icon: 'assets/collectibles/brass-compass.svg', desc: '指针不再指北，只在水下轻轻发抖。' },
    { id: 'waterproof-camera', name: '防水相机', rarity: 'uncommon', icon: 'assets/collectibles/waterproof-camera.svg', desc: '胶卷里可能还有最后一张照片。' },
    { id: 'chart-tube', name: '航线图筒', rarity: 'uncommon', icon: 'assets/collectibles/chart-tube.svg', desc: '一张被海水泡软的海图，墨迹仍然可辨。' },
    { id: 'copper-telescope', name: '铜制望远镜', rarity: 'uncommon', icon: 'assets/collectibles/copper-telescope.svg', desc: '镜片有一条裂纹，但还能看很远。' },
    { id: 'silver-musicbox', name: '银质乐谱盒', rarity: 'rare', icon: 'assets/collectibles/silver-musicbox.svg', desc: '打开时会响起半段走调的摇篮曲。' },
    { id: 'diving-helmet', name: '深海潜水盔', rarity: 'rare', icon: 'assets/collectibles/diving-helmet.svg', desc: '铜面罩上有一道爪痕。' },
    { id: 'ship-bell', name: '沉船船钟', rarity: 'rare', icon: 'assets/collectibles/ship-bell.svg', desc: '敲响时，声音像从很深的地方传来。' },
    { id: 'captain-log', name: '船长航海日志', rarity: 'epic', icon: 'assets/collectibles/captain-log.svg', desc: '最后一页只写了两个字：上浮。' },
    { id: 'black-box', name: '黑匣子', rarity: 'epic', icon: 'assets/collectibles/black-box.svg', desc: '记录着沉没前最后十七分钟的无线电。' },
    { id: 'tide-crown', name: '潮汐王冠', rarity: 'legendary', icon: 'assets/collectibles/tide-crown.svg', desc: '不是黄金，是被海水压成王冠形状的月光。' }
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
      desc: '银质乐谱盒、深海潜水盔、沉船船钟',
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
})();
