-- CMS + members schema for Harrisonville Church of Christ.
--
-- Adds the content tables the church manages through the on-site admin
-- (events, sermons, announcements) and the members backend (profiles with
-- roles, approval, and a privacy-aware directory). Public pages keep reading
-- through the anon/publishable key; everything the members area and the admin
-- can do is enforced here with Row Level Security — the app never ships a
-- service-role key to the browser.
--
-- Roles:
--   member  — approved members read announcements + the directory.
--   editor  — member, plus manages content (events, sermons, articles,
--             announcements, comment moderation).
--   admin   — editor, plus manages members (approval, roles, removal).

-- ---------------------------------------------------------------------------
-- Member profiles: one row per auth user, created by trigger at signup.
-- Approval is a manual admin step, so a stranger signing up sees nothing.
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('member', 'editor', 'admin');

create table public.member_profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null default '',
  email             text not null,
  phone             text,
  address           text,
  photo             text,
  about             text,
  role              public.member_role not null default 'member',
  approved          boolean not null default false,
  show_in_directory boolean not null default true,
  show_email        boolean not null default true,
  show_phone        boolean not null default true,
  show_address      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index member_profiles_directory_idx
  on public.member_profiles (approved, show_in_directory, full_name);

create trigger member_profiles_set_updated_at
  before update on public.member_profiles
  for each row execute function public.set_updated_at();

-- Create a profile row automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.member_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so RLS policies can consult member_profiles
-- without recursing into its own policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_approved_member()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.member_profiles p
    where p.id = auth.uid() and p.approved
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.member_profiles p
    where p.id = auth.uid() and p.approved and p.role in ('editor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.member_profiles p
    where p.id = auth.uid() and p.approved and p.role = 'admin'
  );
$$;

revoke execute on function public.is_approved_member() from anon;
revoke execute on function public.is_editor() from anon;
revoke execute on function public.is_admin() from anon;

-- Members may edit their own profile, but never their own role or approval;
-- only admins flip those. Enforced here so the RLS update policy can stay
-- simple.
create or replace function public.member_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.approved is distinct from old.approved)
     and not public.is_admin() then
    raise exception 'Only an admin may change role or approval';
  end if;
  return new;
end;
$$;

create trigger member_profiles_guard
  before update on public.member_profiles
  for each row execute function public.member_profiles_guard();

alter table public.member_profiles enable row level security;

-- Read: your own profile always; admins read everyone (for the manage screen).
-- The directory is read through directory_profiles() below, which applies each
-- member's privacy toggles at the API layer.
create policy "Read own profile"
  on public.member_profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Admins read all profiles"
  on public.member_profiles for select
  to authenticated
  using (public.is_admin());

-- Insert: fallback self-provisioning if the signup trigger predates a user.
-- The check pins the row to the caller as an unapproved plain member.
create policy "Create own profile"
  on public.member_profiles for insert
  to authenticated
  with check (id = auth.uid() and role = 'member' and approved = false);

create policy "Update own profile"
  on public.member_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins update any profile"
  on public.member_profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete profiles"
  on public.member_profiles for delete
  to authenticated
  using (public.is_admin());

