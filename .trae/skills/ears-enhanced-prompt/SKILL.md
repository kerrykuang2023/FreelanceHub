---
name: "ears-enhanced-prompt"
description: "Enhances prompts using EARS syntax and structured requirement patterns for higher quality AI outputs. Invoke when user wants to write better prompts, create structured requirements, or get improved results from AI coding assistants."
---

# EARS Enhanced Prompt

Guide for creating enhanced prompts using EARS (Easy Acceptance Requirement Statement) syntax to get higher quality outputs from AI coding assistants.

## The Problem

**Before (Generic Prompt)**:
```
帮我写一个登录页面
```
(AI produces generic, unimpressive output)

**After (EARS Enhanced Prompt)**:
```
需求陈述：帮我设计一个现代SaaS产品的登录页面

请使用EARS语法对需求进行精确改写：

role: 你是一名资深前端设计师，擅长创建现代化、专业的用户界面
goals/skills:
- 精通现代UI设计（参考Apple、Airbnb风格）
- 熟练使用TailwindCSS进行快速开发
- 理解用户体验和交互设计原则

workflows:
1. 先分析需求，确定设计风格
2. 创建组件结构
3. 实现响应式设计
4. 添加适当的动画效果
5. 确保可访问性

formats:
- 使用React + TypeScript
- 使用TailwindCSS进行样式设计
- 提供完整的可运行代码
- 包含必要的注释说明
```

## EARS Prompt Enhancement Template

```markdown
需求陈述：<这里描述你的需求>

请按以下结构增强此需求：

role[专业角色定位]
- 根据需求选择一个合适的AI角色
- 例如：资深前端工程师、全栈开发者、UI/UX设计师等

goals/skills[核心目标和技能]
- 列出该角色应具备的专业技能
- 包括使用的技术栈和工具
- 包含设计规范和最佳实践

workflows[工作流程]
- 将任务分解为清晰的步骤
- 每步骤聚焦一个具体目标
- 确保逻辑顺序合理

examples[示例]
- 提供具体的输入/输出示例
- 帮助AI理解期望的结果

formats[输出格式]
- 指定代码风格（React/Vue等）
- 指定样式方案（TailwindCSS/CSS Modules等）
- 指定是否需要注释、文档
- 指定文件组织方式
```

## Common EARS Prompt Patterns

### 1. Feature Development

```markdown
role: 资深React全栈工程师，精通TypeScript和现代前端架构

goals/skills:
- 熟练使用React 18 + TypeScript
- 精通TailwindCSS进行样式开发
- 理解RESTful API设计
- 熟悉常见的性能优化技巧

workflows:
1. 分析功能需求，确定组件结构
2. 创建TypeScript接口定义
3. 实现React组件（支持TSX）
4. 添加TailwindCSS样式（现代化设计风格）
5. 实现必要的状态管理
6. 添加加载状态和错误处理
7. 确保响应式设计

examples:
输入：创建一个用户资料编辑页面，包含头像上传、基本信息编辑
输出：一个完整的React组件，包含表单验证、头像预览、提交功能

formats:
- 单文件组件（.tsx）
- 使用TailwindCSS类名
- 包含JSDoc注释
- 导出类型定义
```

### 2. API Development

```markdown
role: 后端API专家，精通Node.js/Express和MongoDB

goals/skills:
- 熟练使用Express.js构建RESTful API
- 精通Mongoose进行MongoDB建模
- 理解JWT身份验证
- 熟悉API安全最佳实践

workflows:
1. 设计API端点和数据模型
2. 创建Mongoose Schema
3. 实现路由和控制器
4. 添加输入验证
5. 实现身份验证中间件
6. 添加错误处理
7. 编写API文档注释

formats:
- 使用Express Router
- 使用async/await模式
- 使用asyncWrapper处理错误
- 遵循RESTful命名规范
```

### 3. UI/Component Development

