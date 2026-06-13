# Design System

> Authoritative reference for generating UI consistent with this codebase.
> All values extracted from live component code.

---

## 1. Core Philosophy

A **professional, data-dense internal tool** with restrained Slate/Indigo palette.
Neutral greys dominate surfaces; Indigo is the interactive/brand accent.
Uppercase-heavy labels, metadata, table headers. Micro-animations (spring-based
transitions, scale-on-click, slide-in reveals). Tone is **utilitarian-premium**.

---

## 2. Colors (Tailwind classes only)

### Primary / Brand
| Class | Hex | Usage |
|---|---|---|
| `indigo-600` | `#4f46e5` | Buttons, active nav, switch-on, focus rings, active tab |
| `indigo-700` | `#4338ca` | Hover on indigo-600 |
| `indigo-50` | `#eef2ff` | Muted bg for active/hover, role badges |
| `indigo-100` | `#e0e7ff` | Borders for indigo-tinted elements |
| `indigo-500/20` | — | Focus ring (ring-2) |
| `indigo-500/10` | — | SearchBar focus ring (ring-4) |

### Neutral (Slate scale)
| Class | Hex | Usage |
|---|---|---|
| `slate-900` | `#0f172a` | Primary text, headings, bold values |
| `slate-800` | `#1e293b` | Secondary button bg, item titles |
| `slate-700` | `#334155` | Label text, medium-contrast body |
| `slate-600` | `#475569` | Table cell text, nav items |
| `slate-500` | `#64748b` | Secondary/placeholder text, icons, card description text |
| `slate-400` | `#94a3b8` | Placeholders, disabled text, subtle icons, empty state text |
| `slate-300` | `#cbd5e1` | Scrollbar thumb, chevron icons |
| `slate-200` | `#e2e8f0` | Borders, dividers, skeleton bg |
| `slate-100` | `#f1f5f9` | Hover bg, table header bg tint, skeleton |
| `slate-50` | `#f8fafc` | Page background, table header bg |

### Semantic
| Class | Hex | Usage |
|---|---|---|
| `emerald-50` | `#ecfdf5` | Success badge/notification bg |
| `emerald-100` | `#d1fae5` | Success badge border |
| `emerald-500` | `#10b981` | Success icon |
| `emerald-600` | `#059669` | Completed count, positive trend text |
| `emerald-700` | `#047857` | Success badge text |
| `amber-50` | `#fffbeb` | Warning badge/notification bg |
| `amber-100` | `#fef3c7` | Warning badge border |
| `amber-500` | `#f59e0b` | Warning icon, pending count |
| `amber-600` | `#d97706` | Pending section header |
| `amber-700` | `#b45309` | Warning badge text |
| `rose-50` | `#fff1f2` | Error/danger button hover bg |
| `rose-500` | `#f43f5e` | Error icon, lost count |
| `rose-600` | `#e11d48` | Danger button, error border, required asterisk |
| `purple-600` | `#9333ea` | Orders count accent |

### Dashboard Chart Palette
| Index | Color | Hex | Usage |
|---|---|---|---|
| 1 | Indigo | `#6366f1` | Primary chart series |
| 2 | Emerald | `#10b981` | Revenue, won, positive |
| 3 | Amber | `#f59e0b` | Conversions, pending (not rose/red) |
| 4 | Red | `#ef4444` | Lost, negatives |
| 5 | Violet | `#8b5cf6` | Premium / won alternate |
| 6 | Cyan | `#06b6d4` | Informational series |
| 7 | Orange | `#f97316` | Urgent / warning series |

Each palette entry includes gradient fill colors (`stroke`, `start`, `end`) — defined in `CHART_COLOR_PALETTES` in `DashboardPage.tsx`. Unified across all render paths: `getCardIcon`, `number-card` gradient, and standalone KPI cards.

### Surface
| Value | Usage |
|---|---|
| `bg-white` | Cards, modals, inputs, sidebar, navbar |
| `bg-white/5 backdrop-blur-md` | Navbar glass effect |
| `bg-slate-50` | Page background |

