# 图片、图标与音乐来源

本项目不再使用手绘场景/物件。以下素材均为本地文件，页面不依赖远程图床。  
代码使用 MIT；图片、图标与音乐分别遵循下方各自授权。

## 场景照片 · Pexels

Pexels License：https://www.pexels.com/license/  
允许免费使用、修改和商用，无需署名；以下署名仅用于记录来源。

| 本地文件 | 用途 | 摄影师 | 来源 |
| --- | --- | --- | --- |
| `assets/bg-title.webp` | 标题背景（Aceredo 水淹村庄） | Liane Ferreira | https://www.pexels.com/photo/29144886/ |
| `assets/bg-hub.webp` | 避难所背景（锈蚀渔船） | Pok Rie | https://www.pexels.com/photo/7099670/ |
| `assets/bg-hook.webp` | 沉城抓钩背景（海底沉船） | Harvey Clements | https://www.pexels.com/photo/15463400/ |
| `assets/bg-match.webp` | 废料拼图背景（废弃控制室） | Muhammet Çolak | https://www.pexels.com/photo/7360328/ |
| `assets/bg-sonar.webp` | 声呐扫掠背景（潜艇控制面板） | Jørgen Larsen | https://www.pexels.com/sk-sk/photo/ovladaci-panel-ponorky-11398989/ |

处理方式：裁切、缩放、调色、压缩为 WebP。

## 物件与 UI 图标 · Game-icons.net

来源：https://game-icons.net/  
通过 Iconify 下载：https://icon-sets.iconify.design/game-icons/  
授权：CC BY 3.0 · https://creativecommons.org/licenses/by/3.0/  
作者：Game-icons.net 社区，包括 Lorc、Delapouite、Skoll 等贡献者。

使用图标：

- `metal-plate` — 废铁 / 三消废铁
- `barrel` — 燃料桶
- `rope-coil` — 纤维
- `microchip` — 芯片
- `strongbox` — 保险箱
- `gold-bar` — 金条
- `land-mine` — 水雷
- `first-aid-kit` — 医疗包
- `fishing-hook` — 沉城抓钩
- `puzzle` — 废料拼图
- `cargo-crate` — 仓库扩容
- `gears` — 打捞工坊
- `radar-sweep` — 声呐阵列
- `reactor` — 聚变核心
- `pulley-hook` — 抓钩滑轮
- `two-coins` — 打捞币
- `sound-on` / `sound-off` — 声音开关
- `cog` — 设置
- `return-arrow` — 返回
- `cancel` — 关闭

`tile-metal`、`tile-fuel`、`tile-fiber`、`tile-chip`、`tile-medkit` 是上述同源图标的白色重上色版本，用于三消棋盘。

沉船收藏（`assets/collectibles/`）使用 Pexels 写实照片，而非线稿图标：

| 本地文件 | 收藏 | 摄影师 | 来源 |
| --- | --- | --- | --- |
| `rusty-watch.webp` | 锈蚀怀表 | Rezoana Amin Rayna | https://www.pexels.com/photo/4443658/ |
| `brass-key.webp` | 旧船门钥 | Andrea Piacquadio | https://www.pexels.com/photo/3769979/ |
| `sea-bottle.webp` | 海水玻璃瓶 | Valentin Ivantsov | https://www.pexels.com/photo/34557218/ |
| `old-coin.webp` | 旧时代硬币 | Erick González González | https://www.pexels.com/photo/38598949/ |
| `crew-badge.webp` | 船员勋章 | Suzy Hazelwood | https://www.pexels.com/photo/2040276/ |
| `brass-compass.webp` | 黄铜罗盘 | Ylanite Koppens | https://www.pexels.com/photo/14436288/ |
| `waterproof-camera.webp` | 防水相机 | Wallace Chuck | https://www.pexels.com/photo/4939936/ |
| `chart-tube.webp` | 航线图筒 | Moein Moradi | https://www.pexels.com/photo/7190498/ |
| `copper-telescope.webp` | 铜制望远镜 | Earth Photart | https://www.pexels.com/photo/39590146/ |
| `silver-musicbox.webp` | 旧式留声机 | Adeetha Weerasekara | https://www.pexels.com/photo/36282708/ |
| `diving-helmet.webp` | 深海潜水盔 | Pexels User | https://www.pexels.com/photo/31642674/ |
| `ship-bell.webp` | 沉船船钟 | Jan van der Wolf | https://www.pexels.com/photo/29626228/ |
| `captain-log.webp` | 船长航海日志 | Abdellah Benziane | https://www.pexels.com/photo/38019365/ |
| `black-box.webp` | 黑匣子 | betül nur akyürek | https://www.pexels.com/photo/38074199/ |
| `tide-crown.webp` | 潮汐王冠 | Regan Dsouza | https://www.pexels.com/photo/32937227/ |

处理方式：统一方形裁切、调色、压缩为 360×360 WebP。遵循 Pexels License，无远程图床。

## 海水过滤器

`assets/seawater-filter.webp`、`assets/seawater-filter-icon.webp`、`favicon.png` 来自用户提供的图片。  
已按水印位置裁切，移除左上角「AI生成」与右下角「千问」标记；随后缩放并压缩为 WebP / PNG。

## 背景音乐

- 曲目：**RUOK – Apocalyptic Loop D**
- 作者：RUOK
- 来源：https://opengameart.org/content/ruok-apocalyptic-loopstracks
- 授权：**CC BY 4.0** · https://creativecommons.org/licenses/by/4.0/
- 本地文件：`assets/bgm-floodline.mp3`
- 处理方式：仅从作者发布的 MP3 包中提取单曲，未做二次混音；游戏内循环播放。

## 预览图

`docs/preview-*.webp` 由本项目运行时的界面截图生成，因此包含上述图片素材。
