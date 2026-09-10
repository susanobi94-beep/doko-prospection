export const PROSPECT_STATUSES = ["a_contacter", "contacte", "interesse", "client", "refuse"] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export type ProspectsFilterInput = {
  status?: string;
  city?: string;
  search?: string;
};

export type ProspectsFilter = {
  status?: ProspectStatus;
  city?: string;
  search?: string;
};

// Fonction pure, sans import ni appel réseau — testée isolément dans
// tests/prospects-query.test.ts, séparée de prospects.ts pour ne pas entraîner le
// chargement de env.ts (voir la même raison en src/server/staff-access.ts).
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

  return filter;
}
