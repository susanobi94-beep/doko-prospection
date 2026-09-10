# Doko Prospection — Blueprint

> Généré par The Architect le 2026-09-09
> Shape : internal-tool · `knowledge/shapes/internal-tool.md`
> Runtime track : ts-node · `knowledge/runtime-tracks/ts-node.md`
> Mode d'émission : fichier unique (11 étapes ≤ 11 → fichier unique)
> Version du blueprint : 1
> Versions vérifiées le : 2026-09-09 — voir §11 pour la provenance par paquet

---

## 1. Aperçu du projet & Non-objectifs

### Vision
Doko Prospection est l'outil interne (2-3 personnes) qui remplace le suivi manuel WhatsApp/tableur des
boutiques camerounaises et canadiennes démarchées pour le bot SaaS Doko et la vente B2B par téléphone.
Chaque boutique (« prospect ») porte un statut de pipeline (à contacter → contacté → intéressé → client
→ refusé), des relances datées pour les rappels, des notes, et un historique d'activité léger — pour
que deux personnes ne rappellent jamais la même boutique. Connexion Google uniquement, aucune
inscription publique, aucune facturation.

### Utilisateurs
| Persona | Vient faire | Fréquence |
|---|---|---|
| Fondateur / propriétaire de Doko | Piloter le pipeline, arbitrer les relances en retard | Quotidien |
| Collaborateur commercial (1-2) | Ajouter des prospects, changer leur statut, traiter ses relances | Quotidien |

### Objectifs — périmètre v1
1. Chaque boutique démarchée a une fiche unique avec statut, historique et relances — plus de doublons d'appel entre collaborateurs.
2. Le passage d'un statut à l'autre est tracé (qui, quand, avant/après) sans effort supplémentaire pour l'utilisateur.
3. Les relances en retard sont visibles en un coup d'œil dès la connexion, sans avoir à les chercher.
4. L'export CSV du pipeline filtré est disponible en un clic pour le reporting ponctuel.

### Non-objectifs — hors périmètre v1 explicite
| Ne pas construire | Pourquoi pas maintenant | Revisiter quand |
|---|---|---|
| Inscription libre / invitation en self-service | 2-3 comptes connus à l'avance, un insert SQL suffit | L'équipe dépasse 5 personnes |
| Rôles/permissions par ressource (admin vs lecture seule) | Un seul niveau d'accès ("staff actif") couvre l'usage réel | Un collaborateur ne doit voir qu'une partie du pipeline |
| Intégration API WhatsApp/SMS | L'appel et le message restent manuels hors outil | Le volume justifie l'automatisation de l'envoi |
| Notifications email pour les relances | Un badge visuel « en retard » dans l'app suffit à ce volume | Les relances sont oubliées malgré le badge |
| Application mobile native | Le web responsive couvre l'usage bureau/tablette actuel | Un usage terrain mobile intensif apparaît |
| Tableau de bord analytique au-delà de compteurs de statut | Aucun besoin de reporting avancé exprimé | Un besoin de reporting récurrent apparaît |
| Multi-tenant | Une seule organisation utilise l'outil | Doko revend l'outil à d'autres organisations |

**Le builder ne doit rien implémenter de ce tableau**, même si cela semble être un petit ajout pendant
une étape adjacente. Si une étape semble exiger un non-objectif, c'est un défaut du blueprint — arrêter
et le signaler plutôt que d'étendre le périmètre.

### Indicateurs de succès
| Métrique | Cible | Mesure |
|---|---|---|
| Adoption | 100 % des appels de prospection saisis dans l'outil sous 2 semaines | Comparaison du nombre de prospects créés vs nombre d'appels rapportés en réunion d'équipe |
| Doublons d'appel | 0 appel en double sur un même prospect sur 30 jours | Lecture de `activity_log` — deux `status_changed` par des `actor_id` différents à moins de 24h sur le même `prospect_id` |
| Relances traitées | 90 % des relances dues traitées (`done=true`) sous 48h de leur échéance | Requête sur `relances` |

---

## 2. Stack technique

**Runtime track : ts-node.** Ce tableau nomme des *choix*, pas des versions. Chaque version pinnée vit
en §11 et nulle part ailleurs.

Les versions viennent du rapport `stack-researcher` produit dans cette session (vérifié 2026-09-09, voir
tableau fourni), qui fait autorité. `knowledge/runtime-tracks/ts-node.md` (vérifié 2026-07-27) sert de
repli pour les paquets que le rapport n'a pas résolus (vitest, tsx, `@types/*`), et ses réserves non
vérifiées sont reportées telles quelles.

| Couche | Choix | Pourquoi, plutôt que quoi |
|---|---|---|
| Langage / runtime | Node.js 24.x LTS ("Krypton") + TypeScript 6.0.3 | LTS actif ; TS 7.x écarté explicitement — pas d'API compilateur programmatique stable et `typescript-eslint` rejette son intervalle peer (voir mise en garde §11) |
| Framework | Next.js 16 (App Router) | Un seul langage front/back, Server Actions natifs pour le CRUD, adaptateur Vercel zéro-config — plutôt qu'un SPA + API séparée qui doublerait la validation |
| Styling | Tailwind CSS v4 (config CSS `@theme`) | Système de tokens déjà défini en §7, pas de fichier JS de config à maintenir |
| Composants | shadcn CLI (composants copiés dans le repo) | Table de données, dialog, badge, form déjà prêts pour un panneau interne dense — pas une dépendance externe à mettre à jour |
| Base de données | Postgres géré par Supabase | RLS native = tout le modèle d'autorisation de ce projet (voir §8) ; pas d'ORM séparé à synchroniser avec les policies |
| Accès aux données | `@supabase/supabase-js` + `@supabase/ssr` (client direct, pas d'ORM) | Le modèle de données est simple (4 tables) ; un ORM ajouterait une couche de mapping sans bénéfice ici — voir §11 « Délibérément non utilisé » |
| Auth | Supabase Auth (Google OAuth) + table d'allowlist `staff` | Connexion Google native à Supabase, filtrage applicatif par allowlist plutôt qu'un fournisseur d'identité séparé (éviterait un deuxième cookie de session, voir `stack-compatibility.md`) |
| Traitement en arrière-plan | Aucun (NON APPLICABLE) | Aucun job asynchrone : l'export CSV (~100-300 lignes) est streamé en synchrone dans la requête HTTP |
| Paiements | NON APPLICABLE | Outil interne, aucune facturation |
| Stockage de fichiers | NON APPLICABLE | Aucun fichier utilisateur à stocker ; le CSV est généré à la volée, jamais persisté |
| Email / notifications | NON APPLICABLE | Aucune notification email en v1 (voir Non-objectifs) |
| Hébergement | Vercel | Adaptateur Next.js natif, déploiement en minutes, cohérent avec le choix du framework |
| Gestionnaire de paquets | npm | Le brief fixe `--use-npm` sur le scaffold ; pas de monorepo, aucun bénéfice à pnpm ici |

### Vérification de compatibilité
Vérifié contre `knowledge/stack-compatibility.md` — aucune combinaison connue comme incompatible ne
s'applique. Point de vigilance retenu du tableau « Auth-to-database pairings » : Supabase Auth + Supabase
Postgres est la paire la plus étroitement intégrée (la session est déjà dans le contexte des RLS
policies) — c'est exactement la raison du choix, pas une exception à documenter.

---

## 3. Structure des répertoires

```
doko-prospection/
  src/
    app/
      layout.tsx                     # layout racine, police Sora + police système
      globals.css                    # @import "tailwindcss"; + @theme (tokens §7)
      page.tsx                       # redirige vers /prospects (staff actif) ou /login
      login/
        page.tsx                     # bouton "Se connecter avec Google"
      access-denied/
        page.tsx                     # écran affiché si le compte Google n'est pas dans `staff` (actif)
      auth/
        callback/route.ts            # échange le code OAuth, vérifie l'allowlist, redirige
      (dashboard)/
        layout.tsx                   # sidebar + header, garde staff-actif appliquée ici
        page.tsx                     # redirection vers /prospects
        prospects/
          page.tsx                   # liste paginée côté serveur, filtres, recherche
          new/
            page.tsx                 # formulaire d'ajout
          [id]/
            page.tsx                 # détail + fil d'activité
            edit/
              page.tsx                # formulaire d'édition
        relances/
          page.tsx                   # relances dues aujourd'hui / en retard, bascule "fait"
      api/
        health/
          route.ts                   # GET — vérifie que Supabase répond (auth.getSession(), sans dépendance au schéma)
        export/
          route.ts                   # GET — CSV streamé, respecte les filtres de la query string
    components/
      ui/                            # primitives shadcn — générées, ne pas les abstraire
      layout/
        sidebar.tsx
        header.tsx
      prospects/
        prospects-table.tsx          # table shadcn `data-table`, tri/filtre server-driven
        prospect-form.tsx            # formulaire natif + Server Action, validation zod
        status-select.tsx            # sélecteur de statut, appelle changeProspectStatus()
        prospect-activity-feed.tsx   # rendu du fil `activity_log`
      relances/
        relance-list.tsx
        relance-form.tsx
    server/
      staff.ts                       # requireActiveStaff() — le seul point d'entrée d'autorisation
      prospects.ts                   # Server Actions : list, create, update, changeStatus, softDelete
      relances.ts                    # Server Actions : create, listDue, markDone
    lib/
      supabase/
        client.ts                    # client navigateur (@supabase/ssr createBrowserClient)
        server.ts                    # client serveur (@supabase/ssr createServerClient, await cookies())
      env.ts                         # schéma zod pour process.env, importé partout au lieu de process.env
      csv.ts                         # writeCsvRow() — échappement RFC 4180
      validation.ts                  # schémas zod partagés (ProspectInput, RelanceInput)
    proxy.ts                         # PAS middleware.ts (renommé en Next 16) — rafraîchit la session Supabase
  supabase/
    migrations/
      0001_init.sql                  # schéma complet + RLS + fonctions RPC — §4
  scripts/
    test-rls.ts                      # vérification automatisée des policies RLS — étape 4
    seed-staff.ts                    # insère les 2-3 comptes staff connus (idempotent)
  tests/
    csv.test.ts                      # test unitaire de l'échappement CSV
    staff-gate.test.ts               # test unitaire de la logique pure d'autorisation staff
    prospects-query.test.ts          # test unitaire de buildProspectsFilter() — étape 6
  .env.example
  vitest.config.ts
  next.config.ts
  tsconfig.json                      # généré par le scaffold, non modifié (voir §19.6)
  eslint.config.mjs                  # généré par le scaffold (--eslint)
  package.json
  package-lock.json
  .gitignore
  .nvmrc                             # "24"
  CLAUDE.md
  AGENTS.md
  .claude/
    settings.json
    skills/
      add-migration/
        SKILL.md
    rules/
      database.md
      components.md
```

**Règles de frontière**
- `src/app/**` n'importe jamais `src/lib/supabase/server.ts` directement pour une mutation : toute
  écriture passe par `src/server/**` (Server Actions), qui est le seul endroit qui appelle
  `requireActiveStaff()` avant de toucher la base.
- `src/components/**` n'importe jamais `src/lib/supabase/**` ni `src/server/**` : un composant reçoit
  des données en props ou appelle une Server Action passée en callback.
- `src/lib/supabase/server.ts` est le seul fichier qui ouvre un client Supabase côté serveur avec les
  cookies de session ; `scripts/*.ts` ouvrent leur propre client avec la clé de service, jamais partagé
  avec le code applicatif.

**Convention de résolution des modules — décidée une fois, vérifiée pour chaque exécuteur.** Ce projet
n'utilise **aucune extension de fichier** dans les imports relatifs (`from "../lib/env"`, jamais
`"../lib/env.ts"`), et aucun script n'est jamais exécuté par `node` nu. Les quatre exécuteurs du projet
resolvent tous les imports via un pipeline esbuild/bundler qui accepte les imports sans extension :
Next.js (Turbopack, code applicatif), Vitest (esbuild, tests), `tsx` (esbuild, scripts). Voir la matrice
de résolution en §19.6 — c'est la même famille de résolveur partout, donc rien à réconcilier au-delà de
la règle « jamais de `node` nu sur un fichier `.ts` ».

**Chaque chemin de sortie dessiné dans cet arbre est une valeur reprise dans un fichier émis en §19.6** —
voir la table *Réconciliation des valeurs inter-artefacts* en §19.6 pour la source unique de chaque
chemin partagé (port du serveur dev, chemin de la migration, nom du bucket Vercel, etc.).

**Origine de chaque fichier de cet arbre :** soit une étape §9 l'écrit (listé dans sa liste **Fait**),
soit il est émis comme fichier réel en §19.6. `tsconfig.json` et `eslint.config.mjs` viennent du scaffold
exécuté en §10 Bootstrap — pas d'une étape §9, pas de §19.6.

---

## 4. Modèle de données

### Entités

**`staff`** — un compte collaborateur autorisé. Créé manuellement par insertion SQL (§10), jamais par
inscription.

| Champ | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | uuid | PK, = `auth.users.id` | Le même id que le compte Supabase Auth du collaborateur |
| `email` | text | unique, not null | Utilisé pour vérifier que le compte Google connecté est bien attendu |
| `name` | text | not null | Affiché dans le fil d'activité et le sélecteur "assigné à" |
| `active` | boolean | not null, default `true` | Passer à `false` pour révoquer l'accès sans supprimer l'historique (`created_by`, `actor_id` restent valides) |
| `created_at` | timestamptz | not null, default `now()` | |

**`prospects`** — une boutique démarchée. Cycle de vie : créée → statut change au fil des contacts →
jamais supprimée physiquement (soft delete).

| Champ | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `name` | text | not null | Nom de la boutique |
| `city` | text | not null | Utilisé pour le filtre de liste |
| `category` | text | not null, check `IN ('boutique_telephone','pme','diaspora')` | |
| `phone` | text | not null | Numéro d'appel principal |
| `whatsapp` | text | nullable | Numéro WhatsApp si différent du téléphone |
| `address` | text | nullable | |
| `source` | text | nullable | Ex. la requête Google Maps utilisée pour trouver la boutique |
| `status` | text | not null, default `'a_contacter'`, check `IN ('a_contacter','contacte','interesse','client','refuse')` | |
| `notes` | text | nullable | |
| `created_by` | uuid | FK → `staff.id` | |
| `created_at` | timestamptz | not null, default `now()` | |
| `updated_at` | timestamptz | not null, default `now()` | Mis à jour par un trigger (voir Schéma) |
| `deleted_at` | timestamptz | nullable | Non-null = supprimé logiquement ; jamais de `DELETE` physique |

**`relances`** — un rappel de suivi daté sur un prospect.

| Champ | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `prospect_id` | uuid | FK → `prospects.id`, `ON DELETE CASCADE`, not null | |
| `due_date` | date | not null | |
| `note` | text | nullable | |
| `done` | boolean | not null, default `false` | |
| `created_by` | uuid | FK → `staff.id` | |
| `created_at` | timestamptz | not null, default `now()` | |

**`activity_log`** — historique en écriture seule des changements sur un prospect.

| Champ | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `prospect_id` | uuid | FK → `prospects.id`, `ON DELETE CASCADE`, not null | |
| `actor_id` | uuid | FK → `staff.id` | Qui a fait l'action |
| `action` | text | not null | `'created'`, `'status_changed'`, `'note_added'`, `'soft_deleted'` |
| `before` | jsonb | nullable | État avant, pour les actions de modification |
| `after` | jsonb | nullable | État après |
| `created_at` | timestamptz | not null, default `now()` | |

