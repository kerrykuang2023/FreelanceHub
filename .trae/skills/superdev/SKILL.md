---
name: "superdev"
description: "AI-powered full-stack development pipeline tool with 9-stage workflow and 10 expert agents. Invoke when user wants to build commercial-grade projects using AI coding tools like Claude Code, Cursor, or Codex."
---

# Super Dev

Super Dev is an AI-powered development pipeline tool that transforms AI coding assistants (Claude Code, Cursor, Codex, etc.) into a structured, production-ready development workflow. It provides a governance layer between your AI coding tool and actual project delivery.

## When to Invoke

- Building commercial-grade web applications from scratch
- Adding new features to existing projects
- Need structured development workflow with quality gates
- Want professional documentation (PRD, Architecture, UIUX)
- Need security and quality validation
- Converting AI-generated code into production-ready deliverables

## 9-Stage Development Pipeline

Super Dev organizes AI-assisted development into 9 sequential phases:

| Stage | Name | Description | Deliverables |
|-------|------|-------------|---------------|
| 1 | **research** | Competitor analysis | Market research report |
| 2 | **prd** | Product requirements | PRD document with user personas, feature matrix |
| 3 | **architecture** | System design | Architecture diagram, data models, API contracts |
| 4 | **uiux** | UI/UX design | Design tokens, component清单, interaction patterns |
| 5 | **spec** | Task breakdown | Technical specifications |
| 6 | **frontend** | Frontend implementation | React/Vue components, pages, styling |
| 7 | **backend** | Backend implementation | API endpoints, database models, auth |
| 8 | **quality** | Quality gate validation | Test reports, security audit |
| 9 | **delivery** | Package & archive | Build artifacts, deployment configs |

## 10 Expert Agents Architecture

Each phase is governed by specialized AI agents with professional constraints:

| Agent | Role | Injected Phases |
|-------|------|-----------------|
| **PM** | Product Manager | research, prd |
| **ARCHITECT** | System Architect | architecture |
| **UI** | UI Designer | uiux, frontend |
| **UX** | Interaction Designer | uiux, frontend |
| **SECURITY** | Security Engineer | architecture, backend, quality |
| **CODE** | Development Engineer | frontend, backend |
| **DBA** | Database Engineer | architecture, backend |
| **QA** | Quality Engineer | quality |
| **DEVOPS** | DevOps Engineer | delivery |
| **RCA** | Root Cause Analyst | quality, delivery |

### Agent Constraints Examples

When entering **security** phase, SECURITY agent automatically injects:
- OWASP Top 10 constraints
- API authentication standards
- Sensitive data handling protocols

When entering **quality** phase, QA agent enforces:
- WCAG 2.1 AA accessibility compliance
- Performance budget validation
- Code quality thresholds (90+ score)

## Installation

### Using uv (Recommended)
```bash
uv tool install super-dev
```

### Using pip
```bash
pip install super-dev
```

## Core Commands

### Start New Project
```bash
super-dev "做一个在线教育平台"
```
Full pipeline from requirement to delivery.

### Initialize Existing Project
```bash
super-dev init
```
Analyze codebase and integrate with pipeline.

### Resume Interrupted Pipeline
```bash
super-dev run --resume
```
Continue from checkpoint.

### Jump to Specific Stage
```bash
super-dev run 5        # Jump to stage 5 (frontend)
super-dev run frontend  # Jump to frontend stage
```

### Quality Gates
```bash
super-dev quality --type ui -review   # UI review
super-dev quality --type security     # Security audit
super-dev quality --type perf         # Performance check
```

## 20 Supported AI Hosts

### CLI Hosts (9)
- Claude Code
- Codex CLI
- Gemini CLI
- OpenCode
- Kiro CLI
- Cursor CLI
- Qoder CLI
- Copilot CLI
- CodeBuddy CLI

### IDE Hosts (11)
- Antigravity
- Cursor
- Windsurf
- Kiro
- Qoder
- Trae
- CodeBuddy
- Copilot (VS Code)
- Roo Code
- Kilo Code
- Cline

### Onboard New Host
```bash
super-dev onboard
```
Interactive selection of your preferred AI host.

## Documentation Engine

Super Dev generates three core documents **before** writing code:

### 1. PRD (Product Requirements Document)
- User personas
- Feature matrix (P0/P1/P2 priorities)
- Acceptance criteria
- Competitor benchmarking
- Business rules

### 2. Architecture Document
- System architecture diagram
- Data models
- API contracts
- Security strategies
- Deployment plan
- Technical ADR (Architecture Decision Records)

### 3. UIUX Document
- Design Token system
- Page skeletons
- Component inventory with state matrix
- Interaction patterns
- Responsive strategies

Supports 10 industry customizations: Education, Healthcare, E-commerce, FinTech, SaaS, Social, Content, Enterprise, Tools, Gaming.

## Quality Gates

Before delivery, code must pass quality checks:

| Check | Description | Threshold |
|-------|-------------|-----------|
| **A11y** | WCAG 2.1 AA accessibility | Pass |
| **Performance** | Resource size, load time | Budget limits |
| **Security** | OWASP Top 10 | No vulnerabilities |
| **UI Review** | Visual structure validation | 90+ score |

Quality presets: `default` | `balanced` | `enterprise`

## Knowledge Base

Built-in 20+ technical domain knowledge bases covering:
- Architecture
- Security
- DevOps
- Cloud Native
- Data Engineering
- Design
- Mobile Development

194+ knowledge files with hard constraints auto-injected during pipeline.

## Strategy System

Three governance presets:

| Preset | Description | Use Case |
|--------|-------------|----------|
| **default** | Standard baseline | Personal projects, small teams |
| **balanced** | Includes red team review | Medium teams |
| **enterprise** | Mandatory security audit, CI/CD whitelist | Enterprise projects |

## Workflow Features

- **Checkpoint & Resume**: Pipeline can resume from interruption
- **Timeout Protection**: Each stage has timeout limits
- **Dual Confirmation Gates**: PRD/Architecture completion + Frontend preview
- **UI Revision Loop**: Formal change process for UI updates
- **0-1 and 1-N+1 Paths**: New projects vs existing projects

## Best Practices

1. **Start with Clear Requirements**: Describe your project clearly in the initial command
2. **Review Generated Documents**: PRD, Architecture, UIUX docs are your contract
3. **Use Quality Gates**: Don't skip quality checks before delivery
4. **Leverage Knowledge Base**: Built-in best practices are auto-applied
5. **Choose Quality Preset**: Match preset to your project needs

## Integration with Trae

Super Dev supports **Trae** as an IDE host:
- Certified integration
- Slash commands trigger Super Dev pipeline
- Seamless workflow within Trae IDE

## Resources

- GitHub: https://github.com/shangyankeji/super-dev
- Website: SuperDev.Goder.ai

## Quick Start Example

```bash
# 1. Install
uv tool install super-dev

# 2. Onboard your AI tool
super-dev onboard
# Select "Trae" or "Claude Code"

# 3. Create new project
super-dev "做一个在线教育平台"

# 4. Review generated PRD

# 5. Confirm and continue

# 6. Review Architecture

# 7. Confirm and continue

# 8. Preview frontend

# 9. Confirm and continue

# 10. Wait for backend, quality checks

# 11. Delivery ready!
```

This transforms any AI coding tool into a professional development team with PM, Architect, Designer, Security Engineer, QA, and DevOps all working together.
