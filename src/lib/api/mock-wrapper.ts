import { MockApiProvider } from "@/lib/mock-api-provider";
import { authenticateMockUser } from "@/lib/mock-store";
import {
  API_BASE,
  ApiError,
  apiFetch as realApiFetch,
  loginRequest as realLoginRequest,
} from "./client";
import type { LoginPayload } from "@/lib/auth/types";
import { getAccessToken } from "@/lib/auth/session";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type UploadFileResponse = {
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true
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

  return realApiFetch<T>(path, options, auth);
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
    const { clearSession } = await import("@/lib/auth/session");
    clearSession();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    throw new ApiError("Session expirée. Veuillez vous reconnecter.", 401);
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

  return res.json() as Promise<UploadFileResponse>;
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

export { API_BASE, ApiError };
