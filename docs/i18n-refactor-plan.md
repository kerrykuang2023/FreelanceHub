# 国际化(i18n)全局改造方案

**文档版本:** v1.0  
**创建日期:** 2026-03-30  
**维护者:** AI Assistant

---

## 1. 问题诊断

### 1.1 当前状态分析

| 组件/文件 | 当前状态 | 问题 |
|-----------|----------|------|
| `main.tsx` | ❌ 未导入i18n | i18n配置未被加载 |
| `LanguageSwitcher` | ⚠️ 使用localStorage | 未使用i18next，仅刷新页面 |
| `menuConfig.ts` | ❌ 硬编码中文 | 菜单标签未国际化 |
| `GlobalNavbar` | ❌ 硬编码中文 | 导航栏文本未国际化 |
| 各页面组件 | ❌ 硬编码中文 | 页面文本未国际化 |

### 1.2 根本原因

1. **i18n未集成**: `main.tsx` 没有导入 `i18n/index.ts`
2. **组件未迁移**: 组件未使用 `useTranslation` hook
3. **翻译未使用**: 已创建的翻译文件未被引用

---

## 2. 全局改造方案

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           国际化架构设计                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   main.tsx      │
                    │  (导入i18n)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   i18n/index.ts │
                    │  (i18next配置)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │   zh/   │        │    en/    │       │    ja/    │
    │ 翻译文件 │        │  翻译文件  │       │  翻译文件  │
    └─────────┘        └───────────┘       └───────────┘
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │common   │        │ common    │       │ common    │
    │auth     │        │ auth      │       │ auth      │
    │dashboard│        │ dashboard │       │ dashboard │
    │jobs     │        │ jobs      │       │ jobs      │
    │admin    │        │ admin     │       │ admin     │
    │menu     │        │ menu      │       │ menu      │
    │validation│       │ validation│       │ validation│
    └─────────┘        └───────────┘       └───────────┘
