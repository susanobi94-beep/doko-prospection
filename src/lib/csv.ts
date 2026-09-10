// RFC 4180 : entoure de guillemets si la valeur contient une virgule, un guillemet ou un
// retour à la ligne ; double les guillemets internes.
export function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function writeCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",") + "\n";
}
