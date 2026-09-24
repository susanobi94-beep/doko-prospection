# Hierarchical Teams & Sub-Teams (Cameroon & Africa) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a hierarchical team and sub-team management architecture for Doko Prospection focused on Cameroon (Douala, Yaoundé, Bafoussam) and Africa, allowing parent zones to contain multiple specialized sub-teams, commercial assignment, team leaders, recursive filtering, and team-level conversion KPIs.

**Architecture:** Recursive PostgreSQL `teams` table with `parent_id self-reference`, RLS policies, Next.js 16 Server Actions for tree construction, recursive prospect filtering (filtering by "Douala" automatically queries all Douala sub-teams), and an interactive team management UI in `/settings/teams`.

**Tech Stack:** Next.js 16, React 19, Supabase PostgreSQL, Tailwind CSS v4, Vitest, pg.

---

### Task 1: Database Migration `0004_hierarchical_teams.sql` & Runner

**Files:**
- Create: `supabase/migrations/0004_hierarchical_teams.sql`
- Modify: `scripts/apply-migration.ts` (if needed)
- Apply to Hetzner VPS Supabase PostgreSQL

**Step 1: Write migration SQL**
- Create table `teams`:
  - `id uuid primary key default gen_random_uuid()`
  - `name text not null`
  - `parent_id uuid references teams(id) on delete cascade`
  - `city text`
  - `country text not null default 'Cameroun'`
  - `leader_id uuid references staff(id) on delete set null`
  - `created_at timestamptz not null default now()`
- Indices on `parent_id`, `leader_id`, `city`, `country`
- Add `team_id uuid references teams(id) on delete set null` to `staff`
- Add `team_id uuid references teams(id) on delete set null` to `prospects`
- RLS policies:
  - `teams`: select for `is_active_staff()`, insert/update/delete for `is_admin()`
- Seed initial Cameroon & Africa hierarchy:
  - Parent: `Douala` (city: 'Douala', country: 'Cameroun')
    - Sub-teams: `Douala - Akwa`, `Douala - Bonabéri`, `Douala - Marché Central`, `Douala - Makepe / Bonamoussadi`
  - Parent: `Yaoundé` (city: 'Yaoundé', country: 'Cameroun')
    - Sub-teams: `Yaoundé - Mokolo`, `Yaoundé - Centre-Ville / Bastos`
  - Parent: `Bafoussam` (city: 'Bafoussam', country: 'Cameroun')
  - Parent: `Abidjan` (city: 'Abidjan', country: 'Côte d\'Ivoire')

**Step 2: Apply migration to VPS PostgreSQL**
Run: `npx tsx --env-file=.env.local scripts/apply-migration.ts supabase/migrations/0004_hierarchical_teams.sql`

**Step 3: Commit**
```bash
git add supabase/migrations/0004_hierarchical_teams.sql
git commit -m "feat(db): migration 0004 for hierarchical teams and sub-teams"
```

---

### Task 2: Tree Data Structures & Descendant Lookup Utilities

**Files:**
- Create: `src/lib/team-tree-utils.ts`
- Test: `tests/team-hierarchy.test.ts`

**Step 1: Write unit tests**
- Test `buildTeamTree`: transforms flat array of teams with `parent_id` into a nested tree.
- Test `getAllDescendantTeamIds`: given a parent ID (e.g. Douala), returns Douala's ID plus all IDs of its sub-teams.
- Test `formatTeamLabel`: formats with hierarchy breadcrumb (e.g. "Douala > Akwa").

**Step 2: Implement `src/lib/team-tree-utils.ts`**

**Step 3: Run tests to verify**
Run: `npx vitest run tests/team-hierarchy.test.ts`
Expected: PASS

**Step 4: Commit**
```bash
git add src/lib/team-tree-utils.ts tests/team-hierarchy.test.ts
git commit -m "feat(teams): tree building and recursive descendant utilities"
```

---

### Task 3: Team Server Actions

**Files:**
- Create: `src/server/team-hierarchy-actions.ts`
- Modify: `src/server/staff.ts` (include `team_id` and `team` relation)

**Step 1: Implement `src/server/team-hierarchy-actions.ts`**
- `listAllTeams()`: returns flat list of teams with member counts and leader info.
- `createSubTeamAction(data: { name: string; parentId?: string; city?: string; country?: string; leaderId?: string })`
- `updateTeamAction(id: string, data: { name: string; parentId?: string; city?: string; leaderId?: string })`
- `deleteTeamAction(id: string)`
- `assignStaffTeamAction(staffId: string, teamId: string | null)`

**Step 2: Update `src/server/staff.ts`**
- Include `team_id` and `team:teams(id, name, city, country)` in `StaffMember` and `listAllStaff`.

**Step 3: Commit**
```bash
git add src/server/team-hierarchy-actions.ts src/server/staff.ts
git commit -m "feat(teams): server actions for team hierarchy and member assignment"
```

