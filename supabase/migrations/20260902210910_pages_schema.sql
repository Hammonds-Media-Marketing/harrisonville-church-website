-- Editor-built pages.
--
-- Backs the Pages area of the site admin: editors compose a page from typed
-- content sections (rich text, image and text, card grid, FAQ, call to
-- action) in a drag-and-drop builder, and the site renders those sections
-- through the same primitives every hand-built page uses. The section list is
-- stored as JSONB and validated by lib/page-sections.ts on both save and read,
-- so an unexpected shape degrades to a skipped section, never a broken page.
--
-- Pages start unpublished: a new page stays invisible to visitors until an
-- editor deliberately publishes it. RLS mirrors the other public content
-- tables — anyone can read published rows; editors manage everything.

create table public.pages (
  id               uuid primary key default gen_random_uuid(),
  -- Path under the site root, without a leading slash. Nested paths are
  -- allowed ("ministries/youth"); reserved first segments (about, events,
  -- blog, members, …) are refused by the save action.
  slug             text unique not null,
  title            text not null,
  hero_eyebrow     text not null default '',
  hero_lead        text,
  meta_title       text not null default '',
  meta_description text not null default '',
  og_title         text not null default '',
  og_description   text not null default '',
  og_image         text,
  og_image_alt     text,
  sections         jsonb not null default '[]',
  published        boolean not null default false,
  sample           boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index pages_published_slug_idx on public.pages (published, slug);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

alter table public.pages enable row level security;

create policy "Public read published pages"
  on public.pages for select
  to anon, authenticated
  using (published = true);

create policy "Editors read all pages"
  on public.pages for select
  to authenticated
  using (public.is_editor());

create policy "Editors manage pages"
  on public.pages for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update pages"
  on public.pages for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete pages"
  on public.pages for delete
  to authenticated
  using (public.is_editor());
