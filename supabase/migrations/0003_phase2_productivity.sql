-- supabase/migrations/0003_phase2_productivity.sql
-- Phase 2 : Commentaires / Notes datées, Tags & Prospect Tags

-- 1. Table des commentaires (notes datées de suivi sur chaque prospect)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  author_id uuid references staff(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_prospect_idx on comments (prospect_id, created_at desc);
create index if not exists comments_author_idx on comments (author_id);

alter table comments enable row level security;

drop policy if exists comments_select on comments;
create policy comments_select on comments for select
  using (is_active_staff());

drop policy if exists comments_insert on comments;
create policy comments_insert on comments for insert
  with check (is_editor_staff());

drop policy if exists comments_delete on comments;
create policy comments_delete on comments for delete
  using (is_admin() or author_id = auth.uid());

-- 2. Table des tags / étiquettes personnalisables
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  color text not null default '#6B7280',
  created_at timestamptz not null default now()
);

alter table tags enable row level security;

drop policy if exists tags_select on tags;
create policy tags_select on tags for select
  using (is_active_staff());

drop policy if exists tags_insert on tags;
create policy tags_insert on tags for insert
  with check (is_editor_staff());

drop policy if exists tags_update on tags;
create policy tags_update on tags for update
  using (is_admin()) with check (is_admin());

drop policy if exists tags_delete on tags;
create policy tags_delete on tags for delete
  using (is_admin());

-- 3. Table de jointure prospects <-> tags
create table if not exists prospect_tags (
  prospect_id uuid not null references prospects(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prospect_id, tag_id)
);

create index if not exists prospect_tags_prospect_idx on prospect_tags (prospect_id);
create index if not exists prospect_tags_tag_idx on prospect_tags (tag_id);

alter table prospect_tags enable row level security;

drop policy if exists prospect_tags_select on prospect_tags;
create policy prospect_tags_select on prospect_tags for select
  using (is_active_staff());

drop policy if exists prospect_tags_insert on prospect_tags;
create policy prospect_tags_insert on prospect_tags for insert
  with check (is_editor_staff());

drop policy if exists prospect_tags_delete on prospect_tags;
create policy prospect_tags_delete on prospect_tags for delete
  using (is_editor_staff());

-- 4. Insertion des étiquettes par défaut pour la prospection commerciale
insert into tags (label, color) values
  ('Prioritaire', '#EF4444'),
  ('Marché Akwa', '#3B82F6'),
  ('Marché Central', '#10B981'),
  ('Boutique physique', '#8B5CF6'),
  ('Grossiste', '#F59E0B'),
  ('Diaspora', '#06B6D4')
on conflict (label) do nothing;
