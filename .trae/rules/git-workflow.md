# Git 工作流程规范

**文档版本:** v1.0  
**创建日期:** 2026-03-30  
**维护者:** AI Assistant

---

## 1. 概述

本文档定义了 JobPortal 项目的 Git 工作流程规范，包括分支管理、提交规范、合并策略和发布流程。

---

## 2. Fork 仓库独立化指南

### 2.1 当前状态检查

```powershell
# 检查远程仓库配置
git remote -v

# 应该只看到 origin 指向您自己的仓库
# origin  https://github.com/kerrykuang2023/JobPortal.git (fetch)
# origin  https://github.com/kerrykuang2023/JobPortal.git (push)
```

### 2.2 GitHub 上解除 Fork 关系

如果 GitHub 仍显示您的仓库是 fork，需要执行以下操作：

**方式一：通过 GitHub Support（推荐）**

1. 访问 GitHub Support: https://support.github.com/contact
2. 选择主题: "Repository settings and configuration"
3. 请求内容:
   ```
   I would like to detach my repository from its fork network.
   Repository: kerrykuang2023/JobPortal
   Reason: The original repository is now read-only and I want to make 
           this an independent, evolving project.
   ```
4. GitHub 支持团队会在 24-48 小时内处理

**方式二：重新创建仓库（立即生效）**

```powershell
# 1. 备份当前仓库
cd ..
xcopy /E /I JobPortal JobPortal-backup

# 2. 在 GitHub 上创建新的空仓库（不要选择任何初始化选项）
# 仓库名: JobPortal (或新名称)

# 3. 更新远程地址
cd JobPortal
git remote set-url origin https://github.com/kerrykuang2023/JobPortal.git

# 4. 推送所有分支和标签
git push origin --all
git push origin --tags

# 5. 删除旧的 fork 仓库（在 GitHub 设置中）
```

### 2.3 确保本地仓库独立

```powershell
# 移除任何上游仓库（如果存在）
git remote remove upstream

# 确保只有 origin
git remote -v
```

---

## 3. 分支管理策略

### 3.1 分支类型

| 分支类型 | 命名规范 | 用途 | 生命周期 |
|----------|----------|------|----------|
| `main` | main | 生产环境代码 | 永久 |
| `dev` | dev | 开发集成分支 | 永久 |
| `feature/*` | feature/功能名 | 新功能开发 | 临时 |
| `bugfix/*` | bugfix/问题描述 | Bug修复 | 临时 |
| `release/*` | release/版本号 | 发布准备 | 临时 |
| `hotfix/*` | hotfix/版本号 | 紧急修复 | 临时 |

### 3.2 分支结构图

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    main (生产环境)                       │
                    │                         │                                │
                    │                         │ merge (release完成)            │
                    │                         ▼                                │
                    │              ┌─────────────────────┐                     │
                    │              │   release/1.1.0     │                     │
                    │              │   (发布准备)         │                     │
                    │              └──────────┬──────────┘                     │
                    │                         │ merge (测试通过)               │
                    │                         ▼                                │
                    │                    ┌─────────┐                            │
                    │                    │   dev   │ (开发集成)                 │
                    │                    └────┬────┘                            │
                    │                         │ merge (功能完成)                │
                    │         ┌───────────────┼───────────────┐                │
                    │         ▼               ▼               ▼                │
                    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
                    │  │feature/i18n │ │feature/auth │ │feature/jobs │         │
                    │  │  (国际化)    │ │  (认证)     │ │  (职位)     │         │
                    │  └─────────────┘ └─────────────┘ └─────────────┘         │
                    └─────────────────────────────────────────────────────────┘
```

### 3.3 分支操作规范

#### 3.3.1 创建新分支

```powershell
# 从 dev 创建功能分支
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# 开发完成后合并回 dev
git checkout dev
git merge feature/new-feature
git push origin dev

# 删除已合并的功能分支
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

#### 3.3.2 紧急修复流程

```powershell
# 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/1.0.1

# 修复完成后合并到 main 和 dev
git checkout main
git merge hotfix/1.0.1
git tag v1.0.1

git checkout dev
git merge hotfix/1.0.1

# 推送所有更改
git push origin main dev --tags

# 删除 hotfix 分支
git branch -d hotfix/1.0.1
```

---

## 4. 提交规范

### 4.1 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.2 提交类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat(i18n): 添加日文翻译支持 |
| `fix` | Bug修复 | fix(auth): 修复登录token过期问题 |
| `docs` | 文档更新 | docs: 更新README安装说明 |
| `style` | 代码格式（不影响功能） | style: 格式化代码缩进 |
| `refactor` | 重构（不是新功能也不是修复） | refactor: 优化API调用逻辑 |
| `perf` | 性能优化 | perf: 优化列表渲染性能 |
| `test` | 添加测试 | test: 添加登录E2E测试 |
| `chore` | 构建/工具变更 | chore: 更新依赖版本 |
| `ci` | CI配置变更 | ci: 添加GitHub Actions配置 |

