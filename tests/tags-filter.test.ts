import { describe, it, expect } from "vitest";
import { buildProspectsFilter } from "@/server/prospects-filter";

describe("Tags Filtering in buildProspectsFilter", () => {
  it("includes tagId when provided as non-empty string", () => {
    const filter = buildProspectsFilter({
      tagId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(filter.tagId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("trims whitespace from tagId", () => {
    const filter = buildProspectsFilter({
      tagId: "  123e4567-e89b-12d3-a456-426614174000  ",
    });
    expect(filter.tagId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("omits tagId when empty or whitespace only", () => {
    const filterEmpty = buildProspectsFilter({ tagId: "" });
    expect(filterEmpty.tagId).toBeUndefined();

    const filterSpaces = buildProspectsFilter({ tagId: "   " });
    expect(filterSpaces.tagId).toBeUndefined();
  });

  it("combines tagId with status, city, search, and assignedTo", () => {
    const filter = buildProspectsFilter({
      status: "contacte",
      city: "Douala",
      search: "Marché",
      assignedTo: "staff-1",
      tagId: "tag-prioritaire",
    });

    expect(filter.status).toBe("contacte");
    expect(filter.city).toBe("Douala");
    expect(filter.search).toBe("Marché");
    expect(filter.assignedTo).toBe("staff-1");
    expect(filter.tagId).toBe("tag-prioritaire");
  });
});
