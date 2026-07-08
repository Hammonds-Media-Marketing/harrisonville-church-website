-- Blog schema for Harrisonville Church of Christ.
-- Mirrors the TypeScript content model in content/types.ts so the frontend
-- consumes DB rows through the same shape it used for local seed content.

-- Auto-update updated_at on any row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Categories: a small, church-manageable list that drives the blog filter UI.
-- ---------------------------------------------------------------------------
create table public.blog_categories (
  name       text primary key,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Authors: E-E-A-T authorship identity for each article.
-- ---------------------------------------------------------------------------
create table public.authors (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  role       text not null,
  bio        text not null,
  long_bio   text not null,
  photo      text not null,
  photo_alt  text not null,
  linkedin   text,
  sample     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger authors_set_updated_at
  before update on public.authors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Posts: the blog articles. body is a JSONB array of structured blocks
-- (h2 | h3 | p | scripture | list) matching BlogPost['body'].
-- ---------------------------------------------------------------------------
create table public.blog_posts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  title              text not null,
  excerpt            text not null,
  meta_description   text not null,
  og_title           text not null,
  og_description     text not null,
  category           text not null references public.blog_categories(name) on update cascade,
  tags               text[] not null default '{}',
  author_slug        text not null references public.authors(slug) on update cascade,
  date_published     date not null,
  date_modified      date,
  feature_image      text not null,
  feature_image_alt  text not null,
  read_minutes       integer not null default 5,
  views              integer not null default 0,
  body               jsonb not null default '[]'::jsonb,
  related_slugs      text[] not null default '{}',
  published          boolean not null default true,
  sample             boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index blog_posts_published_date_idx
  on public.blog_posts (published, date_published desc);
create index blog_posts_category_idx on public.blog_posts (category);
create index blog_posts_author_idx on public.blog_posts (author_slug);

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Comments: moderated, visitor-submitted. Insert is public but always lands
-- unapproved; only approved comments are exposed, and email is never read back.
-- ---------------------------------------------------------------------------
create table public.blog_comments (
  id           uuid primary key default gen_random_uuid(),
  post_slug    text not null references public.blog_posts(slug) on delete cascade on update cascade,
  author_name  text not null check (char_length(trim(author_name)) between 1 and 120),
  author_email text not null check (char_length(author_email) between 3 and 254),
  body         text not null check (char_length(trim(body)) between 1 and 4000),
  approved     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index blog_comments_post_approved_idx
  on public.blog_comments (post_slug, approved, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.blog_categories enable row level security;
alter table public.authors        enable row level security;
alter table public.blog_posts      enable row level security;
alter table public.blog_comments   enable row level security;

-- Categories + authors are fully public to read.
create policy "Public read categories"
  on public.blog_categories for select
  to anon, authenticated
  using (true);

create policy "Public read authors"
  on public.authors for select
  to anon, authenticated
  using (true);

-- Only published posts are publicly readable.
create policy "Public read published posts"
  on public.blog_posts for select
  to anon, authenticated
  using (published = true);

-- Anyone may submit a comment, but it must arrive unapproved
-- (no self-approval). Reading the base table is denied to anon so
-- submitter emails are never exposed; approved comments are read via
-- the security-definer function below.
create policy "Public submit comment"
  on public.blog_comments for insert
  to anon, authenticated
  with check (approved = false);

-- Safe, email-free read path for approved comments.
create or replace function public.approved_comments(p_slug text)
returns table (
  id          uuid,
  author_name text,
  body        text,
  created_at  timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.author_name, c.body, c.created_at
  from public.blog_comments c
  where c.post_slug = p_slug
    and c.approved = true
  order by c.created_at asc;
$$;

grant execute on function public.approved_comments(text) to anon, authenticated;
