# Design Guidelines & UI/UX Standards

This document outlines the core design principles, color palettes, and component standards for the Marketing System.

## 1. Core Principles

- **Unified UI Folder**: All core reusable components are centralized in the `UI/` folder at the project root.
- **High-Density ERP**: Prioritize information visibility using compact layouts and minimal spacing without sacrificing clarity.
- **Visual Excellence**: Premium aesthetics achieved through subtle gradients, backdrop blurs (`backdrop-blur-sm`), and consistent micro-interactions.
- **Modular Atomicity**: Components are broken down into their smallest functional parts to ensure high reusability and maintainability.
- **Dynamic Interaction**: All interactive elements feature smooth transitions (`duration-200`) and subtle scaling effects (`active:scale-[0.98]`).

## 2. Color Palette

The system uses a sophisticated palette based on **Indigo** and **Slate**, providing a professional yet modern look.

### Primary Colors
- **Main**: `bg-indigo-600` (#4F46E5) - Primary actions, active states.
- **Hover**: `bg-indigo-700` (#4338CA) - Hover states for primary buttons.
- **Glow**: `shadow-indigo-500/20` - Subtle elevation for primary elements.

### Neutral Colors
- **Slate 900**: Primary text, dark backgrounds.
- **Slate 600**: Secondary text, descriptive labels.
- **Slate 400**: Tertiary text, placeholders, icons.
- **Slate 200**: Borders, separators.
- **Slate 100/50**: Subtle backgrounds, zebra striping, card hover states.

### Semantic Colors
- **Success**: Emerald (`bg-emerald-50`, `text-emerald-700`) - Positive actions, status indicators.
- **Warning**: Amber (`bg-amber-50`, `text-amber-700`) - Cautionary alerts, pending states.
- **Danger**: Rose (`bg-rose-50`, `text-rose-700`) - Destructive actions, error states.
- **Info**: Blue/Indigo (`bg-indigo-50`, `text-indigo-700`) - General information.

## 3. Typography

Standardized font weights and casing ensure professional consistency.

- **Headings**: `font-black` (900), `uppercase`, `tracking-tight`.
- **Labels**: `font-black` (900), `uppercase`, `tracking-widest`, `text-[11px]`.
- **Body Text**: `font-semibold` (600), `text-sm`, `text-slate-600`.
- **Status Text**: `font-black` (900), `uppercase`, `tracking-widest`, `text-[9px]`.

## 4. UI Library Structure

All core UI components are located in the `UI/` directory and exported via `UI/index.ts`.

### Layout Tokens:
- **Borders**: `border-slate-200` (standard), `border-slate-100` (subtle).
- **Radii**: `rounded-xl` (inputs/buttons), `rounded-2xl` (cards/containers), `rounded-3xl` (modals).
- **Shadows**: `shadow-sm` (flat elevation), `shadow-2xl` (overlays).

### Key Components:
- **DataTable**: Granular structure for maximum field control.
- **Breadcrumb**: Navigation aid following the `font-black uppercase` style.
- **SearchBar**: High-performance search with integrated feedback.
- **Notification**: Standardized toast/alert system.
- **Card**: Sectioned containers with subtle hover elevation.

### Component Design Tokens:

| Component | Primary Colors | Typography | Special Notes |
|-----------|----------------|------------|---------------|
| **Button** | Indigo-600 (Main), Rose-600 (Danger) | Bold | Dynamic scale on click |
| **Input** | Slate-200 (Border), Indigo-500 (Focus) | Semibold | Rounded-xl (Compact) |
| **Badge** | Emerald/Amber/Rose-50 (Semantic) | Black, Uppercase | Pill-shaped, tracked (9px) |
| **Table** | Slate-50 (Header), Slate-100 (Cell) | Black (Header) | Granular structure |
| **Card** | Slate-200 (Border) | Black (Title) | Subtle shadow on hover |
| **Breadcrumb**| Slate-500, Indigo-500 (Hover) | Black, Uppercase | Separated by ChevronRight |
| **SearchBar** | Slate-200, Indigo-500 (Focus) | Semibold | Rounded-2xl |

## 5. Usage Best Practices

1. **Information Density**: Use `UI/Table` for large datasets and avoid excessive vertical padding.
2. **Action Prominence**: Reserve `Button` variant `primary` for the single most important action on a page.
3. **Contextual Help**: Use `Tooltip` for icon-only buttons to maintain accessibility.
4. **Feedback**: Always provide `Skeleton` or loading indicators during async operations.

## 6. UX Patterns & Accessibility

### Interaction Feedback
- **Active States**: All buttons and interactive cards must use `active:scale-[0.98]` to provide tactile feedback.
- **Loading States**: Buttons should switch to an `isLoading` state (showing a spinner) during data submission to prevent double-clicks.

### Accessibility Standards
- **Semantic HTML**: Always use appropriate tags (e.g., `<nav>` for Breadcrumbs, `<header>` for Card headers).
- **Focus Management**: Focus rings are standardized to `focus:ring-indigo-500/20` for high visibility without being intrusive.
- **ARIA Labels**: Use `aria-label` on navigation elements and icon-only buttons.
- **Color Contrast**: All primary text uses `text-slate-900` or `text-slate-600` on white backgrounds to ensure WCAG compliance.
