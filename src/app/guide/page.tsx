"use client";

import { useState } from "react";
import Link from "next/link";

export default function GuideFormationPage() {
  const [activeTab, setActiveTab] = useState<"commercial" | "leader">("commercial");

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <header className="bg-slate-900 px-6 py-8 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
            📚 Manuel de Prise en Main Rapide
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl text-white">
            Doko Prospection
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Guide d&apos;utilisation terrain pour Commerciaux & Chefs d&apos;Équipe
          </p>
        </header>

        {/* Bannière lien application */}
        <div className="border-b border-slate-200 bg-emerald-50 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-emerald-900 flex flex-wrap items-center justify-center gap-2">
          <span>🌐 Lien direct de l&apos;application :</span>
          <Link
            href="/"
            className="text-emerald-700 underline hover:text-emerald-800 break-all font-bold"
          >
            https://v8es5ridujzumltffmnljmch.178.104.176.113.sslip.io
          </Link>
        </div>

        {/* Sélecteur d'onglets */}
        <div className="flex border-b border-slate-200 bg-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab("commercial")}
            className={`flex-1 py-4 text-center text-sm font-bold transition-all ${
              activeTab === "commercial"
                ? "border-b-2 border-emerald-500 bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👤 Guide Commercial Terrain
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leader")}
            className={`flex-1 py-4 text-center text-sm font-bold transition-all ${
              activeTab === "leader"
                ? "border-b-2 border-blue-600 bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👑 Guide Chef d&apos;Équipe
          </button>
        </div>

        {/* SECTION COMMERCIAL */}
        {activeTab === "commercial" && (
          <div className="space-y-4 p-5 sm:p-8">
            {/* Étape 1 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-emerald-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shrink-0">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Connexion sur smartphone (en 10 secondes)
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1">
                <p>Ouvrez le lien sur votre navigateur mobile (Chrome ou Safari).</p>
                <p>
                  Saisissez l&apos;<strong>Email</strong> et le <strong>Mot de passe</strong> transmis par votre chef d&apos;équipe.
                </p>
                <p className="text-xs text-emerald-700 font-medium pt-1">
                  💡 <strong>Astuce :</strong> Appuyez sur le menu de votre navigateur (les 3 points) puis sur <em>&quot;Ajouter à l&apos;écran d&apos;accueil&quot;</em> pour avoir l&apos;icône Doko comme une vraie application sur votre téléphone !
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-emerald-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shrink-0">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Enregistrer une boutique sur le terrain
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1.5">
                <p>Dès que vous prospectez un nouveau commerçant :</p>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                  <li>Cliquez sur le bouton vert <strong>&quot;+ Nouvelle boutique&quot;</strong>.</li>
                  <li>Renseignez le nom de la boutique (ex: <em>Boutique Phone Plus</em>).</li>
                  <li>Saisissez le numéro de téléphone principal (Orange, MTN, Camtel).</li>
                  <li>Indiquez la ville et le quartier (ex: <em>Douala - Akwa</em>, <em>Yaoundé - Mokolo</em>).</li>
                  <li>Cliquez sur <strong>&quot;Enregistrer la boutique&quot;</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-emerald-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shrink-0">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Contacter en 1 clic (Appels & WhatsApp)
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-2">
                <p>Depuis la fiche boutique ou les cartes du Kanban :</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1 font-semibold text-slate-800">
                    📞 <strong>Appel direct :</strong> Lance l&apos;appel immédiatement sur votre téléphone
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                    💬 <strong>WhatsApp en 1 clic :</strong> Ouvre la discussion sans avoir à enregistrer le numéro
                  </span>
                </div>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-emerald-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shrink-0">
                  4
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Le cycle de vente (5 statuts du Pipeline)
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700">
                <p className="mb-2">Faites évoluer le prospect au fil de vos échanges :</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-semibold">
                  <div className="rounded-lg border border-slate-200 p-2 bg-slate-50">
                    <span className="block text-slate-500 font-bold mb-1">1</span>
                    À contacter
                  </div>
                  <div className="rounded-lg border border-blue-200 p-2 bg-blue-50 text-blue-800">
                    <span className="block font-bold mb-1">2</span>
                    Contacté
                  </div>
                  <div className="rounded-lg border border-purple-200 p-2 bg-purple-50 text-purple-800">
                    <span className="block font-bold mb-1">3</span>
                    Intéressé
                  </div>
                  <div className="rounded-lg border border-emerald-300 p-2 bg-emerald-50 text-emerald-800">
                    <span className="block font-bold mb-1">4</span>
                    🎉 Client
                  </div>
                  <div className="rounded-lg border border-rose-200 p-2 bg-rose-50 text-rose-800">
                    <span className="block font-bold mb-1">5</span>
                    Refusé
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 5 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-emerald-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shrink-0">
                  5
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Planifier une relance (ne jamais oublier un prospect)
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1.5">
                <p>Si le gérant vous demande de le recontacter plus tard :</p>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                  <li>Ouvrez la fiche boutique et descendez à <strong>&quot;Planifier une relance&quot;</strong>.</li>
                  <li>Choisissez la date et l&apos;heure avec une consigne claire.</li>
                  <li>Le jour J, elle s&apos;affiche en rouge/orange dans vos <strong>⏰ Relances urgentes</strong>.</li>
                  <li>Après l&apos;échange, cliquez sur <strong>&quot;Marquer fait&quot;</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECTION CHEF D'ÉQUIPE */}
        {activeTab === "leader" && (
          <div className="space-y-4 p-5 sm:p-8">
            {/* Étape 1 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Piloter vos sous-équipes par secteur
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1.5">
                <p>Depuis le menu <strong>🏢 Équipes & Secteurs</strong> (`/settings/teams`) :</p>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                  <li>Visualisez vos métropoles : <strong>Douala</strong>, <strong>Yaoundé</strong>, <strong>Bafoussam</strong>, etc.</li>
                  <li>Visualisez vos quartiers : <em>Akwa, Bonabéri, Marché Central, Mokolo, Bastos</em>...</li>
                  <li>Créez un nouveau quartier en 1 clic via le bouton <strong>&quot;+ Créer une équipe / sous-équipe&quot;</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Affecter les commerciaux en 1 clic
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1.5">
                <p>Dans la page des équipes :</p>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                  <li>Sur chaque carte de sous-équipe, utilisez le menu déroulant <strong>&quot;+ Affecter un commercial&quot;</strong>.</li>
                  <li>Le collaborateur est immédiatement rattaché au secteur sans recharger la page.</li>
                  <li>Désignez les 👑 <strong>Chefs d&apos;équipe</strong> référents par zone.</li>
                </ul>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Suivre la conversion et les performances (Tableau de bord)
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1.5">
                <p>Sur l&apos;accueil (<strong>📊 Tableau de bord</strong>) :</p>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                  <li>Le bloc <strong>&quot;🏢 Performance par Équipe & Zone&quot;</strong> classe les secteurs par volume et taux de conversion.</li>
                  <li>Identifiez instantanément les zones les plus dynamiques et celles qui nécessitent un renfort commercial.</li>
                  <li>Cliquez sur un secteur pour afficher directement tous ses prospects !</li>
                </ul>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                  4
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Importer des fichiers de prospection en masse (CSV)
                </h2>
              </div>
              <div className="mt-2 pl-10 text-sm text-slate-700 space-y-1.5">
                <p>Depuis le menu <strong>📥 Importer CSV</strong> :</p>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                  <li>Chargez vos listes de commerces récoltées sur le terrain ou depuis un annuaire.</li>
                  <li>Le système détecte automatiquement les doublons pour ne jamais écraser vos contacts existants.</li>
                  <li>Attribuez le lot entier à un commercial en 1 seule action.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
          Doko Prospection • Outil de suivi terrain officiel • Cameroun & Afrique
        </footer>
      </div>
    </div>
  );
}
