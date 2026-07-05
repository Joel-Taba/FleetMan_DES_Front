// ============================================================================
// Générateur de Données Massives pour LocalStorage
// ============================================================================
// Génère un volume important de données pour tester l'interface avec beaucoup d'entrées
// ============================================================================

// Listes de données pour la génération aléatoire
const CAMEROON_CITIES = [
  "Yaoundé", "Douala", "Garoua", "Bamenda", "Maroua", "Bafoussam", "Ngaoundéré",
  "Bertoua", "Ebolowa", "Kribi", "Limbe", "Kumba", "Edéa", "Sangmelima", "Mbalmayo"
];

const VEHICLE_BRANDS = ["Toyota", "Mercedes", "Iveco", "Ford", "Hyundai", "Renault", "Peugeot", "Fiat", "Nissan", "Volvo", "MAN", "Scania"];
const VEHICLE_MODELS = {
  Toyota: ["Hilux", "Land Cruiser", "Hiace", "Coaster"],
  Mercedes: ["Sprinter", "Actros", "Atego", "Vito"],
  Iveco: ["Daily", "Eurocargo", "Stralis"],
  Ford: ["Transit", "Ranger", "F-150"],
  Hyundai: ["H350", "Porter", "Mighty"],
  Renault: ["Master", "Trafic", "Kangoo"],
  Peugeot: ["Boxer", "Expert", "Partner"],
  Fiat: ["Ducato", "Doblo", "Scudo"],
  Nissan: ["NV400", "Navara", "Cabstar"],
  Volvo: ["FH16", "FM", "FL"],
  MAN: ["TGX", "TGS", "TGL"],
  Scania: ["R-Series", "S-Series", "P-Series"]
};

const COLORS = ["Blanc", "Noir", "Gris", "Bleu", "Rouge", "Argent", "Vert", "Jaune"];
const FUEL_TYPES = ["Diesel", "Essence", "Hybride", "Électrique"];
const STATUSES = ["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_SERVICE"];
const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "ON_LEAVE"];
const TRIP_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const INCIDENT_TYPES = ["MECHANICAL", "ACCIDENT", "TIRE", "ELECTRICAL", "OTHER"];
const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const INCIDENT_STATUSES = ["REPORTED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const FIRST_NAMES = [
  "Jean", "Paul", "Marie", "Alain", "Sylvie", "Patrice", "Christine", "Roger", "Angèle", "Eric",
  "André", "Françoise", "Pierre", "Claudine", "Jacques", "Monique", "François", "Jeanne", "Georges", "Thérèse",
  "Michel", "Antoinette", "René", "Madeleine", "Henri", "Lucie", "Louis", "Sophie", "Marcel", "Bernadette"
];

const LAST_NAMES = [
  "Mbarga", "Nkolo", "Fouda", "Tchounga", "Bella", "Essomba", "Manga", "Ateba", "Njoya", "Moudiki",
  "Ngono", "Abanda", "Ndam", "Onana", "Mvondo", "Ebode", "Ayissi", "Ngounou", "Feudjio", "Kamga",
  "Talla", "Kemdjo", "Zogo", "Ekambi", "Beyala", "Etame", "Owona", "Mendomo", "Bilong", "Enoh"
];

// Fonctions utilitaires
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function generateLicensePlate(): string {
  const prefixes = ["LT", "CE", "SW", "NW", "EN", "AD", "NO", "OU", "SU", "ES"];
  const prefix = randomChoice(prefixes);
  const number = randomInt(1000, 9999);
  const suffix = String.fromCharCode(65 + randomInt(0, 25)) + String.fromCharCode(65 + randomInt(0, 25));
  return `${prefix}-${number}-${suffix}`;
}

function generateLicenseNumber(): string {
  return `CM-${randomChoice(["A", "B", "C", "D"])}-${randomInt(100000, 999999)}`;
}

function generatePhone(): string {
  return `+237${randomInt(690000000, 699999999)}`;
}

