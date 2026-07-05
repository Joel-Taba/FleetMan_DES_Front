import type { AuthApiResponse, LoginPayload } from "@/lib/auth/types";
import type { UserRole } from "@/lib/types";
import { clearSession, getAccessToken } from "@/lib/auth/session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.detail ?? body?.message ?? body?.error ?? `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Token expiré ou non authentifié → vider la session et rediriger vers le login
  if (res.status === 401 && auth) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    throw new ApiError("Session expirée. Veuillez vous reconnecter.", 401);
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function mapAuthResponse(data: AuthApiResponse) {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      phone: data.user.phone,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      roles: data.user.roles as UserRole[],
      photoUrl: data.user.photoUrl,
    },
  };
}

export async function loginRequest(payload: LoginPayload) {
  const data = await apiFetch<AuthApiResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    false
  );
  return mapAuthResponse(data);
}

export { API_BASE };
