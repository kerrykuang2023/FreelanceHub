---
name: "ux-designer"
description: "Generates interactive designs, wireframes, and user flows. Invoke when user needs to create UI mockups, design user interfaces, plan user interactions, or create wireframes for the application."
---

# UX Designer

Comprehensive guide for creating user interface designs, wireframes, user flows, and interactive prototypes.

## Use Cases

- Create wireframes for new features
- Design user interaction flows
- Plan page layouts and component hierarchies
- Design responsive layouts
- Create interactive prototypes
- Document UI specifications

## Design Principles

### 1. User-Centered Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User-Centered Design                      │
├─────────────────────────────────────────────────────────────┤
│  1. Understand user needs and goals                        │
│  2. Define user personas and scenarios                      │
│  3. Create user flows and journey maps                     │
│  4. Design Information Architecture                         │
│  5. Wireframe → Prototype → Visual Design                   │
│  6. Test and iterate                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Information Architecture

```typescript
interface InformationArchitecture {
  mainNavigation: NavItem[];
  pageStructure: PageHierarchy;
  contentOrganization: ContentGroups;
}

const appStructure = {
  mainNavigation: [
    { label: '首页', path: '/', icon: 'Home' },
    { label: '职位', path: '/jobs', icon: 'Briefcase' },
    { label: '我的申请', path: '/applications', icon: 'Clipboard' },
    { label: '工时管理', path: '/work-logs', icon: 'Clock' },
    { label: '财务管理', path: '/payments', icon: 'Wallet' },
    { label: '消息', path: '/messages', icon: 'Message' },
    { label: '个人中心', path: '/profile', icon: 'User' }
  ]
};
```

## Wireframing

### 1. Page Wireframe Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    HEADER                            │   │
│  │  Logo    [Search]     Nav Links    [User Menu]      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    SUB HEADER                        │   │
│  │  Breadcrumb                    [Action Buttons]      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌───────────┐  ┌───────────────────────────────────┐   │
│  │           │  │                                    │   │
│  │  SIDEBAR  │  │            MAIN CONTENT             │   │
│  │           │  │                                    │   │
│  │  Filters  │  │   ┌────────┐  ┌────────┐         │   │
│  │           │  │   │  Card  │  │  Card  │         │   │
│  │  Tags     │  │   └────────┘  └────────┘         │   │
│  │           │  │                                    │   │
│  │           │  │   ┌────────┐  ┌────────┐         │   │
│  │           │  │   │  Card  │  │  Card  │         │   │
│  │           │  │   └────────┘  └────────┘         │   │
│  └───────────┘  └───────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    FOOTER                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Component Wireframes

```tsx
// Card Component
┌────────────────────────────┐
│ ┌──────┐                   │
│ │ IMG  │  Title            │
│ └──────┘  Description...   │
│          Meta info          │
│          [Action Button]    │
└────────────────────────────┘

// Form Layout
┌────────────────────────────────┐
│  Label                         │
│  ┌────────────────────────────┐│
│  │ Input Field                ││
│  └────────────────────────────┘│
│  Helper text / Error message  │
└────────────────────────────────┘

// Table Layout
┌─────────────────────────────────────┐
│ □ │ Column 1 │ Column 2 │ Column 3 │
├─────────────────────────────────────┤
│ □ │ Data 1   │ Data 2   │ Actions  │
│ □ │ Data 1   │ Data 2   │ Actions  │
└─────────────────────────────────────┘
```

## User Flows

### 1. Project Application Flow

```
[首页] → [浏览职位] → [查看详情] → [申请职位]
                                      │
                                      ▼
                              [填写申请信息]
                                      │
                                      ▼
                              [提交申请]
                                      │
                                      ▼
                              [申请成功]
                                      │
                                      ▼
                              [查看我的申请] ←── [返回首页]
```

### 2. Work Log Submission Flow

```
[工时管理] → [添加工时] → [选择日期] → [填写工时]
                                           │
                                           ▼
                                    [选择工作类型]
                                           │
                                           ▼
                                    [填写工作描述]
                                           │
                                           ▼
                                    [上传附件]
                                           │
                                           ▼
                              [保存草稿/提交]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                              ▼
             [保存草稿]                                     [提交工时]
                   │                                                  │
                   │                                                  ▼
                   │                                           [提交成功]
                   │                                                  │
                   ▼                                                  ▼
            [返回工时列表]                                   [企业审核中]
```

### 3. Payment Flow

```
[工时确认] → [发起付款申请] → [企业审批] → [线下转账]
                                           │           │
                                           ▼           ▼
                                    [审批拒绝]    [上传凭证]
                                         │           │
                                         ▼           ▼
                                    [修改重提]  [顾问确认]
                                                     │
                                                     ▼
                                              [对账完成]
```

