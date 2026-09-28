-- Audio sermons.
--
-- The congregation records more audio than video, so a sermon can now carry
-- an audio recording instead of (or beside) a YouTube link:
--
-- 1. sermons.audio_url holds the recording's address: an MP3 uploaded from
--    the admin, or a link to one hosted elsewhere. Blank means no audio.
-- 2. A public "sermon-audio" storage bucket takes the uploads. Anyone can
--    read (the sermon page plays straight from it); only approved editors
--    and admins can write, matching the "media" bucket. It is its own bucket
--    because a recording is far larger than the 5 MB photo limit on "media".
--
-- The 50 MB per-file limit fits roughly an hour of speech at a typical MP3
-- bitrate. It cannot exceed the project's global upload limit (Storage
-- settings in the Supabase dashboard), so raise that first if it is lower.

alter table public.sermons
  add column if not exists audio_url text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sermon-audio',
  'sermon-audio',
  true,
  52428800, -- 50 MB
  array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read sermon audio"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'sermon-audio');

create policy "Editors upload sermon audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'sermon-audio' and public.is_editor());

create policy "Editors update sermon audio"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'sermon-audio' and public.is_editor())
  with check (bucket_id = 'sermon-audio' and public.is_editor());

create policy "Editors delete sermon audio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'sermon-audio' and public.is_editor());
