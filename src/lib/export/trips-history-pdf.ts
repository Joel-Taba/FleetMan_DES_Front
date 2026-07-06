import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ApiDriver, ApiTrip, ApiVehicle } from "@/lib/api/types/manager";
import {
  driverLabel,
  formatTripDateTime,
  formatTripDistance,
  tripStatusLabel,
  vehiclePlateById,
} from "@/lib/api/mappers/manager";

const BRAND_COLOR: [number, number, number] = [38, 150, 228];

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const url = `${window.location.origin}/assets/logo-fleetMan.svg`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 120, 120);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export type TripsPdfExportOptions = {
  trips: ApiTrip[];
  vehicles: ApiVehicle[];
  drivers: ApiDriver[];
  periodLabel: string;
  generatedAt?: Date;
};

export async function exportTripsHistoryPdf(options: TripsPdfExportOptions) {
  const { trips, vehicles, drivers, periodLabel, generatedAt = new Date() } = options;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", 14, 10, 16, 16);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_COLOR);
  doc.text("FleetMan", logo ? 34 : 14, 18);

  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Historique des trajets", logo ? 34 : 14, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Période : ${periodLabel}`, 14, 34);
  doc.text(
    `Généré le ${generatedAt.toLocaleDateString("fr-FR")} à ${generatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    14,
    40
  );
  doc.text(`${trips.length} trajet(s)`, pageWidth - 14, 34, { align: "right" });

  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.6);
  doc.line(14, 44, pageWidth - 14, 44);

  const head = [["Code", "Départ", "Fin", "Conducteur", "Véhicule", "Distance", "Statut"]];
  const body = trips.map((trip) => {
    const driver = drivers.find((d) => d.userId === trip.driverId);
    return [
      trip.tripCode ?? trip.id,
      formatTripDateTime(trip.startDate, trip.startTime),
      trip.endDate ? formatTripDateTime(trip.endDate, trip.endTime) : "—",
      driver ? driverLabel(driver) : trip.driverId,
      vehiclePlateById(vehicles, trip.vehicleId) ?? "—",
      formatTripDistance(trip).replace(" km", "") || "—",
      tripStatusLabel(trip.status),
    ];
  });

  autoTable(doc, {
    startY: 48,
    head,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FleetMan — Votre flotte sous contrôle · Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`trajets-historique-${generatedAt.toISOString().slice(0, 10)}.pdf`);
}
