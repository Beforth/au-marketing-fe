export type MarketingScopeRole = 'super_admin' | 'domain_head' | 'region_head' | 'employee' | 'self';

export interface MarketingScope {
  role: MarketingScopeRole;
  domain_id?: number;
  region_id?: number;
  region_ids?: number[];
  employee_id?: number;
  user_id?: number;
}

const MARKETING_SCOPE_KEY = 'marketing_scope';

export const getStoredMarketingScope = (): MarketingScope | null => {
  try {
    const raw = localStorage.getItem(MARKETING_SCOPE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as MarketingScope;
  } catch {
    return null;
  }
};

export const setStoredMarketingScope = (scope: MarketingScope | null): void => {
  if (!scope) {
    localStorage.removeItem(MARKETING_SCOPE_KEY);
    return;
  }
  localStorage.setItem(MARKETING_SCOPE_KEY, JSON.stringify(scope));
};

export const clearStoredMarketingScope = (): void => {
  localStorage.removeItem(MARKETING_SCOPE_KEY);
};
