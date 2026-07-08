"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "fr" | "en";

/**
 * Dictionnaire FR -> EN.
 * La clé est la chaîne française (canonique). En mode "fr" on renvoie la clé
 * telle quelle ; en mode "en" on renvoie la traduction si elle existe, sinon
 * la clé (français) en repli. Cela permet d'internationaliser progressivement
 * en enveloppant simplement les chaînes visibles avec `t("...")`.
 */
const EN: Record<string, string> = {
  // --- Navigation commune ---
  "Vue d'ensemble": "Overview",
  Administrateurs: "Administrators",
  Gestionnaires: "Managers",
  Référentiels: "References",
  "Tableau de bord": "Dashboard",
  Organisation: "Organization",
  Flottes: "Fleets",
  Véhicules: "Vehicles",
  Conducteurs: "Drivers",
  Trajets: "Trips",
  Plannings: "Schedules",
  Affectations: "Assignments",
  Incidents: "Incidents",
  Maintenances: "Maintenance",
  Carburant: "Fuel",
  "Dépenses & Budget": "Expenses & Budget",
  Géofencing: "Geofencing",
  Documents: "Documents",
  "KPI & Rapports": "KPIs & Reports",
  Notifications: "Notifications",
  "Mon compte": "My account",
  Accueil: "Home",
  "Mon véhicule": "My vehicle",
  Déclarations: "Declarations",
  Profil: "Profile",

  // --- Rôles ---
  "Super Administrateur": "Super Administrator",
  Administrateur: "Administrator",
  "Gestionnaire de flotte": "Fleet manager",
  Chauffeur: "Driver",

  // --- En-tête ---
  "4/10 objets utilisés": "4/10 objects used",
  Aide: "Help",
  "Mon profil": "My profile",
  "Centre d'aide": "Help center",

  // --- Actions / boutons génériques ---
  Rechercher: "Search",
  "Rechercher...": "Search...",
  Réinitialiser: "Reset",
  Annuler: "Cancel",
  Créer: "Create",
  Enregistrer: "Save",
  Modifier: "Edit",
  Supprimer: "Delete",
  Voir: "View",
  Publier: "Publish",
  Archiver: "Archive",
  "Voir profil": "View profile",
  "Voir le profil": "View profile",
  "Voir les détails": "View details",
  Précédent: "Previous",
  Suivant: "Next",
  "Export PDF": "Export PDF",
  "Export en cours…": "Exporting…",
  Période: "Period",
  "Toutes les périodes": "All periods",
  "Aujourd'hui": "Today",
  "Cette semaine": "This week",
  "Ce mois": "This month",
  "Cette année": "This year",
  "Période personnalisée": "Custom period",
  Du: "From",
  Au: "To",
  "Export CSV": "Export CSV",
  "Filtrer l'historique": "Filter history",
  "Affinez la liste par période et exportez vos données.":
    "Refine the list by period and export your data.",
  trajets: "trips",
  "trajet(s) affiché(s)": "trip(s) displayed",
  Actions: "Actions",
  Statut: "Status",
  Actif: "Active",
  Actifs: "Active",
  Inactifs: "Inactive",
  "Tous statuts": "All statuses",
  Tous: "All",
  Type: "Type",
  Flotte: "Fleet",
  "Toutes flottes": "All fleets",
  "Tous types": "All types",

  // --- Véhicules ---
  "Gérez l'ensemble de votre parc automobile.":
    "Manage your entire vehicle fleet.",
  "Enregistrer un véhicule": "Register a vehicle",
  Véhicule: "Vehicle",
  "En service": "In service",
  Maintenance: "Maintenance",
  "En mission": "On trip",
  "Hors service": "Out of service",

  // --- Conducteurs ---
  "Annuaire de vos chauffeurs et assignations.":
    "Directory of your drivers and assignments.",
  "Ajouter un conducteur": "Add a driver",
  Permis: "License",
  "Vue tableau": "Table view",
  "Vue grille": "Grid view",
  "En congé": "On leave",

  // --- Trajets ---
  "Historique et suivi temps réel.": "History and real-time tracking.",
  "Planifier un trajet": "Plan a trip",
  Historique: "History",
  "En cours": "Ongoing",
  "Temps réel": "Real-time",
  "Enregistrer le retour": "Register return",
  "Valider la photo": "Confirm photo",
  "Téléverser une photo": "Upload a photo",
  "Enregistrement…": "Saving…",
  "Aucun trajet en cours.": "No ongoing trips.",
  Départ: "Departure",
  Fin: "End",
  Distance: "Distance",
  "Carte temps réel": "Real-time map",
  "En direct": "Live",
  "Détails du trajet": "Trip details",
  "Itinéraire du trajet": "Trip route",

  // --- Plannings ---
  "Planifiez et publiez vos plannings.": "Plan and publish your schedules.",
  "Nouveau planning": "New schedule",
  Titre: "Title",

  // --- Admins / Managers ---
  "Administrateurs Système": "System administrators",
  "Gérez les comptes FLEET_ADMIN de la plateforme.":
    "Manage the platform's FLEET_ADMIN accounts.",
  "Ajouter un Admin": "Add an admin",
  Utilisateur: "User",
  "Date création": "Created on",
  "Gestionnaires de Flottes": "Fleet managers",
  "Supervisez les managers de votre tenant.":
    "Supervise your tenant's managers.",
  Manager: "Manager",
  Inscription: "Sign-up",
  "Fiche gestionnaire": "Manager profile",

  // --- Admin (FLEET_ADMIN) ---
  "Vue d'ensemble Admin": "Admin overview",
  "Ressources opérationnelles de votre organisation.":
    "Operational resources of your organization.",
  "Types véhicules": "Vehicle types",
  "Véhicules gérés": "Managed vehicles",
  "Aucun type de véhicule configuré.": "No vehicle type configured.",
  "5 dernières activités": "5 recent activities",
  "Raccourcis référentiels": "Reference shortcuts",
  "Types de véhicules": "Vehicle types",
  Marques: "Brands",
  Modèles: "Models",
  "Gérer les": "Manage",
  " — dernière connexion": " — last login",
  "gestionnaire(s)": "manager(s)",
  Désactiver: "Deactivate",
  Activer: "Activate",
  "Retour aux gestionnaires": "Back to managers",
  "Dernière connexion": "Last login",
  "Rôles & service": "Roles & service",
  "Service :": "Service:",
  "Gestion des Référentiels": "Reference management",
  "Types, marques, modèles et autres ressources de configuration.":
    "Types, brands, models and other configuration resources.",
  Constructeurs: "Manufacturers",
  Gabarits: "Sizes",
  Usages: "Usages",
  Carburants: "Fuels",
  Transmissions: "Transmissions",
  Couleurs: "Colors",
  "Nouvelle entrée": "New entry",
  Code: "Code",
  Libellé: "Label",
  "Supprimer cette entrée ?": "Delete this entry?",
  "Véhicules par type": "Vehicles by type",
  Ajouter: "Add",
  "ex: CAR": "e.g. CAR",
  "ex: Voiture": "e.g. Car",
  Éditer: "Edit",

  // --- Géofencing ---

  // --- Dashboard manager ---
  Bonjour: "Hello",
  "Centre de commandement — vue opérationnelle de vos flottes.":
    "Command center — operational view of your fleets.",
  "Chauffeurs dispo.": "Drivers avail.",
  "Alertes critiques": "Critical alerts",
  "Dernières activités": "Recent activity",
  "Chargement…": "Loading…",
  "Aucune activité récente.": "No recent activity.",
  "Planifier un service": "Schedule a service",
  "Déclarer un incident": "Report an incident",
  "Ajouter un véhicule": "Add a vehicle",
  "Conflits d'affectation": "Assignment conflicts",

  // --- Santé du parc ---
  "Santé du parc": "Fleet health",
  "Indicateur composite — disponibilité, conformité et maintenance":
    "Composite indicator — availability, compliance and maintenance",
  Excellent: "Excellent",
  Correct: "Fair",
  "Attention requise": "Needs attention",
  "Score global": "Overall score",
  "Disponibilité véhicules": "Vehicle availability",
  "Véhicules en service ou en mission": "Vehicles in service or on trip",
  "Conformité documents": "Document compliance",
  "Documents valides et à jour": "Valid and up-to-date documents",
  "En maintenance": "In maintenance",
  "Part du parc immobilisée": "Share of fleet immobilized",
  "Incidents ouverts": "Open incidents",
  "Le score global combine la disponibilité opérationnelle (40 %), la conformité documentaire (40 %) et l'absence de maintenance excessive (20 %).":
    "The overall score combines operational availability (40%), document compliance (40%) and low maintenance downtime (20%).",

  // --- Mon compte ---
  "Paramètres personnels et sécurité.": "Personal settings and security.",
  "Informations personnelles": "Personal information",
  Prénom: "First name",
  Nom: "Last name",
  Email: "Email",
  Téléphone: "Phone",
  "Changer la photo": "Change photo",
  Sécurité: "Security",
  "Ancien mot de passe": "Current password",
  "Nouveau mot de passe": "New password",
  Confirmer: "Confirm",
  "Mettre à jour le mot de passe": "Update password",
  "Préférences notifications": "Notification preferences",
  Push: "Push",
  "SMS — Incidents": "SMS — Incidents",
  "SMS — Documents": "SMS — Documents",
  "Désactiver mon compte": "Deactivate my account",
  "L'email est obligatoire.": "Email is required.",
  "Format requis : nom@domaine.com": "Required format: name@domain.com",
  "Format attendu : +237 6XX XX XX XX": "Expected format: +237 6XX XX XX XX",
  "Saisissez l'ancien mot de passe.": "Enter your current password.",
  "Mot de passe robuste requis : 8+ car., majuscule, minuscule, chiffre, symbole.":
    "Strong password required: 8+ chars, upper, lower, digit, symbol.",
  "Les mots de passe ne correspondent pas.": "Passwords do not match.",
  Robustesse: "Strength",
  Faible: "Weak",
  Moyen: "Medium",
  Robuste: "Strong",
  "Profil enregistré (démo)": "Profile saved (demo)",
  "Mot de passe mis à jour (démo)": "Password updated (demo)",

  // --- Véhicule détail ---
  Identité: "Identity",
  Financier: "Financial",
  Opérationnel: "Operational",
  "Marque / Modèle": "Brand / Model",
  "N° série": "Serial no.",
  Kilométrage: "Mileage",
  "Envoyer en maintenance": "Send to maintenance",
  "Expiration assurance": "Insurance expiry",
  "Coût/km": "Cost/km",
  "Dernière maintenance": "Last maintenance",
  "Prochaine échéance": "Next due",
  "État moteur": "Engine status",
  Vitesse: "Speed",
  Position: "Location",
  Places: "Seats",
  Couleur: "Color",
  Transmission: "Transmission",
  Assurance: "Insurance",
  "Documents — Identité": "Documents — Identity",
  "Documents — Financier": "Documents — Financial",
  "Documents — Maintenance": "Documents — Maintenance",
  "Documents — Opérationnel": "Documents — Operational",
  "Aucun document pour cet onglet.": "No documents for this tab.",
  "Aucun document rattaché à l'onglet opérationnel.": "No documents linked to the operational tab.",
  "Ouvrir le document": "Open document",
  "Aperçu indisponible": "Preview unavailable",
  Expiration: "Expiry",
  "Carte grise": "Registration card",
  "Contrôle technique": "Technical inspection",
  Vignette: "Tax sticker",
  "Permis transport": "Transport permit",
  "Permis de conduire": "Driving license",
  "Certificat médical": "Medical certificate",
  "Carte professionnelle": "Professional card",
  "Contrat de travail": "Employment contract",
  "Pièce d'identité": "ID document",
  Autre: "Other",
  Assurances: "Insurance",

  // --- Conducteur ---
  "Profil conducteur": "Driver profile",
  "Informations complémentaires": "Additional information",
  Identifiant: "Identifier",
  "Véhicule assigné": "Assigned vehicle",
  "Non assigné": "Unassigned",
  "Documents du conducteur": "Driver documents",
  "Aucun document enregistré pour ce conducteur.": "No documents registered for this driver.",
  "Nouveau conducteur": "New driver",
  "ON_LEAVE": "On leave",
  ACTIVE: "Active",
  INACTIVE: "Inactive",

  // --- Notifications ---
  "Fil d'actualité de votre flotte.": "Your fleet activity feed.",
  Toutes: "All",
  "Non lues": "Unread",
  "Marquer lues": "Mark as read",

  // --- Flottes ---
  "Mes Flottes": "My Fleets",
  "Organisez vos véhicules par flotte opérationnelle.":
    "Organize your vehicles by operational fleet.",
  "Créer une flotte": "Create a fleet",
  "Nouvelle flotte": "New fleet",
  "Nom *": "Name *",
  "Création…": "Creating…",
  "Rechercher par nom...": "Search by name...",
  "Créée le": "Created on",

  // --- Organisation ---
  "Profil Entreprise": "Company profile",
  "Informations de votre organisation et compte manager.":
    "Your organization and manager account information.",
  "Informations entreprise": "Company information",
  "Changer le logo": "Change logo",
  "Nom de l'entreprise": "Company name",
  "Sauvegarde…": "Saving…",
  "Sauvegarder les modifications": "Save changes",
  "Mes informations personnelles": "My personal information",
  "Gérer mon compte →": "Manage my account →",
  "Erreur lors de la sauvegarde": "Error while saving",

  // --- Documents & conformité ---
  "Documents & Conformité": "Documents & Compliance",
  "Centre de contrôle documentaire.": "Document control center.",
  "Conformité globale": "Overall compliance",
  "Total documents": "Total documents",
  Valides: "Valid",
  Expirés: "Expired",
  "Expiration imminente (≤30j)": "Expiring soon (≤30d)",
  "Aucun document.": "No documents.",
  "Expirés — action requise": "Expired — action required",
  "Aucun document expiré.": "No expired documents.",
  "Documents véhicules — consultez les détails par véhicule.":
    "Vehicle documents — see details per vehicle.",
  "Voir les véhicules": "View vehicles",
  "Documents conducteurs liés aux permis et certifications.":
    "Driver documents linked to licenses and certifications.",
  "Voir les conducteurs": "View drivers",

  // --- Affectations ---
  "Planning véhicule-chauffeur avec détection de conflits.":
    "Vehicle-driver scheduling with conflict detection.",
  "Nouvelle affectation": "New assignment",
  "Afficher uniquement les conflits": "Show conflicts only",
  Début: "Start",
  Conflit: "Conflict",
  Oui: "Yes",
  "conflit(s) d'affectation détecté(s)": "assignment conflict(s) detected",

  // --- KPI & Rapports ---
  "Indicateurs clés et rapports de performance.": "Key metrics and performance reports.",
  "Toutes les flottes": "All fleets",
  Journalier: "Daily",
  Hebdomadaire: "Weekly",
  Mensuel: "Monthly",
  "Taux d'utilisation": "Utilization rate",
  "Distance parcourue": "Distance traveled",
  "Coût au km": "Cost per km",
  "Consommation carburant": "Fuel consumption",
  "Taux d'incidents": "Incident rate",
  "Télécharger le rapport": "Download report",
  "Évolution distance & coûts": "Distance & cost trend",
  "Répartition des coûts": "Cost breakdown",

  // --- Opérations ---
  "Suivi des pleins et consommation.": "Fuel fill-ups and consumption tracking.",
  "Registre des opérations de maintenance.": "Maintenance operations register.",
  "Registre des incidents terrain.": "Field incidents register.",
  "Nouveau plein": "New fill-up",
  "Nouvel incident": "New incident",
  "Cliquez sur la carte pour affiner l'emplacement.": "Click the map to refine the location.",
  "Autocomplétion indisponible — saisissez le lieu manuellement ou cliquez sur la carte.":
    "Autocomplete unavailable — enter the place manually or click the map.",
  "Rechercher un lieu…": "Search for a place…",
  "Lieu de retour": "Return location",

  // --- Super Admin ---
  "Plans tarifaires": "Pricing plans",
  Souscriptions: "Subscriptions",
  "Vue d'ensemble Système": "System overview",
  "Bienvenue sur la console Super Admin FleetMan. Surveillez la croissance de la plateforme.":
    "Welcome to the FleetMan Super Admin console. Monitor platform growth.",
  "Administrateurs actifs": "Active administrators",
  "Gestionnaires actifs": "Active managers",
  "Flottes plateforme": "Platform fleets",
  "Véhicules enregistrés": "Registered vehicles",
  "7 derniers jours": "Last 7 days",
  "Demandes de Souscription": "Subscription requests",
  "Inscriptions de gestionnaires en attente de validation.":
    "Manager registrations pending approval.",
  "en attente": "pending",
  Gestionnaire: "Manager",
  Entreprise: "Company",
  "Date d'inscription": "Registration date",
  "En attente": "Pending",
  Approuver: "Approve",
  Rejeter: "Reject",
  "Abonnements actifs": "Active subscriptions",
  "Gestionnaires avec un plan tarifaire en cours.":
    "Managers with an active pricing plan.",
  "Aucun abonnement actif enregistré.": "No active subscription recorded.",
  "Statut :": "Status:",
  "Expire le": "Expires on",
  "j restants": "days remaining",
  "expiré depuis": "expired since",
  "Approuver l'inscription": "Approve registration",
  "Le compte sera activé immédiatement. Vous pouvez optionnellement affecter un plan tarifaire.":
    "The account will be activated immediately. You may optionally assign a pricing plan.",
  "Plan tarifaire (optionnel)": "Pricing plan (optional)",
  "Aucun plan (accès libre)": "No plan (full access)",
  "Approbation…": "Approving…",
  "Confirmer l'approbation": "Confirm approval",
  "Rejeter l'inscription": "Reject registration",
  "Le gestionnaire recevra une notification avec le motif de rejet.":
    "The manager will receive a notification with the rejection reason.",
  "Motif du rejet *": "Rejection reason *",
  "Rejet…": "Rejecting…",
  "Confirmer le rejet": "Confirm rejection",
  "Aucune demande en attente. Toutes les inscriptions ont été traitées ✓":
    "No pending requests. All registrations have been processed ✓",
  "Historique des souscriptions": "Subscription history",
  "Retrouvez toutes les demandes approuvées ou rejetées.":
    "Find all approved or rejected requests.",
  "Rechercher par nom, email ou entreprise...": "Search by name, email or company...",
  "Date de traitement": "Processed on",
  Détails: "Details",
  Approuvée: "Approved",
  Rejetée: "Rejected",
  Plan: "Plan",
  "Aucun plan": "No plan",
  Par: "By",
  Motif: "Reason",
  "Aucune demande traitée pour le moment.": "No processed requests yet.",
  "Nouvel administrateur": "New administrator",
  Photo: "Photo",
  "Rechercher par nom ou email...": "Search by name or email...",
  "Désactiver le compte": "Deactivate account",
  "Activer le compte": "Activate account",
  "Mot de passe": "Password",
  "Plans Tarifaires": "Pricing plans",
  "Définissez les offres disponibles pour les gestionnaires de flotte.":
    "Define offers available to fleet managers.",
  "Créer un plan": "Create a plan",
  "Aucun plan tarifaire créé.": "No pricing plan created.",
  "Le + choisi": "Most popular",
  Gratuit: "Free",
  "Plan gratuit (sans abonnement mensuel)": "Free plan (no monthly subscription)",
  "Optionnel — laissez vide pour un plan gratuit": "Optional — leave empty for a free plan",
  "Prix mensuel (XAF)": "Monthly price (XAF)",
  "Flottes illimitées": "Unlimited fleets",
  flotte: "fleet",
  flottes: "fleets",
  véhicule: "vehicle",
  véhicules: "vehicles",
  conducteur: "driver",
  conducteurs: "drivers",
  "Véhicules illimités": "Unlimited vehicles",
  "Conducteurs illimités": "Unlimited drivers",
  "Plans désactivés": "Deactivated plans",
  "Modifier le plan": "Edit plan",
  "Créer un plan tarifaire": "Create a pricing plan",
  "Nom du plan *": "Plan name *",
  "Courte description du plan": "Short plan description",
  "Prix mensuel (XAF) *": "Monthly price (XAF) *",
  "Prix annuel (XAF)": "Annual price (XAF)",
  Optionnel: "Optional",
  "Max flottes": "Max fleets",
  "999 = illimité": "999 = unlimited",
  "Max véhicules": "Max vehicles",
  "Max conducteurs": "Max drivers",
  "Fonctionnalités incluses": "Included features",
  "Séparées par des virgules : Géofencing, Documents, KPIs...":
    "Comma-separated: Geofencing, Documents, KPIs...",
  "Affichage marketing sur la carte du plan":
    "Marketing display on the plan card",
  "Fonctionnalités techniques (enforcement)": "Technical features (enforcement)",
  "Mettre à jour": "Update",
  "Créer le plan": "Create plan",
  "Désactiver ce plan ? Les gestionnaires abonnés conservent leur accès jusqu'à renouvellement.":
    "Deactivate this plan? Subscribed managers keep access until renewal.",
  "Afficher le mot de passe": "Show password",
  "Masquer le mot de passe": "Hide password",
  "Photo de profil": "Profile photo",
  Description: "Description",
  "Évolution des inscriptions": "Sign-up trend",
  "Répartition utilisateurs": "User distribution",

  // --- Centre d'aide ---
  Retour: "Back",
  "Trouvez des réponses à vos questions ou contactez notre équipe.":
    "Find answers to your questions or contact our team.",
  "Questions fréquentes": "Frequently asked questions",
  "Comment ajouter un véhicule à ma flotte ?": "How do I add a vehicle to my fleet?",
  "Rendez-vous dans la section Véhicules, cliquez sur « Enregistrer un véhicule » et suivez l'assistant en 4 étapes.":
    "Go to Vehicles, click « Register a vehicle » and follow the 4-step wizard.",
  "Comment planifier un trajet ?": "How do I plan a trip?",
  "Dans la page Trajets, cliquez sur « Planifier un trajet », renseignez le véhicule, le conducteur, le départ et la destination puis validez.":
    "On the Trips page, click « Plan a trip », enter the vehicle, driver, departure and destination, then confirm.",
  "Comment recevoir des alertes sur les documents qui expirent ?":
    "How do I get alerts for expiring documents?",
  "Les documents expirant prochainement apparaissent automatiquement dans la section Documents et génèrent une notification.":
    "Documents expiring soon appear automatically in Documents and trigger a notification.",
  "Puis-je changer la langue de l'interface ?": "Can I change the interface language?",
  "Oui. Dans le tableau de bord, utilisez le sélecteur de langue en haut à droite pour basculer entre le français et l'anglais.":
    "Yes. In the dashboard, use the language selector at the top right to switch between French and English.",
  "Comment contacter le support ?": "How do I contact support?",
  "Écrivez-nous à contact@fleetman.cm ou appelez le +237 6XX XX XX XX du lundi au vendredi.":
    "Email us at contact@fleetman.cm or call +237 6XX XX XX XX Monday through Friday.",
};

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (s: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "fleetman-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as Lang | null)
        : null;
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "fr" ? "en" : "fr");
  }, [lang, setLang]);

  const t = useCallback(
    (s: string) => (lang === "fr" ? s : EN[s] ?? s),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggle, t }),
    [lang, setLang, toggle, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLang(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Repli sûr si le provider est absent (ex. rendu isolé) : pas de traduction.
    return {
      lang: "fr",
      setLang: () => {},
      toggle: () => {},
      t: (s: string) => s,
    };
  }
  return ctx;
}