```

### 2.2 命名空间规划

| 命名空间 | 用途 | 示例Key |
|----------|------|---------|
| `common` | 通用文本 | `save`, `cancel`, `loading` |
| `auth` | 认证相关 | `login`, `register`, `forgotPassword` |
| `dashboard` | 仪表板 | `overview`, `statistics` |
| `jobs` | 职位相关 | `jobList`, `postJob`, `apply` |
| `admin` | 管理后台 | `userManagement`, `systemConfig` |
| `menu` | 菜单导航 | `dashboard`, `myProjects`, `workLogs` |
| `validation` | 表单验证 | `required`, `invalidEmail` |

---

## 3. 改造任务分解

### 3.1 Phase 1: 基础集成 (P0)

| 任务ID | 任务描述 | 文件 | 优先级 |
|--------|----------|------|--------|
| T1-01 | 在main.tsx导入i18n | `main.tsx` | P0 |
| T1-02 | 创建menu命名空间翻译 | `i18n/locales/*/menu.json` | P0 |
| T1-03 | 更新LanguageSwitcher使用i18next | `LanguageSwitcher.tsx` | P0 |
| T1-04 | 更新i18n配置添加menu命名空间 | `i18n/index.ts` | P0 |

### 3.2 Phase 2: 核心组件迁移 (P0)

| 任务ID | 任务描述 | 文件 | 优先级 |
|--------|----------|------|--------|
| T2-01 | 迁移menuConfig使用翻译 | `menuConfig.ts` | P0 |
| T2-02 | 迁移GlobalNavbar | `GlobalNavbar.tsx` | P0 |
| T2-03 | 迁移LoginPage | `LoginPage.tsx` | P0 |
| T2-04 | 迁移RegisterPage | `RegisterPage.tsx` | P0 |

### 3.3 Phase 3: 页面组件迁移 (P1)

| 任务ID | 任务描述 | 文件 | 优先级 |
|--------|----------|------|--------|
| T3-01 | 迁移FreelancerDashboardPage | `FreelancerDashboardPage.tsx` | P1 |
| T3-02 | 迁移HRDashboardPage | `HRDashboardPage.tsx` | P1 |
| T3-03 | 迁移AdminDashboardPage | `AdminDashboardPage.tsx` | P1 |
| T3-04 | 迁移JobsListPage | `JobsListPage.tsx` | P1 |
| T3-05 | 迁移WorkLogsPage | `WorkLogsPage.tsx` | P1 |
| T3-06 | 迁移InvoicesPage | `InvoicesPage.tsx` | P1 |
| T3-07 | 迁移ProfilePage | `ProfilePage.tsx` | P1 |

### 3.4 Phase 4: E2E测试验证 (P0)

| 任务ID | 任务描述 | 优先级 |
|--------|----------|--------|
| T4-01 | 运行i18n E2E测试 | P0 |
| T4-02 | 记录问题清单 | P0 |
| T4-03 | 修复问题并重新测试 | P0 |

---

## 4. 实施步骤

### 4.1 Step 1: 集成i18n到应用

```typescript
// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";  // 添加这行
import { AuthProvider } from "./providers/index.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### 4.2 Step 2: 创建menu翻译文件

```json
// i18n/locales/zh/menu.json
{
  "dashboard": "工作台",
  "myProjects": "我的项目",
  "workOrders": "工单管理",
  "browseProjects": "浏览项目",
  "myApplications": "我的申请",
  "payments": "收款管理",
  "status": "状态管理",
  "workLogs": "工时管理",
  "invoices": "发票管理",
  "messages": "消息",
  "company": "公司管理",
  "projects": "项目管理",
  "postProject": "发布项目",
  "applications": "申请管理",
  "workOrderApproval": "工单审批",
  "paymentManagement": "付款管理",
  "savedJobs": "收藏职位",
  "systemManagement": "系统管理",
  "userManagement": "用户管理",
  "roleApproval": "角色审批",
  "companyReview": "企业审核",
  "reportManagement": "举报管理",
  "systemConfig": "系统配置",
  "skillCategories": "技能分类",
  "workTypes": "工时类型",
  "taxRates": "税率配置",
  "currencies": "货币配置",
  "languageRequirements": "语言要求",
  "jobNatures": "工作性质",
  "workFormats": "工作形式",
  "rateTypes": "Rate类型",
  "invoiceTypes": "发票类型",
  "paymentMethods": "付款方式"
}
```

### 4.3 Step 3: 更新LanguageSwitcher

```typescript
// LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };
  
  // ... rest of component
};
```

### 4.4 Step 4: 迁移menuConfig

```typescript
// menuConfig.ts
// 将硬编码的label改为翻译key
export const MENU_CONFIG: MenuConfig = {
  freelancer: [
    {
      key: 'dashboard',
      labelKey: 'menu.dashboard',  // 使用翻译key
      path: '/',
      // ...
    },
    // ...
  ],
};
```

---

## 5. 验收标准

### 5.1 功能验收

| 标准 | 描述 | 验证方法 |
|------|------|----------|
| 语言切换 | 切换语言后页面文本立即更新 | 手动测试 |
| 语言持久化 | 刷新页面后语言保持 | E2E测试 |
| 菜单国际化 | 所有菜单项支持中英文 | E2E测试 |
| 页面国际化 | 所有页面支持中英文 | E2E测试 |

### 5.2 测试验收

| 标准 | 目标值 |
|------|--------|
| E2E测试通过率 | 100% |
| 页面覆盖率 | 100% |
| 语言覆盖率 | 100% (中/英) |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 翻译遗漏 | 部分文本未翻译 | E2E测试检测 |
| 性能影响 | 加载时间增加 | 按需加载翻译文件 |
| 缓存问题 | 语言切换不生效 | 清理缓存机制 |

---

**文档版本:** v1.0  
**创建日期:** 2026-03-30  
**维护者:** AI Assistant