// ============================================================================
// GÉNÉRATEURS PAR ENTITÉ
// ============================================================================

export function generateVehicles(count: number) {
  const vehicles = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const brand = randomChoice(VEHICLE_BRANDS);
    const model = randomChoice(VEHICLE_MODELS[brand as keyof typeof VEHICLE_MODELS]);
    const year = randomInt(2015, 2024);
    const mileage = randomInt(5000, 300000);
    const lastMaintenance = new Date(now.getTime() - randomInt(0, 180) * 24 * 60 * 60 * 1000);
    const nextMaintenance = new Date(lastMaintenance.getTime() + randomInt(60, 180) * 24 * 60 * 60 * 1000);
    
    vehicles.push({
      id: `v${i + 1}`,
      licensePlate: generateLicensePlate(),
      brand,
      model,
      year,
      status: randomChoice(STATUSES),
      fuelType: randomChoice(FUEL_TYPES),
      color: randomChoice(COLORS),
      mileage,
      lastMaintenanceDate: lastMaintenance.toISOString().split('T')[0],
      nextMaintenanceDate: nextMaintenance.toISOString().split('T')[0],
      capacity: randomInt(2, 40),
      vin: `VIN${randomInt(10000000, 99999999)}${String.fromCharCode(65 + i % 26)}`
    });
  }
  
  return vehicles;
}

export function generateFleets(count: number) {
  const fleets = [];
  const fleetNames = [
    "Flotte Yaoundé Centre", "Flotte Douala Port", "Flotte Inter-urbaine", "Flotte Garoua Nord",
    "Flotte Bamenda Ouest", "Flotte Bafoussam", "Flotte Longue Distance", "Flotte Urbaine Express",
    "Flotte Transport Marchandise", "Flotte VIP", "Flotte Économique", "Flotte Premium"
  ];
  
  for (let i = 0; i < Math.min(count, fleetNames.length); i++) {
    fleets.push({
      id: `f${i + 1}`,
      name: fleetNames[i],
      description: `Flotte dédiée aux opérations ${fleetNames[i].toLowerCase().replace('flotte ', '')}`,
      vehicleCount: randomInt(5, 30),
      status: "ACTIVE",
      createdAt: randomDate(new Date(2022, 0, 1), new Date()).split('T')[0]
    });
  }
  
  return fleets;
}

