"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (!email.includes("@")) {
        setError("Veuillez entrer une adresse email valide.");
        return;
      }
      setSent(true);
      setCooldown(60);
    }, 600);
  };

  return (
    <div className="w-full">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </Link>

      <h1 className="font-display text-3xl font-bold text-foreground">
        Réinitialiser votre mot de passe
      </h1>
      <p className="mt-2 text-muted-foreground">
        Entrez votre email pour recevoir un lien de réinitialisation
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-success/30 bg-success/10 p-6">
          <CheckCircle2 className="mb-3 h-10 w-10 text-success" />
          <p className="font-medium text-foreground">Email envoyé !</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vérifiez votre boîte de réception à <strong>{email}</strong>.
          </p>
          {cooldown > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Nouvelle tentative dans {cooldown}s
            </p>
          )}
          <Button
            variant="secondary"
            className="mt-6 w-full"
            disabled={cooldown > 0}
            onClick={() => {
              setSent(false);
              setCooldown(0);
            }}
          >
            Renvoyer le lien
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.cm"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>
      )}
    </div>
  );
}
