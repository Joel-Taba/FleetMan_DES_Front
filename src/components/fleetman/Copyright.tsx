"use client";

import { useLang } from "@/lib/i18n";

/** Mention de copyright traduite (utilisable depuis un layout serveur). */
export function Copyright() {
  const { t } = useLang();
  return <>{t("© 2026 FleetMan. Tous droits réservés.")}</>;
}
