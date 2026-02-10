/**
 * Error thrown by API client when response is not ok. Callers can check status (e.g. 403) to avoid retries.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Format API error body (e.g. FastAPI validation { detail: [...] }) into a single message for toast.
 */
function formatApiError(body: any, status: number): string {
  if (!body || typeof body !== 'object') {
    return `Request failed (${status})`;
  }
  const detail = body.detail;
  if (detail == null) {
    return (body.error || body.message || `Request failed (${status})`) as string;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail.map((d: { msg?: string; loc?: (string | number)[] }) => {
      const loc = d.loc && d.loc.length ? d.loc.join('.') : '';
      const msg = d.msg || 'Invalid value';
      return loc ? `${loc}: ${msg}` : msg;
    });
    return parts.join('. ');
  }
  return `Request failed (${status})`;
}

/**
 * API Configuration and Base Client
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';
const HRMS_RBAC_API_URL = import.meta.env.VITE_HRMS_RBAC_API_URL || 'https://hrms.aureolegroup.com/api/rbac';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  HRMS_RBAC_URL: HRMS_RBAC_API_URL,
  TIMEOUT: 10000,
};

/**
 * API Client with authentication
 */
class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'Accept': 'application/json',
      ...options.headers,
    };

    // Always get the latest token from localStorage in case it was updated
    const currentToken = this.token || localStorage.getItem('auth_token');
    if (currentToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Clear token
        this.setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user_data');
        localStorage.removeItem('auth_login_time');
        
        // Dispatch custom event for Redux to handle
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
        
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: response.statusText }));
        const message = formatApiError(body, response.status);
        throw new ApiError(response.status, message, body);
      }

      // 204 No Content has no body — do not parse as JSON
      if (response.status === 204) {
        return undefined as T;
      }
      const text = await response.text();
      if (!text || text.trim() === '') {
        return undefined as T;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /** GET and return response as Blob (e.g. for file download). */
  async getBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    const currentToken = this.token || localStorage.getItem('auth_token');
    const headers: HeadersInit = { ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) };
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(response.statusText || 'Download failed');
    return response.blob();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient(API_CONFIG.BASE_URL);
