import { apiFetch } from "@/lib/api/mock-wrapper";
import { getAccessToken } from "@/lib/auth/session";
import { API_BASE, ApiError, unwrapApiData } from "@/lib/api/client";
import { shouldInvalidateSession } from "@/lib/auth/session-guard";
import { invalidateSession } from "@/lib/auth/invalidate-session";
import type { AdminUserDetail } from "@/lib/api/types/admin";

export type AccountProfile = {
  id: string;
  username: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  roles?: string[];
};

export function fetchMyAccount(options?: { redirectOnAuthFailure?: boolean }) {
  return apiFetch<AccountProfile>("/api/v1/account", {}, true, {
    redirectOnAuthFailure: options?.redirectOnAuthFailure ?? true,
  });
}

export function updateMyAccount(body: {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
}) {
  return apiFetch<AccountProfile>("/api/v1/account", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function changeMyPassword(currentPassword: string, newPassword: string) {
  return apiFetch<void>("/api/v1/account/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function uploadMyProfilePicture(file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/api/v1/account/picture`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    const message =
      typeof body.detail === "string"
        ? body.detail
        : "Session expirée. Veuillez vous reconnecter.";
    if (shouldInvalidateSession(401, body, message)) {
      invalidateSession(true, message);
    }
    throw new ApiError(message, 401);
  }
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? body?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return;
  const text = await res.text();
  if (text?.trim()) {
    unwrapApiData(JSON.parse(text));
  }
}

export type { AdminUserDetail };