---

## 3. Typography

### Font
`font-family: 'Outfit', sans-serif` (Google Fonts, weights 300–900)

### Size Scale
| Class | px | Usage |
|---|---|---|
| `text-[9px]` | 9 | Status badge text |
| `text-[10px]` | 10 | Meta labels, page description, compact stat labels, badge text |
| `text-[11px]` | 11 | Table headers, labels, Breadcrumb, filter labels, section headers |
| `text-xs` | 12 | Pagination, small UI text, secondary info |
| `text-sm` | 14 | Body text, input text, table cells, card descriptions |
| `text-base` | 16 | Compact KPI values |
| `text-lg` | 18 | Card title, modal title |
| `text-xl` | 20 | KPI card values, login subtitles |
| `text-2xl` | 24 | StatCard value |
| `text-4xl` | 36 | Page title (h1) |

### Weights
| Class | Weight | Usage |
|---|---|---|
| `font-medium` | 500 | Body, segment toggle labels |
| `font-semibold` | 600 | Card descriptions, labels, toast messages |
| `font-bold` | 700 | Page title, card values, general bold |
| `font-black` | 900 | Buttons (all sizes), table headers, labels, breadcrumbs, section headers, KPI values, tab triggers |

### Letter Spacing
| Class | Value | Usage |
|---|---|---|
| `tracking-tight` | -0.025em | Card titles, page title, modal title |
| `tracking-wide` | 0.025em | Segment toggle labels |
| `tracking-wider` | 0.05em | Section headers, uppercase labels |
| `tracking-widest` | 0.1em | Labels, table heads, breadcrumbs, nav section titles, badge status |

### Common Text Patterns
```
Page title (h1):
  text-4xl font-bold text-slate-900 tracking-tight leading-none

Card title:
  text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none

Card description:
  text-[11px] text-slate-400 font-medium mt-0.5

Section group label:
  text-[11px] font-bold text-{color} uppercase tracking-wider mb-2

KPI card label:
  text-[10px] font-semibold text-slate-500 uppercase tracking-wider

KPI card value:
  text-base font-bold text-slate-900  (compact)
  text-xl font-bold text-slate-900    (regular)
  text-2xl font-bold text-slate-900 tracking-tight tabular-nums  (StatCard)

Badge text:
  text-[9px] font-black uppercase tracking-widest

Label (form fields):
  text-[11px] uppercase font-black tracking-widest text-slate-500

Body / item text:
  text-sm font-semibold text-slate-800

Secondary info:
  text-xs text-slate-500
  text-[11px] text-slate-400
  text-[10px] text-slate-500

Empty state text:
  text-sm text-slate-400
```

---

## 4. Spacing & Layout

### Layout Structure
```
Sidebar:               w-60 (240px), fixed left-0 top-0, h-screen
Navbar:                h-16 (64px), sticky top-0, ml-60
Main content area:     ml-60, px-16 (in PageLayout)
PageLayout gap:        gap-4 (--ui-gap)
```

### Density Variables (from ThemeContext)
| Density | `--ui-padding` | `--ui-gap` | `--ui-radius` |
|---|---|---|---|
| compact | 0.625rem | 0.5rem | 0.5rem |
| default | 1.25rem | 1rem | 0.75rem |
| relaxed | 2rem | 1.5rem | 1rem |

### Grid Background (DashboardLayout)
```css
background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
background-size: 24px 24px;
opacity: 0.3;
```

### Common Spacing
```
Filters card inner:     flex flex-wrap items-end gap-3
Filter label:           text-xs font-semibold text-slate-700 ml-0.5
Filter buttons gap:     gap-1.5

Card internal padding:  p-6
Card noPadding inner:   p-4
KPI card compact:       px-3 py-2.5
Card header:            px-6 py-5 border-b border-slate-50 min-h-[72px]

Grid gaps:              gap-4 (side-by-side cards)
                         gap-6 (between major rows)
                         gap-3 (inline filter items)

Button sizes:
  xs: h-8 px-3
  sm: h-9 px-4
  md: h-10 px-5
  lg: h-12 px-8

Input:                  h-11 px-4 py-2 rounded-xl
```

