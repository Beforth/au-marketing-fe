import { useEffect, useState } from 'react';
import { marketingAPI } from '../../lib/marketing-api';
import { useApp } from '../../App';

export interface EmployeeOption {
  /** HRMS username — what the DSR/Expense APIs accept as `username`. */
  value: string;
  label: string;
  /** HRMS employee id — what the To-Do API takes as employee_ids. */
  hrmsEmployeeId: number | null;
  /** HRMS employee code (emp_id, e.g. "AP_MS0054"); HRMS shows "Staff" when it's empty. */
  code: string | null;
}

/**
 * Active employees (from the Marketing employee list) as dropdown options keyed by
 * HRMS username, for the DSR "Employee" picker and history filter. Loads only when `enabled`.
 */
export function useEmployeeOptions(enabled: boolean): EmployeeOption[] {
  const { showToast } = useApp();
  const [options, setOptions] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' })
      .then(res => {
        if (cancelled) return;
        setOptions(
          (res.employees || [])
            .filter(e => e.username)
            .map(e => ({
              value: e.username as string,
              label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || (e.username as string),
              hrmsEmployeeId: e.id ?? null, // this list is proxied from HRMS, so id is the HRMS employee id
              code: e.employee_id ?? null,
            }))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
        showToast('Could not load employees', 'error');
      });
    return () => { cancelled = true; };
  }, [enabled, showToast]);

  return options;
}
