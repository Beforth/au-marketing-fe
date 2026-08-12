# Design System

> Reference for generating UI consistent with this codebase.
> **All values in this document were re-verified against live component source on 2026-08-12.**
> Where a value is copied from a component, the file is named. If you need a value that
> isn't here, read the `.tsx` — do not infer it from a similar component.

---

## 0. How this codebase is actually styled (read first)

There is **no Tailwind build**. Despite `tailwindcss@3.4.17` sitting in `package.json`:

- There is **no `tailwind.config.js`** anywhere in the repo.
- There is **no PostCSS pipeline and no `.css` entry file**.
- `index.html` loads `<script src="https://cdn.tailwindcss.com"></script>`, which runs
  Tailwind's JIT engine in the browser against **stock Tailwind 3 defaults**.
- Every global rule — CSS variables, scrollbars, keyframes — lives in a single inline
  `<style>` block in `index.html`. **That block is the only place to change theme-level CSS.**

Consequences you must respect:

- Any class that depends on a config (`ring-ring`, `ring-offset-background`, `shadow-xs`,
  `bg-background`) **resolves to nothing**. Several components carry these; see §5.
- Adding a `tailwind.config.js` would re-theme the entire app. Don't, without discussion.

### Two component directories

`components/ui/` and `UI/` contain **different components with the same filenames**.
Verified import counts:

| Component | `components/ui/` | `UI/` | Use |
| --- | --- | --- | --- |
| Button | 33 | 0 | `components/ui/` |
| Card | 31 | 0 | `components/ui/` |
| Input | 24 | 0 | `components/ui/` |
| Select | 19 | 0 | `components/ui/` |
| DatePicker | 14 | 0 | `components/ui/` |
| Badge / Modal | 12 each | 0 | `components/ui/` |
| Pagination | 10 | 0 | `components/ui/` |
| SegmentToggle | 7 | 0 | `components/ui/` |
| **Tooltip** | 0 | **19** | **`UI/`** |
| **Switch** | 0 | **1** | **`UI/`** |

**Rule: import from `components/ui/` for everything except `Tooltip` and `Switch`.**
The rest of `UI/` is dead code — its values do not match what renders.

`StatCard` does **not exist** in this repo. Earlier revisions of this document and of
`UI_COMPONENTS_LIBRARY.md` specified one. Use the KPI card patterns in §6 instead.

> `UI_COMPONENTS_LIBRARY.md` is **stale** and contradicts the code in many places
> (it documents `font-black`, which has zero occurrences). Prefer this file; prefer
> the source over both.

---

## 1. Core Philosophy

A **professional, data-dense internal tool** with a restrained Slate/Blue palette.
Neutral greys dominate surfaces; Blue is the interactive/brand accent.
Tone is **utilitarian-premium**.

Typography is mostly sentence-case, with one deliberate exception: a **tiny uppercase
micro-label** (9–11px, bold, wide tracking) used for section headers, table headers,
and dense metadata. See §3.

Motion is restrained — CSS transitions, hover lifts, and a few custom keyframes. Note
that many `animate-*` classes in the codebase are inert; see §11.

---

## 2. Colors (Tailwind classes only)

### Primary / Brand

| Class | Hex | Usage |
| --- | --- | --- |
| `blue-600` | `#2563eb` | Buttons, active nav, switch-on, focus border, active tab |
| `blue-700` | `#1d4ed8` | Hover on blue-600; active nav text |
| `blue-50` | `#eff6ff` | Muted bg for active/hover, selected option, role badges |
| `blue-100` | `#dbeafe` | Borders for blue-tinted elements, nested nav rail |
| `blue-500/10` | — | Input focus ring (`ring-2`), SearchInput focus ring (`ring-4`) |
| `blue-500/20` | — | DatePicker trigger focus ring (`ring-2`), selected-day shadow |
| `blue-500` | `#3b82f6` | Full-opacity focus ring on Select trigger |

### Neutral (Slate scale)

| Class | Hex | Usage |
| --- | --- | --- |
| `slate-900` | `#0f172a` | Primary text, headings, secondary button bg |
| `slate-800` | `#1e293b` | Secondary button hover, item titles, tooltip text |
| `slate-700` | `#334155` | Field labels, outline button text |
| `slate-600` | `#475569` | Table cells + table headers, nav items |
| `slate-500` | `#64748b` | Secondary text, ghost button text, icons |
| `slate-400` | `#94a3b8` | Placeholders, disabled text, card descriptions, empty state |
| `slate-300` | `#cbd5e1` | Global scrollbar thumb, Select/Input borders, sort chevrons |
| `slate-200` | `#e2e8f0` | Borders, dividers, `.customize-scrollbar` thumb, skeleton |
| `slate-100` | `#f1f5f9` | Hover bg, row dividers, skeleton |
| `slate-50` | `#f8fafc` | Page background, card header border, Input default bg |

Note: borders are **not** uniformly `slate-200`. `Input` and `Card` use `slate-200`;
`Select` and `DatePicker` triggers use `slate-300`. This is a real inconsistency in the
codebase, not a documentation error.

