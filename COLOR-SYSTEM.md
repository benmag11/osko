# Color System Documentation

## Overview
This project uses a warm color palette defined in `tailwind.config.ts` as the single source of truth for all color values.

## Color Architecture

### 1. Static Tailwind Colors (Primary System)
Located in `tailwind.config.ts`, these are compile-time optimized colors used throughout the application:

#### Warm Backgrounds
- `cream-50`: #FFFEFB - Lightest cream, main background
- `cream-100`: #FFFEFD - Light cream, cards and modals
- `cream-200`: #FFFDF8 - Medium cream, hover states
- `cream-300`: #FFF9F0 - Darker cream, active states

#### Accent Colors
- `salmon-400`: #E59C84 - Light salmon
- `salmon-500`: #D97757 - Primary CTA color
- `salmon-600`: #C2410C - Dark salmon, pressed states
- `coral-400`: #FB923C - Light coral, secondary accent
- `coral-500`: #EA580C - Dark coral

#### Text Colors
- `warm-text-primary`: #1A1A1A - Main text
- `warm-text-secondary`: #4A4A4A - Secondary text
- `warm-text-muted`: #6B6B6B - Muted text
- `warm-text-subtle`: #9A9A9A - Subtle text

#### Neutral Colors (Stone)
- `stone-100` through `stone-800`: Neutral grays with warm undertones

### 2. CSS Variables (For shadcn/ui Components)
Located in `src/app/globals.css`, these support shadcn/ui components and potential theming:

```css
--primary: 13 63% 60%;        /* Maps to salmon-500 */
--background: 60 67% 99%;      /* Maps to cream-50 */
--foreground: 19 20% 21%;      /* Maps to warm-text-primary */
```

## Usage Guidelines

### Use Static Classes for Custom Components
```tsx
// ✅ Preferred for performance
<div className="bg-cream-50 text-warm-text-primary">
<button className="bg-salmon-500 hover:bg-salmon-600">
```

### CSS Variables for shadcn/ui Components
```tsx
// ✅ Required for shadcn/ui components
<Button variant="default">  // Uses var(--primary) internally
<Card>                      // Uses var(--card) internally
```

### Typography
- **Headings**: Use `font-serif` (Source Serif Pro)
- **Body text**: Use `font-sans` (Source Sans Pro)
- **Code**: Use `font-mono` (JetBrains Mono)

## Color Semantics

### Interactive Elements
- **Primary actions**: `salmon-500` (hover: `salmon-600`)
- **Secondary actions**: `coral-500` (hover: `coral-400`)
- **Borders**: `stone-200` or `stone-300`
- **Focus rings**: `salmon-500/30` (30% opacity)

### States
- **Default**: Base colors
- **Hover**: Lighter/darker shade or `cream-200` for backgrounds
- **Active/Pressed**: Darker shade
- **Disabled**: 50% opacity

### Feedback
- **Error/Warning**: `salmon-600`
- **Success**: `coral-500`
- **Info**: `warm-text-muted`

## Performance Notes

- Static Tailwind classes are compiled at build time (faster)
- CSS variables are resolved at runtime (slower, but needed for shadcn/ui)
- The app primarily uses static classes for optimal performance
- Only ~57 uses of CSS variables vs ~134 uses of static classes

## Maintenance

To add new colors:
1. Add them to `tailwind.config.ts` in the appropriate section
2. If needed for theming, also add to `globals.css` as CSS variables
3. Restart the dev server for changes to take effect
4. Use static classes wherever possible for best performance