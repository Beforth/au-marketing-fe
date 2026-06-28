import { describe, it, expect } from 'vitest';

describe('test setup', () => {
  it('vitest runs with jsdom', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('basic math works', () => {
    expect(1 + 1).toBe(2);
  });
});
