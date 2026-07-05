import { MockApiProvider } from "@/lib/mock-api-provider";
import { authenticateMockUser } from "@/lib/mock-store";
import {
  API_BASE,
  ApiError,
  apiFetch as realApiFetch,
  loginRequest as realLoginRequest,
} from "./client";
import type { LoginPayload } from "@/lib/auth/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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
