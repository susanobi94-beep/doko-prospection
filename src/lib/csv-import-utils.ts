export type ValidatedProspectRow = {
  name: string;
  phone: string;
  city: string;
  category: string;
  whatsapp?: string;
  address?: string;
  source?: string;
  notes?: string;
};

export type RowError = {
  row: number;
  error: string;
};

export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Détecte le séparateur (point-virgule ou virgule ou tabulation)
  const firstLine = lines[0];
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  let delimiter = ",";
  if (semicolons > commas && semicolons > tabs) {
    delimiter = ";";
  } else if (tabs > commas && tabs > semicolons) {
    delimiter = "\t";
  }

  // Parse une ligne CSV en tenant compte des guillemets
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (parsed.some((cell) => cell.length > 0)) {
      rows.push(parsed);
    }
  }

  return { headers, rows };
}

export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[\s\-().+]/g, "").trim();
}

export function mapAndValidateRows(
  headers: string[],
  rows: string[][],
  mapping: Record<string, string> // e.g. { name: "Nom", phone: "Telephone" }
): { valid: ValidatedProspectRow[]; errors: RowError[] } {
  const headerIndices: Record<string, number> = {};
  for (const [field, mappedHeader] of Object.entries(mapping)) {
    const index = headers.findIndex(
      (h) => h.toLowerCase() === mappedHeader.toLowerCase()
    );
    if (index !== -1) {
      headerIndices[field] = index;
    }
  }

  const valid: ValidatedProspectRow[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 pour 0-index, +1 pour ligne d'en-tête
    const rawName = headerIndices.name !== undefined ? row[headerIndices.name] || "" : "";
    const rawPhone = headerIndices.phone !== undefined ? row[headerIndices.phone] || "" : "";
    const rawCity = headerIndices.city !== undefined ? row[headerIndices.city] || "" : "";
    const rawCategory = headerIndices.category !== undefined ? row[headerIndices.category] || "" : "";
    const rawWa = headerIndices.whatsapp !== undefined ? row[headerIndices.whatsapp] || "" : "";
    const rawAddress = headerIndices.address !== undefined ? row[headerIndices.address] || "" : "";
    const rawSource = headerIndices.source !== undefined ? row[headerIndices.source] || "" : "";
    const rawNotes = headerIndices.notes !== undefined ? row[headerIndices.notes] || "" : "";

    const name = rawName.trim();
    const phone = normalizePhoneNumber(rawPhone);

    if (!name) {
      errors.push({ row: rowNumber, error: "Le nom de la boutique est obligatoire" });
      return;
    }

    if (!phone || phone.length < 6) {
      errors.push({ row: rowNumber, error: "Le numéro de téléphone est manquant ou invalide" });
      return;
    }

    const city = rawCity.trim() || "Non renseignée";
    let category = rawCategory.trim().toLowerCase();
    if (!["boutique_telephone", "pme", "diaspora"].includes(category)) {
      category = "boutique_telephone";
    }

    const whatsapp = rawWa.trim() ? normalizePhoneNumber(rawWa) : undefined;

    valid.push({
      name,
      phone,
      city,
      category,
      whatsapp: whatsapp || undefined,
      address: rawAddress.trim() || undefined,
      source: rawSource.trim() || undefined,
      notes: rawNotes.trim() || undefined,
    });
  });

  return { valid, errors };
}

export function deduplicateCsvRows(rows: ValidatedProspectRow[]): {
  unique: ValidatedProspectRow[];
  fileDuplicates: ValidatedProspectRow[];
} {
  const seenPhones = new Set<string>();
  const unique: ValidatedProspectRow[] = [];
  const fileDuplicates: ValidatedProspectRow[] = [];

  for (const row of rows) {
    if (seenPhones.has(row.phone)) {
      fileDuplicates.push(row);
    } else {
      seenPhones.add(row.phone);
      unique.push(row);
    }
  }

  return { unique, fileDuplicates };
}
