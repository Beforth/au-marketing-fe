/**
 * Shared chart tokens — validated categorical palette (fixed order, never cycled;
 * run `node scripts/validate_palette.js` from the dataviz skill before changing),
 * plus chrome (grid/axis/text) tokens used consistently across every dashboard chart.
 */

// Slot 1 substituted with this app's own brand blue; slots 2-8 are the validated
// reference order (blue↔orange↔aqua↔yellow↔magenta↔green↔violet↔red).
export const CATEGORICAL = [
  '#2563eb', // 1 blue (brand)
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948', // 8 red
];

// Single-hue ordinal ramp (light -> dark) for ordered categories (funnel stages, tiers).
export const SEQUENTIAL_BLUE_ORDINAL = ['#86b6ef', '#3987e5', '#1c5cab'];

export const CHART_CHROME = {
  surface: '#ffffff',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  mutedText: '#898781',
  secondaryText: '#52514e',
  primaryText: '#0b0b0b',
};

/** Stable color-by-entity: same label always maps to the same slot, regardless of row order. */
export function colorForLabel(label: string, palette: string[] = CATEGORICAL): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #e1e0d9',
  fontSize: 12,
  color: CHART_CHROME.primaryText,
};

export const axisTick = { fontSize: 11, fill: CHART_CHROME.mutedText };
