-- Seed categories (order drives the filter chips on /blog).
insert into public.blog_categories (name, sort_order) values
  ('Salvation', 1),
  ('Worship', 2),
  ('The Church', 3),
  ('Christian Living', 4),
  ('Bible Study', 5);

-- Seed the sample author. sample = true keeps the on-page "sample" notices honest.
insert into public.authors (slug, name, role, bio, long_bio, photo, photo_alt, linkedin, sample) values
  (
    'sample-author',
    'Sample Author',
    'Evangelist, Harrisonville Church of Christ',
    'Placeholder author bio. The real author teaches and writes for the congregation from the New Testament.',
    'Placeholder extended biography. The full bio will describe the author''s background, years of Bible study, and reason for writing: to help readers weigh every question against Scripture rather than tradition. It will close with how to reach him for a study or a conversation.',
    '/assets/images/placeholder.jpg',
    'Placeholder portrait — author photo to be supplied',
    '',
    true
  );

-- Post 1: Baptism
insert into public.blog_posts (
  slug, title, excerpt, meta_description, og_title, og_description,
  category, tags, author_slug, date_published, date_modified,
  feature_image, feature_image_alt, read_minutes, views, body, related_slugs, sample
) values (
  'what-does-the-bible-say-about-baptism',
  'What Does the Bible Say About Baptism?',
  'Few questions divide churches more than baptism. Here is what the New Testament actually says, read in plain context, so you can judge it for yourself.',
  'A plain, Scripture-first look at what the New Testament teaches about baptism: what it is, who it is for, and what it is connected to in the book of Acts.',
  'Baptism in the New Testament, Explained Plainly',
  'Read the passages on baptism in context and weigh them yourself, without denominational assumptions added on top.',
  'Salvation',
  array['baptism','salvation','book of Acts','new testament'],
  'sample-author',
  '2026-05-20', '2026-06-02',
  '/assets/images/placeholder.jpg',
  'Placeholder feature image — open Bible, to be replaced',
  7, 1284,
  $json$[
    {"type":"p","text":"Baptism is one of the first questions people ask when they begin reading the New Testament for themselves. The word means immersion, a burial in water, and the passages that describe it are not hard to find. The difficulty is usually not the text. It is the layers of assumption that get added on top of the text. This article sets those layers aside and reads the passages in plain context."},
    {"type":"h2","text":"What is baptism in the New Testament?"},
    {"type":"p","text":"In the first century, to be baptized was to be immersed in water. The action pictured a burial and a rising again, which is exactly how the apostle Paul describes it. Nothing about the word suggests sprinkling or pouring. It is a full burial in water, followed by being raised back up."},
    {"type":"scripture","ref":"Romans 6:3-4","text":"Or do you not know that as many of us as were baptized into Christ Jesus were baptized into His death? Therefore we were buried with Him through baptism into death, that just as Christ was raised from the dead by the glory of the Father, even so we also should walk in newness of life."},
    {"type":"h2","text":"Who is baptism for?"},
    {"type":"p","text":"Every example of baptism in the book of Acts follows a person hearing the message about Jesus, believing it, and responding. Belief comes first, which means the New Testament pattern is the baptism of someone old enough to hear and believe. The order is consistent from one account to the next."},
    {"type":"list","items":["The crowd on the day of Pentecost heard, were convicted, and were baptized.","The Ethiopian official heard the good news, believed, and asked to be baptized.","The jailer at Philippi believed and was baptized the same hour of the night."]},
    {"type":"h2","text":"What does baptism do, according to Scripture?"},
    {"type":"p","text":"The passages tie baptism directly to the forgiveness of sins and to entering into Christ. This is the part most often debated, so it is worth letting the verses speak plainly rather than arguing around them."},
    {"type":"scripture","ref":"Acts 2:38","text":"Then Peter said to them, Repent, and let every one of you be baptized in the name of Jesus Christ for the remission of sins, and you shall receive the gift of the Holy Spirit."},
    {"type":"h3","text":"A note on weighing this for yourself"},
    {"type":"p","text":"You do not have to take anyone's word for this, including ours. Read the passages above in their full chapters. Notice what comes before baptism, what comes after, and what the text says baptism is for. If you would like to study the question with someone, the congregation is glad to sit down with an open Bible and no agenda."}
  ]$json$::jsonb,
  array['why-no-instruments-in-worship','how-do-i-know-which-church-is-right'],
  true
);

