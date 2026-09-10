import { describe, expect, it } from "vitest";
import { evaluateStaffAccess } from "@/server/staff-access";

describe("evaluateStaffAccess", () => {
  it("refuse un compte absent de staff", () => {
    expect(evaluateStaffAccess(null)).toBe(false);
  });

  it("refuse un compte staff inactif", () => {
    expect(evaluateStaffAccess({ active: false })).toBe(false);
  });

  it("autorise un compte staff actif", () => {
    expect(evaluateStaffAccess({ active: true })).toBe(true);
  });
});
