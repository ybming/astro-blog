---
title: TypeScript 5.x：改变你写代码方式的特性
description: 对 TypeScript 5.x 中影响最大的几个新特性的实用解读——装饰器、const 类型参数、可变元组类型等。
date: 2026-02-15
tags:
  - TypeScript
  - JavaScript
  - 开发
draft: false
cover: /assets/images/covers/typescript-5-new-features.jpg
---

TypeScript 依然在快速演进。5.x 版本带来的变化远不止性能提升：它们重新定义了我们用了多年的模式。

## 目录

## 标准装饰器（TC39 Stage 3）

终于来了。在使用了多年的实验性版本之后，TypeScript 5.0 采用了 TC39 的**标准装饰器**。语法看起来相似，但语义变化相当大。

```typescript file=decorators.ts
// 类装饰器 —— 之前（实验性）
@sealed
class OldClass { ... }

// 标准装饰器 —— TS 5.x // [!code highlight]
function logged<T extends new (...args: unknown[]) => unknown>(
  target: T,
  _ctx: ClassDecoratorContext,
) {
  return class extends target {
    constructor(...args: unknown[]) {
      super(...args);
      console.log(`[LOG] Instance of ${target.name} created`);
    }
  };
}

@logged
class UserService {
  constructor(private db: Database) {}
}
```

### 方法与访问器装饰器

```typescript file=method-decorator.ts
function measure(_target: unknown, ctx: ClassMethodDecoratorContext) {
  const name = String(ctx.name);
  return function (this: unknown, ...args: unknown[]) {
    const start = performance.now();
    const result = (this as Record<string, Function>)[name](...args); // [!code --]
    const result = Reflect.apply(
      // [!code ++]
      _target as Function,
      this,
      args // [!code ++]
    ); // [!code ++]
    console.log(`${name} took ${performance.now() - start}ms`);
    return result;
  };
}

class ReportService {
  @measure
  async generatePDF(id: string) {
    /* ... */
  }
}
```

## `const` 类型参数

以前你得在每次调用时写 `as const` 才能推断出字面量元组。现在可以直接在泛型上声明：

```typescript file=const-type-params.ts
// 之前：推断为 string[]
function head<T>(arr: T[]) {
  return arr[0];
}
head(["a", "b"]); // type: string

// 现在：推断为精确字面量 // [!code highlight]
function head<const T extends readonly unknown[]>(arr: T) {
  return arr[0];
}
head(["a", "b"] as const); // type: "a"
head(["a", "b"]); // type: "a"  ← 不写 as const 也可以 // [!code ++]
```

## `satisfies` 运算符（已普及）

在 4.9 引入，如今已是日常工作流的一部分。它能在不"拓宽"类型的前提下校验一个值是否满足某个类型：

```typescript file=satisfies.ts
type Palette = {
  red: [number, number, number] | string;
  green: [number, number, number] | string;
  blue: [number, number, number] | string;
};

const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Palette; // [!code highlight]

// 现在 TypeScript 知道 red 是元组，而不是 string
palette.red.at(0); // ✓ —— 换成以前会报错
```

## `infer` 推断的改进

```typescript file=infer-extends.ts
// 按约束过滤并提取返回类型
type ReturnIfString<T> = T extends () => infer R extends string
  ? R
  : never;

type A = ReturnIfString<() => "hello">; // "hello"
type B = ReturnIfString<() => number>;  // never
```

## 性能：`--incremental` 与 `--composite` 模式

TS 5.x 优化了增量构建。在大型项目中，提升幅度最高可达 **3 倍**：

```json file=tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "moduleResolution": "bundler"
  }
}
```

> **提示：** 在 monorepo 中把 `composite` 与项目引用（`references`）结合使用。每个包只会编译发生变化的部分。

## 快速总结

| 特性                     | 版本                     | 影响                                   |
| ------------------------ | ------------------------ | -------------------------------------- |
| 标准装饰器               | 5.0                      | 高 —— 取代实验性方案                   |
| `const` 类型参数         | 5.0                      | 中 —— 少写 `as const`                  |
| `satisfies`              | 4.9 / 在 5.x 中普及      | 高 —— 类型表达力更强                   |
| `infer ... extends`      | 5.x                      | 中 —— 条件类型更精确                   |
| 增量构建改进             | 5.x                      | 在 monorepo 中效果显著                 |
