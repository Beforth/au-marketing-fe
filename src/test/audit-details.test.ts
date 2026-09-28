import { describe, it, expect } from 'vitest';
import { splitAuditDetails } from '../../lib/audit-details';

describe('splitAuditDetails', () => {
  it('splits summary and changes', () => {
    expect(splitAuditDetails('Updated Contact: Ravi — Phone: 1 → 2; Email: a → b')).toEqual({
      summary: 'Updated Contact: Ravi',
      changes: ['Phone: 1 → 2', 'Email: a → b'],
    });
  });
  it('leaves plain text alone', () => {
    expect(splitAuditDetails('Deleted Lead: Ravi')).toEqual({ summary: 'Deleted Lead: Ravi', changes: [] });
    expect(splitAuditDetails(null)).toEqual({ summary: '', changes: [] });
  });
});
