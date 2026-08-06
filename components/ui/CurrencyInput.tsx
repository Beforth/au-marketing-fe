import React from 'react';
import { Input } from './Input';

type BaseInputProps = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'inputMode'>;

interface CurrencyInputProps extends BaseInputProps {
  /** Raw numeric value with no commas, e.g. "125000" or (with allowDecimal) "125000.50". */
  value: string;
  /** Receives the raw numeric value back (no commas) — store this, not the formatted display string. */
  onChange: (rawValue: string) => void;
  /** Allow a decimal point + up to 2 digits (e.g. paise). Defaults to whole numbers only. */
  allowDecimal?: boolean;
}

function sanitizeRaw(input: string, allowDecimal: boolean): string {
  if (!allowDecimal) return input.replace(/\D/g, '');
  const dotIdx = input.indexOf('.');
  if (dotIdx === -1) return input.replace(/\D/g, '');
  const intPart = input.slice(0, dotIdx).replace(/\D/g, '');
  const decPart = input.slice(dotIdx + 1).replace(/\D/g, '').slice(0, 2);
  return `${intPart}.${decPart}`;
}

function formatIndian(raw: string, allowDecimal: boolean): string {
  if (!raw) return '';
  const dotIdx = allowDecimal ? raw.indexOf('.') : -1;
  const intPartRaw = dotIdx === -1 ? raw : raw.slice(0, dotIdx);
  const decPart = dotIdx === -1 ? '' : raw.slice(dotIdx + 1);
  if (!intPartRaw) return dotIdx !== -1 ? `0.${decPart}` : '';
  const formattedInt = parseInt(intPartRaw, 10).toLocaleString('en-IN');
  return dotIdx !== -1 ? `${formattedInt}.${decPart}` : formattedInt;
}

/**
 * Text input that shows Indian-style comma grouping (1,00,000) as the user types,
 * while the value passed to onChange stays a plain digit string for storage/parsing.
 * Cursor position is preserved across the reformat on each keystroke.
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, allowDecimal = false, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const selectionStart = input.selectionStart ?? rawValue.length;
    const dotIndex = allowDecimal ? rawValue.indexOf('.') : -1;
    const cursorInDecimalPart = dotIndex !== -1 && selectionStart > dotIndex;

    const cleanValue = sanitizeRaw(rawValue, allowDecimal);
    if (cleanValue === '' || cleanValue === '.') {
      onChange('');
      return;
    }

    onChange(cleanValue);

    // Typing past the decimal point: let the browser keep its natural cursor position
    // rather than trying to relocate it through a comma-grouped integer prefix.
    if (cursorInDecimalPart) return;

    const formattedNew = formatIndian(cleanValue, allowDecimal);
    const rawBeforeCursor = rawValue.slice(0, selectionStart);
    const digitsBeforeCursor = rawBeforeCursor.replace(/\D/g, '').length;

    setTimeout(() => {
      let cursorPosition = 0;
      if (digitsBeforeCursor > 0) {
        let digitCount = 0;
        for (let i = 0; i < formattedNew.length; i++) {
          if (formattedNew[i] !== ',') digitCount++;
          cursorPosition = i + 1;
          if (digitCount === digitsBeforeCursor) break;
        }
      }
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  return (
    <Input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={formatIndian(value, allowDecimal)}
      onChange={handleChange}
      {...props}
    />
  );
};
