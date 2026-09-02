-- Remove visitor comments.
--
-- The blog is publish-only: the article page no longer renders a comment
-- thread or form, and the site admin no longer has a moderation view. This
-- drops the table, its policies, grants, and the editor-only listing
-- function so no orphaned surface remains in the API.

drop function if exists public.moderation_comments();
drop table if exists public.blog_comments cascade;
