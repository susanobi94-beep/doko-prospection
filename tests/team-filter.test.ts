import { describe, it, expect } from "vitest";
import { buildProspectsFilter } from "@/server/prospects-filter";

describe("Team Filtering in buildProspectsFilter", () => {
  it("includes teamId when provided as non-empty string", () => {
    const filter = buildProspectsFilter({
      teamId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(filter.teamId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("trims whitespace from teamId", () => {
    const filter = buildProspectsFilter({
      teamId: "  123e4567-e89b-12d3-a456-426614174000  ",
    });
    expect(filter.teamId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("omits teamId when empty or whitespace only", () => {
    const filterEmpty = buildProspectsFilter({ teamId: "" });
    expect(filterEmpty.teamId).toBeUndefined();

    const filterSpaces = buildProspectsFilter({ teamId: "   " });
    expect(filterSpaces.teamId).toBeUndefined();
  });

  it("combines teamId with status, city, search, assignedTo, and tagId", () => {
    const filter = buildProspectsFilter({
      status: "interesse",
      city: "Douala",
      search: "Telecom",
      assignedTo: "staff-1",
      tagId: "tag-1",
      teamId: "team-douala-akwa",
    });

    expect(filter.status).toBe("interesse");
    expect(filter.city).toBe("Douala");
    expect(filter.search).toBe("Telecom");
    expect(filter.assignedTo).toBe("staff-1");
    expect(filter.tagId).toBe("tag-1");
    expect(filter.teamId).toBe("team-douala-akwa");
  });
});