### Semantic

| Class | Hex | Usage |
| --- | --- | --- |
| `emerald-50` | `#ecfdf5` | Success toast/badge bg |
| `emerald-100` | `#d1fae5` | Success toast/badge border |
| `emerald-500` | `#10b981` | Success icon |
| `emerald-600` | `#059669` | Positive trend text, "Now" button |
| `emerald-700` | `#047857` | Success badge text |
| `amber-50` | `#fffbeb` | Warning badge bg |
| `amber-100` | `#fef3c7` | Warning badge border |
| `amber-500` | `#f59e0b` | Warning icon, pending count |
| `amber-700` | `#b45309` | Warning badge text |
| `rose-50` | `#fff1f2` | Error field bg, error toast/badge bg |
| `rose-100` | `#ffe4e6` | Error toast/badge border |
| `rose-300` | `#fda4af` | Error field border (Input, Select, DatePicker) |
| `rose-500` | `#f43f5e` | Error icon, error helper text, destructive hover |
| `rose-600` | `#e11d48` | Danger button bg |
| `red-500` | `#ef4444` | Required-field asterisk (`Select`) |
| `violet-*` | — | "Won / Deals" gradient KPI accent |

### Dashboard Chart Palette

| Index | Color | Hex | Usage |
| --- | --- | --- | --- |
| 1 | Blue | `#3b82f6` | Primary chart series |
| 2 | Emerald | `#10b981` | Revenue, won, positive |
| 3 | Amber | `#f59e0b` | Conversions, pending (not rose/red) |
| 4 | Red | `#ef4444` | Lost, negatives |
| 5 | Violet | `#8b5cf6` | Premium / won alternate |
| 6 | Cyan | `#06b6d4` | Informational series |
| 7 | Orange | `#f97316` | Urgent / warning series |

Each palette entry includes gradient fill colors (`stroke`, `start`, `end`) — defined in
`CHART_COLOR_PALETTES` in `DashboardPage.tsx`. Unified across `getCardIcon`, the
`number-card` gradient, and standalone KPI cards.

### Surface

| Value | Usage |
| --- | --- |
| `bg-white` | Cards, modals, sidebar, dropdowns, Select/DatePicker triggers |
| `bg-slate-50` | Page background; also `Input`'s **default** (`slate`) variant bg |
| `bg-white/5 backdrop-blur-md` | Navbar glass effect |

### Global CSS variables (`index.html`)

```
--primary:#2563eb   --primary-hover:#1d4ed8   --primary-muted:rgba(37,99,235,.08)
--background:#f8fafc   --card:#ffffff   --border:#e2e8f0
--zinc-900:#0f172a   --zinc-500:#64748b
--ui-padding:2rem   --ui-gap:1.5rem   --ui-scale (density control, scales body font-size)
```

---

## 3. Typography

### Font

`font-family: 'Outfit', sans-serif` — set on `body` in `index.html` (weights 300–900).
`Inter` (400–700) is loaded as a secondary fallback.

### Size Scale

| Class | px | Usage |
| --- | --- | --- |
| `text-[9px]` | 9 | `xxs` button |
| `text-[10px]` | 10 | Sidebar section headers, `xs` button, DatePicker day names, badges on nav |
| `text-[11px]` | 11 | Table headers, tooltip text, card description, Input error text, sidebar meta |
| `text-[12px]` | 12 | Sidebar profile name |
| `text-[13px]` | 13 | Sidebar nav items, SearchInput (md) |
| `text-xs` | 12 | Field labels, pagination, small UI text, secondary info |
| `text-sm` | 14 | Body text, table cells, dropdown options, toast message |
| `text-base` | 16 | Compact KPI values, card title, `lg` button |
| `text-lg` | 18 | Sidebar wordmark |
| `text-xl` | 20 | KPI card values |
| `text-4xl` | 36 | Page title (h1) |

**Arbitrary pixel sizes are a real, load-bearing part of this design** — there are
~280 occurrences of `text-[9px]` / `text-[10px]` / `text-[11px]`. Do not "normalize"
them to the standard scale; it visibly changes information density.

The `Modal` title has **no size class** — it inherits `1rem` from the body.

### Weights

| Class | Weight | Usage |
| --- | --- | --- |
| `font-medium` | 500 | Body, input text, card description, breadcrumb active, pagination |
| `font-semibold` | 600 | Field labels, table headers, nav items, toast message, tooltip text |
| `font-bold` | 700 | Page title, modal title, all button labels, KPI values, micro-labels |

`font-black` (900) is **not used** — zero occurrences.

### Letter Spacing

| Class | Value | Usage |
| --- | --- | --- |
| `tracking-tight` | -0.025em | Page title (h1), sidebar wordmark |
| `tracking-wider` | 0.05em | Table headers (uppercase) |
| `tracking-widest` | 0.1em | Micro-labels — sidebar section headers, `xs`/`xxs` buttons, SegmentToggle labels, DatePicker "Time" label (~70 occurrences) |

