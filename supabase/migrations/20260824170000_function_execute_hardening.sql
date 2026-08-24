-- Function-execution hardening (applied to the live project 2026-08-24).
-- Postgres grants EXECUTE to PUBLIC by default, so the earlier per-role
-- revokes did not remove access. Revoke from PUBLIC and grant back only what
-- each caller needs: RLS helpers and gated read functions to authenticated;
-- trigger functions to nobody. Data was never exposed — every definer
-- function is internally gated — this closes the lint finding properly.

revoke execute on function public.is_approved_member() from public, anon;
grant execute on function public.is_approved_member() to authenticated;

revoke execute on function public.is_editor() from public, anon;
grant execute on function public.is_editor() to authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.directory_profiles() from public, anon;
grant execute on function public.directory_profiles() to authenticated;

revoke execute on function public.moderation_comments() from public, anon;
grant execute on function public.moderation_comments() to authenticated;

-- Trigger functions are never called through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.member_profiles_guard() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Future functions do not get PUBLIC execute by default.
alter default privileges in schema public revoke execute on functions from public;
