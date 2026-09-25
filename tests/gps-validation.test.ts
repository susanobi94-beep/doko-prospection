import { describe, it, expect } from "vitest";
import { ProspectInputSchema } from "../src/lib/validation";

describe("GPS Coordinates Validation", () => {
  const baseValidInput = {
    name: "Boutique Test Akwa",
    phone: "699112233",
    city: "Douala",
    category: "boutique_telephone" as const,
  };

  it("accepts valid Douala GPS coordinates", () => {
    const res = ProspectInputSchema.safeParse({
      ...baseValidInput,
      latitude: 4.05105,
      longitude: 9.76786,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.latitude).toBe(4.05105);
      expect(res.data.longitude).toBe(9.76786);
    }
  });

  it("accepts null or undefined GPS coordinates", () => {
    const resNull = ProspectInputSchema.safeParse({
      ...baseValidInput,
      latitude: null,
      longitude: null,
    });
    expect(resNull.success).toBe(true);

    const resUndefined = ProspectInputSchema.safeParse({
      ...baseValidInput,
    });
    expect(resUndefined.success).toBe(true);
  });

  it("rejects latitude out of bounds (> 90 or < -90)", () => {
    const resHigh = ProspectInputSchema.safeParse({
      ...baseValidInput,
      latitude: 95.1234,
      longitude: 9.76786,
    });
    expect(resHigh.success).toBe(false);

    const resLow = ProspectInputSchema.safeParse({
      ...baseValidInput,
      latitude: -91.0,
      longitude: 9.76786,
    });
    expect(resLow.success).toBe(false);
  });

  it("rejects longitude out of bounds (> 180 or < -180)", () => {
    const resHigh = ProspectInputSchema.safeParse({
      ...baseValidInput,
      latitude: 4.05,
      longitude: 185.0,
    });
    expect(resHigh.success).toBe(false);

    const resLow = ProspectInputSchema.safeParse({
      ...baseValidInput,
      latitude: 4.05,
      longitude: -185.0,
    });
    expect(resLow.success).toBe(false);
  });
});
