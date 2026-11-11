-- Mis calorías · esquema (ejecutar una vez en SQL Editor)
create table if not exists public.calorias_docs (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  key        text        not null,
  doc        jsonb       not null,
  u          bigint      not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint calorias_docs_key_chk check (key ~ '^(core|m-[0-9]{4}-[0-9]{2})$'),
  constraint calorias_docs_size_chk check (pg_column_size(doc) < 1048576)
);
comment on table public.calorias_docs is 'core = perfil, pesos, favoritos y memoria de la IA; m-AAAA-MM = comidas y entrenos del mes';

create or replace function public.calorias_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists calorias_touch on public.calorias_docs;
create trigger calorias_touch before update on public.calorias_docs
  for each row execute function public.calorias_touch();

alter table public.calorias_docs enable row level security;
revoke all on public.calorias_docs from anon, public;
grant select, insert, update, delete on public.calorias_docs to authenticated;
drop policy if exists "mis datos" on public.calorias_docs;
drop policy if exists calorias_select on public.calorias_docs;
drop policy if exists calorias_insert on public.calorias_docs;
drop policy if exists calorias_update on public.calorias_docs;
drop policy if exists calorias_delete on public.calorias_docs;
create policy calorias_select on public.calorias_docs for select to authenticated using ((select auth.uid()) = user_id);
create policy calorias_insert on public.calorias_docs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy calorias_update on public.calorias_docs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy calorias_delete on public.calorias_docs for delete to authenticated using ((select auth.uid()) = user_id);
