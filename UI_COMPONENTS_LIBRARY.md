# 💎 AP | S&M Module - UI Components Library

This document contains the source code and design prompts for the key UI components used in the **au-marketing-fe** project. These components follow the **High-Density ERP** design system, prioritizing efficiency, visual excellence, and smooth animations.

### 📦 Essential Dependencies
To use these components, ensure the following are installed:
- `framer-motion`, `lucide-react`, `zustand`, `date-fns`, `cmdk`, `@radix-ui/react-popover`, `@radix-ui/react-dialog`, `class-variance-authority`

---

## 📅 Premium Calendar System (Shadcn-style)
**Design:** *A full-featured, interactive calendar with month/year pickers and keyboard-friendly search. Uses Zustand for localized state management.*

**Key Features:**
- **Smooth Animations**: Uses `framer-motion` for popovers and dialogs.
- **Click-to-Add**: Supports `onDateClick` for rapid data entry.
- **High-Density**: Compact design with bold uppercase headers and subtle hover states.

```tsx
// components/ui/calendar.tsx (Core exports: CalendarProvider, CalendarHeader, CalendarBody, CalendarItem)
// Zustand state: useCalendar() hook for month/year navigation.
```

---

## 🔍 Command & Pickers (Animated)
**Design:** *Fuzzy-search enabled pickers for month/year selection. Built on cmdk and Radix UI.*

```tsx
// components/ui/popover.tsx (with smooth motion.div wrapper)
// components/ui/command.tsx (fuzzy-search logic)
```

---

## 🏗️ Dialog / Modal (Motion Enhanced)
**Design:** *Radix UI based overlays with backdrop blur and springy entrance animations.*

```tsx
// components/ui/dialog.tsx
// Style: rounded-2xl, shadow-2xl, bg-black/40 backdrop
```

---

## 🔘 SegmentToggle
**Design:** *A premium segmented control with a sliding selector animation.*

```tsx
// components/ui/SegmentToggle.tsx
// Variants: 'indigo', 'slate'
```

---

## 🌊 WaveLoader
**Design:** *A themed bouncing dots animation for localized loading states.*

```tsx
// components/ui/WaveLoader.tsx
// Props: messagePlacement (bottom | right | left), message (optional string)
```

---

## 🔘 Universal Button
**Design:** *A unified button component merging shadcn standards with premium icons/loading states.*

```tsx
// components/ui/Button.tsx
// Variants: primary, destructive, outline, ghost, link
// Sizes: xs, sm, md, lg, icon
```

---

## ⏳ Loader (Circular)
**Design:** *Clean, spinning loader for data fetching overlays.*

```tsx
// (Used as a standalone Component or via Button's isLoading prop)
```

---

## 🔍 SearchInput (Capsule Design)
**Design:** *A premium search component with a capsule shape, automatic clear button, and smooth focus animations. Replaces legacy inputs for all search-related interactions.*

**Key Features:**
- **Capsule Shape**: `rounded-full` for a modern, distinct search look.
- **Auto-Clear**: Built-in `onClear` functionality with a smooth hover effect.
- **Enhanced Focus**: Indigo focus rings and shadow-sm depth.

```tsx
// components/ui/SearchInput.tsx
// Props: value, onChange, onClear, placeholder, containerClassName
```

---

## 🔼 Select & AsyncSelect (Motion Driven)
**Design:** *High-density ERP select components with smooth dropdown transitions using Framer Motion. Supports fuzzy search and remote data loading.*

**Key Features:**
- **Smooth Transitions**: `AnimatePresence` and `motion` for dropdown exposure.
- **Integrated Search**: Internal `SearchInput`-style bar for searchable options.
- **Premium Depth**: `shadow-2xl` and `rounded-xl` for the dropdown menu.

```tsx
// components/ui/Select.tsx (Static options)
// components/ui/AsyncSelect.tsx (Remote data with loadOptions)
```

---

---

## 🏗️ DataTable (High-Density)
**Design:** *A streamlined, high-performance table designed for heavy data loads. Prioritizes stability and readability over manual customization.*

**Key Features:**
- **Simplified Layout**: Fixed-width columns for predictable horizontal alignment.
- **Advanced Sorting**: Integrated visual feedback with `Chevron` icons and smooth hover highlights.
- **Zebra Striping**: Subtle `slate-50/10` striping for better row isolation.
- **Custom Renderers**: Supports granular cell control for badges, icons, and action groups.

```tsx
// components/ui/DataTable.tsx
// Props: data, columns, rowKey, onRowClick, sortConfig, onSort, dense, showVerticalLines
```

---

## 💊 Tooltip (Vercel-Inspired)
**Design:** *A minimalist, light-themed tooltip system following the latest modern web standards. Built with Radix UI for accessibility and performance.*

**Key Features:**
- **Clean Aesthetic**: White background (`bg-white`) with a subtle `slate-200` border.
- **Refined Typography**: `font-medium text-xs` in standard casing for a balanced, modern look.
- **Smooth Presence**: `AnimatePresence` and Radix `Portal` for flicker-free overlays.
- **Integrated Arrow**: Crisp white triangular pointers with matching borders.

```tsx
// components/ui/Tooltip.tsx
// Usage: Wrapper component `<Tooltip content="Label">{children}</Tooltip>`
```

---

## 🎨 Design Tokens (Cheat Sheet)
- **Primary**: `indigo-600` (#4f46e5)
- **Secondary**: `slate-500` (Main), `slate-400` (Tertiary)
- **Radius**:
  - `rounded-lg`: Tooltips and Standard Buttons.
  - `rounded-xl`: Inputs, Cards, and Dropdowns.
  - `rounded-2xl`: Modals and Popovers.
  - `rounded-full`: Capsule Search Inputs and Status Badges.
- **Shadows**:
  - `shadow-sm`: Trigger/Inputs.
  - `shadow-md`: Hover states.
  - `shadow-lg`: Tooltips.
  - `shadow-2xl`: Overlay systems (Modals/Dropdowns).
- **Typography**: 
  - **Headers**: `font-black text-[11px] uppercase tracking-widest`.
  - **Captions**: `font-medium text-xs` (Tooltips/Secondary Info).
