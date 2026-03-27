---
name: "ui-ux-pro-max"
description: "Comprehensive UI/UX design guide with 58 modern design styles, color palettes, and best practices. Invoke when designing web interfaces, creating React components, or building modern SaaS product UIs to achieve Apple/Airbnb-level visual quality."
---

# UI/UX Pro Max

Comprehensive design guide inspired by UI/UX Pro Max - 58 modern design styles, color schemes, and best practices for creating professional-grade user interfaces.

## Design Philosophy

### Before vs After

**Before (Generic Design)**:
- Flat colors, no depth
- Basic form elements
- Minimal visual hierarchy
- Dull, unprofessional appearance

**After (UI/UX Pro Max Design)**:
- Modern color palette with gradients
- Rounded corners (8px-16px radius)
- Soft shadows for depth
- Rich visual hierarchy
- Smooth transitions and animations
- Mobile-first responsive design

## Modern Design Principles

### 1. Color System

```typescript
// Primary Color Palette
const colors = {
  // Modern Blues
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Slate Grays
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Accent Colors
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
};

// Gradient Examples
const gradients = {
  primary: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  purple: 'bg-gradient-to-r from-purple-500 to-pink-500',
  sunset: 'bg-gradient-to-r from-orange-400 to-red-500',
  ocean: 'bg-gradient-to-r from-blue-400 to-teal-500',
};
```

### 2. Typography System

```typescript
const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    display: 'Plus Jakarta Sans, sans-serif',
  },

  fontSize: {
    xs: '0.75rem',    // 12px - labels
    sm: '0.875rem',   // 14px - secondary
    base: '1rem',     // 16px - body
    lg: '1.125rem',   // 18px - emphasis
    xl: '1.25rem',    // 20px - subheadings
    '2xl': '1.5rem',  // 24px - headings
    '3xl': '1.875rem', // 30px - titles
    '4xl': '2.25rem', // 36px - hero
    '5xl': '3rem',    // 48px - display
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};
```

### 3. Spacing & Layout

```typescript
const spacing = {
  // 8px Grid System
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// Container widths
const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
```

### 4. Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.25rem',     // 4px - subtle
  DEFAULT: '0.5rem', // 8px - standard
  md: '0.5rem',      // 8px
  lg: '0.75rem',     // 12px - cards
  xl: '1rem',        // 16px - buttons
  '2xl': '1.5rem',   // 24px - large elements
  '3xl': '2rem',     // 32px
  full: '9999px',    // pill shapes
};

// Usage
const roundedStyles = {
  button: 'rounded-lg',      // 8px
  card: 'rounded-xl',        // 12px
  input: 'rounded-md',       // 6px
  avatar: 'rounded-full',    // circle
  badge: 'rounded-full',     // pill
};
```

### 5. Shadows

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgb(59 130 246 / 0.3)',
};

// Usage
const shadowUsage = {
  card: 'shadow-sm hover:shadow-md transition-shadow duration-200',
  elevated: 'shadow-lg',
  modal: 'shadow-2xl',
  glow: 'shadow-lg shadow-blue-500/20',
};
```

## 58 Design Styles Reference

### 1. Modern Minimalist

```tsx
// Clean, spacious, focus on content
const modernMinimalist = {
  background: 'bg-white',
  text: 'text-gray-900',
  spacing: 'p-8',
  border: 'border-0',
  shadow: 'shadow-sm',
  accent: 'text-blue-600',
};
```

### 2. SaaS Dashboard

```tsx
const saasDashboard = {
  sidebar: 'w-64 bg-slate-900 text-white',
  header: 'h-16 bg-white border-b px-6',
  cards: 'bg-white rounded-xl shadow-sm p-6',
  stats: 'grid grid-cols-4 gap-6',
  chart: 'bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6',
};
```

### 3. Glassmorphism

```tsx
const glassmorphism = {
  container: 'relative',
  background: 'bg-gradient-to-br from-purple-500 to-blue-500',
  card: 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl',
  text: 'text-white',
};
```

