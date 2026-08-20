-- Sample seed content for events, sermons, and announcements. Mirrors the
-- local fallback files (content/events.ts, content/sermons.ts) so the site
-- renders the same placeholders from the database until the church supplies
-- real content. Every row is flagged sample = true.

insert into public.events
  (slug, title, summary, description, start_date, end_date, category, recurring, sample)
values
  (
    'gospel-meeting-spring',
    'Spring Gospel Meeting',
    'A week of evening lessons from a visiting Gospel preacher. All are welcome.',
    'A Gospel meeting is a series of evening sermons, usually over several nights, where a visiting preacher walks through a theme from the New Testament. There is no cost, no registration, and no pressure to participate. Come for one night or every night.',
    '2026-09-13T19:00:00-05:00',
    '2026-09-17T20:00:00-05:00',
    'Outreach',
    null,
    true
  ),
  (
    'fellowship-meal-monthly',
    'Monthly Fellowship Meal',
    'A shared meal after Sunday morning worship on the first Sunday of each month.',
    'On the first Sunday of each month the congregation shares a meal together after morning worship. It is a relaxed way to meet members and ask questions. Visitors are guests, never expected to bring anything.',
    '2026-07-05T11:30:00-05:00',
    null,
    'Fellowship',
    'First Sunday monthly',
    true
  ),
  (
    'community-food-drive',
    'Cass County Food Drive',
    'Collecting non-perishable food for neighbors in need across Cass County.',
    'The congregation gathers non-perishable food and household goods for distribution to families in Harrisonville and the surrounding Cass County area. Donations may be dropped off at the building during any assembly.',
    '2026-08-01T09:00:00-05:00',
    '2026-08-31T17:00:00-05:00',
    'Outreach',
    null,
    true
  );

insert into public.sermons
  (slug, title, speaker, date, scripture, series, summary, video_url, duration_minutes, thumbnail, thumbnail_alt, sample)
values
  (
    'who-is-the-church-of-christ',
    'Who Is the Church of Christ?',
    'Sample Speaker',
    '2026-05-31',
    'Acts 2:36-47',
    'Back to the Bible',
    'A plain look at how the church began in the first century and what it means to follow that pattern today, drawn straight from the book of Acts.',
    '',
    34,
    '/assets/images/video-placeholder.png',
    'Sermon video placeholder — real thumbnail to be supplied',
    true
  ),
  (
    'what-the-bible-says-about-baptism',
    'What the Bible Says About Baptism',
    'Sample Speaker',
    '2026-05-24',
    'Acts 22:16; Romans 6:3-4',
    'Hard Questions',
    'Baptism, the burial in water that Scripture connects to the washing away of sin, explained verse by verse so you can weigh it for yourself.',
    '',
    41,
    '/assets/images/video-placeholder.png',
    'Sermon video placeholder — real thumbnail to be supplied',
    true
  ),
  (
    'worship-in-spirit-and-truth',
    'Worship in Spirit and Truth',
    'Sample Speaker',
    '2026-05-17',
    'John 4:19-24',
    'Back to the Bible',
    'Why the congregation sings without instruments and keeps worship simple, traced to what the New Testament shows the first Christians doing.',
    '',
    29,
    '/assets/images/video-placeholder.png',
    'Sermon video placeholder — real thumbnail to be supplied',
    true
  ),
  (
    'the-lords-supper-every-week',
    'The Lord''s Supper, Every Week',
    'Sample Speaker',
    '2026-05-10',
    'Acts 20:7; 1 Corinthians 11:23-26',
    'Back to the Bible',
    'A study of why the early church gathered on the first day of every week to remember the death of Jesus in the Lord''s Supper.',
    '',
    31,
    '/assets/images/video-placeholder.png',
    'Sermon video placeholder — real thumbnail to be supplied',
    true
  );

insert into public.announcements (title, body, category, pinned, publish_date, published)
values
  (
    'Welcome to the members area',
    'This is where congregation news lands between assemblies: schedule changes, prayer requests, work days, and anything the elders want every member to see. Check back after Sunday worship for updates.',
    'General',
    true,
    current_date,
    true
  ),
  (
    'Building work day next Saturday',
    'We are meeting at the building at 9:00am next Saturday to handle spring maintenance: mowing, trimming, and a few small repairs inside. Bring gloves if you have them. Lunch is provided for everyone who comes to help.',
    'Facilities',
    false,
    current_date,
    true
  );
