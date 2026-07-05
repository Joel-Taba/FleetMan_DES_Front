"use client";

import { useEffect, useState } from "react";
import { Database, X } from "lucide-react";
import { loadMockDatabase, MOCK_STORAGE_KEY, seedExtendedMockDatabase } from "@/lib/mock-store";

export function MassiveDataInitializer() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    const existingData = loadMockDatabase();
    const hasDeclined = localStorage.getItem("fleetman_declined_massive_data");
    const isExtended = (existingData?.vehicles.length ?? 0) > 20;

    if (!isExtended && !hasDeclined) {
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, []);

  async function handleInitialize() {
    setInitializing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      seedExtendedMockDatabase({
        vehicles: 80,
        fleets: 10,
        drivers: 120,
        trips: 250,
        assignments: 100,
        incidents: 80,
        maintenances: 100,
        fuelRecharges: 200,
      });
      localStorage.setItem("fleetman_extended_data", "true");

      setShowPrompt(false);
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de l'initialisation :", error);
      alert("Erreur lors de l'initialisation des données");
    } finally {
      setInitializing(false);
    }
  }

  function handleDecline() {
    localStorage.setItem("fleetman_declined_massive_data", "true");
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card shadow-2xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Données de test étendues
            </h2>
            <p className="text-sm text-muted-foreground">
              Charger un volume important de données (80 véhicules, 120 conducteurs, 250 trajets…)
              dans le navigateur pour tester l&apos;interface ?
            </p>
          </div>
          <button
            onClick={handleDecline}
            className="text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <p className="font-semibold mb-1">Contenu généré :</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>80 véhicules avec statuts variés</li>
            <li>120 conducteurs</li>
            <li>250 trajets</li>
            <li>100 affectations (dont conflits)</li>
            <li>80 incidents et 200 recharges carburant</li>
          </ul>
          <p className="mt-2 text-xs">
            Clé localStorage : <code>{MOCK_STORAGE_KEY}</code>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleInitialize}
            disabled={initializing}
            type="button"
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initializing ? "Génération..." : "Oui, charger les données"}
          </button>
          <button
            onClick={handleDecline}
            type="button"
            className="flex-1 rounded-lg border-2 border-border px-4 py-2.5 text-foreground font-medium hover:bg-muted transition-colors"
          >
            Non merci
          </button>
        </div>

        <p className="mt-3 text-xs text-center text-muted-foreground">
          Un jeu de données standard est déjà chargé au démarrage. Cette option remplace par un volume plus large.
        </p>
      </div>
    </div>
  );
}

