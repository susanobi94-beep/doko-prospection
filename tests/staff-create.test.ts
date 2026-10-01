import { describe, expect, it } from "vitest";
import { StaffCreateSchema } from "@/lib/validation";

describe("StaffCreateSchema Validation", () => {
  it("accepts valid commercial staff member input with phone", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Paul Biya",
      email: "paul@doko.cm",
      phone: "699112233",
      role: "commercial",
      password: "secretpassword123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.phone).toBe("699112233");
    }
  });

  it("normalizes email to lowercase and trims whitespace", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Alice",
      email: "  Alice@Doko.CM  ",
      phone: " +237677889900 ",
      role: "admin",
      password: "password123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("alice@doko.cm");
      expect(res.data.phone).toBe("+237677889900");
    }
  });

  it("rejects missing or too short phone number", () => {
    const resMissing = StaffCreateSchema.safeParse({
      name: "Jean",
      email: "jean@doko.cm",
      role: "commercial",
      password: "password123",
    });
    expect(resMissing.success).toBe(false);

    const resShort = StaffCreateSchema.safeParse({
      name: "Jean",
      email: "jean@doko.cm",
      phone: "123",
      role: "commercial",
      password: "password123",
    });
    expect(resShort.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Bob",
      email: "bob@doko.cm",
      phone: "699112233",
      role: "superman",
      password: "password123",
    });
    expect(res.success).toBe(false);
  });

  it("rejects passwords shorter than 6 characters", () => {
    const res = StaffCreateSchema.safeParse({
      name: "Charlie",
      email: "charlie@doko.cm",
      phone: "699112233",
      role: "commercial",
      password: "123",
    });
    expect(res.success).toBe(false);
  });
});
