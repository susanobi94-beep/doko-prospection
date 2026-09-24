"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  parseCsvText,
  mapAndValidateRows,
  deduplicateCsvRows,
  type ValidatedProspectRow,
  type RowError,
} from "@/lib/csv-import-utils";
import {
  checkExistingPhones,
  importProspectsBatchAction,
  type ImportBatchResult,
} from "@/server/import-actions";

type Step = "upload" | "mapping" | "preview" | "done";

const DOKO_FIELDS = [
  { key: "name", label: "Nom de la boutique", required: true, autoKeywords: ["nom", "name", "boutique", "magasin", "shop"] },
  { key: "phone", label: "Numéro de téléphone", required: true, autoKeywords: ["phone", "tel", "telephone", "contact", "mobile"] },
  { key: "city", label: "Ville", required: false, autoKeywords: ["ville", "city", "lieu", "quartier"] },
  { key: "category", label: "Catégorie", required: false, autoKeywords: ["cat", "category", "categorie", "type", "secteur"] },
  { key: "whatsapp", label: "WhatsApp", required: false, autoKeywords: ["wa", "whatsapp"] },
  { key: "address", label: "Adresse / Quartier", required: false, autoKeywords: ["adresse", "address", "localisation"] },
  { key: "source", label: "Source d'acquisition", required: false, autoKeywords: ["source", "canal", "origine"] },
  { key: "notes", label: "Notes / Commentaires", required: false, autoKeywords: ["notes", "commentaire", "remarque", "description"] },
];

