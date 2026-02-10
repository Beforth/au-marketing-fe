
/**
 * Utility to merge tailwind classes safely.
 */
export function cn(...inputs: any[]) {
  return inputs
    .flat()
    .filter(Boolean)
    .map(x => {
      if (typeof x === 'object') {
        return Object.entries(x)
          .filter(([_, enabled]) => !!enabled)
          .map(([cls]) => cls)
          .join(' ');
      }
      return String(x);
    })
    .join(' ');
}