### 4.3 作用域（Scope）

| 模块 | Scope | 描述 |
|------|-------|------|
| 认证 | auth | 登录、注册、权限 |
| 国际化 | i18n | 多语言支持 |
| 职位 | jobs | 职位相关功能 |
| 工时 | worklog | 工时记录 |
| 发票 | invoice | 发票管理 |
| 用户 | user | 用户管理 |
| 企业 | company | 企业管理 |
| 管理后台 | admin | 管理员功能 |
| UI | ui | 界面组件 |

### 4.4 提交示例

```bash
# 新功能
git commit -m "feat(i18n): 添加语言切换器组件

- 添加 LanguageSwitcher 组件
- 支持中文、英文、日文切换
- 持久化用户语言偏好到 localStorage

Closes #123"

# Bug修复
git commit -m "fix(auth): 修复登录后token未存储问题

问题：登录成功后刷新页面会丢失登录状态
原因：login函数未将token存储到localStorage
解决：在login函数中添加token存储逻辑

Fixes #456"

# 文档更新
git commit -m "docs: 更新README添加国际化说明

- 添加i18n功能介绍
- 添加语言切换截图
- 更新快速开始指南"
```

---

## 5. 合并策略

### 5.1 合并方式选择

| 场景 | 推荐方式 | 命令 |
|------|----------|------|
| 功能分支 → dev | Merge (保留历史) | `git merge feature/xxx` |
| dev → main (发布) | Merge (创建合并提交) | `git merge dev` |
| Hotfix → main | Merge (保留修复记录) | `git merge hotfix/xxx` |
| 同一分支同步远程 | Rebase (保持线性) | `git pull --rebase` |

### 5.2 解决合并冲突

```powershell
# 1. 尝试合并
git merge feature/xxx

# 2. 如果有冲突，查看冲突文件
git status

# 3. 手动解决冲突（编辑冲突文件）
# 冲突标记：
# <<<<<<< HEAD
# 当前分支的内容
# =======
# 要合并分支的内容
# >>>>>>> feature/xxx

# 4. 标记冲突已解决
git add <冲突文件>

# 5. 完成合并
git commit
```

### 5.3 合并前检查清单

- [ ] 所有测试通过
- [ ] 代码已通过 lint 检查
- [ ] 无 TypeScript 编译错误
- [ ] 已更新相关文档
- [ ] 已同步最新代码（git pull）
- [ ] 已通知团队成员

---

## 6. 发布流程

### 6.1 版本号规范

采用语义化版本（Semantic Versioning）：`MAJOR.MINOR.PATCH`

| 版本类型 | 变更内容 | 示例 |
|----------|----------|------|
| MAJOR | 不兼容的API变更 | 1.0.0 → 2.0.0 |
| MINOR | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| PATCH | 向后兼容的问题修复 | 1.0.0 → 1.0.1 |

### 6.2 发布流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           发布流程                                            │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: 创建发布分支
├── git checkout dev
├── git pull origin dev
├── git checkout -b release/1.1.0
└── 更新版本号 (package.json)

Step 2: 发布前测试
├── 运行所有测试
├── E2E测试验证
├── 手动测试关键功能
└── 修复发现的问题

Step 3: 合并到主分支
├── git checkout main
├── git merge release/1.1.0
├── git tag -a v1.1.0 -m "Release v1.1.0"
└── git push origin main --tags

Step 4: 合并回开发分支
├── git checkout dev
├── git merge release/1.1.0
└── git push origin dev

Step 5: 清理
├── git branch -d release/1.1.0
├── git push origin --delete release/1.1.0
└── 发布 Release Notes
```

### 6.3 发布检查清单

```markdown
## 发布检查清单 v1.1.0

### 代码质量
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查无错误
- [ ] 所有单元测试通过
- [ ] 所有 E2E 测试通过

### 功能验证
- [ ] 核心功能正常工作
- [ ] 新功能已验证
- [ ] 已知 Bug 已修复
- [ ] 无严重遗留问题

### 文档更新
- [ ] README 已更新
- [ ] CHANGELOG 已更新
- [ ] API 文档已更新
- [ ] 版本号已更新

### 部署准备
- [ ] 环境变量已配置
- [ ] 数据库迁移脚本已准备
- [ ] 回滚方案已准备
```

---

## 7. 标签管理

### 7.1 标签类型

| 类型 | 格式 | 用途 |
|------|------|------|
| 正式版本 | v1.0.0 | 生产环境发布 |
| 预发布版本 | v1.0.0-beta.1 | 测试环境发布 |
| 候选版本 | v1.0.0-rc.1 | 发布候选 |

### 7.2 标签操作

```powershell
# 创建轻量标签
git tag v1.0.0

# 创建附注标签（推荐）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签到远程
git push origin v1.0.0

# 推送所有标签
git push origin --tags

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0

# 查看所有标签
git tag -l

