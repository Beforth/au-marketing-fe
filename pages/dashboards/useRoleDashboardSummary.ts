import { useCallback, useEffect, useRef, useState } from 'react';
import { marketingAPI, RoleDashboardSummary } from '../../lib/marketing-api';
import { ApiError } from '../../lib/api';

export function useRoleDashboardSummary() {
  const [data, setData] = useState<RoleDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback((isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    return marketingAPI
      .getRoleDashboardSummary()
      .then((res) => {
        if (cancelledRef.current) return;
        setData(res);
        setLastUpdated(new Date());
      })
      .catch((e: unknown) => {
        if (cancelledRef.current) return;
        setError(e instanceof ApiError ? e.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (cancelledRef.current) return;
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      });
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    setData(null);
    load(false);
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, refreshing, error, lastUpdated, refresh };
}
