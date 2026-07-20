import type { AuthPayload, LoginPayload } from "@/lib/auth/types";
import type { UserRole } from "@/lib/types";
import { getAccessToken, getSession, canRefreshSession, syncSessionRolesFromToken } from "@/lib/auth/session";
import { refreshAccessToken, tryProactiveRefresh } from "@/lib/auth/refresh";
import { shouldInvalidateSession } from "@/lib/auth/session-guard";
import { invalidateSession } from "@/lib/auth/invalidate-session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Enveloppe common-core `{ success, message, data, timestamp }`. */
type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
};

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    typeof (value as ApiEnvelope<unknown>).success === "boolean"
  );
}

/**
 * Déballe `response.data` lorsque le backend renvoie une ApiResponse,
 * sans casser les endpoints qui renvoient encore le payload brut.
 */
export function unwrapApiData<T>(body: T | ApiEnvelope<T>): T {
  if (isApiEnvelope(body)) {
    if (body.success === false) {
      throw new ApiError(body.message ?? "Erreur API", 400);
    }
    return body.data as T;
  }
  return body as T;
}

async function parseErrorBody(res: Response): Promise<Record<string, unknown>> {
  try {
    const body = await res.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function errorMessageFromBody(status: number, body: Record<string, unknown>): string {
  const detail = body.detail ?? body.message ?? body.error;
  return typeof detail === "string" ? detail : `Erreur ${status}`;
}

function isAuthFailure(status: number, body: Record<string, unknown>, message: string): boolean {
  return shouldInvalidateSession(status, body, message);
}

async function fetchWithOptionalRefresh(
  path: string,
  options: RequestInit,
  auth: boolean
): Promise<Response> {
  if (auth) {
    syncSessionRolesFromToken();
    await tryProactiveRefresh();
  }
  const buildHeaders = () => {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    if (auth) {
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  };

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders() });

  let res = await doFetch();
  if (auth && res.status === 401 && getAccessToken()) {
    const session = getSession();
    if (session && canRefreshSession(session)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await doFetch();
      }
    }
  }
  return res;
}

export type ApiFetchOptions = {
  /** Redirige vers /login en cas d'échec d'authentification (défaut: true). */
  redirectOnAuthFailure?: boolean;
};

function handleAuthFailure(message: string, redirect: boolean): never {
  invalidateSession(redirect, message);
  throw new ApiError(message || "Session expirée. Veuillez vous reconnecter.", 401);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
  fetchOptions: ApiFetchOptions = {}
): Promise<T> {
  const redirectOnAuthFailure = fetchOptions.redirectOnAuthFailure ?? true;
  const res = await fetchWithOptionalRefresh(path, options, auth);

  if (!res.ok) {
    const body = await parseErrorBody(res);
    const message = errorMessageFromBody(res.status, body);
    if (auth && isAuthFailure(res.status, body, message)) {
      handleAuthFailure(message, redirectOnAuthFailure);
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  // Corps vide (ex. DELETE/PATCH void avec Content-Length 0)
  const contentLength = res.headers.get("content-length");
  if (contentLength === "0") return undefined as T;
  const text = await res.text();
  if (!text || !text.trim()) return undefined as T;
  const body = JSON.parse(text);
  return unwrapApiData<T>(body);
}

function mapAuthResponse(data: AuthPayload) {
  const clean = (value?: string | null) => (value && value !== "null" ? value : "");
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      id: data.user.id,
      username: clean(data.user.username) || data.user.email?.split("@")[0] || data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      firstName: clean(data.user.firstName),
      lastName: clean(data.user.lastName),
      roles: data.user.roles as UserRole[],
      photoUrl: data.user.photoUrl,
    },
  };
}

export async function loginRequest(payload: LoginPayload) {
  // apiFetch déballe déjà ApiResponse → AuthPayload
  const data = await apiFetch<AuthPayload>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    false
  );
  return mapAuthResponse(data);
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiFetch<unknown>(
    "/api/v1/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    false
  );
}

export async function resetPasswordRequest(
  resetToken: string,
  newPassword: string
): Promise<void> {
  await apiFetch<unknown>(
    "/api/v1/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ resetToken, newPassword }),
    },
    false
  );
}

/** POST multipart/form-data (ne force pas Content-Type JSON). */
export async function apiFetchFormData<T>(
  path: string,
  form: FormData,
  auth = true,
  fetchOptions: ApiFetchOptions = {}
): Promise<T> {
  const redirectOnAuthFailure = fetchOptions.redirectOnAuthFailure ?? true;
  const buildHeaders = () => {
    const headers = new Headers();
    if (auth) {
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  };

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      body: form,
    });

  let res = await doFetch();
  if (auth && res.status === 401 && getAccessToken()) {
    const session = getSession();
    if (session && canRefreshSession(session)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await doFetch();
      }
    }
  }

  if (!res.ok) {
    const body = await parseErrorBody(res);
    const message = errorMessageFromBody(res.status, body);
    if (auth && isAuthFailure(res.status, body, message)) {
      handleAuthFailure(message, redirectOnAuthFailure);
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  const contentLength = res.headers.get("content-length");
  if (contentLength === "0") return undefined as T;
  const text = await res.text();
  if (!text || !text.trim()) return undefined as T;
  return unwrapApiData<T>(JSON.parse(text));
}

export { API_BASE };
