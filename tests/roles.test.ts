import { describe, expect, it } from "vitest";
import { evaluateStaffAccess, evaluateAdminAccess, evaluateEditorAccess } from "@/server/staff-access";

describe("RBAC Staff Access Evaluation", () => {
  it("allows active staff regardless of role", () => {
    expect(evaluateStaffAccess({ active: true, role: "commercial" })).toBe(true);
    expect(evaluateStaffAccess({ active: true, role: "admin" })).toBe(true);
    expect(evaluateStaffAccess({ active: true, role: "lecture" })).toBe(true);
  });

  it("blocks inactive staff regardless of role (kill switch)", () => {
    expect(evaluateStaffAccess({ active: false, role: "admin" })).toBe(false);
    expect(evaluateStaffAccess({ active: false, role: "commercial" })).toBe(false);
    expect(evaluateStaffAccess(null)).toBe(false);
  });

  it("verifies admin role correctly", () => {
    expect(evaluateAdminAccess({ active: true, role: "admin" })).toBe(true);
    expect(evaluateAdminAccess({ active: true, role: "commercial" })).toBe(false);
    expect(evaluateAdminAccess({ active: true, role: "lecture" })).toBe(false);
    expect(evaluateAdminAccess({ active: false, role: "admin" })).toBe(false);
    expect(evaluateAdminAccess(null)).toBe(false);
  });

  it("verifies editor role correctly (admin or commercial)", () => {
    expect(evaluateEditorAccess({ active: true, role: "admin" })).toBe(true);
    expect(evaluateEditorAccess({ active: true, role: "commercial" })).toBe(true);
    expect(evaluateEditorAccess({ active: true, role: "lecture" })).toBe(false);
    expect(evaluateEditorAccess({ active: false, role: "commercial" })).toBe(false);
    expect(evaluateEditorAccess(null)).toBe(false);
  });
});
