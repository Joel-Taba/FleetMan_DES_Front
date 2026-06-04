export const challenges = [
  "Carnets papier et Excel dispersés",
  "Impossible de localiser vos véhicules en temps réel",
  "Pannes non anticipées et coûts de maintenance explosifs",
  "Documents légaux expirés = amendes et immobilisation",
  "Consommation carburant non maîtrisée",
  "Aucune visibilité sur les coûts réels d'exploitation",
];

export const solutions = [
  "Centralisation cloud avec accès mobile/desktop",
  "Tracking GPS temps réel avec géofencing automatique",
  "Maintenance préventive basée sur les kilomètres",
  "Alertes automatiques 30j avant expiration des documents",
  "Suivi carburant par véhicule avec détection anomalies",
  "Dashboard KPI avec coût kilométrique, disponibilité, ROI",
];

export const allFeatures = [
  { title: "Gestion Véhicules & Flottes", desc: "Enregistrez et organisez vos véhicules par flotte. Suivi complet : identité, paramètres financiers, maintenance, documents légaux.", badge: "Implémenté" as const },
  { title: "Gestion Conducteurs", desc: "Profils conducteurs avec documents (permis, visites médicales). Assignation véhicule-chauffeur en un clic.", badge: "Implémenté" as const },
  { title: "Tracking GPS & Géofencing", desc: "Visualisez vos véhicules en temps réel sur carte. Créez des zones et recevez des alertes d'entrée/sortie.", badge: "Implémenté" as const },
  { title: "Trajets & Télémétrie", desc: "Historique complet des trajets avec distance, durée, consommation. Replay GPS pour analyse post-mission.", badge: "Implémenté" as const },
  { title: "Opérations Terrain", desc: "Déclaration incidents, maintenances, pleins de carburant. Suivi des coûts opérationnels en temps réel.", badge: "Implémenté" as const },
  { title: "Planification & Affectations", desc: "Planifiez vos services, assignez véhicules et chauffeurs. Détection automatique des conflits.", badge: "Implémenté" as const },
  { title: "Conformité Documentaire", desc: "Centralisez vos documents légaux. Alertes J-30/J-15/J-7 avant expiration.", badge: "Implémenté" as const },
  { title: "KPI & Rapports Avancés", desc: "20 indicateurs : taux d'utilisation, coût/km, consommation, incidents, conformité. Export CSV.", badge: "Implémenté" as const },
  { title: "Gestion Budgets & Scoring", desc: "Définissez des budgets par flotte. Scoring de conduite pour récompenser les meilleurs chauffeurs.", badge: "Bientôt" as const },
];

export const benefits = [
  { stat: "-30%", title: "Coûts maintenance", desc: "Passez à la maintenance préventive. Anticipez les pannes avant l'immobilisation." },
  { stat: "-15%", title: "Consommation carburant", desc: "Identifiez les véhicules gourmands et les conducteurs éco-responsables." },
  { stat: "100%", title: "Conformité", desc: "Plus aucun document expiré. Alertes automatiques et dashboard de conformité." },
  { stat: "+25%", title: "Disponibilité", desc: "Réduisez les immobilisations grâce à la planification intelligente." },
];

export const steps = [
  { n: 1, title: "Inscrivez-vous", desc: "Créez votre compte entreprise en 2 minutes. Aucune carte bancaire requise." },
  { n: 2, title: "Ajoutez vos flottes", desc: "Organisez vos véhicules par flotte (Yaoundé, Douala, Transporteurs VIP...)." },
  { n: 3, title: "Enregistrez vos véhicules", desc: "Saisissez plaques, modèles, documents. Uploadez photos et assurances." },
  { n: 4, title: "Invitez vos chauffeurs", desc: "Créez les profils conducteurs. Ils reçoivent un email d'invitation." },
  { n: 5, title: "Suivez en temps réel", desc: "Démarrez vos premiers trajets. Visualisez tout sur votre dashboard." },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "Gratuit 30 jours",
    popular: false,
    features: [
      { ok: true, text: "Essai gratuit complet" },
      { ok: true, text: "Jusqu'à 5 véhicules" },
      { ok: true, text: "2 utilisateurs (Manager + Driver)" },
      { ok: true, text: "Toutes les fonctionnalités implémentées" },
      { ok: false, text: "Support email uniquement" },
    ],
    cta: "Démarrer gratuitement",
  },
  {
    name: "Pro",
    price: "15 000 XAF/véhicule/mois",
    popular: true,
    features: [
      { ok: true, text: "Véhicules illimités" },
      { ok: true, text: "Utilisateurs illimités" },
      { ok: true, text: "Toutes fonctionnalités + modules futurs" },
      { ok: true, text: "Support prioritaire" },
      { ok: true, text: "Formation vidéo incluse" },
    ],
    cta: "Démarrer l'essai",
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    popular: false,
    features: [
      { ok: true, text: "Tout du Pro" },
      { ok: true, text: "Déploiement on-premise" },
      { ok: true, text: "Intégration Kernel RT-Comops" },
      { ok: true, text: "SLA 99,9% garanti" },
      { ok: true, text: "Support dédié 7j/7" },
    ],
    cta: "Contactez-nous",
  },
];

export const testimonials = [
  { name: "Jean-Baptiste Nkodo", role: "Directeur Logistique", company: "TransCam Express", quote: "Depuis FleetMan, nos coûts de maintenance ont baissé de 30% et plus aucun véhicule ne roule avec des documents expirés." },
  { name: "Claire Abega", role: "Gérante de flotte", company: "VIP Transport Douala", quote: "La planification et les alertes géofencing ont transformé notre quotidien. Interface claire et support réactif." },
  { name: "Marc Tchinda", role: "CEO", company: "Logistics Pro CM", quote: "Enfin une solution pensée pour le contexte africain, avec des tarifs en XAF et une prise en main en moins d'une semaine." },
];

export const faqItems = [
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. FleetMan utilise TLS 1.3 en transit et AES-256 au repos. Architecture multi-tenant avec isolation stricte. Hébergement conforme RGPD." },
  { q: "Puis-je importer mes données Excel ?", a: "Oui, import CSV pour véhicules et conducteurs. Notre équipe support vous accompagne gratuitement." },
  { q: "L'application mobile est-elle disponible ?", a: "L'interface chauffeur est mobile-first (web responsive). Application native iOS/Android prévue Q4 2026." },
  { q: "Comment fonctionne le tracking GPS ?", a: "Le chauffeur démarre son trajet depuis son smartphone. Position envoyée toutes les 30 secondes. Visualisation temps réel sur le dashboard." },
  { q: "Puis-je annuler mon abonnement ?", a: "Oui, sans engagement. Annulation à tout moment. Données exportables pendant 90 jours." },
  { q: "Planning vs Affectation ?", a: "Un Planning (Schedule) regroupe des affectations sur une période. Une Affectation assigne un véhicule et un chauffeur à un créneau précis." },
];
