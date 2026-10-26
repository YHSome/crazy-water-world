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

处理方式：通过 Iconify 指定颜色下载为 SVG，未修改图形轮廓。

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
