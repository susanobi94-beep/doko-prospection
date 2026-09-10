import { describe, expect, it } from "vitest";
import { buildProspectsFilter } from "@/server/prospects-filter";

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
