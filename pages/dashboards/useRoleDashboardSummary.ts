import { useEffect, useState } from 'react';
import { marketingAPI, RoleDashboardSummary } from '../../lib/marketing-api';
import { ApiError } from '../../lib/api';

export function useRoleDashboardSummary() {
  const [data, setData] = useState<RoleDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    marketingAPI
      .getRoleDashboardSummary()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
