/**
 * Auth API client for workspace authentication
 */

const getApiBaseUrl = (): string => {
  // Use the same base URL as storage backend
  const envUrl = import.meta.env.VITE_APP_HTTP_STORAGE_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }
  // Fallback to same origin
  return `${window.location.origin}/api/v2`;
};

export interface AuthStatus {
  oidcConfigured: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Check if OIDC is configured on the backend
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await fetch(`${getApiBaseUrl()}/auth/status`, {
    credentials: "include",
  });
  return response.json();
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    return response.json();
  } catch {
    return null;
  }
}

/**
 * Get login URL - redirects to OIDC provider
 */
export function getLoginUrl(redirectPath?: string): string {
  const baseUrl = getApiBaseUrl();
  const redirect = redirectPath || window.location.pathname;
  return `${baseUrl}/auth/login?redirect=${encodeURIComponent(redirect)}`;
}

/**
 * Get logout URL
 */
export function getLogoutUrl(): string {
  return `${getApiBaseUrl()}/auth/logout`;
}

/**
 * Redirect to login
 */
export function redirectToLogin(redirectPath?: string): void {
  window.location.href = getLoginUrl(redirectPath);
}

/**
 * Logout the current user
 */
export function logout(): void {
  window.location.href = getLogoutUrl();
}
