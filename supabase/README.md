# Supabase — CMS + Members Backend

Supabase powers two things:

1. **The CMS** — blog posts, authors, categories, events, and sermons. Public pages read published rows through the anon/publishable key;
   editors manage everything from the on-site admin at `/members/admin`.
2. **The members backend** — Supabase Auth accounts, member profiles with
   roles and approval, members-only announcements, and a privacy-aware member
   directory at `/members`.

There is **no service-role key anywhere in the app**. Every query — public,
member, or admin — runs through the anon key or the signed-in user's session,
so Row Level Security is the entire authorization model and the policies below
are load-bearing.

## Tables

| Table | Purpose |
|---|---|
| `blog_categories` | Category names + `sort_order`; drives the `/blog` filter chips. |
| `authors` | Article authorship (E-E-A-T): name, role, bio, long bio, photo, LinkedIn. |
| `blog_posts` | Articles. `body` is a JSONB array of blocks (`h2`/`h3`/`p`/`scripture`/`list`) matching `BlogPost['body']`. `published` gates visibility. |
| `events` | Public calendar (`/events`). `published` gates visibility; times are timestamptz. |
| `sermons` | Sermon/video library (`/resources/sermons` + homepage). `published` gates visibility. |
| `announcements` | Members-only news for the `/members` dashboard. Never publicly readable. |
| `member_profiles` | One row per auth user: contact details, directory privacy toggles, `role`, and `approved`. |

Column names are snake_case in the DB and mapped to the app's camelCase types
in `lib/blog.ts`, `lib/events.ts`, `lib/sermons.ts`, and `lib/members.ts`.

## Roles and the members flow

`member_profiles.role` is a `member_role` enum:

- **member** — approved members read announcements and the directory.
- **editor** — member, plus full content management (events, sermons,
  articles, authors, categories, announcements).
- **admin** — editor, plus member management (approval, roles, removal).

Signup flow: a visitor requests access at `/members/login` → Supabase Auth
creates the account and the `on_auth_user_created` trigger inserts an
**unapproved** profile → an admin approves it at `/members/admin/members`.
Unapproved accounts see nothing but their own pending notice.

Members edit their own profile; the `member_profiles_guard` trigger blocks
anyone but an admin from changing `role` or `approved` — including on their
own row. The self-service insert policy pins new rows to
`role = 'member', approved = false`, so nobody self-promotes.

### Bootstrapping the first admin

After the church's project is provisioned and the first person signs up, run
once in the SQL editor (service role):

```sql
update public.member_profiles
set role = 'admin', approved = true
where email = 'the-first-admin@example.com';
```

Every later approval happens in the on-site admin.

## Row Level Security

- **Categories / authors** — public read; editor write.
- **Posts / events / sermons** — public read of `published = true` only;
  editors read and write everything (drafts included).
- **Announcements** — readable only by approved members; editor write. No
  anon path exists at all.
- **Member profiles** — own-row read/update; admins read/update/delete all.
  The directory is read through `directory_profiles()`, which returns only
  approved, listed members and nulls out any field the member chose to hide
  (`show_email` / `show_phone` / `show_address`).

Helper functions `is_approved_member()`, `is_editor()`, and `is_admin()` are
`security definer` so policies can consult `member_profiles` without policy
recursion; none are executable by `anon`.

## Environment

Set in `.env.local` for local dev and in Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # or the legacy anon key
```

If these are unset (or a read fails), public pages fall back to the seed
content in `content/`, and the members area shows its setup notice — the site
never breaks.

In the Supabase dashboard, add the site's `/members/auth/confirm` URL to
**Auth → URL Configuration → Redirect URLs** (for local dev,
`http://localhost:3000/members/auth/confirm` as well) so confirmation and
recovery emails land on the right page.

## Migrations

The SQL under `supabase/migrations/` is the source of truth and matches what
is applied to the project. Apply with the Supabase CLI:

```
supabase link --project-ref <project-ref>
supabase db push
```

Regenerate types after a schema change:

```
supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
```

## Publishing / revalidation

Saves in the on-site admin call `revalidatePath` for the affected public pages
and ping IndexNow directly — that is the primary publish flow. The
`/api/revalidate` webhook (shared `REVALIDATE_SECRET`) remains for external
publish hooks, e.g. a Supabase Database Webhook on content tables, and does the
same revalidate + IndexNow work.
