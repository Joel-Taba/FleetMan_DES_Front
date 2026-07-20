"use client";

function formatPayload(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type ConflictDiffViewProps = {
  localPayload?: unknown;
  serverState?: unknown;
};

export function ConflictDiffView({ localPayload, serverState }: ConflictDiffViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border bg-muted/20 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Version locale
        </p>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">
          {formatPayload(localPayload)}
        </pre>
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
          Version serveur
        </p>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">
          {formatPayload(serverState)}
        </pre>
      </div>
    </div>
  );
}
