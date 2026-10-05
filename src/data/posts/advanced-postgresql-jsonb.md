---
title: PostgreSQL 与 JSONB：兼具关系型数据库与文档灵活性
description: 详解 PostgreSQL JSONB 的 GIN 索引、包含操作符、局部更新与混合式结构设计，兼得关系型与文档型数据库之长。
date: 2026-01-22
categories:
  - 技术
tags:
  - PostgreSQL
  - 数据库
  - 后端
  - SQL
draft: false
cover: /assets/images/covers/advanced-postgresql-jsonb.jpg
---

当 PostgreSQL 拥有了对 JSON 文档的稳健支持后，“SQL 还是 NoSQL？”这个问题就失去了意义。有了 `JSONB`，你可以在同一个数据库里，在需要严格结构的地方保持严格结构，在需要文档灵活性的地方获得文档灵活性。

## 目录

## `JSON` 与 `JSONB`：始终使用 JSONB

```sql
-- JSON：按原样存储文本
-- JSONB：以处理后的二进制格式存储

-- JSONB 的优势：
-- ✓ 支持 GIN 索引（查询极快）
-- ✓ 会去除多余的空白和重复的键
-- ✓ 包含操作符：@>, <@
-- ✗ 写入略慢（需要解析）
-- ✗ 不保留键的顺序和空格

CREATE TABLE events (
  id         BIGSERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  timestamp  TIMESTAMPTZ DEFAULT NOW(),
  payload    JSONB NOT NULL,             -- [!code highlight]
  metadata   JSONB DEFAULT '{}'::JSONB
);
```

## 基本插入与查询

```sql
-- 插入一条负载灵活的事件
INSERT INTO events (type, payload) VALUES
  ('user.register', '{"name": "Ana Garcia", "plan": "pro", "country": "MX"}'),
  ('payment.completed', '{"amount": 99.99, "currency": "USD", "method": "card"}'),
  ('error.api',        '{"code": 429, "endpoint": "/api/v2/items", "ip": "10.0.0.1"}');

-- 字段提取：->> 操作符
SELECT payload->>'name' AS name
FROM events
WHERE type = 'user.register';

-- 嵌套提取
SELECT payload->'address'->>'city' AS city
FROM events
WHERE type = 'user.register';

-- 按 JSON 内部的值过滤
SELECT * FROM events
WHERE type = 'payment.completed'
  AND (payload->>'amount')::NUMERIC > 50;
```

## GIN 索引：以 SQL 的速度查询 JSON

```sql
-- 为整个 JSONB 列建立 GIN 索引
CREATE INDEX idx_events_payload ON events USING GIN (payload);  -- [!code highlight]

-- 针对特定键建索引（效率更高）
CREATE INDEX idx_events_payment_type ON events
  USING GIN ((payload->'method'));

-- 现在这些查询会用到索引：
SELECT * FROM events
WHERE payload @> '{"plan": "pro"}';      -- 包含该对象

SELECT * FROM events
WHERE payload ? 'code';                -- 拥有该键
```

## 包含操作符

```sql
-- @>  “包含”
SELECT * FROM events
WHERE payload @> '{"currency": "USD", "method": "card"}';

-- <@  “被包含于”
SELECT '{"a": 1}'::JSONB <@ '{"a": 1, "b": 2}'::JSONB;  -- 真

-- ?   “拥有该键”
SELECT * FROM events WHERE payload ? 'code';

-- ?|  “拥有其中任意一个键”
SELECT * FROM events WHERE payload ?| ARRAY['name', 'email'];

-- ?&  “同时拥有这些键”
SELECT * FROM events WHERE payload ?& ARRAY['amount', 'currency'];
```

## `jsonb_set` 与局部更新

与纯文档相比的一大优势：你只更新一个字段，而不必重写整个文档。

```sql
-- 更新 JSONB 内的某个字段
UPDATE events
SET payload = jsonb_set(payload, '{plan}', '"enterprise"')  -- [!code highlight]
WHERE type = 'user.register'
  AND payload->>'name' = 'Ana Garcia';

-- 删除一个键
UPDATE events
SET payload = payload - 'ip'
WHERE type = 'error.api';

-- 向 JSONB 内的数组添加一项
UPDATE events
SET payload = jsonb_insert(payload, '{tags, -1}', '"urgent"')
WHERE type = 'error.api';
```

## 聚合函数：`jsonb_agg` 与 `jsonb_object_agg`

```sql
-- 按币种分组，把支付记录汇总成 JSON 数组
SELECT
  payload->>'currency' AS currency,
  COUNT(*)           AS total_payments,
  jsonb_agg(payload) AS detail          -- [!code highlight]
FROM events
WHERE type = 'payment.completed'
GROUP BY currency;

-- 由多行构建一个对象
SELECT jsonb_object_agg(type, COUNT(*))  -- [!code highlight]
FROM events
GROUP BY 1;
```

## 混合式结构：兼得两者之长

```sql
CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  category    TEXT NOT NULL,
  -- 结构化字段 ↑ 用于 JOIN、B-tree 索引和约束
  attributes  JSONB DEFAULT '{}',
  -- 灵活属性 ↓ 随商品类别而异
  CHECK (price > 0)
);

-- 电子产品：{ "voltage": 220, "warranty_months": 24 }
-- 服装：    { "sizes": ["S","M","L"], "material": "cotton" }
-- 图书：    { "isbn": "...", "pages": 320 }

-- 同时利用两列的查询
SELECT name, attributes->>'warranty_months' AS warranty
FROM products
WHERE category = 'electronics'
  AND (attributes->>'warranty_months')::INT >= 12
  AND price < 500;
```

> 对于关键字段，JSONB 无法取代有类型的列。规则是：如果要对某个字段频繁做 `JOIN`、`WHERE` 或 `ORDER BY`——就把它建成列；如果是可变的元数据，或很少被查询——就放进 JSONB。
