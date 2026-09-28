-- Drag-and-drop elements for the hand-built pages.
--
-- Each hand-built page leaves open slots ("zones") between its bands. In the
-- visual editor, an editor drags elements (a heading, a paragraph, a photo, a
-- button, a video, a band of their own) from the "Add elements" panel into
-- those slots. The elements live beside the wording overrides on the same row.
--
-- `elements` maps a zone id (declared in the page code) to an ordered list of
-- elements. The shape is validated in lib/page-elements.ts on both save and
-- read, so an unknown element type or a zone the code no longer declares
-- degrades to nothing on the page rather than an error. Row Level Security is
-- unchanged: the existing page_content policies already limit writes to
-- editors and allow the public read that renders the site.

alter table public.page_content
  add column elements jsonb not null default '{}';
