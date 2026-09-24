import { describe, it, expect } from "vitest";
import { mergeTimelineEvents } from "@/server/timeline-utils";
import type { ActivityLogEntry, ProspectComment } from "@/server/prospects";
import type { RelanceItem } from "@/server/relances";

describe("Unified Timeline Merger", () => {
  it("merges activity log, comments, and relances sorted by date descending", () => {
    const activity: ActivityLogEntry[] = [
      {
        id: "act-1",
        action: "created",
        before: null,
        after: { name: "Boutique Test" },
        created_at: "2026-09-20T10:00:00Z",
        actor: { name: "Richard Admin" },
      },
      {
        id: "act-2",
        action: "status_changed",
        before: { status: "a_contacter" },
        after: { status: "contacte" },
        created_at: "2026-09-22T14:00:00Z",
        actor: { name: "Commercial 1" },
      },
    ];

    const comments: ProspectComment[] = [
      {
        id: "com-1",
        prospect_id: "p1",
        author_id: "staff-1",
        body: "Client rencontré au marché. Demande un devis.",
        created_at: "2026-09-23T09:30:00Z",
        author: { name: "Commercial 1" },
      },
    ];

    const relances: RelanceItem[] = [
      {
        id: "rel-1",
        due_date: "2026-09-24",
        note: "Relance commerciale",
        done: false,
        created_at: "2026-09-21T11:00:00Z",
        prospect: { id: "p1", name: "Boutique Test", phone: "690000000" },
        creator: { name: "Commercial 1" },
      },
    ];

    const timeline = mergeTimelineEvents(activity, comments, relances);

    expect(timeline).toHaveLength(4);

    // Vérifie l'ordre chronologique décroissant
    expect(timeline[0].id).toBe("com-1"); // 2026-09-23
    expect(timeline[0].type).toBe("comment");
    expect(timeline[0].authorName).toBe("Commercial 1");

    expect(timeline[1].id).toBe("act-2"); // 2026-09-22
    expect(timeline[1].type).toBe("activity");

    expect(timeline[2].id).toBe("rel-1"); // 2026-09-21
    expect(timeline[2].type).toBe("relance");

    expect(timeline[3].id).toBe("act-1"); // 2026-09-20
    expect(timeline[3].type).toBe("activity");
  });

  it("handles empty lists gracefully", () => {
    const timeline = mergeTimelineEvents([], [], []);
    expect(timeline).toEqual([]);
  });
});
