import { PageHeader } from "../PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  description?: string;
  backHref?: string;
};

export function PlaceholderPage({
  title,
  description = "Cette page sera implémentée dans la prochaine itération avec connexion API.",
  backHref,
}: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl">🚧</p>
          <p className="mt-4 max-w-md text-muted-foreground">{description}</p>
          {backHref && (
            <Link href={backHref} className="mt-6 text-sm text-primary hover:underline">
              ← Retour au tableau de bord
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
