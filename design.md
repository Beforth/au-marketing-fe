# Design System — Single Source of Truth

> Extracted from a full codebase scan of all components, layouts, stylesheets, and context files.
> Do not hand-edit values here — every value is sourced directly from code.

---

## 1. Design Philosophy

The UI is a **professional, data-dense internal tool** with a clean, editorial aesthetic that prioritises information hierarchy over decorative flourish. The visual language is built on a restrained Slate/Indigo palette — neutral greys dominate surfaces while Indigo is used exclusively as the interactive/brand accent. Typography is uppercase-heavy for labels, metadata, and table headers, creating a structured, almost spreadsheet-like density that communicates authority and precision. Micro-animations (spring-based transitions, scale-on-click, slide-in reveals) add tactile responsiveness without ever feeling playful. The overall tone is **utilitarian-premium**: functional like an enterprise tool, but polished enough to feel modern and intentional.

---

## 2. Color System

### CSS Variables (defined in `index.html` `:root`, overridden dynamically by `ThemeContext.tsx`)

```css
:root {
  --primary:            #4f46e5;   /* default; overridden by theme */
  --primary-hover:      #4338ca;
  --primary-muted:      rgba(79, 70, 229, 0.08);
  --primary-foreground: #ffffff;
  --background:         #f8fafc;   /* slate-50 */
  --card:               #ffffff;
  --border:             #e2e8f0;   /* slate-200 */
  --zinc-900:           #0f172a;   /* slate-900 equivalent, used as body text */
  --zinc-500:           #64748b;   /* slate-500 equivalent */
  --ui-padding:         2rem;      /* overridden by density */
  --ui-gap:             1.5rem;    /* overridden by density */
}
```

### Theme Palette (`ThemeContext.tsx` — user-selectable, stored in `localStorage`)

| Key       | Name        | `--primary` | `--primary-hover` | `--primary-muted` |
|-----------|-------------|-------------|-------------------|-------------------|
| `blue`    | Royal Blue  | `#2563eb`   | `#1d4ed8`         | `#eff6ff`         |
| `sky`     | Sky Blue    | `#0ea5e9`   | `#0284c7`         | `#f0f9ff`         |
| `indigo`  | Indigo      | `#6366f1`   | `#4f46e5`         | `#f5f3ff`         |
| `emerald` | Emerald     | `#10b981`   | `#059669`         | `#f0fdf4`         |
| `rose`    | Rose        | `#f43f5e`   | `#e11d48`         | `#fff1f2`         |
| `violet`  | Violet      | `#8b5cf6`   | `#7c3aed`         | `#f5f3ff`         |
| `slate`   | Zinc        | `#18181b`   | `#27272a`         | `#f4f4f5`         |

> All `--primary`, `--primary-hover`, `--primary-muted` references in components will reflect whichever theme is active. Default at startup is `blue` (`#2563eb`).

### Semantic Colors (Tailwind classes, extracted from components)

#### Primary / Brand
```
indigo-600   #4f46e5   — buttons, active nav, switch-on, checkbox-on, focus rings
indigo-700   #4338ca   — hover on indigo-600
indigo-50    #eef2ff   — muted bg for active/hover states, badges
indigo-100   #e0e7ff   — borders for indigo-tinted elements
indigo-200   #c7d2fe   — avatar borders, sidebar badge borders
indigo-500/20            — focus ring alpha (ring-2)
indigo-500/10            — search focus ring (ring-4)
```

#### Neutral (Slate scale — the backbone of the UI)
```
slate-900   #0f172a   — primary text, headings, high-contrast labels
slate-800   #1e293b   — secondary button bg, hover states
slate-700   #334155   — label text, medium-contrast body
slate-600   #475569   — table cell text, nav items, muted body
slate-500   #64748b   — secondary/placeholder text, icons, label text
slate-400   #94a3b8   — placeholders, disabled text, subtle icons
slate-300   #cbd5e1   — scrollbar thumb
slate-200   #e2e8f0   — borders, dividers, skeleton bg
slate-100   #f1f5f9   — tab bg, hover bg, table header bg tint
slate-50    #f8fafc   — page background, table header bg, card hover tint
```

#### Accent / Semantic
```
/* Success */
emerald-50   #ecfdf5   — success badge/notification bg
emerald-100  #d1fae5   — success badge border
emerald-500  #10b981   — success icon (Toast, Notification)
emerald-600  #059669   — trend-up text
emerald-700  #047857   — success badge text

/* Warning */
amber-50     #fffbeb   — warning badge/notification bg
amber-100    #fef3c7   — warning badge border
amber-500    #f59e0b   — warning icon
amber-700    #b45309   — warning badge text

/* Danger / Error */
rose-50      #fff1f2   — error badge/notification bg, danger button hover bg
rose-100     #ffe4e6   — error badge border
rose-500     #f43f5e   — error icon (Notification)
rose-600     #e11d48   — danger button bg, error border, required asterisk
rose-700     #be123c   — danger button hover

/* Info */
blue-50      #eff6ff   — info notification bg, Toast info bg
blue-100     #dbeafe   — info Toast border
blue-500     #3b82f6   — info icon
```