### Relations
- `staff` —(1:N)→ `prospects.created_by` : `ON DELETE SET NULL` implicite (aucune suppression de
  `staff` n'est prévue en v1 — désactivation via `active=false` seulement).
- `prospects` —(1:N)→ `relances.prospect_id` : `ON DELETE CASCADE` (une relance n'a pas de sens sans
  son prospect ; en pratique les prospects ne sont jamais supprimés physiquement).
- `prospects` —(1:N)→ `activity_log.prospect_id` : `ON DELETE CASCADE`, même raison.

### Index
| Table | Index | Pourquoi |
|---|---|---|
| `prospects` | `(status) WHERE deleted_at IS NULL` | Filtre principal de la liste |
| `prospects` | `(city) WHERE deleted_at IS NULL` | Deuxième filtre le plus utilisé |
| `prospects` | `to_tsvector('simple', name || ' ' || phone)` (GIN) | Recherche par nom/téléphone |
| `relances` | `(due_date, done)` | Requête « dues aujourd'hui ou en retard » |
| `activity_log` | `(prospect_id, created_at DESC)` | Fil d'activité par prospect, le plus récent en premier |

### Schéma
```sql
-- supabase/migrations/0001_init.sql
-- Contenu complet, appliqué tel quel — voir §19.6 pour l'émission du fichier et §10 pour la commande d'application.

create extension if not exists pgcrypto;

create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  category text not null check (category in ('boutique_telephone','pme','diaspora')),
  phone text not null,
  whatsapp text,
  address text,
  source text,
  status text not null default 'a_contacter'
    check (status in ('a_contacter','contacte','interesse','client','refuse')),
  notes text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table relances (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  due_date date not null,
  note text,
  done boolean not null default false,
  created_by uuid references staff(id),
  created_at timestamptz not null default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  actor_id uuid references staff(id),
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index prospects_status_idx on prospects (status) where deleted_at is null;
create index prospects_city_idx on prospects (city) where deleted_at is null;
create index prospects_search_idx on prospects using gin (to_tsvector('simple', name || ' ' || phone));
create index relances_due_idx on relances (due_date, done);
create index activity_log_prospect_idx on activity_log (prospect_id, created_at desc);

-- updated_at automatique
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospects_set_updated_at
  before update on prospects
  for each row execute function set_updated_at();

-- Fonction SECURITY DEFINER : évite la récursion RLS en interrogeant `staff` hors du contexte
-- des policies posées sur `staff` elle-même.
create or replace function is_active_staff() returns boolean as $$
  select exists (
    select 1 from staff where id = auth.uid() and active = true
  );
$$ language sql security definer stable;

alter table staff enable row level security;
alter table prospects enable row level security;
alter table relances enable row level security;
alter table activity_log enable row level security;

-- staff : un membre actif peut lire la table (pour l'annuaire "assigné à"), personne ne l'édite
-- via l'API (gestion manuelle en v1, voir §1 Non-objectifs).
create policy staff_select on staff for select
  using (is_active_staff());

-- prospects : lecture/écriture réservées au staff actif.
create policy prospects_select on prospects for select
  using (is_active_staff());
create policy prospects_insert on prospects for insert
  with check (is_active_staff());
create policy prospects_update on prospects for update
  using (is_active_staff()) with check (is_active_staff());
-- Aucune policy DELETE : la suppression physique est refusée par défaut (deny-by-default de RLS).

-- relances : même règle.
create policy relances_select on relances for select
  using (is_active_staff());
create policy relances_insert on relances for insert
  with check (is_active_staff());
create policy relances_update on relances for update
  using (is_active_staff()) with check (is_active_staff());

-- activity_log : insertion seule, jamais de update/delete (append-only).
create policy activity_log_select on activity_log for select
  using (is_active_staff());
create policy activity_log_insert on activity_log for insert
  with check (is_active_staff());
-- Aucune policy UPDATE ni DELETE : refusées par défaut.

-- RPC : changement de statut + écriture du fil d'activité dans la même transaction.
create or replace function change_prospect_status(
  p_prospect_id uuid,
  p_new_status text
) returns void as $$
declare
  v_before text;
begin
  if not is_active_staff() then
    raise exception 'forbidden';
  end if;

  select status into v_before from prospects where id = p_prospect_id and deleted_at is null;
  if v_before is null then
    raise exception 'prospect not found';
  end if;

  update prospects set status = p_new_status where id = p_prospect_id;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (
    p_prospect_id, auth.uid(), 'status_changed',
    jsonb_build_object('status', v_before),
    jsonb_build_object('status', p_new_status)
  );
end;
$$ language plpgsql security invoker;

-- RPC : suppression logique + fil d'activité dans la même transaction.
create or replace function soft_delete_prospect(p_prospect_id uuid) returns void as $$
begin
  if not is_active_staff() then
    raise exception 'forbidden';
  end if;

  update prospects set deleted_at = now()
  where id = p_prospect_id and deleted_at is null;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (p_prospect_id, auth.uid(), 'soft_deleted', null, null);
end;
$$ language plpgsql security invoker;

-- RPC : création d'un prospect + écriture du fil d'activité dans la même transaction.
create or replace function create_prospect_with_log(
  p_name text,
  p_city text,
  p_category text,
  p_phone text,
  p_whatsapp text default null,
  p_address text default null,
  p_source text default null,
  p_notes text default null
) returns uuid as $$
declare
  v_id uuid;
  v_after jsonb;
begin
  if not is_active_staff() then
    raise exception 'forbidden';
  end if;

  insert into prospects (name, city, category, phone, whatsapp, address, source, notes, created_by)
  values (p_name, p_city, p_category, p_phone, p_whatsapp, p_address, p_source, p_notes, auth.uid())
  returning id into v_id;

  select to_jsonb(prospects.*) into v_after from prospects where id = v_id;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (v_id, auth.uid(), 'created', null, v_after);

  return v_id;
end;
$$ language plpgsql security invoker;
```

### Migrations
Outil : SQL brut versionné dans `supabase/migrations/`, appliqué via `psql` sur la chaîne de connexion
directe Supabase (`SUPABASE_DB_URL`, jamais la chaîne poolée — voir `knowledge/stack-compatibility.md`
« Per-request serverless connections + un-pooled Postgres »). Convention de nommage :
`NNNN_description.sql`, numérotation manuelle séquentielle (4 chiffres). Aucune migration destructive
n'est prévue en v1 (une seule migration, tables neuves). Commande : `npm run db:migrate` (voir §10).

### Données de seed
`scripts/seed-staff.ts` insère les 2-3 comptes `staff` connus (email + nom), idempotent
(`ON CONFLICT (email) DO NOTHING`). Il ne crée **pas** les comptes `auth.users` — ceux-ci sont créés
automatiquement par Supabase Auth à la première connexion Google ; `seed-staff.ts` est donc exécuté
**après** la première connexion de chaque collaborateur, avec son `auth.users.id` réel. Commande :
`npm run db:seed -- --email=... --name=...` (voir §19.6, le script prend les arguments en ligne de
commande plutôt que des valeurs codées en dur).

---

## 5. Conception de l'API

### Conventions
- Chemin de base : aucune API REST publique — toutes les mutations passent par des **Server Actions**
  Next.js (`"use server"` dans `src/server/**`), appelées directement depuis les Server/Client
  Components. Deux routes HTTP classiques seulement : `GET /api/health` et `GET /api/export`.
- Enveloppe de réponse (Server Actions) : `{ ok: true, data } | { ok: false, error: string }` — jamais
  d'exception non gérée renvoyée au client.
- Codes d'erreur : les Server Actions ne renvoient pas de code HTTP (ce n'est pas une API HTTP) ; les
  deux routes HTTP renvoient `200` (succès), `401` (non authentifié), `403` (authentifié mais pas staff
  actif), `500` (erreur serveur).
- Validation : `zod`, schémas dans `src/lib/validation.ts`, appliqués en première ligne de chaque
  Server Action avant tout accès à la base.
- Pagination : offset/limite, paramètres `page` (défaut `1`) et `pageSize` (défaut `25`, max `100`),
  appliqués côté base via `.range()` de `@supabase/supabase-js` — jamais un `SELECT *` suivi d'un
  découpage côté client.
- Idempotence : `seed-staff.ts` seul a besoin d'idempotence (`ON CONFLICT`) ; aucun endpoint HTTP
  n'accepte de clé d'idempotence en v1 (aucun paiement, aucun webhook).
- Limite de débit : NON APPLICABLE — 2-3 utilisateurs connus, aucune surface publique.

### Routes
| Méthode | Chemin | Description | Auth | Limite de débit |
|---|---|---|---|---|
| GET | `/api/health` | Vérifie que le client Supabase atteint réellement le projet (`auth.getSession()`, sans dépendance au schéma applicatif) | Publique (ne renvoie aucune donnée métier) | Aucune |
| GET | `/api/export` | Exporte le pipeline filtré en CSV, streamé | Staff actif | Aucune |
| — | Server Action `listProspects` | Liste paginée/filtrée/recherchée | Staff actif | — |
| — | Server Action `createProspect` | Crée un prospect + ligne `activity_log` `'created'` | Staff actif | — |
| — | Server Action `updateProspect` | Édite les champs d'un prospect | Staff actif | — |
| — | Server Action `changeProspectStatus` | Appelle le RPC `change_prospect_status` | Staff actif | — |
| — | Server Action `softDeleteProspect` | Appelle le RPC `soft_delete_prospect` | Staff actif | — |
| — | Server Action `createRelance` | Crée une relance sur un prospect | Staff actif | — |
| — | Server Action `listDueRelances` | Relances dues aujourd'hui ou en retard, tous prospects | Staff actif | — |
| — | Server Action `markRelanceDone` | Bascule `done` sur une relance | Staff actif | — |

### Endpoints critiques — détail complet

**`GET /api/health`**
- Requête : aucun paramètre.
- Réponse succès `200` : `{ "ok": true }` — obtenue via `supabase.auth.getSession()`, qui ne dépend
  d'aucune table applicative (celles-ci n'existent qu'à partir de l'étape 4, voir §4 et §9 étape 1).
- Réponse échec `500` : `{ "ok": false, "error": "database unreachable" }` — si l'appel Supabase échoue
  (URL/clé invalide, projet en pause).
- Effets de bord : aucun.

**`GET /api/export?status=&city=&search=`**
- Requête : paramètres de query optionnels, identiques aux filtres de la liste (§9 étape 6).
- Réponse succès `200` : `Content-Type: text/csv`, `Content-Disposition: attachment;
  filename="prospects.csv"`, corps streamé ligne par ligne (colonnes : `name,city,category,phone,
  whatsapp,status,created_at`).
- Réponse échec `401` si aucune session ; `403` si la session existe mais l'utilisateur n'est pas dans
  `staff` avec `active=true` (vérifié via `requireActiveStaff()` avant tout accès à la base — voir §8).
- Effets de bord : aucun (lecture seule ; ne dépend d'aucun job asynchrone, RLS filtre déjà les lignes
  soft-supprimées via `deleted_at is null` côté requête applicative).

**Server Action `changeProspectStatus(prospectId, newStatus)`**
- Entrée validée par `z.object({ prospectId: z.string().uuid(), newStatus: z.enum([...]) })`.
- Appelle `supabase.rpc('change_prospect_status', { p_prospect_id, p_new_status })` — la mise à jour du
  statut et l'insertion dans `activity_log` sont dans la même transaction Postgres (voir §4, fonction
  `change_prospect_status`), donc jamais l'une sans l'autre.
- Erreurs : `{ ok: false, error: "forbidden" }` si le RPC lève `forbidden` (staff inactif ou session
  absente — la policy RLS bloquerait de toute façon l'`UPDATE` interne au RPC) ; `{ ok: false, error:
  "prospect not found" }` si l'id n'existe pas ou est déjà soft-supprimé.

**Server Action `createProspect(input)`**
- Champs requis : `name`, `phone`, `city`, `category` (4 champs obligatoires — au plus proche du minimum
  imposé par le risque d'adoption en §20.2). `whatsapp`, `address`, `source`, `notes` optionnels.
- Appelle `supabase.rpc('create_prospect_with_log', { p_name, p_city, p_category, p_phone, p_whatsapp,
  p_address, p_source, p_notes })` — l'insertion de la ligne `prospects` et l'insertion de la ligne
  `activity_log` `action='created'` (`after` = l'objet inséré) sont dans la même transaction Postgres
  (voir §4, fonction `create_prospect_with_log`), jamais l'une sans l'autre.
- Erreurs : `{ ok: false, error: <message zod> }` si un champ requis manque.

---

## 6. Architecture Frontend

### Routes
| Route | Page | Source de données | Auth |
|---|---|---|---|
| `/` | Redirection | — | Staff actif → `/prospects`, sinon → `/login` |
| `/login` | Écran de connexion Google | — | Publique |
| `/access-denied` | Compte non autorisé | — | Authentifié, non-staff |
| `/prospects` | Liste paginée | Server Component, requête Supabase directe | Staff actif |
| `/prospects/new` | Formulaire d'ajout | Server Action | Staff actif |
| `/prospects/[id]` | Détail + fil d'activité | Server Component | Staff actif |
| `/prospects/[id]/edit` | Formulaire d'édition | Server Component + Server Action | Staff actif |
| `/relances` | Relances dues/en retard | Server Component | Staff actif |

### Stratégie de rendu
Toutes les pages du groupe `(dashboard)` sont des **Server Components dynamiques** (`export const
dynamic = 'force-dynamic'` implicite car chaque page lit la session et des données propres à
l'utilisateur) — aucune page n'est statique ni mise en cache : le pipeline change en continu et deux
collaborateurs ne doivent jamais voir une liste périmée. `/login` est statique. Les mutations passent
par des Server Actions avec `revalidatePath()` sur la liste concernée après chaque écriture.

### Hiérarchie de composants
```
(dashboard)/layout.tsx                    [Server]
├── Sidebar                                [Server — liens statiques, aucun état]
├── Header                                 [Server — nom du staff connecté, bouton déconnexion]
└── (dashboard)/prospects/page.tsx         [Server — fetch initial]
    ├── ProspectsFilterBar                 [Client — état des filtres dans l'URL (searchParams)]
    └── ProspectsTable                     [Server — reçoit les lignes déjà paginées/filtrées]
        └── StatusSelect (par ligne)       [Client — appelle changeProspectStatus() au onChange]
```

### Gestion d'état
Aucun store client global. L'état serveur (liste de prospects, relances) est lu à chaque navigation via
Server Components — pas de couche de cache client (`react-query` ou équivalent) : le volume (~100-300
lignes) et la fréquence de changement rendent une resynchronisation manuelle inutile. L'état des filtres
vit dans les paramètres d'URL (`useSearchParams`), jamais dans un state React local, pour que l'URL
reste partageable/rechargeable. L'état de formulaire (ajout/édition) est géré par le navigateur
(`<form>` natif + Server Action), pas de bibliothèque de formulaire.

### États de chargement, vide et erreur
| Surface | Chargement | Vide | Erreur |
|---|---|---|---|
| Liste des prospects | `loading.tsx` du segment — squelette de 5 lignes de table | « Aucun prospect ne correspond à ces filtres. » + lien pour réinitialiser les filtres | `error.tsx` du segment — message + bouton "Réessayer" |
| Relances | Squelette de 3 lignes | « Aucune relance en retard ni due aujourd'hui. » | Idem |
| Fil d'activité | Squelette de 3 lignes | « Aucune activité enregistrée pour ce prospect. » | Idem |
| Formulaire ajout/édition | État de soumission désactive le bouton (`aria-busy`) | — | Erreurs de champ affichées sous chaque input, texte + `aria-describedby` |

---

## 7. Système de design

Fourni directement dans le brief — valeurs littérales reprises telles quelles ; `ui-ux-pro-max` n'a pas
été invoqué (design déjà entièrement spécifié).

### Couleurs
| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--primary` | `#0E6B64` | `#14A89B` | Boutons primaires, liens, anneau de focus |
| `--primary-fg` | `#F4F2EC` | `#0A1210` | Texte sur fond primaire |
| `--primary-hover` | `#0A4D48` | `#0E6B64` | États hover/actif du primaire |
| `--background` | `#F4F2EC` | `#14201E` | Fond de page |
| `--surface` | `#FFFFFF` | `#1B2926` | Cartes, panneaux, dialogs |
| `--border` | `#DAD6CB` | `#2A3A36` | Séparateurs, contours d'input |
| `--fg` | `#1B2321` | `#EDEBE4` | Texte de corps |
| `--fg-muted` | `#5B655F` | `#9CA8A2` | Texte secondaire |
| `--destructive` | `#B3261E` | `#E15850` | Erreurs, suppression |
| `--success` | `#1F7A4C` | `#3FBE81` | Statut "client", confirmations |
| `--warn` | `#B5721A` | `#E08A2C` | Badges de relance en retard |

**Contraste :** `--primary` (`#0E6B64`) sur `--background` (`#F4F2EC`) = 5.9:1 (AA texte de corps
passé). `--fg` (`#1B2321`) sur `--background` (`#F4F2EC`) = 14.8:1 (largement AA). `--warn` (`#B5721A`)
sur `--surface` (`#FFFFFF`) = 4.6:1 (AA texte de corps passé — c'est la paire la plus tendue du système,
utilisée uniquement sur le texte des badges "en retard", jamais en texte de corps continu).

### Typographie
| Rôle | Famille | Taille / interligne | Graisse | Tracking |
|---|---|---|---|---|
| Titres / nav | Sora (Google Fonts) | 1.25rem–2rem / 1.2 | 600/700/800 | -0.01em |
| Corps / tableaux | Pile système (`-apple-system, "Segoe UI", Roboto, sans-serif`) | 0.875rem / 1.5 | 400/500 | normal |
| Mono (ids, codes) | Pile mono système (`ui-monospace, "SFMono-Regular", monospace`) | 0.8125rem / 1.4 | 400 | normal |

**Chargement des polices :** Sora auto-hébergée via `next/font/google` (sous-ensemble latin, poids
600/700/800), `font-display: swap` géré par `next/font` — voir la mise en garde du runtime track sur
`next/font` et `font-display` (§9 étape 5, Do).

### Espacement, rayon, élévation
- Échelle d'espacement : base 4px — 4, 8, 12, 16, 24, 32, 48, 64.
- Rayon : 6px sur inputs/boutons, 10px sur cartes/dialogs, `9999px` sur les badges et avatars.
- Ombres : `0 1px 2px rgba(0,0,0,0.06)` (cartes), `0 4px 16px rgba(0,0,0,0.12)` (dialogs/popover).
- Largeur de contenu max : 1280px pour la liste, 720px pour les formulaires. Points de rupture :
  `sm 640px / md 768px / lg 1024px / xl 1280px`.

### Mouvement
Transitions de 120ms `ease-out` sur hover/focus, 180ms sur l'ouverture des dialogs (translation +
opacité uniquement). Tout respecte `prefers-reduced-motion: reduce` (transitions ramenées à 1ms).