export function generateDrivers(count: number) {
  const drivers = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    
    drivers.push({
      id: `d${i + 1}`,
      firstName,
      lastName,
      licenseNumber: generateLicenseNumber(),
      phone: generatePhone(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.cm`,
      status: randomChoice(DRIVER_STATUSES),
      experience: `${randomInt(2, 20)} ans`,
      hireDate: randomDate(new Date(2015, 0, 1), new Date()).split('T')[0]
    });
  }
  
  return drivers;
}

export function generateTrips(count: number, vehicleIds: string[], driverIds: string[]) {
  const trips = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const startCity = randomChoice(CAMEROON_CITIES);
    let endCity = randomChoice(CAMEROON_CITIES);
    while (endCity === startCity) {
      endCity = randomChoice(CAMEROON_CITIES);
    }
    
    const startDate = new Date(now.getTime() - randomInt(0, 90) * 24 * 60 * 60 * 1000);
    const duration = randomInt(2, 24); // heures
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
    const status = randomChoice(TRIP_STATUSES);
    const distance = randomInt(50, 1200);
    
    trips.push({
      id: `t${i + 1}`,
      code: `TRJ-2024-${String(i + 1).padStart(5, '0')}`,
      vehicleId: randomChoice(vehicleIds),
      driverId: randomChoice(driverIds),
      startLocation: startCity,
      endLocation: endCity,
      startTime: startDate.toISOString(),
      endTime: status === "COMPLETED" ? endDate.toISOString() : null,
      distance,
      fuelConsumed: Math.round(distance * randomInt(12, 25) / 100),
      status,
      plannedDeparture: startDate.toISOString(),
      estimatedArrival: endDate.toISOString()
    });
  }
  
  return trips;
}

export function generateAssignments(count: number, vehicleIds: string[], driverIds: string[]) {
  const assignments = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date(now.getTime() - randomInt(0, 30) * 24 * 60 * 60 * 1000);
    const isActive = Math.random() > 0.5;
    
    assignments.push({
      id: `a${i + 1}`,
      vehicleId: randomChoice(vehicleIds),
      driverId: randomChoice(driverIds),
      startDate: startDate.toISOString(),
      endDate: isActive ? null : new Date(startDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000).toISOString(),
      status: isActive ? "ACTIVE" : "COMPLETED",
      notes: `Affectation ${isActive ? "en cours" : "terminée"} - ${randomChoice(CAMEROON_CITIES)}`
    });
  }
  
  return assignments;
}

export function generateIncidents(count: number, vehicleIds: string[], tripIds: string[]) {
  const incidents = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - randomInt(0, 180) * 24 * 60 * 60 * 1000);
    const type = randomChoice(INCIDENT_TYPES);
    const severity = randomChoice(INCIDENT_SEVERITIES);
    const status = randomChoice(INCIDENT_STATUSES);
    
    const descriptions = {
      MECHANICAL: ["Surchauffe moteur", "Problème de transmission", "Fuite d'huile", "Problème de freins"],
      ACCIDENT: ["Collision mineure", "Accrochage parking", "Sortie de route", "Collision avec piéton"],
      TIRE: ["Crevaison", "Éclatement pneu", "Usure excessive", "Pression anormale"],
      ELECTRICAL: ["Panne électrique", "Problème batterie", "Défaillance alternateur", "Court-circuit"],
      OTHER: ["Vandalisme", "Vol accessoires", "Dégât naturel", "Incident mineur"]
    };
    
    incidents.push({
      id: `i${i + 1}`,
      vehicleId: randomChoice(vehicleIds),
      tripId: Math.random() > 0.5 ? randomChoice(tripIds) : null,
      type,
      severity,
      description: randomChoice(descriptions[type as keyof typeof descriptions]),
      date: date.toISOString(),
      location: `${randomChoice(CAMEROON_CITIES)}, ${["Centre-ville", "Route nationale", "Zone industrielle", "Périphérie"][randomInt(0, 3)]}`,
      status,
      resolution: status === "RESOLVED" || status === "CLOSED" ? `Réparation effectuée - ${randomChoice(["Pièce remplacée", "Réparation standard", "Maintenance préventive", "Intervention rapide"])}` : null,
      cost: status === "RESOLVED" || status === "CLOSED" ? randomInt(10000, 500000) : null
    });
  }
  
  return incidents;
}

export function generateExpenses(count: number, vehicleIds: string[]) {
  const expenses = [];
  const now = new Date();
  const categories = ["FUEL", "MAINTENANCE", "TOLL", "REPAIR", "INSURANCE", "PARKING", "OTHER"];
  
  for (let i = 0; i < count; i++) {
    const category = randomChoice(categories);
    const date = new Date(now.getTime() - randomInt(0, 180) * 24 * 60 * 60 * 1000);
    
    const amounts = {
      FUEL: randomInt(50000, 150000),
      MAINTENANCE: randomInt(100000, 500000),
      TOLL: randomInt(5000, 25000),
      REPAIR: randomInt(200000, 800000),
      INSURANCE: randomInt(150000, 400000),
      PARKING: randomInt(2000, 10000),
      OTHER: randomInt(10000, 100000)
    };
    
    expenses.push({
      id: `e${i + 1}`,
      category,
      amount: amounts[category as keyof typeof amounts],
      description: `${category} - ${randomChoice(CAMEROON_CITIES)}`,
      date: date.toISOString().split('T')[0],
      vehicleId: randomChoice(vehicleIds),
      status: randomChoice(["PENDING", "APPROVED", "REJECTED"])
    });
  }
  
  return expenses;
}

export function generateMaintenances(count: number, vehicleIds: string[]) {
  const maintenances = [];
  const now = new Date();
  const types = ["PREVENTIVE", "CORRECTIVE", "INSPECTION", "REPAIR"];
  
  for (let i = 0; i < count; i++) {
    const scheduledDate = new Date(now.getTime() + randomInt(-60, 60) * 24 * 60 * 60 * 1000);
    const type = randomChoice(types);
    const status = randomChoice(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
    
    maintenances.push({
      id: `m${i + 1}`,
      vehicleId: randomChoice(vehicleIds),
      type,
      subject: `${type} - ${randomChoice(["Révision complète", "Vidange", "Contrôle technique", "Changement pneus", "Réparation moteur"])}`,
      scheduledDate: scheduledDate.toISOString(),
      completedDate: status === "COMPLETED" ? new Date(scheduledDate.getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString() : null,
      cost: status === "COMPLETED" ? randomInt(50000, 600000) : null,
      status,
      notes: `Maintenance ${type.toLowerCase()} - ${randomChoice(CAMEROON_CITIES)}`
    });
  }
  
  return maintenances;
}

// ============================================================================
// GÉNÉRATEUR PRINCIPAL
// ============================================================================

export interface MassiveDataConfig {
  vehicles: number;
  fleets: number;
  drivers: number;
  trips: number;
  assignments: number;
  incidents: number;
  expenses: number;
  maintenances: number;
}

export function generateMassiveData(config: MassiveDataConfig) {
  console.log("🔄 Génération de données massives...");
  
  const vehicles = generateVehicles(config.vehicles);
  const vehicleIds = vehicles.map(v => v.id);
  
  const fleets = generateFleets(config.fleets);
  
  const drivers = generateDrivers(config.drivers);
  const driverIds = drivers.map(d => d.id);
  
  const trips = generateTrips(config.trips, vehicleIds, driverIds);
  const tripIds = trips.map(t => t.id);
  
  const assignments = generateAssignments(config.assignments, vehicleIds, driverIds);
  const incidents = generateIncidents(config.incidents, vehicleIds, tripIds);
  const expenses = generateExpenses(config.expenses, vehicleIds);
  const maintenances = generateMaintenances(config.maintenances, vehicleIds);
  
  const data = {
    vehicles,
    fleets,
    drivers,
    trips,
    assignments,
    incidents,
    expenses,
    maintenances,
    generatedAt: new Date().toISOString(),
    config
  };
  
  console.log("✅ Données générées :", {
    vehicles: vehicles.length,
    fleets: fleets.length,
    drivers: drivers.length,
    trips: trips.length,
    assignments: assignments.length,
    incidents: incidents.length,
    expenses: expenses.length,
    maintenances: maintenances.length
  });
  
  return data;
}

// ============================================================================
// GESTION DU LOCALSTORAGE
// ============================================================================

const STORAGE_KEY = "fleetman_massive_data";

export function saveMassiveDataToLocalStorage(data: ReturnType<typeof generateMassiveData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("✅ Données sauvegardées dans le localStorage");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde :", error);
    return false;
  }
}

export function loadMassiveDataFromLocalStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      console.log("✅ Données chargées depuis le localStorage");
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur lors du chargement :", error);
    return null;
  }
}

export function clearMassiveDataFromLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("✅ Données supprimées du localStorage");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
    return false;
  }
}

export function initializeMassiveData(config?: Partial<MassiveDataConfig>) {
  const defaultConfig: MassiveDataConfig = {
    vehicles: 80,
    fleets: 10,
    drivers: 120,
    trips: 250,
    assignments: 100,
    incidents: 80,
    expenses: 200,
    maintenances: 100
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  const data = generateMassiveData(finalConfig);
  saveMassiveDataToLocalStorage(data);
  
  return data;
}