---

## 5. Components

### Card
```
Base:    bg-white border border-slate-200/50 rounded-[1.25rem]
         shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)]
         min-h-[140px] flex flex-col

No padding:   Card noPadding → inner div with p-4
Header:       px-6 py-5 border-b border-slate-50 min-h-[72px]
Title:        text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none
Description:  text-[11px] text-slate-400 font-medium mt-0.5
Content:      flex-1
```

### Button
```
Variants:
  primary:   bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]
  secondary: bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]
  outline:   bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-[0.98]
  ghost:     text-slate-500 hover:bg-slate-100 hover:text-slate-900
  danger:    bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]
  link:      text-indigo-600 hover:underline font-semibold p-0 h-auto

Base: inline-flex items-center justify-center transition-all duration-200
      disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap
      rounded-lg (xs/sm/md/icon), rounded-xl (lg)
```

### Select
```
Base:     h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium
Focus:    ring-2 ring-indigo-500/20 focus:border-indigo-500
Label:    text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1
Chevron:  position absolute right-3 top-3.5 h-4 w-4 text-slate-400
```

### DatePicker
```
Base:     h-11 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold
Icon:     Calendar/Clock at left-4, turns text-indigo-500 on focus
Label:    text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1
```

### Breadcrumb
```
Container:  flex items-center gap-2 mb-6
Item:       text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600
Active:     text-slate-900 border-b-2 border-indigo-500/50 pb-0.5
Separator:  ChevronRight size={14} text-slate-300
```

---

## 6. KPI / Metric Cards

### Default KPI Card Pattern (full size)
```
<Card noPadding>
  <div className="p-4">
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
      <Icon size={14} /> Label
    </div>
    <p className="text-xl font-bold text-slate-900">value</p>
  </div>
</Card>
```

### Compact KPI Card Pattern (horizontal, for dashboards/overviews)
```
<Card noPadding className="min-h-0">
  <div className="px-3 py-2.5 flex items-center gap-3">
    <Icon size={18} className="text-{color} shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Label</p>
      <p className="text-base font-bold text-slate-900">value</p>
    </div>
  </div>
</Card>
```

### Gradient KPI Card (Dashboard number-card widgets)
```
className: bg-gradient-to-br from-{color}-50/40 to-{color}-100/10
           border border-{color}-100/60
           shadow-sm hover:shadow-md hover:-translate-y-0.5

Inner: flex items-center gap-2.5 w-full p-3 rounded-xl
Label: text-[9px] font-black uppercase tracking-widest text-slate-500
Value: text-xl font-black text-{color}-800 mt-0.5
Icon:  size={18}, no wrapper, color matches accent

Accent color by keyword:
  Revenue/Achieved/Sales/Value     → emerald
  Conversion/Rate/Pct/Ratio        → blue
  Hot/Alert/Cases/Urgent           → amber
  Won/Deals                        → violet
  Leads/Count/Team/Size            → blue
  Fallback                         → slate
```

---

## 7. Common Page Layout Patterns

### Standard Page Structure
```tsx
<PageLayout title="Page Title" description="Description text." breadcrumbs={[{ label, href }]}>
  {/* 1. Filters Card */}
  <Card className="mb-6">
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 ml-0.5">Period</label>
        <div className="flex gap-1.5">
          <Button variant=... size="sm" onClick=...>Today</Button>
        </div>
      </div>
      {/* custom date pickers when preset === 'custom' */}
    </div>
  </Card>

  {/* 2. KPI cards row */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <Card noPadding>...</Card>
    <Card noPadding>...</Card>
    ...
  </div>

  {/* 3. Side-by-side content cards */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <Card title="..." description="...">...</Card>
    <Card title="..." description="...">...</Card>
  </div>

  {/* 4. Full-width summary card */}
  <Card title="..." description="..." className="mb-6">...</Card>
</PageLayout>
```

