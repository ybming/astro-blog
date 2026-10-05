---
title: 2026 年的现代 CSS：容器查询、:has() 与锚点定位
description: 如今的 CSS 在复杂布局上已经不输 JavaScript。一份关于三个最彻底改变界面开发方式的特性的实用指南。
date: 2026-02-03
tags:
  - CSS
  - 前端
  - 设计
  - Web
draft: false
cover: /assets/images/covers/modern-css-2026.jpg
---

多年来，"我该怎么用 CSS 实现 X？"的答案一直是"用 JavaScript"。到了 2026 年，这个答案在大多数情况下已经不成立了。有三个特性尤其重塑了浏览器里的设计版图。

## 目录

## 容器查询：响应容器，而不是屏幕

媒体查询响应的是_视口_的宽度。问题在于：同一个组件，根据父级布局的不同，可能待在窄栏里，也可能待在宽栏里。**容器查询** 解决的正是这个问题。

```css file=card.css
/* 声明容器 */
.card-wrapper {
  container-type: inline-size; /* [!code highlight] */
  container-name: card;
}

/* 组件响应它的容器 */
@container card (min-width: 400px) {
  /* [!code highlight] */
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }

  .card__image {
    grid-row: 1 / 3;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

```html file=card.html
<!-- 同一个组件在任何上下文中都能工作 -->
<aside class="card-wrapper" style="width: 300px">
  <article class="card">...</article>
  <!-- 纵向布局 -->
</aside>

<main class="card-wrapper" style="width: 700px">
  <article class="card">...</article>
  <!-- 横向布局 -->
</main>
```

### 容器查询单位

查询还暴露了相对于容器的单位：

```css file=typography.css
.card__title {
  font-size: clamp(1rem, 4cqi, 2rem); /* cqi = container query inline size */
}
```

## `:has()` 伪类 —— 我们盼了几十年的父选择器

`:has()` 根据元素的**后代**来选择它。这就是 CSS 拒绝了我们几十年的"父选择器"。

```css file=styles.css
/* 含有必填空字段的表单 */
form:has(input:required:invalid) .submit-btn {
  opacity: 0.5;
  pointer-events: none;
}

/* 包含图片的卡片：换一种布局 */
.card:has(img) {
  /* [!code highlight] */
  display: grid;
  grid-template-columns: 150px 1fr;
}

.card:not(:has(img)) {
  padding: 1.5rem;
}

/* 菜单已展开的导航栏：禁止 body 滚动 */
body:has(.nav-menu[aria-expanded="true"]) {
  /* [!code highlight] */
  overflow: hidden;
}
```

> 自 2023 年起，所有现代浏览器都支持 `:has()`。今天就可以在生产环境使用它，无需 polyfill。

## 锚点定位 anchor positioning：不用 JavaScript 的工具提示与浮层

在锚点定位出现之前，要把工具提示放在触发元素旁边，得用 JavaScript 计算位置。现在不用了：

```css file=tooltip.css
/* 声明锚点 */
.btn-trigger {
  anchor-name: --my-button; /* [!code highlight] */
}

/* 把工具提示定位到锚点上 */
.tooltip {
  position: absolute;
  position-anchor: --my-button; /* [!code highlight] */
  bottom: calc(anchor(top) + 8px); /* [!code highlight] */
  left: anchor(center); /* [!code highlight] */
  transform: translateX(-50%);

  /* 放不下时自动翻转 */
  position-try-fallbacks: flip-block; /* [!code ++] */
}
```

```html file=tooltip.html
<button class="btn-trigger" popovertarget="tip">悬停试试</button>
<div id="tip" class="tooltip" popover>
  这个工具提示自己完成定位，不需要 JS。
</div>
```

### `position-try-fallbacks`：声明式的碰撞处理逻辑

```css file=tooltip.css
.tooltip {
  position-try-fallbacks:
    flip-block,
    /* 下方放不下就试试上方 */ flip-inline,
    /* 右侧放不下就试试左侧 */ flip-start; /* 两者结合 */
}
```

## 兼容性如何？

| 特性             | Chrome | Firefox | Safari  |
| ---------------- | ------ | ------- | ------- |
| 容器查询 Container Queries  | 105+ ✓ | 110+ ✓  | 16+ ✓   |
| `:has()`                    | 105+ ✓ | 121+ ✓  | 15.4+ ✓ |
| 锚点定位 Anchor Positioning | 125+ ✓ | 131+ ✓  | 18+ ✓   |

到了 2026 年，按照当前浏览器的分布情况，大多数项目都可以在生产环境中同时使用这三者。只有当你的用户里还有非常老旧的浏览器时，才需要考虑 polyfill。

## 今天的 CSS 是声明式的，也是富有表现力的

CSS 那场无声的革命并不是 Grid 或 Flexbox，而是思维方式的转变：**由浏览器去推演约束，你只声明想要的结果**。容器查询、`:has()` 和锚点定位，正是这一范式的集大成者。
