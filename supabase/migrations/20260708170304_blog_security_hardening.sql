-- Pin search_path on the trigger function (linter: function_search_path_mutable).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Replace the SECURITY DEFINER read function with RLS + column-level grants.
-- This exposes approved comments while keeping submitter emails unreadable to
-- the public API, without a definer function callable by anon.
drop function if exists public.approved_comments(text);

create policy "Public read approved comments"
  on public.blog_comments for select
  to anon, authenticated
  using (approved = true);

-- Hide author_email (and the approved flag) from the anon/authenticated API;
-- only the safe display columns are selectable.
revoke select on public.blog_comments from anon, authenticated;
grant select (id, post_slug, author_name, body, created_at)
  on public.blog_comments to anon, authenticated;
