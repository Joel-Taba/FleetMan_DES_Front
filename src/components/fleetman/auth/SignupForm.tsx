"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => checkPasswordStrength(password), [password]);
  const isStrong = strength.length && strength.upper && strength.digit;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accepted || !isStrong) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-bold text-foreground">
        Rejoignez FleetMan
      </h1>
      <p className="mt-2 text-muted-foreground">
        Créez votre compte gestionnaire de flotte
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" name="fullName" required placeholder="Jean Dupont" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Nom entreprise</Label>
          <Input
            id="company"
            name="company"
            required
            placeholder="Transport Express CM"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vous@entreprise.cm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="+237 6XX XX XX XX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Afficher le mot de passe"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {password && (
            <ul className="space-y-1 text-xs">
              {[
                { ok: strength.length, label: "8 caractères minimum" },
                { ok: strength.upper, label: "Une majuscule" },
                { ok: strength.digit, label: "Un chiffre" },
              ].map((rule) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1",
                    rule.ok ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {rule.ok ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
          />
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
            J&apos;accepte les{" "}
            <a href="#" className="text-primary hover:underline">
              CGU
            </a>{" "}
            et la{" "}
            <a href="#" className="text-primary hover:underline">
              politique de confidentialité
            </a>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !accepted || !isStrong}
        >
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
