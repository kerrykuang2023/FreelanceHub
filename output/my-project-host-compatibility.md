# Host Compatibility Report

- Generated At (UTC): 2026-03-23T01:35:16.222486+00:00
- Project Dir: D:\claudesapce\JobPortal
- Detected Hosts: claude-code, cursor-cli, cursor, trae
- Selected Targets: claude-code, cursor-cli, cursor, trae

## Summary
- Overall Score: 50.0/100
- Ready Hosts: 0/4
- Enabled Checks: contract, integrate, skill, slash

## Per-Host Scores

| Host | Certification | Score | Ready | Passed/Total |
|---|---|---:|---|---:|
| claude-code | Certified | 25.0 | no | 1/4 |
| cursor-cli | Compatible | 50.0 | no | 2/4 |
| cursor | Experimental | 50.0 | no | 2/4 |
| trae | Compatible | 75.0 | no | 3/4 |

## Usage Guidance

### claude-code
- Certification: Certified (certified)
- Certification Reason: 原生 slash 命令、宿主文档明确、项目规则与 slash 安装路径已做运行级适配。
- Certification Evidence:
  - 官方文档明确支持 slash commands
  - Super Dev 已内置专用 slash + 规则文件接入
  - 当前项目已针对该宿主做过多轮实际验证
- Primary Entry: /super-dev "<需求描述>"（在该 CLI 宿主会话内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: 当前 CLI 宿主会话
- Restart Required: 否
- Host Preconditions: 需在目标项目/工作区内触发
- Host Precondition Items:
  - 需在目标项目/工作区内触发
- Host Precondition Guidance:
  - 在项目目录启动 Claude Code 当前会话后，直接在同一会话里触发。
  - Claude Code 触发前确认当前会话就是目标项目目录下的当前会话。
- Post Onboard Steps:
  - 保持在宿主当前会话中执行 /super-dev。
  - 让宿主先完成同类产品研究，再继续文档与编码阶段。
- Notes: CLI 宿主建议直接在当前会话执行 slash 命令；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### cursor-cli
- Certification: Compatible (compatible)
- Certification Reason: 官方 CLI slash 文档明确，当前接入链路完整，但仍需更多运行级认证样本。
- Certification Evidence:
  - 官方文档公开 CLI slash commands
  - Super Dev 已提供规则、Skill 与 slash 安装路径
- Primary Entry: /super-dev "<需求描述>"（在该 CLI 宿主会话内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: 当前 CLI 宿主会话
- Restart Required: 否
- Host Preconditions: 需在目标项目/工作区内触发
- Host Precondition Items:
  - 需在目标项目/工作区内触发
- Host Precondition Guidance:
  - 在项目目录启动 Cursor CLI 当前会话后触发。
  - Cursor CLI 触发前确认当前终端已进入目标项目目录。
- Post Onboard Steps:
  - 保持在宿主当前会话中执行 /super-dev。
  - 让宿主先完成同类产品研究，再继续文档与编码阶段。
- Notes: CLI 宿主建议直接在当前会话执行 slash 命令；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### cursor
- Certification: Experimental (experimental)
- Certification Reason: IDE Agent Chat 能力可映射，但项目级 slash 行为仍需持续运行级验证。
- Certification Evidence:
  - 官方文档公开 Agent commands
  - Super Dev 已写入规则、Skill 与命令映射
- Primary Entry: /super-dev "<需求描述>"（在 IDE Agent Chat 内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: IDE Agent Chat
- Restart Required: 否
- Host Preconditions: 需在目标项目/工作区内触发
- Host Precondition Items:
  - 需在目标项目/工作区内触发
- Host Precondition Guidance:
  - 打开 Cursor 的 Agent Chat，并确保当前工作区就是目标项目。
  - Cursor 需要在目标项目工作区的 Agent Chat 中触发，避免把规则加载到错误工作区。
- Post Onboard Steps:
  - 在 IDE Agent Chat 中执行 /super-dev。
  - 保持研究、文档、Spec 与编码在同一上下文中连续完成。
