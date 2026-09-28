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
| `member_profiles` | One row per auth user: contact details, directory privacy toggles, `role`, `approved`, plus portal fields (birthday, anniversary, gender, photo focal point, family, approval bookkeeping, welcome email marker, last seen). |
| `families`, `family_children` | Households: a family card with photo and shared address, and children without their own account. |
| `groups`, `group_members`, `messages`, `chat_message_reactions`, `chat_read_states` | Chat. Standing groups (`congregation`, `men`, `women`) compute access from the profile; `custom` groups use membership or `is_public`; `event` groups follow a special event. |
| `calendar_events` | Members-only calendar rows (with optional recurrence). `visibility` is `members`, `leaders`, or `group` (with `group_id`). The members calendar also merges public `events`, published `special_events`, and speaker rows from `service_assignments`. |
| `service_assignments`, `service_schedule_months` | The monthly service schedule, entered by hand: one row per date, assembly, and duty, plus the month's arranger and notes. |
| `communion_signups`, `communion_signup_reminders` | One household prepares communion per month; reminders are sent by the cron function. |
| `special_events` and `special_event_*` | Member-organized events with an audience, exclusions, RSVPs with guest counts, and sign-up needs with capacity. Publishing creates an `event` chat group. |
| `in_app_notifications`, `notification_preferences`, `group_notification_preferences` | The notification bell. Rows are created by database triggers (see below) and honor each member's preferences. |
| `installed_app_detections` | Records that a member opened the members area from a home-screen icon, for the app-readiness dashboard. |
| `event_reminder_log` | One row per (event, occurrence, reminder type, member) written by the event-reminder cron; the unique key keeps a reminder from ever going out twice. Service role only. |
| `push_subscriptions` | One row per device a member turned phone notifications on for (web push endpoint and keys). Members manage only their own rows. |

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

### Member portal (migration `20260903100000_member_portal.sql`)

- **`member_directory` view** — how members read one another. It is owned by
  the migration role (so it is not subject to `member_profiles` RLS), returns
  only approved members, and nulls out every field the member has hidden,
  including birthday and anniversary. Direct reads of `member_profiles` stay
  own-row and admin only.
- **Families** — any approved member reads families and children; a family's
  own members (and admins) update the family and manage its children. A
  member may join only a family they created or were added to
  (`add_member_to_family`, callable by existing members of that family).
- **Chat** — `can_access_group()` is the single authority: congregation for
  every approved member, men and women by the profile's gender, custom groups
  by membership or `is_public`, event groups by `can_access_special_event()`.
  Message reads and sends go through it. Senders edit and soft-delete their
  own messages (the app enforces a one-day edit window); admins can remove
  any message. `chat_unread_summary()` and `direct_conversations()` are the
  only unread and conversation-list queries.
- **Special events** — `is_special_event_participant()` (published, not
  archived, audience matches, not excluded) decides who sees an event, RSVPs,
  and signs up. `can_manage_special_event()` is the organizer or any editor,
  unless they were excluded. `claim_signup_item()` takes an advisory lock so
  a spot can never be over-filled.
- **Calendar and schedule** — approved members read; editors write.
  `leaders` visibility hides a calendar row from plain members; `group`
  visibility shows it only to people `can_access_group(group_id)` allows,
  plus editors and admins (migration `20260928141000`). Deleting a group
  moves its calendar rows to `leaders`. `calendar_group_options()` lists the
  groups the form offers (every active group for editors).
- **Communion** — approved members claim a month for themselves; editors may
  claim on someone's behalf; the signed-up member or an editor releases it.
  A partial unique index keeps one active signup per month.
- **Notifications** — members can only read their own rows and mark them
  read (`mark_notification_read`, `mark_all_notifications_read`). Writes
  happen inside `SECURITY DEFINER` triggers: new message, announcement
  published, special event published or updated, RSVP received, calendar
  event added, member pending or approved, communion signup, and the
  communion reminder cron (`send_communion_reminders`, service role only).
  A repeat of the same (recipient, type, key) refreshes one row instead of
  adding another, so a busy group chat shows a single entry.
- **Storage** — `member-photos` (public read; members write under
  `members/<uid>`, family members under `families/<id>` and
  `children/<id>`) and `chat-media` (private; members upload under their
  own id, and the server mints one-hour signed URLs for readers who can see
  the message).
