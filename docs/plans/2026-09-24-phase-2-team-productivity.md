# Phase 2 — Team Productivity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Doko Prospection into a high-productivity sales CRM for growing teams by adding threaded dated comments, customizable colored tags, a Kanban pipeline board, bulk CSV import with duplicate prevention, and a unified chronological timeline on prospect profiles.

**Architecture:** Next.js 16 App Router with React 19 Server Actions, Supabase PostgreSQL with RLS and schema migration `0003_phase2_productivity.sql`, Tailwind CSS UI components with optimistic status changes, and client-side CSV parsing with robust server-side batch validation and activity logging.

**Tech Stack:** Next.js 16, React 19, Supabase PostgreSQL, Tailwind CSS v4, Zod, pg, Vitest.

---

### Task 1: Database Migration `0003_phase2_productivity.sql` & Runner

**Files:**
- Create: `supabase/migrations/0003_phase2_productivity.sql`
- Create: `scripts/apply-migration.ts`
- Test: `tests/migration-0003.test.ts`

**Step 1: Write migration SQL file**
Create `supabase/migrations/0003_phase2_productivity.sql` with:
- Table `comments`:
  - `id uuid primary key default gen_random_uuid()`
  - `prospect_id uuid not null references prospects(id) on delete cascade`
  - `author_id uuid references staff(id)`
  - `body text not null`
  - `created_at timestamptz not null default now()`
  - Index `comments_prospect_idx` on `(prospect_id, created_at desc)`
  - RLS: select for active staff (`is_active_staff()`), insert for editor staff (`is_editor_staff()`), delete for admin or comment author
- Table `tags`:
  - `id uuid primary key default gen_random_uuid()`
  - `label text not null unique`
  - `color text not null default '#6B7280'`
  - `created_at timestamptz not null default now()`
  - RLS: select for active staff, insert for editor staff, update/delete for admin
- Table `prospect_tags`:
  - `prospect_id uuid not null references prospects(id) on delete cascade`
  - `tag_id uuid not null references tags(id) on delete cascade`
  - `created_at timestamptz not null default now()`
  - Primary key `(prospect_id, tag_id)`
  - Indices on `prospect_id` and `tag_id`
  - RLS: select for active staff, insert/delete for editor staff
