---
title: 2026 年的 Docker Compose：真正重要的最佳实践
description: 不止于基础的 docker-compose up。真正拉开差距的生产环境配置、secrets、健康检查、profiles 与多阶段构建。
date: 2026-02-05
tags:
  - Docker
  - DevOps
  - 容器
  - 后端
draft: false
cover: /assets/images/covers/docker-compose-best-practices.jpg
---

`docker-compose up` 是你学会的第一个命令。接下来的内容——网络、secrets、健康检查、面向不同环境的 profiles——才决定了一份配置只是“能跑”，还是可以拿去上生产。

## 目录

## 清晰的基础结构

```yaml file=compose.yml
name: my-app

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production # 多阶段构建目标 // [!code highlight]
    environment:
      NODE_ENV: production
    env_file: .env.production # 绝不要硬编码凭据 // [!code highlight]
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy # 等待数据库就绪 // [!code highlight]
    restart: unless-stopped

  db:
    image: postgres:17-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## 多阶段构建：更小的体积，更高的安全性

生产环境的 Dockerfile 绝不应该包含开发工具：

```dockerfile file=Dockerfile
# 阶段 1：依赖与构建
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # [!code highlight]
COPY . .
RUN npm run build

# 阶段 2：最小化的最终镜像
FROM node:22-alpine AS production  # [!code ++]
WORKDIR /app                       # [!code ++]
                                   # [!code ++]
# 只复制必要的内容                 # [!code ++]
COPY --from=builder /app/dist ./dist  # [!code ++]
COPY --from=builder /app/node_modules ./node_modules  # [!code ++]
                                   # [!code ++]
USER node                          # 不要以 root 运行 // [!code ++]
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

体积上的差异可以达到 **600 MB → 80 MB**。

## 面向不同环境的 profiles

借助 `profiles`，你可以根据上下文启用服务，而不必维护多份 Compose 文件：

```yaml file=compose.yml
services:
  api:
    # 没有 profile = 始终启用
    build: .

  adminer:
    image: adminer
    profiles: [dev, debug] # 仅在 dev 环境 // [!code highlight]
    ports:
      - "8080:8080"

  prometheus:
    image: prom/prometheus
    profiles: [monitoring] # 只在需要时启用 // [!code highlight]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

```bash
# 只启动 API + DB
docker compose up

# 带上开发工具一起启动
docker compose --profile dev up

# 完整的监控栈
docker compose --profile monitoring up
```

## 真正有效的健康检查

基础的 `depends_on` 只会等待容器**启动**，而不是等服务**就绪**。这个区别很重要：

```yaml file=compose.yml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s # 初始宽限期 // [!code highlight]

  worker:
    build: .
    depends_on:
      redis:
        condition: service_healthy # 等待健康检查变绿 // [!code highlight]
```

## 网络：默认隔离

每个 `compose.yml` 都会创建自己的网络。要让彼此独立的栈之间通信：

```yaml file=compose.yml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true # 无外网访问 // [!code highlight]

services:
  nginx:
    networks: [frontend, backend] # 唯一同时接入两个网络的服务

  api:
    networks: [backend] # 与外界隔离 // [!code highlight]

  db:
    networks: [backend] # 同上
```

## 上线前的检查清单

- [ ] 敏感变量放在仓库之外的 `secrets` 或 `.env` 中
- [ ] 已启用多阶段构建
- [ ] 所有关键服务都配置了 `restart: unless-stopped`
- [ ] 健康检查配置了合适的 `start_period`
- [ ] `depends_on` 使用了 `condition: service_healthy`
- [ ] 容器内使用非 root 用户（`USER node`、`USER app`）
- [ ] 持久数据使用命名卷（生产环境不用 bind mount）
- [ ] 根据容器内存配置 `--max-old-space-size`

> 教程里的 `compose.yml` 和生产环境的那份，差别不在于行数，而在于知道哪些地方可能出错，并且已经为此做了预案。
