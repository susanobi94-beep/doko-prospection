import { describe, it, expect } from "vitest";
import { groupProspectsByStatus, KANBAN_COLUMNS } from "@/components/prospects/kanban-utils";
import type { Prospect } from "@/server/prospects";

describe("Kanban Grouping Utilities", () => {
  it("defines all 5 statuses in correct sales pipeline order", () => {
    expect(KANBAN_COLUMNS.map((c) => c.status)).toEqual([
      "a_contacter",
      "contacte",
      "interesse",
      "client",
      "refuse",
    ]);
  });

  it("groups prospects into appropriate status buckets", () => {
    const mockProspects: Prospect[] = [
      {
        id: "1",
        name: "Boutique 1",
        city: "Douala",
        category: "pme",
        phone: "690000001",
        whatsapp: null,
        status: "a_contacter",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Boutique 2",
        city: "Yaoundé",
        category: "boutique_telephone",
        phone: "690000002",
        whatsapp: "690000002",
        status: "contacte",
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Boutique 3",
        city: "Douala",
        category: "diaspora",
        phone: "690000003",
        whatsapp: null,
        status: "contacte",
        created_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Boutique 4",
        city: "Bafoussam",
        category: "pme",
        phone: "690000004",
        whatsapp: null,
        status: "client",
        created_at: new Date().toISOString(),
      },
    ];

    const grouped = groupProspectsByStatus(mockProspects);

    expect(grouped.a_contacter).toHaveLength(1);
    expect(grouped.contacte).toHaveLength(2);
    expect(grouped.interesse).toHaveLength(0);
    expect(grouped.client).toHaveLength(1);
    expect(grouped.refuse).toHaveLength(0);

    expect(grouped.a_contacter[0].name).toBe("Boutique 1");
    expect(grouped.contacte.map((p) => p.name)).toEqual(["Boutique 2", "Boutique 3"]);
  });

  it("handles empty prospects list", () => {
    const grouped = groupProspectsByStatus([]);
    expect(grouped.a_contacter).toEqual([]);
    expect(grouped.contacte).toEqual([]);
    expect(grouped.interesse).toEqual([]);
    expect(grouped.client).toEqual([]);
    expect(grouped.refuse).toEqual([]);
  });
});
