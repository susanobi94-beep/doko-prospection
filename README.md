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

## Déploiement (Vercel)

1. Lier le dépôt Git à un nouveau projet Vercel.
2. Dans Project Settings → Environment Variables, définir les 4 variables ci-dessus pour
   **Production** et **Preview**.
3. Build command par défaut (`next build`), aucun override requis.
4. Une fois déployé, vérifier `GET <url>/api/health` → `200 {"ok":true}`.

## Note opérationnelle — pause Supabase

Le plan gratuit Supabase met le projet en pause après 7 jours d'inactivité. Si l'outil n'est pas
utilisé pendant une semaine, prévoir une visite de `/api/health` (ou une requête légère) pour
maintenir le projet actif, ou réactiver manuellement le projet depuis le tableau de bord Supabase.