#### Background / Surface
```
#f8fafc  (--background / slate-50)    — page background
#ffffff  (--card)                      — cards, modals, inputs, sidebar, navbar
bg-white/5 + backdrop-blur-md          — navbar glass effect
bg-slate-900/40 + backdrop-blur-sm     — modal backdrop overlay
#F8FAFC                                — DataTable header bg (hardcoded hex)
```

#### Text Selection
```css
::selection {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}
```

#### Scrollbar
```css
/* Default scrollbar */
thumb:        #cbd5e1  (slate-300)
thumb:hover:  #94a3b8  (slate-400)

/* .customize-scrollbar */
thumb:        #e2e8f0  (slate-200)
thumb:hover:  #cbd5e1  (slate-300)
```

---

## 3. Typography

### Font Family
```css
font-family: 'Outfit', sans-serif;
```
- Imported from **Google Fonts**: `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap`
- Applied globally on `body` in `index.html`
- No secondary or mono font defined

### Font Sizes (all sizes found in codebase)

| Tailwind class     | px equivalent | Usage                                              |
|--------------------|---------------|----------------------------------------------------|
| `text-[9px]`       | 9px           | Status badge text (success/warning/danger/info)    |
| `text-[10px]`      | 10px          | Error messages, meta labels, badge text, page desc |
| `text-[11px]`      | 11px          | Table headers, labels, Breadcrumb, tooltip content |
| `text-[12px]`      | 12px          | Sidebar username, sub-labels                       |
| `text-[12.5px]`    | 12.5px        | Admin sub-nav items in sidebar                     |
| `text-[13px]`      | 13px          | Sidebar nav items                                  |
| `text-xs`          | 12px          | Search results, login labels, pagination, small UI |
| `text-sm`          | 14px          | Input text, select text, table cells, form body    |
| `text-base`        | 16px          | Large button (lg size)                             |
| `text-lg`          | 18px          | Card title, modal title, sidebar brand name        |
| `text-xl`          | 20px          | Login subtitles                                    |
| `text-2xl`         | 24px          | StatCard value                                     |
| `text-4xl`         | 36px          | `PageLayout` page title (h1)                       |

### Font Weights
```
300   — (imported, not actively used in components)
400   — (imported, baseline)
500   — font-medium — body text, segment toggle labels, search result items
600   — font-semibold — Switch label, Checkbox label, Radio label, Toast msg, card desc
700   — font-bold — sidebar brand, login headings, card values, general bold
800   — font-black — Button (all sizes), TableHead, Label, Breadcrumb, tab trigger
900   — (imported, not explicitly referenced by class name)
```
> Note: `font-black` = 900 weight. Used aggressively for buttons, table headers, labels, badges.

### Letter Spacing

| Class              | Value         | Used on                                              |
|--------------------|---------------|------------------------------------------------------|
| `tracking-tight`   | -0.025em      | Modal title, card title, page title, stat card value |
| `tracking-wide`    | 0.025em       | Segment toggle labels                                |
| `tracking-wider`   | 0.05em        | DataTable column headers                             |
| `tracking-widest`  | 0.1em         | Labels, table heads, breadcrumbs, nav section titles, xs button, badge status |

### Line Heights
- `leading-none` — card titles, page h1
- `leading-snug` — notification message lines
- `leading-normal` — tooltip content

### Heading Hierarchy (as used in components)

```
h1 — text-4xl font-bold tracking-tight leading-none text-slate-900
     (PageLayout page title — 36px / 700)

h3 — text-lg font-black leading-none tracking-tight text-slate-900
     (CardTitle — 18px / 900)

h3 — text-lg font-black text-slate-900 uppercase tracking-tight
     (Modal title — 18px / 900)

h4 — text-sm font-black text-slate-900 uppercase tracking-tight
     (Notification title — 14px / 900)
```

> h2, h5, h6 are not formally defined in the component library.

---

## 4. Spacing & Layout

### Density System (CSS variables injected by `ThemeContext.tsx`)

| Density    | `--ui-padding` | `--ui-gap` | `--ui-radius` | `--ui-scale` (font scale) |
|------------|----------------|------------|---------------|---------------------------|
| `compact`  | `0.625rem`     | `0.5rem`   | `0.5rem`      | `0.95`                    |
| `default`  | `1.25rem`      | `1rem`     | `0.75rem`     | `1`                       |
| `relaxed`  | `2rem`         | `1.5rem`   | `1rem`        | `1.05`                    |

> Default at startup is `compact`. Stored in `localStorage` as `ui-density`.

### Layout Structure
```
Fixed Sidebar:  w-60 (240px), h-screen, fixed left-0 top-0
Navbar:         h-16 (64px), sticky top-0, ml-60
Main Content:   ml-60, px-16, padding-top: calc(var(--ui-padding) * 2.5)
```

### Grid Background (DashboardLayout)
```css
background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
background-size: 24px 24px;
opacity: 0.3;
```

### Common Spacing Patterns

