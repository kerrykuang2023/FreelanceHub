---
name: "frontend-design"
description: "Design guide for creating professional React UIs with consistent styling. Invoke when building UI components, pages, or layouts that need polished visual design."
---

# Frontend Design

Professional UI/UX design guide for React applications, ensuring consistent visual design and excellent user experience.

## Design Principles

### 1. Visual Consistency

- Use consistent color palette throughout the application
- Follow 8px grid system for spacing (padding, margins)
- Maintain consistent border-radius (use 8px as standard)
- Apply subtle shadows for depth: `shadow-sm` or `shadow-md`

### 2. Color Usage

```css
/* Primary Colors - Use for main actions */
--primary: #3B82F6;      /* Blue - main buttons, links */
--primary-hover: #2563EB;

/* Secondary Colors - Use for secondary elements */
--secondary: #64748B;    /* Slate - secondary text, borders */

/* Success/Error/Warning */
--success: #10B981;
--error: #EF4444;
--warning: #F59E0B;

/* Background */
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;
--bg-tertiary: #F1F5F9;
```

### 3. Typography

```css
/* Font Sizes */
text-xs: 0.75rem    /* 12px - labels, hints */
text-sm: 0.875rem   /* 14px - secondary text */
text-base: 1rem     /* 16px - body text */
text-lg: 1.125rem   /* 18px - emphasis */
text-xl: 1.25rem    /* 20px - section titles */
text-2xl: 1.5rem    /* 24px - page titles */

/* Font Weights */
font-normal: 400    /* body text */
font-medium: 500    /* emphasis */
font-semibold: 600  /* headings */
font-bold: 700      /* strong emphasis */
```

### 4. Spacing System

```css
/* Based on 8px grid */
space-1: 0.25rem   /* 4px */
space-2: 0.5rem    /* 8px */
space-3: 0.75rem   /* 12px */
space-4: 1rem      /* 16px */
space-5: 1.25rem   /* 20px */
space-6: 1.5rem    /* 24px */
space-8: 2rem      /* 32px */
space-10: 2.5rem   /* 40px */
space-12: 3rem     /* 48px */
```

## Component Patterns

### 1. Card Component

```tsx
// Standard card with shadow and rounded corners
<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    {title}
  </h3>
  <p className="text-gray-600 text-sm">
    {description}
  </p>
</div>
```

### 2. Button Styles

```tsx
// Primary Button
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg
                   hover:bg-blue-700 transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed">
  {children}
</button>

// Secondary Button
<button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg
                   hover:bg-gray-200 transition-colors duration-200">
  {children}
</button>

// Outline Button
<button className="border border-gray-300 text-gray-700 px-4 py-2
                   rounded-lg hover:bg-gray-50 transition-colors duration-200">
  {children}
</button>
```

### 3. Form Input

```tsx
// Standard input with label
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    {label}
  </label>
  <input
    type="text"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               transition-colors duration-200"
    placeholder={placeholder}
  />
  <p className="text-xs text-gray-500">{hint}</p>
</div>
```

### 4. Select/Dropdown

```tsx
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg
                   bg-white focus:ring-2 focus:ring-blue-500
                   focus:border-blue-500 transition-colors duration-200">
  {options.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

### 5. Status Badge

```tsx
// Status indicators with color coding
const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
};

<span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${statusStyles[status]}`}>
  {statusText}
</span>
```

### 6. Table

```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      {headers.map(header => (
        <th key={header} className="px-6 py-3 text-left text-xs
                                   font-medium text-gray-500 uppercase tracking-wider">
          {header}
        </th>
      ))}
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {rows.map(row => (
      <tr key={row.id} className="hover:bg-gray-50">
        {/* cells */}
      </tr>
    ))}
  </tbody>
</table>
```

## Page Layout Patterns

### 1. Page Header

```tsx
<div className="border-b border-gray-200 pb-4 mb-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {pageTitle}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {pageDescription}
      </p>
    </div>
    <div className="flex space-x-3">
      {/* action buttons */}
    </div>
  </div>
</div>
```

### 2. Section Card

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-100">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900">
      {sectionTitle}
    </h3>
  </div>
  <div className="p-6">
    {content}
  </div>
</div>
```

### 3. Empty State

```tsx
<div className="text-center py-12">
  <svg className="mx-auto h-12 w-12 text-gray-400"
       fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
  <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
  <p className="mt-1 text-sm text-gray-500">{description}</p>
</div>
```

## Responsive Design

```tsx
// Mobile-first approach
// Extra small devices (phone)
grid-cols-1

// Small devices (tablet)
sm:grid-cols-2

// Medium devices (desktop)
md:grid-cols-3

// Large devices
lg:grid-cols-4

// Extra large
xl:grid-cols-6
```

## Accessibility

- Use semantic HTML elements
- Add `aria-label` for icon-only buttons
- Ensure color contrast ratio ≥ 4.5:1
- Add focus states for keyboard navigation
- Use proper heading hierarchy (h1 → h2 → h3)

## Animation & Transitions

```tsx
// Smooth hover effects
transition-all duration-200 ease-in-out

// Button press effect
active:scale-95

// Fade in
animate-fade-in

// Slide in
animate-slide-in
```

## Chinese UI Text

When building UI for Chinese users:
- Use simplified Chinese characters
- Place labels above inputs (not beside)
- Use full-width form buttons
- Format dates as YYYY-MM-DD
- Format currency with ¥ symbol: ¥55,120.00
- Use appropriate honorifics when needed