### 4. Neo-Brutalism

```tsx
const neoBrutalism = {
  card: 'bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_black]',
  button: 'bg-yellow-400 border-2 border-black rounded-none px-6 py-3 font-bold',
  text: 'font-mono',
};
```

### 5. Soft UI / Neumorphism

```tsx
const softUI = {
  container: 'bg-gray-100 rounded-3xl',
  card: 'bg-gray-100 rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff]',
  button: 'bg-gray-100 rounded-full shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]',
};
```

### 6. Dark Mode

```tsx
const darkMode = {
  background: 'bg-slate-950',
  card: 'bg-slate-900 border border-slate-800',
  text: 'text-slate-100',
  muted: 'text-slate-400',
  accent: 'text-blue-400',
  border: 'border-slate-700',
};
```

### 7. Corporate Enterprise

```tsx
const corporateEnterprise = {
  header: 'bg-blue-900 text-white',
  sidebar: 'bg-gray-50 border-r',
  card: 'bg-white border border-gray-200 rounded-lg',
  table: 'min-w-full divide-y divide-gray-200',
  button: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md',
};
```

### 8. Startup / Landing Page

```tsx
const startupLanding = {
  hero: 'min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900',
  heading: 'text-5xl md:text-6xl font-bold text-white tracking-tight',
  subheading: 'text-xl text-slate-300 max-w-2xl mx-auto',
  cta: 'bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold',
  card: 'bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8',
};
```

## Component Design Patterns

### 1. Buttons

```tsx
// Primary Button
<button className="
  bg-blue-600 hover:bg-blue-700
  text-white
  px-6 py-3
  rounded-lg
  font-semibold
  shadow-lg shadow-blue-500/30
  hover:shadow-xl hover:shadow-blue-500/40
  transform hover:-translate-y-0.5
  transition-all duration-200
">
  Primary Action
</button>

// Secondary Button
<button className="
  bg-white hover:bg-gray-50
  text-gray-700
  px-6 py-3
  rounded-lg
  font-medium
  border border-gray-200
  hover:border-gray-300
  shadow-sm
  transition-all duration-200
">
  Secondary
</button>

// Ghost Button
<button className="
  text-gray-600
  px-6 py-3
  rounded-lg
  font-medium
  hover:bg-gray-100
  transition-colors duration-200
">
  Ghost
</button>

// Icon Button
<button className="
  w-10 h-10
  flex items-center justify-center
  rounded-full
  text-gray-500
  hover:bg-gray-100
  hover:text-gray-700
  transition-all duration-200
">
  <Icon name="settings" />
</button>

// Gradient Button
<button className="
  bg-gradient-to-r from-blue-500 to-cyan-500
  hover:from-blue-600 hover:to-cyan-600
  text-white
  px-8 py-4
  rounded-xl
  font-bold
  shadow-lg shadow-blue-500/30
  transform hover:scale-105
  transition-all duration-200
">
  Get Started
</button>
```

### 2. Cards

```tsx
// Standard Card
<div className="
  bg-white
  rounded-xl
  shadow-sm
  border border-gray-100
  overflow-hidden
  hover:shadow-md
  transition-shadow duration-200
">
  <div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Card Title
      </h3>
      <span className="text-sm text-gray-500">2 days ago</span>
    </div>
    <p className="text-gray-600">
      Card description text goes here...
    </p>
  </div>
  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
    <button className="text-blue-600 font-medium hover:text-blue-700">
      Learn More
    </button>
  </div>
</div>

// Dashboard Stat Card
<div className="
  bg-white
  rounded-2xl
  p-6
  shadow-sm
  border border-gray-100
">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">¥128,500</p>
    </div>
    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-green-600" />
    </div>
  </div>
  <div className="mt-4 flex items-center text-sm">
    <span className="text-green-600 font-medium">+12.5%</span>
    <span className="text-gray-500 ml-2">vs last month</span>
  </div>
</div>

// Hover Lift Card
<div className="
  bg-white
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  transition-all duration-300
  cursor-pointer
">
  {/* Card content */}
</div>
```

