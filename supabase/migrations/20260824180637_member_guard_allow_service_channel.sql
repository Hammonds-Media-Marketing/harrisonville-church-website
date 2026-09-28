-- Allow role/approval changes from trusted server-side channels (SQL editor,
-- management API, service role), where auth.uid() is null. Those channels can
-- already bypass triggers outright, so this is a usability fix, not a
-- security change. API requests from signed-in users still require an admin.
create or replace function public.member_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.approved is distinct from old.approved)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin may change role or approval';
  end if;
  return new;
end;
$$;
