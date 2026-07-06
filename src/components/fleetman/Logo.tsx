import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showTagline?: boolean;
  variant?: "light" | "dark";
  /** Si défini, le logo devient un lien. Évite les <a> imbriqués si le parent est déjà un lien. */
  href?: string;
  /** Désactiver le prefetch Next.js (utile sur login pour éviter de précharger la page d'accueil). */
  prefetch?: boolean;
};

export function Logo({
  className,
  showTagline = true,
  variant = "dark",
  href,
  prefetch,
}: LogoProps) {
  const isLight = variant === "light";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/assets/logo-fleetMan.svg"
        alt="FleetMan"
        width={44}
        height={44}
        className="h-10 w-10 shrink-0 object-contain"
      />
      <div>
        <span
          className={cn(
            "font-display text-xl font-bold tracking-tight",
            isLight ? "text-white" : "text-foreground"
          )}
        >
          FleetMan
        </span>
        {showTagline && (
          <p
            className={cn(
              "text-xs",
              isLight ? "text-white/80" : "text-muted-foreground"
            )}
          >
            Votre flotte sous contrôle
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch={prefetch} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
