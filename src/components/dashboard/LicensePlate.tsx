import { cn } from "@/lib/utils";

export function LicensePlate({
  plate,
  className,
}: {
  plate: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded border-2 border-black bg-[#F5D547] px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-black",
        className
      )}
    >
      {plate}
    </span>
  );
}
