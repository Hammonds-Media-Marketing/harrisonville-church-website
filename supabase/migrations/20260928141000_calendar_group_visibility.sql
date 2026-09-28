-- Calendar visibility by group.
--
-- Until now a members-calendar row was either for everyone ('members') or
-- for editors and admins ('leaders'). The church wants calendars that only
-- part of the congregation sees (a speaking calendar for the men who speak,
-- a ladies' class schedule), using groups the admins define themselves on
-- /members/admin/groups. So a row may now be 'group' visibility with a
-- group_id, and the read policy lets in exactly the people who can open that
-- group (can_access_group: standing groups by profile, custom groups by
-- membership or "open to everyone") plus every editor and admin.
--
-- Deleting a group moves its calendar rows to 'leaders' first, so an event
-- never becomes visible to more people than it was meant for.

-- ===========================================================================
-- 1. Columns and constraints
-- ===========================================================================

alter table public.calendar_events
  add column if not exists group_id uuid references public.groups(id) on delete set null;

-- Drop the original inline check on visibility (auto-named), whatever its name.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.calendar_events'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%visibility%'
  loop
    execute format('alter table public.calendar_events drop constraint %I', c.conname);
  end loop;
end
$$;

alter table public.calendar_events
  add constraint calendar_events_visibility_check
    check (visibility in ('members', 'leaders', 'group')),
  add constraint calendar_events_group_required
    check (visibility <> 'group' or group_id is not null);

create index if not exists calendar_events_group_idx on public.calendar_events (group_id) where group_id is not null;

-- Before a group row is deleted, fall its calendar rows back to leaders-only
-- (the FK's "set null" would otherwise break calendar_events_group_required).
create or replace function public.calendar_events_group_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.calendar_events
  set visibility = 'leaders', group_id = null
  where group_id = old.id;
  return old;
end;
$$;

revoke all on function public.calendar_events_group_deleted() from public, anon, authenticated;

drop trigger if exists groups_calendar_events_fallback on public.groups;
create trigger groups_calendar_events_fallback
  before delete on public.groups
  for each row execute function public.calendar_events_group_deleted();

-- ===========================================================================
-- 2. Read policy
-- ===========================================================================

drop policy if exists "Members read member calendar events" on public.calendar_events;

create policy "Members read member calendar events"
  on public.calendar_events for select
  to authenticated
  using (
    public.is_approved_member()
    and (
      visibility = 'members'
      or public.is_editor()
      or (visibility = 'group' and group_id is not null and public.can_access_group(group_id))
    )
  );

-- Groups offered in the calendar form's "One group" picker, and used to
-- label group-only rows. Editors pick from every active group (not only the
-- ones they can chat in, which the groups table's own policy limits them
-- to); members get the groups they can open. Event chat groups are left out.
create or replace function public.calendar_group_options()
returns table (id uuid, name text, kind text)
language sql
security definer
set search_path = ''
stable
as $$
  select g.id, g.name, g.kind
  from public.groups g
  where g.archived_at is null
    and g.kind <> 'event'
    and public.is_approved_member()
    and (public.is_editor() or public.can_access_group(g.id))
  order by case g.kind when 'congregation' then 0 when 'men' then 1 when 'women' then 2 else 3 end, g.name;
$$;

revoke all on function public.calendar_group_options() from public, anon;
grant execute on function public.calendar_group_options() to authenticated;

-- ===========================================================================
-- 3. "Added to the calendar" notification follows the audience
-- ===========================================================================

-- members -> every approved member; group -> the people who can see that
-- group; leaders -> nobody (unchanged). The author is never notified.
create or replace function public.notify_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if new.visibility = 'members' then
    for recipient in select id from public.member_profiles where approved and id is distinct from new.created_by loop
      perform public.notify_member(
        recipient, 'calendar_event', new.id::text,
        'Added to the calendar: ' || new.title,
        to_char(new.starts_at at time zone 'America/Chicago', 'FMDay, FMMonth FMDD'),
        '/members/calendar?date=' || to_char(new.starts_at at time zone 'America/Chicago', 'YYYY-MM-DD'), 'calendar_event', new.id);
    end loop;
  elsif new.visibility = 'group' and new.group_id is not null then
    for recipient in select a from public.group_audience(new.group_id) a where a is distinct from new.created_by loop
      perform public.notify_member(
        recipient, 'calendar_event', new.id::text,
        'Added to the calendar: ' || new.title,
        to_char(new.starts_at at time zone 'America/Chicago', 'FMDay, FMMonth FMDD'),
        '/members/calendar?date=' || to_char(new.starts_at at time zone 'America/Chicago', 'YYYY-MM-DD'), 'calendar_event', new.id);
    end loop;
  end if;
  return new;
end;
$$;
