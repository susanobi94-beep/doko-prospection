import { describe, it, expect } from "vitest";
import { z } from "zod";

export const CommentInputSchema = z.object({
  prospectId: z.string().uuid("ID prospect invalide"),
  body: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(2000, "Le commentaire ne peut pas dépasser 2000 caractères"),
});

describe("Comment Input Validation", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts a valid comment", () => {
    const result = CommentInputSchema.safeParse({
      prospectId: validUuid,
      body: "Appel téléphonique effectué avec le gérant. Très intéressé par la formule Pro.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toContain("Appel téléphonique");
    }
  });

  it("rejects an empty or whitespace-only comment", () => {
    const emptyResult = CommentInputSchema.safeParse({
      prospectId: validUuid,
      body: "",
    });
    expect(emptyResult.success).toBe(false);

    const whitespaceResult = CommentInputSchema.safeParse({
      prospectId: validUuid,
      body: "   \n\t  ",
    });
    expect(whitespaceResult.success).toBe(false);
  });

  it("rejects comments exceeding 2000 characters", () => {
    const longBody = "A".repeat(2001);
    const result = CommentInputSchema.safeParse({
      prospectId: validUuid,
      body: longBody,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid prospect UUID", () => {
    const result = CommentInputSchema.safeParse({
      prospectId: "not-a-uuid",
      body: "Valid comment text",
    });
    expect(result.success).toBe(false);
  });
});