```
Card internal padding:       p-6 (24px)
Card header:                 p-6 (24px), space-y-1.5
Card content:                p-6 pt-0
Card footer:                 p-6 pt-0

Modal header:                px-6 py-4
Modal body:                  px-6 py-6, max-h-[70vh]
Modal footer:                px-6 py-4

Sidebar internal:            p-5 (20px)
Sidebar nav item:            px-3 py-2
Sidebar logo area:           gap-2.5 mb-7 px-2
Sidebar user card:           p-2.5

Button sizes:
  xs:  h-8   px-3
  sm:  h-9   px-4
  md:  h-10  px-5
  lg:  h-12  px-8
  icon: h-10 w-10

Input height:    h-11 (44px), px-4 py-2
Table head:      h-11, px-4
Table cell:      p-4
DataTable head:  h-10, px-4 (first col: pl-6)
DataTable cell:  px-4 py-2.5 (first col: pl-6)

Page title area:  mb-3 px-1
Breadcrumb:       mb-6
```

### Max-width Containers (Modal sizes)
```
sm:   max-w-sm    (384px)
md:   max-w-md    (448px)
lg:   max-w-lg    (512px)
xl:   max-w-2xl   (672px)
full: max-w-[95vw]

Login form:       max-w-sm   (384px)
Notification panel: w-80    (320px)
FilterPopover:    w-80       (320px)
Search dropdown:  max-h-[380px]
```

---

## 5. Component Inventory

### `UI/` — Core Primitive Components

---

#### `Button`
- **File**: `UI/Button.tsx`
- **Variants**: `primary` | `secondary` | `outline` | `ghost` | `danger` | `link`
- **Sizes**: `xs` | `sm` | `md` | `lg` | `icon`
- **Props**: `isLoading`, `leftIcon`, `rightIcon`, `disabled`
- **Base classes**: `inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap`

```
primary:   bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-[0.98]
secondary: bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]
outline:   bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs active:scale-[0.98]
ghost:     text-slate-500 hover:bg-slate-100 hover:text-slate-900
danger:    bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.98]
link:      text-indigo-600 hover:underline font-semibold p-0 h-auto

Size radii:
  xs/sm/md/icon: rounded-lg
  lg:            rounded-xl
```

---