### The micro-label pattern

The signature small-text treatment. Three variants in use:

```
Sidebar section header:   text-[10px] font-bold text-slate-400 uppercase tracking-widest
Button xs:                text-[10px] font-bold uppercase tracking-widest
SegmentToggle label:      text-[11px] font-bold uppercase tracking-widest
Table header:             text-[11px] font-semibold text-slate-600 uppercase tracking-wider
```

### Common Text Patterns

```
Page title (h1):          text-4xl font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap
Page description:         text-sm text-slate-500 font-medium
Card title:               text-base font-semibold text-slate-900
Card description:         text-[11px] text-slate-400 font-medium mt-0.5
Modal title:              font-bold text-slate-900            (no size class — 16px)
Field label:              text-xs font-semibold text-slate-700 ml-0.5
Field error text:         text-[11px] text-rose-500 font-medium ml-0.5
Body / item text:         text-sm font-semibold text-slate-800
Secondary info:           text-xs text-slate-500
Empty state text:         text-sm text-slate-400
Table header:             text-[11px] font-semibold text-slate-600 uppercase tracking-wider
Table cell:               text-sm text-slate-600
Tooltip text:             text-[11px] font-semibold text-slate-800
Toast message:            text-sm font-semibold text-slate-800
KPI card label:           text-xs font-semibold text-slate-500
KPI card value:           text-base font-bold text-slate-900   (compact)
                          text-xl font-bold text-slate-900     (regular)
Pagination text:          text-xs font-medium text-slate-500 / text-slate-600
"View All" link:          text-sm font-bold text-blue-600
```

The **field label** is `text-xs font-semibold text-slate-700 ml-0.5` across `Input`,
`Select`, and `DatePicker` — they agree. Use that, not a `text-sm` variant.

---

## 4. Spacing & Layout

### Layout Structure

```
Sidebar:            w-60 (240px), fixed left-0 top-0, h-screen, z-30
Navbar:             h-16 (64px), sticky top-0, ml-60, px-16, z-40
Content wrapper:    ml-60 px-16 pt-[1.5625rem] pb-[0.625rem]   ← DashboardLayout, not PageLayout
PageLayout:         w-full flex flex-col gap-2
PageLayout header:  flex flex-col gap-0.5 mb-3 px-1; title/description block uses gap-1
```

The navbar's bottom rule is **not a border** — it's an absolutely positioned
`h-px bg-slate-200/50` div inset `left-16 right-16`, so it stops short of the page edges.

### Grid Background (`DashboardLayout`)

```
absolute inset-0 pointer-events-none -z-10 opacity-30
bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]
```

### Common Spacing

```
Filters card inner:     flex flex-wrap items-end gap-3
Filter label:           text-xs font-semibold text-slate-700 ml-0.5
Filter buttons gap:     gap-1.5

Card content padding:   p-6  (omitted entirely when noPadding — the consumer adds its own,
                              conventionally p-4)
Card header:            px-6 py-5 border-b border-slate-50 min-h-[72px]
KPI card compact:       px-3 py-2.5

Grid gaps:              gap-4 (side-by-side cards)
                        gap-6 (between major rows)
                        gap-3 (inline filter items)

Form control heights:   sm h-9 / md h-10 / lg h-12    (Input, Select, DatePicker)
Button heights:         xxs h-7 / xs h-8 / sm h-9 / md h-10 / lg h-12
```

**There is no `h-11` control in this codebase.** Earlier revisions of this document
specified `h-11 rounded-xl` for inputs; the real controls are `h-10 rounded-lg` at
default size.

---

## 5. Components

### Card — `components/ui/Card.tsx`

```
Base:     h-full bg-white border border-slate-200/50 flex flex-col min-h-[140px]
          relative group/card
          transition-[box-shadow,border-color,background-color] duration-200
          shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)]
Radius:   style={{ borderRadius: '1.25rem' }}   ← inline style, NOT a class
Clickable: cursor-pointer hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]
           hover:border-blue-200/50 hover:-translate-y-1
Draggable: cursor-move active:scale-[0.98] active:rotate-[0.5deg]

Header:      px-6 py-5 flex justify-between items-center border-b border-slate-50 min-h-[72px]
Title:       text-base font-semibold text-slate-900
Description: text-[11px] text-slate-400 font-medium mt-0.5
Header actions: opacity-0 group-hover/card:opacity-100 transition-opacity
Content:     flex-1 group/content relative, plus p-6 unless noPadding
```

The 1.25rem radius is an inline style because no Tailwind class matches it —
`rounded-2xl` is 1rem and will not look the same.

### Button — `components/ui/Button.tsx`

A shadcn-style component built on `cva` + Radix `Slot` (supports `asChild`).