export function CsvImporter() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [validRows, setValidRows] = useState<ValidatedProspectRow[]>([]);
  const [fileDuplicates, setFileDuplicates] = useState<ValidatedProspectRow[]>([]);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [dbDuplicatesCount, setDbDuplicatesCount] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<ImportBatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Étape 1 : Lecture du fichier CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCsvText(text);

      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setErrorMsg("Le fichier CSV semble vide ou non reconnu.");
        return;
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto-détection intelligente du mapping
      const initialMapping: Record<string, string> = {};
      DOKO_FIELDS.forEach((field) => {
        const found = parsed.headers.find((header) => {
          const lower = header.toLowerCase();
          return field.autoKeywords.some((kw) => lower.includes(kw));
        });
        if (found) {
          initialMapping[field.key] = found;
        }
      });

      setMapping(initialMapping);
      setStep("mapping");
    };

    reader.readAsText(file, "UTF-8");
  };

  // Étape 2 : Validation du mapping et passage à la prévisualisation
  const handleConfirmMapping = () => {
    if (!mapping.name || !mapping.phone) {
      setErrorMsg("Vous devez impérativement faire correspondre le 'Nom' et le 'Téléphone'.");
      return;
    }

    setErrorMsg(null);
    const { valid, errors } = mapAndValidateRows(headers, rawRows, mapping);
    const { unique, fileDuplicates: fDups } = deduplicateCsvRows(valid);

    setValidRows(unique);
    setFileDuplicates(fDups);
    setRowErrors(errors);
    setDbDuplicatesCount(null);
    setStep("preview");

    // Lancer immédiatement la vérification des doublons en base
    startTransition(async () => {
      const existing = await checkExistingPhones(unique.map((u) => u.phone));
      setDbDuplicatesCount(existing.length);
    });
  };

  // Étape 3 : Exécution du lot d'import
  const handleImportBatch = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await importProspectsBatchAction(validRows);
      if (!res.ok) {
        setErrorMsg(res.error || "Une erreur est survenue lors de l'import");
        return;
      }
      setImportResult(res);
      setStep("done");
    });
  };

  const netToImport = validRows.length - (dbDuplicatesCount || 0);

  return (
    <div className="space-y-6">
      {/* Barre d'étapes */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 text-xs font-medium">
        <span className={step === "upload" ? "font-bold text-[var(--primary)]" : "text-[var(--fg-muted)]"}>
          1. Sélection du fichier
        </span>
        <span>→</span>
        <span className={step === "mapping" ? "font-bold text-[var(--primary)]" : "text-[var(--fg-muted)]"}>
          2. Correspondance des colonnes
        </span>
        <span>→</span>
        <span className={step === "preview" ? "font-bold text-[var(--primary)]" : "text-[var(--fg-muted)]"}>
          3. Prévisualisation & Doublons
        </span>
        <span>→</span>
        <span className={step === "done" ? "font-bold text-emerald-600" : "text-[var(--fg-muted)]"}>
          4. Rapport final
        </span>
      </div>

      {errorMsg && (
        <div className="rounded-[6px] border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Étape 1 : Upload */}
      {step === "upload" && (
        <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-2xl text-[var(--primary)]">
            📁
          </div>
          <h2 className="text-sm font-bold text-[var(--fg)]">
            Importer un fichier de prospection (CSV)
          </h2>
          <p className="mt-1 text-xs text-[var(--fg-muted)] max-w-md mx-auto">
            Sélectionnez un fichier CSV exporté d&apos;Excel, Google Sheets ou d&apos;une autre base.
            Les séparateurs par virgule (,), point-virgule (;) ou tabulation sont automatiquement gérés.
          </p>

          <label className="mt-4 inline-block cursor-pointer rounded-[6px] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-fg)] hover:opacity-90 transition-opacity">
            Choisir un fichier CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Étape 2 : Mapping */}
      {step === "mapping" && (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--fg)]">
              Associer les colonnes de votre fichier ({fileName})
            </h2>
            <p className="text-xs text-[var(--fg-muted)]">
              Indiquez à quel champ Doko correspond chaque colonne de votre fichier CSV ({rawRows.length} lignes détectées).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DOKO_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-[var(--fg)] flex items-center justify-between">
                  <span>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)]">{field.key}</span>
                </label>
                <select
                  value={mapping[field.key] || ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field.key]: e.target.value })
                  }
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="">-- Ignorer ce champ --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      Colonne : {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="rounded-[6px] border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
            >
              ← Changer de fichier
            </button>
            <button
              type="button"
              onClick={handleConfirmMapping}
              className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-fg)] hover:opacity-90"
            >
              Continuer vers la prévisualisation →
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Preview & Duplicates */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Cartes résumé */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
              <span className="text-xs text-[var(--fg-muted)]">Lignes totales</span>
              <p className="text-lg font-bold text-[var(--fg)]">{rawRows.length}</p>
            </div>
            <div className="rounded-[8px] border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Valides & uniques</span>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{validRows.length}</p>
            </div>
            <div className="rounded-[8px] border border-amber-500/20 bg-amber-500/10 p-3 text-center">
              <span className="text-xs text-amber-700 dark:text-amber-400">Doublons en base</span>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {dbDuplicatesCount === null ? "Vérification..." : dbDuplicatesCount}
              </p>
            </div>
            <div className="rounded-[8px] border border-red-500/20 bg-red-500/10 p-3 text-center">
              <span className="text-xs text-red-600 dark:text-red-400">Lignes invalides</span>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{rowErrors.length}</p>
            </div>
          </div>

          {/* Explications & Alerte */}
          {dbDuplicatesCount !== null && dbDuplicatesCount > 0 && (
            <div className="rounded-[6px] border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              ℹ️ <strong>{dbDuplicatesCount} prospect(s)</strong> de votre fichier possèdent déjà un numéro de téléphone enregistré dans le CRM. Ils seront <strong>automatiquement ignorés</strong> pour éviter les doublons.
            </div>
          )}

          {/* Aperçu du tableau */}
          <div className="overflow-x-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)]">
                <tr>
                  <th className="p-2.5">Boutique</th>
                  <th className="p-2.5">Téléphone</th>
                  <th className="p-2.5">Ville</th>
                  <th className="p-2.5">Catégorie</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {validRows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-hover)]">
                    <td className="p-2.5 font-medium text-[var(--fg)]">{r.name}</td>
                    <td className="p-2.5 text-[var(--fg)]">{r.phone}</td>
                    <td className="p-2.5 text-[var(--fg-muted)]">{r.city}</td>
                    <td className="p-2.5 text-[var(--fg-muted)]">{r.category}</td>
                    <td className="p-2.5 text-[var(--fg-muted)] truncate max-w-xs">{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validRows.length > 8 && (
              <div className="p-2 text-center text-[11px] text-[var(--fg-muted)] border-t border-[var(--border)]">
                ... et {validRows.length - 8} autres prospects à importer
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => setStep("mapping")}
              disabled={isPending}
              className="rounded-[6px] border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
            >
              ← Modifier la correspondance
            </button>
            <button
              type="button"
              onClick={handleImportBatch}
              disabled={isPending || netToImport <= 0}
              className="rounded-[6px] bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-[var(--primary-fg)] hover:opacity-90 disabled:opacity-50"
            >
              {isPending
                ? "Import en cours..."
                : `Confirmer et importer ${Math.max(0, netToImport)} prospect(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Étape 4 : Terminé */}
      {step === "done" && importResult && (
        <div className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">
            ✓
          </div>
          <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
            Importation terminée avec succès !
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto">
            <strong>{importResult.inserted}</strong> nouveau(x) prospect(s) ont été enregistrés dans votre base et sont désormais disponibles dans le pipeline.
            {importResult.skippedDuplicates > 0 && (
              <> ({importResult.skippedDuplicates} doublons ont été ignorés).</>
            )}
          </p>

          <div className="pt-4 flex justify-center gap-3">
            <Link
              href="/prospects"
              className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-fg)] hover:opacity-90"
            >
              Voir la liste des prospects →
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep("upload");
                setFileName("");
                setRawRows([]);
                setImportResult(null);
              }}
              className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
            >
              Importer un autre fichier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
