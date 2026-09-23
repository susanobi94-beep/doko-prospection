-- supabase/migrations/0002_production_upgrade.sql

-- 1. Ajout des rôles dans la table staff
alter table staff add column if not exists role text not null default 'commercial'
  check (role in ('admin', 'commercial', 'lecture'));

-- Index pour recherche rapide par rôle
create index if not exists staff_role_idx on staff (role) where active = true;

-- 2. Attribution d'un prospect à un collaborateur
alter table prospects add column if not exists assigned_to uuid references staff(id);
create index if not exists prospects_assigned_idx on prospects (assigned_to) where deleted_at is null;

-- 3. Contrainte d'unicité sur le numéro de téléphone pour éviter les doublons
create unique index if not exists prospects_phone_unique on prospects (phone) where deleted_at is null;

-- 4. Fonctions de contrôle de rôle (SECURITY DEFINER)
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from staff where id = auth.uid() and active = true and role = 'admin'
  );
$$ language sql security definer stable;

create or replace function is_editor_staff() returns boolean as $$
  select exists (
    select 1 from staff where id = auth.uid() and active = true and role in ('admin', 'commercial')
  );
$$ language sql security definer stable;

-- 5. Mise à jour des politiques RLS
-- Staff : lecture pour tout staff actif, écriture réservée aux admins
drop policy if exists staff_insert on staff;
create policy staff_insert on staff for insert
  with check (is_admin());

drop policy if exists staff_update on staff;
create policy staff_update on staff for update
  using (is_admin()) with check (is_admin());

-- Prospects : modification réservée aux commerciaux et admins (pas les comptes en lecture seule)
drop policy if exists prospects_insert on prospects;
create policy prospects_insert on prospects for insert
  with check (is_editor_staff());

drop policy if exists prospects_update on prospects;
create policy prospects_update on prospects for update
  using (is_editor_staff()) with check (is_editor_staff());

-- Relances : modification réservée aux commerciaux et admins
drop policy if exists relances_insert on relances;
create policy relances_insert on relances for insert
  with check (is_editor_staff());

drop policy if exists relances_update on relances;
create policy relances_update on relances for update
  using (is_editor_staff()) with check (is_editor_staff());

-- 6. RPC : Modification complète d'un prospect avec traçabilité dans activity_log
create or replace function update_prospect_with_log(
  p_id uuid,
  p_name text,
  p_city text,
  p_category text,
  p_phone text,
  p_whatsapp text default null,
  p_address text default null,
  p_source text default null,
  p_notes text default null,
  p_assigned_to uuid default null
) returns void as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if not is_editor_staff() then
    raise exception 'forbidden';
  end if;

  select to_jsonb(prospects.*) into v_before
  from prospects
  where id = p_id and deleted_at is null;

  if v_before is null then
    raise exception 'prospect not found';
  end if;

  update prospects set
    name = p_name,
    city = p_city,
    category = p_category,
    phone = p_phone,
    whatsapp = p_whatsapp,
    address = p_address,
    source = p_source,
    notes = p_notes,
    assigned_to = p_assigned_to,
    updated_at = now()
  where id = p_id;

  select to_jsonb(prospects.*) into v_after
  from prospects
  where id = p_id;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (p_id, auth.uid(), 'updated', v_before, v_after);
end;
$$ language plpgsql security invoker;

-- 7. RPC : Création d'un prospect avec attribution et log
create or replace function create_prospect_with_log(
  p_name text,
  p_city text,
  p_category text,
  p_phone text,
  p_whatsapp text default null,
  p_address text default null,
  p_source text default null,
  p_notes text default null,
  p_assigned_to uuid default null
) returns uuid as $$
declare
  v_id uuid;
  v_after jsonb;
begin
  if not is_editor_staff() then
    raise exception 'forbidden';
  end if;

  insert into prospects (name, city, category, phone, whatsapp, address, source, notes, assigned_to, created_by)
  values (p_name, p_city, p_category, p_phone, p_whatsapp, p_address, p_source, p_notes, p_assigned_to, auth.uid())
  returning id into v_id;

  select to_jsonb(prospects.*) into v_after from prospects where id = v_id;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (v_id, auth.uid(), 'created', null, v_after);

  return v_id;
end;
$$ language plpgsql security invoker;

-- 8. RPC : Administration des comptes Staff (Activer / Désactiver / Changer de rôle)
create or replace function toggle_staff_active(
  p_staff_id uuid,
  p_active boolean
) returns void as $$
begin
  if not is_admin() then
    raise exception 'forbidden: only admin can manage staff status';
  end if;

  -- Empêcher un admin de se désactiver lui-même
  if p_staff_id = auth.uid() and p_active = false then
    raise exception 'cannot deactivate your own account';
  end if;

  update staff set active = p_active where id = p_staff_id;
end;
$$ language plpgsql security invoker;

create or replace function update_staff_role(
  p_staff_id uuid,
  p_role text
) returns void as $$
begin
  if not is_admin() then
    raise exception 'forbidden: only admin can manage staff roles';
  end if;

  if p_role not in ('admin', 'commercial', 'lecture') then
    raise exception 'invalid role';
  end if;

  update staff set role = p_role where id = p_staff_id;
end;
$$ language plpgsql security invoker;
