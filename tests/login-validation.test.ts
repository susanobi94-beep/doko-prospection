import { describe, expect, it } from "vitest";
import { LoginInputSchema } from "@/lib/validation";

describe("LoginInputSchema", () => {
  it("normalise l'email (espaces, casse)", () => {
    const r = LoginInputSchema.safeParse({ email: "  Richard@Example.COM ", password: "x" });
    expect(r.success && r.data.email).toBe("richard@example.com");
  });

  it("refuse un email invalide", () => {
    expect(LoginInputSchema.safeParse({ email: "pas-un-email", password: "x" }).success).toBe(false);
  });

  it("refuse un mot de passe vide", () => {
    expect(LoginInputSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
