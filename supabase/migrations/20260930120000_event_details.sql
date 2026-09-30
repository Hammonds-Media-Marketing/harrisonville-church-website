-- Richer public event pages.
--
--   * location_street / _city / _region / _postal_code: the street address of
--     an off-site event, used for the embedded map, directions, and the
--     Event structured data. Blank means the church building.
--   * sessions: the event's individual dates and times, for events that run
--     over several days (for example, a Gospel meeting Friday through Sunday).
--     A JSON array of { "start": ISO, "end": ISO | null }, soonest first. When
--     it is non-empty, start_date / end_date hold the span of the whole event
--     (first start, last end) so listing, sorting, and "is it still upcoming"
--     queries keep working unchanged.
--   * speakers: [{ "name", "role", "bio", "image", "image_alt" }]
--   * faqs: [{ "question", "answer" }]
--   * info_sections: extra free-form sections, [{ "heading", "body" }], for
--     anything else an event needs (what to bring, lodging, meals, parking).

alter table public.events
  add column if not exists location_street text,
  add column if not exists location_city text,
  add column if not exists location_region text,
  add column if not exists location_postal_code text,
  add column if not exists sessions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sessions) = 'array'),
  add column if not exists speakers jsonb not null default '[]'::jsonb
    check (jsonb_typeof(speakers) = 'array'),
  add column if not exists faqs jsonb not null default '[]'::jsonb
    check (jsonb_typeof(faqs) = 'array'),
  add column if not exists info_sections jsonb not null default '[]'::jsonb
    check (jsonb_typeof(info_sections) = 'array');
