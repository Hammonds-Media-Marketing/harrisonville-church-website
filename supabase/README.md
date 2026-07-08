# Supabase — Blog Database

The blog (posts, authors, categories, and moderated comments) is powered by
Supabase. Pages read through the public/publishable key; Row Level Security is
the only thing standing between that key and the data, so the policies below are
load-bearing.

## Tables

| Table | Purpose |
|---|---|
| `blog_categories` | Category names + `sort_order`; drives the `/blog` filter chips. |
| `authors` | Article authorship (E-E-A-T): name, role, bio, long bio, photo, LinkedIn. |
| `blog_posts` | Articles. `body` is a JSONB array of blocks (`h2`/`h3`/`p`/`scripture`/`list`) matching `BlogPost['body']`. `published` gates visibility. |
| `blog_comments` | Visitor comments, held for moderation (`approved` defaults to `false`). |

Column names are snake_case in the DB and mapped to the app's camelCase types in
`lib/blog.ts`, so pages and components keep consuming the existing
`BlogPost` / `Author` types.

## Row Level Security

- **Categories / authors** — public read.
- **Posts** — public read of `published = true` only.
- **Comments** — public *insert* only, and the policy forces `approved = false`
  (no self-approval). The public role has **no** table-wide `SELECT`; instead a
  column-level grant exposes only `id, post_slug, author_name, body,
  created_at`, so commenter **emails are never readable** through the public
  key. A second policy limits readable rows to `approved = true`.

Moderation is a manual toggle: set `approved = true` on a row in the Supabase
dashboard (or via the service role) and it appears after the next revalidation.

## Environment

Set in `.env.local` for local dev and in Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # or the legacy anon key
```

If these are unset (or a read fails), `lib/blog.ts` falls back to the seed
content in `content/blog.ts`, so the site still renders.

## Migrations

The SQL under `supabase/migrations/` is the source of truth and matches what is
applied to the project. Apply with the Supabase CLI:

```
supabase link --project-ref <project-ref>
supabase db push
```

Regenerate types after a schema change:

```
supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
```

## Publishing / revalidation

On publish, POST the changed paths to `/api/revalidate` with the shared
`REVALIDATE_SECRET`; that route revalidates the ISR pages and pings IndexNow.
Wire it to a Supabase Database Webhook on `blog_posts` when ready.
