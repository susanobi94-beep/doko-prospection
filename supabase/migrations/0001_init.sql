-- supabase/migrations/0001_init.sql

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
