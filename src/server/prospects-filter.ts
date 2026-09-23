export const PROSPECT_STATUSES = ["a_contacter", "contacte", "interesse", "client", "refuse"] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export type ProspectsFilterInput = {
  status?: string;
  city?: string;
  search?: string;
  assignedTo?: string;
};

export type ProspectsFilter = {
  status?: ProspectStatus;
  city?: string;
  search?: string;
  assignedTo?: string;
};

// Échappe un terme utilisateur pour un usage sûr dans un motif ILIKE PostgREST
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,.()]/g, "").replace(/[%_\\]/g, "\\$&");
}

// Fonction pure, sans import ni appel réseau — testée isolément dans tests/prospects-query.test.ts
export function buildProspectsFilter(input: ProspectsFilterInput): ProspectsFilter {
  const filter: ProspectsFilter = {};

  if (input.status && (PROSPECT_STATUSES as readonly string[]).includes(input.status)) {
    filter.status = input.status as ProspectStatus;
  }
  if (input.city && input.city.trim() !== "") {
    filter.city = input.city.trim();
  }
  if (input.search && input.search.trim() !== "") {
    filter.search = input.search.trim();
  }
  if (input.assignedTo && input.assignedTo.trim() !== "") {
    filter.assignedTo = input.assignedTo.trim();
  }

  return filter;
}
