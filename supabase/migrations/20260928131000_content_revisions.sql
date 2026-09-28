-- Version history for website pages.
--
-- Every time an editor saves over a page, the version being replaced is kept,
-- so a change that "blows up" can be undone from the admin without a call to
-- the developer. Two kinds of page are covered:
--
--   page         — a page built in the page builder (public.pages), keyed by id
--   page_content — the wording and added elements of a hand-built page
--                  (public.page_content), keyed by path
--
-- Triggers copy the OLD row into content_revisions on every update and
-- delete, so nothing in the app has to remember to do it, and a "Reset all"
-- in the visual editor (which deletes the row) is recoverable too. Restoring
-- a version is itself a save, so it is captured as well and can be undone.
--
-- The 30 most recent versions of each page are kept; older ones are pruned
-- by the same trigger. Editors and admins can read the history; nobody
-- writes to it directly (the trigger function is security definer).

create table if not exists public.content_revisions (
  id          bigint generated always as identity primary key,
  entity      text not null check (entity in ('page', 'page_content')),
  entity_key  text not null,
  -- The row exactly as it was before the change.
  snapshot    jsonb not null,
  -- Who made the change that replaced this version (null for scripts).
  replaced_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists content_revisions_lookup_idx
  on public.content_revisions (entity, entity_key, created_at desc);

alter table public.content_revisions enable row level security;

create policy "Editors read content revisions"
  on public.content_revisions for select
  to authenticated
  using (public.is_editor());

create or replace function public.capture_content_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text := case tg_table_name when 'pages' then 'page' else 'page_content' end;
  -- Read through jsonb: the two tables have different key columns, and a
  -- direct old.id would not compile against page_content.
  key  text := case tg_table_name when 'pages' then to_jsonb(old) ->> 'id' else to_jsonb(old) ->> 'path' end;
begin
  -- A save that changes nothing is not a new version.
  if tg_op = 'UPDATE' and to_jsonb(old) - 'updated_at' = to_jsonb(new) - 'updated_at' then
    return new;
  end if;

  insert into public.content_revisions (entity, entity_key, snapshot, replaced_by)
  values (kind, key, to_jsonb(old), auth.uid());

  delete from public.content_revisions r
  where r.entity = kind
    and r.entity_key = key
    and r.id not in (
      select id from public.content_revisions
      where entity = kind and entity_key = key
      order by created_at desc, id desc
      limit 30
    );

  return coalesce(new, old);
end;
$$;

revoke execute on function public.capture_content_revision() from public, anon, authenticated;

create trigger pages_capture_revision
  after update or delete on public.pages
  for each row execute function public.capture_content_revision();

create trigger page_content_capture_revision
  after update or delete on public.page_content
  for each row execute function public.capture_content_revision();
