/** Détecte si le navigateur considère la connexion disponible. */
export function readBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export type OnlineListener = (online: boolean) => void;

/** Abonne aux événements online/offline du navigateur. */
export function subscribeOnlineStatus(listener: OnlineListener): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onOnline = () => listener(true);
  const onOffline = () => listener(false);

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
