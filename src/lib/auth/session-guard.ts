import { getAccessToken, isAccessTokenExpired } from "@/lib/auth/session";

/**
 * Détermine si une réponse API doit invalider la session globale.
 * Un 403 « accès refusé » sur une ressource ne doit PAS déconnecter l'utilisateur.
 */
export function shouldInvalidateSession(
  status: number,
  body: Record<string, unknown>,
  message: string
): boolean {
  const code = typeof body.code === "string" ? body.code : "";

  if (code === "AUTH_005" || code === "AUTH_002" || code === "AUTH_003") {
    return true;
  }

  if (/session.*expir|token.*expir|jeton.*expir|reconnect/i.test(message)) {
    return true;
  }

  if (status === 401) {
    return isAccessTokenExpired(getAccessToken());
  }

  return false;
}
