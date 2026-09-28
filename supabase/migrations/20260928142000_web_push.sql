-- Phone notifications (web push).
--
-- Every bell notification can also reach a member's phone or computer as a
-- system notification. A member turns this on per device from the
-- Notifications tab of their profile: the browser hands us a push
-- subscription (an endpoint URL plus two keys), which is stored here.
--
-- Delivery: an AFTER INSERT/UPDATE trigger on in_app_notifications calls the
-- send-push Edge Function through pg_net (the same pattern as
-- notify-access-request). The function claims the notification with
-- claim_push_notification(), which stamps pushed_at, and sends to each of the
-- recipient's subscriptions with the VAPID keys, deleting subscriptions the
-- push service reports as gone (404/410).
--
-- Repeats: notify_member() upserts on (recipient, type, key) and a repeat
-- refreshes created_at (a busy group chat keeps one bell entry). A refreshed
-- row pushes again, but at most once every five minutes per row, so a lively
-- conversation buzzes a phone once rather than for every message. A row that
-- has already been read is never pushed.

-- ===========================================================================
-- 1. Tables and columns
-- ===========================================================================

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.member_profiles(id) on delete cascade,
  endpoint    text not null unique check (endpoint ~ '^https://'),
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_member_idx on public.push_subscriptions (member_id);

alter table public.notification_preferences
  add column if not exists push_enabled boolean not null default true;

alter table public.in_app_notifications
  add column if not exists pushed_at timestamptz;

-- ===========================================================================
-- 2. Row Level Security: members manage only their own devices
-- ===========================================================================

alter table public.push_subscriptions enable row level security;

create policy "Members read own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members add own push subscriptions"
  on public.push_subscriptions for insert
  to authenticated
  with check (member_id = auth.uid() and public.is_approved_member());

create policy "Members update own push subscriptions"
  on public.push_subscriptions for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "Members remove own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using (member_id = auth.uid());

revoke all on public.push_subscriptions from anon;

-- A browser keeps one endpoint per site. When a different member signs in on
-- the same device and turns notifications on, the endpoint must move to them
-- (the old owner can no longer receive on that device anyway). RLS would
-- block that update, so saving goes through this definer function.
create or replace function public.save_push_subscription(
  target_endpoint text,
  target_p256dh text,
  target_auth text,
  target_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_approved_member() then
    raise exception 'Only approved members can turn on notifications';
  end if;
  if target_endpoint is null or target_endpoint !~ '^https://' or length(target_endpoint) > 2048 then
    raise exception 'Invalid push endpoint';
  end if;
  if coalesce(length(target_p256dh), 0) not between 1 and 512 or coalesce(length(target_auth), 0) not between 1 and 512 then
    raise exception 'Invalid push keys';
  end if;
  insert into public.push_subscriptions (member_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), target_endpoint, target_p256dh, target_auth, left(target_user_agent, 300))
  on conflict (endpoint) do update
    set member_id = excluded.member_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        created_at = now();
end;
$$;

revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- ===========================================================================
-- 3. Claim a notification for pushing (service role only)
-- ===========================================================================

-- Returns the notification when it should be pushed now, stamping pushed_at
-- in the same statement so two concurrent calls cannot both send it. Returns
-- nothing when it was already pushed for this version, was pushed in the last
-- five minutes, has been read, or the member turned phone notifications off.
create or replace function public.claim_push_notification(target_id uuid)
returns table (
  id              uuid,
  recipient_id    uuid,
  notification_type text,
  event_key       text,
  title           text,
  body            text,
  destination_url text
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
  update public.in_app_notifications n
  set pushed_at = now()
  where n.id = target_id
    and n.read_at is null
    and (n.pushed_at is null or (n.pushed_at < n.created_at and n.pushed_at < now() - interval '5 minutes'))
    and coalesce((select np.push_enabled from public.notification_preferences np where np.member_id = n.recipient_id), true)
    and exists (select 1 from public.push_subscriptions s where s.member_id = n.recipient_id)
  returning n.id, n.recipient_id, n.notification_type, n.event_key, n.title, n.body, n.destination_url;
end;
$$;

revoke all on function public.claim_push_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_push_notification(uuid) to service_role;

-- ===========================================================================
-- 4. Trigger: hand new and refreshed notifications to the Edge Function
-- ===========================================================================

create extension if not exists pg_net;

create or replace function public.push_in_app_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Skip the HTTP call entirely for members with no device turned on.
  if new.read_at is null
     and exists (select 1 from public.push_subscriptions s where s.member_id = new.recipient_id) then
    perform net.http_post(
      url := 'https://oxmlwjiskxilcwhdbhmp.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('id', new.id)
    );
  end if;
  return new;
end;
$$;

revoke all on function public.push_in_app_notification() from public, anon, authenticated;

drop trigger if exists in_app_notifications_push on public.in_app_notifications;
create trigger in_app_notifications_push
  after insert or update of created_at on public.in_app_notifications
  for each row execute function public.push_in_app_notification();
