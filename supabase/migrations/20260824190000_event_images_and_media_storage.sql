-- Event feature images + a public media bucket for editor uploads.
--
-- 1. events gains image / image_alt so an event can carry a feature photo,
--    matching articles and sermons.
-- 2. A public "media" storage bucket backs the admin upload fields: anyone
--    can read (the site serves images from it), only approved editors and
--    admins can write. File paths are namespaced by content type
--    (events/…, articles/…, sermons/…) from the upload component.

alter table public.events
  add column if not exists image text,
  add column if not exists image_alt text;

-- ---------------------------------------------------------------------------
-- Media bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read: the bucket is public, but an explicit select policy keeps the
-- Storage API usable for listing/serving through the client as well.
create policy "Public read media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "Editors upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_editor());

create policy "Editors update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_editor())
  with check (bucket_id = 'media' and public.is_editor());

create policy "Editors delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_editor());