## Responsive Design Breakpoints

```typescript
const breakpoints = {
  mobile: {
    width: '320px - 639px',
    columns: 1,
    sidebar: 'hidden'
  },
  tablet: {
    width: '640px - 1023px',
    columns: 2,
    sidebar: 'collapsed'
  },
  desktop: {
    width: '1024px - 1279px',
    columns: 3,
    sidebar: 'visible'
  },
  largeDesktop: {
    width: '1280px+',
    columns: 4,
    sidebar: 'visible'
  }
};
```

## UI Components Catalog

### Navigation Components

```tsx
// Header Navigation
<header className="sticky top-0 z-50 bg-white border-b">
  <nav className="flex items-center justify-between px-6 py-4">
    <Logo />
    <SearchBar />
    <UserMenu />
  </nav>
</header>

// Sidebar
<aside className="w-64 bg-gray-50 border-r">
  <nav className="p-4 space-y-2">
    {menuItems.map(item => (
      <NavLink key={item.path} to={item.path}>
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
</aside>

// Tabs
<div className="border-b">
  {tabs.map(tab => (
    <button
      key={tab.id}
      className={`px-4 py-2 border-b-2 ${
        activeTab === tab.id
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Form Components

```tsx
// Text Input
<div className="space-y-2">
  <label className="block text-sm font-medium">Label</label>
  <input
    type="text"
    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    placeholder="Enter value"
  />
</div>

// Select Dropdown
<select className="w-full px-4 py-2 border rounded-lg">
  {options.map(opt => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>

// Checkbox Group
<div className="space-y-2">
  {options.map(opt => (
    <label key={opt.value} className="flex items-center">
      <input type="checkbox" className="w-4 h-4" />
      <span className="ml-2">{opt.label}</span>
    </label>
  ))}
</div>

// Radio Group
<div className="space-y-2">
  {options.map(opt => (
    <label key={opt.value} className="flex items-center">
      <input type="radio" name="group" value={opt.value} />
      <span className="ml-2">{opt.label}</span>
    </label>
  ))}
</div>
```

### Data Display Components

```tsx
// Data Table
<table className="min-w-full divide-y">
  <thead className="bg-gray-50">
    <tr>
      {columns.map(col => (
        <th key={col.key} className="px-6 py-3 text-left">
          {col.label}
        </th>
      ))}
    </tr>
  </thead>
  <tbody className="divide-y">
    {rows.map(row => (
      <tr key={row.id}>
        {columns.map(col => (
          <td key={col.key} className="px-6 py-4">
            {col.render ? col.render(row[col.key]) : row[col.key]}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>

// Pagination
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-700">
    Showing {startIndex} to {endIndex} of {totalItems} results
  </span>
  <div className="flex space-x-2">
    <button onClick={prevPage} disabled={!canPrev}>Previous</button>
    {pageNumbers.map(page => (
      <button
        key={page}
        className={currentPage === page ? 'bg-blue-500' : ''}
      >
        {page}
      </button>
    ))}
    <button onClick={nextPage} disabled={!canNext}>Next</button>
  </div>
</div>
```

### Feedback Components

```tsx
// Toast Notification
<div className="fixed bottom-4 right-4 space-y-2">
  {toasts.map(toast => (
    <div
      key={toast.id}
      className={`px-4 py-3 rounded-lg shadow-lg ${
        toast.type === 'success' ? 'bg-green-500' :
        toast.type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
      } text-white`}
    >
      {toast.message}
    </div>
  ))}
</div>

// Modal Dialog
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black opacity-50"></div>
  <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
    <div className="flex justify-end space-x-2 mt-6">
      <button onClick={onCancel}>取消</button>
      <button onClick={onConfirm}>确认</button>
    </div>
  </div>
</div>

// Loading Spinner
<div className="flex items-center justify-center">
  <svg className="animate-spin h-8 w-8 text-blue-500">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
    <path className="opacity-75" fill="currentColor" d="..." />
  </svg>
</div>
```

## Accessibility Guidelines

- Use semantic HTML elements
- Ensure keyboard navigation support
- Maintain color contrast ratio ≥ 4.5:1
- Provide alt text for images
- Use ARIA labels for interactive elements
- Support screen reader navigation

## Chinese UI Best Practices

- Use simplified Chinese characters
- Place labels above form inputs
- Use full-width action buttons
- Format dates as YYYY-MM-DD
- Use appropriate measurement units
- Consider right-to-left reading for mixed content
