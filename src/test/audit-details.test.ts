import { describe, it, expect } from 'vitest';
import { splitAuditDetails, dayLabel, searchWords, highlightParts, withoutIds, timeLabel } from '../../lib/audit-details';

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

describe('audit table helpers', () => {
  const now = new Date(2026, 10, 17, 15, 0); // 17 Nov 2026, local time

  it('names the day', () => {
    expect(dayLabel(new Date(2026, 10, 17, 9, 0), now)).toBe('Today');
    expect(dayLabel(new Date(2026, 10, 16, 23, 59), now)).toBe('Yesterday');
    expect(dayLabel(new Date(2026, 9, 31, 10, 0), now)).toBe('31 Oct 2026');
  });

  it('reads the search box as unique words', () => {
    expect(searchWords('  abc  pharma abc ')).toEqual(['abc', 'pharma']);
    expect(searchWords('   ')).toEqual([]);
  });

  it('marks matched words, ignoring case and regex characters; one-letter words only on their own', () => {
    expect(highlightParts('Updated Lead: ABC Pharma', ['abc', 'pharma'])).toEqual([
      { text: 'Updated Lead: ', hit: false }, { text: 'ABC', hit: true }, { text: ' ', hit: false }, { text: 'Pharma', hit: true },
    ]);
    expect(highlightParts('AP/QUOTE-N/001 (x)', ['quote-n/001', '(x)']).filter(p => p.hit).map(p => p.text)).toEqual(['QUOTE-N/001', '(x)']);
    expect(highlightParts('nothing here', [])).toEqual([{ text: 'nothing here', hit: false }]);
    expect(highlightParts('AP Quote N generated a number', ['AP', 'Quote', 'N']).filter(p => p.hit).map(p => p.text)).toEqual(['AP', 'Quote', 'N']);
  });

  it('hides database ids but keeps names and human numbers', () => {
    expect(withoutIds("Added enquiry-log entry 'x' (Inquiry 2) to Enquiry #130 (lead 'Rahul Verma')"))
      .toBe("Added enquiry-log entry 'x' (Inquiry 2) to Enquiry (lead 'Rahul Verma')");
    expect(withoutIds("Deleted attachment #49 from lead 'ABC'")).toBe("Deleted attachment from lead 'ABC'");
    expect(withoutIds('Quote AP/QUOTE-N/001 (Inquiry 3)')).toBe('Quote AP/QUOTE-N/001 (Inquiry 3)');
    expect(withoutIds(null)).toBe('');
  });
});

describe('12-hour time', () => {
  it('always shows am/pm', () => {
    expect(timeLabel(new Date(2026, 10, 17, 15, 21, 32))).toBe('3:21 pm');
    expect(timeLabel(new Date(2026, 10, 17, 0, 5))).toBe('12:05 am');
    expect(timeLabel(new Date(2026, 10, 17, 12, 0))).toBe('12:00 pm');
    expect(timeLabel(new Date(2026, 10, 17, 9, 7))).toBe('9:07 am');
  });
  it('can include seconds', () => {
    expect(timeLabel(new Date(2026, 10, 17, 15, 21, 32), true)).toBe('3:21:32 pm');
    expect(timeLabel(new Date(2026, 9, 31, 10, 49, 5), true)).toBe('10:49:05 am');
    expect(timeLabel(new Date(2026, 10, 17, 0, 0, 0), true)).toBe('12:00:00 am');
  });
});
