---
title: React 19：useActionState、useOptimistic，以及手工加载状态的终结
description: React 19 重新设计了我们处理表单、变更操作和过渡状态的方式。一份配有真实示例的新 API 实用指南。
date: 2026-01-28
tags:
  - React
  - JavaScript
  - 前端
  - UX
draft: false
cover: /assets/images/covers/react-19-new-apis.jpg
---

React 19 是自 Hooks 引入以来最重要的一次更新。它没有带来激进的新概念——它带来的是一个我们已经用不同方式解决过一千遍的问题的终极答案：**处理表单与变更操作**。

## 目录

## React 19 解决的问题

在 React 19 之前，一个带加载反馈、错误处理和乐观更新的表单需要写成这样：

```tsx file=before.tsx
// 以前：一个"基础"功能要写 35+ 行
function ProfileForm() {
  const [isPending, setIsPending] = useState(false); // [!code --]
  const [error, setError] = useState<string | null>(null); // [!code --]
  const [success, setSuccess] = useState(false); // [!code --]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // [!code --]
    e.preventDefault(); // [!code --]
    setIsPending(true); // [!code --]
    setError(null); // [!code --]
    try {
      // [!code --]
      const data = new FormData(e.currentTarget); // [!code --]
      await updateProfile(data); // [!code --]
      setSuccess(true); // [!code --]
    } catch (err) {
      // [!code --]
      setError("保存失败"); // [!code --]
    } finally {
      // [!code --]
      setIsPending(false); // [!code --]
    } // [!code --]
  }
  // ...
}
```

## `useActionState`：不再手写 useState 的表单

```tsx file=profile-form.tsx
import { useActionState } from "react"; // [!code ++]

async function updateProfileAction(prevState: State, formData: FormData) {
  try {
    await updateProfile({
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
    });
    return { success: true, error: null };
  } catch {
    return { success: false, error: "保存个人资料失败" };
  }
}

function ProfileForm() {
  const [state, action, isPending] = useActionState(
    // [!code highlight]
    updateProfileAction,
    { success: false, error: null }
  );

  return (
    <form action={action}>
      <input name="name" placeholder="姓名" />
      <textarea name="bio" placeholder="个人简介" />

      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">已保存！</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
```

## `useOptimistic`：带自动回滚的即时 UI

乐观更新模式（在服务器确认之前就先更新 UI）过去相当繁琐。现在：

```tsx file=todo-list.tsx
import { useOptimistic, useActionState } from "react";

function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    // [!code highlight]
    initialTodos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  async function addTodoAction(_: State, formData: FormData) {
    const title = formData.get("title") as string;

    // 立即更新 UI
    addOptimisticTodo({ id: crypto.randomUUID(), title, done: false }); // [!code highlight]

    // 真正的变更操作（失败时这个 hook 会回滚）
    await createTodo(title);
    return { error: null };
  }

  const [state, action, isPending] = useActionState(addTodoAction, {
    error: null,
  });

  return (
    <>
      <ul>
        {optimisticTodos.map(todo => (
          <li
            key={todo.id}
            style={{ opacity: todo.id.startsWith("temp") ? 0.5 : 1 }}
          >
            {todo.title}
          </li>
        ))}
      </ul>
      <form action={action}>
        <input name="title" required />
        <button disabled={isPending}>添加</button>
      </form>
    </>
  );
}
```

## `use()`：在条件分支中消费 Promise 与 context

```tsx file=user-profile.tsx
import { use, Suspense } from "react";

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // [!code highlight] — 可以用在条件判断里

  return <h1>{user.name}</h1>;
}

// Suspense 边界会缓存并解析这个 promise
function App() {
  const userPromise = fetchUser("123"); // 在组件外部创建

  return (
    <Suspense fallback={<p>加载用户中…</p>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

## 实践中的 Server Actions

React 19 让 **Server Actions**（用 `"use server"` 标记、在服务器上运行的函数）正式化了：

```tsx file=actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });
  revalidatePath("/posts"); // 使服务器缓存失效 // [!code highlight]
}
```

```tsx file=post-card.tsx
import { deletePost } from "./actions";

export function PostCard({ post }: { post: Post }) {
  return (
    <article>
      <h2>{post.title}</h2>
      <form action={deletePost.bind(null, post.id)}>
        <button type="submit">删除</button>
      </form>
    </article>
  );
}
```

## 新 API 一览

| API              | 替代了                                    | 何时使用                                  |
| ---------------- | ----------------------------------------- | ----------------------------------------- |
| `useActionState` | 表单场景下的 `useState` + `useReducer`    | 任何带 UI 反馈的变更操作                  |
| `useOptimistic`  | 手写的回滚逻辑                            | 能提升感知性能的更新                      |
| `use(promise)`   | 数据获取场景下的 `useEffect` + `useState` | 在渲染中读取 promise 的组件               |
| `use(context)`   | `useContext`                              | 需要在条件分支中读取它时                  |
| `ref` 作为 prop  | `forwardRef`                              | 一直如此——去掉了那层多余的包装            |