- **Realtime** — `messages`, `chat_message_reactions`, `chat_read_states`,
  and `in_app_notifications` are in the `supabase_realtime` publication.

### Reminders, email, and phone notifications (migrations `20260928140000` to `20260928143000`)

- **Event email reminders** — `calendar_events`, `special_events`, and
  `events` each have `email_reminder` (`none`, `1d`, `2d`, `both`). The
  hourly cron `/api/cron/event-reminders` finds occurrences whose reminder
  falls in the current hour (timed events 24 or 48 hours before; all-day
  events at 8 a.m. church time one or two days before; recurring events per
  occurrence), claims a row per member in `event_reminder_log`, adds a bell
  notification through `send_event_reminder_notifications()` (service role
  only), and emails everyone whose `notification_preferences.email_event_reminders`
  is on, through Resend's batch endpoint. Recipients: calendar rows go to
  their audience (everyone, leaders, or the group plus leaders); special
  events to members who answered yes or maybe plus the organizer (every
  eligible participant when RSVPs are off); public events to every approved
  member. The pure rules live in `lib/portal/reminders.ts`.
- **Phone notifications (web push)** — `push_subscriptions` stores each
  device (saved through `save_push_subscription()`, which moves an endpoint
  to whoever turns it on). The `in_app_notifications_push` trigger calls
  the `send-push` Edge Function with pg_net for new or refreshed
  notifications when the recipient has a device. The function claims the row
  with `claim_push_notification()` (service role only; stamps `pushed_at`),
  sends with the VAPID keys, and deletes subscriptions that return 404 or 410.
  A refreshed row (same recipient, type, and key, such as a busy group chat)
  pushes again at most once every five minutes; read rows and members with
  `notification_preferences.push_enabled` off are skipped. The browser side
  is `public/sw.js` plus the toggle on the profile's Notifications tab.
- **Access-request email** — `notify-access-request` now emails every
  approved admin plus any addresses in `NOTIFY_TO_EMAIL` (comma-separated),
  in one message; `garrett@hmm.agency` only if that list is empty.
- **Special event categories** — adds `wedding_shower`.

After applying the migration, make sure Realtime is enabled for the project
and that the three standing groups exist (the migration seeds Congregation,
Men, and Ladies).

## Environment

Set in `.env.local` for local dev and in Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # or the legacy anon key

# Member portal
RESEND_API_KEY=                 # welcome email on approval; blank = skip
WELCOME_EMAIL_FROM="Harrisonville Church of Christ <no-reply@harrisonvillecoc.com>"
SUPABASE_SERVICE_ROLE_KEY=      # server only; used by the two cron routes
CRON_SECRET=                    # bearer token the cron scheduler sends
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # web push public key; blank hides the phone toggle
```

Both crons are declared in `vercel.json`: `/api/cron/communion-reminders`
(daily) and `/api/cron/event-reminders` (hourly, `0 * * * *`). Vercel sends
`CRON_SECRET` automatically when it is set in the project. Hourly crons need
a Vercel Pro (or higher) plan; on Hobby, run the event-reminder route from
another scheduler (for example Supabase `pg_cron` with `net.http_get` and
the bearer header) every hour.

## Edge Functions

Both functions are called by database triggers through pg_net with no user
token, so deploy them with JWT verification off. Each one re-reads the real
state with the service role and is safe to call repeatedly.

```
supabase functions deploy notify-access-request --no-verify-jwt
supabase functions deploy send-push --no-verify-jwt
```

Function secrets (`supabase secrets set NAME=value`):

| Function | Secrets |
|---|---|
| `notify-access-request` | `RESEND_API_KEY`, optional `NOTIFY_FROM_EMAIL`, optional `NOTIFY_TO_EMAIL` (comma-separated extra recipients; every approved admin is always included) |
| `send-push` | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (for example `mailto:gospel@harrisonvillecoc.com`) |

Generate the VAPID pair once with `npx web-push generate-vapid-keys`; the
public key also goes in the site's `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. The
trigger URLs in the migrations point at the production project
(`oxmlwjiskxilcwhdbhmp`); change them if you apply the migrations to
another project.

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