# 查看标签详情
git show v1.0.0
```

---

## 8. 常用命令速查

### 8.1 日常操作

```powershell
# 查看状态
git status

# 查看分支
git branch -a

# 查看提交历史
git log --oneline -10

# 查看远程仓库
git remote -v

# 同步远程更新
git fetch origin

# 拉取并合并
git pull origin dev

# 拉取并变基
git pull --rebase origin dev
```

### 8.2 分支操作

```powershell
# 创建并切换分支
git checkout -b feature/new-feature

# 切换分支
git checkout dev

# 合并分支
git merge feature/new-feature

# 删除本地分支
git branch -d feature/new-feature

# 删除远程分支
git push origin --delete feature/new-feature

# 强制删除未合并分支
git branch -D feature/new-feature
```

### 8.3 撤销操作

```powershell
# 撤销工作区修改
git restore <file>

# 撤销暂存区
git restore --staged <file>

# 撤销最近一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最近一次提交（丢弃修改）
git reset --hard HEAD~1

# 修改最近一次提交信息
git commit --amend

# 回退到指定提交
git reset --hard <commit-hash>
```

### 8.4 暂存操作

```powershell
# 暂存当前修改
git stash

# 查看暂存列表
git stash list

# 恢复最近暂存
git stash pop

# 恢复指定暂存
git stash apply stash@{0}

# 删除暂存
git stash drop stash@{0}

# 清空所有暂存
git stash clear
```

---

## 9. 开发工作流程

### 9.1 新功能开发流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        新功能开发流程                                         │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: 同步代码
├── git checkout dev
├── git pull origin dev
└── 确保本地代码最新

Step 2: 创建功能分支
├── git checkout -b feature/功能名
└── 分支命名规范：feature/xxx-xxx

Step 3: 开发实现
├── 编写代码
├── 编写测试
├── 本地验证
└── 提交代码（遵循提交规范）

Step 4: 推送分支
├── git push origin feature/功能名
└── 推送到远程仓库

Step 5: 合并到开发分支
├── git checkout dev
├── git pull origin dev
├── git merge feature/功能名
├── 解决冲突（如有）
├── 运行测试验证
└── git push origin dev

Step 6: 清理分支
├── git branch -d feature/功能名
├── git push origin --delete feature/功能名
└── 删除已合并的功能分支
```

### 9.2 Bug修复流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Bug修复流程                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: 创建修复分支
├── git checkout dev
├── git pull origin dev
├── git checkout -b bugfix/问题描述
└── 分支命名规范：bugfix/xxx-xxx

Step 2: 修复问题
├── 定位问题代码
├── 实施修复
├── 编写/更新测试
├── 本地验证修复效果
└── 提交代码

Step 3: 合并验证
├── git checkout dev
├── git merge bugfix/问题描述
├── 运行测试
├── E2E验证
└── git push origin dev

Step 4: 清理
├── git branch -d bugfix/问题描述
└── git push origin --delete bugfix/问题描述
```

---

## 10. 最佳实践

### 10.1 提交最佳实践

| 实践 | 描述 |
|------|------|
| 小步提交 | 每次提交只做一件事 |
| 频繁提交 | 完成一个小功能就提交 |
| 清晰描述 | 提交信息要清晰明了 |
| 原子提交 | 每个提交都应该是完整可用的 |
| 测试后提交 | 提交前确保测试通过 |

### 10.2 分支最佳实践

| 实践 | 描述 |
|------|------|
| 及时删除 | 合并后及时删除功能分支 |
| 保持更新 | 定期同步远程分支更新 |
| 避免长期分支 | 功能分支生命周期不超过1周 |
| 独立开发 | 不同功能在不同分支开发 |

### 10.3 合并最佳实践

| 实践 | 描述 |
|------|------|
| 先拉后合 | 合并前先拉取最新代码 |
| 解决冲突 | 认真解决每个冲突 |
| 测试验证 | 合并后运行测试验证 |
| 通知团队 | 重要合并通知团队成员 |

---

## 11. 问题排查

### 11.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 推送被拒绝 | 远程有新提交 | 先pull再push |
| 合并冲突 | 分支修改了同一文件 | 手动解决冲突 |
| 分支落后 | 本地未同步远程 | git fetch + git merge |
| 意外提交 | 提交了不该提交的文件 | git reset --soft HEAD~1 |

### 11.2 紧急恢复

```powershell
# 恢复误删的分支
git reflog
git checkout -b <branch-name> <commit-hash>

# 恢复误删的提交
git reflog
git cherry-pick <commit-hash>

# 恢复误删的文件
git checkout HEAD -- <file-path>
```

---

## 12. 相关文档

- [开发最佳实践](./best-practices.md)
- [任务执行工作流程](./task-execution-workflow.md)
- [功能开发工作流程](./feature-development-workflow.md)
- [E2E测试最佳实践](./e2e-testing-best-practices.md)

---

**文档版本:** v1.0  
**创建日期:** 2026-03-30  
**维护者:** AI Assistant  
**更新频率:** 持续更新
