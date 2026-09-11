# Doko Prospection

Outil interne de suivi de prospection boutiques pour Doko (Next.js + Supabase).

## Démarrage local

```bash
npm install
cp .env.example .env.local   # renseigner les 4 clés Supabase (voir tableau ci-dessous)
npm run dev
```

## Variables d'environnement

| Variable | Rôle | Où l'obtenir | Secrète ? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Project Settings → API → Project URL | Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme, soumise aux RLS | Project Settings → API → anon public | Non |
| `SUPABASE_DB_URL` | Connexion Postgres pour `db:migrate`/`test:rls`/`db:seed` | Project Settings → Database → Connection string | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Utilisée uniquement par `scripts/*.ts` | Project Settings → API → service_role | Oui |

**Note réseau locale :** sur certains réseaux (proxy/firewall d'entreprise), la connexion Postgres
directe (port 5432, non poolée) peut être injoignable — DNS IPv6-only et/ou port bloqué. Si `psql`/
`db:migrate` échouent avec `ENOTFOUND` ou `ECONNRESET`, utiliser la chaîne **Session pooler**
(`aws-0-<region>.pooler.supabase.com:5432`, Project Settings → Database → Connection string →
Session pooler) comme `SUPABASE_DB_URL`, ou appliquer la migration manuellement via le SQL Editor du
tableau de bord Supabase.

## Commandes

| Tâche | Commande |
|---|---|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests unitaires | `npm run test` |
| Test RLS automatisé | `npm run test:rls` |
| Migration DB | `npm run db:migrate` |
| Seed staff | `npm run db:seed -- --email=... --name=...` (après la première connexion Google du collaborateur) |
| Preview Cloudflare (build + run local) | `npm run preview` |
| Déploiement Cloudflare | `npm run deploy` |

## Déploiement (Cloudflare Workers)

Déployé via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (l'adaptateur Next.js →
Workers recommandé par Cloudflare — `next-on-pages` est déprécié). Une app Next.js SSR sur Cloudflare
tourne comme un Worker ; le produit "Pages" historique ne couvre que le côté statique.

1. Compte Cloudflare + `npx wrangler login` (une fois, ouvre un navigateur pour l'auth).
2. Définir les 4 variables d'environnement (§ ci-dessus) comme secrets Worker :
   `npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL` (répéter pour les 3 autres — les
   `NEXT_PUBLIC_*` peuvent aussi être en clair dans `wrangler.jsonc` `vars`, les 2 secrets restent en
   `wrangler secret`).
3. `npm run deploy` — construit (`opennextjs-cloudflare build`) puis déploie (`opennextjs-cloudflare
   deploy`) sur `*.workers.dev` ou un domaine personnalisé configuré dans le dashboard Cloudflare.
4. Une fois déployé, vérifier `GET <url>/api/health` → `200 {"ok":true}`.

`npm run preview` fait la même build mais lance le Worker localement (via `wrangler dev` sous le
capot) avant de déployer pour de vrai.

## Note opérationnelle — pause Supabase

Le plan gratuit Supabase met le projet en pause après 7 jours d'inactivité. Si l'outil n'est pas
utilisé pendant une semaine, prévoir une visite de `/api/health` (ou une requête légère) pour
maintenir le projet actif, ou réactiver manuellement le projet depuis le tableau de bord Supabase.
