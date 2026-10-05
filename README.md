# Devosfera 博客

基于 [AstroPaper](https://github.com/satnaing/astro-paper) 主题深度定制，全新审美风格、图集功能、全站搜索、音乐播放器以及数十处视觉与交互改进。

**🌐 在线预览：** [coaar.com](https://coaar.com)

![Devosfera OG](public/devosfera-og.webp)

> **说明：** 这是我的个人博客项目。如果你想拿去用，直接删掉文章内容、修改配置即可。

> [!IMPORTANT]
> **社交链接和个人信息已从硬编码迁移到环境变量。**
> 这样 fork 仓库不会泄露原作者的私人信息。
> 复制 `.env.example` → `.env` 并填入自己的值，详见[配置说明](#-配置)。

---

## 目录

1. [✨ 特性](#-特性)
2. [🚀 项目结构](#-项目结构)
3. [👨🏻‍💻 安装与本地开发](#-安装与本地开发)
4. [🧞 常用命令](#-常用命令)
5. [📝 创建内容](#-创建内容)
   - [文章](#文章-srcdataposts)
   - [图集](#图集-srcdatagalleries)
6. [🖼️ GalleryEmbed 组件](#️galleryembed-组件)
7. [⚙️ 配置](#️配置)
8. [📜 开源协议](#-开源协议)

---

## ✨ 特性

### 核心能力（继承自 AstroPaper）

- 类型安全的 Markdown/MDX，高性能，可访问性友好，响应式布局
- 完整 SEO：meta 标签、Open Graph、站点地图、RSS、浅色/深色模式

### 设计与交互

- 首页终端风格 Hero（`src/config.ts` 里 `heroTerminalPrompt` 可配置）
- 全局背景（网格 + 光标辉光 + 噪点纹理）可配置开关
- 导航栏、卡片、弹窗的毛玻璃效果
- 文章卡片鼠标悬浮封面放大

### 字体

| 角色 | 字体 |
| :--- | :--- |
| 正文 | `Wotfard`（本地） |
| 代码/等宽 | `Cascadia Code`（本地） |
| 斜体/H3 | `Sriracha`（本地） |

### 全站搜索（⌘K）

- `⌘K` / `Ctrl+K` 唤起，基于 **Pagefind**（生产构建生成静态索引），支持键盘导航
- 本地测试搜索需先 `pnpm run build` 再 `pnpm run preview`（开发模式不生成索引）

### 图集功能（`/galleries`）

- 相册存放在 `src/data/galleries/<slug>/`；图片构建时自动优化（srcset、WebP、懒加载）
- 原生 `<dialog>` 灯箱、自定义全屏布局、键盘导航、边缘感知的上/下一张按钮
- `<GalleryEmbed>` 可在 MDX 文章中直接嵌入图集，无需 import
- 由 `src/config.ts` 里的 `showGalleries` 开关控制（也影响首页/归档/标签页）——见 [GALLERIES.md](GALLERIES.md)

### 混合信息流（文章 + 图集）

- `showGalleriesInIndex` 开启后，图集条目会混入首页、文章列表、归档、标签、RSS
- 卡片/归档时间线中图集条目会显示专属徽章

### 品牌音乐播放器

- 首页 Hero 区嵌入式播放器（波形条、进度条）
- `src/config.ts` 中可开关、可配置

### 重新设计的页面

| 页面 | 亮点 |
| :--- | :--- |
| `/` 首页 | 终端 Hero、精选推荐、混合信息流 |
| `/posts` 文章列表 | 分页、网格布局 |
| `/archives` 归档 | 垂直时间线 + 辉光效果 |
| `/tags` 标签 | 网格 + 比例进度条 |
| `/search` 搜索 | Aurora 风格背景、Pagefind 重样式 |

---

## 🚀 项目结构

```
/
├── public/
│   ├── assets/images/covers/   # 文章封面图（frontmatter 里用 /assets/... 引用）
│   ├── audio/                  # 音频文件
│   ├── pagefind/               # 搜索索引（构建时生成）
│   ├── favicon.svg             # 站点图标
│   └── devosfera-og.webp       # 默认社交分享预览图
├── src/
│   ├── assets/                 # 本地字体、SVG 图标、Logo
│   ├── components/             # 可复用 Astro 组件
│   ├── data/
│   │   ├── posts/              # 文章 .md / .mdx
│   │   └── galleries/         # 图集（一个文件夹 = 一本相册）
│   ├── layouts/                # 根布局、文章详情布局等
│   ├── pages/                  # Astro 路由
│   ├── scripts/                # 浏览器端脚本（主题切换等）
│   ├── styles/                 # global.css、typography.css
│   ├── utils/                  # 过滤器、辅助函数、Shiki 代码高亮转换器
│   ├── config.ts               # 站点全局配置
│   ├── constants.ts            # 常量
│   └── content.config.ts       # Astro Content Collections schema
├── scripts/
│   └── copy-pagefind.mjs       # 构建后把搜索索引复制到 public/
├── .env.example                # 环境变量模板
├── astro.config.ts             # Astro 配置
└── package.json
```

---

## 👨🏻‍💻 安装与本地开发

**前置：** Node.js 20+、pnpm。

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm run dev
# → http://localhost:4321
```

搜索索引仅在生产构建中生成，本地测试搜索功能：

```bash
pnpm run build && pnpm run preview
```

---

## 🧞 常用命令

| 命令 | 作用 |
| :--- | :--- |
| `pnpm install` | 安装依赖 |
| `pnpm run dev` | 启动本地开发服务器（localhost:4321） |
| `pnpm run build` | 生产构建（含类型检查 + Pagefind 索引） |
| `pnpm run preview` | 预览生产构建产物 |
| `pnpm run format` | Prettier 格式化 |
| `pnpm run lint` | ESLint 检查 |

> `pnpm run build` 内部会依次执行：类型检查 → Astro 构建 → Pagefind 索引生成 → 复制索引到 `public/pagefind/`。

---

## 📝 创建内容

### 文章（`src/data/posts/`）

在 `src/data/posts/` 下新建 `.md` 或 `.mdx` 文件，frontmatter 如下：

```yaml
---
title: "文章标题"                    # 必填
description: "SEO 简介"             # 可选
author: "作者名"                     # 可选（默认取 SITE.author）
date: 2026-01-15                    # 必填，发布日期（YYYY-MM-DD）
updated: 2026-01-20                 # 可选，更新日期
categories: [分类1, 分类2]           # 可选
tags: [标签1, 标签2]                 # 可选（默认 ["others"]）
featured: true                        # 可选，首页精选推荐
draft: false                          # 可选，生产环境隐藏
cover: /assets/images/covers/xxx.jpg  # 可选，封面图路径（文件需放在 public/ 下）
timezone: "Asia/Shanghai"             # 可选，覆盖 SITE.timezone
canonicalURL: ...                     # 可选
hideEditPost: false                   # 可选
---
```

**封面图**放在 `public/assets/images/covers/`，frontmatter 里直接写 `/assets/images/covers/xxx.jpg`。

**MDX**：可直接在正文里使用 JSX 组件。`<GalleryEmbed>` 无需 import 即可使用（见下文）。

**目录自动生成**：正文里写 `## 目录` 或 `## Table of contents`，`remark-toc` + `remark-collapse` 会自动生成锚点目录。

**代码块标注**（Shiki transformers）：

```
// [!code highlight]      → 高亮该行
// [!code ++]             → 新增行（diff）
// [!code --]             → 删除行（diff）
// fileName: file.ts      → 代码块上方显示文件名
```

---

### 图集（`src/data/galleries/`）

快速上手：

1. 在 `src/data/galleries/<slug>/` 新建一个文件夹。
2. 放入 `index.md`（图集元信息）和图片文件。
3. 图片名用数字前缀（`01-`、`02-`……）可控制排序。
4. 文件夹 slug 就是路由：`/galleries/<slug>`。

图集 frontmatter：

```yaml
---
title: "图集标题"                     # 必填
description: "图集简介"               # 必填
pubDatetime: 2026-01-20T00:00:00Z     # 必填，ISO 8601 格式
draft: false                          # 可选
coverImage: ./01-photo.jpg            # 可选，显式指定封面
tags: [标签1, 标签2]                   # 可选
---
```

更多细节见 [GALLERIES.md](GALLERIES.md)。

---

## 🖼️ GalleryEmbed 组件

在任意 `.mdx` 文章中直接嵌入图集，**无需 import**：

```mdx
<GalleryEmbed slug="my-trip-to-tokyo" />
```

可选 props：`limit`（`0` = 全部）、`cols`（`2 | 3 | 4`）、`showLink`（`true/false`）。

完整 props 说明、灯箱行为、无效 slug 兜底逻辑等见 [GALLERIES.md](GALLERIES.md#galleryembed--mdx-文章中嵌入图集)。

---

## ⚙️ 配置

所有站点配置集中在 `src/config.ts`（`SITE` 常量），包括基本信息、主题开关、功能开关、分页数量等。

社交链接和「编辑本文」按钮的 URL 已迁移到环境变量（见 `.env.example`），避免 fork 仓库时泄露个人数据。

> [!WARNING]
> **社交链接已迁移到环境变量。**
>
> 原来硬编码在 `config.ts` 和 `constants.ts` 里的社交 URL 现在从 `.env` 读取。未设置的变量会自动隐藏对应入口，不会报错。
>
> | 变量 | 作用 |
> | :--- | :--- |
> | `PUBLIC_SOCIAL_GITHUB` | GitHub 主页链接 & JSON-LD 作者 URL |
> | `PUBLIC_SOCIAL_X` | X / Twitter 主页链接 |
> | `PUBLIC_SOCIAL_LINKEDIN` | LinkedIn 主页链接 |
> | `PUBLIC_SOCIAL_EMAIL` | 邮箱（mailto 链接） |
> | `PUBLIC_EDIT_POST_URL` | 「编辑本文」按钮的仓库前缀 |
>
> **fork 或升级后**，执行：
> ```bash
> cp .env.example .env
> # 在 .env 里填入自己的值
> ```
>
> **Vercel 部署**：在项目的 Environment Variables 设置里添加即可，无需 `.env` 文件。

---

## 📜 开源协议

基于 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT 协议）定制。
本项目的自定义部分 © [Coaar](https://github.com/coaar)，同样以 MIT 协议发布。
