"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProspectFormState } from "@/server/prospects-actions";
import type { Prospect } from "@/server/prospects";
import type { StaffMember } from "@/server/staff";

type Action = (state: ProspectFormState, formData: FormData) => Promise<ProspectFormState>;

export function ProspectForm({
  action,
  defaultValues,
  staffList,
}: {
  action: Action;
  defaultValues?: Partial<Prospect> & {
    whatsapp?: string | null;
    address?: string | null;
    source?: string | null;
    notes?: string | null;
    assigned_to?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  staffList?: StaffMember[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ProspectFormState, FormData>(action, null);

  const [latitude, setLatitude] = useState<string>(
    defaultValues?.latitude !== undefined && defaultValues?.latitude !== null ? String(defaultValues.latitude) : ""
  );
  const [longitude, setLongitude] = useState<string>(
    defaultValues?.longitude !== undefined && defaultValues?.longitude !== null ? String(defaultValues.longitude) : ""
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (state?.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  const handleCaptureGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsMessage({ text: "La géolocalisation n'est pas supportée par votre navigateur.", isError: true });
      return;
    }
    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setGpsLoading(false);
        setGpsMessage({ text: `Position GPS détectée avec succès (précision ±${acc}m) !`, isError: false });
      },
      (err) => {
        setGpsLoading(false);
        let msg = "Impossible de récupérer votre position GPS.";
        if (err.code === 1) {
          msg = "Veuillez autoriser l'accès GPS dans votre navigateur.";
        } else if (err.code === 2) {
          msg = "Signal GPS indisponible ou trop faible. Réessayez à ciel ouvert.";
        } else if (err.code === 3) {
          msg = "Délai dépassé pour la capture GPS. Réessayez.";
        }
        setGpsMessage({ text: msg, isError: true });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-[720px] space-y-4">
      {state && !state.ok && state.error && (
        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      <Field label="Nom de la boutique / entreprise" name="name" defaultValue={defaultValues?.name} error={fieldErrors.name} required />
      <Field label="Téléphone principal" name="phone" defaultValue={defaultValues?.phone} error={fieldErrors.phone} required />
      <Field label="Ville (ex: Douala, Yaoundé, Bafoussam...)" name="city" defaultValue={defaultValues?.city} error={fieldErrors.city} required />

      <div>
        <Label htmlFor="category">Catégorie</Label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? ""}
          aria-describedby={fieldErrors.category ? "category-error" : undefined}
          className="mt-1 h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
          required
        >
          <option value="">Choisir…</option>
          <option value="boutique_telephone">Boutique téléphone & accessoires</option>
          <option value="pme">PME commerciale / Commerce de détail</option>
          <option value="diaspora">Boutique / Contact Diaspora</option>
        </select>
        {fieldErrors.category && (
          <p id="category-error" className="mt-1 text-xs text-[var(--destructive)]">
            {fieldErrors.category}
          </p>
        )}
      </div>

      {/* Attribution à un collaborateur */}
      {staffList && staffList.length > 0 && (
        <div>
          <Label htmlFor="assignedTo">Assigner à un commercial</Label>
          <select
            id="assignedTo"
            name="assignedTo"
            defaultValue={defaultValues?.assigned_to ?? ""}
            className="mt-1 h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
          >
            <option value="">Non assigné (ouvre pour toute l&apos;équipe)</option>
            {staffList
              .filter((s) => s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
          </select>
        </div>
      )}

      <Field label="Numéro WhatsApp (si différent)" name="whatsapp" defaultValue={defaultValues?.whatsapp ?? ""} />
      <Field label="Adresse physique / Quartier" name="address" defaultValue={defaultValues?.address ?? ""} />

      {/* Section Coordonnées GPS Terrain */}
      <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--fg)] flex items-center gap-1.5">
              <span>📍</span> Localisation GPS Terrain (Optionnel)
            </h3>
            <p className="text-xs text-[var(--fg-muted)]">
              Capturez la position exacte de la boutique pour la navigation Google Maps et les tournées.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCaptureGps}
            disabled={gpsLoading}
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {gpsLoading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Détection GPS en cours…
              </>
            ) : (
              <>📍 Capturer ma position GPS</>
            )}
          </button>
        </div>

        {gpsMessage && (
          <div
            className={`rounded-[6px] px-3 py-2 text-xs font-medium ${
              gpsMessage.isError
                ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            {gpsMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="ex: 4.051056"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
            {fieldErrors.latitude && (
              <p className="mt-1 text-xs text-[var(--destructive)]">{fieldErrors.latitude}</p>
            )}
          </div>
          <div>
            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="ex: 9.767868"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
            {fieldErrors.longitude && (
              <p className="mt-1 text-xs text-[var(--destructive)]">{fieldErrors.longitude}</p>
            )}
          </div>
        </div>

        {latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-emerald-600 font-medium">✓ Coordonnées enregistrées</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              🗺️ Tester sur Google Maps ↗
            </a>
            <button
              type="button"
              onClick={() => {
                setLatitude("");
                setLongitude("");
                setGpsMessage(null);
              }}
              className="text-[var(--fg-muted)] hover:text-red-600 ml-auto"
            >
              Effacer
            </button>
          </div>
        )}
      </div>

      <Field label="Source d'acquisition (Facebook, Recommandation, Terrain...)" name="source" defaultValue={defaultValues?.source ?? ""} />

      <div>
        <Label htmlFor="notes">Notes & observations</Label>
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} className="mt-1" />
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
      >
        {pending ? "Enregistrement en cours…" : "Enregistrer la boutique"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        aria-describedby={error ? `${name}-error` : undefined}
        className="mt-1"
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-[var(--destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
