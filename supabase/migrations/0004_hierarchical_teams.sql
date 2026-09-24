-- supabase/migrations/0004_hierarchical_teams.sql
-- Structure hiérarchique des équipes & sous-équipes (Cameroun & Afrique)

-- 1. Table des équipes et sous-équipes
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references teams(id) on delete cascade,
  city text,
  country text not null default 'Cameroun',
  leader_id uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists teams_parent_idx on teams (parent_id);
create index if not exists teams_leader_idx on teams (leader_id);
create index if not exists teams_city_idx on teams (city);
create index if not exists teams_country_idx on teams (country);

alter table teams enable row level security;

drop policy if exists teams_select on teams;
create policy teams_select on teams for select
  using (is_active_staff());

drop policy if exists teams_insert on teams;
create policy teams_insert on teams for insert
  with check (is_admin());

drop policy if exists teams_update on teams;
create policy teams_update on teams for update
  using (is_admin()) with check (is_admin());

drop policy if exists teams_delete on teams;
create policy teams_delete on teams for delete
  using (is_admin());

-- 2. Rattachement du collaborateur (staff) à une équipe ou sous-équipe
alter table staff add column if not exists team_id uuid references teams(id) on delete set null;
create index if not exists staff_team_idx on staff (team_id);

-- 3. Rattachement direct d'un prospect à une équipe ou sous-équipe (optionnel, pour ciblage direct)
alter table prospects add column if not exists team_id uuid references teams(id) on delete set null;
create index if not exists prospects_team_idx on prospects (team_id) where deleted_at is null;

-- 4. Initialisation des équipes et sous-équipes de référence (Cameroun & Afrique)
do $$
declare
  v_douala_id uuid;
  v_yaounde_id uuid;
  v_bafoussam_id uuid;
  v_abidjan_id uuid;
begin
  -- Zone Douala (Parent)
  select id into v_douala_id from teams where name = 'Douala (Zone Littoral)';
  if v_douala_id is null then
    insert into teams (name, city, country)
    values ('Douala (Zone Littoral)', 'Douala', 'Cameroun')
    returning id into v_douala_id;
  end if;

  -- Sous-équipes de Douala
  insert into teams (name, parent_id, city, country)
  select name, v_douala_id, 'Douala', 'Cameroun'
  from (values
    ('Douala - Akwa'),
    ('Douala - Bonabéri'),
    ('Douala - Marché Central'),
    ('Douala - Makepe / Bonamoussadi')
  ) as t(name)
  where not exists (select 1 from teams where teams.name = t.name);

  -- Zone Yaoundé (Parent)
  select id into v_yaounde_id from teams where name = 'Yaoundé (Zone Centre)';
  if v_yaounde_id is null then
    insert into teams (name, city, country)
    values ('Yaoundé (Zone Centre)', 'Yaoundé', 'Cameroun')
    returning id into v_yaounde_id;
  end if;

  -- Sous-équipes de Yaoundé
  insert into teams (name, parent_id, city, country)
  select name, v_yaounde_id, 'Yaoundé', 'Cameroun'
  from (values
    ('Yaoundé - Mokolo'),
    ('Yaoundé - Centre-Ville / Bastos')
  ) as t(name)
  where not exists (select 1 from teams where teams.name = t.name);

  -- Zone Bafoussam (Ouest)
  if not exists (select 1 from teams where name = 'Bafoussam (Zone Ouest)') then
    insert into teams (name, city, country)
    values ('Bafoussam (Zone Ouest)', 'Bafoussam', 'Cameroun');
  end if;

  -- Zone Abidjan (Côte d'Ivoire)
  if not exists (select 1 from teams where name = 'Abidjan (Côte d''Ivoire)') then
    insert into teams (name, city, country)
    values ('Abidjan (Côte d''Ivoire)', 'Abidjan', 'Côte d''Ivoire');
  end if;
end $$;