### Loading State (Skeleton)
```
<div className="animate-pulse space-y-3">
  <div className="h-16 bg-slate-200 rounded-lg" />
  <div className="h-16 bg-slate-200 rounded-lg" />
</div>
```

### Empty State
```
<div className="flex flex-col items-center gap-2 py-6 text-slate-400">
  <Icon size={28} />
  <p className="text-sm">No data message.</p>
</div>
```

### List Items (within cards)
```
<div className="border border-slate-200 rounded-lg p-3">
  <p className="text-sm font-semibold text-slate-800">Title</p>
  <p className="text-xs text-slate-500 mt-1">Description</p>
  <p className="text-[11px] text-slate-400 mt-1">Meta info</p>
</div>
```

### Clickable List Items
```
<div className="border border-slate-200 rounded-lg p-3 cursor-pointer
            hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors"
     onClick={...}>
  <!-- content -->
</div>
```

### "View All" Link
```
<button className="w-full py-2 text-[11px] font-bold text-indigo-600
                   hover:text-indigo-700 transition-colors text-center
                   uppercase tracking-wider">
  View All →
</button>
```

---

## 8. Icon Conventions

### Library
`lucide-react` — named imports only.

### Common Icons
| Context | Icon | Size |
|---|---|---|
| KPI labels | Per keyword | 14 |
| KPI compact | Per keyword | 18 |
| Sidebar nav | Per page | 18 |
| Date filter | `Calendar` | 14 |
| Empty state | Per section | 28 |
| Edit | `Edit3` | 12–14 |
| Delete | `Trash2` | 12–14 |
| Refresh | `RefreshCw` | 13–15 |
| Search | `Search` | 14 |
| Chevron | `ChevronDown/Right` | 14 |
| Close | `X` | 14–16 |
| Arrow | `ArrowRight` | 10–14 |

### Icon Colors
```
text-slate-400     — default inactive
text-slate-500     — slightly more prominent inactive
text-indigo-500    — active/focused
text-indigo-600    — active nav, primary accent
text-emerald-500   — success
text-amber-500     — warning
text-rose-500      — error/danger
```

---

## 9. Responsive Grid Patterns

```
KPI row:        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6
Compact KPI:    grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6
2-col cards:    grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6
Dashboard:      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
                gap: var(--ui-gap)
```

---

## 10. Shadow Styles

| Context | Shadow |
|---|---|
| Card default | `shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)]` |
| Card hover | `hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:border-indigo-200/50 hover:-translate-y-1` |
| Modal | `shadow-2xl` |
| Notification panel | `shadow-2xl` |
| Tooltip | `shadow-lg shadow-slate-100/80` |
| StatCard | `shadow-[0_2px_4px_rgba(0,0,0,0.02),0_1px_0_rgba(0,0,0,0.02)]` |
| StatCard hover | `hover:shadow-xl hover:shadow-indigo-500/5` |

---

## 11. Animations

| Context | Animation |
|---|---|
| Page entrance | `animate-in fade-in duration-500` |
| Dropdowns/panels | `animate-in fade-in slide-in-from-top-1 duration-200` |
| Modal | `animate-in fade-in zoom-in-95` |
| Toast | `animate-in slide-in-from-right-10 fade-in duration-300` |
| Buttons (click) | `active:scale-[0.98]` |
| Card hover | `hover:-translate-y-1 duration-300` |
| KPI card hover | `hover:-translate-y-0.5 hover:shadow-md duration-300` |
| All transitions | `duration-200` (standard), `duration-300` (cards/modals) |

---

## 12. Example: Resizable Card (for dashboard/widget layouts)

```
const [span, setSpan] = useState(2);

<Card
  showHandle
  onResize={() => setSpan(s => ((s % 2) + 1) as 1 | 2)}
  className={span === 1 ? 'lg:col-span-1' : 'lg:col-span-2'}
>
```

---

## 13. Example: Section with Progressive Loading

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
        ...
      </div>
    ))}
  </div>
)}
```
