-- supabase/migrations/0006_staff_phone.sql
-- Ajout du numéro de téléphone pour les commerciaux et collaborateurs

SET search_path TO public, auth;

alter table public.staff add column if not exists phone text;
