---
title: 写给 JavaScript 开发者的 Rust：值得跨越的那道坎
description: 如果你来自 JS/TS 阵营、又被 Rust 吓到，这篇指南就是为你写的。我们用直接的例子，把熟悉的概念映射到 Rust 生态里。
date: 2026-02-12
tags:
  - Rust
  - JavaScript
  - 系统
  - WebAssembly
draft: false
cover: /assets/images/covers/rust-for-javascript-devs.jpg
---

Rust 多年前就进入了 Web 开发者的视野，但普及一直很慢。2026 年，局面变了：Rust 驱动着 JS 生态里的关键工具（Biome、Oxc、Rolldown、SWC 编译器），而 WebAssembly 让它在前端变得不可或缺。是时候学它了。

## 目录

## 最大的思维转变：所有权 ownership

JavaScript 里由垃圾回收器管理内存。在 Rust 里，这份责任通过**所有权**系统交给了编译器。

```rust file=ownership.rs
// 在 JS 里：这样是可行的
// let a = [1, 2, 3];
// let b = a; // a 依然有效

// 在 Rust 里：
fn main() {
    let a = vec![1, 2, 3];
    let b = a;          // a 被"移动"给了 b // [!code highlight]
    println!("{:?}", a); // ✗ 错误：a 已经被移动走了
    println!("{:?}", b); // ✓
}
```

解决办法：用引用进行**借用 borrowing**。

```rust file=borrowing.rs
fn main() {
    let a = vec![1, 2, 3];
    let b = &a;          // 不可变借用 // [!code ++]
    println!("{:?}", a); // ✓ a 依然有效
    println!("{:?}", b); // ✓
}

fn print_vec(v: &Vec<i32>) { // 接收引用，而不是所有权 // [!code highlight]
    for n in v {
        print!("{} ", n);
    }
}
```

## 类型：从 `any` 到世界上最安全的类型系统

| JavaScript/TypeScript  | Rust 对应写法                    |
| ---------------------- | -------------------------------- |
| `number`               | `i32`、`u32`、`f64`、…           |
| `string`               | `String`（堆）/ `&str`（切片）   |
| `T \| null`            | `Option<T>`                      |
| `T \| Error`           | `Result<T, E>`                   |
| `any[]`                | `Vec<T>`                         |
| `{ [key: string]: T }` | `HashMap<String, T>`             |

```rust file=types.rs
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None   // 等价于 null，但不会犯那个价值十亿美元的错误
    } else {
        Some(a / b)
    }
}

fn main() {
    match divide(10.0, 0.0) {
        Some(result) => println!("Result: {result}"),
        None => println!("Division by zero"),
    }
}
```

## 错误处理：`Result` 就是 Rust 的 `Promise`

在 JS 里，你用 `try/catch` 或 `Promise` 链来处理错误。在 Rust 里，`Result<T, E>` 才是地道的写法：

```rust file=errors.rs
use std::fs;
use std::io;

// 以前：不用 ? 运算符
fn read_config_verbose() -> Result<String, io::Error> {
    let content = match fs::read_to_string("config.toml") { // [!code --]
        Ok(c) => c,                                            // [!code --]
        Err(e) => return Err(e),                               // [!code --]
    };                                                         // [!code --]
    Ok(content.to_uppercase())
}

// 用上 ? 运算符（相当于 JS 的 await，只不过作用于错误）
fn read_config() -> Result<String, io::Error> {               // [!code ++]
    let content = fs::read_to_string("config.toml")?;       // [!code ++]
    Ok(content.to_uppercase())                               // [!code ++]
}
```

## 闭包与高阶函数

语法不同，概念完全一致：

```rust file=closures.rs
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // map + filter + collect（就像 JS 里的 Array.map + filter）
    let double_evens: Vec<i32> = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)  // [!code highlight]
        .map(|&x| x * 2)            // [!code highlight]
        .collect();

    println!("{:?}", double_evens); // [4, 8]
}
```

## Rust → WebAssembly：通往前端的桥梁

```rust file=lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
```

```bash
# 编译成 WASM
wasm-pack build --target web
```

```javascript file=main.js
import init, { fibonacci } from "./pkg/my_project.js";

await init();
console.log(fibonacci(40)); // 比纯 JS 版本快约 10 倍
```

## 从哪里开始

1. **[The Rust Book](https://doc.rust-lang.org/book/)** —— 所有语言里最好的官方文档。
2. **Rustlings** —— 终端里的交互式练习。
3. **[Rust by Example](https://doc.rust-lang.org/rust-by-example/)** —— 用真实例子学 Rust。
4. 用 **`wasm-pack`** 做点东西，然后在你现有的 Web 项目里调用它。

> 学习曲线确实存在，但 Rust 编译器会是你能找到的最好的老师：它的错误信息详细、准确，而且几乎总会把解决方案一并告诉你。
