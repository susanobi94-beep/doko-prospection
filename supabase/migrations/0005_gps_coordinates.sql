-- supabase/migrations/0005_gps_coordinates.sql
-- Ajout des coordonnées GPS (latitude & longitude) pour la géolocalisation des boutiques terrain

-- 1. Colonnes latitude et longitude
alter table prospects add column if not exists latitude double precision;
alter table prospects add column if not exists longitude double precision;

create index if not exists prospects_coordinates_idx on prospects (latitude, longitude) where deleted_at is null;

-- 2. Mise à jour de la RPC create_prospect_with_log avec latitude et longitude
create or replace function create_prospect_with_log(
  p_name text,
  p_city text,
  p_category text,
  p_phone text,
  p_whatsapp text default null,
  p_address text default null,
  p_source text default null,
  p_notes text default null,
  p_assigned_to uuid default null,
  p_latitude double precision default null,
  p_longitude double precision default null
) returns uuid as $$
declare
  v_id uuid;
  v_after jsonb;
begin
  if not is_editor_staff() then
    raise exception 'forbidden';
  end if;

  insert into prospects (
    name, city, category, phone, whatsapp, address, source, notes, assigned_to, latitude, longitude, created_by
  )
  values (
    p_name, p_city, p_category, p_phone, p_whatsapp, p_address, p_source, p_notes, p_assigned_to, p_latitude, p_longitude, auth.uid()
  )
  returning id into v_id;

  select to_jsonb(prospects.*) into v_after from prospects where id = v_id;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (v_id, auth.uid(), 'created', null, v_after);

  return v_id;
end;
$$ language plpgsql security invoker;

-- 3. Mise à jour de la RPC update_prospect_with_log avec latitude et longitude
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
  p_assigned_to uuid default null,
  p_latitude double precision default null,
  p_longitude double precision default null
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
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = now()
  where id = p_id;

  select to_jsonb(prospects.*) into v_after
  from prospects
  where id = p_id;

  insert into activity_log (prospect_id, actor_id, action, before, after)
  values (p_id, auth.uid(), 'updated', v_before, v_after);
end;
$$ language plpgsql security invoker;
