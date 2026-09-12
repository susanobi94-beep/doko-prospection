import { describe, expect, it } from "vitest";
import { escapeCsvField } from "@/lib/csv";

describe("escapeCsvField", () => {
  it("laisse une valeur simple inchangée", () => {
    expect(escapeCsvField("Boutique Alpha")).toBe("Boutique Alpha");
  });

  it("entoure une valeur contenant une virgule", () => {
    expect(escapeCsvField("Douala, Akwa")).toBe('"Douala, Akwa"');
  });

  it("double les guillemets internes et entoure la valeur", () => {
    expect(escapeCsvField('Le "meilleur" prospect')).toBe('"Le ""meilleur"" prospect"');
  });

  it("entoure une valeur contenant un retour à la ligne", () => {
    expect(escapeCsvField("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
  });

  it("neutralise une valeur qui ressemble à une formule", () => {
    expect(escapeCsvField("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(escapeCsvField("+1234")).toBe("'+1234");
    expect(escapeCsvField("@SUM(A1)")).toBe("'@SUM(A1)");
  });
});
