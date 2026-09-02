-- Email the church when someone requests member access.
--
-- A trigger on member_profiles fires the notify-access-request Edge Function
-- (async, via pg_net) whenever a new unapproved profile is inserted — the
-- moment someone submits the "Request member access" form. The function reads
-- the real pending list with the service role, sends through Resend, and logs
-- each send in admin_notification_log so it only mails when a request newer
-- than the last notification exists. A failed or slow call never blocks the
-- signup itself.

create extension if not exists pg_net;

-- Send log, written only by the Edge Function (service role). RLS is enabled
-- with no policies, so no client key can read or write it.
create table public.admin_notification_log (
  id      bigint generated always as identity primary key,
  kind    text not null,
  sent_at timestamptz not null default now()
);

create index admin_notification_log_kind_sent_idx
  on public.admin_notification_log (kind, sent_at desc);

alter table public.admin_notification_log enable row level security;

create or replace function public.notify_member_access_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.approved = false then
    perform net.http_post(
      url := 'https://oxmlwjiskxilcwhdbhmp.supabase.co/functions/v1/notify-access-request',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  end if;
  return new;
end;
$$;

create trigger member_profiles_notify_access_request
  after insert on public.member_profiles
  for each row execute function public.notify_member_access_request();
