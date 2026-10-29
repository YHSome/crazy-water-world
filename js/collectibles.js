/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 沉船收藏
   100 collectible artefacts, five rarity tiers, and the forge recipes.
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
    { id: 'rusty-watch', name: '锈蚀怀表', rarity: 'common', icon: 'assets/collectibles/unique/rusty-watch.webp', desc: '表针停在洪水来临的 03:17。' },
    { id: 'brass-key', name: '旧船门钥', rarity: 'common', icon: 'assets/collectibles/unique/brass-key.webp', desc: '钥匙还插在门锁里，门已经不在。' },
    { id: 'sea-bottle', name: '海水玻璃瓶', rarity: 'common', icon: 'assets/collectibles/unique/sea-bottle.webp', desc: '瓶口封着蜡，里面没有信。' },
    { id: 'old-coin', name: '旧时代硬币', rarity: 'common', icon: 'assets/collectibles/unique/old-coin.webp', desc: '正面是已经消失的国徽。' },
    { id: 'crew-badge', name: '船员勋章', rarity: 'common', icon: 'assets/collectibles/unique/crew-badge.webp', desc: '玻璃匣里别着三枚旧勋章。' },
    { id: 'brass-compass', name: '黄铜罗盘', rarity: 'uncommon', icon: 'assets/collectibles/unique/brass-compass.webp', desc: '指针不再指北，只在水下轻轻发抖。' },
    { id: 'waterproof-camera', name: '防水相机', rarity: 'uncommon', icon: 'assets/collectibles/unique/waterproof-camera.webp', desc: '胶卷里可能还有最后一张照片。' },
    { id: 'chart-tube', name: '航线图筒', rarity: 'uncommon', icon: 'assets/collectibles/unique/chart-tube.webp', desc: '一张被海水泡软的海图，墨迹仍然可辨。' },
    { id: 'copper-telescope', name: '铜制望远镜', rarity: 'uncommon', icon: 'assets/collectibles/unique/copper-telescope.webp', desc: '镜片有一条裂纹，但还能看很远。' },
    { id: 'silver-musicbox', name: '旧式留声机', rarity: 'rare', icon: 'assets/collectibles/unique/silver-musicbox.webp', desc: '铜喇叭还能转，唱针已经锈住。' },
    { id: 'diving-helmet', name: '深海潜水盔', rarity: 'rare', icon: 'assets/collectibles/unique/diving-helmet.webp', desc: '铜面罩上有一道爪痕。' },
    { id: 'ship-bell', name: '沉船船钟', rarity: 'rare', icon: 'assets/collectibles/unique/ship-bell.webp', desc: '敲响时，声音像从很深的地方传来。' },
    { id: 'captain-log', name: '船长航海日志', rarity: 'epic', icon: 'assets/collectibles/unique/captain-log.webp', desc: '最后一页只写了两个字：上浮。' },
    { id: 'black-box', name: '黑匣子', rarity: 'epic', icon: 'assets/collectibles/unique/black-box.webp', desc: '记录着沉没前最后十七分钟的无线电。' },
    { id: 'tide-crown', name: '潮汐王冠', rarity: 'legendary', icon: 'assets/collectibles/unique/tide-crown.webp', desc: '不是黄金，是被海水压成王冠形状的月光。' },
    { id: 'brass-barometer', name: '铜制气压计', rarity: 'uncommon', icon: 'assets/collectibles/unique/brass-barometer.webp', desc: '停在“持续降雨”那一格，已经停了十七年。' },
    { id: 'sextant', name: '船用六分仪', rarity: 'rare', icon: 'assets/collectibles/unique/sextant.webp', desc: '黄铜弧尺上刻着一条早已不存在的航线。' },
    { id: 'matchbook', name: '防水火柴盒', rarity: 'common', icon: 'assets/collectibles/unique/matchbook.webp', desc: '盒面印着旧港旅馆的名字，里面还剩三根火柴。' },
    { id: 'stamp-album', name: '旧港邮票册', rarity: 'uncommon', icon: 'assets/collectibles/unique/stamp-album.webp', desc: '每个港口一张，最后一张没有盖邮戳。' },
    { id: 'glass-float', name: '玻璃浮球', rarity: 'common', icon: 'assets/collectibles/unique/glass-float.webp', desc: '渔网留下的浮球，里面还晃着一点旧海水。' },
    { id: 'rusty-gear', name: '锈蚀齿轮', rarity: 'common', icon: 'assets/collectibles/unique/rusty-gear.webp', desc: '从吊臂上拆下来的齿轮，齿牙缺了两颗。' },
    { id: 'copper-spool', name: '铜线卷', rarity: 'common', icon: 'assets/collectibles/unique/copper-spool.webp', desc: '绝缘皮已经开裂，铜芯仍然很亮。' },
    { id: 'ship-lamp', name: '船用灯泡', rarity: 'uncommon', icon: 'assets/collectibles/unique/ship-lamp.webp', desc: '灯丝断了一截，玻璃里却还留着一点暖光。' },
    { id: 'telegraph-key', name: '旧式电报键', rarity: 'rare', icon: 'assets/collectibles/unique/telegraph-key.webp', desc: '按下时仍会发出很轻的滴答声。' },
    { id: 'signal-flag', name: '航海信号旗', rarity: 'common', icon: 'assets/collectibles/unique/signal-flag.webp', desc: '旗角绣着“全员平安”，边缘被风撕开。' },
    { id: 'brass-lantern', name: '铜制油灯', rarity: 'uncommon', icon: 'assets/collectibles/unique/brass-lantern.webp', desc: '灯罩上有烟熏的痕迹，灯芯还是湿的。' },
    { id: 'mess-tin', name: '船员饭盒', rarity: 'common', icon: 'assets/collectibles/unique/mess-tin.webp', desc: '盒底刻着名字，被刀划掉了一半。' },
    { id: 'sewing-machine', name: '脚踏缝纫机', rarity: 'rare', icon: 'assets/collectibles/unique/sewing-machine.webp', desc: '针还穿着线，线头一直延伸到舱门外。' },
    { id: 'old-radio', name: '老式收音机', rarity: 'epic', icon: 'assets/collectibles/unique/old-radio.webp', desc: '旋钮停在无人使用的频率上，偶尔有人呼吸。' },
    { id: 'safe-plate', name: '保险柜铭牌', rarity: 'uncommon', icon: 'assets/collectibles/unique/safe-plate.webp', desc: '编号 0417，正是洪水漫过码头的那一天。' },
    { id: 'deep-tape', name: '深海录音带', rarity: 'epic', icon: 'assets/collectibles/unique/deep-tape.webp', desc: '磁带里只有水压和一段很远的敲击。' },
    { id: 'tide-compass', name: '潮汐罗盘', rarity: 'legendary', icon: 'assets/collectibles/unique/tide-compass.webp', desc: '不指北，只指向当天潮水最高的地方。' },
    { id: 'captain-pipe', name: '船长烟斗', rarity: 'rare', icon: 'assets/collectibles/unique/captain-pipe.webp', desc: '斗钵里没有烟丝，只有一层白色的盐。' },
    { id: 'moon-coral', name: '月光珊瑚', rarity: 'legendary', icon: 'assets/collectibles/unique/moon-coral.webp', desc: '在暗处会发出很淡的蓝光，像一小片不会退潮的海。' },
    { id: 'tide-button', name: '潮汐铜扣', rarity: 'common', icon: 'assets/collectibles/unique/tide-button.webp', desc: '铜扣上刻着旧港潮汐表的刻度。' },
    { id: 'cracked-mug', name: '缺口搪瓷杯', rarity: 'common', icon: 'assets/collectibles/unique/cracked-mug.webp', desc: '杯沿缺了一角，杯底还留着茶渍。' },
    { id: 'cork-float', name: '软木浮子', rarity: 'common', icon: 'assets/collectibles/unique/cork-float.webp', desc: '渔网上的浮子，木纹里嵌着细沙。' },
    { id: 'deck-bolt', name: '甲板螺栓', rarity: 'common', icon: 'assets/collectibles/unique/deck-bolt.webp', desc: '从沉船甲板拧下来的六角螺栓。' },
    { id: 'salt-spoon', name: '盐蚀汤匙', rarity: 'common', icon: 'assets/collectibles/unique/salt-spoon.webp', desc: '汤匙被盐蚀出坑，柄上刻着船名。' },
    { id: 'fish-hook', name: '旧鱼钩', rarity: 'common', icon: 'assets/collectibles/unique/fish-hook.webp', desc: '钩尖已经钝了，仍系着一截鱼线。' },
    { id: 'canvas-patch', name: '帆布补丁', rarity: 'common', icon: 'assets/collectibles/unique/canvas-patch.webp', desc: '补丁上缝着三种不同颜色的线。' },
    { id: 'tin-opener', name: '开罐器', rarity: 'common', icon: 'assets/collectibles/unique/tin-opener.webp', desc: '军用开罐器，折叠处锈死。' },
    { id: 'rope-knot', name: '旧绳结', rarity: 'common', icon: 'assets/collectibles/unique/rope-knot.webp', desc: '一个没有解开的双套结。' },
    { id: 'porthole-shard', name: '舷窗碎玻璃', rarity: 'common', icon: 'assets/collectibles/unique/porthole-shard.webp', desc: '厚玻璃边缘被海水磨圆。' },
    { id: 'brass-screw', name: '黄铜螺丝', rarity: 'common', icon: 'assets/collectibles/unique/brass-screw.webp', desc: '螺纹里塞满白色的盐。' },
    { id: 'oil-can', name: '小油壶', rarity: 'common', icon: 'assets/collectibles/unique/oil-can.webp', desc: '壶嘴还挂着最后一滴油。' },
    { id: 'deck-brush', name: '甲板刷', rarity: 'common', icon: 'assets/collectibles/unique/deck-brush.webp', desc: '刷毛只剩一半，木柄被手磨亮。' },
    { id: 'bottle-cap', name: '汽水瓶盖', rarity: 'common', icon: 'assets/collectibles/unique/bottle-cap.webp', desc: '瓶盖内侧印着旧港汽水厂的字。' },
    { id: 'signal-whistle', name: '信号哨', rarity: 'common', icon: 'assets/collectibles/unique/signal-whistle.webp', desc: '哨声还能响，只是很哑。' },
    { id: 'hand-line', name: '手钓线', rarity: 'common', icon: 'assets/collectibles/unique/hand-line.webp', desc: '缠在木轴上的尼龙线，末端挂着铅坠。' },
    { id: 'rust-nail', name: '锈钉', rarity: 'common', icon: 'assets/collectibles/unique/rust-nail.webp', desc: '钉头弯了，像被谁咬过。' },
    { id: 'tide-note', name: '潮汐便签', rarity: 'common', icon: 'assets/collectibles/unique/tide-note.webp', desc: '防水便签上记着明天的涨潮时间。' },
    { id: 'spoon-lure', name: '汤匙假饵', rarity: 'common', icon: 'assets/collectibles/unique/spoon-lure.webp', desc: '用汤匙柄磨成的鱼饵，还带着钩。' },
    { id: 'rubber-glove', name: '防水手套', rarity: 'common', icon: 'assets/collectibles/unique/rubber-glove.webp', desc: '左手手套，掌心补过三次。' },
    { id: 'chalk-block', name: '标记粉笔', rarity: 'common', icon: 'assets/collectibles/unique/chalk-block.webp', desc: '半截粉笔，能在钢板上画出白线。' },
    { id: 'wire-clip', name: '电线夹', rarity: 'common', icon: 'assets/collectibles/unique/wire-clip.webp', desc: '铜制线夹，弹簧仍然有力。' },
    { id: 'cork-stopper', name: '旧软木塞', rarity: 'common', icon: 'assets/collectibles/unique/cork-stopper.webp', desc: '塞子上有牙印和一圈旧蜡。' },
    { id: 'tin-cup', name: '搪瓷缸', rarity: 'common', icon: 'assets/collectibles/unique/tin-cup.webp', desc: '缸身印着褪色的港口徽记。' },
    { id: 'pocket-barometer', name: '袖珍气压表', rarity: 'uncommon', icon: 'assets/collectibles/unique/pocket-barometer.webp', desc: '表盘只有拇指大，指针停在暴雨前。' },
    { id: 'chart-ruler', name: '海图尺', rarity: 'uncommon', icon: 'assets/collectibles/unique/chart-ruler.webp', desc: '黄铜尺边刻着旧港到北岸的比例。' },
    { id: 'tide-almanac', name: '潮汐历书', rarity: 'uncommon', icon: 'assets/collectibles/unique/tide-almanac.webp', desc: '历书缺了封面，内页写满潮时。' },
    { id: 'camera-lens', name: '旧镜头', rarity: 'uncommon', icon: 'assets/collectibles/unique/camera-lens.webp', desc: '镜片有一道细裂，光圈还能转。' },
    { id: 'diving-knife', name: '潜水刀', rarity: 'uncommon', icon: 'assets/collectibles/unique/diving-knife.webp', desc: '刀鞘绑着褪色的橡胶带。' },
    { id: 'brass-gauge', name: '黄铜压力表', rarity: 'uncommon', icon: 'assets/collectibles/unique/brass-gauge.webp', desc: '表针停在红色区域之外。' },
    { id: 'crystal-radio', name: '矿石收音机', rarity: 'uncommon', icon: 'assets/collectibles/unique/crystal-radio.webp', desc: '不用电，耳机里仍有微弱电流声。' },
    { id: 'flare-pistol', name: '信号枪', rarity: 'uncommon', icon: 'assets/collectibles/unique/flare-pistol.webp', desc: '枪膛空着，扳机还能扣动。' },
    { id: 'fisher-creel', name: '鱼篓', rarity: 'uncommon', icon: 'assets/collectibles/unique/fisher-creel.webp', desc: '篓底垫着干海草，仍有鱼腥味。' },
    { id: 'copper-shade', name: '铜灯罩', rarity: 'uncommon', icon: 'assets/collectibles/unique/copper-shade.webp', desc: '灯罩内侧被烟熏成深褐色。' },
    { id: 'duty-logbook', name: '船员值勤本', rarity: 'uncommon', icon: 'assets/collectibles/unique/duty-logbook.webp', desc: '最后一页的值班签名只写了一半。' },
    { id: 'dock-token', name: '码头代币', rarity: 'uncommon', icon: 'assets/collectibles/unique/dock-token.webp', desc: '旧港码头的装卸筹码，边缘磨圆。' },
    { id: 'net-buoy', name: '网浮标', rarity: 'uncommon', icon: 'assets/collectibles/unique/net-buoy.webp', desc: '橙色浮标，系绳处缠着断网。' },
    { id: 'pocket-sextant', name: '袖珍六分仪', rarity: 'uncommon', icon: 'assets/collectibles/unique/pocket-sextant.webp', desc: '小到能放进口袋，刻度仍然准确。' },
    { id: 'brass-bell', name: '小铜铃', rarity: 'uncommon', icon: 'assets/collectibles/unique/brass-bell.webp', desc: '铃舌还在，摇动时声音很轻。' },
    { id: 'coral-handle', name: '珊瑚刀柄', rarity: 'uncommon', icon: 'assets/collectibles/unique/coral-handle.webp', desc: '刀柄由一整块珊瑚磨成。' },
    { id: 'tide-clock', name: '潮汐钟', rarity: 'uncommon', icon: 'assets/collectibles/unique/tide-clock.webp', desc: '钟面有两套指针，一套走时，一套走潮。' },
    { id: 'water-flask', name: '军用水壶', rarity: 'uncommon', icon: 'assets/collectibles/unique/water-flask.webp', desc: '壶身凹了一块，壶盖还能拧紧。' },
    { id: 'lighthouse-lens', name: '灯塔透镜', rarity: 'rare', icon: 'assets/collectibles/unique/lighthouse-lens.webp', desc: '多层玻璃仍能把光聚成一条线。' },
    { id: 'submarine-badge', name: '潜艇徽章', rarity: 'rare', icon: 'assets/collectibles/unique/submarine-badge.webp', desc: '徽章背面刻着下潜深度 380。' },
    { id: 'rescue-whistle', name: '救援哨', rarity: 'rare', icon: 'assets/collectibles/unique/rescue-whistle.webp', desc: '哨口有齿痕，绳结还是救援队的打法。' },
    { id: 'sunken-flag', name: '沉船旗', rarity: 'rare', icon: 'assets/collectibles/unique/sunken-flag.webp', desc: '旗面褪成灰白，仍能看出旧港的纹章。' },
    { id: 'brass-sextant', name: '航海六分仪', rarity: 'rare', icon: 'assets/collectibles/unique/brass-sextant.webp', desc: '弧尺比袖珍版更厚，镜片完好。' },
    { id: 'captain-chair', name: '船长椅', rarity: 'rare', icon: 'assets/collectibles/unique/captain-chair.webp', desc: '椅背刻着船长的姓名缩写。' },
    { id: 'morse-key', name: '摩尔斯电键', rarity: 'rare', icon: 'assets/collectibles/unique/morse-key.webp', desc: '电键底座灌满铅，按下去很沉。' },
    { id: 'chart-plotter', name: '海图绘图仪', rarity: 'rare', icon: 'assets/collectibles/unique/chart-plotter.webp', desc: '铜制分规与量角器装在同一只木盒里。' },
    { id: 'diving-pump', name: '潜水气泵', rarity: 'rare', icon: 'assets/collectibles/unique/diving-pump.webp', desc: '手摇气泵，皮碗已经干裂。' },
    { id: 'salt-idol', name: '盐蚀小像', rarity: 'rare', icon: 'assets/collectibles/unique/salt-idol.webp', desc: '看不清面孔的小像，像被海舔过。' },
    { id: 'beacon-gear', name: '灯塔齿轮', rarity: 'rare', icon: 'assets/collectibles/unique/beacon-gear.webp', desc: '齿轮组能带动整座灯塔的旋转灯座。' },
    { id: 'rescue-buoy', name: '救援浮标', rarity: 'rare', icon: 'assets/collectibles/unique/rescue-buoy.webp', desc: '浮标上写着可载十二人。' },
    { id: 'ghost-radio', name: '幽灵电台', rarity: 'epic', icon: 'assets/collectibles/unique/ghost-radio.webp', desc: '没有电源，偶尔会自己亮起一盏绿灯。' },
    { id: 'sunken-piano', name: '沉船钢琴', rarity: 'epic', icon: 'assets/collectibles/unique/sunken-piano.webp', desc: '琴键只剩白键，琴弦仍能发出低音。' },
    { id: 'tide-organ', name: '潮汐风琴', rarity: 'epic', icon: 'assets/collectibles/unique/tide-organ.webp', desc: '潮水穿过铜管时，它会自己发声。' },
    { id: 'abyss-mask', name: '深渊面具', rarity: 'epic', icon: 'assets/collectibles/unique/abyss-mask.webp', desc: '面具内侧刻着一行警告：不要向下看。' },
    { id: 'captain-sword', name: '船长佩剑', rarity: 'epic', icon: 'assets/collectibles/unique/captain-sword.webp', desc: '剑刃没有锈，剑鞘里却有海水。' },
    { id: 'storm-glass', name: '风暴瓶', rarity: 'epic', icon: 'assets/collectibles/unique/storm-glass.webp', desc: '瓶内结晶随天气变化，没人知道原理。' },
    { id: 'moon-anchor', name: '月光锚', rarity: 'legendary', icon: 'assets/collectibles/unique/moon-anchor.webp', desc: '锚爪上凝着不会融化的银色盐晶。' },
    { id: 'first-light', name: '初光罗盘', rarity: 'legendary', icon: 'assets/collectibles/unique/first-light.webp', desc: '罗盘玻璃里封着日出前第一缕光。' },
    { id: 'eel-generator', name: '电鳗发电机', rarity: 'legendary', icon: 'assets/collectibles/unique/eel-generator.webp', desc: '把电鳗的放电封进铜壳，给避难所留一盏不灭的灯。' },
    { id: 'golden-cannon', name: '黄金大炮', rarity: 'legendary', icon: 'assets/collectibles/unique/golden-cannon.webp', desc: '用沉船金条铸成的礼炮，只在找到新海域时鸣响。' },
    { id: 'seawater-filter', name: '海水过滤器', rarity: 'legendary', icon: 'assets/collectibles/unique/seawater-filter.webp', desc: '沉船医疗舱里的净水核心，也是净水舱的升级材料。', special: 'filter' },
    { id: 'sonar-core', name: '声呐核心', rarity: 'epic', icon: 'assets/collectibles/unique/sonar-core.webp', desc: '旧声呐阵列的主控核心，避难所升级的关键部件。', special: 'material' },
    { id: 'pressure-valve', name: '耐压阀', rarity: 'epic', icon: 'assets/collectibles/unique/pressure-valve.webp', desc: '能承受深海压力的黄铜阀门，用于扩建船体。', special: 'material' },
    { id: 'tide-cell', name: '潮汐电池', rarity: 'legendary', icon: 'assets/collectibles/unique/tide-cell.webp', desc: '仍在缓慢放电的旧时代电池，避难所终极扩建的核心。', special: 'material' }  ]);

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
      bonusText: '打捞币 +10%',
      reward: { credits: 1000, mats: { metal: 6, fiber: 6, glass: 6 } }
    },
    {
      id: 'deepsea', name: '深潜者', color: '#79d8ff',
      desc: '旧式留声机、深海潜水盔、沉船船钟',
      items: ['silver-musicbox', 'diving-helmet', 'ship-bell'],
      bonus: { credit: 0, mat: 0.1 },
      bonusText: '物资 +10%',
      reward: { credits: 1600, mats: { glass: 8, chip: 8, copper: 6 } }
    },
    {
      id: 'captain', name: '船长遗物', color: '#ffd166',
      desc: '船长航海日志、黑匣子、潮汐王冠',
      items: ['captain-log', 'black-box', 'tide-crown'],
      bonus: { credit: 0.1, mat: 0.1 },
      bonusText: '打捞币 +10% · 物资 +10%',
      reward: { credits: 3200, mats: { chip: 10, copper: 8 }, filters: 1 }
    },
    {
      id: 'harbor', name: '旧港务局', color: '#e2a06a',
      desc: '铜制气压计、旧港邮票册、航海信号旗、保险柜铭牌',
      items: ['brass-barometer', 'stamp-album', 'signal-flag', 'safe-plate'],
      bonus: { credit: 0.08, mat: 0.08 },
      bonusText: '打捞币 +8% · 物资 +8%',
      reward: { credits: 2600, mats: { metal: 8, glass: 8, fiber: 8 } }
    },
    {
      id: 'tide-lab', name: '潮汐研究站', color: '#d9b8ff',
      desc: '老式收音机、深海录音带、潮汐罗盘、月光珊瑚',
      items: ['old-radio', 'deep-tape', 'tide-compass', 'moon-coral'],
      bonus: { credit: 0.12, mat: 0.12 },
      bonusText: '打捞币 +12% · 物资 +12%',
      reward: { credits: 4800, mats: { chip: 12, copper: 10, glass: 8 }, filters: 1 }
    },
    {
      id: 'golden-fleet', name: '黄金舰队', color: '#ffdf72',
      desc: '电鳗发电机、黄金大炮、船长佩剑',
      items: ['eel-generator', 'golden-cannon', 'captain-sword'],
      bonus: { credit: 0.15, mat: 0.15 },
      bonusText: '打捞币 +15% · 物资 +15%',
      reward: { credits: 9000, mats: { chip: 18, copper: 16, glass: 12 }, filters: 1 }
    }
  ];

  // 收藏档案的架空世界记录。每件两段，详情弹窗会完整展示。
  CW.COLLECTIBLE_LORE = {
    'rusty-watch': [
      '潮线纪元 118 年，旧港的钟表匠把全城最后一枚机械表芯装进这只怀表。洪水来临时，他把它塞给正在撤往高地的女儿，说表停的时候，码头就彻底没了。',
      '后来避难所的人在淤泥里找到它，表针仍停在 03:17。阿盐坚持说那不是故障，而是旧世界替自己按下的暂停键。'
    ],
    'brass-key': [
      '钥匙来自一艘没有名字的邮轮。船员们在最后一周把客舱门全部焊死，只留下这一把能打开货舱的铜钥。',
      '货舱里没有救生艇，只有成箱的种子和一台还能用的收音机。老陈把钥匙挂在声呐舱门口，提醒所有人：门后面不一定有出口，但可能有人需要的东西。'
    ],
    'sea-bottle': [
      '瓶口的蜡封来自北方一座已经沉没的灯塔。里面的信纸被海水泡成半透明，只剩下一句“如果你们看到光，不要靠岸”。',
      '避难所的孩子把瓶子放在窗边，说等潮水退到最低的时候，信就会重新浮出来。没有人拆开它，因为空瓶子比坏消息更适合当纪念。'
    ],
    'old-coin': [
      '硬币正面是早已不存在的国徽，背面是一道被磨平的刻痕。旧世界的经济学家说它是通货，新世界的人只把它当护身符。',
      '阿盐每次出航前都会把它抛一次。正面代表顺风，反面代表有鱼，立起来代表今天最好别下海。至今只立起来过一次，那天他捡回了半船玻璃。'
    ],
    'crew-badge': [
      '三枚勋章属于同一支救援队。洪水第二年，他们在断桥下连续救了十七个人，然后连人带船被夜里的暗流带走。',
      '玻璃匣里还留着一张值班表，最后一格写着“明天继续”。避难所把这枚徽章放在档案最上层，不是因为荣誉，而是因为那句没写完的明天。'
    ],
    'brass-compass': [
      '罗盘产自旧城的航海学校，指针曾被磁暴拧弯。它不再指北，却会在沉船密集的方向轻轻发抖，像一条不肯说话的老狗。',
      '阿岚说这是海图师之间流传的“偏针”：信它的人找不到港口，但能找到别人没捞过的东西。'
    ],
    'waterproof-camera': [
      '相机里还剩十二张底片。前十一张是同一个黄昏：码头、空船、晾在栏杆上的雨衣，以及一个始终背对镜头的人。',
      '最后一张没有人敢冲洗。避难所把它锁进档案柜，旁边贴着便签：等我们不再害怕看见过去的时候再打开。'
    ],
    'chart-tube': [
      '图筒里是一张手绘海图，标注的却不是陆地，而是一片会移动的浅滩。图上用红笔圈了七个点，旁边写着“不要在同一天去两次”。',
      '小满照着图走过三次，每次都在第三个点捡到不同的铜件。她认为海图在更新，只是没人看得懂它更新的规则。'
    ],
    'copper-telescope': [
      '望远镜的镜片有一条裂纹，是船长在最后一次瞭望时摔的。裂纹刚好穿过旧港灯塔的位置，像一道提前画好的删除线。',
      '现在它被架在避难所最高处。阿岚用它看天气，老周用它看渔船，孩子们用它找海面上偶尔出现的白色水花。'
    ],
    'silver-musicbox': [
      '留声机只剩一首曲子，唱针落下去时会先咳三声，然后传出一段很慢的舞曲。维修记录写着：机械正常，听众缺席。',
      '每逢没有风的夜晚，避难所会把它搬到甲板上放一遍。没有人跳舞，但所有人都会不自觉地把手里的活放慢半拍。'
    ],
    'diving-helmet': [
      '潜水盔的面罩上有一道三道爪痕，深度足以划过铜板。头盔主人没有留下名字，只在内衬里缝了一行小字：下面有东西在看我。',
      '小满第一次戴它下水时，听见了很轻的敲击声。她上岸后说那是沉船的钢板在热胀冷缩，但从此再没在夜里下潜过。'
    ],
    'ship-bell': [
      '船钟来自一艘搁浅的渡轮。钟身刻着所有遇难者的名字，最下面一行是新刻的：把钟带回去，别把我们留在这里。',
      '钟被敲响时，声音会沿着水面传得很远。避难所只在两种时候敲它：找到失踪船只，或者有人没有按时返航。'
    ],
    'captain-log': [
      '航海日志的前半本记录着货单、潮汐和罚款，后半本变成了给家人的信。最后一页只有两个字：上浮。',
      '没有人知道船长最后有没有浮上来。日志被海水泡得发胀，但“上浮”两个字写得很重，像是把笔尖按进了纸里。'
    ],
    'black-box': [
      '黑匣子记录着沉没前最后十七分钟的无线电。大部分是电流噪声，中间夹着一段被反复呼叫的坐标，和一句“别相信灯塔”。',
      '老陈把它接进声呐台播放过一次。那晚所有仪器同时失灵了四分钟，之后他再没提过要修复它。'
    ],
    'tide-crown': [
      '王冠不是黄金，而是被海水反复打磨的月白色珊瑚。旧世界的贵族不会承认它，新世界的孩子却把它戴在头上扮演海神。',
      '潮汐王冠出现的那片海域没有沉船，只有一座被淹没的剧场。有人说它是舞台道具，也有人说它是最后一任岛主留给潮水的加冕。'
    ],
    'brass-barometer': [
      '气压计挂在旧港调度室的墙上，指针在洪水前三天就停在“持续降雨”。值班员以为仪器坏了，直到海水漫过窗台。',
      '现在它被放在避难所的天气台前。阿岚每天出门前都会看一眼，尽管指针从未动过；她说这不是预测，是提醒。'
    ],
    'sextant': [
      '六分仪的弧尺上刻着一条从旧港到北方群岛的航线。那条航线在地图上已经不存在，但仪器还记得角度。',
      '阿岚用它校准过三次太阳。第三次，她算出避难所正漂在一片没有名字的海上，于是把结果写进了新的海图。'
    ],
    'matchbook': [
      '火柴盒来自码头边一间没有招牌的旅馆。盒内衬纸上印着一句话：最后一根留给需要光的人。',
      '避难所只在停电的夜里打开它。三根火柴至今一根没少，阿盐说留着比点着更有用。'
    ],
    'stamp-album': [
      '邮票册收集了旧世界十二个港口的邮票，每个港口都已沉没。最后一页留着一枚没有邮戳的空白票。',
      '小满说那枚空白票是给未来的港口留的。她把它夹在航海日志里，等有一天找到一个能寄信的地方。'
    ],
    'glass-float': [
      '浮球原本属于一张远洋渔网。渔网被暗流撕碎后，它独自漂了两年，最后撞上避难所的船壳。',
      '球里封着一小撮海水和几粒沙。孩子们把它举到耳边，说能听见很远的地方在退潮。'
    ],
    'rusty-gear': [
      '齿轮是从旧码头吊臂上拆下来的，齿牙缺了两颗，轴上还缠着断掉的钢缆。',
      '老周没有把它回炉。他把它钉在工作间门口，当作一块提醒：机器可以旧，但不能不知道什么时候停。'
    ],
    'copper-spool': [
      '铜线卷曾属于岛上的广播站。洪水来临时，值班员用它把最后一句话送了出去，然后剪断了线。',
      '线头还留着剪痕。老陈试过把它接回电台，但每次接通，喇叭里都只有海浪。'
    ],
    'ship-lamp': [
      '船用灯泡来自一艘夜航渡轮。灯丝断了一截，玻璃罩却完好无损，像有人特意把它从灯座上拧下来。',
      '避难所把它挂在档案室的角落。灯泡不再发亮，但所有人在那里说话都会不自觉放轻声音。'
    ],
    'telegraph-key': [
      '电报键连接过旧港与北岸的灯塔。最后一份电报只有六个字：灯已灭，勿靠岸。',
      '老陈把它接在声呐台上当测试键。按下时，整座避难所的灯会同步暗一下，像旧世界在回电。'
    ],
    'signal-flag': [
      '信号旗是救援队留下的，旗角绣着“全员平安”。旗面被风撕开，但那四个字没有散。',
      '现在它挂在避难所入口。每次有人出海，值班的人都会把旗子重新系紧一次。'
    ],
    'brass-lantern': [
      '油灯来自沉船船长室。灯罩上的烟熏痕迹说明它被点了很久，灯芯却还是湿的。',
      '老周把它放在工作间备用。他说这盏灯照不远，但刚好够看清手边的东西。'
    ],
    'mess-tin': [
      '饭盒底部刻着一个名字，被刀划掉了一半。盒盖内侧贴着一张褪色的值班表。',
      '避难所把它当零件盒用。阿盐每次打开都会先看一眼那个名字，虽然没有人知道那是谁。'
    ],
    'sewing-machine': [
      '缝纫机来自旧港的裁缝铺。针还穿着线，线头一直延伸到舱门外，像有人缝到一半被叫走了。',
      '小满用它补过三次帆布。每次踩踏板，机器都会先顿一下，然后才慢慢转起来。'
    ],
    'old-radio': [
      '收音机的旋钮停在无人使用的频率上。老陈说那是旧世界的应急频道，只在整点前后有人呼吸。',
      '避难所没有人敢把它关掉。它耗电很少，却让夜晚显得不那么空。'
    ],
    'safe-plate': [
      '保险柜铭牌编号 0417，正是洪水漫过码头的那一天。铭牌背面粘着一小片烧焦的收据。',
      '阿盐把它钉在仓库门口。他说这不是纪念灾难，是提醒大家：东西锁得再紧，也得有人记得密码。'
    ],
    'deep-tape': [
      '磁带是在沉船声呐舱里找到的。标签上只写着“深度 1,200”，录音里只有水压和一段很远的敲击。',
      '老陈听了一遍就收了起来。他说那不是求救，是有人在很深的地方确认上面还有没有活人。'
    ],
    'tide-compass': [
      '罗盘不指北，只指向当天潮水最高的地方。指针会在日出和日落时轻轻转半圈，像在换气。',
      '阿岚用它找到过一片只在满潮出现的浅滩。她坚持说这不是魔法，只是海把路藏得比较深。'
    ],
    'captain-pipe': [
      '烟斗属于一位没有留下名字的船长。斗钵里没有烟丝，只有一层白色的盐。',
      '老周把它放在吊臂控制台旁。每次放货箱前，他都会敲一敲烟斗，像在跟谁打招呼。'
    ],
    'moon-coral': [
      '珊瑚在暗处会发出很淡的蓝光。它不属于任何沉船，像是在海底自己长出来的一小片月亮。',
      '小满把它养在净水舱里。每到夜里，舱壁就会亮起一条细细的蓝线，像潮水留下的刻度。'
    ],
    'tide-button': [
      '潮汐铜扣是在旧港退潮后的泥滩被找到的。铜扣上刻着旧港潮汐表的刻度。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'cracked-mug': [
      '缺口搪瓷杯是在北岸灯塔的守塔室被找到的。杯沿缺了一角，杯底还留着茶渍。',
      '阿岚在日志里补了一行来历。'
    ],
    'cork-float': [
      '软木浮子是在一艘倒扣的救生艇下被找到的。渔网上的浮子，木纹里嵌着细沙。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'deck-bolt': [
      '甲板螺栓是在沉船厨房的储物柜被找到的。从沉船甲板拧下来的六角螺栓。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'salt-spoon': [
      '盐蚀汤匙是在被海水灌满的船长室被找到的。汤匙被盐蚀出坑，柄上刻着船名。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'fish-hook': [
      '旧鱼钩是在旧码头第三根系缆柱旁被找到的。钩尖已经钝了，仍系着一截鱼线。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'canvas-patch': [
      '帆布补丁是在鱼市倒塌的冷库被找到的。补丁上缝着三种不同颜色的线。',
      '老陈坚持说这是海在还债。'
    ],
    'tin-opener': [
      '开罐器是在潮沟尽头的废船坞被找到的。军用开罐器，折叠处锈死。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'rope-knot': [
      '旧绳结是在一座只剩半截的栈桥被找到的。一个没有解开的双套结。',
      '阿岚在日志里补了一行来历。'
    ],
    'porthole-shard': [
      '舷窗碎玻璃是在珊瑚礁背风面的浅坑被找到的。厚玻璃边缘被海水磨圆。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'brass-screw': [
      '黄铜螺丝是在沉船机舱的积水里被找到的。螺纹里塞满白色的盐。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'oil-can': [
      '小油壶是在避难所漂来的漂流物堆被找到的。壶嘴还挂着最后一滴油。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'deck-brush': [
      '甲板刷是在旧港退潮后的泥滩被找到的。刷毛只剩一半，木柄被手磨亮。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'bottle-cap': [
      '汽水瓶盖是在北岸灯塔的守塔室被找到的。瓶盖内侧印着旧港汽水厂的字。',
      '老陈坚持说这是海在还债。'
    ],
    'signal-whistle': [
      '信号哨是在一艘倒扣的救生艇下被找到的。哨声还能响，只是很哑。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'hand-line': [
      '手钓线是在沉船厨房的储物柜被找到的。缠在木轴上的尼龙线，末端挂着铅坠。',
      '阿岚在日志里补了一行来历。'
    ],
    'rust-nail': [
      '锈钉是在被海水灌满的船长室被找到的。钉头弯了，像被谁咬过。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'tide-note': [
      '潮汐便签是在旧码头第三根系缆柱旁被找到的。防水便签上记着明天的涨潮时间。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'spoon-lure': [
      '汤匙假饵是在鱼市倒塌的冷库被找到的。用汤匙柄磨成的鱼饵，还带着钩。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'rubber-glove': [
      '防水手套是在潮沟尽头的废船坞被找到的。左手手套，掌心补过三次。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'chalk-block': [
      '标记粉笔是在一座只剩半截的栈桥被找到的。半截粉笔，能在钢板上画出白线。',
      '老陈坚持说这是海在还债。'
    ],
    'wire-clip': [
      '电线夹是在珊瑚礁背风面的浅坑被找到的。铜制线夹，弹簧仍然有力。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'cork-stopper': [
      '旧软木塞是在沉船机舱的积水里被找到的。塞子上有牙印和一圈旧蜡。',
      '阿岚在日志里补了一行来历。'
    ],
    'tin-cup': [
      '搪瓷缸是在避难所漂来的漂流物堆被找到的。缸身印着褪色的港口徽记。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'pocket-barometer': [
      '袖珍气压表是在旧港退潮后的泥滩被找到的。表盘只有拇指大，指针停在暴雨前。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'chart-ruler': [
      '海图尺是在北岸灯塔的守塔室被找到的。黄铜尺边刻着旧港到北岸的比例。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'tide-almanac': [
      '潮汐历书是在一艘倒扣的救生艇下被找到的。历书缺了封面，内页写满潮时。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'camera-lens': [
      '旧镜头是在沉船厨房的储物柜被找到的。镜片有一道细裂，光圈还能转。',
      '老陈坚持说这是海在还债。'
    ],
    'diving-knife': [
      '潜水刀是在被海水灌满的船长室被找到的。刀鞘绑着褪色的橡胶带。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'brass-gauge': [
      '黄铜压力表是在旧码头第三根系缆柱旁被找到的。表针停在红色区域之外。',
      '阿岚在日志里补了一行来历。'
    ],
    'crystal-radio': [
      '矿石收音机是在鱼市倒塌的冷库被找到的。不用电，耳机里仍有微弱电流声。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'flare-pistol': [
      '信号枪是在潮沟尽头的废船坞被找到的。枪膛空着，扳机还能扣动。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'fisher-creel': [
      '鱼篓是在一座只剩半截的栈桥被找到的。篓底垫着干海草，仍有鱼腥味。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'copper-shade': [
      '铜灯罩是在珊瑚礁背风面的浅坑被找到的。灯罩内侧被烟熏成深褐色。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'duty-logbook': [
      '船员值勤本是在沉船机舱的积水里被找到的。最后一页的值班签名只写了一半。',
      '老陈坚持说这是海在还债。'
    ],
    'dock-token': [
      '码头代币是在避难所漂来的漂流物堆被找到的。旧港码头的装卸筹码，边缘磨圆。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'net-buoy': [
      '网浮标是在旧港退潮后的泥滩被找到的。橙色浮标，系绳处缠着断网。',
      '阿岚在日志里补了一行来历。'
    ],
    'pocket-sextant': [
      '袖珍六分仪是在北岸灯塔的守塔室被找到的。小到能放进口袋，刻度仍然准确。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'brass-bell': [
      '小铜铃是在一艘倒扣的救生艇下被找到的。铃舌还在，摇动时声音很轻。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'coral-handle': [
      '珊瑚刀柄是在沉船厨房的储物柜被找到的。刀柄由一整块珊瑚磨成。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'tide-clock': [
      '潮汐钟是在被海水灌满的船长室被找到的。钟面有两套指针，一套走时，一套走潮。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'water-flask': [
      '军用水壶是在旧码头第三根系缆柱旁被找到的。壶身凹了一块，壶盖还能拧紧。',
      '老陈坚持说这是海在还债。'
    ],
    'lighthouse-lens': [
      '灯塔透镜是在鱼市倒塌的冷库被找到的。多层玻璃仍能把光聚成一条线。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'submarine-badge': [
      '潜艇徽章是在潮沟尽头的废船坞被找到的。徽章背面刻着下潜深度 380。',
      '阿岚在日志里补了一行来历。'
    ],
    'rescue-whistle': [
      '救援哨是在一座只剩半截的栈桥被找到的。哨口有齿痕，绳结还是救援队的打法。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'sunken-flag': [
      '沉船旗是在珊瑚礁背风面的浅坑被找到的。旗面褪成灰白，仍能看出旧港的纹章。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'brass-sextant': [
      '航海六分仪是在沉船机舱的积水里被找到的。弧尺比袖珍版更厚，镜片完好。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'captain-chair': [
      '船长椅是在避难所漂来的漂流物堆被找到的。椅背刻着船长的姓名缩写。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'morse-key': [
      '摩尔斯电键是在旧港退潮后的泥滩被找到的。电键底座灌满铅，按下去很沉。',
      '老陈坚持说这是海在还债。'
    ],
    'chart-plotter': [
      '海图绘图仪是在北岸灯塔的守塔室被找到的。铜制分规与量角器装在同一只木盒里。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'diving-pump': [
      '潜水气泵是在一艘倒扣的救生艇下被找到的。手摇气泵，皮碗已经干裂。',
      '阿岚在日志里补了一行来历。'
    ],
    'salt-idol': [
      '盐蚀小像是在沉船厨房的储物柜被找到的。看不清面孔的小像，像被海舔过。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'beacon-gear': [
      '灯塔齿轮是在被海水灌满的船长室被找到的。齿轮组能带动整座灯塔的旋转灯座。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'rescue-buoy': [
      '救援浮标是在旧码头第三根系缆柱旁被找到的。浮标上写着可载十二人。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'ghost-radio': [
      '幽灵电台是在鱼市倒塌的冷库被找到的。没有电源，偶尔会自己亮起一盏绿灯。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'sunken-piano': [
      '沉船钢琴是在潮沟尽头的废船坞被找到的。琴键只剩白键，琴弦仍能发出低音。',
      '老陈坚持说这是海在还债。'
    ],
    'tide-organ': [
      '潮汐风琴是在一座只剩半截的栈桥被找到的。潮水穿过铜管时，它会自己发声。',
      '阿盐把它擦干后放进了档案柜。'
    ],
    'abyss-mask': [
      '深渊面具是在珊瑚礁背风面的浅坑被找到的。面具内侧刻着一行警告：不要向下看。',
      '阿岚在日志里补了一行来历。'
    ],
    'captain-sword': [
      '船长佩剑是在沉船机舱的积水里被找到的。剑刃没有锈，剑鞘里却有海水。',
      '值夜的老周把它挂在任务栏旁边。'
    ],
    'storm-glass': [
      '风暴瓶是在避难所漂来的漂流物堆被找到的。瓶内结晶随天气变化，没人知道原理。',
      '老周用淡水冲了三遍才看清上面的字。'
    ],
    'moon-anchor': [
      '月光锚是在旧港退潮后的泥滩被找到的。锚爪上凝着不会融化的银色盐晶。',
      '阿盐和小满把它放在窗边，让潮声替它说话。'
    ],
    'first-light': [
      '初光罗盘是在北岸灯塔的守塔室被找到的。罗盘玻璃里封着日出前第一缕光。',
      '小满用旧布包好，没让任何人碰。'
    ],
    'eel-generator': [
      '电鳗发电机来自旧港的水下实验站。铜壳里养着一条电鳗，它每游一圈，避难所的灯就会亮一下。',
      '工程师们始终没弄明白它靠什么进食。老周说别问，问了它就会罢工。'
    ],
    'golden-cannon': [
      '黄金大炮是用沉船金条熔铸的，炮膛里没有火药，只有一层细盐。它从没打过仗，只在找到新海域时鸣响。',
      '每次炮声过后，海面会短暂地安静下来。阿盐说那是旧世界在听我们走到哪里了。'
    ],
    'seawater-filter': [
      '过滤器来自沉船医疗舱。它还在工作，只是滤芯里积着十七年的盐和铁锈。拆开它的时候，流出来的水是清的。',
      '净水舱的第一任工程师说，这不是一台机器，是一个还在替旧世界赎罪的器官。'
    ],
    'sonar-core': [
      '声呐核心原本装在旧海军的监听站里。它最后一次完整记录到的声音，是一段很长的鲸歌，之后就是持续的静默。',
      '老陈把它接入阵列时，屏幕上的回波短暂地排成了一条直线，像有人在很深的地方敲了一下墙。'
    ],
    'pressure-valve': [
      '耐压阀来自一艘实验潜艇。阀体上刻着“额定深度 380 米”，但潜艇最后的位置在 1,200 米以下。',
      '工程师们至今没弄明白它为什么没有先被压扁。避难所把它装在船体最薄弱的位置，算是一种不太科学的祝福。'
    ],
    'tide-cell': [
      '潮汐电池的外壳已经被盐蚀出花纹，但内部的电芯仍在缓慢放电。检测结果显示，它还能再撑三十年。',
      '没人知道旧世界用什么方法把潮汐封进了金属里。避难所把它接进主电网的那晚，整座船的灯第一次同时亮了起来。'
    ]
  };

  // Equippable relic effects. Every owned collectible can be placed in one of
  // three archive slots; the bonus is passive while equipped.
  CW.COLLECTIBLE_RELICS = {
    'rusty-watch': { label: '抓钩 +2 秒', bonus: { time: 2 } },
    'brass-key': { label: '声呐 +1 次', bonus: { probes: 1 } },
    'sea-bottle': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'old-coin': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'crew-badge': { label: '三消 +1 步', bonus: { moves: 1 } },
    'brass-compass': { label: '声呐 +1 次 · 抓钩 +1 秒', bonus: { probes: 1, time: 1 } },
    'waterproof-camera': { label: '打捞币 +3%', bonus: { credit: 0.03 } },
    'chart-tube': { label: '抓钩 +4 秒', bonus: { time: 4 } },
    'copper-telescope': { label: '三消 +2 步', bonus: { moves: 2 } },
    'silver-musicbox': { label: '打捞币 +5%', bonus: { credit: 0.05 } },
    'diving-helmet': { label: '抓钩 +5 秒', bonus: { time: 5 } },
    'ship-bell': { label: '声呐 +2 次', bonus: { probes: 2 } },
    'captain-log': { label: '抓钩 +2 秒 · 三消 +2 步', bonus: { time: 2, moves: 2 } },
    'black-box': { label: '打捞币 +6% · 声呐 +1 次', bonus: { credit: 0.06, probes: 1 } },
    'tide-crown': { label: '全收益 +8% · 抓钩 +3 秒 · 三消 +2 步 · 声呐 +2 次', bonus: { credit: 0.08, mat: 0.08, time: 3, moves: 2, probes: 2 } },
    'brass-barometer': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'sextant': { label: '声呐 +1 次 · 物资 +3%', bonus: { probes: 1, mat: 0.03 } },
    'matchbook': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'stamp-album': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'glass-float': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'rusty-gear': { label: '抓钩 +1 秒', bonus: { time: 1 } },
    'copper-spool': { label: '三消 +1 步', bonus: { moves: 1 } },
    'ship-lamp': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'telegraph-key': { label: '声呐 +1 次', bonus: { probes: 1 } },
    'signal-flag': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'brass-lantern': { label: '抓钩 +2 秒', bonus: { time: 2 } },
    'mess-tin': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'sewing-machine': { label: '三消 +1 步 · 物资 +2%', bonus: { moves: 1, mat: 0.02 } },
    'old-radio': { label: '声呐 +2 次 · 打捞币 +4%', bonus: { probes: 2, credit: 0.04 } },
    'safe-plate': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'deep-tape': { label: '全收益 +4%', bonus: { credit: 0.04, mat: 0.04 } },
    'tide-compass': { label: '抓钩 +4 秒 · 声呐 +2 次', bonus: { time: 4, probes: 2 } },
    'captain-pipe': { label: '打捞币 +3% · 抓钩 +1 秒', bonus: { credit: 0.03, time: 1 } },
    'moon-coral': { label: '全收益 +6% · 三消 +2 步', bonus: { credit: 0.06, mat: 0.06, moves: 2 } },
    'tide-button': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'cracked-mug': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'cork-float': { label: '抓钩 +1 秒', bonus: { time: 1 } },
    'deck-bolt': { label: '三消 +1 步', bonus: { moves: 1 } },
    'salt-spoon': { label: '声呐 +1 次', bonus: { probes: 1 } },
    'fish-hook': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'canvas-patch': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'tin-opener': { label: '抓钩 +1 秒', bonus: { time: 1 } },
    'rope-knot': { label: '三消 +1 步', bonus: { moves: 1 } },
    'porthole-shard': { label: '声呐 +1 次', bonus: { probes: 1 } },
    'brass-screw': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'oil-can': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'deck-brush': { label: '抓钩 +1 秒', bonus: { time: 1 } },
    'bottle-cap': { label: '三消 +1 步', bonus: { moves: 1 } },
    'signal-whistle': { label: '声呐 +1 次', bonus: { probes: 1 } },
    'hand-line': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'rust-nail': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'tide-note': { label: '抓钩 +1 秒', bonus: { time: 1 } },
    'spoon-lure': { label: '三消 +1 步', bonus: { moves: 1 } },
    'rubber-glove': { label: '声呐 +1 次', bonus: { probes: 1 } },
    'chalk-block': { label: '打捞币 +1%', bonus: { credit: 0.01 } },
    'wire-clip': { label: '物资 +1%', bonus: { mat: 0.01 } },
    'cork-stopper': { label: '抓钩 +1 秒', bonus: { time: 1 } },
    'tin-cup': { label: '三消 +1 步', bonus: { moves: 1 } },
    'pocket-barometer': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'chart-ruler': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'tide-almanac': { label: '抓钩 +2 秒', bonus: { time: 2 } },
    'camera-lens': { label: '三消 +1 步 · 物资 +1%', bonus: { moves: 1, mat: 0.01 } },
    'diving-knife': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'brass-gauge': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'crystal-radio': { label: '抓钩 +2 秒', bonus: { time: 2 } },
    'flare-pistol': { label: '三消 +1 步 · 物资 +1%', bonus: { moves: 1, mat: 0.01 } },
    'fisher-creel': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'copper-shade': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'duty-logbook': { label: '抓钩 +2 秒', bonus: { time: 2 } },
    'dock-token': { label: '三消 +1 步 · 物资 +1%', bonus: { moves: 1, mat: 0.01 } },
    'net-buoy': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'pocket-sextant': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'brass-bell': { label: '抓钩 +2 秒', bonus: { time: 2 } },
    'coral-handle': { label: '三消 +1 步 · 物资 +1%', bonus: { moves: 1, mat: 0.01 } },
    'tide-clock': { label: '打捞币 +2%', bonus: { credit: 0.02 } },
    'water-flask': { label: '物资 +2%', bonus: { mat: 0.02 } },
    'lighthouse-lens': { label: '打捞币 +3% · 声呐 +1 次', bonus: { credit: 0.03, probes: 1 } },
    'submarine-badge': { label: '物资 +3% · 抓钩 +1 秒', bonus: { mat: 0.03, time: 1 } },
    'rescue-whistle': { label: '三消 +2 步 · 打捞币 +2%', bonus: { moves: 2, credit: 0.02 } },
    'sunken-flag': { label: '打捞币 +3% · 声呐 +1 次', bonus: { credit: 0.03, probes: 1 } },
    'brass-sextant': { label: '物资 +3% · 抓钩 +1 秒', bonus: { mat: 0.03, time: 1 } },
    'captain-chair': { label: '三消 +2 步 · 打捞币 +2%', bonus: { moves: 2, credit: 0.02 } },
    'morse-key': { label: '打捞币 +3% · 声呐 +1 次', bonus: { credit: 0.03, probes: 1 } },
    'chart-plotter': { label: '物资 +3% · 抓钩 +1 秒', bonus: { mat: 0.03, time: 1 } },
    'diving-pump': { label: '三消 +2 步 · 打捞币 +2%', bonus: { moves: 2, credit: 0.02 } },
    'salt-idol': { label: '打捞币 +3% · 声呐 +1 次', bonus: { credit: 0.03, probes: 1 } },
    'beacon-gear': { label: '物资 +3% · 抓钩 +1 秒', bonus: { mat: 0.03, time: 1 } },
    'rescue-buoy': { label: '三消 +2 步 · 打捞币 +2%', bonus: { moves: 2, credit: 0.02 } },
    'ghost-radio': { label: '全收益 +4% · 抓钩 +2 秒', bonus: { credit: 0.04, mat: 0.04, time: 2 } },
    'sunken-piano': { label: '全收益 +5% · 声呐 +1 次', bonus: { credit: 0.05, mat: 0.05, probes: 1 } },
    'tide-organ': { label: '全收益 +4% · 抓钩 +2 秒', bonus: { credit: 0.04, mat: 0.04, time: 2 } },
    'abyss-mask': { label: '全收益 +5% · 声呐 +1 次', bonus: { credit: 0.05, mat: 0.05, probes: 1 } },
    'captain-sword': { label: '全收益 +4% · 抓钩 +2 秒', bonus: { credit: 0.04, mat: 0.04, time: 2 } },
    'storm-glass': { label: '全收益 +5% · 声呐 +1 次', bonus: { credit: 0.05, mat: 0.05, probes: 1 } },
    'moon-anchor': { label: '全收益 +7% · 抓钩 +2 秒 · 三消 +2 步', bonus: { credit: 0.07, mat: 0.07, time: 2, moves: 2 } },
    'first-light': { label: '全收益 +7% · 抓钩 +2 秒 · 三消 +2 步', bonus: { credit: 0.07, mat: 0.07, time: 2, moves: 2 } },
    'eel-generator': { label: '抓钩 +5 秒 · 声呐 +2 次', bonus: { time: 5, probes: 2 } },
    'golden-cannon': { label: '全收益 +8% · 打捞币 +2%', bonus: { credit: 0.1, mat: 0.08 } },
  };

  CW.collectiblesOfRarity = function (rarity) {
    var out = [];
    for (var k = 0; k < COLLECTIBLES.length; k++) {
      if (COLLECTIBLES[k].rarity === rarity && !COLLECTIBLES[k].special) out.push(COLLECTIBLES[k]);
    }
    return out;
  };

  CW.DISMANTLE_YIELDS = {
    common: { metal: 3, fiber: 2 },
    uncommon: { metal: 4, chip: 2, glass: 2 },
    rare: { metal: 6, fuel: 2, chip: 3, glass: 3, copper: 2 },
    epic: { metal: 10, fuel: 4, fiber: 4, chip: 5, glass: 4, copper: 4 },
    legendary: { metal: 16, fuel: 6, fiber: 6, chip: 8, glass: 6, copper: 6 }
  };

  CW.rollSpecialMaterial = function () {
    var pool = [
      { id: 'sonar-core', weight: 52 },
      { id: 'pressure-valve', weight: 33 },
      { id: 'tide-cell', weight: 15 }
    ];
    var total = 0;
    for (var i = 0; i < pool.length; i++) total += pool[i].weight;
    var roll = Math.random() * total;
    for (var j = 0; j < pool.length; j++) {
      roll -= pool[j].weight;
      if (roll <= 0) return pool[j].id;
    }
    return pool[0].id;
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
