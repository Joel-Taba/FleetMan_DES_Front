import { clearSession } from "@/lib/auth/session";
import { requestReauth } from "@/lib/auth/reauth-bus";
import { refreshAccessToken } from "@/lib/auth/refresh";

/**
 * Réagit à une session invalide (JWT expiré / refusé par le backend).
 *
 * Le Kernel fournit désormais un vrai refresh token distinct de l'access token
 * (rotatif, ~14j de validité) — on tente donc d'abord un renouvellement 100%
 * silencieux via ce refresh token. Ce n'est que si ce renouvellement échoue
 * (refresh token lui-même expiré/révoqué, session vraiment invalide) qu'on
 * propose la reconnexion EN PLACE via <ReauthModal />, et qu'en tout dernier
 * recours qu'on efface la session et redirige vers /login.
 */
export function invalidateSession(redirect = true, reason?: string): void {
  if (typeof window === "undefined") {
    clearSession();
    return;
  }

  void refreshAccessToken().then((refreshed) => {
    if (refreshed) {
      // Nouveau token déjà en session : l'utilisateur n'a rien vu passer.
      return;
    }

    void requestReauth(reason).then((reconnected) => {
      if (reconnected) {
        // Session mise à jour en place par le modal : rien d'autre à faire, la page
        // courante n'a jamais bougé.
        return;
      }
      clearSession();
      if (redirect) {
        const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
        window.location.replace(`/login${params}`);
      }
    });
  });
}