### 3. Forms

```tsx
// Input Field
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <div className="relative">
    <input
      type="email"
      className="
        w-full
        px-4 py-3
        bg-gray-50
        border border-gray-200
        rounded-xl
        text-gray-900
        placeholder-gray-400
        focus:outline-none focus:ring-4 focus:ring-blue-500/20
        focus:border-blue-500
        transition-all duration-200
      "
      placeholder="you@example.com"
    />
  </div>
  <p className="text-sm text-gray-500">
    We'll never share your email
  </p>
</div>

// Select Dropdown
<select className="
  w-full
  px-4 py-3
  bg-gray-50
  border border-gray-200
  rounded-xl
  text-gray-900
  focus:outline-none focus:ring-4 focus:ring-blue-500/20
  focus:border-blue-500
  transition-all duration-200
  cursor-pointer
  appearance-none
  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg')]
>
  {options}
</select>

// Checkbox
<label className="flex items-center space-x-3 cursor-pointer">
  <input
    type="checkbox"
    className="
      w-5 h-5
      rounded-lg
      border-2 border-gray-300
      text-blue-600
      focus:ring-4 focus:ring-blue-500/20
      transition-colors duration-200
    "
  />
  <span className="text-gray-700">Remember me</span>
</label>

// Toggle Switch
<div className="flex items-center justify-between">
  <span className="text-gray-700">Dark Mode</span>
  <button className="
    relative
    w-14 h-8
    bg-gray-200
    rounded-full
    transition-colors duration-200
    focus:outline-none focus:ring-4 focus:ring-blue-500/20
  ">
    <span className="
      absolute
      top-1 left-1
      w-6 h-6
      bg-white
      rounded-full
      shadow-md
      transform transition-transform duration-200
      translate-x-0
    " />
  </button>
</div>
```

### 4. Navigation

```tsx
// Header
<header className="
  sticky top-0 z-50
  bg-white/80 backdrop-blur-lg
  border-b border-gray-100
">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <div className="flex items-center space-x-8">
      <Logo />
      <nav className="hidden md:flex items-center space-x-1">
        {navItems.map(item => (
          <a
            key={item.href}
            href={item.href}
            className="
              px-4 py-2
              rounded-lg
              text-gray-600
              hover:text-gray-900 hover:bg-gray-100
              transition-colors duration-200
            "
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
    <div className="flex items-center space-x-4">
      <UserMenu />
    </div>
  </div>
</header>

// Sidebar
<aside className="
  fixed left-0 top-0 bottom-0
  w-64
  bg-slate-900
  text-white
  p-6
  overflow-y-auto
">
  <div className="mb-8">
    <Logo />
  </div>
  <nav className="space-y-1">
    {menuItems.map(item => (
      <a
        key={item.href}
        href={item.href}
        className="
          flex items-center space-x-3
          px-4 py-3
          rounded-xl
          text-slate-300
          hover:bg-white/10
          hover:text-white
          transition-colors duration-200
        "
      >
        <Icon name={item.icon} className="w-5 h-5" />
        <span>{item.label}</span>
      </a>
    ))}
  </nav>
</aside>
```

### 5. Tables

```tsx
<div className="
  bg-white
  rounded-xl
  shadow-sm
  border border-gray-100
  overflow-hidden
">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        {headers.map(header => (
          <th
            key={header.key}
            className="
              px-6 py-4
              text-left
              text-xs font-semibold
              text-gray-500 uppercase tracking-wider
            "
          >
            {header.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {rows.map(row => (
        <tr
          key={row.id}
          className="
            hover:bg-gray-50
            transition-colors duration-150
          "
        >
          <td className="px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {row.avatar}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">{row.name}</p>
                <p className="text-sm text-gray-500">{row.email}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">
            {row.date}
          </td>
          <td className="px-6 py-4">
            <ActionMenu row={row} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  <Pagination />
</div>
```