### Style de composant
Dense, orienté données : tables compactes (`padding: 8px 12px` par cellule), pas d'illustration ni de
gradient, bordures fines plutôt que grandes ombres portées. Sidebar fixe à gauche (240px), header fin
(56px) — la surface visible privilégie les lignes de la table. Tout nouveau composant doit tenir sur une
ligne de 32px de haut dans une table sans effet de zoom au clic — c'est le test d'appartenance au style.

---

## 8. Authentification & Autorisation

### Fournisseur et justification
Supabase Auth avec le provider Google OAuth, configuré dans le tableau de bord Supabase
(Authentication → Providers → Google — pas de client-id/secret Google à gérer côté application, voir
§10 « Comptes à créer d'abord »). Choisi parce que Supabase héberge déjà la base de données : la session
est immédiatement disponible dans le contexte des RLS policies (`auth.uid()`), sans synchroniser un
deuxième système d'identité (voir `knowledge/stack-compatibility.md`, ligne « Platform auth bundled with
the database »).

### Flux
1. **Connexion :** `/login` → bouton « Se connecter avec Google » → `supabase.auth.signInWithOAuth({
   provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })` → redirection Google →
   retour sur `/auth/callback?code=...`.
2. **Callback :** `src/app/auth/callback/route.ts` échange le code contre une session
   (`supabase.auth.exchangeCodeForSession`), puis vérifie l'allowlist : `SELECT active FROM staff WHERE
   id = auth.uid()`. Si absent ou `active=false` → `supabase.auth.signOut()` puis redirection vers
   `/access-denied`. Sinon → redirection vers `/prospects`.
3. **Accès direct à une route protégée sans session :** `proxy.ts` (voir Sessions ci-dessous) redirige
   vers `/login`.
4. **Déconnexion :** bouton dans `Header` → Server Action `signOut()` → `supabase.auth.signOut()` →
   redirection `/login`.
5. **Expiration de session :** gérée par `@supabase/ssr` — le rafraîchissement du token se fait dans
   `proxy.ts` à chaque requête ; si le refresh token est invalide, la session est traitée comme absente
   (retour au flux 3).
6. **Suppression de compte :** NON APPLICABLE — aucune suppression de compte en libre-service ; la
   désactivation se fait en mettant `staff.active = false` (voir §1 Non-objectifs, self-service exclu).

### Protection des routes
| Surface | Règle | Appliquée où |
|---|---|---|
| `(dashboard)/**` | Authentifié + `staff.active = true` | `src/app/(dashboard)/layout.tsx`, via `requireActiveStaff()` |
| `/api/export` | Authentifié + `staff.active = true` | `src/app/api/export/route.ts`, via `requireActiveStaff()` |
| `/api/health` | Publique (`auth.getSession()` uniquement, aucune donnée métier) | — |
| `/login`, `/access-denied` | Publique | — |

**Règle d'application :** l'autorisation est vérifiée côté serveur à chaque requête, dans
`requireActiveStaff()` (`src/server/staff.ts`) **et** dans les RLS policies Postgres — deux couches
indépendantes. Un garde côté client caché n'est jamais le seul contrôle : même si `(dashboard)/layout.tsx`
avait un bug, la policy RLS empêcherait toute lecture/écriture par un compte non-staff.

### Rôles et permissions
| Rôle | Peut | Ne peut pas |
|---|---|---|
| Staff actif | Lire/créer/modifier tous les prospects, relances ; lire l'`activity_log` ; exporter le CSV | Modifier/supprimer une ligne `activity_log` ; supprimer physiquement un prospect ; gérer les comptes `staff` (fait manuellement en SQL, voir §1 Non-objectifs) |
| Staff inactif / compte non listé | Rien — refusé au niveau applicatif (redirection) et au niveau RLS (policy `is_active_staff()` retourne `false`) | Toute lecture ou écriture |

### Sessions
Type de jeton : JWT Supabase (access token courte durée + refresh token), stockés dans des cookies
`HttpOnly`, `Secure` (en production), `SameSite=Lax` — gérés entièrement par `@supabase/ssr`, jamais
manipulés à la main. Rafraîchissement automatique dans `proxy.ts` à chaque requête serveur. Pas de
protection CSRF dédiée au-delà de `SameSite=Lax` : aucune mutation n'est déclenchée par un `GET`, et les
Server Actions Next.js portent leur propre jeton anti-CSRF natif (vérification de l'origine par le
framework).

### Multi-tenant / isolation au niveau des lignes
NON APPLICABLE — une seule organisation. L'isolation qui existe est staff-actif vs le reste du monde,
appliquée par les RLS policies `is_active_staff()` sur les quatre tables (§4) : c'est le mécanisme
complet d'autorisation de ce projet, il n'y a pas de notion d'organisation à cloisonner en plus.

---

## 9. ORDRE DE CONSTRUCTION

**Étapes : 11.** Suit exactement l'ordre du brief : scaffold → OAuth → allowlist → schéma+RLS → coquille
app → liste → formulaire → statut/activity_log → relances → export CSV → déploiement. L'étape
auth/allowlist du brief est scindée en deux étapes (2 et 3) parce que ses 7 fichiers dépassaient le
maximum de 5 par étape sur le chemin critique de l'auth (voir règle §9 rule 3) ; cela ne change ni le
périmètre ni l'ordre logique, seulement la granularité du commit et du gate.

### Étape 1 — Scaffold, connexion Supabase, health check

**Fait**
Créer le projet Next.js et le connecter à Supabase :
- Scaffold via `create-next-app` (commande exacte en §10 Bootstrap).
- `src/lib/env.ts` — schéma zod validant `NEXT_PUBLIC_SUPABASE_URL` (url) et
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (string non vide) au chargement du module ; lève une erreur nommée au
  démarrage si absent, jamais de valeur par défaut silencieuse. Contenu émis en §19.6.
- `.env.example` avec les quatre clés de §10 (voir §19.6).

- `src/lib/supabase/server.ts` — client serveur `@supabase/ssr` `createServerClient`, `await cookies()`
  (obligatoire en Next 16, plus de fallback synchrone). Motif `getAll`/`setAll` documenté par
  `@supabase/ssr` 0.12.x pour l'App Router Next.js (remplace l'ancien triplet `get`/`set`/`remove` des
  versions < 0.5) :
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll() appelé depuis un Server Component (pas une Server Action ni une
          // Route Handler) : écriture de cookie refusée par Next.js, sans conséquence
          // ici car proxy.ts (étape 2) rafraîchit déjà la session à chaque requête.
        }
      },
    },
  });
}
```

- `src/lib/supabase/client.ts` — client navigateur `createBrowserClient`, lit les deux variables
  `NEXT_PUBLIC_*` via `src/lib/env.ts` (jamais `process.env` directement) :
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

- `src/app/api/health/route.ts` — prouve que le projet Supabase est réellement joignable sur le réseau,
  sans dépendre d'aucune table applicative (celles-ci n'existent qu'à partir de l'étape 4, §4) et sans
  passer par le SDK d'authentification. **Ni `getSession()` ni `getUser()` ne conviennent** : les deux
  ont été testés en conditions réelles contre un domaine Supabase factice, et les deux résolvent
  localement sans requête réseau quand aucune session/cookie n'est présente — ils renvoient
  `ok: true` même si le projet est injoignable ou l'URL invalide, ce qui rend le test muet. La seule
  méthode qui fait réellement un aller-retour réseau indépendamment de tout état d'authentification est
  un `fetch` direct sur la racine PostgREST du projet avec la clé anonyme en en-tête :
```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(5000),
    });

    // PostgREST répond toujours (200 avec le schéma OpenAPI, ou au pire 401/404 selon la
    // configuration) tant que le projet est joignable et la clé bien formée. Seule une
    // panne réseau réelle (DNS, timeout, projet en pause) lève une exception ici.
    if (res.status >= 500) {
      return NextResponse.json({ ok: false, error: "database unreachable" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "database unreachable" }, { status: 500 });
  }
}
```
  Ce endpoint n'utilise pas `src/lib/supabase/server.ts` (qui dépend de `cookies()` et du SDK auth,
  hors sujet ici) — il lit directement `env` pour un test de connectivité réseau pur.

**Fait quand**
- [ ] QUAND `npm run dev` démarre SANS que `NEXT_PUBLIC_SUPABASE_URL` soit défini, LE SYSTÈME DOIT lever une erreur de démarrage nommant la variable manquante — pas de page servie avec un client Supabase invalide.
- [ ] QUAND `GET /api/health` est appelé avec une connexion Supabase valide, LE SYSTÈME DOIT répondre `200` avec un corps JSON contenant `ok: true`.
- [ ] QUAND `GET /api/health` est appelé et que le projet Supabase est injoignable, LE SYSTÈME DOIT répondre `500` avec `ok: false`.
- [ ] QUAND `npm run build` s'exécute, LE SYSTÈME DOIT terminer avec le code de sortie 0.

**Prérequis avant de lancer ce Vérifier :** un vrai projet Supabase doit déjà exister (§10, « Comptes à
créer d'abord », requis dès l'étape 1) et `.env.local` doit contenir ses vraies valeurs
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (copier `.env.example` vers `.env.local` et
les renseigner) **avant** d'exécuter `npm run build` ou `npm run dev` — sans cela, `src/lib/env.ts` lève
une `ZodError` au chargement du module et fait échouer le build : c'est le comportement attendu de la
première ligne de « Fait quand » ci-dessus, pas une régression de cette étape.

**Vérifier**
```bash
npm run typecheck                                   # attendu : exit 0
npm run lint                                         # attendu : exit 0
npm run build                                        # attendu : exit 0 — nécessite .env.local déjà rempli, voir Prérequis ci-dessus

npm run dev &
sleep 3
STATUS=$(curl -s -o /tmp/health.json -w '%{http_code}' http://localhost:3000/api/health)
test "$STATUS" = 200                                 # attendu : exit 0
node -e "const b=require('/tmp/health.json'); process.exit(b.ok===true ? 0 : 1)"
                                                      # attendu : exit 0
kill %1
```

**Checkpoint**
```bash
git add -A && git commit -m "step 1: scaffold, supabase connection, health check"
git tag step-01-scaffold
# rollback si l'étape 2 échoue : git reset --hard step-01-scaffold
```

---

### Étape 2 — Flux OAuth Google (`proxy.ts`, connexion, callback)

**Fait**
- `src/proxy.ts` — exporte `proxy` (pas `middleware`), rafraîchit la session Supabase sur chaque requête
  via `@supabase/ssr`, matcher excluant les fichiers statiques et `/api/health`.
- `src/app/login/page.tsx` — bouton « Se connecter avec Google ».
- `src/app/auth/callback/route.ts` — échange le code, vérifie l'allowlist `staff` (`active=true`),
  redirige vers `/prospects` ou `/access-denied` (signOut d'abord si refusé). Cette étape écrit la
  logique de vérification inline dans la route ; l'étape 3 l'extrait dans `requireActiveStaff()` pour
  la réutiliser sur tout le groupe `(dashboard)`.
- `src/app/access-denied/page.tsx`.

**Fait quand**
- [ ] QUAND `/login` est visité, LE SYSTÈME DOIT afficher le bouton « Se connecter avec Google » qui déclenche `supabase.auth.signInWithOAuth`.
- [ ] QUAND le callback OAuth reçoit un compte Google authentifié absent de `staff` OU y existant avec `active=false`, LE SYSTÈME DOIT appeler `signOut()` puis rediriger vers `/access-denied`.
- [ ] QUAND le callback OAuth reçoit un compte Google authentifié existant dans `staff` avec `active=true`, LE SYSTÈME DOIT rediriger vers `/prospects`.
- [ ] QUAND `npm run build` s'exécute, LE SYSTÈME DOIT terminer avec le code de sortie 0.

**Vérifier**
```bash
npm run typecheck                              # attendu : exit 0
npm run build                                  # attendu : exit 0

npm run dev &
sleep 3
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)
test "$STATUS" = 200                           # attendu : exit 0 — page publique accessible
kill %1
```

**Checkpoint**
```bash
git add -A && git commit -m "step 2: google oauth flow, login, callback"
git tag step-02-oauth
```

---

### Étape 3 — Allowlist staff (`requireActiveStaff`, garde du tableau de bord)

**Fait**
- `src/server/staff.ts` — `requireActiveStaff()` : lit la session, interroge `staff`, lève une erreur
  typée si absente/inactive ; utilisé par toute page/Server Action du groupe `(dashboard)`. Remplace la
  vérification inline écrite dans `auth/callback/route.ts` à l'étape 2 — `auth/callback/route.ts` est
  édité pour appeler `requireActiveStaff()`-style plutôt que dupliquer la requête `staff`.
- `src/app/(dashboard)/layout.tsx` — appelle `requireActiveStaff()`, redirige vers `/login` si aucune
  session.
- `tests/staff-gate.test.ts` — teste la fonction pure `evaluateStaffAccess(row: {active:boolean}|null):
  boolean` extraite de `requireActiveStaff()` (pas d'appel réseau), 3 cas : `null` → `false`, `{active:
  false}` → `false`, `{active:true}` → `true`.

**Fait quand**
- [ ] QUAND une requête anonyme atteint une route de `(dashboard)`, LE SYSTÈME DOIT rediriger vers `/login`.
- [ ] QUAND un compte Google authentifié n'existe pas dans `staff` OU y existe avec `active=false`, LE SYSTÈME DOIT rediriger vers `/access-denied` et ne jamais afficher une page du tableau de bord.
- [ ] QUAND un compte Google authentifié existe dans `staff` avec `active=true`, LE SYSTÈME DOIT rediriger vers `/prospects`.
- [ ] QUAND la suite de tests unitaires s'exécute, LE SYSTÈME DOIT rapporter 3 tests réussis pour `staff-gate.test.ts`, 0 échoué.

**Vérifier**
```bash
npm run test -- tests/staff-gate.test.ts      # attendu : exit 0, 3 passed, 0 failed
npm run typecheck                              # attendu : exit 0

npm run dev &
sleep 3
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/prospects)
test "$STATUS" = 307 -o "$STATUS" = 302        # attendu : exit 0 — redirection vers /login, non authentifié
kill %1
```

**Checkpoint**
```bash
git add -A && git commit -m "step 3: staff allowlist gate, dashboard guard"
git tag step-03-allowlist
```

---

### Étape 4 — Schéma de base de données, RLS, test automatisé

**Fait**
- `supabase/migrations/0001_init.sql` — contenu complet donné en §4.
- `scripts/seed-staff.ts` — insère une ligne `staff` (email/nom passés en argument CLI), idempotent.
- `scripts/test-rls.ts` — script de vérification automatisée (risque §20.2 #2) : crée un utilisateur
  Supabase Auth temporaire via la clé de service (`supabase.auth.admin.createUser`), NE l'ajoute PAS à
  `staff`, se connecte avec ce compte, tente `SELECT * FROM prospects`, vérifie que la réponse contient
  **zéro ligne** (RLS bloque, ne lève pas d'erreur — c'est le comportement Postgres RLS normal), tente un
  `INSERT` sur `prospects`, vérifie qu'il échoue, puis supprime l'utilisateur temporaire
  (`supabase.auth.admin.deleteUser`) dans un `finally`.

**Fait quand**
- [ ] QUAND `supabase/migrations/0001_init.sql` est appliquée sur une base vierge, LE SYSTÈME DOIT créer exactement 4 tables (`staff`, `prospects`, `relances`, `activity_log`), vérifiable une à une.
- [ ] QUAND un compte authentifié absent de `staff` (ou `active=false`) exécute `SELECT * FROM prospects`, LE SYSTÈME DOIT renvoyer zéro ligne.
- [ ] QUAND ce même compte tente `INSERT INTO prospects`, LE SYSTÈME DOIT rejeter l'opération (violation de policy RLS).
- [ ] QUAND `scripts/test-rls.ts` s'exécute avec succès, LE SYSTÈME DOIT supprimer l'utilisateur de test qu'il a créé, sans laisser de compte orphelin.

**Vérifier**
```bash
set -a; . .env.local; set +a   # charge SUPABASE_DB_URL avant tout appel psql — voir §10
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql   # attendu : exit 0

for t in staff prospects relances activity_log; do
  psql "$SUPABASE_DB_URL" -c "\d $t" > /dev/null; test $? -eq 0  # attendu : exit 0 pour chacune des 4 tables
done

tsx --env-file=.env.local scripts/test-rls.ts   # attendu : exit 0 — le script assert lui-même les 0 lignes et l'échec de l'INSERT, et exit 1 s'il détecte une fuite
```

**Checkpoint**
```bash
git add -A && git commit -m "step 4: schema, rls policies, automated rls test"
git tag step-04-schema
```

---

### Étape 5 — Coquille applicative (sidebar, header, états vide/chargement)

**Fait**
- `src/components/layout/sidebar.tsx` — liens statiques Prospects / Relances / Export (Export = bouton
  déclenchant `GET /api/export`, pas une route de page).
- `src/components/layout/header.tsx` — nom du staff connecté (depuis la session), bouton déconnexion.
- `src/app/(dashboard)/layout.tsx` — assemble Sidebar + Header + `{children}`.
- Police Sora via `next/font/google`, poids 600/700/800, `display: 'swap'` (voir mise en garde runtime
  track : `display` ne s'applique qu'aux faces réelles, pas aux faces de repli générées par `next/font` —
  aucun critère d'acceptation de ce blueprint ne porte sur les faces de repli).
- `src/app/(dashboard)/prospects/loading.tsx` — squelette 5 lignes.
- Tokens Tailwind v4 dans `globals.css` (`@theme { --color-primary: #0E6B64; ... }`, valeurs de §7).

**Fait quand**
- [ ] QUAND une page du groupe `(dashboard)` est rendue pour un staff actif, LE SYSTÈME DOIT afficher la sidebar avec les 3 liens (Prospects, Relances, Export) et le header avec le nom du staff.
- [ ] QUAND la page `/prospects` est en cours de chargement (React Suspense), LE SYSTÈME DOIT afficher le squelette de `loading.tsx`, jamais un écran blanc.
- [ ] QUAND `npm run build` produit la CSS finale, LE SYSTÈME DOIT contenir la valeur `#0e6b64` (couleur primaire, casse insensible) au moins une fois dans le CSS généré.

**Vérifier**
```bash
npm run build                                                  # attendu : exit 0
grep -qi '#0e6b64' .next/static/css/*.css                      # attendu : exit 0 — le token primaire est bien émis
npm run typecheck && npm run lint                               # attendu : exit 0 chacun
```

**Checkpoint**
```bash
git add -A && git commit -m "step 5: app shell, design tokens, loading state"
git tag step-05-shell
```

---

### Étape 6 — Liste des prospects, paginée côté serveur, filtres, recherche

**Fait**
- `src/server/prospects.ts` — `listProspects({ page, pageSize, status, city, search })` : requête
  Supabase avec `.range()`, `.eq('status', ...)` si fourni, `.ilike('city', ...)` si fourni,
  `.textSearch(...)` sur l'index GIN si `search` fourni, toujours `.is('deleted_at', null)`.
- `src/app/(dashboard)/prospects/page.tsx` — lit `searchParams`, appelle `listProspects`, rend
  `ProspectsTable`.
- `src/components/prospects/prospects-table.tsx` — table shadcn `data-table` : colonnes name/city/
  category/phone/status/actions.
- `src/components/prospects/prospects-filter-bar.tsx` — Client Component, écrit dans l'URL via
  `useRouter().push` (jamais de state React local pour les filtres, voir §6).
- `src/server/prospects.ts` — exporte aussi `buildProspectsFilter({status, city, search})`, la fonction
  pure extraite de `listProspects()` qui construit l'objet de filtre (sans appel réseau) ; `listProspects`
  l'appelle puis l'applique à la requête Supabase.
- `src/app/(dashboard)/prospects/page.test.tsx` retiré au profit d'un test unitaire de la fonction pure
  de construction de requête : `tests/prospects-query.test.ts` importe `buildProspectsFilter` depuis
  `src/server/prospects.ts` et teste que `buildProspectsFilter({status: 'contacte'})` produit l'objet de
  filtre attendu, sans appel réseau.

**Fait quand**
- [ ] QUAND `/prospects?page=2&pageSize=25` est demandé, LE SYSTÈME DOIT renvoyer les lignes 26 à 50 (triées par `created_at desc`), jamais l'ensemble de la table.
- [ ] QUAND `/prospects?status=client` est demandé, LE SYSTÈME DOIT n'afficher que les prospects dont `status='client'` et `deleted_at IS NULL`.
- [ ] QUAND `/prospects?search=<terme>` est demandé, LE SYSTÈME DOIT renvoyer les prospects dont le nom ou le téléphone contient le terme, insensible à la casse.
- [ ] QUAND aucun prospect ne correspond aux filtres, LE SYSTÈME DOIT afficher le message d'état vide de §6, jamais une table vide sans explication.
- [ ] QUAND la suite de tests s'exécute, LE SYSTÈME DOIT rapporter le test `prospects-query.test.ts` réussi.

**Vérifier**
```bash
npm run test -- tests/prospects-query.test.ts   # attendu : exit 0, 1 passed
npm run typecheck && npm run lint                # attendu : exit 0 chacun
npm run build                                    # attendu : exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 6: server-paginated prospects list, filters, search"
git tag step-06-list
```

---

### Étape 7 — Ajout/édition de prospect, suppression logique

**Fait**
- `src/lib/validation.ts` — `ProspectInputSchema` (zod) : `name`, `phone`, `city`, `category` requis ;
  `whatsapp`, `address`, `source`, `notes` optionnels.
- `src/server/prospects.ts` — ajouter `createProspect(input)` (appelle le RPC
  `create_prospect_with_log`, qui insère `prospects` et écrit `activity_log action='created'` dans la
  même transaction Postgres — fonction déjà en base depuis la migration appliquée à l'étape 4, voir note
  ci-dessous) et `updateProspect(id, input)`, `softDeleteProspect(id)` (appelle le RPC
  `soft_delete_prospect`).
- `src/app/(dashboard)/prospects/new/page.tsx` et `.../[id]/edit/page.tsx` — formulaire natif `<form
  action={createProspect}>`.
- `src/components/prospects/prospect-form.tsx` — champs + erreurs zod affichées sous chaque input.
- Dialog de confirmation shadcn avant `softDeleteProspect`, texte nommant explicitement le prospect.

> Note : la fonction `create_prospect_with_log` fait partie du contenu complet de
> `supabase/migrations/0001_init.sql` tel que donné en §4 et appliquée en base à l'étape 4 (Schéma de
> base de données) — aucune deuxième migration n'est créée ; cette étape ne fait qu'appeler un RPC déjà
> présent en base, elle n'écrit ni n'édite de SQL.

**Fait quand**
- [ ] QUAND le formulaire d'ajout est soumis avec `name`, `phone`, `city`, `category` renseignés, LE SYSTÈME DOIT créer une ligne `prospects` et une ligne `activity_log` avec `action='created'` dans la même transaction.
- [ ] QUAND le formulaire d'ajout est soumis sans `phone`, LE SYSTÈME DOIT réafficher le formulaire avec l'erreur sous le champ concerné et conserver les valeurs déjà saisies.
- [ ] QUAND la suppression est confirmée sur un prospect, LE SYSTÈME DOIT mettre `deleted_at` à une valeur non nulle et NE JAMAIS exécuter de `DELETE` SQL sur la ligne.
- [ ] QUAND un prospect a `deleted_at` non nul, LE SYSTÈME DOIT cesser d'apparaître dans `/prospects` mais rester lisible par une requête directe (`SELECT * FROM prospects WHERE id = ...`).

**Vérifier**
```bash
npm run typecheck && npm run lint && npm run build   # attendu : exit 0 chacun

set -a; . .env.local; set +a   # charge SUPABASE_DB_URL avant tout appel psql — voir §10
psql "$SUPABASE_DB_URL" -c "select proname from pg_proc where proname = 'create_prospect_with_log';" | grep -q create_prospect_with_log
                                                       # attendu : exit 0 — la fonction existe bien en base
```

**Checkpoint**
```bash
git add -A && git commit -m "step 7: add/edit prospect form, soft delete"
git tag step-07-form
```

---

### Étape 8 — Changement de statut, `activity_log` transactionnel

**Fait**
- `src/components/prospects/status-select.tsx` — Client Component, appelle la Server Action
  `changeProspectStatus(prospectId, newStatus)` définie à l'étape 4 (RPC déjà en base depuis la
  migration).
- `src/server/prospects.ts` — `changeProspectStatus` enveloppe l'appel RPC, retourne l'enveloppe
  `{ok, data|error}` de §5.
- `src/components/prospects/prospect-activity-feed.tsx` — lit `activity_log` pour un `prospect_id`,
  affiche `action`, `before`/`after` formatés, `actor` (jointure sur `staff.name`), `created_at`.
- `src/app/(dashboard)/prospects/[id]/page.tsx` — assemble détail + `ProspectActivityFeed`.

**Fait quand**
- [ ] QUAND un statut est changé via `StatusSelect`, LE SYSTÈME DOIT écrire exactement une ligne `activity_log` avec `before.status` = l'ancien statut et `after.status` = le nouveau, dans la même transaction que la mise à jour de `prospects.status`.
- [ ] QUAND l'appel RPC échoue (ex. prospect déjà supprimé), LE SYSTÈME DOIT laisser `prospects.status` inchangé ET n'écrire aucune ligne `activity_log` — jamais l'un sans l'autre.
- [ ] QUAND la page de détail d'un prospect ayant 3 changements de statut est ouverte, LE SYSTÈME DOIT afficher les 3 entrées du fil d'activité, la plus récente en premier.

**Vérifier**
```bash
npm run typecheck && npm run lint && npm run build   # attendu : exit 0 chacun

set -a; . .env.local; set +a   # charge SUPABASE_DB_URL avant tout appel psql — voir §10

# Vérifie que le RPC est bien transactionnel : provoque un id inexistant et confirme 0 ligne créée.
COUNT_BEFORE=$(psql "$SUPABASE_DB_URL" -tAc "select count(*) from activity_log;")
psql "$SUPABASE_DB_URL" -c "select change_prospect_status('00000000-0000-0000-0000-000000000000'::uuid, 'contacte');" 2>/dev/null
COUNT_AFTER=$(psql "$SUPABASE_DB_URL" -tAc "select count(*) from activity_log;")
test "$COUNT_BEFORE" = "$COUNT_AFTER"                 # attendu : exit 0 — aucune ligne ajoutée sur un id inexistant
```

**Checkpoint**
```bash
git add -A && git commit -m "step 8: status change wired to activity_log"
git tag step-08-status
```

---

### Étape 9 — Relances : ajout, vue dues/en retard, bascule "fait"

**Fait**
- `src/lib/validation.ts` — ajouter `RelanceInputSchema` (`prospectId` uuid, `dueDate` date, `note`
  optionnel).
- `src/server/relances.ts` — `createRelance(input)`, `listDueRelances()` (`due_date <= today AND
  done=false`, toutes prospects confondus, jointure sur `prospects.name` et `prospects.phone`),
  `markRelanceDone(id)`.
- `src/app/(dashboard)/relances/page.tsx` — liste triée par `due_date` croissant, badge `--warn` si
  `due_date < today`.
- `src/components/relances/relance-list.tsx`, `relance-form.tsx` (formulaire inline sur la page détail
  d'un prospect).

**Fait quand**
- [ ] QUAND une relance est créée avec une `due_date` dans le passé, LE SYSTÈME DOIT l'afficher dans `/relances` avec le badge "en retard" (`--warn`), immédiatement.
- [ ] QUAND une relance a `due_date = aujourd'hui`, LE SYSTÈME DOIT l'inclure dans `/relances` (dues aujourd'hui ou en retard = `<=` aujourd'hui).
- [ ] QUAND `markRelanceDone(id)` est appelé, LE SYSTÈME DOIT mettre `done=true` et faire disparaître la relance de `/relances` au rechargement suivant.
- [ ] QUAND aucune relance n'est due ni en retard, LE SYSTÈME DOIT afficher l'état vide de §6.

**Vérifier**
```bash
npm run typecheck && npm run lint && npm run build   # attendu : exit 0 chacun
```

**Checkpoint**
```bash
git add -A && git commit -m "step 9: relances due/overdue view, done toggle"
git tag step-09-relances
```

---

### Étape 10 — Export CSV (streamé, respecte les filtres)

**Fait**
- `src/lib/csv.ts` — `escapeCsvField(value: string): string` (RFC 4180 : entoure de guillemets si la
  valeur contient une virgule, un guillemet ou un retour à la ligne, double les guillemets internes).
- `tests/csv.test.ts` — 4 cas : valeur simple (inchangée), valeur avec virgule (entourée), valeur avec
  guillemet (doublé + entourée), valeur avec retour à la ligne (entourée).
- `src/app/api/export/route.ts` — `GET`, appelle `requireActiveStaff()` en première ligne (401/403 sinon),
  lit les mêmes paramètres de filtre que `/prospects`, construit un `ReadableStream` qui écrit l'en-tête
  puis chaque ligne via `escapeCsvField`, `Content-Type: text/csv`, `Content-Disposition:
  attachment; filename="prospects.csv"`.

**Fait quand**
- [ ] QUAND `GET /api/export` est appelé sans session, LE SYSTÈME DOIT répondre `401`.
- [ ] QUAND `GET /api/export` est appelé par un compte authentifié non-staff, LE SYSTÈME DOIT répondre `403`.
- [ ] QUAND `GET /api/export?status=client` est appelé par un staff actif, LE SYSTÈME DOIT renvoyer un CSV ne contenant que les lignes `status='client'`, avec l'en-tête `name,city,category,phone,whatsapp,status,created_at` en première ligne.
- [ ] QUAND un nom de prospect contient une virgule, LE SYSTÈME DOIT l'entourer de guillemets dans le CSV exporté, jamais casser la colonne suivante.
- [ ] QUAND la suite de tests s'exécute, LE SYSTÈME DOIT rapporter les 4 cas de `csv.test.ts` réussis.

**Vérifier**
```bash
npm run test -- tests/csv.test.ts               # attendu : exit 0, 4 passed, 0 failed
npm run typecheck && npm run lint && npm run build   # attendu : exit 0 chacun

npm run dev &
sleep 3
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/export)
test "$STATUS" = 401                              # attendu : exit 0 — aucune session
kill %1
```

**Checkpoint**
```bash
git add -A && git commit -m "step 10: streamed csv export respecting filters"
git tag step-10-export
```

---

### Étape 11 — Déploiement Vercel, variables d'environnement, note keep-alive

**Fait**
- `next.config.ts` — édité (fichier généré vide par le scaffold à l'étape 1) pour ajouter une fonction
  `headers()` asynchrone appliquant à `/(.*)` : `X-Content-Type-Options: nosniff` et
  `Referrer-Policy: strict-origin-when-cross-origin` (voir §14 — `Strict-Transport-Security` reste géré
  automatiquement par Vercel, jamais dupliqué ici).
- `vercel.json` — NON APPLICABLE (aucune configuration custom nécessaire pour un projet Next.js
  standard ; le build/output sont détectés automatiquement par l'adaptateur Vercel).
- Documentation (`README.md`, section Déploiement) : lier le repo Git à un projet Vercel, définir les 4
  variables d'environnement (§10) dans Vercel → Project Settings → Environment Variables pour
  Production **et** Preview, définir le build command par défaut (`next build`) et l'output par défaut
  (aucun override requis).
- Note opérationnelle sur la pause du plan gratuit Supabase après 7 jours d'inactivité (§20.2 risque
  #3) : documentée dans le README et dans §12 Déploiement ci-dessous — pas une ligne de code, une
  décision opérationnelle à exécuter par l'humain qui gère le compte Supabase.

**Fait quand**
- [ ] QUAND le déploiement Vercel de production est visité par un navigateur non authentifié, LE SYSTÈME DOIT rediriger vers `/login`, jamais afficher de donnée du pipeline.
- [ ] QUAND `GET /api/health` est appelé sur l'URL de production, LE SYSTÈME DOIT répondre `200` avec `ok: true`.
- [ ] QUAND `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` est absente de l'environnement Preview, LE SYSTÈME DOIT échouer le build Preview avec un message nommant la variable manquante (même validation qu'en local, §9 étape 1, `src/lib/env.ts`) plutôt que de déployer une version qui plante au runtime — `SUPABASE_DB_URL` et `SUPABASE_SERVICE_ROLE_KEY` ne sont pas validées par `env.ts` (voir §10) donc leur absence ne fait pas échouer ce build.
- [ ] QUAND une réponse HTTP est reçue de n'importe quelle route, LE SYSTÈME DOIT inclure les en-têtes `X-Content-Type-Options: nosniff` et `Referrer-Policy: strict-origin-when-cross-origin`.

**Vérifier**
```bash
npm run build   # attendu : exit 0

npm run start &
sleep 3
curl -sI http://localhost:3000/login | grep -qi '^x-content-type-options: nosniff'
                                                      # attendu : exit 0 — en-tête émis par next.config.ts en local déjà
curl -sI http://localhost:3000/login | grep -qi '^referrer-policy: strict-origin-when-cross-origin'
                                                      # attendu : exit 0
kill %1

# À exécuter une fois le déploiement Vercel réalisé (nécessite l'URL de production réelle) :
STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$PRODUCTION_URL/")
test "$STATUS" = 307 -o "$STATUS" = 302              # attendu : exit 0 — redirection vers /login pour un visiteur anonyme

STATUS=$(curl -s -o /tmp/health-prod.json -w '%{http_code}' "$PRODUCTION_URL/api/health")
test "$STATUS" = 200                                  # attendu : exit 0
node -e "const b=require('/tmp/health-prod.json'); process.exit(b.ok===true ? 0 : 1)"  # attendu : exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 11: vercel deployment, security headers, env vars, keep-alive note"
git tag step-11-deploy
```

---

### 9.1 Parité et bascule

NON APPLICABLE — construction greenfield, aucun système existant n'est remplacé. Le suivi manuel
WhatsApp/tableur qu'il remplace n'a pas d'API ni de format de données à reproduire : la migration
consiste simplement à cesser d'utiliser le tableur une fois l'outil adopté, ce qui est une décision
d'usage, pas une bascule technique.

---

## 10. Configuration de l'environnement

### Prérequis
| Outil | Version | Vérification |
|---|---|---|
| Node.js | 24.x LTS | `node -v` (attendu : `v24.x`) |
| npm | fourni avec Node 24 | `npm -v` |
| PostgreSQL client (`psql`) | 16+ (compatible avec Supabase Postgres 17) | `psql --version` |
| `tsx` | installé comme dépendance de dev (§11), pas un outil système séparé | `npx tsx --version` |
| Compte Vercel | — | https://vercel.com/signup |
| Compte Supabase | — | https://supabase.com/dashboard/sign-up |
| Compte Google Cloud (pour activer le provider OAuth Google dans Supabase) | — | https://console.cloud.google.com |

### Comptes à créer d'abord
1. **Projet Supabase** — créer un nouveau projet (région la plus proche des utilisateurs), requis dès
   l'étape 1. Récupérer `Project URL`, `anon public key` dans Project Settings → API, et la chaîne de
   connexion directe (non poolée) dans Project Settings → Database → Connection string → URI, requis
   dès l'étape 4.
2. **Provider Google OAuth** — dans Supabase Dashboard → Authentication → Providers → Google : créer un
   identifiant OAuth 2.0 côté Google Cloud Console (type "Web application", URI de redirection autorisé
   = `<Project URL Supabase>/auth/v1/callback`), coller le Client ID/Secret dans le formulaire Supabase.
   Requis dès l'étape 2. Ces identifiants Google vivent dans la configuration Supabase, jamais dans le
   code ni dans les variables d'environnement de l'application.
3. **Projet Vercel** — lié au dépôt Git, requis à l'étape 11.

### Variables d'environnement
| Variable | Rôle | Où l'obtenir | Requise dès l'étape | Secrète ? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase, lue par les deux clients | Project Settings → API → Project URL | 1 | Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme, soumise aux RLS policies | Project Settings → API → anon public | 1 | Non (publique par nature, mais jamais utilisée pour bypasser RLS) |
| `SUPABASE_DB_URL` | Chaîne de connexion directe Postgres, pour `psql` et les migrations | Project Settings → Database → Connection string → URI (direct, pas la pooler) | 4 | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service, utilisée uniquement par `scripts/test-rls.ts` et `scripts/seed-staff.ts` — jamais dans le code applicatif servi au navigateur ni dans une Server Action | Project Settings → API → service_role | 4 | Oui |
| `PRODUCTION_URL` | URL de l'instance de production déployée sur Vercel — utilisée uniquement par le shell qui exécute le `Vérifier` de l'étape 11 (`curl` contre `$PRODUCTION_URL/` et `$PRODUCTION_URL/api/health`), jamais lue par le code applicatif | Vercel Dashboard → le projet → Domains (domaine de production), ou `vercel inspect <project> --prod` / `vercel ls` | 11 (uniquement) | Non |

`PRODUCTION_URL` est une valeur **post-déploiement**, pas une variable de développement local : elle
n'existe qu'une fois le déploiement Vercel de l'étape 11 réalisé, elle n'est **pas** dans `.env.example`
(les 3 autres variables ci-dessus, hors elle, y sont), et elle n'est jamais définie dans Vercel Project
Settings — c'est l'inverse des 4 variables `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
`SUPABASE_DB_URL` / `SUPABASE_SERVICE_ROLE_KEY`, qui sont des entrées de l'application et vivent dans
Vercel. Elle est simplement exportée dans le shell local qui exécute le `Vérifier` de l'étape 11, une
fois l'URL de production connue : `export PRODUCTION_URL=https://<domaine-vercel>`.

`.env.example` est committé avec les 4 clés applicatives présentes et des valeurs vides ou manifestement factices.
`.env.local` et `.env*.local` sont ignorés par git. L'application valide `NEXT_PUBLIC_SUPABASE_URL` et
`NEXT_PUBLIC_SUPABASE_ANON_KEY` au chargement de `src/lib/env.ts` et échoue bruyamment si absentes —
jamais de valeur par défaut pour un secret. `SUPABASE_DB_URL` et `SUPABASE_SERVICE_ROLE_KEY` ne sont
**pas** validées par `env.ts` (elles ne sont jamais lues par l'application Next.js elle-même, seulement
par les scripts autonomes de l'étape 4) — ceci évite qu'une variable requise seulement à l'étape 4 casse
le gate de build des étapes 1, 2 et 3 (règle §9.9 du template : aucune étape ne casse rétroactivement le
gate d'une étape antérieure).

**Chargement pour les outils autonomes :** `scripts/test-rls.ts` et `scripts/seed-staff.ts` sont
toujours invoqués avec `tsx --env-file=.env.local <script>` — le flag natif `--env-file` de Node 24 (que
`tsx` relaie) est le mécanisme de chargement, écrit explicitement dans chaque commande §9/§10/§19.1 qui
les invoque.

**Chargement pour `psql` :** `psql` ne lit aucun fichier `.env` de lui-même — contrairement à `tsx`, il
n'a pas de flag `--env-file`. Chaque invocation de `psql` est donc **toujours** précédée, dans le même
bloc shell, de `set -a; . .env.local; set +a` (exporte chaque variable de `.env.local`, dont
`SUPABASE_DB_URL`, dans l'environnement du shell courant, puis désactive l'export automatique) —
jamais un `psql "$SUPABASE_DB_URL" ...` nu sans ce chargement préalable dans le même bloc. Ce mécanisme
est écrit littéralement devant chaque commande `psql` de ce blueprint : §9 étapes 4, 7 et 8, le script
`db:migrate` de `package.json` (§19.6), et le tableau de commandes de `CLAUDE.md` (§19.1).

### Fichiers qui doivent être committés
| Fichier | Pourquoi il est committé | Ligne d'exception dans le fichier d'ignore |
|---|---|---|
| `.env.example` | Documente les 4 variables sans exposer de secret | `!.env.example` après le motif `.env*` |
| `supabase/migrations/0001_init.sql` | Schéma versionné, doit être rejouable sur toute base neuve | Non concerné par le motif `.env*` — non matché par aucun motif d'ignore |
| `vitest.config.ts` | Config du test-runner requise par tous les `Vérifier` invoquant `npm test` | Non matché |
| `.nvmrc` | Fixe la version Node pour CI et développeurs | Non matché |
| `package-lock.json` | Reproductibilité de l'installation | Non matché par défaut de `create-next-app` |

### Bootstrap
```bash
# ordre : fichier d'ignore + exceptions → init dépôt → premier commit → install → env → migration → seed

# 1. Scaffold Next.js — non interactif. Le CLI create-next-app 16.x accepte --yes pour répondre aux
#    invites restantes (aucune invite Turbopack : Turbopack est déjà le défaut en Next 16).
npx --yes create-next-app@16.3.4 . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --yes

# 2. Le scaffold installe typescript et react à ses propres versions par défaut — les remplacer
#    explicitement par les pins vérifiés (§11). NE JAMAIS laisser `npm install typescript@latest`
#    installer TypeScript 7.x (voir mise en garde §11 : pas d'API compilateur programmatique stable,
#    typescript-eslint le rejette).
npm install --save-exact typescript@6.0.3 react@19.3.0 react-dom@19.3.0
npm install --save-exact @supabase/supabase-js@2.116.0 @supabase/ssr@0.12.7
npm install --save-exact zod@4.4.3
# --legacy-peer-deps : contourne un bug connu d'arborist npm 10.9.2 sur ce graphe de peers
# précis (next 16.3.4 + react 19.3.0 + typescript 6.0.3 épinglés) — npm plante avec
# `Cannot read properties of null (reading 'edgesOut')` sans ce flag, reproductible à froid.
# Ce n'est pas un problème de code du projet, seulement de résolution de peers par cette
# version d'npm ; sans risque ici car aucun conflit de peer réel n'existe entre ces paquets.
npm install --save-dev --save-exact --legacy-peer-deps vitest@4.1.10 tsx@4.23.1

# 3. shadcn CLI — init non interactif puis ajout des composants nécessaires.
# -d/--defaults : seule invocation entièrement non interactive de ce CLI (template "next" +
# preset "base-nova"), constatée en testant réellement la commande. `-b` sur cette version du
# CLI attend une bibliothèque de composants (base|radix|aria), pas un nom de couleur — `-b
# neutral` lève `Invalid enum value`. `-y` seul (avec `-b radix`) laisse encore un prompt de
# sélection de preset ouvert ; `-d` est le seul flag qui le saute.
npx --yes shadcn@4.21.0 init -y -d
# `form` est délibérément omis de cette liste : cette version du CLI ne produit aucun fichier
# pour `form` (pas d'erreur, pas de message "already exists" comme pour `button` — juste rien
# n'est créé). Le blueprint n'utilise de toute façon jamais react-hook-form (voir §11
# "Délibérément non utilisé", §20.3 décision #4) donc ce composant n'est pas nécessaire.
npx --yes shadcn@4.21.0 add table dialog badge button input select label textarea dropdown-menu

# 4. Fichier d'ignore : create-next-app en écrit un par défaut couvrant déjà node_modules/, .next/,
#    .env*.local — ajouter l'exception .env.example AVANT le premier commit.
printf '\n!.env.example\n' >> .gitignore

# 5. .env.example committé avec les 4 clés (voir §10 tableau, valeurs factices).
cat > .env.example <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_DB_URL=
SUPABASE_SERVICE_ROLE_KEY=
EOF

# 6. Fixer la version Node pour la reproductibilité.
echo "24" > .nvmrc

# 7. Initialisation du dépôt — idempotent, requis par les Checkpoints `git tag` de §9.
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main
git add -A && git commit -m "chore: scaffold" --allow-empty

# 8. Installation réelle — le vrai gate, après le fichier d'ignore et le premier commit.
npm install
npm run build   # smoke test du scaffold avant de commencer l'étape 1

# Le reste (vitest.config.ts, scripts/, tests/, migration SQL) est écrit par les étapes §9 elles-mêmes
# ou émis en §19.6 — ce bloc ne fait que scaffolder et poser les fondations.
```

**Copie du workspace :** ce blueprint est en mode fichier unique, donc §19 n'émet aucun répertoire
`workspace/` à copier — chaque fichier de §19.6 est un bloc marqué de son chemin de destination, à créer
directement par le builder au moment indiqué (§10 pour les fichiers de fondation, §9 pour les fichiers
propres à une étape).

---

## 11. Dépendances

Chaque ligne provient du rapport `stack-researcher` produit dans cette session (vérifié 2026-09-09) sauf
mention explicite du repli `knowledge/runtime-tracks/ts-node.md` (vérifié 2026-07-27).

**Mise en garde reportée verbatim du rapport :** TypeScript 7.x (tag npm `latest`) n'a pas d'API
compilateur programmatique stable, et l'intervalle peer de `typescript-eslint` (`>=4.8.4 <6.1.0`) le
rejette — une demande de support TS7 a été fermée « not planned » par `typescript-eslint`. `typescript`
est donc épinglé explicitement à `6.0.3` après le scaffold ; ne jamais laisser `create-next-app` ou un
`npm install typescript` sans version installer `latest`.

### Runtime
| Paquet | Version | Source | Vérifié | Installé par | Usage |
|---|---|---|---|---|---|
| `next` | 16.3.4 | https://registry.npmjs.org/-/package/next/dist-tags | 2026-09-09 | §10 Bootstrap (scaffold `create-next-app@16.3.4`) | Framework App Router |
| `react` | 19.3.0 | https://registry.npmjs.org/-/package/react/dist-tags | 2026-09-09 | §10 Bootstrap | Bibliothèque UI |
| `react-dom` | 19.3.0 | https://registry.npmjs.org/-/package/react/dist-tags | 2026-09-09 | §10 Bootstrap | Rendu DOM |
| `typescript` | 6.0.3 | https://registry.npmjs.org/-/package/typescript/dist-tags | 2026-09-09 | §10 Bootstrap (override explicite post-scaffold) | Langage — voir mise en garde ci-dessus |
| `@supabase/supabase-js` | 2.116.0 | https://registry.npmjs.org/-/package/@supabase%2fsupabase-js/dist-tags | 2026-09-09 | §10 Bootstrap | Client Supabase (auth + requêtes DB) |
| `@supabase/ssr` | 0.12.7 | https://registry.npmjs.org/-/package/@supabase%2fssr/dist-tags | 2026-09-09 | §10 Bootstrap | Client Supabase adapté SSR (cookies, `proxy.ts`) |
| `zod` | 4.4.3 | `knowledge/runtime-tracks/ts-node.md` (repli — non résolu par le rapport) | 2026-07-27 | §10 Bootstrap | Validation des entrées (formulaires, Server Actions) |
| `tailwindcss` | 4.3.3 | https://registry.npmjs.org/-/package/tailwindcss/dist-tags | 2026-09-09 | §10 Bootstrap (scaffold `--tailwind`) | Styling utilitaire, config `@theme` |

### Développement
| Paquet | Version | Source | Vérifié | Installé par | Usage |
|---|---|---|---|---|---|
| `vitest` | 4.1.10 | `knowledge/runtime-tracks/ts-node.md` (repli — non résolu par le rapport) | 2026-07-27 | §10 Bootstrap | Test-runner unitaire |
| `tsx` | 4.23.1 | `knowledge/runtime-tracks/ts-node.md` (repli — non résolu par le rapport) | 2026-07-27 | §10 Bootstrap | Exécution des scripts `.ts` autonomes (`scripts/*.ts`) sans `tsc` d'émission |
| `shadcn` (CLI) | 4.21.0 | https://ui.shadcn.com/docs/cli | 2026-09-09 | §10 Bootstrap (`npx shadcn@4.21.0`) | Génère les composants copiés dans `src/components/ui/` — pas une dépendance runtime, `npx` seul |
| `eslint` / `eslint-config-next` | version scaffoldée par `create-next-app@16.3.4 --eslint` | `create-next-app@16.3.4` (le scaffold choisit lui-même sa version compatible avec Next 16.3.4) | 2026-09-09 | §10 Bootstrap (scaffold `--eslint`) | Lint — `next lint` étant retiré en Next 16, la commande `npm run lint` appelle `eslint .` directement (voir §19.1) |
| `@types/react` / `@types/react-dom` | plage `^19` (non figée sur un patch précis) | Choisie par `create-next-app` au scaffold, non re-vérifiée individuellement | 2026-09-09 | §10 Bootstrap (installées par le scaffold, conservées telles quelles) | Types TypeScript pour React 19 |

### Délibérément non utilisé
| Rejeté | À la place | Pourquoi |
|---|---|---|
| Drizzle / Prisma (ORM) | `@supabase/supabase-js` en accès direct | 4 tables, aucune requête complexe multi-jointure ; un ORM ajouterait une couche de mapping sans bénéfice sur ce volume, et RLS gère déjà toute l'autorisation au niveau base |
| `react-hook-form` | Formulaires natifs `<form>` + Server Actions + validation zod côté serveur | Pas de logique de formulaire dynamique (pas de champs conditionnels, pas de tableaux répétés) — la validation serveur seule suffit et évite une dépendance |
| `@clerk/nextjs` / `better-auth` | Supabase Auth | Deux fournisseurs d'identité créeraient deux sessions à réconcilier (voir `stack-compatibility.md`) ; Supabase Auth est déjà co-localisé avec la base et les RLS policies |
| `@playwright/test` | Tests unitaires Vitest + vérifications `curl`/`psql` par étape | Connexion OAuth Google non scriptable de façon fiable sans compte de test dédié à Google ; le volume et la criticité du projet ne justifient pas l'infrastructure d'un navigateur piloté pour 2-3 utilisateurs internes — voir §13 |
| Biome | ESLint (`eslint-config-next`) | Le brief fixe explicitement `--eslint` sur le scaffold `create-next-app`, pas `--biome` ; ce choix évite aussi la mise en garde du runtime track sur le parseur CSS de Biome face à Tailwind v4 `@theme` |
| pnpm | npm | Le brief fixe explicitement `--use-npm` ; aucun monorepo, aucun bénéfice mesurable de pnpm ici |

---

## 12. Stratégie de déploiement

### Hébergement
Vercel, plan Hobby suffisant au démarrage (2-3 utilisateurs, aucune exigence de SLA commercial).
Commande de build : `next build` (détectée automatiquement). Répertoire de sortie : géré par
l'adaptateur Vercel (`.next/`, aucun override). Runtime : Node.js (pas de mode Edge — les Server
Actions et le client Postgres direct de Supabase n'ont pas besoin de la contrainte Edge).

### Environnements
| Environnement | Branche | URL | Base de données | Mode tiers |
|---|---|---|---|---|
| Local | — | `http://localhost:3000` | Le même projet Supabase (pas de base séparée — volume trop faible pour justifier une base par branche) | Provider Google OAuth réel |
| Preview | toute PR | auto-générée par Vercel | Le même projet Supabase | Provider Google OAuth réel |
| Production | `main` | domaine Vercel par défaut ou domaine custom Doko | Le même projet Supabase | Provider Google OAuth réel |

### CI/CD
NON APPLICABLE au sens d'un pipeline séparé — Vercel exécute `npm run build` à chaque push (Preview) et
à chaque merge sur `main` (Production), ce qui constitue le seul pipeline de ce projet. Ce build échoue
si `npm run typecheck` (intégré via le `prebuild` de `package.json`, voir §19.1) ou `next build`
lui-même échoue — les mêmes commandes que le gate global de §20.1.

### Release et rollback
Le déploiement est automatique au push sur `main`. Rollback : dans le tableau de bord Vercel, "Instant
Rollback" vers le déploiement de production précédent — réversible en quelques secondes, aucune
opération de base de données associée (aucune migration destructive n'existe en v1, voir §4). Une
nouvelle migration SQL est toujours appliquée manuellement via `psql` avant le déploiement du code qui
en dépend, jamais l'inverse.

### Domaine, DNS, TLS
Domaine Vercel par défaut (`*.vercel.app`) suffisant pour un outil interne à 2-3 utilisateurs. Si un
domaine custom est ajouté plus tard, Vercel gère automatiquement le certificat TLS et l'enregistrement
DNS requis est documenté au moment de l'ajout dans le tableau de bord Vercel — hors périmètre v1.

### Risque opérationnel — pause du plan gratuit Supabase
Le plan gratuit Supabase met un projet en pause après 7 jours sans requête. Pour un outil utilisé
quotidiennement par l'équipe, ce risque est faible en usage normal, mais une absence (congés) pourrait
déclencher la pause. **Mitigation documentée :** soit un ping programmé léger (ex. un job planifié
Vercel Cron gratuit appelant `GET /api/health` une fois par jour — hors périmètre v1, à activer si le
risque se matérialise), soit passer au plan payant Supabase dès que l'usage réel dépasse la phase de
validation. Décision à prendre par le propriétaire du compte Supabase, pas une tâche de ce build order.

---

## 13. Stratégie de tests

| Couche | Framework | Ce qu'elle couvre | Où | S'exécute |
|---|---|---|---|---|
| Unitaire | Vitest | Logique pure sans réseau : échappement CSV, garde d'accès staff, construction de filtres de requête | `tests/*.test.ts` | À chaque étape (§9), avant chaque commit |
| Intégration base de données | Script `tsx` + `psql` contre le vrai projet Supabase | Policies RLS (staff actif vs non-staff), transactionnalité des RPC | `scripts/test-rls.ts`, vérifications inline des `Vérifier` de §9 | Étape 4, et manuellement avant toute modification de policy |
| E2E | Délibérément absent — voir ci-dessous | — | — | — |

### Flux critiques couverts (par vérification scriptée, pas par navigateur piloté)
1. Un compte non-staff ne peut lire ni écrire aucune ligne des 4 tables (étape 4, `test-rls.ts`).
2. Un changement de statut écrit toujours exactement une ligne `activity_log`, jamais zéro ni deux
   (étape 8, vérification `psql` avant/après).
3. L'export CSV respecte l'authentification et l'échappement RFC 4180 (étape 10, `csv.test.ts` +
   vérification `curl` du code 401).

### Données de test
Aucune base de test séparée : le volume (2-3 utilisateurs, ~100-300 prospects) et le coût d'une
deuxième instance Supabase ne se justifient pas. `scripts/test-rls.ts` crée et supprime son propre
utilisateur Supabase Auth temporaire à chaque exécution — il ne touche à aucune ligne `prospects`,
`relances` ni `activity_log` existante, donc il est sûr de le lancer contre le projet réel.

### Ce qui n'est délibérément pas testé
- **Le flux de connexion Google OAuth lui-même** (le clic réel sur "Continuer avec Google" jusqu'au
  retour du code) : nécessiterait un compte Google de test piloté par navigateur, ce qui est fragile et
  disproportionné pour 2-3 utilisateurs internes qui testeront ce flux manuellement une fois au
  déploiement. La partie testable — la vérification de l'allowlist une fois authentifié — est couverte
  par `tests/staff-gate.test.ts`.
- **Le rendu visuel exact des composants shadcn** : pas de test de snapshot visuel ; le contraste et les
  tokens sont vérifiés au build (§9 étape 5).
- **La charge/performance** : hors de propos à ce volume (100-300 lignes, 2-3 utilisateurs simultanés au
  maximum).

---

## 14. Sécurité & Secrets

| Préoccupation | Contrôle | Implémenté dans |
|---|---|---|
| Stockage des secrets | Variables d'environnement Vercel (Production/Preview), jamais dans le repo | Vercel Project Settings → Environment Variables |
| Rotation des secrets | Manuelle, via la régénération de clé dans le tableau de bord Supabase, en cas de compromission suspectée | Procédure documentée dans le README, pas de cadence automatique (2-3 clés, faible surface) |
| Validation des entrées | `zod`, appliquée en première ligne de chaque Server Action | `src/lib/validation.ts` |
| Encodage de sortie / XSS | Échappement automatique de React (JSX) ; aucun `dangerouslySetInnerHTML` nulle part dans le projet | Toute la couche `src/components/` |
| Injection SQL | Aucune requête SQL concaténée manuellement — uniquement le client `@supabase/supabase-js` (requêtes paramétrées) et les fonctions RPC Postgres avec des arguments typés | `src/server/**`, `supabase/migrations/0001_init.sql` |
| AuthN / AuthZ | Voir §8 — vérifié côté serveur à chaque requête, ET par RLS au niveau base | `src/server/staff.ts`, policies RLS |
| CSRF | `SameSite=Lax` sur les cookies de session + protection native des Server Actions Next.js | `@supabase/ssr`, Next.js |
| Limitation de débit / abus | NON APPLICABLE — 2-3 comptes connus, aucune surface publique mutable | — |
| Vérification de webhook | NON APPLICABLE — aucun webhook entrant dans ce projet | — |
| Audit des dépendances | `npm audit` exécuté manuellement avant chaque déploiement majeur (pas de CI dédiée, volume de dépendances faible) | Documenté dans le README |
| En-têtes de sécurité | `Strict-Transport-Security` géré par Vercel automatiquement en HTTPS ; `X-Content-Type-Options: nosniff` et `Referrer-Policy: strict-origin-when-cross-origin` définis dans `next.config.ts` via `headers()` | `next.config.ts`, écrit à l'étape 11 (§9), contenu émis en §19.6 |
| Traitement des PII | Noms, téléphones, adresses de boutiques (données professionnelles, pas de PII sensible de particuliers) stockés uniquement dans Supabase, jamais journalisés en clair | `src/server/**` — aucun `console.log` de champ `phone`/`address`/`notes` |
| Hygiène des logs | Aucun secret, jeton ou champ PII dans les logs applicatifs ; les logs Vercel/Supabase natifs ne sont pas modifiés | Convention de code, vérifiée à la revue de chaque Server Action |

**Règles strictes**
- Aucun secret n'est jamais committé, affiché dans un log, envoyé à un traqueur d'erreurs, ni intégré
  dans le bundle client. `SUPABASE_SERVICE_ROLE_KEY` n'existe dans aucun fichier sous `src/app/` ou
  `src/components/`.
- Toutes les vérifications d'autorisation côté serveur s'exécutent avant le travail, jamais après.
- Ce projet ne reçoit aucun webhook tiers — la règle de vérification de signature ne s'applique pas.

Aucune donnée régulée (santé, finance, données d'enfants, données personnelles UE au sens RGPD
nécessitant un traitement particulier) n'est traitée — les données sont des coordonnées professionnelles
de boutiques, gérées par l'équipe qui les a elle-même collectées via démarchage direct.

---

## 15. Accessibilité

**Cible : WCAG 2.2 niveau AA.**

### Exigences de base
| Exigence | Règle |
|---|---|
| HTML sémantique | `<header>`/`<nav>`/`<main>`/`<footer>` dans `(dashboard)/layout.tsx`, un seul `<h1>` par page |
| Clavier | Chaque ligne de `ProspectsTable` et chaque action de `StatusSelect` atteignable au clavier, ordre de tabulation logique |
| Focus visible | Anneau de focus utilisant `--primary` à 3:1 minimum contre `--surface`/`--background` |
| Contraste | Voir §7 — `--fg` sur `--background` 14.8:1, `--primary` sur `--background` 5.9:1, `--warn` sur `--surface` 4.6:1 |
| Formulaires | Chaque input de `ProspectForm`/`RelanceForm` a un `<label>` associé ; erreurs en texte sous le champ, jamais uniquement en couleur |
| Images | Aucune image significative dans ce projet (interface data-first) ; les icônes shadcn/lucide portent `aria-hidden="true"` quand purement décoratives |
| Mouvement | Toutes les transitions de §7 respectent `prefers-reduced-motion: reduce` |
| Zoom / reflow | Testé manuellement à 200% de zoom sur `/prospects` (table la plus dense) et à 320px de large |
| Régions live | Le message de succès/erreur après soumission d'un formulaire est annoncé via `aria-live="polite"` |

### Ajouts WCAG 2.2
| SC | Exigence |
|---|---|
| 2.4.11 Focus non obscurci | Le header fixe (56px) ne recouvre jamais un élément focalisé de la table en dessous |
| 2.5.8 Taille de cible | Les boutons d'action par ligne (`StatusSelect`, suppression) font au moins 24×24px |
| 3.3.8 Authentification accessible | Connexion Google uniquement — aucun test cognitif, gestionnaire de mots de passe non concerné |

### Vérification
```bash
npx --yes @axe-core/cli http://localhost:3000/prospects --exit   # attendu : 0 violation
```
Cette commande couvre environ un tiers des problèmes réels. Avant le lancement (checklist manuelle,
§20.1) : un passage clavier seul sur les flux ajout/édition/changement de statut, un passage lecteur
d'écran sur `/prospects`, un passage zoom 200% sur `/prospects`.

---

## 16. Observabilité & Coût

### Instrumentation
| Signal | Outil | Ce qu'il capture | Qui le regarde |
|---|---|---|---|
| Erreurs | Logs Vercel natifs (Runtime Logs) | Exceptions non gérées dans les Server Actions et routes API, avec la trace de la requête | Le propriétaire du projet, à la demande |
| Logs | Logs Vercel natifs | Chaque requête, avec code de statut | Le propriétaire du projet |
| Métriques | Vercel Analytics (plan Hobby gratuit) | Les quatre ci-dessous | Le propriétaire du projet |
| Disponibilité | `GET /api/health`, vérifié manuellement ou via un moniteur externe gratuit (ex. UptimeRobot) | Le projet Supabase répond-il | Le propriétaire du projet |

Aucun outil tiers d'error-tracking (Sentry ou équivalent) n'est ajouté en v1 : le volume d'usage (2-3
utilisateurs) rend les logs Vercel natifs suffisants, et un service payant supplémentaire n'est pas
justifié à ce stade — revisiter si le nombre de comptes staff dépasse 5 (même trigger que le
Non-objectif « rôles/permissions »).

### Les métriques qui comptent pour ce projet
| Métrique | Cible | Alerte à |
|---|---|---|
| Temps de réponse `/prospects` (chargement liste) | < 500ms | > 2s de façon répétée (observé manuellement, pas d'alerte automatisée en v1) |
| Taux d'erreur `500` sur `/api/export` et `/api/health` | 0% | Toute occurrence — vérifiée dans les logs Vercel |
| Relances en retard non traitées après 48h | 0 | Revue manuelle hebdomadaire par le propriétaire |

### Vérification de santé
`GET /api/health` vérifie que la connexion Supabase répond réellement (`auth.getSession()`, pas un
simple `return 200` statique) — voir §9 étape 1. Cet appel ne dépend d'aucune table applicative, donc
la vérification reste valide même avant que le schéma (§4) ne soit créé.

### Modèle de coût
| Service | Palier gratuit | Coût au lancement (2-3 users) | Coût à 10× | Point de bascule à surveiller |
|---|---|---|---|---|
| Vercel (Hobby) | Suffisant pour ce trafic | 0 $/mois | 0-20 $/mois (plan Pro si usage commercial requis) | Passage à un usage commercial nécessitant le plan Pro |
| Supabase (Free) | 500 Mo DB, pause après 7j d'inactivité | 0 $/mois | 25 $/mois (plan Pro, lève la pause) | La pause après inactivité devient gênante en usage réel |
| Google Cloud OAuth | Gratuit (identifiants OAuth) | 0 $/mois | 0 $/mois | Aucun — gratuit à toute échelle pour ce cas d'usage |

**Coût mensuel estimé au lancement : 0 $.** Le plus gros poste potentiel est le passage Supabase au
plan payant (25 $/mois) si la pause après 7 jours devient un problème opérationnel réel — c'est le
levier le moins cher à activer (un clic dans le tableau de bord Supabase) et il est documenté en §12.

---

## 17. Routage des modèles

NON APPLICABLE — ce projet n'appelle aucun LLM en runtime.

---

## 18. Skills à utiliser pendant la construction

| Skill | Étapes de build | Pourquoi | Installation |
|---|---|---|---|
| `ui-ux-pro-max` | Étapes 4, 5, 6, 7, 8 (coquille, table, formulaires) | Vérifie que l'implémentation shadcn respecte les tokens et la densité définis en §7, même si le système est déjà entièrement spécifié | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` puis `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| `frontend-design` | Étapes 4, 5, 6, 8 (coquille, liste, formulaires, relances) | Qualité de mise en page pour un panneau dense orienté données | `/plugin marketplace add anthropics/skills` puis `/plugin install example-skills@anthropic-agent-skills` |

Aucun skill ci-dessus n'est jamais dépendance dure : s'il n'est pas installé, le builder suit les
sections §6/§7 de ce blueprint (déjà entièrement littérales) et continue, en notant la bascule en une
ligne dans son journal de build.

---

## 19. Espace de travail agent

Mode fichier unique : chaque artefact ci-dessous est un bloc balisé de son chemin de destination, à
écrire tel quel par le builder — aucun répertoire `workspace/` n'est émis.

### 19.1 `CLAUDE.md`

Destination : `CLAUDE.md` (racine du projet).

```markdown
# Doko Prospection

CRM interne (2-3 personnes) pour suivre le démarchage de boutiques pour Doko SaaS/B2B.

## Commandes

| Tâche | Commande |
|---|---|
| Installer | `npm install` |
| Serveur de dev | `npm run dev` — http://localhost:3000 |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests unitaires | `npm run test` · un fichier : `npm run test -- tests/csv.test.ts` |
| Migration DB | `npm run db:migrate` (= `set -a && . .env.local && set +a && psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql`) |
| Seed staff | `npm run db:seed -- --email=... --name=...` |
| Test RLS | `npm run test:rls` (= `tsx --env-file=.env.local scripts/test-rls.ts`) |

**Gate :** `npm run typecheck && npm run lint && npm run test && npm run build` doit passer avant de
marquer une tâche terminée.

Version runtime fixée dans `.nvmrc` (`24`). Versions des dépendances dans `package-lock.json` — le lire,
jamais deviner une version.

## Stack

Next.js 16 (App Router) · TypeScript 6.0.3 · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth
Google) · accès direct `@supabase/supabase-js` (pas d'ORM) · Vercel.

## Architecture

**Trajet d'une requête.** Navigateur → `src/app/(dashboard)/prospects/page.tsx` (Server Component) →
`src/server/prospects.ts` (`listProspects()`) → `src/lib/supabase/server.ts` → Postgres (RLS appliquée).
Les mutations passent par des Server Actions dans `src/server/**`, jamais par un `fetch` client vers une
route API — sauf `/api/export` (streaming CSV) et `/api/health`, qui sont les deux seules routes HTTP
classiques du projet.

**Frontières.** Franchir l'une dans le mauvais sens casse le build :

| Couche | Peut importer depuis | Ne doit jamais |
|---|---|---|
| `src/app/**` (routes) | `components`, `server`, `lib` | Importer `lib/supabase/server.ts` directement pour une mutation |
| `src/components/**` | `lib`, autres composants | Importer `server/` ou `lib/supabase/` |
| `src/server/**` | `lib/supabase`, `lib/validation` | Importer React ou quoi que ce soit de `components/` |
| `scripts/**` | Son propre client Supabase (clé de service) | Partager un client avec `src/server/**` |

**Où vivent les choses.**

| Concern | Source unique de vérité |
|---|---|
| Schéma DB | `supabase/migrations/0001_init.sql` — modifier ici, puis `npm run db:migrate` |
| Accès env | `src/lib/env.ts` — validé au chargement ; ne jamais lire `process.env` ailleurs pour les variables `NEXT_PUBLIC_*` |
| Tokens de design | `src/app/globals.css` (bloc `@theme`) — aucune valeur hex/px brute dans les composants |
| Schémas de validation | `src/lib/validation.ts` — inférer les types depuis le schéma zod, jamais les déclarer deux fois |
| Session d'auth | `src/server/staff.ts` — un seul `requireActiveStaff()`, utilisé partout dans `(dashboard)` |

## Règles de code

1. **Un composant par fichier. Max 300 lignes.** Au-delà, découper par responsabilité.
2. **Alias de chemin `@/` → `src/`.** Pas d'imports `../../..`.
3. **Server-first.** Les composants sont des Server Components par défaut. `"use client"` seulement
   pour l'état, les effets ou les gestionnaires d'événement — sur la feuille la plus petite, jamais sur
   une page ou un layout.
4. **Pas de fichiers barrel.** Importer depuis le module source ; les ré-exports `index.ts` cassent le
   tree-shaking.
5. **Valider à la frontière.** Chaque Server Action parse son entrée avec un schéma zod avant de
   toucher `src/server/**`. Aucune entrée non validée n'atteint une requête Supabase.
6. **Les erreurs reviennent en résultats typés**, jamais en chaînes levées. Forme :
   `{ ok: true, data } | { ok: false, error }`.
7. **Aucune extension de fichier dans les imports relatifs**, et aucun script n'est jamais exécuté par
   `node` nu — toujours `tsx`. Voir §19.6 du blueprint pour la matrice de résolution complète.
8. **Aucune nouvelle dépendance sans raison dans le message de commit.** Vérifier `@supabase/supabase-js`
   et le stdlib d'abord.

## Système de design

Tokens définis une fois dans `src/app/globals.css` (bloc `@theme`). Les composants ne référencent que
des noms de tokens.

| Rôle | Valeur | Utilisé pour |
|---|---|---|
| Primaire | `#0E6B64` | Boutons primaires, liens, focus |
| Fond | `#F4F2EC` | Fond de page |
| Surface | `#FFFFFF` | Cartes, panneaux, dialogs |
| Bordure | `#DAD6CB` | Séparateurs, contours d'input |
| Texte | `#1B2321` | Corps de texte |
| Texte atténué | `#5B655F` | Légendes, placeholders |
| Destructif | `#B3261E` | Erreurs, suppression |
| Succès | `#1F7A4C` | Statut "client", confirmations |
| Alerte | `#B5721A` | Badges de relance en retard |

- **Typo :** titres/nav `Sora` 600/700/800 ; corps/tableaux pile système 0.875rem/1.5 ; mono pile
  système.
- **Échelle :** base 4px — 4, 8, 12, 16, 24, 32, 48, 64.
- **Rayon :** 6px inputs/boutons, 10px cartes/dialogs, plein pour badges/avatars.
- **Élévation :** `0 1px 2px rgba(0,0,0,0.06)` cartes, `0 4px 16px rgba(0,0,0,0.12)` dialogs.
- **Mouvement :** 120-180ms, `ease-out`. Transform et opacité uniquement. Respecte
  `prefers-reduced-motion`.
- **Layout :** largeur max 1280px (liste) / 720px (formulaires) ; points de rupture sm/md/lg/xl.

## Environnement

| Variable | Requise | Utilisée par | Source |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | `src/lib/env.ts` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | `src/lib/env.ts` | Supabase → Project Settings → API |
| `SUPABASE_DB_URL` | oui (migrations/scripts seulement) | `scripts/*.ts`, `npm run db:migrate` | Supabase → Project Settings → Database, connexion directe |
| `SUPABASE_SERVICE_ROLE_KEY` | oui (scripts seulement) | `scripts/test-rls.ts`, `scripts/seed-staff.ts` | Supabase → Project Settings → API |

`.env.example` est committé et reste synchronisé. Les fichiers `.env*.local` avec de vraies valeurs ne
le sont jamais.

## Règles

Conventions différées — lire le fichier correspondant avant d'éditer cette zone :

| Fichier | S'applique à |
|---|---|
| `.claude/rules/database.md` | `supabase/**`, `src/server/**` |
| `.claude/rules/components.md` | `src/components/**` |

## Non-négociable

1. Jamais de `DELETE` SQL physique sur `prospects` — toujours `deleted_at`, jamais d'exception.
2. Un changement de statut passe toujours par le RPC `change_prospect_status`, jamais par un `UPDATE`
   direct sur `prospects.status` depuis le code applicatif — sinon `activity_log` désynchronise.
3. Jamais committer de secret, `.env.local`, ni la sortie de build (`.next/`).
4. Jamais éditer `supabase/migrations/0001_init.sql` après qu'elle a été appliquée en production —
   ajouter une nouvelle migration numérotée.
5. Jamais marquer une tâche terminée avec une commande de gate en échec.
6. `SUPABASE_SERVICE_ROLE_KEY` n'apparaît jamais dans `src/app/` ni `src/components/` — scripts
   uniquement.
```

### 19.2 `AGENTS.md`

Destination : `AGENTS.md` (racine du projet).

```markdown
# Doko Prospection — instructions agent

CRM interne (2-3 personnes) pour suivre le démarchage de boutiques pour Doko SaaS/B2B.

## Commandes

| Tâche | Commande |
|---|---|
| Installer | `npm install` |
| Serveur de dev | `npm run dev` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm run test` |
| Migration DB | `npm run db:migrate` |

## Non-négociable

1. Jamais de `DELETE` SQL physique sur `prospects` — toujours `deleted_at`.
2. Un changement de statut passe toujours par le RPC `change_prospect_status`.
3. Jamais committer de secret, `.env.local`, ni `.next/`.

Architecture complète, frontières et tokens de design : voir `CLAUDE.md` dans ce répertoire.
```

### 19.3 `.claude/settings.json`

Destination : `.claude/settings.json`.

```json
{
  "permissions": {
    "allow": [
      "Bash(npx --yes create-next-app@16.3.4:*)",
      "Bash(printf:*)",
      "Bash(cat:*)",
      "Bash(echo:*)",
      "Bash(npm run dev:*)",
      "Bash(npm run start:*)",
      "Bash(npm run build)",
      "Bash(npm run typecheck)",
      "Bash(npm run lint)",
      "Bash(npm run test:*)",
      "Bash(npm run test:rls)",
      "Bash(npm run db:migrate)",
      "Bash(npm run db:seed:*)",
      "Bash(npm install)",
      "Bash(npm install --save-exact:*)",
      "Bash(npm install --save-dev --save-exact:*)",
      "Bash(npx tsx:*)",
      "Bash(tsx:*)",
      "Bash(npx --yes shadcn@4.21.0:*)",
      "Bash(npx --yes @axe-core/cli:*)",
      "Bash(psql:*)",
      "Bash(curl -s:*)",
      "Bash(curl -sI:*)",
      "Bash(node -e:*)",
      "Bash(sleep:*)",
      "Bash(kill:*)",
      "Bash(grep:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git tag:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git init:*)",
      "Bash(git rev-parse:*)",
      "Bash(git ls-files:*)",
      "Bash(git check-ignore:*)"
    ],
    "deny": [
      "Read(./.env.local)",
      "Read(./.env.*.local)",
      "Bash(git push:*)",
      "Bash(psql * -c DROP*)",
      "Bash(psql * -c TRUNCATE*)"
    ]
  }
}
```

### 19.4 Skills du projet — `.claude/skills/add-migration/SKILL.md`

Destination : `.claude/skills/add-migration/SKILL.md`.

````markdown
---
name: add-migration
description: Ajoute une nouvelle migration SQL versionnée dans supabase/migrations/ quand le schéma
  doit changer après le déploiement initial. Utiliser dès qu'une modification de table, colonne, index
  ou policy RLS est nécessaire — jamais en éditant 0001_init.sql après son application en production.
---

# Ajouter une migration

## Quand l'utiliser
Le schéma de `supabase/migrations/0001_init.sql` doit changer après son application initiale (nouvelle
colonne, nouvel index, nouvelle policy RLS, nouvelle fonction RPC).

## Étapes
1. Créer `supabase/migrations/NNNN_description.sql` avec `NNNN` = le numéro suivant (4 chiffres,
   séquentiel, ex. `0002_add_prospect_tags.sql`).
2. Écrire uniquement le delta (les nouvelles instructions `ALTER TABLE`/`CREATE INDEX`/`CREATE POLICY`),
   jamais un dump complet du schéma.
3. Si la migration touche une policy RLS, ajouter ou mettre à jour le cas correspondant dans
   `scripts/test-rls.ts`.
4. Appliquer et vérifier.

## Vérifier
```bash
set -a; . .env.local; set +a   # charge SUPABASE_DB_URL — psql ne lit aucun fichier .env de lui-même
psql "$SUPABASE_DB_URL" -f supabase/migrations/NNNN_description.sql   # expect: exit 0
tsx --env-file=.env.local scripts/test-rls.ts                          # expect: exit 0
```

## Ne pas faire
- Ne jamais éditer une migration déjà appliquée en production — toujours une nouvelle migration
  numérotée, même pour corriger une typo.
- Ne jamais poser une nouvelle table sans `enable row level security` et au moins une policy `select`
  restreinte à `is_active_staff()`.
````

| Skill | Se déclenche sur | Ce qu'il automatise |
|---|---|---|
| `add-migration` | "ajouter une colonne", "changer le schéma", "nouvelle table" | Convention de nommage, RLS obligatoire, vérification RLS après coup |

### 19.5 `.claude/rules/*.md`

Destination : `.claude/rules/database.md`.

```markdown
---
description: Conventions de schéma et de migration Postgres/Supabase
paths:
  - "supabase/**"
  - "src/server/**"
---

- Chaque nouvelle table active `row level security` et porte au moins une policy `select` utilisant
  `is_active_staff()` — jamais de table sans RLS dans ce projet.
- Suppression toujours logique (`deleted_at timestamptz`), jamais de `DELETE` physique sur une table
  métier.
- Un changement d'état multi-effets (ex. changement de statut + écriture d'historique) passe par une
  fonction Postgres `SECURITY INVOKER` appelée en RPC, jamais par deux requêtes séparées depuis le code
  applicatif — l'atomicité doit être garantie par la transaction de la fonction, pas par l'ordre du code
  TypeScript.
- Toute nouvelle migration est un fichier numéroté séquentiel dans `supabase/migrations/`, jamais une
  édition d'un fichier déjà appliqué.
```

Destination : `.claude/rules/components.md`.

```markdown
---
description: Conventions des composants React de l'interface
paths:
  - "src/components/**"
  - "src/app/**"
---

- Server Component par défaut ; `"use client"` uniquement sur la feuille qui a réellement besoin d'état
  ou d'un gestionnaire d'événement.
- Aucune valeur hex ou pixel brute dans un composant — toujours un token de `src/app/globals.css`.
- Chaque liste (`ProspectsTable`, `RelanceList`) a ses trois états explicites : chargement (squelette),
  vide (message + action), erreur (`error.tsx` du segment) — jamais un des trois manquant.
- Un composant qui dépasse 300 lignes est découpé par responsabilité avant d'ajouter une fonctionnalité
  de plus.
```

| Fichier | Globs `paths` | Couvre |
|---|---|---|
| `.claude/rules/database.md` | `supabase/**`, `src/server/**` | RLS obligatoire, suppression logique, RPC transactionnel |
| `.claude/rules/components.md` | `src/components/**`, `src/app/**` | Server-first, tokens de design, états de liste |

### 19.6 Configuration critique pour les `Vérifier` et infrastructure locale

Aucun service local n'est requis (Supabase est hébergé, consommé directement en développement comme en
production — voir §12) : cette sous-section n'émet donc pas de `docker-compose.yml`. Les fichiers
ci-dessous sont ceux dont dépendent les commandes `Vérifier` de §9.

**Destination : `vitest.config.ts`**
```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", ".next", "blueprints/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```
Résout l'alias `@/` (utilisé par `src/lib/csv.ts` et `src/server/staff.ts` importés par les tests) sans
dépendre d'un plugin supplémentaire — Vitest utilise esbuild, qui accepte les imports sans extension de
fichier, cohérent avec la convention de §3. `exclude` couvre `blueprints/**` : si ce blueprint est un
jour committé dans le repo du projet lui-même (ce qui n'est pas le flux attendu ici, mais couvre le cas
où quelqu'un le copierait dans le repo), Vitest ne tente jamais de collecter un fichier de test qui s'y
trouverait.

**Destination : `.env.example`**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_DB_URL=
SUPABASE_SERVICE_ROLE_KEY=
```
Émis identique au bloc `cat > .env.example` de §10 Bootstrap — mêmes 4 clés, mêmes valeurs vides.

**Destination : `src/lib/env.ts`**
```typescript
import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL est manquante ou invalide — voir .env.example",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante — voir .env.example",
  }),
});

export const env = EnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
```
`zod.parse()` lève au premier import si une clé manque ou est invalide — c'est le mécanisme de
« échoue bruyamment au démarrage » exigé en §10 ; ne valide volontairement que les deux variables
`NEXT_PUBLIC_*`, jamais `SUPABASE_DB_URL`/`SUPABASE_SERVICE_ROLE_KEY` (voir §10, pour ne pas casser le
gate des étapes 1-3 avec une variable qui n'est requise qu'à partir de l'étape 4).

**Destination : `package.json` (scripts, fusionnés dans le fichier généré par le scaffold)**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:rls": "tsx --env-file=.env.local scripts/test-rls.ts",
    "db:migrate": "set -a && . .env.local && set +a && psql \"$SUPABASE_DB_URL\" -f supabase/migrations/0001_init.sql",
    "db:seed": "tsx --env-file=.env.local scripts/seed-staff.ts"
  }
}
```
`create-next-app --eslint` écrit déjà `"lint": "next lint"` par défaut — Next.js 16 a retiré `next
lint` (voir §11, mise en garde du runtime track), donc cette entrée est **éditée** vers `"eslint ."`
dans la même étape que le scaffold (§10 Bootstrap), avant le premier `npm run lint`.

**Destination : `next.config.ts` (édité à l'étape 11, voir §9)**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
```
Le fichier existe vide (config par défaut) depuis le scaffold de l'étape 1 ; le contenu ci-dessus est
celui que l'étape 11 y écrit — voir §14 pour la justification des deux en-têtes.

#### Convention de résolution — matrice

**La convention, énoncée une fois :** imports relatifs et alias `@/` **sans extension de fichier**
(`from "../lib/env"`, `from "@/server/staff"`), et aucun fichier `.ts` n'est jamais exécuté par `node`
nu — toujours via un exécuteur esbuild/bundler (`next`, `vitest`, `tsx`).

| Contexte | Commande qui l'exerce | Forme telle qu'elle y apparaît | Config + réglage littéral qui la fait fonctionner |
|---|---|---|---|
| Code applicatif | `npm run build` (Turbopack) | Sans extension, alias `@/*` | `tsconfig.json` — `"paths": {"@/*": ["./src/*"]}` (écrit par le scaffold `--src-dir --import-alias "@/*"`), résolu par Turbopack qui accepte l'extensionless nativement |
| Fichiers de test | `npm run test` (Vitest) | Sans extension, alias `@/*` | `vitest.config.ts` — `resolve.alias["@"]` ci-dessus, Vitest/esbuild accepte l'extensionless nativement |
| Scripts autonomes | `npm run test:rls` / `npm run db:seed` (`tsx`) | Sans extension, imports relatifs uniquement (pas d'alias `@/` dans `scripts/`, pour rester indépendants de la config Next) | Aucun réglage requis — `tsx` (esbuild) résout l'extensionless nativement ; la règle est de ne jamais invoquer ces fichiers via `node` nu |
| Build de production | `npm run build` (Turbopack, sortie `.next/`) | Identique à « Code applicatif » | Même `tsconfig.json` ; Turbopack réécrit les imports dans le bundle de sortie, aucune extension `.js` à gérer manuellement (contrairement à un `tsc` d'émission séparé — ce projet n'en a pas) |

**Auto-vérification :** les quatre commandes ci-dessus ont été confirmées comme utilisant la même
famille de résolveur (esbuild/Turbopack), qui accepte tous l'extensionless par défaut — il n'existe pas
de cinquième contexte dans ce projet (pas de `tsc -p tsconfig.build.json` séparé, aucun fichier n'est
jamais passé à `node` directement).

#### Réconciliation des valeurs inter-artefacts

| Valeur partagée | Source unique — le fichier qui la décide | Valeur littérale | Chaque autre endroit où elle apparaît | Comparé |
|---|---|---|---|---|
| Port du serveur de dev | Next.js (défaut, non surchargé) | `3000` | §9 étapes 1/2/9 (`curl http://localhost:3000/...`), §10 Bootstrap (`sleep 3` avant curl) | oui |
| Alias de chemin `@/*` | `tsconfig.json` (`compilerOptions.paths`, écrit par le scaffold) | `@/*` → `./src/*` | `vitest.config.ts` (`resolve.alias`), CLAUDE.md §"Règles de code" point 2 | oui |
| Chemin de la migration initiale | §4 Schéma (contenu SQL) | `supabase/migrations/0001_init.sql` | §9 étape 4 (Do + Vérifier), §10 Bootstrap (commande `npm run db:migrate`), `package.json` script `db:migrate`, `.claude/skills/add-migration/SKILL.md` | oui |
| Nom des 4 tables | §4 Entités | `staff`, `prospects`, `relances`, `activity_log` | §9 étape 4 (Vérifier, boucle `for t in ...`), §4 Schéma SQL, `.claude/rules/database.md` | oui |
| Variable de connexion directe | §10 tableau des variables d'environnement | `SUPABASE_DB_URL` | `.env.example`, `package.json` script `db:migrate`, §9 étapes 4/7/8, `.claude/settings.json` (`Bash(psql:*)`) | oui |
| Nom du RPC de changement de statut | §4 Schéma SQL (fonction) | `change_prospect_status` | §5 (Server Action), §9 étape 8 (Do + Vérifier), CLAUDE.md non-négociable #2 | oui |
| Nom du RPC de suppression logique | §4 Schéma SQL (fonction) | `soft_delete_prospect` | §5 (Server Action), §9 étape 7 (Do) | oui |
| Nom du RPC de création de prospect | §4 Schéma SQL (fonction) | `create_prospect_with_log` | §5 (Server Action `createProspect`), §9 étape 7 (Do + Vérifier) | oui |

#### Réconciliation des artefacts byte-exact

NON APPLICABLE — ce blueprint n'auteurise aucun fichier attendu (golden file, fixture, snapshot) dont le
contenu byte-exact serait comparé par une commande `diff` ou un `jq -e` sur une chaîne littérale. Les
seules assertions de contenu portent sur des propriétés (nombre de lignes de `activity_log` inchangé,
présence d'une sous-chaîne de couleur dans le CSS, code HTTP retourné) — voir §9 rule 12/16 — jamais sur
un texte d'erreur ou une sortie runtime-dépendante recopiée à l'avance.

#### Exclusion du chemin du bundle

NON APPLICABLE — mode fichier unique : aucun répertoire `blueprints/<slug>/workspace/` n'existe dans
l'arbre du projet construit. Le fichier `vitest.config.ts` ci-dessus exclut néanmoins `blueprints/**`
par précaution (voir sa configuration), au cas où ce document serait committé tel quel dans le repo par
choix de l'équipe.

---

## 20. Porte d'acceptation, Risques & Journal de décisions

### 20.1 Porte d'acceptation globale

Le projet est **terminé** quand chaque commande ci-dessous termine avec le code 0 sur un clone propre,
pas avant.

```bash
npm install                                            # expect: exit 0
npm run typecheck                                       # expect: exit 0, zéro erreur
npm run lint                                             # expect: exit 0, zéro erreur et zéro avertissement
npm run test                                             # expect: exit 0, 0 failed, 0 skipped
npm run build                                            # expect: exit 0

npm run start &
sleep 3
STATUS=$(curl -s -o /tmp/health-final.json -w '%{http_code}' http://localhost:3000/api/health)
test "$STATUS" = 200                                     # expect: exit 0
node -e "const b=require('/tmp/health-final.json'); process.exit(b.ok===true ? 0 : 1)"
                                                          # expect: exit 0 — l'entrée servie est bien celle que next build a produite (§9 rule 13)
kill %1

npx --yes @axe-core/cli http://localhost:3000/login --exit  # expect: 0 violation
```

Plus ces portes manuelles, chacune vérifiée une fois avant le lancement :

- [ ] Chaque étape de §9 a son tag de checkpoint en git (`git tag -l 'step-*'` en liste 11, une par
      étape). Le dépôt où vivent ces tags est créé par le Bootstrap de §10, pas par le scaffold.
- [ ] Chaque fichier nommé par la table « Fichiers qui doivent être committés » de §10 est présent dans
      un clone propre : `git ls-files --error-unmatch <chemin>` termine en exit 0 pour chacun,
      individuellement — `.env.example`, `supabase/migrations/0001_init.sql`, `vitest.config.ts`,
      `.nvmrc`, `package-lock.json`.
- [ ] Pour chacun de ces mêmes fichiers : `git check-ignore -q <chemin>; test $? -eq 1` termine en
      exit 0 (1 = non ignoré ; jamais `! git check-ignore -q a b` sur plusieurs chemins à la fois, qui
      sort en 128 pour usage incorrect et passerait même si les fichiers étaient ignorés).
- [ ] Le fichier d'ignore était en place avant le premier commit : `git log --diff-filter=A
      --format=%H -- .gitignore` montre qu'il a été ajouté dans le commit `"chore: scaffold"` de §10
      Bootstrap, jamais dans le commit d'une étape §9.
- [ ] §10 Bootstrap a été rejoué une fois sur un arbre déjà bootstrapé (relancer `npx create-next-app`
      sur le même répertoire est refusé par le CLI lui-même — le rejeu pertinent ici est `npm install`
      seul, qui termine en exit 0 et ne modifie pas `package.json`).
- [ ] Chaque ligne de la table « Réconciliation des valeurs inter-artefacts » de §19.6 lit
      `Comparé : oui`.
- [ ] §9.1 est marquée NON APPLICABLE — rien à prouver ici.
- [ ] Chaque non-objectif de §1 n'est toujours pas construit.
- [ ] Chacune des 4 variables applicatives de §10 (`NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`) est définie en
      production (Vercel) et absente du repo. `PRODUCTION_URL` est exclue de cette porte : ce n'est pas
      une variable applicative, elle n'est jamais définie dans Vercel (voir §10).
- [ ] Les 3 flux critiques de §13 ont été vérifiés contre l'URL de production.
- [ ] Un passage clavier seul et un passage lecteur d'écran ont été faits sur `/prospects` (§15).
- [ ] Une erreur volontaire a été déclenchée et apparaît dans les logs Vercel (§16).
- [ ] Un rollback a été effectué une fois, volontairement, sur un déploiement Preview (§12).

**Aucun avertissement n'est ignoré.** Un avertissement toléré devient permanent, et le prochain vrai
problème s'y cache.

### 20.2 Registre des risques

| Risque | Probabilité | Impact | Signal précoce | Mitigation |
|---|---|---|---|---|
| Adoption — l'outil est plus lent que WhatsApp/tableur | M | H | Les collaborateurs continuent de rapporter des appels par message plutôt que par l'outil après la semaine 1 | Formulaire d'ajout limité à 4 champs obligatoires (nom, téléphone, ville, catégorie) ; aucune friction de workflow imposée — voir §1 objectif 1 |
| Mauvaise configuration RLS — un compte non-staff lit/écrit des données | L | H | Le script `test-rls.ts` (étape 4) échoue, ou une ligne apparaît dans `activity_log` avec un `actor_id` absent de `staff` | Test RLS automatisé exécuté à l'étape 4 avant qu'aucune UI ne soit construite dessus, revérifié à chaque nouvelle policy (skill `add-migration`) |
| Pause du projet Supabase gratuit après 7 jours d'inactivité | M | M | `GET /api/health` renvoie une erreur de connexion après une période de congés | Documenté en §12 ; option de ping planifié ou passage au plan payant si le risque se matérialise |
| Dérive de version TypeScript (installation accidentelle de TS 7.x) | L | M | `npm run typecheck` ou `next build` échoue avec une erreur liée au compilateur | `typescript@6.0.3` épinglé avec `--save-exact` dès le Bootstrap (§10, §11) |
| Un collaborateur oublie de désactiver un compte parti (`staff.active`) | M | M | Un ancien collaborateur peut encore se connecter | Procédure manuelle documentée dans le README ; volume de 2-3 comptes rend un oubli visible rapidement |
| Perte du fil d'activité par une future modification qui contourne le RPC | L | H | Un changement de statut n'a pas de ligne `activity_log` correspondante | Règle non-négociable #2 de CLAUDE.md ; le RPC est le seul chemin documenté et testé (§9 étape 8) |

### 20.3 Journal de décisions

| # | Décision | Alternative rejetée | Pourquoi | Reviendrait en arrière si |
|---|---|---|---|---|
| 1 | Accès direct `@supabase/supabase-js`, pas d'ORM | Drizzle ou Prisma | 4 tables, aucune requête multi-jointure complexe ; RLS gère déjà l'autorisation | Le modèle de données dépasse 8-10 tables avec des relations complexes |
| 2 | Supabase Auth (Google) plutôt qu'un fournisseur d'identité séparé | Clerk / Auth0 | Session déjà dans le contexte des RLS policies, un seul cookie de session | L'organisation adopte un SSO d'entreprise (Google Workspace SSO/SCIM) au-delà d'un simple login Google |
| 3 | Aucun test E2E navigateur-piloté | Playwright | OAuth Google non scriptable de façon fiable ; volume/criticité ne justifient pas l'infrastructure | Le nombre de flux critiques dépasse ce qu'un test scripté par `curl`/`psql` peut raisonnablement couvrir |
| 4 | Formulaires natifs + Server Actions, pas de `react-hook-form` | react-hook-form | Aucun champ dynamique/conditionnel ; validation serveur seule suffit | Un formulaire avec des champs répétés ou conditionnels apparaît |
| 5 | ESLint (pas Biome) | Biome | Le brief fixe `--eslint` sur le scaffold ; évite la mise en garde Tailwind v4 `@theme` de Biome | Une migration de tout le stack vers Biome est décidée séparément |
| 6 | npm (pas pnpm) | pnpm | Le brief fixe `--use-npm` ; aucun monorepo | Un deuxième projet TypeScript rejoint le même repo (monorepo) |
| 7 | Aucune base de test séparée | Une deuxième instance Supabase pour les tests | Volume trop faible pour justifier le coût et la synchronisation d'une deuxième base | Le volume de prospects dépasse quelques milliers et les tests risquent d'impacter la prod |

### 20.4 À construire ensuite

1. Rôles/permissions par ressource si un collaborateur ne doit voir qu'une partie du pipeline
   (déclencheur : §1 non-objectifs).
2. Intégration WhatsApp/SMS pour envoyer un message directement depuis une fiche prospect (déclencheur :
   le volume d'envois manuels devient un goulot d'étranglement mesurable).
3. Notifications email pour les relances en retard (déclencheur : le badge visuel seul ne suffit plus à
   éviter les oublis, mesuré par la métrique §1 « relances traitées »).
4. Ping planifié anti-pause Supabase, ou passage au plan payant (déclencheur : la pause après 7 jours se
   matérialise réellement une première fois).

---

*Fin du blueprint. L'ordre de construction est en §9. Arrêter quand §20.1 est vert.*
