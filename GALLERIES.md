# 图集功能技术文档

> 图集功能实现于 2026-02-17。
> 参考：[astro-paper issue #553](https://github.com/satnaing/astro-paper/issues/553)

---

## 目录

1. [概述](#概述)
2. [涉及的文件](#涉及的文件)
3. [如何创建一本图集](#如何创建一本图集)
4. [Frontmatter 字段说明](#frontmatter-字段说明)
5. [图片处理流程](#图片处理流程)
6. [自动生成 Alt 文本](#自动生成-alt-文本)
7. [封面图（coverImage）](#封面图coverimage)
8. [开关与可见性控制](#开关与可见性控制)
9. [混合信息流集成（文章 + 图集）](#混合信息流集成文章--图集)
10. [GalleryEmbed — MDX 文章中嵌入图集](#galleryembed--mdx-文章中嵌入图集)
11. [架构与数据流](#架构与数据流)
12. [灯箱](#灯箱)
13. [样式与响应式](#样式与响应式)
14. [已知限制](#已知限制)
15. [后续可扩展方向](#后续可扩展方向)

---

## 概述

图集功能让你可以发布图片合集，访问路径 `/galleries`。每本图集就是 `src/data/galleries/` 下的一个**文件夹**，包含：

- 一个 `index.md`（或 `index.mdx`）文件，存放图集元信息。
- 图片文件直接放在该文件夹内。

图片在构建时通过 **Astro Assets 管道**（`astro:assets`）处理，自动生成带 `srcset` 的优化版本、懒加载标记和现代格式转换。

除了 `/galleries` 独立入口，图集条目还可以参与全局**混合信息流**（文章 + 图集），出现在首页、文章列表、归档、标签和 RSS 中。

---

## 涉及的文件

| 文件 | 作用 |
| :--- | :--- |
| `src/config.ts` | `showGalleries` + `showGalleriesInIndex` 开关 |
| `src/content.config.ts` | `galleries` collection 的 Zod schema 定义 |
| `src/components/GalleryCard.astro` | 列表页使用的卡片 |
| `src/components/GalleryEmbed.astro` | 在 MDX 文章中嵌入图集的组件 |
| `src/components/Card.astro` | 文章/图集混合列表的共用卡片（图集条目会加徽章） |
| `src/components/Header.astro` | 图集导航链接（桌面 + 移动端） |
| `src/assets/icons/IconGallery.svg` | 图集图标（导航、卡片、归档时间线） |
| `src/pages/galleries/index.astro` | 图集列表页 `/galleries` |
| `src/pages/galleries/[gallery].astro` | 图集详情页 `/galleries/<slug>` |
| `src/pages/index.astro` | 首页可选混合信息流 |
| `src/pages/posts/[...page].astro` | 可选混合分页列表 |
| `src/pages/archives/index.astro` | 可选混合归档时间线 |
| `src/pages/tags/index.astro` | 可选混合标签索引 |
| `src/pages/tags/[tag]/[...page].astro` | 可选混合标签详情分页 |
| `src/pages/rss.xml.ts` | 可选混合 RSS 聚合 |
| `src/layouts/PostDetails.astro` | 把 `GalleryEmbed` 注册为全局 MDX 组件 |
| `src/utils/contentEntry.ts` | 文章/图集条目共用的类型定义 + URL 辅助函数 |
| `src/utils/getSortedPosts.ts` | 共用的日期排序逻辑 |
| `src/utils/getUniqueTags.ts` | 共用的标签提取逻辑 |
| `src/utils/getPostsByTag.ts` | 共用的标签过滤逻辑 |
| `src/utils/getPostsByGroupCondition.ts` | 共用的归档分组辅助函数 |
| `src/data/galleries/` | 图集内容根目录 |

---

## 如何创建一本图集

### 文件夹结构

```
src/data/galleries/
└── 图集名称/
    ├── index.md          ← 必填，元信息
    ├── 01-第一张.jpg
    ├── 02-第二张.jpg
    └── 03-第三张.png
```

### 命名规则

- **文件夹名**就是 URL slug：`图集名称` → `/galleries/图集名称`
- 元信息文件必须命名为 `index.md` 或 `index.mdx`
- 图片**按文件名字母顺序**排列，推荐用数字前缀（`01-`、`02-`……）控制顺序

---

## Frontmatter 字段说明

```yaml
---
title: "我的日本之旅"                 # 必填 —— 图集显示名称
description: "旅行照片..."            # 必填 —— 卡片和 meta description 中显示
pubDatetime: 2026-01-20T00:00:00Z   # 必填 —— 发布日期（ISO 8601）
draft: false                         # 可选 —— true 时不发布（默认 false）
coverImage: ./01-tokyo.jpg           # 可选 —— 显式指定封面（见封面图章节）
tags:                                # 可选 —— 标签数组（不带 #）
  - 日本
  - 旅行
---
```

> **注意：** 与文章不同，图集**没有正文**。所有视觉内容来自文件夹内的图片。

---

## 图片处理流程

构建时使用 `import.meta.glob` + `{ eager: true }` 收集所有图片：

```ts
const allImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/data/galleries/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}",
  { eager: true }
);
```

### 为什么 `eager: true`

Astro/Vite 要求 `<Image />` 处理的图片 glob 必须在编译时静态解析。`eager: true` 会让 Vite 立即 import 所有模块并生成每张图的元信息（`width`、`height`、优化后的 `src`）。没有它就拿不到 `ImageMetadata`。

### 如何按图集过滤

在 `[gallery].astro` 中，用 URL slug 过滤全局 glob 结果：

```ts
const images = Object.entries(allImages)
  .filter(([path]) =>
    path.startsWith(`/src/data/galleries/${slug}/`) &&
    !path.includes("index")   // 排除 index.md/mdx
  )
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => ({ src: mod.default, alt: filenameToAlt(filename), filename }));
```

### Astro 自动应用的优化

`<Image />` 组件使用以下 props：

```astro
<Image
  src={img.src}
  alt={img.alt}
  widths={[400, 800]}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading={idx < 6 ? "eager" : "lazy"}
/>
```

会自动生成：

- `srcset`，包含 400px 和 800px 两档
- 现代格式转换（WebP/AVIF，取决于浏览器支持）
- 显式 `width`/`height` 防止布局偏移（CLS）
- 前 6 张 `eager` 加载（首屏可见），之后的 `lazy`

---

## 自动生成 Alt 文本

未显式提供 alt 元信息时，从**文件名**自动推导：

```
01-sunset-in-kyoto.jpg  →  "Sunset In Kyoto"
002_fuji_mountain.png   →  "Fuji Mountain"
IMG_4532.JPG            →  "IMG 4532"（空则回退到图集标题）
```

实现函数（`[gallery].astro` 中的 `filenameToAlt`）：

```ts
function filenameToAlt(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")           // 去掉扩展名
    .replace(/^\d+[-_]?/, "")          // 去掉开头的数字前缀
    .replace(/[-_]/g, " ")             // 连字符/下划线 → 空格
    .replace(/\b\w/g, c => c.toUpperCase()) // 首字母大写
    .trim() || title;                  // 为空则回退到图集标题
}
```

---

## 封面图（coverImage）

两种方式定义封面：

### 方式 A — frontmatter 中指定 `coverImage`（推荐）

```yaml
coverImage: ./01-tokyo.jpg
```

- Astro 从 `index.md` 的相对路径解析并自动优化
- 如果该图片**已经**在文件夹的图片列表里（`hasCoverInFolder`），**不会**在顶部横幅重复显示——只出现在网格中
- 如果图片**不在**文件夹里（比如专门做的封面图），则在详情页顶部作为横幅显示

### 方式 B — 不指定 `coverImage`

- 列表卡片里用文件夹中**字母排序第一张**做封面（`fallbackImage`）
- 详情页没有横幅，直接从网格开始

---

## 开关与可见性控制

在 `src/config.ts` 中：

```ts
export const SITE = {
  // ...
  showGalleries: true,         // false → 全局禁用图集
  showGalleriesInIndex: true,  // 是否在混合信息流里包含图集（仅 showGalleries=true 时生效）
};
```

- `showGalleries = false`：
  - `/galleries` 列表页重定向到 404
  - `[gallery].astro` 的 `getStaticPaths` 返回空数组（不生成详情页路由）
  - 导航栏图集入口隐藏
  - 即使 `showGalleriesInIndex = true`，混合信息流也会忽略图集
- `showGalleries = true` 且 `showGalleriesInIndex = false`：
  - `/galleries` 入口可用
  - 混合列表只显示文章
- `showGalleries = true` 且 `showGalleriesInIndex = true`：
  - 图集参与所有混合列表

---

## 混合信息流集成（文章 + 图集）

统一文章和图集在全局列表页的呈现。

### 涉及的页面

- `/`（首页）
- `/posts`（分页列表）
- `/archives`（归档）
- `/tags` 和 `/tags/<tag>`（标签索引 + 详情）
- `/rss.xml`

### 实现方式

- 用 `Promise.all` 并行加载两类条目，两个开关都开启时才合并
- 共用辅助函数（`contentEntry`、`getSortedPosts`、`getUniqueTags`、`getPostsByTag`）保证路径生成和排序逻辑一致
- 视觉区分：`Card.astro` 对 `collection === "galleries"` 的条目加图集图标徽章；`archives/index.astro` 在时间线里同样处理

典型模式：

```ts
const [blogPosts, galleryPosts] = await Promise.all([
  getCollection("blog"),
  SITE.showGalleries && SITE.showGalleriesInIndex
    ? getCollection("galleries")
    : Promise.resolve([]),
]);
```

---

## GalleryEmbed — MDX 文章中嵌入图集

`GalleryEmbed` 是独立的 Astro 组件，能在 **MDX 文章正文**中直接渲染任意图集的图片网格，自带灯箱。

### 全局注册

组件在 `src/layouts/PostDetails.astro` 中全局注册：

```ts
// PostDetails.astro
import GalleryEmbed from "@/components/GalleryEmbed.astro";
// ...
const { Content } = await render(post, {
  components: { GalleryEmbed },
});
```

因此在**任意 `.mdx` 文件**中都可以直接用，无需 import：

```mdx
<GalleryEmbed slug="my-trip-to-tokyo" />
```

### Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `slug` | `string` | — | **必填**，`src/data/galleries/` 下的文件夹名 |
| `limit` | `number` | `6` | 最多显示几张。`0` = 全部 |
| `showLink` | `boolean` | `true` | 底部是否显示「查看完整图集」链接 |
| `cols` | `2 \| 3 \| 4` | `3` | 网格列数 |

### MDX 中的用法示例

```mdx
{/* 基本用法 — 前 6 张，3 列 */}
<GalleryEmbed slug="my-trip" />

{/* 只显示 4 张，2 列，无底部链接 */}
<GalleryEmbed slug="my-trip" limit={4} cols={2} showLink={false} />

{/* 显示全部 */}
<GalleryEmbed slug="my-trip" limit={0} />
```

### 无效 slug 的兜底

如果 `slug` 在 `galleries` collection 中找不到，组件会渲染一条警告**而不是中断构建**：

```
⚠️ 图集 my-gallery 不存在。请确认 src/data/galleries/my-gallery/index.md 已创建。
```

### 技术细节

- 每个 `GalleryEmbed` 实例创建独立的 `<dialog>`（ID：`ge-lb-{slug}`），允许**同一篇文章中嵌入多个图集**而不冲突
- 初始化脚本用 `document.querySelectorAll("[data-gallery-embed]")`，并在 `astro:after-swap` 时重新执行以兼容 View Transitions
- 图片使用与 `[gallery].astro` 相同的 `widths`/`sizes`；Astro 不会重复优化——同一张照片即使同时出现在 embed 和详情页，**构建时也只优化一次**

---

## 架构与数据流

```
构建时
──────────────────────────────────────────────────────────────────────
src/data/galleries/
  <slug>/
    index.md          ──► "galleries" collection（Astro Content）
    *.jpg / *.png     ──► import.meta.glob eager ──► ImageMetadata[]
                         │
              ┌──────────┴──────────────┐
              │                         │
        /galleries 入口              混合信息流（可选）
     (index.astro + [gallery].astro)  （由两个配置开关启用）
              │                         │
      GalleryCard + 详情页灯箱        共用辅助函数（contentEntry +
        （<Image /> 优化）           sort/tag/group 工具）
              │                         │
              └──────────┬──────────────┘
                         │
                /, /posts, /archives, /tags, /rss.xml
```

---

## 灯箱

详情页包含一个**原生 `<dialog>` 灯箱**——零外部依赖。

### 行为

| 操作 | 结果 |
| :--- | :--- |
| 点击图片 | 打开该图片的灯箱 |
| `←` / `→` | 上一张 / 下一张 |
| `Esc` | 关闭灯箱 |
| 点击图片外区域 | 关闭灯箱 |
| ‹ 和 › 按钮 | 触屏/点击导航 |

### 技术细节

- 用标准 `<dialog>` + `showModal()` / `close()`，自动阻断背景滚动和处理焦点可访问性
- 灯箱内图片使用 Astro 处理后的最大尺寸版本的 `src`
- 脚本在 `astro:after-swap` 时重新注册，兼容 **View Transitions**
- 灯箱打开时设置 `document.body.style.overflow = "hidden"`，避免某些浏览器的双重滚动

---

## 样式与响应式

### 列表页网格（`/galleries`）

| 视口 | 列数 |
| :--- | :--- |
| `< 640px` | 1 |
| `640px – 1023px` | 2 |
| `≥ 1024px` | 3 |

### 详情页网格（`/galleries/<slug>`）

| 视口 | 列数 |
| :--- | :--- |
| `< 640px` | 2 |
| `640px – 1023px` | 3 |
| `≥ 1024px` | 4 |

网格和灯箱样式都是 `[gallery].astro` 内部的 **scoped CSS**；GalleryCard 的样式在 `GalleryCard.astro` 内；Hero 相关类（`.archive-hero`、`.aurora-orb`、`.hero-badge`）来自全局样式 `src/styles/global.css`，与归档页共用。

---

## 已知限制

1. **静态 glob**：`import.meta.glob` 要求编译时用字面量字符串，无法按图集动态生成 glob——所以用全局 glob 收集后在构建运行时过滤。

2. **大小写扩展名**：glob 里包含 `.JPG`、`.JPEG`、`.PNG`、`.WEBP` 以兼容相机/手机导出的大写扩展名。如果以后新增格式（比如 `.HEIC`），需要在**两个页面**（`index.astro` 和 `[gallery].astro`）的 glob 里手动加上。

3. **详情页无分页**：如果某本图集图片很多（>100 张），全部会渲染到 HTML 里。超大图集需要自行实现分页或无限滚动。

4. **Alt 文本从文件名推导**：自动但不一定完美。对于无意义命名（如 `IMG_4532.jpg`），结果会很泛化。未来可以考虑 frontmatter 里加 `images` 字段。

5. **标签可见性跟随混合信息流开关**：图集标签只在 `/tags` 同时开启 `showGalleries` 和 `showGalleriesInIndex` 时才出现。没有独立的「标签/RSS 包含图集但首页/文章列表不包含」的开关。

---

## 后续可扩展方向

### A. frontmatter 中 `images` 字段显式指定 alt

如果需要完全控制 alt 文本或顺序，可以在 schema 中加：

```ts
// content.config.ts
images: z.array(z.object({
  filename: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
})).optional(),
```

在 `[gallery].astro` 中按 `filename` 把 frontmatter 数组和文件夹图片合并。

### B. 详情页分页

加 `?page=N` 参数，按 `images.slice(offset, offset + PAGE_SIZE)` 分页。SEO 用 `<link rel="next">` / `<link rel="prev">`。

### C. 标签/RSS 独立开关

目前 `/tags` 和 `/rss.xml` 的图集集成跟随混合信息流总开关（`showGalleries && showGalleriesInIndex`）。如果需要更细粒度控制，可以加 `showGalleriesInTags` 和 `showGalleriesInRss` 等独立开关。

### D. 带缩放的灯箱

把灯箱 `<img>` 换成 [PhotoSwipe](https://photoswipe.com/) 这类库，支持移动端双指缩放。PhotoSwipe 接受 `ImageMetadata`，不需要额外打包图片。

### E. 视频封面

schema 中加 `coverVideo: z.string().url().optional()`，用于想要动态封面的图集。`GalleryCard.astro` 中渲染 `<video autoplay muted loop>` 代替 `<Image>`。

### F. 文章中嵌入图集 ✅ **已实现**

> 详见上文 [GalleryEmbed 章节](#galleryembed--mdx-文章中嵌入图集)。
