# ESTA Tracker UI Design Guidelines

## Overview

This document outlines the UI/UX design system for ESTA Tracker, including components, utilities, responsive design patterns, and accessibility guidelines.

## Table of Contents

- [Design Principles](#design-principles)
- [Color System](#color-system)
- [Typography](#typography)
- [Components](#components)
- [Responsive Design](#responsive-design)
- [Loading States](#loading-states)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)

## Design Principles

### 1. Clarity First

- Clear visual hierarchy
- Consistent spacing and alignment
- Intuitive user flows

### 2. Responsive by Default

- Mobile-first approach
- Fluid layouts that adapt to any screen size
- Container queries for modular component design

### 3. Performance Optimized

- Lazy loading for routes and heavy components
- Optimized animations using CSS transforms
- Code splitting for faster initial load

### 4. Accessible to All

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Skip links for main content

### 5. Progressive Enhancement

- Core functionality works without JavaScript
- Enhanced experience with modern features
- Graceful degradation for older browsers

## Color System

### Primary Colors (Blue)

```
50:  #eff6ff
100: #dbeafe
200: #bfdbfe
300: #93c5fd
400: #60a5fa
500: #3b82f6  (Primary)
600: #2563eb  (Primary Dark)
700: #1d4ed8
800: #1e40af
900: #1e3a8a
```

### Accent Colors (Purple/Pink)

```
50:  #fdf4ff
100: #fae8ff
200: #f5d0fe
300: #f0abfc
400: #e879f9
500: #d946ef  (Accent)
600: #c026d3  (Accent Dark)
700: #a21caf
800: #86198f
900: #701a75
```

### Usage

- **Primary**: Main actions, links, focus states
- **Accent**: Secondary highlights, decorative elements
- **Gray**: Text, borders, backgrounds
- **Semantic**: Success (green), Danger (red), Warning (yellow), Info (blue)

## Typography

### Responsive Text Classes

Use responsive text utilities that automatically adjust size based on viewport:

```tsx
<h1 className="text-responsive-2xl">Main Heading</h1>
<h2 className="text-responsive-xl">Section Heading</h2>
<h3 className="text-responsive-lg">Subsection Heading</h3>
<p className="text-responsive-base">Body text</p>
<small className="text-responsive-sm">Small text</small>
```

### Font Stack

```css
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Font Weights

- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

## Components

### Buttons

#### Design System Button Component

```tsx
import { Button } from '@/components/DesignSystem';

<Button variant="primary" size="md">
  Click Me
</Button>;
```

**Variants**: `primary`, `secondary`, `danger`, `ghost`
**Sizes**: `sm`, `md`, `lg`
**Props**: `isLoading`, `disabled`, `fullWidth`, `leftIcon`, `rightIcon`

#### CSS Button Classes (Legacy)

```tsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Danger</button>
<button className="btn btn-success">Success</button>
```

#### Button States

All buttons include:

- **Hover**: Scale and color change
- **Active**: Scale down effect
- **Focus**: Ring outline for keyboard navigation
- **Disabled**: Reduced opacity and no pointer events
- **Loading**: Spinner with disabled interaction

### Loading Spinners

#### LoadingSpinner Component

```tsx
import { LoadingSpinner } from '@/components/DesignSystem';

<LoadingSpinner
  variant="circular" // circular, dots, pulse, bars
  size="md" // xs, sm, md, lg, xl
  text="Loading..."
/>;
```

#### PageLoader Component

For full-page loading states:

```tsx
import { PageLoader } from '@/components/DesignSystem';

<PageLoader
  message="Loading Dashboard"
  hint="This may take a few seconds"
  overlay={true}
/>;
```

#### InlineLoader Component

For inline loading states:

```tsx
import { InlineLoader } from '@/components/DesignSystem';

<p>
  Processing <InlineLoader text="Please wait" />
</p>;
```

### Cards

#### Responsive Card

```tsx
import { ResponsiveCard } from '@/components/ResponsiveCard';

<ResponsiveCard
  title="Card Title"
  description="Card description"
  variant="default" // default, compact, detailed
  onAction={() => {}}
  actionLabel="View More"
>
  {children}
</ResponsiveCard>;
```

#### CSS Card Classes

```tsx
<div className="card">Basic card</div>
<div className="card-hover">Card with hover effect</div>
<div className="glass-card">Glassmorphism card</div>
```

### Skeleton Loaders

For loading placeholders:

```tsx
import { SkeletonLoader, SkeletonCard } from '@/components/DesignSystem';

<SkeletonLoader variant="text" count={3} />
<SkeletonLoader variant="circle" width={64} height={64} />
<SkeletonLoader variant="rectangular" width="100%" height={200} />
<SkeletonCard />
```

## Responsive Design

### Breakpoints

```
xs:  < 640px   (Mobile)
sm:  640px     (Large Mobile)
md:  768px     (Tablet)
lg:  1024px    (Desktop)
xl:  1280px    (Large Desktop)
2xl: 1536px    (Extra Large Desktop)
```

### Container Utilities

#### Responsive Container

```tsx
<div className="container-responsive">
  {/* Max-width: 1280px with responsive padding */}
</div>
```

#### Narrow Container

```tsx
<div className="container-narrow">
  {/* Max-width: 768px with responsive padding */}
</div>
```

#### Wide Container

```tsx
<div className="container-wide">
  {/* Max-width: 1536px with responsive padding */}
</div>
```

### Grid Utilities

#### Auto-fit Responsive Grid

```tsx
<div className="grid-responsive">
  {/* Auto-fits columns with min 280px width */}
</div>
```

#### Fixed Column Grids

```tsx
<div className="grid-2-cols">{/* 2 columns on tablet+ */}</div>
<div className="grid-3-cols">{/* 3 columns on desktop+ */}</div>
<div className="grid-4-cols">{/* 4 columns on XL screens */}</div>
```

### Spacing Utilities

```tsx
<div className="space-responsive">
  {/* Vertical spacing that adapts to screen size */}
</div>

<div className="padding-responsive">
  {/* Padding on all sides */}
</div>

<div className="padding-responsive-x">
  {/* Horizontal padding only */}
</div>

<div className="padding-responsive-y">
  {/* Vertical padding only */}
</div>
```

## Loading States

### When to Use Each Loader

#### 1. Page Transitions

Use `PageLoader` with overlay:

```tsx
<PageLoader message="Loading Dashboard" hint="Fetching your data..." />
```

#### 2. Data Fetching Boundaries

Use `LoadingSpinner` centered:

```tsx
<LoadingSpinner
  variant="circular"
  size="lg"
  text="Loading employees..."
  centered
/>
```

#### 3. Button Actions

Use `LoadingButton` or Button with `isLoading`:

```tsx
<Button isLoading>Saving...</Button>
```

#### 4. Inline Updates

Use `InlineLoader`:

```tsx
<InlineLoader text="Updating..." />
```

#### 5. Content Placeholders

Use `SkeletonLoader`:

```tsx
<SkeletonCard />
```

### Loading State Best Practices

1. **Always provide feedback**: Show loading state for any action that takes > 300ms
2. **Progressive loading**: Show skeleton loaders while content loads
3. **Informative messages**: Tell users what's happening ("Loading employees..." not just "Loading...")
4. **Timeout handling**: Show helpful message if loading takes too long
5. **Error states**: Provide clear error messages with recovery options

## Accessibility

### WCAG 2.1 AA Compliance

#### 1. Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order

```tsx
<Button className="focus-accessible">Click Me</Button>
```

#### 2. Skip Links

```tsx
<SkipLinks
  targets={[
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'main-navigation', label: 'Skip to navigation' },
  ]}
/>
```

#### 3. ARIA Labels

Always provide ARIA labels for:

- Loading states: `aria-label="Loading"` and `role="status"`
- Icon-only buttons: `aria-label="Close"`
- Complex interactions: `aria-live="polite"`

#### 4. Color Contrast

- Text: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

#### 5. Focus Management

```tsx
// Focus main content on route change
<FocusAnchor id="main-content" label="Main content" />
```

### Screen Reader Testing

Test with:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

## Browser Support

### Fully Supported

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement

- Chrome 80-89: Core features work, some animations may be simplified
- Firefox 78-87: Full support with minor visual differences
- Safari 12-13: Core features work, some advanced CSS features may degrade

### Not Supported

- Internet Explorer (all versions)
- Chrome < 80
- Firefox < 78
- Safari < 12

### Feature Detection

The app uses progressive enhancement:

- Core content loads without JavaScript
- Enhanced UI requires JavaScript
- Advanced features (container queries, backdrop-filter) degrade gracefully

## CSS Architecture

### Utility-First with Tailwind

- Use Tailwind utilities for most styling
- Custom components in `@layer components`
- Avoid inline styles except for dynamic values

### Component Classes

Define reusable component classes in `index.css`:

```css
@layer components {
  .btn {
    @apply rounded-lg px-4 py-2 font-medium transition-all;
  }
}
```

### Custom Properties

Use CSS custom properties for themeable values:

```css
:root {
  --color-primary: #3b82f6;
  --color-accent: #d946ef;
}
```

## Animation Guidelines

### Performance

- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly

### Duration

- **Micro-interactions**: 150-200ms (hover, focus)
- **UI transitions**: 300-400ms (page transitions, modals)
- **Content animations**: 500-800ms (entrance animations)

### Easing

- `ease-in-out`: General purpose
- `ease-out`: Entrances
- `ease-in`: Exits
- `linear`: Continuous animations (spinners)

### Prefers-Reduced-Motion

Always respect user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing

### Visual Regression Testing

- Test on multiple viewports: 375px, 768px, 1024px, 1920px
- Test light and dark modes
- Test all interactive states (hover, focus, active, disabled)

### Accessibility Testing

- Keyboard navigation
- Screen reader announcements
- Color contrast
- Focus visibility

### Performance Testing

- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [React Documentation](https://react.dev/)

## Contributing

When adding new components:

1. Follow existing patterns and naming conventions
2. Ensure responsive behavior on all viewports
3. Add accessibility features (ARIA labels, keyboard support)
4. Write comprehensive tests
5. Document usage in this guide
6. Update the UI Showcase page

## Questions?

For questions about the design system, open an issue or contact the design team.