- Default seed tags:
  - 'Prioritaire' (#EF4444), 'Marché Akwa' (#3B82F6), 'Marché Central' (#10B981), 'Boutique physique' (#8B5CF6), 'Grossiste' (#F59E0B), 'Diaspora' (#06B6D4)

**Step 2: Create migration runner script**
`scripts/apply-migration.ts`:
Runs the SQL migration against `process.env.SUPABASE_DB_URL` with transaction support.

**Step 3: Execute migration and verify tables**
Run: `npx tsx --env-file=.env.local scripts/apply-migration.ts supabase/migrations/0003_phase2_productivity.sql`
Verify `comments`, `tags`, `prospect_tags` exist in the database.

**Step 4: Commit**
```bash
git add supabase/migrations/0003_phase2_productivity.sql scripts/apply-migration.ts
git commit -m "feat(db): migration 0003 for comments, tags, and prospect_tags"
```

---

### Task 2: Threaded Dated Comments Feature

**Files:**
- Create: `src/server/comments-actions.ts`
- Create: `src/components/prospects/prospect-comments.tsx`
- Modify: `src/server/prospects.ts` (add `listCommentsForProspect`)
- Modify: `src/app/(dashboard)/prospects/[id]/page.tsx` (embed comments section)
- Test: `tests/comments-validation.test.ts`

**Step 1: Write failing validation test**
Test input validation for comments in `tests/comments-validation.test.ts` (empty comment rejected, comment > 2000 chars rejected, valid comment accepted).

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/comments-validation.test.ts`

**Step 3: Implement `src/server/comments-actions.ts` and `src/server/prospects.ts`**
- `addCommentAction(prospectId: string, body: string)`:
  - Authenticates with `requireEditorStaff()`
  - Validates body via Zod (`z.string().trim().min(1).max(2000)`)
  - Inserts comment with `author_id = user.id`
  - Inserts entry in `activity_log` (`action = 'comment_added'`)
  - Revalidates `/prospects/${prospectId}`
- `deleteCommentAction(commentId: string, prospectId: string)`:
  - Deletes comment if user is author or admin
  - Revalidates path
- `listCommentsForProspect(prospectId: string)` in `src/server/prospects.ts`:
  - Selects comments with author `staff(id, name)` ordered by `created_at desc`

**Step 4: Create UI Component `src/components/prospects/prospect-comments.tsx`**
- Interactive comment form with textarea, character counter, pending state, auto-clear on submit
- List of comments showing author initials/avatar, author name, formatted timestamp, body text, and delete button for authorized users.

**Step 5: Add comments section to `src/app/(dashboard)/prospects/[id]/page.tsx`**

**Step 6: Run test suite & verify**
Run: `npx vitest run tests/comments-validation.test.ts`
Expected: PASS

**Step 7: Commit**
```bash
git add src/server/comments-actions.ts src/components/prospects/prospect-comments.tsx src/server/prospects.ts src/app/\(dashboard\)/prospects/\[id\]/page.tsx tests/comments-validation.test.ts
git commit -m "feat(comments): threaded dated comments on prospect profiles"
```

---

### Task 3: Customizable Tags & Tag Filtering

**Files:**
- Create: `src/server/tags-actions.ts`
- Create: `src/components/tags/tag-badge.tsx`
- Create: `src/components/tags/prospect-tag-manager.tsx`
- Modify: `src/server/prospects-filter.ts` (add `tagId` filter)
- Modify: `src/server/prospects.ts` (include tags in `listProspects` and `getProspect`, filter by `tagId`)
- Modify: `src/components/prospects/prospects-filter-bar.tsx` (add tag filter select)
- Modify: `src/components/prospects/prospects-table.tsx` (show tag badges)
- Modify: `src/app/(dashboard)/prospects/[id]/page.tsx` (show tag manager)
- Test: `tests/tags-filter.test.ts`

**Step 1: Write failing filter test**
In `tests/tags-filter.test.ts`, test that `buildProspectsFilter` accepts `tagId` and ignores empty values.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/tags-filter.test.ts`

**Step 3: Update `prospects-filter.ts` and `prospects.ts`**
- In `prospects-filter.ts`: add `tagId?: string` to `ProspectsFilterInput` and `ProspectsFilter`.
- In `prospects.ts`:
  - Update `Prospect` and `ProspectDetail` types to include `tags?: Array<{ id: string; label: string; color: string }>`
  - Join `tags:prospect_tags(tag:tags(id, label, color))`
  - When `filter.tagId` is present, filter using inner join or matching IDs.
- In `src/server/tags-actions.ts`:
  - `listAllTags()`
  - `createTagAction(label: string, color?: string)`
  - `attachTagAction(prospectId: string, tagId: string)`
  - `detachTagAction(prospectId: string, tagId: string)`

**Step 4: Create Tag UI Components**
- `TagBadge`: reusable colored badge with contrasting text.
- `ProspectTagManager`: displays attached badges with remove button + dropdown to attach existing tags or create a new tag on the fly.
- Update `ProspectsFilterBar`: add dropdown "Filtrer par étiquette" displaying tags with colored dots.
- Update `ProspectsTable`: display tag badges under the prospect name.

**Step 5: Run tests and verify**
Run: `npm test`
Expected: ALL PASS

**Step 6: Commit**
```bash
git add src/server/tags-actions.ts src/server/prospects-filter.ts src/server/prospects.ts src/components/tags/ src/components/prospects/ tests/tags-filter.test.ts src/app/\(dashboard\)/prospects/
git commit -m "feat(tags): custom colored tags and filtering on prospects"
```

---

### Task 4: Kanban Pipeline Board

**Files:**
- Create: `src/components/prospects/prospects-kanban.tsx`
- Create: `src/components/prospects/view-switcher.tsx`
- Modify: `src/app/(dashboard)/prospects/page.tsx` (support `?view=kanban` or `?view=table`)
- Test: `tests/kanban-grouping.test.ts`

**Step 1: Write unit test for Kanban column grouping logic**
In `tests/kanban-grouping.test.ts`: test helper function that groups a list of prospects into 5 status buckets and calculates total counts.

**Step 2: Run test to verify**
Run: `npx vitest run tests/kanban-grouping.test.ts`

**Step 3: Implement `src/components/prospects/prospects-kanban.tsx`**
- 5 Columns:
  1. À contacter (`a_contacter`) - Bleu
  2. Contacté (`contacte`) - Ambre
  3. Intéressé (`interesse`) - Violet
  4. Client (`client`) - Émeraude
  5. Refusé (`refuse`) - Gris
- Column header with status badge and count pill.
- Prospect Card displays:
  - Boutique name (linked to `/prospects/[id]`)
  - City & Category
  - Assigned staff badge
  - Phone and WhatsApp quick-action buttons
  - Tag badges
  - Fast Status Change dropdown with instant server action call (`changeProspectStatus`)
- Empty state per column when 0 prospects.

**Step 4: Integrate View Switcher into `src/app/(dashboard)/prospects/page.tsx`**
- View toggle button in header: [ 📋 Liste ] [ 📊 Kanban ]
- Preserves all filters (`search`, `city`, `assignedTo`, `tagId`) when switching views.

**Step 5: Run tests**
Run: `npx vitest run tests/kanban-grouping.test.ts`
Expected: PASS

**Step 6: Commit**
```bash
git add src/components/prospects/prospects-kanban.tsx src/components/prospects/view-switcher.tsx src/app/\(dashboard\)/prospects/page.tsx tests/kanban-grouping.test.ts
git commit -m "feat(kanban): 5-column pipeline visual board for prospects"
```

---

### Task 5: Bulk CSV Import with Duplicate Phone Prevention

**Files:**
- Create: `src/server/import-actions.ts`
- Create: `src/components/prospects/csv-importer.tsx`
- Create: `src/app/(dashboard)/prospects/import/page.tsx`
- Modify: `src/components/layout/sidebar.tsx` (add "📥 Import CSV" link)
- Modify: `src/app/(dashboard)/prospects/page.tsx` (add "Importer CSV" button next to "+ Ajouter")
- Test: `tests/import-validation.test.ts`

**Step 1: Write test for CSV parsing and import validation**
In `tests/import-validation.test.ts`:
- Test parsing CSV with comma or semicolon delimiter.
- Test mapping columns (name, phone required).
- Test phone normalization and duplicate exclusion.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/import-validation.test.ts`

**Step 3: Implement `src/server/import-actions.ts`**
- `checkDuplicatePhones(phones: string[])`: queries existing phones in database and returns set of duplicates.
- `importProspectsBatchAction(rows: Array<{ name: string; phone: string; city?: string; category?: string; whatsapp?: string; address?: string; source?: string; notes?: string }>)`:
  - Requires `is_editor_staff()`
  - Validates batch (max 500 rows)
  - Filters out duplicates
  - Inserts new prospects
  - Records batch import in `activity_log`
  - Revalidates `/prospects`
  - Returns `{ success: boolean, insertedCount: number, duplicateCount: number, duplicates: string[] }`

**Step 4: Create UI `src/components/prospects/csv-importer.tsx` and Page `/prospects/import`**
- Multi-step interactive wizard:
  1. Upload / Drag & Drop CSV
  2. Map CSV columns to Prospect fields (auto-detect headers like "Nom", "Telephone", "Ville", "Secteur", etc.)
  3. Preview table with duplicate phone detection badges
  4. One-click Batch Import with progress bar
  5. Completion summary screen with link to view imported prospects.

**Step 5: Run tests**
Run: `npx vitest run tests/import-validation.test.ts`
Expected: PASS

**Step 6: Commit**
```bash
git add src/server/import-actions.ts src/components/prospects/csv-importer.tsx src/app/\(dashboard\)/prospects/import/ src/components/layout/sidebar.tsx tests/import-validation.test.ts
git commit -m "feat(import): bulk CSV import with column mapping and duplicate prevention"
```

---

### Task 6: Unified Prospect Timeline

**Files:**
- Modify: `src/server/prospects.ts` (implement `getUnifiedTimeline`)
- Create: `src/components/prospects/unified-timeline.tsx`
- Modify: `src/app/(dashboard)/prospects/[id]/page.tsx` (replace isolated feeds with unified timeline tab)
- Test: `tests/unified-timeline.test.ts`

**Step 1: Write unit test for timeline event unification & sorting**
In `tests/unified-timeline.test.ts`: test merging and chronological sorting of activity logs, comments, and relances.

**Step 2: Run test to verify**
Run: `npx vitest run tests/unified-timeline.test.ts`

**Step 3: Implement `getUnifiedTimeline(prospectId: string)` in `src/server/prospects.ts`**
Fetches in parallel:
- `activity_log` (status changes, prospect edits, creations)
- `comments` (notes datées, objections, call logs)
- `relances` (reminders scheduled and marked done)
Merges them into unified events sorted by `created_at desc`.

**Step 4: Create `UnifiedTimeline` UI Component**
- Event-specific badges and icons:
  - 🔄 Statut modifié
  - 💬 Commentaire ajouté
  - ⏰ Relance programmée
  - ✅ Relance effectuée
  - ✏️ Fiche modifiée
- Author name and formatted date.
- Clean vertical line layout.

**Step 5: Run tests**
Run: `npm test`
Expected: ALL PASS

**Step 6: Commit**
```bash
git add src/server/prospects.ts src/components/prospects/unified-timeline.tsx src/app/\(dashboard\)/prospects/\[id\]/page.tsx tests/unified-timeline.test.ts
git commit -m "feat(timeline): unified chronological timeline on prospect profile"
```

---

### Task 7: Full Verification, Build & Deployment to Coolify VPS

**Files:**
- All touched files

**Step 1: Run comprehensive local test suite**
Run: `npm test`
Verify all tests pass (csv, staff-gate, roles, prospects-query, login-validation, staff-create, comments-validation, tags-filter, kanban-grouping, import-validation, unified-timeline).

**Step 2: Run TypeScript typecheck**
Run: `npm run typecheck`
Verify 0 errors.

**Step 3: Run Next.js production build**
Run: `npm run build`
Verify standalone bundle builds cleanly.

**Step 4: Git Push to GitHub**
```bash
git push origin main
```

**Step 5: Monitor Coolify Auto-Deployment on VPS**
Check Coolify deployment on Hetzner VPS and verify live site at `http://v8es5ridujzumltffmnljmch.178.104.176.113.sslip.io`.
