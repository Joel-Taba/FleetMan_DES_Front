/**
 * Pont entre le code non-React (apiFetch, invalidateSession…) et le composant
 * <ReauthModal /> monté à la racine de l'application (voir AuthProvider).
 *
 * Le renouvellement de session est désormais silencieux dans l'immense
 * majorité des cas via le vrai refresh token Kernel (rotatif, ~14j de
 * validité — voir lib/auth/refresh.ts). Ce modal n'est plus qu'un filet de
 * sécurité : il n'apparaît que si ce renouvellement silencieux échoue
 * (refresh token lui-même expiré/révoqué, typiquement après une longue
 * inactivité). Dans ce cas, on demande à l'utilisateur de ressaisir son mot
 * de passe EN PLACE (sans quitter la page, sans perdre son contexte de
 * navigation) — bien plus doux qu'une redirection brutale vers /login.
 */

type Listener = (open: boolean, reason?: string) => void;

let listener: Listener | null = null;
let pendingResolvers: Array<(ok: boolean) => void> = [];
let isOpen = false;

export function registerReauthListener(fn: Listener): void {
  listener = fn;
}

export function unregisterReauthListener(fn: Listener): void {
  if (listener === fn) listener = null;
}

/**
 * Ouvre (ou maintient ouvert) le dialogue de reconnexion et retourne une promesse
 * résolue à `true` si l'utilisateur s'est reconnecté avec succès, `false` s'il a
 * annulé ou si aucun dialogue n'est monté.
 */
export function requestReauth(reason?: string): Promise<boolean> {
  if (!listener) return Promise.resolve(false);
  isOpen = true;
  listener(true, reason);
  return new Promise<boolean>((resolve) => {
    pendingResolvers.push(resolve);
  });
}

export function isReauthPromptOpen(): boolean {
  return isOpen;
}

/** Appelé par <ReauthModal /> à la fermeture (succès ou annulation). */
export function resolveReauth(ok: boolean): void {
  isOpen = false;
  listener?.(false);
  const resolvers = pendingResolvers;
  pendingResolvers = [];
  resolvers.forEach((resolve) => resolve(ok));
}
