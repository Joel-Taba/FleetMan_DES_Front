"use client";

import { useEffect, useState } from "react";
import { apiFetchBlob } from "@/lib/api/client";
import { API_BASE } from "@/lib/api/mock-wrapper";
import { getSession } from "@/lib/auth/session";
import { resolveFileUrl } from "@/lib/documents";

// GET /api/v1/files/** exige un Bearer (documents KYC, permis, photos). Une balise
// <img>/<iframe> ou un lien ne peut pas l'envoyer : on télécharge le fichier avec le
// token et on l'affiche via une URL `blob:`. Les autres URL (assets, blob:, mock,
// fichiers en attente offline) sont rendues telles quelles.

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const FILES_PATH = "/api/v1/files/";

const cache = new Map<string, Promise<string>>();
let cacheOwner: string | null = null;

/** Chemin API du fichier s'il est servi (et protégé) par le back, sinon null. */
export function protectedFilePath(url?: string | null): string | null {
  if (USE_MOCK || !url) return null;
  const resolved = resolveFileUrl(url);
  if (resolved.startsWith(FILES_PATH)) return resolved;
  if (API_BASE && resolved.startsWith(`${API_BASE}${FILES_PATH}`)) {
    return resolved.slice(API_BASE.length);
  }
  return null;
}

function loadSecureFile(path: string): Promise<string> {
  // Le cache ne survit pas à un changement d'utilisateur dans l'onglet.
  const owner = getSession()?.user?.id ?? null;
  if (owner !== cacheOwner) {
    cache.forEach((pending) => pending.then(URL.revokeObjectURL, () => undefined));
    cache.clear();
    cacheOwner = owner;
  }
  let pending = cache.get(path);
  if (!pending) {
    pending = apiFetchBlob(path).then((blob) => URL.createObjectURL(blob));
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending;
}

/**
 * URL affichable d'un fichier : URL `blob:` pour un fichier protégé (null pendant le
 * chargement ou en cas d'échec), URL résolue pour tout le reste.
 */
export function useSecureFile(url?: string | null): { src: string | null; loading: boolean } {
  const path = protectedFilePath(url);
  const [loaded, setLoaded] = useState<{ path: string; src: string | null } | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    loadSecureFile(path).then(
      (src) => !cancelled && setLoaded({ path, src }),
      () => !cancelled && setLoaded({ path, src: null })
    );
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return { src: url ? resolveFileUrl(url) || null : null, loading: false };
  return loaded?.path === path
    ? { src: loaded.src, loading: false }
    : { src: null, loading: true };
}

export function useSecureFileUrl(url?: string | null): string | null {
  return useSecureFile(url).src;
}

/** Ouvre un fichier dans un nouvel onglet (à appeler depuis un gestionnaire de clic). */
export async function openSecureFile(url?: string | null): Promise<void> {
  if (!url) return;
  const path = protectedFilePath(url);
  if (!path) {
    window.open(resolveFileUrl(url), "_blank", "noopener,noreferrer");
    return;
  }
  // Ouvert avant l'attente réseau, sinon le bloqueur de popups l'intercepte.
  const win = window.open("", "_blank");
  try {
    const src = await loadSecureFile(path);
    if (win) win.location.href = src;
    else window.location.href = src;
  } catch (err) {
    win?.close();
    throw err;
  }
}
