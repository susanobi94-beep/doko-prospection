export type StaffRow = { active: boolean } | null;

// Fonction pure, sans import ni appel réseau — testée isolément dans tests/staff-gate.test.ts,
// séparée de staff.ts pour ne pas entraîner le chargement de env.ts (et son échec bruyant si
// les variables Supabase sont absentes) à la simple importation de cette logique.
export function evaluateStaffAccess(row: StaffRow): boolean {
  return row !== null && row.active === true;
}
