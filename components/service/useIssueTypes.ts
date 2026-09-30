/**
 * Issue types for service complaints (hw / sw / plc plus any added later — SRS TCK-10).
 * Falls back to the three built-in types until the list loads, so labels never come up empty.
 */
import { useCallback, useEffect, useState } from 'react';
import { marketingAPI, ServiceIssueTypeOption, SERVICE_ISSUE_TYPES } from '../../lib/marketing-api';

const FALLBACK: ServiceIssueTypeOption[] = SERVICE_ISSUE_TYPES.map((t, i) => ({
  id: -(i + 1),
  code: t.value,
  label: t.label,
  is_active: true,
  display_order: i,
}));

export const useIssueTypes = () => {
  const [types, setTypes] = useState<ServiceIssueTypeOption[]>(FALLBACK);

  const reload = useCallback(async () => {
    try {
      const list = await marketingAPI.getServiceIssueTypes();
      if (list?.length) setTypes(list);
    } catch {
      /* keep the fallback */
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Label for a code (unknown codes show as-is) */
  const labelOf = useCallback((code: string) => types.find((t) => t.code === code)?.label ?? code, [types]);

  return { types, activeTypes: types.filter((t) => t.is_active), labelOf, reload };
};
