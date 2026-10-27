"use client";

import type { ImgHTMLAttributes, ReactNode } from "react";
import { useSecureFileUrl } from "@/lib/files/secure-file";
import { cn } from "@/lib/utils";

type SecureImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** Affiché pendant le chargement ou si le fichier est inaccessible. */
  fallback?: ReactNode;
};

/** <img> pour les fichiers servis par le back (protégés par Bearer) ou toute autre URL. */
export function SecureImage({ src, fallback, alt = "", className, ...rest }: SecureImageProps) {
  const resolved = useSecureFileUrl(src);
  if (!resolved) {
    return fallback !== undefined ? <>{fallback}</> : <div className={cn("bg-muted", className)} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} alt={alt} className={className} {...rest} />;
}