#### `Badge`
- **File**: `UI/Badge.tsx`
- **Variants**: `default` | `secondary` | `outline` | `success` | `warning` | `danger` | `info`
- **Base classes**: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`

```
default:   bg-slate-900 text-white border-transparent
secondary: bg-slate-100 text-slate-900 border-transparent hover:bg-slate-200
outline:   text-slate-900 border-slate-200 bg-transparent
success:   bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-widest text-[9px] font-black
warning:   bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-widest text-[9px] font-black
danger:    bg-rose-50 text-rose-700 border-rose-100 uppercase tracking-widest text-[9px] font-black
info:      bg-indigo-50 text-indigo-700 border-indigo-100 uppercase tracking-widest text-[9px] font-black
```
> Status badges (success/warning/danger/info) use `text-[9px] font-black uppercase tracking-widest` — very small, all-caps, bold.

---

#### `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`
- **File**: `UI/Card.tsx`
- **Props**: `hoverable` (boolean)
- **Base**: `rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-all duration-300`
- **Hoverable**: `hover:shadow-md hover:border-slate-300 hover:-translate-y-1`

```
CardHeader:      flex flex-col space-y-1.5 p-6
CardTitle:       text-lg font-black leading-none tracking-tight text-slate-900
CardDescription: text-sm font-semibold text-slate-500
CardContent:     p-6 pt-0
CardFooter:      flex items-center p-6 pt-0
```

---

#### `Input`
- **File**: `UI/Input.tsx`
- **Props**: `error`, `label`, `containerClassName`
- **Base**: `h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-200`
- **Focus**: `focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`
- **Error**: `border-rose-500 focus:ring-rose-500/20 focus:border-rose-500`
- **Hover**: `hover:border-slate-300`
- **Label style**: `text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1`
- **Error message**: `text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight`

---

#### `Select`
- **File**: `UI/Select.tsx`
- **Props**: `error`, `label`
- **Base**: Same as Input — `h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium`
- Includes absolute-positioned `ChevronDown` icon: `right-3 top-3.5 h-4 w-4 text-slate-400`

---

#### `Textarea`
- **File**: `UI/Textarea.tsx`
- **Props**: `error`, `label`
- **Base**: `min-h-[100px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium`
- Same focus/error/hover pattern as Input

---

#### `DatePicker`
- **File**: `UI/DatePicker.tsx`
- **Props**: `label`, `error`, supports `type="date"` | `"time"` | `"datetime-local"`
- **Base**: `h-11 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold`
- Has leading icon (Calendar or Clock) at `left-4`
- Focus turns icon to `text-indigo-500`

---

#### `SearchBar`
- **File**: `UI/SearchBar.tsx`
- **Props**: `onClear`, `isLoading`
- **Base**: `h-11 rounded-2xl border border-slate-200 bg-white pl-12 pr-10 text-sm font-semibold`
- **Focus**: `ring-4 ring-indigo-500/10 border-indigo-500`
- Leading `Search` icon at `left-4`, turns `text-indigo-500` on focus
- Trailing clear button or spinner

---

#### `Switch`
- **File**: `UI/Switch.tsx`
- **Sizes**: `sm` | `md`
- Track: `rounded-full bg-slate-200 peer-checked:bg-indigo-600 transition-all duration-300`
  - `sm`: `h-4 w-8`; `md`: `h-6 w-11`
- Thumb: `rounded-full bg-white transition-all duration-300`
  - `sm`: `h-3 w-3 peer-checked:translate-x-4`; `md`: `h-5 w-5 peer-checked:translate-x-5`
- Label: `text-sm font-semibold text-slate-700`

---

#### `Checkbox`
- **File**: `UI/Checkbox.tsx`
- **Props**: `label`
- Box: `h-5 w-5 rounded-md border-2 border-slate-200 bg-white`
- Checked: `bg-indigo-600 border-indigo-600`
- Check icon: `Check h-3.5 w-3.5 text-white`, animates `scale-0 → scale-100`
- Label: `text-sm font-semibold text-slate-700`

---

#### `Radio`
- **File**: `UI/Radio.tsx`
- **Props**: `label`
- Outer: `h-5 w-5 rounded-full border-2 border-slate-200 bg-white`
- Checked: `border-indigo-600`
- Inner dot: `h-2.5 w-2.5 rounded-full bg-indigo-600 scale-0 → scale-100`

---

#### `Label`
- **File**: `UI/Label.tsx`
- **Props**: `required`
- Style: `text-[11px] uppercase font-black tracking-widest text-slate-500`
- Required asterisk: `text-rose-500 text-sm`

---

#### `Separator`
- **File**: `UI/Separator.tsx`
- **Orientations**: `horizontal` | `vertical`
- `bg-slate-200`; horizontal: `h-[1px] w-full`; vertical: `h-full w-[1px]`

---

#### `Skeleton`
- **File**: `UI/Skeleton.tsx`
- `animate-pulse rounded-md bg-slate-100`

---

#### `Table` / `TableHeader` / `TableBody` / `TableFooter` / `TableRow` / `TableHead` / `TableCell`
- **File**: `UI/Table.tsx`
- Container: `rounded-xl border border-slate-200 shadow-sm overflow-auto`
- Table: `w-full caption-bottom text-sm border-separate border-spacing-0`
- `TableHeader`: `bg-slate-50/50`
- `TableBody`: `bg-white`
- `TableFooter`: `border-t bg-slate-50/50`
- `TableRow`: `border-b hover:bg-slate-50/50`
- `TableHead`: `h-11 px-4 text-left font-black text-slate-500 uppercase tracking-widest text-[11px] border-b border-slate-200`
- `TableCell`: `p-4 align-middle border-b border-slate-100 font-medium text-slate-600`

---

#### `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- **File**: `UI/Tabs.tsx`
- `TabsList`: `inline-flex h-12 items-center rounded-xl bg-slate-100/50 p-1.5 text-slate-500`
- `TabsTrigger` active: `bg-white text-slate-950 shadow-sm`
- `TabsTrigger` inactive: `text-slate-500 hover:text-slate-900`
- Both: `rounded-lg px-4 py-2 text-sm font-black uppercase tracking-widest transition-all duration-200`

---

#### `Modal`
- **File**: `UI/Modal.tsx`
- **Sizes**: `sm` | `md` | `lg` | `xl` | `full`
- **Backdrop**: `bg-slate-900/40 backdrop-blur-sm`
- **Dialog**: `rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95`
- **Header**: `border-b border-slate-100 px-6 py-4`
- **Title**: `text-lg font-black text-slate-900 uppercase tracking-tight`
- **Body**: `px-6 py-6 overflow-y-auto max-h-[70vh]`
- **Footer**: `border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-end gap-3`

---

#### `Notification`
- **File**: `UI/Notification.tsx`
- **Types**: `info` | `success` | `warning` | `error`
- Base: `flex items-start gap-4 p-4 rounded-2xl border shadow-sm transition-all duration-300 animate-in slide-in-from-right-5`
- Title: `text-sm font-black text-slate-900 uppercase tracking-tight`
- Message: `text-xs font-semibold text-slate-500`
- Backgrounds/borders mirror Toast (see semantic colors above)

---

#### `Pagination`
- **File**: `UI/Pagination.tsx`
- Uses `Button` (primary for active page, outline for others)
- Container: `flex items-center justify-center gap-1.5 px-4 py-3`
- Page buttons: `h-9 w-9 p-0 rounded-lg text-xs`

---

#### `Tooltip`
- **File**: `UI/Tooltip.tsx` — wraps `@radix-ui/react-tooltip`
- Content: `px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-100/80`
- Text: `text-[11px] font-semibold text-slate-800`
- Arrow: `fill-white stroke-slate-200 stroke-1` (8×4px)
- Delay: 100ms default

---

#### `Breadcrumb`
- **File**: `UI/Breadcrumb.tsx`
- Container: `flex items-center gap-2 mb-6`
- Link/inactive: `text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600`
- Active (last item): `text-slate-900 border-b-2 border-indigo-500/50 pb-0.5`
- Separator: `ChevronRight size={14} text-slate-300`
- Home icon: `size={14} text-slate-400 hover:text-indigo-600 group-hover:scale-110`

---

#### `SegmentToggle`
- **File**: `UI/SegmentToggle.tsx` — uses `framer-motion`
- **Sizes**: `sm` | `md`
- Container: `bg-slate-100/80 inline-flex p-0.5 rounded-xl border border-slate-200/60 shadow-sm`
- Active pill: `motion.div bg-white shadow-sm border border-slate-200/50 rounded-[10px]` (spring animated)
- Active text: `text-indigo-700`
- Inactive text: `text-slate-500 hover:text-slate-800`
- Label: `text-[11px] font-medium uppercase tracking-wide`

---

#### `Icon`
- **File**: `UI/Icon.tsx`
- Wrapper for any Lucide icon by name string
- Default: `strokeWidth={2.5}`, `transition-all duration-200`

---

### `components/ui/` — Extended Application Components

---

#### `Sidebar`
- **File**: `components/ui/Sidebar.tsx`
- Fixed `w-60 h-screen bg-white border-r border-slate-200/60`
- Logo: `w-10 h-10 rounded object-contain`
- Brand name: `text-lg font-bold tracking-tight text-slate-900`
- Nav section label: `text-[10px] font-bold text-slate-400 uppercase tracking-widest`
- Nav item base: `rounded-lg text-[13px] font-medium px-3 py-2 transition-all duration-200`
- Nav item active: `bg-indigo-50 text-indigo-700`
- Nav item inactive: `text-slate-600 hover:bg-slate-50 hover:text-slate-900`
- Icon active: `text-indigo-600 strokeWidth={2.2}`
- Icon inactive: `text-slate-400 strokeWidth={1.8}`
- User card (bottom): `p-2.5 rounded-xl border border-slate-100/80 bg-slate-50/50`
- Avatar: `w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200/50 text-indigo-600 font-bold text-xs`

---

#### `Navbar`
- **File**: `components/ui/Navbar.tsx`
- `h-16 sticky top-0 bg-white/5 backdrop-blur-md z-40 ml-60`
- Bottom divider: `absolute bottom-0 left-8 right-8 h-px bg-slate-200/50`
- Bell button active: `bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100`
- Bell button inactive: `bg-indigo-50/50 border-indigo-100 text-indigo-600 hover:bg-indigo-50`
- Avatar: `w-8 h-8 rounded-full bg-[var(--primary)] text-white border-2 border-white shadow-sm`
- Notification panel: `w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl`
- Search bar override: `h-9 bg-slate-50/50 border-slate-200/50 focus:bg-white focus:border-indigo-500/30`

---

#### `DataTable`
- **File**: `components/ui/DataTable.tsx`
- **Props**: `dense`, `showVerticalLines`, `hideHeader`, `isLoading`, `sortConfig`, `onSort`, `onRowClick`
- Container: `border border-slate-200 rounded-xl bg-white`
- Header: `sticky top-0 z-20 bg-[#F8FAFC]`
- Header cell: `h-10 px-4 font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]`
- Sortable header hover: `hover:bg-slate-100/80 hover:text-indigo-600`
- Active sort icon: `text-indigo-600`
- Row hover: `hover:bg-slate-50/80`
- Row click: `active:bg-slate-100/50`
- Cell: `px-4 py-2.5 text-slate-600`
- Loading overlay: `bg-white/40 backdrop-blur-[1px]`
- Empty state: `uppercase tracking-widest text-xs font-bold text-slate-400 opacity-30`

---

#### `StatCard`
- **File**: `components/ui/StatCard.tsx`
- `bg-white border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_1px_0_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200/50`
- `border-radius: 1rem` (hardcoded inline style)
- Icon container: `w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg group-hover:text-indigo-600 group-hover:bg-indigo-50`
- Value: `text-2xl font-bold text-slate-900 tracking-tight tabular-nums`
- Label: `text-[10px] font-bold text-slate-400 uppercase tracking-widest`
- Trend badge: `rounded-full px-2 py-0.5 text-[10px] font-bold`
  - Up: `text-emerald-600 bg-emerald-50`
  - Down: `text-rose-600 bg-rose-50`
  - Neutral: `text-slate-500 bg-slate-100`

---

#### `Toast`
- **File**: `components/ui/Toast.tsx`
- **Types**: `success` | `error` | `info`
- Position: `fixed bottom-8 right-8 z-[100]`
- Base: `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-10 fade-in duration-300`
- Message: `text-sm font-semibold text-slate-800`

---

#### `ConfirmModal`
- **File**: `components/ui/ConfirmModal.tsx`
- Wraps `Modal` with two `Button` actions
- Confirm variants: `danger` (rose-600) | `primary` (var(--primary)) | `default` (slate-800)

---

#### `FilterPopover`
- **File**: `components/ui/FilterPopover.tsx`
- Fixed-positioned, computed position from trigger element
- Uses `Card` with `w-80 shadow-xl border-slate-200 p-4`

---

#### `Loader`
- **File**: `components/ui/Loader.tsx` — uses `framer-motion`
- **Sizes**: `xs` | `sm` | `md` | `lg` | `xl`
- **Variants**: `primary` | `white` | `slate`
- Spinning circle: `rounded-full border-solid`
  - primary: `border-indigo-600/20 border-t-indigo-600`
  - white: `border-white/20 border-t-white`
  - slate: `border-slate-200 border-t-slate-500`

---

#### `WaveLoader`
- **File**: `components/ui/WaveLoader.tsx` — uses `framer-motion`
- Animated bars: `w-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200/50`
- Height animates `8px → 24px → 8px`, staggered delay `index * 0.1s`
- Message: `text-[11px] font-black uppercase tracking-widest text-slate-500 animate-pulse`

---

#### `PageLayout`
- **File**: `components/layout/PageLayout.tsx`
- Wrapper: `w-full transition-all duration-300 animate-in fade-in flex flex-col`
- Gap: `var(--ui-gap)` (from density)
- Page title: `text-4xl font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap`
- Page description: `text-slate-400 text-[10px] font-medium uppercase tracking-widest leading-none`
- Action area: `flex items-center gap-2 shrink-0`

---

## 6. Border & Shape System

### Border Radius

| Class          | Value     | Used on                                      |
|----------------|-----------|----------------------------------------------|
| `rounded-md`   | 4px       | Skeleton, badge version badge, admin badge   |
| `rounded-lg`   | 8px       | Button (xs/sm/md/icon), nav items, toast, search result rows, notification close btn, sidebar version badge |
| `rounded-xl`   | 12px      | Input, Select, Textarea, Tabs container, Table container, DataTable, FilterPopover trigger region, Tooltip, SearchBar, Notification panel, density switcher |
| `rounded-2xl`  | 16px      | Card, Notification component, Tabs list     |
| `rounded-3xl`  | 24px      | Modal dialog                                 |
| `rounded-full` | 9999px    | Badge, Switch track/thumb, Avatar, Bell btn, Pagination ellipsis, Loader, notification dots |
| `rounded-[10px]`| 10px    | SegmentToggle active pill                    |
| `border-radius: 1rem` | 16px | StatCard (inline style — inconsistency) |

### Border Colors & Widths

```
border border-slate-200      — cards, inputs, table containers, sidebar, most surfaces
border border-slate-200/60   — sidebar border (slightly transparent)
border border-slate-100      — modal header/footer dividers, sidebar user card
border border-slate-100/80   — sidebar user card
border-b border-slate-200    — DataTable header bottom
border-b border-slate-100    — table rows (Table.tsx)
border border-indigo-100     — info badge border
border border-emerald-100    — success badge border
border border-amber-100      — warning badge border
border border-rose-100       — danger badge border
border-2 border-slate-200    — Checkbox/Radio default
border-2 border-indigo-600   — Checkbox/Radio checked
border-t-2 border-indigo-500/50 — Breadcrumb active item underline
```

### Shadow Styles

```css
/* Card */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);   /* shadow-sm */

/* Card hoverable */
hover: shadow-md (larger shadow)

/* Modal */
shadow-2xl

/* StatCard */
box-shadow: 0 2px 4px rgba(0,0,0,0.02), 0 1px 0px rgba(0,0,0,0.02);

/* StatCard hover */
hover:shadow-xl hover:shadow-indigo-500/5

/* Table container */
shadow-sm

/* Notification panel */
shadow-2xl

/* SearchBar */
shadow-sm shadow-slate-200/50

/* Tooltip */
shadow-lg shadow-slate-100/80

/* SegmentToggle pill */
shadow-sm

/* WaveLoader bars */
shadow-sm shadow-indigo-200/50

/* Notification indicator dot */
shadow: 0 0 8px rgba(79,70,229,0.4)   /* glow on unread dot */
```

---

## 7. Animation & Motion

### Transition Durations & Easings

```css
/* Standard UI transitions */
duration-200   — buttons, inputs, checkboxes, nav items, most interactive elements
duration-300   — cards, notifications, modals, sidebar nav, toast
duration-500   — DashboardLayout content area (density/layout changes)

/* Easing functions */
ease-[default]                           — Tailwind default (ease)
cubic-bezier(0.16, 1, 0.3, 1)           — slideDownFade, popIn, expand-section (snappy decelerate)
cubic-bezier(0.34, 1.56, 0.64, 1)       — animate-spring-in (overshoot spring)
spring (framer-motion bounce:0, dur:0.35s) — SegmentToggle active pill
```

### Keyframe Animations (`index.html`)

```css
@keyframes slideDownFade {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* .animate-smooth-in: 0.25s cubic-bezier(0.16, 1, 0.3, 1) */

@keyframes popIn {
  from { opacity: 0; transform: scale(0.96) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
/* .animate-pop-in:    0.25s cubic-bezier(0.16, 1, 0.3, 1) */
/* .animate-spring-in: 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) */
```

### Expand/Collapse (Height Animation)

```css
/* Used for accordion-style reveals */
.expand-section {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.expand-section.open { grid-template-rows: 1fr; }
.expand-section-content { min-height: 0; visibility: hidden; transition: visibility 0.35s; }
.expand-section.open .expand-section-content { visibility: visible; }
```

### Tailwind `animate-in` Usage (from Radix / tailwindcss-animate)

```
animate-in fade-in zoom-in-95          — Modals, ThemeSwitcher dropdown
animate-in slide-in-from-top-1         — Search dropdown, Navbar notification panel
animate-in slide-in-from-top-2         — Notification panel
animate-in slide-in-from-right-5       — Notification component
animate-in slide-in-from-right-10      — Toast
animate-in fade-in                     — PageLayout (page entrance)
```

### Hover / Focus Interaction Patterns

```
active:scale-[0.98]           — all non-ghost buttons, SegmentToggle options
active:scale-[0.95]           — Navbar bell button
hover:-translate-y-1          — Card (hoverable), some inline buttons
hover:scale-110               — Breadcrumb home icon
group-hover:opacity-100       — Notification item icon
group-hover:text-indigo-600   — DataTable sortable column, Breadcrumb home
focus:ring-2 focus:ring-indigo-500/20  — Input, Select, Textarea, Checkbox, Radio
focus:ring-4 focus:ring-indigo-500/10  — SearchBar (larger, lighter ring)
focus:border-indigo-500       — all form inputs on focus
```

---

## 8. Iconography

### Library
- **Lucide React** v`0.460.0` (loaded via ESM from `esm.sh`)
- Imported as named exports: `import { IconName } from 'lucide-react'`
- Generic wrapper: `UI/Icon.tsx` (dynamic by name string)

### Icon Sizes Used

| Size   | Contexts                                                         |
|--------|------------------------------------------------------------------|
| `10`   | Sort arrows (ChevronUp/Down in DataTable), Breadcrumb separators (ChevronRight), ArrowRight in nav search, notification dot arrow |
| `14`   | Tooltip arrow, close buttons (X), Breadcrumb ChevronRight, notification type icons, ThemeSwitcher check, small action icons |
| `15`   | Sidebar admin sub-nav icons                                      |
| `16`   | Button `Loader2` spinner, SearchBar clear X, Notification close X, Navbar logout, ChevronDown in Select |
| `18`   | Sidebar main nav icons, SearchBar search icon, DatePicker calendar icon, StatCard icons, Navbar settings gear |
| `20`   | Navbar Bell, Settings, ThemeSwitcher Palette                     |
| `24`   | (default Lucide size, not explicitly set in most places)         |

### Icon Stroke Widths

```
strokeWidth={1.5}   — Navbar Settings gear
strokeWidth={1.8}   — Sidebar nav item (inactive), sidebar admin icon (inactive)
strokeWidth={2}     — StatCard icons, Navbar Bell, ThemeSwitcher, general usage
strokeWidth={2.2}   — Sidebar nav item (active), sidebar admin icon (active)
strokeWidth={2.5}   — UI/Icon.tsx default, SearchBar Search icon, Notification X close
strokeWidth={3}     — SearchBar clear X, StatCard trend arrows, Notification X
```

### Icon Color Conventions

```
text-slate-400     — default inactive icons (nav, settings, inputs)
text-slate-500     — slightly more prominent inactive icons
text-indigo-500    — active nav icon, focused input icon, sort active column
text-indigo-600    — active nav icon (sidebar), Loader primary
text-emerald-500   — success icons
text-amber-500     — warning icons
text-rose-500      — error icons
text-blue-500      — info icons
```

---

## 9. Imagery & Media

### Patterns
- Logo (`/aureole-logo.png`): `w-10 h-10 rounded object-contain` in sidebar
- Login page logo: `w-16 h-16 rounded-lg object-contain`
- Lottie animation on login page: fills `60%` left panel, `max-height: 90vh`
- No image grid/gallery patterns; this is a data-table-heavy app

### Skeleton
```
animate-pulse rounded-md bg-slate-100
```
Used as generic placeholder shape — size applied via `className` prop.

### Loading States
1. **Inline spinner**: `inline-block w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin`
2. **`Loader` component**: framer-motion rotating circle (xs–xl sizes)
3. **`WaveLoader`**: framer-motion staggered bars (bg-indigo-600)
4. **DataTable overlay**: `bg-white/40 backdrop-blur-[1px]` with centered spinner
5. **Login page spinner**: `border-b-2 border-[var(--primary)]`

---

## 10. Responsive Breakpoints

### Tailwind Defaults (in use)
```
sm:   640px   — Modal padding (p-6 on sm:)
lg:   1024px  — Login page split layout (hidden lg:flex for animation panel, lg:w-[60%] / lg:w-[40%])
md:   768px   — Navbar user name (hidden md:block)
```
> No custom breakpoints are defined. The app uses the standard Tailwind breakpoint scale.

### Approach
- **Desktop-first** for the main dashboard (sidebar is always `w-60 fixed`; no mobile nav defined)
- The login page is responsive: animation panel hidden below `lg:`, form takes full width
- PageLayout uses `lg:flex-row` for title + actions alignment
- No explicit mobile sidebar drawer/hamburger exists in the codebase — this app is **desktop-only by design**

### Breakpoint-specific Changes

| Component    | Below `lg` (< 1024px)                    | At `lg` and above                        |
|--------------|------------------------------------------|------------------------------------------|
| Login        | Single column, form only                 | 60% Lottie + 40% form split              |
| PageLayout   | Title and actions stack (`flex-col`)     | Title and actions side-by-side (`flex-row`) |
| Navbar       | User name hidden                         | User name + designation visible          |

---

## 11. Dark / Light Mode

### Status: **Light mode only**
The `ThemeContext.tsx` explicitly removes the `dark` class on every theme change:
```ts
root.classList.remove('dark');
```

- No dark mode CSS variables are defined
- No `dark:` Tailwind class variants are used anywhere in the codebase
- There is no toggle for dark mode

### What IS Customizable (via ThemeContext)
- **Primary color** (7 presets — see Color System section)
- **Density** (compact / default / relaxed) — changes padding, gap, radius, font scale
- Both persisted in `localStorage` as `ui-color` and `ui-density`

---

## 12. Do's and Don'ts

### ✅ Do

- **Do** use `cn()` from `lib/utils.ts` for all className merging — never raw string concatenation with conditional classes
- **Do** use `font-black` (900) for all labels, table headers, button text, and status badges
- **Do** use `uppercase tracking-widest` for all metadata labels, nav section titles, table headers, and status badges
- **Do** use `var(--primary)` for any element that should respect the user's selected theme color
- **Do** use `indigo-600` for hardcoded accent elements that don't need to change with theme (icons, focus rings, toggle switches)
- **Do** use `rounded-xl` for form inputs, `rounded-2xl` for cards, `rounded-3xl` for modals
- **Do** use `transition-all duration-200` as the default for interactive elements
- **Do** use `active:scale-[0.98]` on clickable elements for tactile press feedback
- **Do** use `animate-in fade-in` from tailwindcss-animate for page/component entrances
- **Do** use `slate-200` for all borders — never use `gray-` or `neutral-` variants
- **Do** apply `text-[11px] uppercase font-black tracking-widest text-slate-500` for all form labels
- **Do** use `shadow-sm` as the default shadow, `shadow-2xl` only for modals
- **Do** keep icon `strokeWidth` between `1.8` (inactive) and `2.2` (active) for nav icons; use `2` for general icons
- **Do** use `Outfit` font exclusively — no other typefaces
- **Do** apply `h-11` (44px) as the standard height for all form inputs, selects, and date pickers

### ❌ Don't

- **Don't** use `dark:` variants — dark mode is not supported
- **Don't** use `gray-`, `neutral-`, `zinc-`, or `stone-` Tailwind classes — use `slate-` exclusively
- **Don't** use `font-normal` or `font-light` for UI labels — minimum weight for labels is `font-semibold`
- **Don't** hardcode `border-radius` as inline style (the StatCard does this — it's an inconsistency)
- **Don't** use raw `#hex` colors in JSX className — use Tailwind classes or CSS variables
- **Don't** add new shadows heavier than `shadow-xl` except on modals
- **Don't** use `transition` without `duration-` — always specify duration explicitly
- **Don't** create new badge/status colors outside of emerald/amber/rose/indigo/blue
- **Don't** add font sizes outside the existing scale without documenting them
- **Don't** use `h-10` for primary form inputs — use `h-11`; `h-10` is reserved for table heads and `md` buttons
- **Don't** use placeholder text in a weight lighter than `font-medium`; placeholder color is always `text-slate-400`
- **Don't** use `grid-cols-` layouts inside cards without checking against the density gap system
- **Don't** build mobile-only or hamburger-nav patterns — the app is desktop-first, sidebar is always visible