-- Directory read path: approved, listed members only, with each member's
-- privacy toggles applied (a hidden email/phone/address comes back null).
-- Callers who are not approved members get zero rows.
create or replace function public.directory_profiles()
returns table (
  id        uuid,
  full_name text,
  email     text,
  phone     text,
  address   text,
  photo     text,
  about     text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.id,
    p.full_name,
    case when p.show_email   then p.email   end,
    case when p.show_phone   then p.phone   end,
    case when p.show_address then p.address end,
    p.photo,
    p.about
  from public.member_profiles p
  where public.is_approved_member()
    and p.approved
    and p.show_in_directory
  order by p.full_name asc;
$$;

revoke execute on function public.directory_profiles() from anon;

-- ---------------------------------------------------------------------------
-- Events: mirrors ChurchEvent in content/types.ts. Public pages read
-- published rows; editors manage everything through the admin.
-- ---------------------------------------------------------------------------
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  summary       text not null,
  description   text not null,
  start_date    timestamptz not null,
  end_date      timestamptz,
  location_name text,
  category      text not null check (category in ('Worship', 'Bible Study', 'Fellowship', 'Outreach', 'Youth')),
  recurring     text,
  published     boolean not null default true,
  sample        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index events_published_start_idx on public.events (published, start_date);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "Public read published events"
  on public.events for select
  to anon, authenticated
  using (published = true);

create policy "Editors read all events"
  on public.events for select
  to authenticated
  using (public.is_editor());

create policy "Editors manage events"
  on public.events for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update events"
  on public.events for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete events"
  on public.events for delete
  to authenticated
  using (public.is_editor());

-- ---------------------------------------------------------------------------
-- Sermons: mirrors Sermon in content/types.ts.
-- ---------------------------------------------------------------------------
create table public.sermons (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  speaker          text not null,
  date             date not null,
  scripture        text not null,
  series           text,
  summary          text not null,
  video_url        text not null default '',
  duration_minutes integer not null default 30,
  thumbnail        text not null,
  thumbnail_alt    text not null,
  published        boolean not null default true,
  sample           boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index sermons_published_date_idx on public.sermons (published, date desc);

create trigger sermons_set_updated_at
  before update on public.sermons
  for each row execute function public.set_updated_at();

alter table public.sermons enable row level security;

create policy "Public read published sermons"
  on public.sermons for select
  to anon, authenticated
  using (published = true);

create policy "Editors read all sermons"
  on public.sermons for select
  to authenticated
  using (public.is_editor());

create policy "Editors manage sermons"
  on public.sermons for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update sermons"
  on public.sermons for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete sermons"
  on public.sermons for delete
  to authenticated
  using (public.is_editor());

-- ---------------------------------------------------------------------------
-- Announcements: members-only news. Never publicly readable.
-- ---------------------------------------------------------------------------
create table public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  category     text,
  pinned       boolean not null default false,
  publish_date date not null default current_date,
  expires_on   date,
  published    boolean not null default true,
  created_by   uuid references public.member_profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index announcements_feed_idx
  on public.announcements (published, pinned desc, publish_date desc);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

create policy "Members read published announcements"
  on public.announcements for select
  to authenticated
  using (published = true and public.is_approved_member());

create policy "Editors read all announcements"
  on public.announcements for select
  to authenticated
  using (public.is_editor());

create policy "Editors manage announcements"
  on public.announcements for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update announcements"
  on public.announcements for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.is_editor());

-- ---------------------------------------------------------------------------
-- Blog admin: let editors manage articles, authors, and categories through
-- the same admin (public read policies from the blog migration stay as-is).
-- ---------------------------------------------------------------------------
create policy "Editors read all posts"
  on public.blog_posts for select
  to authenticated
  using (public.is_editor());

create policy "Editors manage posts"
  on public.blog_posts for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update posts"
  on public.blog_posts for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete posts"
  on public.blog_posts for delete
  to authenticated
  using (public.is_editor());

create policy "Editors manage authors"
  on public.authors for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update authors"
  on public.authors for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete authors"
  on public.authors for delete
  to authenticated
  using (public.is_editor());

create policy "Editors manage categories"
  on public.blog_categories for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update categories"
  on public.blog_categories for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete categories"
  on public.blog_categories for delete
  to authenticated
  using (public.is_editor());

-- ---------------------------------------------------------------------------
-- Comment moderation. The public column grant on blog_comments hides
-- author_email, so editors list comments through this definer function
-- (which includes the email for spam triage) and act through the policies.
-- ---------------------------------------------------------------------------
create or replace function public.moderation_comments()
returns table (
  id           uuid,
  post_slug    text,
  author_name  text,
  author_email text,
  body         text,
  approved     boolean,
  created_at   timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select c.id, c.post_slug, c.author_name, c.author_email, c.body, c.approved, c.created_at
  from public.blog_comments c
  where public.is_editor()
  order by c.approved asc, c.created_at desc;
$$;

revoke execute on function public.moderation_comments() from anon;

-- The public key's grant on blog_comments only covers safe display columns;
-- editors flip `approved`, so grant that column (RLS below limits it to them).
grant update (approved) on public.blog_comments to authenticated;
grant delete on public.blog_comments to authenticated;

create policy "Editors moderate comments"
  on public.blog_comments for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete comments"
  on public.blog_comments for delete
  to authenticated
  using (public.is_editor());
