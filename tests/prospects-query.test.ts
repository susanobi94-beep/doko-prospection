import { describe, expect, it } from "vitest";
import { buildProspectsFilter, sanitizeSearchTerm } from "@/server/prospects-filter";

describe("buildProspectsFilter", () => {
  it("garde un statut valide", () => {
    expect(buildProspectsFilter({ status: "contacte" })).toEqual({ status: "contacte" });
  });

  it("ignore un statut invalide", () => {
    expect(buildProspectsFilter({ status: "inconnu" })).toEqual({});
  });

  it("ignore une ville vide et garde une ville renseignée", () => {
    expect(buildProspectsFilter({ city: "  " })).toEqual({});
    expect(buildProspectsFilter({ city: " Douala " })).toEqual({ city: "Douala" });
  });

  it("combine statut, ville et recherche", () => {
    expect(buildProspectsFilter({ status: "client", city: "Yaoundé", search: "Alpha" })).toEqual({
      status: "client",
      city: "Yaoundé",
      search: "Alpha",
    });
  });
});

describe("sanitizeSearchTerm", () => {
  it("laisse un terme simple inchangé", () => {
    expect(sanitizeSearchTerm("Alpha")).toBe("Alpha");
  });

  it("retire les caractères de syntaxe de filtre PostgREST", () => {
    expect(sanitizeSearchTerm("a,status.eq.client")).toBe("astatuseqclient");
    expect(sanitizeSearchTerm("a)or(id.neq.0")).toBe("aoridneq0");
  });

  it("échappe les jokers ILIKE pour un match littéral", () => {
    expect(sanitizeSearchTerm("50%_off")).toBe("50\\%\\_off");
  });
});