```markdown
role: UI/UX设计师，精通现代化界面设计

goals/skills:
- 精通TailwindCSS最新版本
- 理解设计系统原则
- 熟悉动画和过渡效果
- 注重用户体验和可访问性

workflows:
1. 分析组件需求和变体
2. 确定设计风格和配色
3. 创建组件结构和样式
4. 添加交互状态（hover、active、disabled）
5. 实现响应式变体
6. 添加适当的动画效果

examples:
基础按钮 | 禁用按钮 | 加载状态 | 图标按钮

formats:
- React函数组件
- TailwindCSS类名
- 支持children prop
- 支持自定义className
- TypeScript接口定义
```

## Quick EARS Prompts

### 1. Component Request

```
请用EARS格式帮我创建<组件名称>组件：
- role: <角色定位>
- tech: <技术栈>
- style: <设计风格>
- features: <核心功能>
```

### 2. Page Request

```
请用EARS格式帮我设计<页面名称>页面：
- role: <角色定位>
- sections: <页面区块>
- interactions: <交互需求>
- style: <设计要求>
```

### 3. API Request

```
请用EARS格式帮我设计<功能>API：
- role: <角色定位>
- endpoints: <端点列表>
- data model: <数据模型>
- auth: <认证要求>
```

## EARS Syntax Reference

### Requirement Keywords

| Keyword | Meaning | Example |
|---------|---------|---------|
| SHALL | Mandatory requirement | "The system SHALL validate input" |
| SHOULD | Recommended | "The system SHOULD cache responses" |
| MAY | Optional | "The system MAY support offline mode" |
| WHEN | Event trigger | "WHEN user clicks submit" |
| WHERE | Condition | "WHERE user is admin" |
| WHILE | State condition | "WHILE session is active" |

### Prompt Structure

```markdown
# <Task Title>

## Context
<Background information and constraints>

## Requirements
<Using EARS syntax>
- Universal: The system SHALL...
- Event-driven: WHEN... THE SYSTEM SHALL...
- State-driven: WHILE... THE SYSTEM SHALL...

## Technical Stack
- Frontend: ...
- Backend: ...
- Database: ...

## Design Guidelines
- Style: ...
- Colors: ...
- Typography: ...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Practical Examples

### Login Page EARS Prompt

```markdown
需求陈述：帮我设计一个现代化的登录页面，用于SaaS产品

使用EARS语法增强此需求：

role: 资深前端设计师 + React开发专家

goals/skills:
- 现代UI设计（参考Stripe、Linear风格）
- React 18 + TypeScript
- TailwindCSS + 表单验证
- 响应式设计 + 动画效果

workflows:
1. 设计登录表单布局
2. 实现表单组件和验证
3. 添加社交登录选项
4. 实现记住我功能
5. 添加加载和错误状态
6. 确保响应式（移动端适配）
7. 添加适当的动画过渡

formats:
- React + TypeScript
- TailwindCSS
- 支持Dark Mode
- 包含表单验证逻辑
```

### Work Log Feature EARS Prompt

```markdown
需求陈述：帮我实现一个工时填报功能模块

使用EARS语法：

role: 全栈开发工程师

goals/skills:
- React + TypeScript前端
- Express.js后端
- MongoDB数据存储
- JWT认证

workflows:
1. 创建工时数据模型（MongoDB Schema）
2. 设计工时填报表单组件
3. 实现工时列表展示
4. 添加工时确认/审批功能
5. 实现附件上传

formats:
- RESTful API设计
- React组件结构
- Mongoose模型定义
- TypeScript类型定义
```

## Best Practices

1. **Be Specific**: Include concrete examples of expected behavior
2. **Set Role**: Give AI a specific professional persona
3. **Define Tech Stack**: Specify technologies and libraries
4. **Show Style**: Reference existing designs or brands
5. **List Features**: Enumerate all required features
6. **Specify Format**: Define code style and organization
7. **Include Constraints**: Note any limitations or requirements
8. **Add Examples**: Show before/after or input/output examples
