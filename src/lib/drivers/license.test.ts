import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { setCurrentLang } from "../i18n-messages";
import { defaultLicenseCategoryFor, driverLicenseError, licenseCovers } from "./license";

const license = (licenseCategories: string | null, expiryDate: string | null) => ({
  docType: "DRIVING_LICENSE",
  licenseCategories,
  expiryDate,
});

describe("permis de conduire (même règle que le backend)", () => {
  it("déduit la catégorie exigée du type de véhicule", () => {
    assert.equal(defaultLicenseCategoryFor("truck"), "C");
    assert.equal(defaultLicenseCategoryFor("CAR"), "B");
    assert.equal(defaultLicenseCategoryFor(null), null);
  });

  it("accepte des séparateurs libres", () => {
    assert.equal(licenseCovers(" b; c ", "C"), true);
    assert.equal(licenseCovers("B", "C"), false);
  });

  afterEach(() => setCurrentLang("en"));

  it("refuse un chauffeur sans permis (message anglais par défaut)", () => {
    assert.match(driverLicenseError([], "B", "2026-11-02") ?? "", /no driving licence/);
  });

  it("refuse un permis expiré avant la fin du créneau", () => {
    assert.match(driverLicenseError([license("B", "2026-11-01")], "B", "2026-11-02") ?? "", /\(expired\)/);
  });

  it("refuse un permis sans la catégorie exigée", () => {
    assert.match(driverLicenseError([license("B", null)], "C", "2026-11-02") ?? "", /category C/);
  });

  it("message en français une fois la langue choisie", () => {
    setCurrentLang("fr");
    assert.match(driverLicenseError([license("B", null)], "C", "2026-11-02") ?? "", /catégorie C/);
  });

  it("accepte si un permis valide couvre la catégorie", () => {
    const docs = [license("B", "2020-01-01"), license("B,C", "2030-01-01"), { docType: "ID_CARD" }];
    assert.equal(driverLicenseError(docs, "C", "2026-11-02"), null);
  });
});
