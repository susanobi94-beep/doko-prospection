// RFC 4180 : entoure de guillemets si la valeur contient une virgule, un guillemet ou un
// retour à la ligne ; double les guillemets internes.
export function escapeCsvField(value: string): string {
  // Neutralise l'injection de formule (Excel/Sheets exécute une valeur commençant par
  // =, +, -, @, tabulation ou retour chariot comme une formule à l'ouverture du fichier).
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function writeCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",") + "\n";
}
