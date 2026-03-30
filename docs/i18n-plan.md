# 国际化 (i18n) 实施计划 / Internationalization (i18n) Implementation Plan

[中文](#中文) | [English](#english)

---

# English

## Current Status

The project currently does not have internationalization (i18n) support. All UI text is hardcoded in Chinese.

## Implementation Plan

### Phase 1: Setup i18n Framework

#### 1.1 Install Dependencies
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

#### 1.2 Create i18n Configuration
```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      zh: { translation: zhTranslation },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Phase 2: Create Translation Files

#### 2.1 Directory Structure
```
src/
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en/
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── dashboard.json
│       │   ├── jobs.json
│       │   └── admin.json
│       └── zh/
│           ├── common.json
│           ├── auth.json
│           ├── dashboard.json
│           ├── jobs.json
│           └── admin.json
```

#### 2.2 Sample Translation Files

**en/common.json**
```json
{
  "appName": "JobPortal",
  "loading": "Loading...",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "create": "Create",
  "search": "Search",
  "filter": "Filter",
  "actions": "Actions",
  "status": "Status",
  "createdAt": "Created At",
  "updatedAt": "Updated At"
}
```

**zh/common.json**
```json
{
  "appName": "JobPortal",
  "loading": "加载中...",
  "save": "保存",
  "cancel": "取消",
  "delete": "删除",
  "edit": "编辑",
  "create": "创建",
  "search": "搜索",
  "filter": "筛选",
  "actions": "操作",
  "status": "状态",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### Phase 3: Component Migration

#### 3.1 Replace Hardcoded Text
```typescript
// Before
<button>保存</button>

// After
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
};
```

#### 3.2 Priority Components
1. **Navigation Components** - Menu items, breadcrumbs
2. **Auth Pages** - Login, Register, Forgot Password
3. **Dashboard Pages** - All dashboard components
4. **Form Components** - Labels, placeholders, buttons
5. **Table Components** - Headers, actions, pagination

### Phase 4: Language Switcher

#### 4.1 Create Language Switcher Component
```typescript
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? 'font-bold' : ''}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('zh')}
        className={i18n.language === 'zh' ? 'font-bold' : ''}
      >
        中文
      </button>
    </div>
  );
};
```

### Phase 5: Backend API Internationalization

#### 5.1 Error Messages
```typescript
// src/utils/errorMessages.ts
const errorMessages = {
  en: {
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.emailExists': 'Email already exists',
    'validation.required': 'This field is required',
  },
  zh: {
    'auth.invalidCredentials': '邮箱或密码错误',
    'auth.emailExists': '邮箱已存在',
    'validation.required': '此字段为必填项',
  },
};
```

### Phase 6: Date & Number Formatting

#### 6.1 Use Intl API
```typescript
// Date formatting
const formatDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Number formatting
const formatCurrency = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: locale === 'zh' ? 'CNY' : 'USD',
  }).format(amount);
};
```

## Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Setup | 1 day | P0 |
| Phase 2: Translation Files | 2 days | P0 |
| Phase 3: Component Migration | 5 days | P0 |
| Phase 4: Language Switcher | 1 day | P1 |
| Phase 5: Backend i18n | 2 days | P1 |
| Phase 6: Formatting | 1 day | P2 |

**Total: ~12 days**

---

# 中文

## 当前状态

项目目前没有国际化(i18n)支持，所有UI文本都是硬编码的中文。

## 实施计划

### 阶段1: 搭建i18n框架

#### 1.1 安装依赖
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

#### 1.2 创建i18n配置
```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      zh: { translation: zhTranslation },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### 阶段2: 创建翻译文件

#### 2.1 目录结构
```
src/
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en/
│       │   ├── common.json      # 通用翻译
│       │   ├── auth.json        # 认证相关
│       │   ├── dashboard.json   # 仪表板
│       │   ├── jobs.json        # 职位相关
│       │   └── admin.json       # 管理后台
│       └── zh/
│           ├── common.json
│           ├── auth.json
│           ├── dashboard.json
│           ├── jobs.json
│           └── admin.json
```

### 阶段3: 组件迁移

#### 3.1 替换硬编码文本
```typescript
// 修改前
<button>保存</button>

// 修改后
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
};
```

#### 3.2 优先迁移组件
1. **导航组件** - 菜单项、面包屑
2. **认证页面** - 登录、注册、忘记密码
3. **仪表板页面** - 所有仪表板组件
4. **表单组件** - 标签、占位符、按钮
5. **表格组件** - 表头、操作、分页

### 阶段4: 语言切换器

#### 4.1 创建语言切换组件
```typescript
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? 'font-bold' : ''}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('zh')}
        className={i18n.language === 'zh' ? 'font-bold' : ''}
      >
        中文
      </button>
    </div>
  );
};
```

### 阶段5: 后端API国际化

#### 5.1 错误消息
```typescript
// src/utils/errorMessages.ts
const errorMessages = {
  en: {
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.emailExists': 'Email already exists',
    'validation.required': 'This field is required',
  },
  zh: {
    'auth.invalidCredentials': '邮箱或密码错误',
    'auth.emailExists': '邮箱已存在',
    'validation.required': '此字段为必填项',
  },
};
```

### 阶段6: 日期和数字格式化

#### 6.1 使用Intl API
```typescript
// 日期格式化
const formatDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// 数字格式化
const formatCurrency = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: locale === 'zh' ? 'CNY' : 'USD',
  }).format(amount);
};
```

## 预计时间线

| 阶段 | 耗时 | 优先级 |
|------|------|--------|
| 阶段1: 搭建框架 | 1天 | P0 |
| 阶段2: 翻译文件 | 2天 | P0 |
| 阶段3: 组件迁移 | 5天 | P0 |
| 阶段4: 语言切换器 | 1天 | P1 |
| 阶段5: 后端国际化 | 2天 | P1 |
| 阶段6: 格式化 | 1天 | P2 |

**总计: 约12天**

---

## 需要国际化的内容清单 / Items Needing Internationalization

| Category | Chinese | English | Status |
|----------|---------|---------|--------|
| Navigation Menu | 导航菜单 | Navigation Menu | ⏳ Pending |
| Login Page | 登录页面 | Login Page | ⏳ Pending |
| Register Page | 注册页面 | Register Page | ⏳ Pending |
| Dashboard | 仪表板 | Dashboard | ⏳ Pending |
| Job Listings | 职位列表 | Job Listings | ⏳ Pending |
| Work Logs | 工时记录 | Work Logs | ⏳ Pending |
| Invoices | 发票 | Invoices | ⏳ Pending |
| Admin Panel | 管理后台 | Admin Panel | ⏳ Pending |
| Error Messages | 错误消息 | Error Messages | ⏳ Pending |
| Validation Messages | 验证消息 | Validation Messages | ⏳ Pending |
| Email Templates | 邮件模板 | Email Templates | ⏳ Pending |
| API Responses | API响应 | API Responses | ⏳ Pending |