- Notes: IDE 宿主优先通过 Agent Chat 触发；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### trae
- Certification: Compatible (compatible)
- Certification Reason: Trae 官方公开面当前可确认的是项目 rules 与用户 rules；同时本机已观测到 `.trae/rules.md` / `~/.trae/rules.md` 的兼容规则面，skills 仍按增强处理，因此当前保持稳定兼容而非认证级。
- Certification Evidence:
  - 公开文档确认 Trae project rules 与 user rules 机制
  - 本机已存在 ~/.trae/rules.md，可作为兼容规则面协同生效
  - 本机若存在 ~/.trae/skills，可作为兼容增强路径协同生效
  - Super Dev 已同时建模项目 rules、用户 rules、兼容 rules 面与可选宿主级 Skill 增强
- Primary Entry: 在 Trae Agent Chat 输入 `super-dev: <需求描述>`（由 .trae/project_rules.md + ~/.trae/user_rules.md + .trae/rules.md / ~/.trae/rules.md〔兼容规则面〕 + 兼容 Skill〔若检测到〕生效）
- Usage Mode: rules-and-skill
- Trigger Command: super-dev: <需求描述>
- Trigger Context: Trae Agent Chat
- Restart Required: 是
- Host Preconditions: 接入后需重开宿主会话
- Host Precondition Items:
  - 需在目标项目/工作区内触发
  - 接入后需重开宿主会话
- Host Precondition Guidance:
  - 打开 Trae Agent Chat，在当前项目上下文内直接触发。
  - Trae 接入后建议完全关闭旧 Agent Chat，重新打开项目后再发起新会话。
  - 触发前确认当前 Agent Chat 绑定的是目标项目工作区。
  - 完成 `super-dev onboard/setup` 后，关闭旧会话并新开一个宿主会话，再触发 Super Dev。
- Post Onboard Steps:
  - 完成接入后重新打开 Trae，或至少新开一个 Agent Chat，使新的规则与兼容 Skill（若已安装）一起生效。
  - 确认项目内已生成 `.trae/project_rules.md` 与 `.trae/rules.md`，用户目录已生成 `~/.trae/user_rules.md` 与 `~/.trae/rules.md`。
  - 确保当前项目就是已接入 Super Dev 的工作区。
  - 输入 `super-dev: <需求描述>` 触发完整流程。
  - 按 output/* 与 .super-dev/changes/*/tasks.md 执行开发。
- Notes: 该宿主当前以项目级 `.trae/project_rules.md` 与用户级 `~/.trae/user_rules.md` 为官方核心接入面；同时会兼容写入 `.trae/rules.md` 与 `~/.trae/rules.md`，若检测到 ~/.trae/skills，则会增强安装 super-dev-core。

## Missing Items

### claude-code
- Missing: integrate, slash
- Suggestion: `super-dev integrate setup --target claude-code --force`
- Suggestion: `super-dev onboard --host claude-code --skip-integrate --skip-skill --force --yes`
- Suggestion: `确认当前聊天/终端绑定的是目标项目，再重新触发 Super Dev。`

### cursor-cli
- Missing: integrate, slash
- Suggestion: `super-dev integrate setup --target cursor-cli --force`
- Suggestion: `super-dev onboard --host cursor-cli --skip-integrate --skip-skill --force --yes`
- Suggestion: `确认当前聊天/终端绑定的是目标项目，再重新触发 Super Dev。`

### cursor
- Missing: integrate, slash
- Suggestion: `super-dev integrate setup --target cursor --force`
- Suggestion: `super-dev onboard --host cursor --skip-integrate --skip-skill --force --yes`
- Suggestion: `确认当前聊天/终端绑定的是目标项目，再重新触发 Super Dev。`

### trae
- Missing: integrate
- Suggestion: `super-dev integrate setup --target trae --force`
- Suggestion: `接入后先关闭旧宿主会话，再开一个新会话后重试。`