-- Post 2: A cappella worship
insert into public.blog_posts (
  slug, title, excerpt, meta_description, og_title, og_description,
  category, tags, author_slug, date_published, date_modified,
  feature_image, feature_image_alt, read_minutes, views, body, related_slugs, sample
) values (
  'why-no-instruments-in-worship',
  'Why Do Churches of Christ Sing Without Instruments?',
  'Singing without a piano or band is one of the first things visitors notice. The reason is simpler, and more interesting, than most people expect.',
  'Why Churches of Christ sing a cappella in worship: the New Testament pattern of singing, and the principle of following what Scripture authorizes.',
  'The Reason Behind A Cappella Worship',
  'A short, Scripture-first explanation of why the congregation sings without instruments, traced to what the early church did.',
  'Worship',
  array['worship','singing','a cappella','authority'],
  'sample-author',
  '2026-05-06', null,
  '/assets/images/placeholder.jpg',
  'Placeholder feature image — hymnal, to be replaced',
  5, 962,
  $json$[
    {"type":"p","text":"When visitors join the congregation for the first time, one of the first things they notice is the sound of voices alone, with no piano, organ, or band. It is a fair thing to wonder about, and the explanation is not complicated."},
    {"type":"h2","text":"What does the New Testament show about singing?"},
    {"type":"p","text":"The passages in the New Testament that address music in worship speak of singing and making melody in the heart. The early church sang. That is the consistent picture from the letters written to those first congregations."},
    {"type":"scripture","ref":"Ephesians 5:19","text":"Speaking to one another in psalms and hymns and spiritual songs, singing and making melody in your heart to the Lord."},
    {"type":"h2","text":"Why does the church follow that pattern so closely?"},
    {"type":"p","text":"Behind the practice is a principle: the congregation tries to do what the New Testament authorizes for worship, and to be cautious about adding to it. Singing is what the text shows, so singing is what the church does. This is less about being against instruments and more about staying close to the pattern that is written down."},
    {"type":"h3","text":"Is this a rule, or a conviction?"},
    {"type":"p","text":"It is a conviction drawn from how the congregation reads Scripture, not a test of whether a visitor belongs. You are welcome to sit, listen, and weigh it. Many people find the sound of a room full of voices to be one of the most moving parts of the assembly."}
  ]$json$::jsonb,
  array['what-does-the-bible-say-about-baptism','how-do-i-know-which-church-is-right'],
  true
);

-- Post 3: Which church is right
insert into public.blog_posts (
  slug, title, excerpt, meta_description, og_title, og_description,
  category, tags, author_slug, date_published, date_modified,
  feature_image, feature_image_alt, read_minutes, views, body, related_slugs, sample
) values (
  'how-do-i-know-which-church-is-right',
  'How Do I Know Which Church Is Right?',
  'When every church claims the Bible, how do you choose? The answer is less about choosing a church and more about checking everything against one source.',
  'When every church claims biblical authority, how do you decide? A practical, non-judgmental approach to testing teaching against the New Testament.',
  'Choosing a Church Without the Confusion',
  'A calm, practical way to cut through denominational noise: test what you are taught against Scripture itself.',
  'The Church',
  array['denominations','authority','bible study','first-century church'],
  'sample-author',
  '2026-04-18', null,
  '/assets/images/placeholder.jpg',
  'Placeholder feature image — country church, to be replaced',
  6, 1530,
  $json$[
    {"type":"p","text":"If you have visited more than one church, you have probably noticed that each one claims to follow the Bible, and yet they teach different things. That contradiction is exhausting, and it leaves a lot of sincere people stuck, unsure who to trust. Here is a way through that does not require you to simply pick the most persuasive speaker."},
    {"type":"h2","text":"Why does denominational teaching contradict itself?"},
    {"type":"p","text":"Much of the contradiction comes from creeds, traditions, and statements of faith that were written long after the New Testament. When a practice rests on a tradition rather than on Scripture, two churches can both be sincere and still disagree, because they are standing on different foundations."},
    {"type":"h2","text":"What is the single test you can apply?"},
    {"type":"p","text":"The test is simple to state and demanding to live by: ask whether a teaching can be shown in the New Testament itself. Not implied, not inherited, but shown. The first Christians were commended for doing exactly this kind of checking."},
    {"type":"scripture","ref":"Acts 17:11","text":"These were more fair-minded than those in Thessalonica, in that they received the word with all readiness, and searched the Scriptures daily to find out whether these things were so."},
    {"type":"h2","text":"What does that look like in practice?"},
    {"type":"list","items":["When you hear a teaching, ask to see it in the text, in context.","Read the surrounding verses, not just a single quoted line.","Be willing to set aside a practice if the New Testament does not show it, and to keep one if it does."]},
    {"type":"h3","text":"A standing invitation"},
    {"type":"p","text":"This is the approach the congregation tries to take with every question. If you would like to test it, come and study. Bring your hardest questions. The goal is never to win an argument. It is to land where Scripture lands."}
  ]$json$::jsonb,
  array['what-does-the-bible-say-about-baptism','why-no-instruments-in-worship'],
  true
);