---

## Inconsistencies to Resolve

1. **StatCard border-radius**: Uses `style={{ borderRadius: '1rem' }}` (inline) while all other cards use `rounded-2xl` (Tailwind). These produce the same value (16px) but the approach is inconsistent — recommend replacing with `rounded-2xl`.

2. **Two parallel component libraries**: `UI/` (primitive design-system components) and `components/ui/` (application-level extended components) both contain versions of `Button`, `Badge`, `Card`, `Input`, `Select`, `Modal`, `Breadcrumb`, `Pagination`, `SegmentToggle`, and `DatePicker`. These are separate implementations — always verify which one a page is importing, as they have slight style differences.

3. **DataTable vs Table**: Two independent table implementations exist:
   - `UI/Table.tsx` — primitive, composable (TableHeader, TableBody, TableRow, etc.)
   - `components/ui/DataTable.tsx` — feature-rich (sort, loading, resizable, vertical lines)
   The two have slightly different header styles (`font-black` vs `font-semibold`) and header backgrounds (`bg-slate-50/50` vs `bg-[#F8FAFC]` hardcoded hex).

4. **`--zinc-900` / `--zinc-500` CSS variable names**: Declared in `:root` but use the `zinc-` naming convention while the rest of the app uses `slate-` classes. The values are actually slate-equivalent (`#0f172a` = slate-900, `#64748b` = slate-500). These variable names are misleading.

5. **`var(--ui-padding)` defaults vs ThemeContext**: `index.html` sets `--ui-padding: 2rem` and `--ui-gap: 1.5rem` as defaults, but `ThemeContext` initialises density as `compact` which sets `--ui-padding: 0.625rem`. On first paint before React hydrates, users may briefly see the relaxed padding values. Consider aligning the CSS default to `compact` values.

6. **Tooltip dependency**: `UI/Tooltip.tsx` imports from `@radix-ui/react-tooltip`, but this package is not listed in `package.json` and not in the `importmap` in `index.html`. This component may currently be non-functional.

7. **`SegmentToggle` uses `framer-motion`**: `UI/SegmentToggle.tsx` imports `motion` from `framer-motion`. This library is also not in the `importmap`. The version in `components/ui/SegmentToggle.tsx` is the safe fallback.
