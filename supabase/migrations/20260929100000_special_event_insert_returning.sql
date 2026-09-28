-- Fix: creating a member event always failed with "That did not save."
--
-- The app creates a special event with insert ... returning id. Postgres
-- checks the SELECT policy against the returned row, and that policy called
-- can_access_special_event(id), which looks the event up again by id. The
-- lookup runs with the statement's starting snapshot, so it cannot see the
-- row being inserted, returns false, and the insert is refused as a row-level
-- security violation. Every new event hit this, admins included.
--
-- The read policy now judges the row it is given (its creator, and whether
-- the reader manages events) instead of re-reading the table, and only falls
-- back to the participant lookup for events the reader did not create.
-- Exclusions are checked through a small definer function so the policy
-- does not recurse through the exclusions table's own policies. Who can see
-- what is unchanged.

create or replace function public.is_excluded_from_special_event(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.special_event_exclusions x
    where x.event_id = target_event_id and x.member_id = auth.uid()
  );
$$;

revoke execute on function public.is_excluded_from_special_event(uuid) from public, anon;
grant execute on function public.is_excluded_from_special_event(uuid) to authenticated;

drop policy if exists "Members read accessible events" on public.special_events;

create policy "Members read accessible events"
  on public.special_events for select
  to authenticated
  using (
    (
      public.is_approved_member()
      and (created_by = auth.uid() or public.is_editor())
      and not public.is_excluded_from_special_event(id)
    )
    or public.is_special_event_participant(id, auth.uid())
  );