```
Base: inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm
      font-medium ring-offset-background transition-colors focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50

Variants:
  default / primary  bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-blue-500/20
  destructive/danger bg-rose-600 text-white hover:bg-rose-700 shadow-sm
  outline            border border-slate-200 bg-white text-slate-700 hover:bg-slate-50
                     hover:border-slate-300 shadow-xs
  secondary          bg-slate-900 text-white hover:bg-slate-800 shadow-sm
  ghost              text-slate-500 hover:bg-slate-100 hover:text-slate-900
  link               text-blue-600 hover:underline font-semibold p-0 h-auto

Sizes:
  default  h-10 px-5 text-sm rounded-lg font-bold
  xxs      h-7 px-2 text-[9px] rounded-md uppercase tracking-widest font-bold
  xs       h-8 px-3 text-[10px] rounded-lg uppercase tracking-widest font-bold
  sm       h-9 px-4 text-xs rounded-lg font-bold
  md       h-10 px-5 text-sm rounded-lg font-bold
  lg       h-12 px-8 text-base rounded-xl font-bold
  icon     h-10 w-10

Loading:  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
Icons:    left "mr-2 opacity-90", right "ml-2 opacity-90"
```

Three things to know:

- **No variant has `active:scale-[0.98]`.** Buttons do not scale on click. (The dead
  `UI/Button.tsx` does have it — that's where the old claim came from.)
- The transition is `transition-colors`, not `transition-all duration-200`.
- ⚠️ `ring-offset-background`, `focus-visible:ring-ring`, and `shadow-xs` require a
  Tailwind config to be defined. There is none, so **buttons currently render no visible
  focus ring** — a real keyboard-accessibility gap worth fixing deliberately.

### Input — `components/ui/Input.tsx`

```
Container: space-y-1.5 w-full font-sans
Label:     text-xs font-semibold text-slate-700 ml-0.5
Base:      w-full border rounded-lg outline-none transition-all
           placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600

Variants:
  slate (default)  bg-slate-50 border-slate-200 focus:bg-white
  white            bg-white border-slate-200 shadow-sm focus:shadow-md
  ghost            bg-transparent border-transparent hover:bg-slate-50
                   focus:bg-white focus:border-slate-200

Sizes:  sm h-9 px-3 text-xs | md h-10 px-4 text-sm font-medium | lg h-12 px-5 text-base font-medium
Icon:   absolute left-3.5, text-slate-400, group-focus-within/input:text-blue-600; input gains pl-10
Clear:  absolute right-2, p-1 hover:bg-slate-100 rounded-md text-slate-400; input gains pr-12
Error:  field → border-rose-300 bg-rose-50
        text  → text-[11px] text-rose-500 font-medium ml-0.5
```

Note the **default variant has a `slate-50` background**, not white.

### Select — `components/ui/Select.tsx`

A custom portal-rendered combobox — **not** a native `<select>`. Supports search,
clear, create, and a `isCombobox` free-text mode.

```
Container: space-y-1.5 w-full relative
Label:     text-xs font-semibold text-slate-700 ml-0.5   (required → <span class="text-red-500 ml-1">*</span>)

Trigger:   w-full border rounded-lg text-left transition-all shadow-sm
           focus:outline-none focus:ring-2 focus:ring-blue-500
           bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/30 font-medium
           flex items-center justify-between gap-2
Sizes:     sm h-9 px-3 text-xs | md h-10 px-4 text-sm font-medium | lg h-12 px-5 text-base font-medium
Placeholder span: text-slate-400 font-normal
Chevron:   ChevronDown size={16} text-slate-400 transition-transform, rotate-180 when open
Clear:     X size={14} in p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600
Disabled:  bg-slate-50 cursor-not-allowed opacity-50
Error:     border-rose-300 bg-rose-50 (combobox also placeholder:text-rose-400)

Dropdown (portal): fixed z-[99999] bg-white border border-slate-200 rounded-xl shadow-2xl
                   overflow-hidden flex flex-col
Option:            w-[calc(100%-8px)] mx-1 px-3 py-2 text-sm text-left rounded-lg mb-0.5
                   flex items-center justify-between transition-colors
  selected:        bg-blue-50 text-blue-700 font-bold
  unselected:      hover:bg-slate-50 text-slate-600
```

The trigger's focus ring is **full-opacity `blue-500`**, unlike `Input`'s `blue-500/10`.
The dropdown flips upward automatically when there's under 250px below.

### DatePicker — `components/ui/DatePicker.tsx`

```
Label:    text-xs font-semibold text-slate-700 ml-0.5
Trigger:  w-full border rounded-lg text-left transition-all
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
Sizes:    sm h-9 px-3 text-xs | md h-10 px-4 text-sm font-medium | lg h-12 px-5 text-base font-medium
Clear:    p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500

Popover:  fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl p-2.5
          shadow-blue-100/20 animate-spring-in
Month:    text-xs font-bold text-slate-900 leading-none
Year btn: text-[11px] font-medium; open → bg-blue-600 text-white
Nav btns: p-1 hover:bg-slate-100 rounded-lg text-slate-600, ChevronLeft/Right size={16}
Day name: text-center text-[10px] font-bold text-slate-400 uppercase py-0.5
Day cell: aspect-square flex items-center justify-center text-xs rounded-lg transition-all
  other month: text-slate-300
  normal:      text-slate-700 hover:bg-blue-50 hover:text-blue-600
  selected:    bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20
  today:       text-blue-600 font-bold + a 1×1 blue-600 dot at bottom-1
  disabled:    text-slate-200 cursor-not-allowed
Year grid:   py-1.5 text-xs rounded-lg; active = bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20
Time label:  text-[10px] font-bold text-slate-500 uppercase tracking-widest
Time select: w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-xs px-2
             focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400
Footer:  Today  → text-xs font-semibold text-blue-600 hover:underline
         Now    → text-xs font-semibold text-emerald-600 hover:underline
         Clear  → text-xs font-semibold text-slate-400 hover:text-rose-500
         Done   → text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-black
```

This is the one component that uses a real custom keyframe: `animate-spring-in`.

### Badge — `components/ui/Badge.tsx`

```
Base: px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center

default  bg-slate-100 text-slate-800
success  bg-emerald-50 text-emerald-700 border border-emerald-100
warning  bg-amber-50 text-amber-700 border border-amber-100
error    bg-rose-50 text-rose-700 border border-rose-100
outline  border border-slate-200 text-slate-600
```

The danger variant is named `error`, not `danger`. There is **no `info` variant**.
Badges are `font-medium`, not bold, and are **not** uppercase.

### Breadcrumb — `components/ui/Breadcrumb.tsx`

Rendered by `PageLayout` when a `breadcrumbs` prop is passed.

```
Container: flex items-center space-x-2 text-sm text-slate-600 mb-4
Home link: flex items-center hover:text-slate-900 transition-colors, Home size={16} mr-1
Separator: ChevronRight size={16} text-slate-400
Link item: hover:text-slate-900 transition-colors
Last item: text-slate-900 font-medium
```

A "Home" crumb is prepended automatically — callers should not include one.
There is no underline/border treatment on the active crumb.

### Modal — `components/ui/Modal.tsx`

```
Wrapper: fixed inset-0 z-[120] flex items-center justify-center p-4 isolate
Scrim:   absolute inset-0 bg-slate-900/55          ← no backdrop blur
Panel:   relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200
         overflow-visible   (default width max-w-lg via contentClassName)
Header:  px-6 py-4 border-b border-slate-100 flex items-center justify-between
         rounded-t-2xl bg-white
Title:   font-bold text-slate-900
Close:   p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400
Body:    p-6 max-h-[70vh] overflow-y-auto
Footer:  px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3
```

### SearchInput — `components/ui/SearchInput.tsx`

A **pill**, distinct from `Input`.

```
Container: relative group/search flex items-center w-full
Icon:      absolute left-4 (sm: left-3) top-1/2 -translate-y-1/2 text-slate-400
           group-focus-within/search:text-blue-600 transition-colors pointer-events-none z-10
           Search strokeWidth={2.5}, size 16 (md) / 14 (sm)
Input:     w-full bg-white border border-slate-200 rounded-full outline-none transition-all shadow-sm
           md: h-10 pl-11 pr-10 text-[13px] font-medium
           sm: h-9 pl-9 pr-9 text-xs
           placeholder:text-slate-400
           focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:shadow-md
           hover:border-slate-300 hover:bg-slate-50/50
Clear:     absolute right-3 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600
```

Note the **4px** focus ring — wider than the 2px ring used elsewhere.

### SegmentToggle — `components/ui/SegmentToggle.tsx`

```
Track:   bg-slate-100/80 inline-flex items-center p-0 rounded-full border border-slate-200
         shadow-sm relative min-w-[140px]
Segment: relative flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-full
         transition-all z-10 active:scale-[0.98]
  selected:   text-blue-700 font-bold
  unselected: text-slate-500 hover:text-slate-800
Thumb:   absolute inset-x-0 inset-y-[-1px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)]
         border border-slate-200 rounded-full     (animated via framer-motion layoutId)
Label:   relative z-20 flex items-center gap-1.5 text-[11px] font-bold uppercase
         tracking-widest whitespace-nowrap
Icon:    size-3.5
```

### DataTable — `components/ui/DataTable.tsx`

```
Wrapper: relative w-full overflow-auto customize-scrollbar border border-slate-200
         rounded-xl bg-white
Table:   w-full border-separate border-spacing-0 text-sm
Thead:   sticky top-0 z-20
Th:      h-10 px-4 text-left font-semibold text-slate-600 bg-[#F8FAFC] border-b
         border-slate-200 transition-colors relative select-none uppercase
         tracking-wider text-[11px]      (first column adds pl-6)
  sortable: cursor-pointer hover:bg-slate-100/80 hover:text-blue-600
Tbody:   divide-y divide-slate-100 relative
Tr:      group transition-colors
  clickable:     cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50
  non-clickable: hover:bg-slate-50/30
Td:      px-4 py-2.5 text-slate-600 truncate transition-colors   (first column adds pl-6)
Sort:    stacked ChevronUp/ChevronDown size={10} in flex flex-col text-slate-300;
         active direction → text-blue-600
Empty:   py-20 text-center text-slate-400 uppercase tracking-widest text-xs font-bold opacity-30
Spinner: inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin
Overlay: absolute inset-0 bg-white/40 backdrop-blur-[1px] z-30 flex items-center justify-center
```

The header background is the literal `bg-[#F8FAFC]`, not `bg-slate-50`.

### Pagination — `components/ui/Pagination.tsx`

A rows-per-page bar, **not** numbered page buttons.

```
Container: flex flex-wrap items-center justify-between gap-3
Left:      "Rows per page"  text-xs font-medium text-slate-500
           <Select className="w-20" clearable={false} searchable={false} dropdownWidth={100} />
           range readout   text-xs text-slate-500      ("1–25 of 340")
Right:     Button variant="ghost" size="xs" with ChevronLeft/Right size={14}
           "Page N of M"   text-xs font-medium text-slate-600 px-2
```

### Tooltip — `UI/Tooltip.tsx` (Radix)

```
Content: z-[100] px-2.5 py-1.5 overflow-hidden rounded-xl border border-slate-200
         bg-white shadow-lg shadow-slate-100/80
Text:    text-[11px] font-semibold text-slate-800 whitespace-pre-line leading-normal block
Arrow:   fill-white stroke-slate-200 stroke-1, width 8 height 4
sideOffset: 6, delayDuration: 100
```

Light tooltip on white, not a dark chip. Requires `<TooltipProvider>` at the app root
(already mounted in `App.tsx`).

### Toast — `components/ui/Toast.tsx`

```
Base:  fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl
       border shadow-lg
success bg-emerald-50 border-emerald-100   icon CheckCircle text-emerald-500 size={18}
error   bg-rose-50 border-rose-100         icon AlertCircle text-rose-500 size={18}
info    bg-blue-50 border-blue-100         icon Info text-blue-500 size={18}
Message: text-sm font-semibold text-slate-800
Close:   ml-2 p-1 hover:bg-black/5 rounded-lg, X size={14} text-slate-400
```

Solid tinted background — not a translucent/blurred glass panel.

### Sidebar — `components/ui/Sidebar.tsx`

```
Aside:   w-60 h-screen bg-white border-r border-slate-200/60 flex flex-col
         fixed left-0 top-0 z-30
Inner:   p-5 flex flex-col h-full
Brand:   flex items-center gap-2.5 mb-7 px-2 hover:opacity-80 transition-all
         img w-10 h-10 rounded object-contain flex-shrink-0
         text-lg font-bold tracking-tight text-slate-900
Section: px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2
Nav:     space-y-0.5

Nav item base: group flex items-center justify-between w-full rounded-lg text-[13px]
               transition-all duration-200 font-medium px-3 py-2
  inactive: text-slate-600 hover:bg-slate-50 hover:text-slate-900
  active:   bg-blue-50 text-blue-700   (label gains font-semibold)
  icon:     size={18}, strokeWidth 1.8 inactive / 2.2 active
            text-slate-400 group-hover:text-slate-600  →  text-blue-600 when active
  badge:    text-[10px] px-1.5 py-0.5 rounded-md font-bold
            bg-slate-100 text-slate-500  →  bg-blue-600 text-white when active

Nested group children: mt-0.5 ml-3 pl-3 border-l-2 border-blue-100 space-y-0.5
Footer profile: mt-4 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100/80
                bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer
  avatar: w-8 h-8 rounded-lg bg-blue-100 border border-blue-200/50 text-blue-600 text-xs
  name:   text-[12px] font-semibold text-slate-900 truncate
  role:   text-[10px] text-slate-500 font-medium truncate
```

### Navbar — `components/ui/Navbar.tsx`

```
Header:   h-16 sticky top-0 bg-white/5 backdrop-blur-md z-40 ml-60 px-16
          flex items-center justify-between relative transition-all duration-300
Hairline: absolute bottom-0 left-16 right-16 h-px bg-slate-200/50
Pill btn: flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95
  idle: bg-blue-50/50 border-blue-100 text-blue-600 hover:bg-blue-50
  open: bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100
Panel:    absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200
          shadow-2xl rounded-2xl overflow-hidden z-50
Panel hd: px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50
Panel body: max-h-[320px] overflow-y-auto custom-scrollbar
```

---

## 6. KPI / Metric Cards

### Default KPI Card (full size)

```tsx
<Card noPadding>
  <div className="p-4">
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
      <Icon size={14} /> Label
    </div>
    <p className="text-xl font-bold text-slate-900">value</p>
  </div>
</Card>
```

### Compact KPI Card (horizontal, for dashboards/overviews)

```tsx
<Card noPadding className="min-h-0">
  <div className="px-3 py-2.5 flex items-center gap-3">
    <Icon size={18} className="text-{color} shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-slate-500">Label</p>
      <p className="text-base font-bold text-slate-900">value</p>
    </div>
  </div>
</Card>
```

### Gradient KPI Card (`DashboardPage.tsx` number-card widgets)

```
bg-gradient-to-br from-{color}-50/40 to-{color}-100/10
border border-{color}-100/60
hover:from-{color}-50/60 hover:to-{color}-100/20
shadow-sm hover:shadow-md hover:-translate-y-0.5

Inner: flex items-center gap-2.5 w-full p-3 rounded-xl
Label: text-xs font-semibold text-slate-500
Value: text-xl font-bold text-{color}-800 mt-0.5
Icon:  size={18}, no wrapper, color matches accent

Accent by keyword:
  Revenue/Achieved/Sales/Value  → emerald
  Conversion/Rate/Pct/Ratio     → blue
  Hot/Alert/Cases/Urgent        → amber
  Won/Deals                     → violet
  Leads/Count/Team/Size         → blue
  Fallback                      → slate
```

---

## 7. Common Page Layout Patterns

### Standard Page Structure

```tsx
<PageLayout title="Page Title" description="Description text." breadcrumbs={[{ label, href }]}>
  {/* 1. Filters card */}
  <Card className="mb-6">
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 ml-0.5">Period</label>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm">Today</Button>
        </div>
      </div>
    </div>
  </Card>

  {/* 2. KPI row */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <Card noPadding>…</Card>
  </div>

  {/* 3. Side-by-side content */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <Card title="…" description="…">…</Card>
  </div>

  {/* 4. Full-width summary */}
  <Card title="…" description="…" className="mb-6">…</Card>
</PageLayout>
```

### Loading State (Skeleton)

```tsx
<div className="animate-pulse space-y-3">
  <div className="h-16 bg-slate-200 rounded-lg" />
  <div className="h-16 bg-slate-200 rounded-lg" />
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center gap-2 py-6 text-slate-400">
  <Icon size={28} />
  <p className="text-sm">No data message.</p>
</div>
```

### List Items (within cards)

```tsx
<div className="border border-slate-200 rounded-lg p-3">
  <p className="text-sm font-semibold text-slate-800">Title</p>
  <p className="text-xs text-slate-500 mt-1">Description</p>
  <p className="text-xs text-slate-400 mt-1">Meta info</p>
</div>
```

Clickable variant adds:
`cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 transition-colors`

### "View All" Link

```tsx
<button className="w-full py-2 text-sm font-bold text-blue-600
                   hover:text-blue-700 transition-colors text-center">
  View All →
</button>
```

---

## 8. Icon Conventions

`lucide-react` — named imports only.

| Context | Icon | Size |
| --- | --- | --- |
| KPI labels | Per keyword | 14 |
| KPI compact | Per keyword | 18 |
| Sidebar nav | Per page | 18 (stroke 1.8 / 2.2 active) |
| SearchInput | `Search` | 16 md / 14 sm (stroke 2.5) |
| Select / DatePicker chevron | `ChevronDown` | 16 |
| Breadcrumb | `Home`, `ChevronRight` | 16 |
| DataTable sort | `ChevronUp/Down` | 10 |
| Toast | `CheckCircle` / `AlertCircle` / `Info` | 18 |
| Clear / close | `X` | 14 |
| Empty state | Per section | 28 |
| Edit / Delete | `Edit` / `Trash2` | 12–14 |
| Refresh | `RefreshCw` | 13–15 |

### Icon Colors

```
text-slate-400     — default inactive
text-slate-500     — slightly more prominent inactive
text-blue-600      — active/focused, primary accent
text-emerald-500   — success
text-amber-500     — warning
text-rose-500      — error/danger
```

---

## 9. Responsive Grid Patterns

```
KPI row:      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6
Compact KPI:  grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6
2-col cards:  grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6
Dashboard:    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
              gap: var(--ui-gap)
```

---

## 10. Shadow Styles

| Context | Shadow |
| --- | --- |
| Card default | `shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)]` |
| Card hover | `hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:border-blue-200/50 hover:-translate-y-1` |
| Modal panel | `shadow-2xl` |
| Select dropdown | `shadow-2xl` |
| Notification panel | `shadow-2xl` |
| DatePicker popover | `shadow-xl shadow-blue-100/20` |
| Tooltip | `shadow-lg shadow-slate-100/80` |
| Toast | `shadow-lg` |
| SegmentToggle thumb | `shadow-[0_2px_10px_rgba(0,0,0,0.1)]` |
| Selected calendar day | `shadow-md shadow-blue-500/20` |
| Navbar pill (open) | `shadow-lg shadow-blue-100` |

---

## 11. Animations

### ⚠️ Many `animate-*` classes in this codebase do nothing

`animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-top-1`, `slide-in-from-right-10`
and the `data-[state=…]` variants all come from the **`tailwindcss-animate` plugin**.
That plugin is **not installed** and there is no config to register it, so under the
CDN these class names match nothing and are dropped.

There are ~29 such usages (`PageLayout`, `Card` content, `Select` dropdown, `Modal`,
`Toast`, `Tooltip`, navbar panels). **Those elements do not animate.** Leave them or
remove them, but don't assume they work — and if you want them to, that's a deliberate
decision to install the plugin, which would add motion in ~29 places at once.

### What actually runs

Custom keyframes, defined in the `index.html` `<style>` block:

| Class | Effect |
| --- | --- |
| `animate-smooth-in` | fade + slide down 10px, 250ms `cubic-bezier(.16,1,.3,1)` |
| `animate-pop-in` | fade + `scale(.96)` → 1 with -8px slide, 250ms, origin top |
| `animate-spring-in` | same keyframes, 350ms `cubic-bezier(.34,1.56,.64,1)` overshoot — used by `DatePicker` |
| `animate-slide-in-right` | slide in from 100% right, 320ms |
| `animate-slide-out-right` | slide out right, 220ms |
| `animate-backdrop-fade` / `-out` | opacity 0↔1, 200ms |
| `animate-followup-glow` | pulsing box-shadow, `--glow-*` variables, infinite |
| `.expand-section` | height transition via `grid-template-rows: 0fr → 1fr`, 350ms |

Stock Tailwind animations in use: `animate-spin` (loading), `animate-pulse` (skeleton).

Transitions and transforms that do work:

| Context | Value |
| --- | --- |
| Buttons | `transition-colors` (no scale on click) |
| SegmentToggle segment | `active:scale-[0.98]` |
| Navbar pill | `active:scale-95` |
| Card (clickable) | `hover:-translate-y-1`, `duration-200` |
| Card (draggable) | `active:scale-[0.98] active:rotate-[0.5deg]` |
| Gradient KPI card | `hover:-translate-y-0.5 hover:shadow-md` |
| Chevrons | `transition-transform` + `rotate-180` when open |
| General | `duration-200` standard, `duration-300` cards/navbar |

`framer-motion` drives the `SegmentToggle` thumb (shared-layout `layoutId`) and is
imported by `Modal`, `popover`, `dialog`, and `SettingsPage`.

---

## 12. Scrollbars

Two treatments, both global (`index.html`):

```
Default (all overflow):  6px wide, transparent track,
                         thumb #cbd5e1 radius 10px, hover #94a3b8
.customize-scrollbar:    4px wide, thumb #e2e8f0, hover #cbd5e1
                         — used by DataTable wrapper and modal bodies
.scrollbar-hide:         hides the scrollbar while keeping scroll
                         — used by Card content when maxHeight is set
```

Text selection is themed too: `::selection` → `rgba(37,99,235,.1)` bg, `#2563eb` text.

---

## 13. Example: Resizable Card (dashboard/widget layouts)

```tsx
const [span, setSpan] = useState(2);

<Card
  showHandle
  onResize={() => setSpan(s => ((s % 2) + 1) as 1 | 2)}
  className={span === 1 ? 'lg:col-span-1' : 'lg:col-span-2'}
>
```

Header actions and the resize/drag handles are hidden until hover
(`opacity-0 group-hover/card:opacity-100`).

---

## 14. Example: Section with Progressive Loading

```tsx
const [loadingSection, setLoadingSection] = useState(false);
const [sectionData, setSectionData] = useState<Type[]>([]);

// In useEffect:
loadSection(fetchFn, setSectionData, setLoadingSection, reqId);

// Render:
{loadingSection ? (
  <div className="animate-pulse space-y-3">
    <div className="h-16 bg-slate-200 rounded-lg" />
    <div className="h-16 bg-slate-200 rounded-lg" />
  </div>
) : sectionData.length === 0 ? (
  <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
    <Icon size={28} />
    <p className="text-sm">No data.</p>
  </div>
) : (
  <div className="space-y-2">
    {sectionData.map(item => (
      <div key={item.id} className="border border-slate-200 rounded-lg p-3">
        …
      </div>
    ))}
  </div>
)}
```

---

## 15. Known inconsistencies (deliberately documented, not cleaned up)

These are real divergences in the codebase. They're listed so you don't "fix" one
component into disagreeing with its neighbours by accident.

| Issue | Detail |
| --- | --- |
| Focus rings on buttons | `components/ui/Button.tsx` uses `ring-ring` / `ring-offset-background`, which are undefined without a Tailwind config → **no visible focus ring on any button** |
| Border colors | `Input`/`Card` use `slate-200`; `Select`/`DatePicker` triggers use `slate-300` |
| Focus ring opacity | `Input` `blue-500/10`, `DatePicker` `blue-500/20`, `Select` full `blue-500`, `SearchInput` `ring-4 blue-500/10` |
| Required asterisk | `Select` uses `text-red-500`; the palette otherwise uses the rose scale |
| Dead `UI/` directory | Duplicate Button/Card/Modal/Badge/Select/Input/Pagination/SegmentToggle that nothing imports |
| Dead animation classes | ~29 `animate-in`/`fade-in`/`zoom-in-95` usages with no plugin installed |
| Table header bg | Literal `bg-[#F8FAFC]` instead of `bg-slate-50` (same value, different form) |
