---
title: 终端效率：改变了我工作流的那些工具
description: 一场现代命令行工具的巡礼——它们取代了 Unix 老将们，更快、更聪明，开发体验也更好。
date: 2026-01-18
tags:
  - 终端
  - 效率
  - Linux
  - CLI
  - 工具
draft: false
cover: /assets/images/covers/terminal-productivity-2026.jpg
---

CLI 生态经历了一场无声的革命。用 Rust 和 Go 写成的工具取代了有几十年历史的 Unix 二进制程序，加上了颜色、语法高亮、模糊搜索和 Git 感知，而速度上几乎没有牺牲。下面这些是我每天都在用的。

## 目录

## Shell：Zsh + Starship

[Starship](https://starship.rs) 毫无疑问是投入最少、体验提升最大的提示符。它兼容任何 shell，快得惊人（用 Rust 写的），并且会展示有用的上下文：Git 分支、Node/Python/Rust 版本、上一条命令的状态。

```toml file=~/.config/starship.toml
# 极简但信息量充足的风格
format = """
$directory\
$git_branch\
$git_status\
$nodejs\
$rust\
$python\
$cmd_duration\
$line_break\
$character"""

[git_branch]
symbol = " "
style = "bold purple"

[git_status]
conflicted = "⚔️ "
ahead = "⇡${count}"
behind = "⇣${count}"
modified = "✎${count}"
untracked = "?${count}"

[cmd_duration]
min_time = 2_000
format = "took [$duration](bold yellow)"
```

## 经典工具的替代品

### `ls` → `eza`（前身 `exa`）

```bash
eza --tree --level=2 --icons --git    # 带图标和 Git 状态的目录树
eza -la --sort=modified               # 长列表，按修改时间排序
```

### `find` → `fd`

```bash
# find：啰嗦，且不好用
find . -name "*.ts" -not -path "*/node_modules/*"    # [!code --]

# fd：直观，默认遵守 .gitignore
fd -e ts                    # 项目里所有 .ts 文件          # [!code ++]
fd -e ts --exec bat {}      # 用 bat 打开每个结果          # [!code ++]
```

### `grep` → `ripgrep`（`rg`）

```bash
# 经典的 grep
grep -r "useEffect" src/ --include="*.tsx"      # [!code --]

# rg：快 5-10 倍，且遵守 .gitignore
rg "useEffect" --type ts                         # [!code ++]
rg "TODO|FIXME|HACK" --type ts --stats           # [!code ++]
rg "deprecated" -l                               # 只列出文件名 # [!code ++]
```

### `cat` → `bat`

`bat` 就是带了语法高亮、行号、分页和内置 Git diff 的 `cat`：

```bash
bat src/components/Header.astro     # 带颜色和行号
bat --diff file.ts                  # 展示内联的 Git 变更
```

### `cd` → `zoxide`

它会记住你常去的目录，让你只敲几个字母就能跳过去：

```bash
z astro      # 如果这是访问最多的目录，就跳到 ~/projects/my-astro-blog
z blog src   # 多个匹配
zi           # 配合 fzf 的交互模式
```

## 复用器：配置现代化的 `tmux`

```bash file=~/.tmux.conf
# 更顺手的前缀键
set -g prefix C-a
unbind C-b

# 用直观的按键分割窗格
bind | split-window -h -c "#{pane_current_path}"  # [!code highlight]
bind - split-window -v -c "#{pane_current_path}"  # [!code highlight]

# 用 Alt+方向键导航（无需前缀）
bind -n M-Left  select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up    select-pane -U
bind -n M-Down  select-pane -D

# 启用鼠标
set -g mouse on

# 256 色
set -g default-terminal "tmux-256color"
```

## 模糊查找器：`fzf` —— 一切的倍增器

`fzf` 能把任何列表变成一个交互式查找器。只要在任意命令后面加上 `| fzf`。

```bash
# 在命令历史中搜索
CTRL+R，fzf 已内置

# 切换分支，带预览
git branch | fzf --preview 'git log --oneline {}' | xargs git checkout

# 结束进程
ps aux | fzf --multi | awk '{print $2}' | xargs kill

# 查找并打开文件
fd -e ts | fzf --preview 'bat --color=always {}' | xargs nvim
```

## 现代化的 Git：`lazygit`

一个 Git TUI（终端 UI），让仓库里正在发生什么一目了然：

```bash
lazygit   # 打开界面
```

亮点功能：

- 按文件、按行查看 diff
- 选择性暂存（精确到单行，而不只是整个文件）
- 可视化解决冲突
- 拖拽式的交互 rebase

## 我优化过的基础版 `.zshrc`

```bash file=~/.zshrc
# 用懒加载实现快速启动
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"

# 现代化的别名
alias ls='eza --icons'
alias ll='eza -la --icons --git'
alias tree='eza --tree --icons'
alias cat='bat'
alias find='fd'
alias grep='rg'
alias lg='lazygit'

# fzf 集成
source <(fzf --zsh)

# zoxide
eval "$(zoxide init zsh)"

# starship
eval "$(starship init zsh)"
```

> 终端效率上最好的时间投资，不是去学新工具，而是吃透你已经有的那些。但当一个现代工具用更好的开发体验、把同一件事做得快 5 倍时，换过去的第一周就回本了。
