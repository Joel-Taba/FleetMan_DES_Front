import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertFiniteNumber,
  filterDecimalInput,
  filterIntegerInput,
  isValidDecimalInput,
  isValidIntegerInput,
  parseDecimalInput,
  parseIntegerInput,
  validateDecimalInput,
  validateIntegerInput,
} from "./numeric-input";

describe("filterDecimalInput", () => {
  it("accepte chiffres et une virgule", () => {
    assert.equal(filterDecimalInput("85000"), "85000");
    assert.equal(filterDecimalInput("1234,56"), "1234,56");
  });

  it("rejette lettres et caractères spéciaux", () => {
    assert.equal(filterDecimalInput("abc"), "");
    assert.equal(filterDecimalInput("12a34"), "1234");
    assert.equal(filterDecimalInput("12@#€34"), "1234");
    assert.equal(filterDecimalInput("12.34"), "1234");
    assert.equal(filterDecimalInput("-150"), "150");
  });

  it("n'autorise qu'une seule virgule", () => {
    assert.equal(filterDecimalInput("1,2,3"), "1,23");
    assert.equal(filterDecimalInput(",,12"), ",12");
  });
});

describe("filterIntegerInput", () => {
  it("ne garde que les chiffres", () => {
    assert.equal(filterIntegerInput("42"), "42");
    assert.equal(filterIntegerInput("4a2,5"), "425");
    assert.equal(filterIntegerInput("  -10  "), "10");
  });
});

describe("isValidDecimalInput", () => {
  it("valide les formats corrects", () => {
    assert.equal(isValidDecimalInput("0"), true);
    assert.equal(isValidDecimalInput("85000"), true);
    assert.equal(isValidDecimalInput("1234,5"), true);
  });

  it("rejette les valeurs aberrantes", () => {
    assert.equal(isValidDecimalInput(""), false);
    assert.equal(isValidDecimalInput("abc"), false);
    assert.equal(isValidDecimalInput("12,34,56"), false);
    assert.equal(isValidDecimalInput("12."), false);
    assert.equal(isValidDecimalInput(",5"), false);
    assert.equal(isValidDecimalInput("1e5"), false);
  });
});

describe("parseDecimalInput", () => {
  it("convertit la virgule en décimal", () => {
    assert.equal(parseDecimalInput("1234,56"), 1234.56);
    assert.equal(parseDecimalInput("85000"), 85000);
  });

  it("retourne null pour entrées invalides", () => {
    assert.equal(parseDecimalInput("abc"), null);
    assert.equal(parseDecimalInput("12.34"), null);
    assert.equal(parseDecimalInput(""), null);
  });
});

describe("validateDecimalInput", () => {
  it("applique min/max et required", () => {
    assert.equal(validateDecimalInput("", { required: true, label: "Coût" }), "Coût est obligatoire.");
    assert.equal(validateDecimalInput("abc", { label: "Coût" }), "Coût : saisissez uniquement des chiffres (une virgule pour les décimales).");
    assert.equal(validateDecimalInput("-5", { label: "Coût", min: 0 }), "Coût : saisissez uniquement des chiffres (une virgule pour les décimales).");
    assert.equal(validateDecimalInput("0", { min: 1, label: "Coût" }), "Coût : la valeur minimum est 1.");
    assert.equal(validateDecimalInput("100", { max: 50, label: "Coût" }), "Coût : la valeur maximum est 50.");
    assert.equal(validateDecimalInput("25", { min: 0, max: 100 }), null);
  });
});

describe("validateIntegerInput", () => {
  it("rejette décimales et lettres", () => {
    assert.equal(validateIntegerInput("12,5", { label: "Quantité" }), "Quantité : saisissez uniquement des chiffres entiers.");
    assert.equal(validateIntegerInput("5", { min: 1 }), null);
  });
});

describe("parseIntegerInput", () => {
  it("parse les entiers", () => {
    assert.equal(parseIntegerInput("12"), 12);
    assert.equal(parseIntegerInput("12,5"), null);
  });
});

describe("assertFiniteNumber", () => {
  it("rejette NaN et Infinity", () => {
    assert.throws(() => assertFiniteNumber(NaN, "Montant"), /invalide/);
    assert.throws(() => assertFiniteNumber(Infinity, "Montant"), /invalide/);
    assert.throws(() => assertFiniteNumber("abc", "Montant"), /invalide/);
  });

  it("accepte les nombres valides", () => {
    assert.equal(assertFiniteNumber(42, "Montant"), 42);
    assert.equal(assertFiniteNumber("42", "Montant", { min: 0 }), 42);
    assert.equal(assertFiniteNumber(null, "Montant"), null);
  });
});
