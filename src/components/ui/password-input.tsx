"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<typeof Input>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("Masquer le mot de passe") : t("Afficher le mot de passe")}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
