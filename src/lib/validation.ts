import { z } from "zod";
import { PROSPECT_STATUSES } from "@/server/prospects-filter";

export const ProspectCategorySchema = z.enum(["boutique_telephone", "pme", "diaspora"]);

export const ProspectInputSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(1, "Le téléphone est requis"),
  city: z.string().min(1, "La ville est requise"),
  category: ProspectCategorySchema,
  whatsapp: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ProspectInput = z.infer<typeof ProspectInputSchema>;

export const RelanceInputSchema = z.object({
  prospectId: z.string().uuid(),
  dueDate: z.string().date("Date invalide"),
  note: z.string().optional().or(z.literal("")),
});

export type RelanceInput = z.infer<typeof RelanceInputSchema>;

export const ProspectStatusSchema = z.enum(PROSPECT_STATUSES);

export const LoginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
