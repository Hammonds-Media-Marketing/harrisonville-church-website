-- Editable copy for the hand-built pages.
--
-- The pages table backs pages an editor composes from sections. The site's
-- core pages are different: they are designed in code with bespoke components
-- (the lighthouse hero, the parking aerial, the service-order tabs), so their
-- structure cannot be expressed as a section list. This table holds only the
-- words and images on those pages, keyed by the field keys declared in
-- content/site-copy/*.ts, so an editor can rewrite any of them in the visual
-- editor without touching the layout.
--
-- One row per page path. `values` maps a field key to its override; a key that
-- is absent falls back to the default written in the code, and a key the code
-- no longer declares is ignored on read. That makes the override layer safe
-- across deploys: copy edits survive, and a removed field degrades to nothing.

create table public.page_content (
  -- Site path with its leading slash: '/', '/about', '/about/what-to-expect'.
  path       text primary key,
  values     jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create trigger page_content_set_updated_at
  before update on public.page_content
  for each row execute function public.set_updated_at();

alter table public.page_content enable row level security;

-- Overrides are the public copy of a public website, so anyone may read them;
-- the anon key is what renders the site.
create policy "Public read page content"
  on public.page_content for select
  to anon, authenticated
  using (true);

create policy "Editors insert page content"
  on public.page_content for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update page content"
  on public.page_content for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete page content"
  on public.page_content for delete
  to authenticated
  using (public.is_editor());
