import { describe, expect, it } from "vitest";
import { StaffCreateSchema } from "@/lib/validation";

describe("StaffCreateSchema Validation", () => {
  it("accepts valid commercial staff member input", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Paul Biya",
      email: "paul@doko.cm",
      role: "commercial",
      password: "secretpassword123",
    });
    expect(res.success).toBe(true);
  });

  it("normalizes email to lowercase and trims whitespace", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Alice",
      email: "  Alice@Doko.CM  ",
      role: "admin",
      password: "password123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("alice@doko.cm");
    }
  });

  it("rejects invalid role", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Bob",
      email: "bob@doko.cm",
      role: "superman",
      password: "password123",
    });
    expect(res.success).toBe(false);
  });

  it("rejects passwords shorter than 6 characters", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Charlie",
      email: "charlie@doko.cm",
      role: "commercial",
      password: "123",
    });
    expect(res.success).toBe(false);
  });
});
