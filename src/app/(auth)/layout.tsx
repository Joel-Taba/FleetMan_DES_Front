import Image from "next/image";
import { Logo } from "@/components/fleetman/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Image
        src="/assets/login-truck-highway.jpg"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        quality={75}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-fleet-dark/70 via-fleet-dark/55 to-primary/40" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Logo variant="light" href="/" prefetch={false} className="mb-6" />

        <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          © 2026 FleetMan. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
