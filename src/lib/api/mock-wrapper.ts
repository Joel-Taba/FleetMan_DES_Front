import { MockApiProvider } from "@/lib/mock-api-provider";
import { authenticateMockUser } from "@/lib/mock-store";
import {
  API_BASE,
  ApiError,
  apiFetch as realApiFetch,
  apiFetchFormData as realApiFetchFormData,
  loginRequest as realLoginRequest,
  forgotPasswordRequest as realForgotPasswordRequest,
  resetPasswordRequest as realResetPasswordRequest,
  type ApiFetchOptions,
} from "./client";
import { isOfflineModeEnabled, offlineApiFetch, type OfflineFetchOptions } from "@/lib/offline/api-client";
import type { LoginPayload } from "@/lib/auth/types";
import { getAccessToken } from "@/lib/auth/session";
import { shouldInvalidateSession } from "@/lib/auth/session-guard";
import { invalidateSession } from "@/lib/auth/invalidate-session";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type UploadFileResponse = {
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & OfflineFetchOptions = {},
  auth = true,
  fetchOptions: ApiFetchOptions = {}
): Promise<T> {
  if (USE_MOCK && typeof window !== "undefined") {
    const method = options.method?.toUpperCase() || "GET";

    try {
      switch (method) {
        case "GET":
          return (await MockApiProvider.get(path)) as T;
        case "POST": {
          const postBody = options.body ? JSON.parse(options.body as string) : {};
          return (await MockApiProvider.post(path, postBody)) as T;
        }
        case "PUT": {
          const putBody = options.body ? JSON.parse(options.body as string) : {};
          return (await MockApiProvider.put(path, putBody)) as T;
        }
        case "PATCH": {
          const patchBody = options.body ? JSON.parse(options.body as string) : undefined;
          return (await MockApiProvider.patch(path, patchBody)) as T;
        }
        case "DELETE":
          return (await MockApiProvider.delete(path)) as T;
        default:
          return (await MockApiProvider.get(path)) as T;
      }
    } catch (error) {
      console.error("[MOCK] Error:", error);
      throw error;
    }
  }

  return isOfflineModeEnabled()
    ? offlineApiFetch<T>(path, { ...options, auth })
    : realApiFetch<T>(path, options, auth, fetchOptions);
}

export async function apiFetchFormData<T>(
  path: string,
  form: FormData,
  auth = true,
  fetchOptions: import("./client").ApiFetchOptions = {}
): Promise<T> {
  if (USE_MOCK && typeof window !== "undefined") {
    // Mock n'implémente pas multipart : no-op success
    return undefined as T;
  }
  return realApiFetchFormData<T>(path, form, auth, fetchOptions);
}

export async function apiUploadFile(
  file: File,
  category = "document"
): Promise<UploadFileResponse> {
  if (USE_MOCK && typeof window !== "undefined") {
    return MockApiProvider.upload(file, category);
  }

  const form = new FormData();
  form.append("file", file);
  const token = getAccessToken();
  const res = await fetch(
    `${API_BASE}/api/v1/files/upload?category=${encodeURIComponent(category)}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  );

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

  // Un 2xx peut légitimement arriver avec un corps vide (204, Content-Length: 0,
  // ou une réponse tronquée) — appeler res.json() sans garde fait planter
  // JSON.parse("") ("unexpected end of data") au lieu de renvoyer une erreur
  // exploitable par l'appelant.
  if (res.status === 204) {
    throw new ApiError("Réponse vide du serveur lors de l'upload.", res.status);
  }
  const contentLength = res.headers.get("content-length");
  if (contentLength === "0") {
    throw new ApiError("Réponse vide du serveur lors de l'upload.", res.status);
  }
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new ApiError("Réponse vide du serveur lors de l'upload.", res.status);
  }
  return JSON.parse(text) as UploadFileResponse;
}

export async function loginRequest(payload: LoginPayload) {
  if (USE_MOCK && typeof window !== "undefined") {
    const session = authenticateMockUser(payload.identifier, payload.password);
    if (!session) {
      throw new ApiError("Identifiants invalides. Vérifiez votre email et mot de passe.", 401);
    }
    return session;
  }
  return realLoginRequest(payload);
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  if (USE_MOCK && typeof window !== "undefined") {
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  return realForgotPasswordRequest(email);
}

export async function resetPasswordRequest(
  resetToken: string,
  newPassword: string
): Promise<void> {
  if (USE_MOCK && typeof window !== "undefined") {
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  return realResetPasswordRequest(resetToken, newPassword);
}

export { API_BASE, ApiError, type ApiFetchOptions };
