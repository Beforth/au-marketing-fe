/**
 * Intranet app-switcher — the "leaving Marketing" direction of SSO.
 *
 * We already hold an HRMS token (from login). The switcher:
 *   1. lists the apps    GET  {HRMS origin}/intranet-app/         (Authorization: Token <ours>)
 *   2. on pick, mints a  POST {HRMS}/api/rbac/sso/generate/  { app_id }
 *      one-time pass  -> { token, redirect_url, expires_at }
 *   3. window.location.href = redirect_url
 *
 * Marketing builds nothing itself — it asks HRMS and redirects.
 */
import { API_CONFIG } from './api';
import { getStoredToken } from './auth-utils';
import { resolveHrmsMediaUrl } from './hrms-rbac';

/** HRMS origin (scheme + host), derived from the RBAC URL. */
const hrmsOrigin = (): string => {
  try {
    return new URL(API_CONFIG.HRMS_RBAC_URL).origin;
  } catch {
    return '';
  }
};

export interface IntranetApp {
  id: number;
  name: string;
  /** Absolute icon URL (resolved against HRMS origin), or null. */
  icon: string | null;
  url: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

/**
 * List the Intranet apps. Requires the `intranet.view` permission on the
 * current user's HRMS token — a 403 (or any error) resolves to `[]` so the
 * switcher simply stays hidden.
 */
export async function listIntranetApps(): Promise<IntranetApp[]> {
  const token = getStoredToken();
  const origin = hrmsOrigin();
  if (!token || !origin) return [];

  try {
    const res = await fetch(`${origin}/intranet-app/`, {
      headers: { Authorization: `Token ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as IntranetApp[])
      .filter((a) => a.is_active)
      .map((a) => ({ ...a, icon: resolveHrmsMediaUrl(a.icon) ?? null }))
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/** True when `appUrl`'s host matches the page we're on — i.e. this is the current app. */
export function isCurrentApp(appUrl: string): boolean {
  try {
    return new URL(appUrl).host === window.location.host;
  } catch {
    return false;
  }
}

export interface GenerateSSOResponse {
  token: string;
  redirect_url: string;
  expires_at?: string;
}

/**
 * Ask HRMS for a one-time pass + redirect URL for `appId`.
 * Throws with a human-readable message on 401/403/404/network error.
 */
export async function generateSSOToken(appId: number): Promise<GenerateSSOResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('You are not signed in.');

  let res: Response;
  try {
    res = await fetch(`${API_CONFIG.HRMS_RBAC_URL}/sso/generate/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ app_id: appId }),
    });
  } catch {
    throw new Error('Could not reach HRMS. Check your connection and try again.');
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      detail = d.detail || d.error || detail;
    } catch {
      // keep the status-code message
    }
    if (res.status === 403) detail = "You don't have permission to switch apps.";
    if (res.status === 401) detail = 'Your session expired. Sign in again.';
    if (res.status === 404) detail = 'That app is not available.';
    throw new Error(detail);
  }

  return res.json();
}
