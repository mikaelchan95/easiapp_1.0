# Responsive Design & Dark Mode Implementation Guide

## Overview

This admin dashboard now features a complete responsive design system with light/dark mode support using a greyscale color palette.

## 🎨 Design System

### Color Scheme

#### CSS Variables

All colors are defined using CSS custom properties that adapt to light/dark mode:

**Light Mode:**

```css
--bg-primary: hsl(0, 0%, 100%) /* Pure white - cards, surfaces */
  --bg-secondary: hsl(0, 0%, 98%) /* Very light gray - page background */
  --bg-tertiary: hsl(0, 0%, 96%) /* Light gray - hover states, table headers */
  --text-primary: hsl(0, 0%, 0%) /* Black - headings, primary text */
  --text-secondary: hsl(0, 0%, 30%) /* Dark gray - secondary text */
  --text-tertiary: hsl(0, 0%, 50%)
  /* Medium gray - placeholder, disabled text */
  --border-primary: hsl(0, 0%, 90%) /* Light border */
  --border-secondary: hsl(0, 0%, 85%) /* Slightly darker border */;
```

**Dark Mode:**

```css
--bg-primary: hsl(0, 0%, 9%) /* Very dark gray - cards, surfaces */
  --bg-secondary: hsl(0, 0%, 7%) /* Almost black - page background */
  --bg-tertiary: hsl(0, 0%, 12%) /* Dark gray - hover states, table headers */
  --text-primary: hsl(0, 0%, 98%) /* Off-white - headings, primary text */
  --text-secondary: hsl(0, 0%, 70%) /* Light gray - secondary text */
  --text-tertiary: hsl(0, 0%, 50%)
  /* Medium gray - placeholder, disabled text */
  --border-primary: hsl(0, 0%, 20%) /* Dark border */
  --border-secondary: hsl(0, 0%, 25%) /* Slightly lighter border */;
```

### Usage Pattern

Replace hardcoded colors with CSS variables:

```tsx
// ❌ Before
className = 'bg-white text-black border-gray-200';

// ✅ After
className =
  'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)]';
```

## 📱 Responsive Breakpoints

Following Tailwind CSS defaults:

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (sm to lg)
- **Desktop:** ≥ 1024px (lg+)

### Mobile-First Approach

Start with mobile styles, progressively enhance for larger screens:

```tsx
// ✅ Mobile-first
className = 'text-xl sm:text-2xl lg:text-3xl'; // Scales up
className = 'flex-col sm:flex-row'; // Stack on mobile, row on desktop
className = 'px-4 sm:px-6 lg:px-8'; // Tighter spacing on mobile
```

## 🎯 Touch Targets (Mobile Optimization)

### Minimum Sizes