---

### Task 4: Recursive Team Filtering in Prospects & Filter Bar

**Files:**
- Modify: `src/server/prospects-filter.ts` (support `teamId`)
- Modify: `src/server/prospects.ts` (query descendant team IDs and filter prospects)
- Modify: `src/components/prospects/prospects-filter-bar.tsx` (add hierarchical team selector)
- Modify: `src/app/(dashboard)/prospects/page.tsx` (pass teams to filter bar and listProspects)
- Test: `tests/team-filter.test.ts`

**Step 1: Write filter test**
Test that `buildProspectsFilter` accepts `teamId`.

**Step 2: Update `prospects.ts`**
If `filter.teamId`:
1. Find all descendant team IDs (parent + all sub-teams).
2. Filter prospects where `team_id in (ids)` OR `assigned_staff.team_id in (ids)`.

**Step 3: Update `ProspectsFilterBar`**
Add `<select>` with optgroups or indented items:
- Douala (Zone Littoral)
  - ↳ Douala - Akwa
  - ↳ Douala - Bonabéri
  - ↳ Douala - Marché Central
  - ↳ Douala - Makepe / Bonamoussadi
- Yaoundé (Zone Centre)
  - ↳ Yaoundé - Mokolo
  - ↳ Yaoundé - Centre-Ville / Bastos
- Bafoussam
- Abidjan (Côte d'Ivoire)

**Step 4: Run tests**
Run: `npm test`
Expected: ALL PASS

**Step 5: Commit**
```bash
git add src/server/prospects-filter.ts src/server/prospects.ts src/components/prospects/ tests/team-filter.test.ts src/app/\(dashboard\)/prospects/page.tsx
git commit -m "feat(filter): recursive team and sub-team prospect filtering"
```

---

### Task 5: Team Management Page (`/settings/teams`)

**Files:**
- Create: `src/components/teams/teams-hierarchy-view.tsx`
- Create: `src/components/teams/create-team-dialog.tsx`
- Create: `src/app/(dashboard)/settings/teams/page.tsx`
- Modify: `src/components/layout/sidebar.tsx` (add "👥 Équipes & Zones" link for admin)

**Step 1: Implement `TeamsHierarchyView` component**
- Accordion / Tree view grouping by country & parent city (Douala, Yaoundé, etc.).
- Sub-team cards displaying:
  - Sub-team name
  - Leader (Chef d'équipe) with crown icon 👑
  - Members chips (Commercials in this team)
  - Member assignment dropdown to quickly move a commercial to this sub-team
  - Delete / Edit buttons
- "+ Créer une zone ou sous-équipe" button opening `CreateTeamDialog`.

**Step 2: Create page `src/app/(dashboard)/settings/teams/page.tsx`**
- Restricted to admin via `requireAdmin()`.
- Fetches all teams and all staff members.

**Step 3: Add to `Sidebar`**
- In `src/components/layout/sidebar.tsx`: link to `/settings/teams`.

**Step 4: Commit**
```bash
git add src/components/teams/ src/app/\(dashboard\)/settings/teams/ src/components/layout/sidebar.tsx
git commit -m "feat(ui): team hierarchy management interface in settings"
```

---

### Task 6: Team Performance KPIs on Dashboard

**Files:**
- Modify: `src/server/prospects.ts` (add `getTeamKpiStats()`)
- Create: `src/components/dashboard/team-kpi-card.tsx`
- Modify: `src/app/(dashboard)/page.tsx` (embed Team Performance section)
- Test: `tests/team-kpi.test.ts`

**Step 1: Write KPI calculation test**
In `tests/team-kpi.test.ts`: test grouping prospects and conversion rate calculation by team.

**Step 2: Implement `getTeamKpiStats()`**
Aggregates total prospects, contacted, clients, and conversion rate grouped by team/sub-team.

**Step 3: Embed in Dashboard UI**
Display a card grid comparing sub-teams (e.g. Douala - Akwa vs Douala - Marché Central vs Yaoundé - Mokolo).

**Step 4: Run tests**
Run: `npm test`
Expected: ALL PASS

**Step 5: Commit**
```bash
git add src/server/prospects.ts src/components/dashboard/ src/app/\(dashboard\)/page.tsx tests/team-kpi.test.ts
git commit -m "feat(kpi): team and sub-team performance metrics on dashboard"
```

---

### Task 7: Full Verification, Next.js Build & Production Push

**Files:**
- All touched files

**Step 1: Run complete Vitest suite**
Run: `npm test`

**Step 2: Run TypeScript check**
Run: `npm run typecheck`

**Step 3: Run production build**
Run: `npm run build`

**Step 4: Push to GitHub**
```bash
git push origin main
```
Verify Coolify rolling update on VPS.
