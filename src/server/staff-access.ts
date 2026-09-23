export type StaffRow = { active?: boolean; role?: string } | null;

// Fonction pure, sans import ni appel réseau — testée isolément dans tests/staff-gate.test.ts,
// séparée de staff.ts pour ne pas entraîner le chargement de env.ts à la simple importation.
export function evaluateStaffAccess(row: StaffRow): boolean {
  return row !== null && row.active === true;
}

export function evaluateAdminAccess(row: StaffRow): boolean {
  return row !== null && row.active !== false && row.role === "admin";
}

export function evaluateEditorAccess(row: StaffRow): boolean {
  return row !== null && row.active !== false && (row.role === "admin" || row.role === "commercial" || !row.role);
}
