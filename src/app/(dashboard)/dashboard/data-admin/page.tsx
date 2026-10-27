"use client";

import { useState, useEffect } from "react";
import { Database, Trash2, RefreshCw, Download, Upload, Info } from "lucide-react";
import {
  getMockDatabase,
  loadMockDatabase,
  MOCK_STORAGE_KEY,
  resetMockDatabase,
  saveMockDatabase,
  seedExtendedMockDatabase,
  type MockDatabase,
  type SeedConfig,
} from "@/lib/mock-store";

// Cette page alimentait une clé (« fleetman_massive_data ») que rien ne lisait : les
// données générées n'apparaissaient nulle part. Elle pilote désormais la vraie base
// du mode démo (MOCK_STORAGE_KEY), dont les données respectent les règles métier
// (statuts valides, aucun engagement simultané d'un véhicule ou d'un conducteur).
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export default function DataAdminPage() {
  const [dataInfo, setDataInfo] = useState<MockDatabase | null>(null);
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState<Required<SeedConfig>>({
    vehicles: 80,
    fleets: 10,
    drivers: 120,
    trips: 250,
    assignments: 100,
    incidents: 80,
    maintenances: 100,
    fuelRecharges: 200,
  });

  useEffect(() => {
    loadDataInfo();
  }, []);

  function loadDataInfo() {
    setDataInfo(loadMockDatabase());
  }

  async function handleGenerate() {
    setGenerating(true);

    // Simuler un délai pour montrer l'animation
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      seedExtendedMockDatabase(config);
      localStorage.setItem("fleetman_extended_data", "true");
      loadDataInfo();
      alert("✅ Données de démo générées : rechargez les pages du tableau de bord pour les voir.");
    } catch (error) {
      alert("❌ Erreur lors de la génération des données");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  }

  function handleClear() {
    if (confirm("⚠️ Remplacer les données actuelles par le jeu de démo par défaut ?")) {
      resetMockDatabase();
      localStorage.removeItem("fleetman_extended_data");
      loadDataInfo();
      alert("✅ Jeu de démo par défaut restauré !");
    }
  }

  function handleExport() {
    const data = loadMockDatabase();
    if (!data) {
      alert("⚠️ Aucune donnée à exporter");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleetman-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as MockDatabase;
        if (!Array.isArray(data.vehicles) || !Array.isArray(data.trips)) {
          throw new Error("Format inattendu : export de la base de démo FleetMan attendu.");
        }
        saveMockDatabase(data);
        // Rechargement via la migration : statuts et chevauchements sont normalisés.
        getMockDatabase();
        loadDataInfo();
        alert("✅ Données importées avec succès !");
      } catch (error) {
        alert("❌ Erreur lors de l'import du fichier");
        console.error(error);
      }
    };
    reader.readAsText(file);
  }

  const storageSize = dataInfo
    ? (JSON.stringify(dataInfo).length / 1024 / 1024).toFixed(2)
    : "0";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Administration des Données Mock</h1>
          </div>
          <p className="text-muted-foreground">
            Gérez les données massives stockées dans le localStorage pour tester l&apos;interface avec un volume réaliste
          </p>
        </div>

        {!USE_MOCK && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Le mode démo est désactivé (<code>NEXT_PUBLIC_USE_MOCK=false</code>) : l&apos;application lit le
            backend, ces données locales ne seront pas affichées.
          </div>
        )}

        {/* Info Card */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Pourquoi des données massives ?</p>
              <p>
                Pour tester l&apos;interface avec un volume réaliste de données (pagination, filtres, performance, etc.). 
                Les données sont générées aléatoirement et stockées dans le localStorage de votre navigateur.
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {dataInfo ? (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">📊 Données Actuelles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="rounded-lg bg-primary/5 p-3">
                <div className="text-2xl font-bold text-primary">{dataInfo.vehicles?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Véhicules</div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <div className="text-2xl font-bold text-primary">{dataInfo.drivers?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Conducteurs</div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <div className="text-2xl font-bold text-primary">{dataInfo.trips?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Trajets</div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <div className="text-2xl font-bold text-primary">{dataInfo.incidents?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Incidents</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{dataInfo.assignments?.length || 0} affectations · clé <code>{MOCK_STORAGE_KEY}</code></span>
              <span>Taille : {storageSize} MB</span>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucune donnée massive</h3>
            <p className="text-muted-foreground">
              Générez des données massives pour tester l&apos;interface avec un volume réaliste
            </p>
          </div>
        )}

        {/* Configuration */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">⚙️ Configuration de Génération</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(config).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-foreground mb-1 capitalize">
                  {key === "vehicles" ? "Véhicules" :
                   key === "fleets" ? "Flottes" :
                   key === "drivers" ? "Conducteurs" :
                   key === "trips" ? "Trajets" :
                   key === "assignments" ? "Affectations" :
                   key === "incidents" ? "Incidents" :
                   key === "fuelRecharges" ? "Pleins carburant" :
                   key === "maintenances" ? "Maintenances" : key}
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={value}
                  onChange={(e) => setConfig({ ...config, [key]: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            💡 <strong>Astuce :</strong> Commencez avec 50-100 entrées par type pour tester rapidement, puis augmentez progressivement
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Database className="h-5 w-5" />
                Générer Données
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={!dataInfo}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-destructive text-destructive px-4 py-3 font-medium hover:bg-destructive hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-5 w-5" />
            Réinitialiser
          </button>

          <button
            onClick={handleExport}
            disabled={!dataInfo}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-border text-foreground px-4 py-3 font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5" />
            Exporter JSON
          </button>

          <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-border text-foreground px-4 py-3 font-medium hover:bg-muted transition-colors cursor-pointer">
            <Upload className="h-5 w-5" />
            Importer JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-3">📝 Instructions</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Configurez le nombre d&apos;entrées à générer pour chaque type de données</li>
            <li>Cliquez sur <strong>« Générer Données »</strong> pour créer et sauvegarder les données dans le localStorage</li>
            <li>Naviguez dans les différentes sections du dashboard pour voir les données massives</li>
            <li>Testez la pagination, les filtres et les performances avec un volume réaliste</li>
            <li>Utilisez <strong>« Exporter JSON »</strong> pour sauvegarder une copie des données</li>
            <li>Utilisez <strong>« Réinitialiser »</strong> pour revenir au jeu de démo par défaut</li>
          </ol>
        </div>

        {/* Recommendations */}
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-900 mb-2">✅ Recommandations pour les Tests</h3>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• <strong>Pagination :</strong> Générez 100+ véhicules pour tester l&apos;affichage paginé</li>
            <li>• <strong>Filtres :</strong> Avec 250+ trajets, testez les filtres par statut, date, etc.</li>
            <li>• <strong>Performance :</strong> Observez le temps de chargement avec 500+ entrées</li>
            <li>• <strong>Recherche :</strong> Testez la recherche avec 120+ conducteurs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
