import { describe, it, expect } from "vitest";
import {
  parseCsvText,
  normalizePhoneNumber,
  mapAndValidateRows,
  deduplicateCsvRows,
  type ValidatedProspectRow,
} from "@/lib/csv-import-utils";

describe("CSV Import Utilities", () => {
  describe("parseCsvText", () => {
    it("parses comma-separated CSV with quotes", () => {
      const csv = 'Nom,Ville,Telephone\n"Boutique Alpha",Douala,690112233\n"Boutique Beta",Yaoundé,670445566';
      const result = parseCsvText(csv);
      expect(result.headers).toEqual(["Nom", "Ville", "Telephone"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(["Boutique Alpha", "Douala", "690112233"]);
      expect(result.rows[1]).toEqual(["Boutique Beta", "Yaoundé", "670445566"]);
    });

    it("parses semicolon-separated CSV (Excel French format)", () => {
      const csv = "Nom;Ville;Telephone\nBoutique Akwa;Douala;699001122\nBoutique Mokolo;Yaoundé;677889900";
      const result = parseCsvText(csv);
      expect(result.headers).toEqual(["Nom", "Ville", "Telephone"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(["Boutique Akwa", "Douala", "699001122"]);
    });

    it("handles CRLF line endings and empty lines", () => {
      const csv = "Nom,Telephone\r\nBoutique 1,690000001\r\n\r\nBoutique 2,690000002\r\n";
      const result = parseCsvText(csv);
      expect(result.rows).toHaveLength(2);
    });
  });

  describe("normalizePhoneNumber", () => {
    it("strips spaces, dashes, parentheses and plus signs", () => {
      expect(normalizePhoneNumber("+237 690-11-22-33")).toBe("237690112233");
      expect(normalizePhoneNumber("(+237) 670 44 55 66")).toBe("237670445566");
      expect(normalizePhoneNumber("690 12 34 56")).toBe("690123456");
    });
  });

  describe("mapAndValidateRows", () => {
    const headers = ["Boutique", "Contact", "Lieu", "Notes"];
    const rows = [
      ["Super Store", "690112233", "Douala", "Grand magasin"],
      ["", "670223344", "Yaoundé", "Sans nom"], // Missing name
      ["Sans Contact", "", "Bafoussam", "Pas de tel"], // Missing phone
      ["Shop Valide", "655443322", "", ""], // Valid with default city
    ];

    const mapping = {
      name: "Boutique",
      phone: "Contact",
      city: "Lieu",
      notes: "Notes",
    };

    it("extracts valid rows and reports row errors", () => {
      const { valid, errors } = mapAndValidateRows(headers, rows, mapping);
      expect(valid).toHaveLength(2);
      expect(errors).toHaveLength(2);

      expect(valid[0].name).toBe("Super Store");
      expect(valid[0].phone).toBe("690112233");
      expect(valid[0].city).toBe("Douala");

      expect(valid[1].name).toBe("Shop Valide");
      expect(valid[1].city).toBe("Non renseignée"); // Default city

      expect(errors[0].row).toBe(3);
      expect(errors[0].error).toContain("nom");
      expect(errors[1].row).toBe(4);
      expect(errors[1].error).toContain("téléphone");
    });
  });

  describe("deduplicateCsvRows", () => {
    it("keeps first occurrence of duplicate phone within file and flags subsequent duplicates", () => {
      const rows: ValidatedProspectRow[] = [
        { name: "First Entry", phone: "690112233", city: "Douala", category: "boutique_telephone" },
        { name: "Second Entry", phone: "670445566", city: "Yaoundé", category: "pme" },
        { name: "Duplicate Entry", phone: "690112233", city: "Douala", category: "boutique_telephone" },
      ];

      const { unique, fileDuplicates } = deduplicateCsvRows(rows);
      expect(unique).toHaveLength(2);
      expect(fileDuplicates).toHaveLength(1);
      expect(fileDuplicates[0].name).toBe("Duplicate Entry");
    });
  });
});