- **Buttons:** `min-h-[44px]` (44px is Apple's recommended minimum)
- **Input fields:** `min-h-[44px]`
- **Interactive icons:** `min-w-[36px] min-h-[36px]`
- **Links with icons:** Ensure padding creates 44x44px hit area

### Implementation

```tsx
// ✅ Proper touch targets
<button className="min-h-[44px] px-4 py-2 touch-manipulation">
  Click Me
</button>

// ✅ Icon buttons
<button className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon size={20} />
</button>
```

### Touch-specific CSS

```css
touch-manipulation  /* Disable double-tap zoom on buttons */
```

## 🧩 Component Patterns

### 1. Layout Component ✅ UPDATED

- Collapsible sidebar (desktop & mobile)
- Theme toggle button (Sun/Moon icon)
- Persists sidebar and theme state in localStorage
- Responsive header for mobile
- Touch-optimized navigation items

### 2. UI Components ✅ UPDATED

#### Button

```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
Sizes: `sm` (36px), `md` (44px), `lg` (48px)

#### Card

```tsx
<Card hover className="p-6">
  Content here
</Card>
```

Auto-adapts borders and backgrounds to theme.

#### Badge

```tsx
<Badge variant="success">Active</Badge>
```

Variants: `default`, `success`, `warning`, `error`, `outline`

### 3. Page Components

#### Header Pattern

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
    Page Title
  </h1>
  <div className="flex gap-2">{/* Actions */}</div>
</div>
```

#### Search & Filter Pattern

```tsx
<div className="flex flex-col sm:flex-row gap-3 mb-6">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
    <input
      type="text"
      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
      placeholder="Search..."
    />
  </div>
  <select className="w-full sm:w-48 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 px-4 min-h-[44px]">
    {/* Options */}
  </select>
</div>
```

#### Data Table Pattern

```tsx
<Card className="overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm min-w-[800px]">
      <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold">
        <tr>
          <th className="px-4 sm:px-6 py-3 sm:py-4">Column</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border-primary)]">
        <tr className="hover:bg-[var(--bg-tertiary)] transition-colors">
          <td className="px-4 sm:px-6 py-3 sm:py-4">Data</td>
        </tr>
      </tbody>
    </table>
  </div>
</Card>
```

Key points:

- Set `min-w` on table to enable horizontal scroll on mobile
- Use `sm:` breakpoints for padding adjustments
- Hover states work better with `hover:bg-[var(--bg-tertiary)]`

## 📄 Updated Files

### ✅ Core Infrastructure

1. `src/context/ThemeContext.tsx` - Theme management
2. `src/index.css` - CSS variables, global styles
3. `src/main.tsx` - ThemeProvider wrapper
4. `src/components/Layout.tsx` - Collapsible sidebar, theme toggle

### ✅ UI Components

1. `src/components/ui/Button.tsx`
2. `src/components/ui/Card.tsx`
3. `src/components/ui/Badge.tsx`

### ✅ Page Components (ALL CORE PAGES COMPLETE)

1. `src/pages/Login.tsx`
2. `src/pages/Dashboard.tsx`
3. `src/pages/Customers.tsx`
4. `src/pages/Companies.tsx`
5. `src/pages/Orders.tsx`
6. `src/pages/Products.tsx` (via ProductList)
7. `src/pages/Rewards.tsx`
8. `src/pages/Invoices.tsx`
9. `src/pages/Categories.tsx`
10. `src/pages/Content.tsx`
11. `src/pages/Notifications.tsx`
12. `src/pages/Settings.tsx`
13. `src/components/ProductList.tsx`
14. `src/components/DataTable.tsx`

### 🔄 Remaining Pages to Update

Detail pages and form components (lower priority):

- `src/pages/CompanyDetail.tsx`
- `src/pages/OrderDetail.tsx`
- `src/pages/CustomerDetail.tsx`
- All form components (`ProductForm`, `CompanyForm`, `OrderForm`, etc.)

## 🔧 Implementation Checklist

For each remaining page/component:

- [ ] Replace `bg-white` → `bg-[var(--bg-primary)]`
- [ ] Replace `bg-gray-50/100/200` → `bg-[var(--bg-secondary)]` or `bg-[var(--bg-tertiary)]`
- [ ] Replace `text-black/gray-900` → `text-[var(--text-primary)]`
- [ ] Replace `text-gray-500/600` → `text-[var(--text-secondary)]`
- [ ] Replace `text-gray-400` → `text-[var(--text-tertiary)]`
- [ ] Replace `border-gray-200/300` → `border-[var(--border-primary)]`
- [ ] Add responsive padding: `px-4 sm:px-6 py-3 sm:py-4`
- [ ] Add responsive text: `text-2xl sm:text-3xl`
- [ ] Add flex direction: `flex-col sm:flex-row`
- [ ] Add touch targets: `min-h-[44px]` on all interactive elements
- [ ] Add `touch-manipulation` to buttons
- [ ] Use `truncate` for text that might overflow on mobile
- [ ] Add `min-w-0` to flex children that should shrink
- [ ] Use `flex-shrink-0` for elements that shouldn't shrink
- [ ] Tables: Add `overflow-x-auto` wrapper and `min-w-[800px]` on table

## 🎨 Color-Specific Cases

### Status Colors

Status colors (success/error/warning) should adapt to dark mode:

```tsx
// ✅ Auto-adapting status colors
className =
  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
className = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
className =
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
```

### Hover States

```tsx
// ✅ Theme-aware hover
hover:bg-[var(--bg-tertiary)]
hover:text-[var(--text-primary)]

// ✅ For status-colored elements
hover:bg-blue-50 dark:hover:bg-blue-900/20
```

## 🧪 Testing Guidelines

### Manual Testing

1. **Theme Toggle:** Test both light and dark modes on every page
2. **Responsiveness:** Test at mobile (375px), tablet (768px), and desktop (1440px) widths
3. **Touch Targets:** On mobile, ensure all interactive elements are easily tappable
4. **Readability:** Ensure text contrast is sufficient in both modes
5. **Sidebar:** Test collapse/expand on desktop and mobile overlay

### Browser Testing

- Chrome/Edge (Chromium)
- Safari (WebKit)
- Firefox
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Accessibility

- Keyboard navigation works (`Tab`, `Enter`, `Space`, `Esc`)
- Focus states visible (`:focus-visible` rings)
- Color contrast meets WCAG AA standards
- Screen reader friendly (semantic HTML, aria-labels)

## 🚀 Performance

### Optimizations Applied

1. **Transitions:** Limited to 200-300ms for smooth feel without lag
2. **CSS Variables:** Faster than class swapping
3. **Touch-action:** `touch-manipulation` prevents 300ms click delay
4. **Lazy Loading:** Consider for images in tables
5. **Virtual Scrolling:** Consider for long lists (100+ items)

### Bundle Impact

- Theme context: ~2KB
- CSS variables: ~1KB
- No external theme libraries needed

## 📚 Resources

- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures)
- [Google Material Design - Touch Targets](https://m3.material.io/foundations/interaction/states/state-layers#9e284133-f172-4dff-a68a-b16e6c8e0a65)
- [Tailwind CSS - Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN - CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## 🎯 Quick Reference

### Frequently Used Classes

```tsx
// Backgrounds
bg-[var(--bg-primary)]    // Cards, modals, surfaces
bg-[var(--bg-secondary)]  // Page background
bg-[var(--bg-tertiary)]   // Table headers, hover states

// Text
text-[var(--text-primary)]    // Headings, primary content
text-[var(--text-secondary)]  // Descriptions, labels
text-[var(--text-tertiary)]   // Placeholders, disabled

// Borders
border-[var(--border-primary)]

// Responsive
px-4 sm:px-6 lg:px-8
text-xl sm:text-2xl lg:text-3xl
flex-col sm:flex-row
gap-3 sm:gap-4 lg:gap-6

// Touch
min-h-[44px]
min-w-[44px]
touch-manipulation
```