### 6. Modals

```tsx
// Overlay
<div className="
  fixed inset-0 z-50
  bg-black/50 backdrop-blur-sm
  flex items-center justify-center
  p-4
">
  {/* Modal */}
  <div className="
    bg-white
    rounded-2xl
    shadow-2xl
    w-full max-w-lg
    max-h-[90vh]
    overflow-hidden
    transform transition-all
  ">
    <div className="
      flex items-center justify-between
      px-6 py-4
      border-b border-gray-100
    ">
      <h2 className="text-xl font-semibold text-gray-900">
        Modal Title
      </h2>
      <button className="
        w-8 h-8
        flex items-center justify-center
        rounded-lg
        text-gray-400
        hover:bg-gray-100
        hover:text-gray-600
        transition-colors
      ">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="p-6 overflow-y-auto">
      {children}
    </div>
    <div className="
      flex items-center justify-end
      px-6 py-4
      bg-gray-50
      border-t border-gray-100
      space-x-3
    ">
      <button className="
        px-6 py-2
        rounded-xl
        text-gray-600
        hover:bg-gray-100
        font-medium
        transition-colors
      ">
        Cancel
      </button>
      <button className="
        px-6 py-2
        rounded-xl
        bg-blue-600
        text-white
        font-medium
        hover:bg-blue-700
        shadow-lg shadow-blue-500/30
        transition-all
      ">
        Confirm
      </button>
    </div>
  </div>
</div>
```

## Animations & Transitions

```typescript
// Common Animations
const animations = {
  // Fade In
  fadeIn: 'animate-[fadeIn_0.3s_ease-out]',

  // Slide Up
  slideUp: 'animate-[slideUp_0.3s_ease-out]',

  // Scale
  scaleIn: 'animate-[scaleIn_0.2s_ease-out]',

  // Spin
  spin: 'animate-spin',

  // Pulse
  pulse: 'animate-pulse',

  // Bounce
  bounce: 'animate-bounce',
};

// CSS Keyframes (add to global.css)
const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
`;
```

## Responsive Design

```typescript
const responsiveBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Responsive Classes
const responsiveClasses = {
  // Grid
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',

  // Flex
  flex: 'flex flex-col sm:flex-row items-center justify-between',

  // Text
  heading: 'text-2xl md:text-3xl lg:text-4xl font-bold',

  // Spacing
  section: 'py-8 md:py-12 lg:py-16 px-4 md:px-6 lg:px-8',

  // Container
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
};
```

## Best Practices

### 1. Color Usage

- Use primary colors sparingly (CTAs, links)
- Use muted colors for secondary text
- Maintain 4.5:1 contrast ratio for accessibility
- Use consistent color throughout the app
- Consider dark mode from the start

### 2. Spacing

- Use 8px grid system consistently
- Use generous whitespace for readability
- Group related elements together
- Create visual hierarchy with spacing

### 3. Typography

- Use a maximum of 2-3 font sizes on a page
- Use font weight to create hierarchy
- Use uppercase sparingly (labels only)
- Ensure adequate line height (1.5-1.75 for body)

### 4. Shadows

- Use subtle shadows for depth
- Match shadow intensity to elevation level
- Use colored shadows for brand emphasis
- Keep shadows consistent across the app

### 5. Border Radius

- Use larger radius for cards and containers
- Use smaller radius for inputs and buttons
- Keep radius consistent within components
- Consider using full radius for avatars and badges

## Chinese UI Tips

- Use simplified Chinese characters
- Use full-width form buttons
- Format dates as YYYY年MM月DD日
- Format currency with ¥ symbol: ¥55,120
- Use appropriate honorifics
- Right-align numbers in tables
- Place labels above inputs
