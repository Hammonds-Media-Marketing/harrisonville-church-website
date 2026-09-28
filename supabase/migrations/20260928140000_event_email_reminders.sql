-- Email reminders before events.
--
-- Editors (and special-event organizers) choose, per event, whether members
-- get an email reminder about a day before, two days before, or both. The
-- hourly cron route /api/cron/event-reminders finds occurrences whose
-- reminder falls in the current hour, works out who should hear about each
-- one, and sends the email (Resend) plus an in-app notification.
--
--   * email_reminder on calendar_events, special_events, and the public
--     events table: 'none' (default), '1d' (about 24 hours before),
--     '2d' (about 48 hours before), or 'both'.
--   * notification_preferences.email_event_reminders: each member's opt-out
--     for reminder emails. The in-app reminder still arrives.
--   * event_reminder_log: one row per (event, occurrence, reminder, member).
--     The cron claims a row before sending, and the unique key means a rerun
--     or an overlapping run can never send the same reminder twice.
--   * send_event_reminder_notifications(): the in-app half, callable by the
--     service role only.

-- ===========================================================================
-- 1. Per-event reminder setting
-- ===========================================================================

alter table public.calendar_events
  add column if not exists email_reminder text not null default 'none'
    check (email_reminder in ('none', '1d', '2d', 'both'));

alter table public.special_events
  add column if not exists email_reminder text not null default 'none'
    check (email_reminder in ('none', '1d', '2d', 'both'));

alter table public.events
  add column if not exists email_reminder text not null default 'none'
    check (email_reminder in ('none', '1d', '2d', 'both'));

-- The cron only looks at rows that asked for a reminder.
create index if not exists calendar_events_email_reminder_idx
  on public.calendar_events (starts_at) where email_reminder <> 'none';
create index if not exists special_events_email_reminder_idx
  on public.special_events (starts_at) where email_reminder <> 'none' and status = 'published' and archived_at is null;
create index if not exists events_email_reminder_idx
  on public.events (start_date) where email_reminder <> 'none' and published;

-- ===========================================================================
-- 2. Member email preference
-- ===========================================================================

alter table public.notification_preferences
  add column if not exists email_event_reminders boolean not null default true;

-- ===========================================================================
-- 3. Send log (dedupe)
-- ===========================================================================

create table if not exists public.event_reminder_log (
  id               bigint generated always as identity primary key,
  event_kind       text not null check (event_kind in ('calendar', 'special', 'public')),
  event_id         uuid not null,
  occurrence_start timestamptz not null,
  reminder_type    text not null check (reminder_type in ('1d', '2d')),
  recipient_id     uuid not null references public.member_profiles(id) on delete cascade,
  -- sent, failed, opted_out, no_email, not_configured
  email_status     text,
  created_at       timestamptz not null default now(),
  constraint event_reminder_log_unique unique (event_kind, event_id, occurrence_start, reminder_type, recipient_id)
);

create index if not exists event_reminder_log_created_idx on public.event_reminder_log (created_at);

-- Written and read only by the cron (service role). RLS on with no policies
-- keeps every client key out.
alter table public.event_reminder_log enable row level security;
revoke all on public.event_reminder_log from anon, authenticated;
grant select, insert, update, delete on public.event_reminder_log to service_role;

-- ===========================================================================
-- 4. In-app half of a reminder
-- ===========================================================================

-- One call per reminder: fans the bell notification out to every recipient.
-- notify_member honors in-app preferences and upserts on (type, key), so the
-- key carries the occurrence and reminder type to keep 1d and 2d separate.
create or replace function public.send_event_reminder_notifications(
  target_recipients uuid[],
  target_key text,
  target_title text,
  target_body text,
  target_url text,
  target_entity_type text,
  target_entity_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  sent integer := 0;
begin
  for recipient in
    select distinct r from unnest(target_recipients) r
    join public.member_profiles p on p.id = r and p.approved
  loop
    perform public.notify_member(
      recipient, 'event_reminder', target_key, target_title, target_body, target_url,
      target_entity_type, target_entity_id);
    sent := sent + 1;
  end loop;
  return sent;
end;
$$;

revoke all on function public.send_event_reminder_notifications(uuid[], text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.send_event_reminder_notifications(uuid[], text, text, text, text, text, uuid) to service_role;
