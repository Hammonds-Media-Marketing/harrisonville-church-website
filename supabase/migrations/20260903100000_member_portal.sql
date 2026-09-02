-- Member portal for Harrisonville Church of Christ.
--
-- Extends the members backend from "announcements + directory" into a full
-- member app: families and children, birthdays and anniversaries, direct and
-- group chat, an in-app notification bell, a members calendar, communion
-- preparation signup, a manually entered service schedule, special events with
-- RSVPs and signup lists, approval bookkeeping, a welcome-email marker, and
-- installed-app detection for the admin readiness dashboard.
--
-- Design rules carried over from the existing schema:
--   * No service-role key in the app. Every read and write runs under the
--     signed-in member's session, so the policies here are the whole
--     authorization model. The one exception is the communion-reminder cron,
--     which runs server-side with the service role.
--   * Roles stay member / editor / admin. "Leaders" in the app means editors
--     and admins. Members can create their own special events; editors and
--     admins can manage everyone's.
--   * Notifications fan out inside the database (SECURITY DEFINER triggers)
--     so a member never needs permission to write another member's rows.

-- ===========================================================================
-- 1. Member profile extensions
-- ===========================================================================

alter table public.member_profiles
  add column if not exists birthday          date,
  add column if not exists anniversary       date,
  add column if not exists gender            text check (gender is null or gender in ('male', 'female')),
  add column if not exists family_id         uuid,
  add column if not exists photo_position    text not null default '50% 50%',
  add column if not exists show_birthday     boolean not null default true,
  add column if not exists show_anniversary  boolean not null default true,
  add column if not exists approved_at       timestamptz,
  add column if not exists approved_by       uuid references public.member_profiles(id) on delete set null,
  add column if not exists rejected_at       timestamptz,
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists last_seen_at      timestamptz;

-- Backfill approved_at for members approved before this migration.
update public.member_profiles set approved_at = coalesce(approved_at, updated_at) where approved and approved_at is null;

-- Approval bookkeeping is admin-only, like role and approved themselves.
create or replace function public.member_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role
      or new.approved is distinct from old.approved
      or new.approved_at is distinct from old.approved_at
      or new.approved_by is distinct from old.approved_by
      or new.rejected_at is distinct from old.rejected_at
      or new.welcome_email_sent_at is distinct from old.welcome_email_sent_at)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin may change role or approval';
  end if;
  -- Approving clears any earlier rejection and stamps the approver.
  if new.approved and not old.approved then
    new.approved_at := coalesce(new.approved_at, now());
    new.approved_by := coalesce(new.approved_by, auth.uid());
    new.rejected_at := null;
  end if;
  if not new.approved and old.approved then
    new.approved_at := null;
    new.approved_by := null;
  end if;
  return new;
end;
$$;

-- ===========================================================================
-- 2. Families and children
-- ===========================================================================

create table if not exists public.families (
  id             uuid primary key default gen_random_uuid(),
  family_name    text not null check (length(btrim(family_name)) between 1 and 120),
  photo          text,
  photo_position text not null default '50% 50%',
  address_line1  text,
  address_line2  text,
  city           text,
  state          text,
  postal_code    text,
  show_address   boolean not null default true,
  created_by     uuid references public.member_profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger families_set_updated_at
  before update on public.families
  for each row execute function public.set_updated_at();

alter table public.member_profiles
  add constraint member_profiles_family_id_fkey
  foreign key (family_id) references public.families(id) on delete set null;

create index if not exists member_profiles_family_idx on public.member_profiles (family_id);

create table if not exists public.family_children (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  first_name     text not null check (length(btrim(first_name)) between 1 and 80),
  last_name      text,
  birthday       date,
  gender         text check (gender is null or gender in ('male', 'female')),
  photo          text,
  photo_position text not null default '50% 50%',
  show_birthday  boolean not null default true,
  created_by     uuid references public.member_profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists family_children_family_idx on public.family_children (family_id);

create trigger family_children_set_updated_at
  before update on public.family_children
  for each row execute function public.set_updated_at();

-- A member "belongs" to a family when their profile points at it.
create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.member_profiles p
    where p.id = auth.uid() and p.approved and p.family_id = target_family_id
  );
$$;

revoke execute on function public.is_family_member(uuid) from anon;

alter table public.families enable row level security;
alter table public.family_children enable row level security;

create policy "Members read families"
  on public.families for select
  to authenticated
  using (public.is_approved_member());

create policy "Members create families"
  on public.families for insert
  to authenticated
  with check (public.is_approved_member() and created_by = auth.uid());

create policy "Family members update their family"
  on public.families for update
  to authenticated
  using (public.is_family_member(id) or created_by = auth.uid() or public.is_admin())
  with check (public.is_family_member(id) or created_by = auth.uid() or public.is_admin());

create policy "Admins delete families"
  on public.families for delete
  to authenticated
  using (public.is_admin());

create policy "Members read children"
  on public.family_children for select
  to authenticated
  using (public.is_approved_member());

create policy "Family members manage children"
  on public.family_children for insert
  to authenticated
  with check (public.is_family_member(family_id) or public.is_admin());

create policy "Family members update children"
  on public.family_children for update
  to authenticated
  using (public.is_family_member(family_id) or public.is_admin())
  with check (public.is_family_member(family_id) or public.is_admin());

create policy "Family members delete children"
  on public.family_children for delete
  to authenticated
  using (public.is_family_member(family_id) or public.is_admin());

-- Members may join a family (set their own family_id) only for a family
-- they created or were added to by an existing family member. Admins may
-- place anyone. Enforced in the profile guard to keep the update policy simple.
create or replace function public.member_profiles_family_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.family_id is distinct from old.family_id
     and new.family_id is not null
     and auth.uid() is not null
     and not public.is_admin()
     and not exists (
       select 1 from public.families f
       where f.id = new.family_id
         and (f.created_by = auth.uid() or public.is_family_member(f.id))
     ) then
    raise exception 'You can only join a family you created or were added to';
  end if;
  return new;
end;
$$;

create trigger member_profiles_family_guard
  before update on public.member_profiles
  for each row execute function public.member_profiles_family_guard();

-- Family members may add another approved member to their family. This
-- definer function is the only path that writes another member's family_id.
create or replace function public.add_member_to_family(target_family_id uuid, target_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_family_member(target_family_id) or public.is_admin()
          or exists (select 1 from public.families f where f.id = target_family_id and f.created_by = auth.uid())) then
    raise exception 'Only family members may add people to this family';
  end if;
  update public.member_profiles
  set family_id = target_family_id
  where id = target_member_id and approved and family_id is null;
end;
$$;

revoke execute on function public.add_member_to_family(uuid, uuid) from anon, public;
grant execute on function public.add_member_to_family(uuid, uuid) to authenticated;

-- ===========================================================================
-- 3. Directory view: approved members with privacy toggles applied
-- ===========================================================================
-- member_profiles stays readable only by its owner and admins. Everyone else
-- reads through this view, which is owned by the migration role (so it is
-- not subject to the table's RLS) and masks each column a member has hidden.

create or replace view public.member_directory
with (security_barrier = true) as
  select
    p.id,
    p.full_name,
    split_part(btrim(p.full_name), ' ', 1)                               as first_name,
    p.photo,
    p.photo_position,
    p.about,
    p.gender,
    p.role,
    p.family_id,
    p.show_in_directory,
    case when p.show_email       then p.email       end                  as email,
    case when p.show_phone       then p.phone       end                  as phone,
    case when p.show_address     then p.address     end                  as address,
    case when p.show_birthday    then p.birthday    end                  as birthday,
    case when p.show_anniversary then p.anniversary end                  as anniversary,
    p.last_seen_at,
    p.created_at
  from public.member_profiles p
  where p.approved
    and (public.is_approved_member() or public.is_admin());

revoke all on public.member_directory from anon, public;
grant select on public.member_directory to authenticated;

-- ===========================================================================
-- 4. Groups and chat
-- ===========================================================================

create table if not exists public.groups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(btrim(name)) between 1 and 80),
  description      text,
  kind             text not null default 'custom' check (kind in ('congregation', 'men', 'women', 'custom', 'event')),
  is_public        boolean not null default false,
  special_event_id uuid unique,
  archived_at      timestamptz,
  created_by       uuid references public.member_profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists groups_single_system_kind_idx
  on public.groups (kind) where kind in ('congregation', 'men', 'women');

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create table if not exists public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  member_id  uuid not null references public.member_profiles(id) on delete cascade,
  added_by   uuid references public.member_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (group_id, member_id)
);

create index if not exists group_members_member_idx on public.group_members (member_id);

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.member_profiles(id) on delete cascade,
  group_id     uuid references public.groups(id) on delete cascade,
  recipient_id uuid references public.member_profiles(id) on delete cascade,
  body         text not null default '',
  message_type text not null default 'text' check (message_type in ('text', 'image')),
  image_path   text,
  image_width  integer,
  image_height integer,
  edited_at    timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint messages_destination_check check (
    (group_id is not null and recipient_id is null) or (group_id is null and recipient_id is not null)
  ),
  constraint messages_no_self_direct_check check (recipient_id is null or recipient_id <> sender_id),
  constraint messages_content_check check (message_type = 'image' or length(btrim(body)) > 0),
  constraint messages_image_check check (message_type <> 'image' or image_path is not null)
);

create index if not exists messages_group_idx
  on public.messages (group_id, created_at desc, id desc) where group_id is not null;
create index if not exists messages_direct_idx
  on public.messages (recipient_id, sender_id, created_at desc, id desc) where recipient_id is not null;
create index if not exists messages_sender_direct_idx
  on public.messages (sender_id, recipient_id, created_at desc) where recipient_id is not null;

create table if not exists public.chat_message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  member_id  uuid not null references public.member_profiles(id) on delete cascade,
  emoji      text not null check (emoji in ('👍', '❤️', '😂', '😮', '😢', '🙏')),
  created_at timestamptz not null default now(),
  primary key (message_id, member_id)
);

create table if not exists public.chat_read_states (
  member_id        uuid not null references public.member_profiles(id) on delete cascade,
  group_id         uuid references public.groups(id) on delete cascade,
  direct_member_id uuid references public.member_profiles(id) on delete cascade,
  last_read_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chat_read_states_one_conversation_check check (
    (group_id is not null and direct_member_id is null) or (group_id is null and direct_member_id is not null)
  ),
  constraint chat_read_states_no_self_check check (direct_member_id is null or direct_member_id <> member_id)
);

create unique index if not exists chat_read_states_group_idx
  on public.chat_read_states (member_id, group_id) where group_id is not null;
create unique index if not exists chat_read_states_direct_idx
  on public.chat_read_states (member_id, direct_member_id) where direct_member_id is not null;

create trigger chat_read_states_set_updated_at
  before update on public.chat_read_states
  for each row execute function public.set_updated_at();

-- Seed the three standing conversations. Access to them is computed from
-- the profile (approved / gender), so no membership rows are needed.
insert into public.groups (name, description, kind, is_public)
values
  ('Congregation', 'Every approved member of the Harrisonville Church of Christ.', 'congregation', true),
  ('Men', 'The men of the congregation.', 'men', true),
  ('Ladies', 'The ladies of the congregation.', 'women', true)
on conflict do nothing;

-- ===========================================================================
-- 5. Special events (defined before group access, which depends on them)
-- ===========================================================================

create table if not exists public.special_events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(btrim(title)) between 1 and 160),
  category      text check (category is null or category in ('baby_shower', 'meal_train', 'birthday', 'gospel_meeting', 'fellowship', 'service_project', 'other')),
  description   text not null default '',
  starts_at     timestamptz,
  ends_at       timestamptz,
  all_day       boolean not null default false,
  location      text,
  audience      text not null default 'everyone' check (audience in ('everyone', 'women', 'men')),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  rsvp_enabled  boolean not null default true,
  chat_group_id uuid unique references public.groups(id) on delete set null,
  archived_at   timestamptz,
  created_by    uuid not null references public.member_profiles(id) on delete cascade,
  updated_by    uuid references public.member_profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint special_events_time_check check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint special_events_published_needs_start check (status = 'draft' or starts_at is not null)
);

alter table public.groups
  add constraint groups_special_event_id_fkey
  foreign key (special_event_id) references public.special_events(id) on delete cascade;

create index if not exists special_events_start_idx on public.special_events (starts_at) where archived_at is null;
create index if not exists special_events_creator_idx on public.special_events (created_by);

create trigger special_events_set_updated_at
  before update on public.special_events
  for each row execute function public.set_updated_at();

-- Members an organizer has left off an event (a surprise party, for instance).
create table if not exists public.special_event_exclusions (
  event_id   uuid not null references public.special_events(id) on delete cascade,
  member_id  uuid not null references public.member_profiles(id) on delete cascade,
  created_by uuid references public.member_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create table if not exists public.special_event_signup_items (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.special_events(id) on delete cascade,
  title             text not null check (length(btrim(title)) between 1 and 160),
  description       text,
  volunteers_needed integer not null default 1 check (volunteers_needed between 1 and 500),
  needed_at         timestamptz,
  display_order     integer not null default 0 check (display_order >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists special_event_signup_items_event_idx
  on public.special_event_signup_items (event_id, display_order);

create trigger special_event_signup_items_set_updated_at
  before update on public.special_event_signup_items
  for each row execute function public.set_updated_at();

create table if not exists public.special_event_signups (
  signup_item_id uuid not null references public.special_event_signup_items(id) on delete cascade,
  member_id      uuid not null references public.member_profiles(id) on delete cascade,
  note           text,
  created_at     timestamptz not null default now(),
  primary key (signup_item_id, member_id)
);

create index if not exists special_event_signups_member_idx on public.special_event_signups (member_id);

create table if not exists public.special_event_rsvps (
  event_id    uuid not null references public.special_events(id) on delete cascade,
  member_id   uuid not null references public.member_profiles(id) on delete cascade,
  response    text not null check (response in ('yes', 'maybe', 'no')),
  guest_count integer not null default 0 check (guest_count between 0 and 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index if not exists special_event_rsvps_member_idx on public.special_event_rsvps (member_id, event_id);

create trigger special_event_rsvps_set_updated_at
  before update on public.special_event_rsvps
  for each row execute function public.set_updated_at();

-- Capacity cannot drop below the people already signed up.
create or replace function public.enforce_signup_item_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.volunteers_needed < (select count(*) from public.special_event_signups s where s.signup_item_id = new.id) then
    raise exception 'Volunteers needed cannot be lower than the number already signed up';
  end if;
  return new;
end;
$$;

create trigger special_event_signup_item_capacity
  before update of volunteers_needed on public.special_event_signup_items
  for each row execute function public.enforce_signup_item_capacity();

-- Eligibility: published, not archived, audience matches, not excluded.
create or replace function public.is_special_event_participant(target_event_id uuid, target_member_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.special_events e
    join public.member_profiles p on p.id = target_member_id
    where e.id = target_event_id
      and e.status = 'published'
      and e.archived_at is null
      and p.approved
      and not exists (select 1 from public.special_event_exclusions x where x.event_id = e.id and x.member_id = p.id)
      and (
        e.audience = 'everyone'
        or (e.audience = 'women' and p.gender = 'female')
        or (e.audience = 'men' and p.gender = 'male')
      )
  );
$$;

-- Organizer (creator) or an editor/admin, unless they were excluded.
create or replace function public.can_manage_special_event(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.special_events e
    where e.id = target_event_id
      and public.is_approved_member()
      and (e.created_by = auth.uid() or public.is_editor())
      and not exists (select 1 from public.special_event_exclusions x where x.event_id = e.id and x.member_id = auth.uid())
  );
$$;

create or replace function public.can_access_special_event(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select public.can_manage_special_event(target_event_id)
      or public.is_special_event_participant(target_event_id, auth.uid());
$$;

revoke execute on function public.is_special_event_participant(uuid, uuid) from anon;
revoke execute on function public.can_manage_special_event(uuid) from anon;
revoke execute on function public.can_access_special_event(uuid) from anon;

-- ===========================================================================
-- 6. Group access and chat policies
-- ===========================================================================

create or replace function public.can_access_group(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.groups g
    join public.member_profiles p on p.id = auth.uid() and p.approved
    where g.id = target_group_id
      and g.archived_at is null
      and (
        g.kind = 'congregation'
        or (g.kind = 'men' and p.gender = 'male')
        or (g.kind = 'women' and p.gender = 'female')
        or (g.kind = 'custom' and (g.is_public or exists (
              select 1 from public.group_members gm where gm.group_id = g.id and gm.member_id = p.id)))
        or (g.kind = 'event' and g.special_event_id is not null and public.can_access_special_event(g.special_event_id))
      )
  );
$$;

create or replace function public.can_view_message(target_message_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.messages m
    where m.id = target_message_id
      and public.is_approved_member()
      and (
        m.sender_id = auth.uid()
        or m.recipient_id = auth.uid()
        or (m.group_id is not null and public.can_access_group(m.group_id))
      )
  );
$$;

revoke execute on function public.can_access_group(uuid) from anon;
revoke execute on function public.can_view_message(uuid) from anon;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.chat_message_reactions enable row level security;
alter table public.chat_read_states enable row level security;

create policy "Members read accessible groups"
  on public.groups for select
  to authenticated
  using (public.can_access_group(id) or public.is_admin() or (kind = 'event' and special_event_id is not null and public.can_manage_special_event(special_event_id)));

create policy "Admins create groups"
  on public.groups for insert
  to authenticated
  with check (public.is_admin() or (kind = 'event' and special_event_id is not null and public.can_manage_special_event(special_event_id)));

create policy "Admins update groups"
  on public.groups for update
  to authenticated
  using (public.is_admin() or (kind = 'event' and special_event_id is not null and public.can_manage_special_event(special_event_id)))
  with check (public.is_admin() or (kind = 'event' and special_event_id is not null and public.can_manage_special_event(special_event_id)));

create policy "Admins delete groups"
  on public.groups for delete
  to authenticated
  using (public.is_admin() and kind = 'custom');

create policy "Members read memberships of accessible groups"
  on public.group_members for select
  to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.can_access_group(group_id));

create policy "Admins add group members"
  on public.group_members for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins remove group members"
  on public.group_members for delete
  to authenticated
  using (public.is_admin());

create policy "Members read their conversations"
  on public.messages for select
  to authenticated
  using (
    public.is_approved_member()
    and (sender_id = auth.uid() or recipient_id = auth.uid() or (group_id is not null and public.can_access_group(group_id)))
  );

create policy "Members send messages"
  on public.messages for insert
  to authenticated
  with check (
    public.is_approved_member()
    and sender_id = auth.uid()
    and (
      (recipient_id is not null and exists (select 1 from public.member_profiles r where r.id = recipient_id and r.approved))
      or (group_id is not null and public.can_access_group(group_id))
    )
  );

-- Senders edit or soft-delete their own messages; admins can remove any.
create policy "Senders update own messages"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid() or public.is_admin())
  with check (sender_id = auth.uid() or public.is_admin());

create policy "Members read reactions"
  on public.chat_message_reactions for select
  to authenticated
  using (public.can_view_message(message_id));

create policy "Members react"
  on public.chat_message_reactions for insert
  to authenticated
  with check (member_id = auth.uid() and public.can_view_message(message_id));

create policy "Members change own reaction"
  on public.chat_message_reactions for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid() and public.can_view_message(message_id));

create policy "Members remove own reaction"
  on public.chat_message_reactions for delete
  to authenticated
  using (member_id = auth.uid());

create policy "Members read own read states"
  on public.chat_read_states for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members create own read states"
  on public.chat_read_states for insert
  to authenticated
  with check (
    member_id = auth.uid() and public.is_approved_member()
    and ((group_id is not null and public.can_access_group(group_id)) or direct_member_id is not null)
  );

create policy "Members update own read states"
  on public.chat_read_states for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- Unread counts for the chat list, the members nav badge, and the app badge.
create or replace function public.chat_unread_summary()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  with me as (
    select p.id from public.member_profiles p where p.id = auth.uid() and p.approved
  ),
  group_counts as (
    select m.group_id as conversation_id, count(*)::bigint as unread_count
    from me
    join public.groups g on g.archived_at is null and public.can_access_group(g.id)
    join public.messages m on m.group_id = g.id and m.sender_id <> me.id and m.deleted_at is null
    left join public.chat_read_states rs on rs.member_id = me.id and rs.group_id = m.group_id
    where rs.last_read_at is null or m.created_at > rs.last_read_at
    group by m.group_id
  ),
  direct_counts as (
    select m.sender_id as conversation_id, count(*)::bigint as unread_count
    from me
    join public.messages m on m.group_id is null and m.recipient_id = me.id and m.deleted_at is null
    left join public.chat_read_states rs on rs.member_id = me.id and rs.direct_member_id = m.sender_id
    where rs.last_read_at is null or m.created_at > rs.last_read_at
    group by m.sender_id
  )
  select jsonb_build_object(
    'total', coalesce((select sum(unread_count) from group_counts), 0) + coalesce((select sum(unread_count) from direct_counts), 0),
    'groups', coalesce((select jsonb_object_agg(conversation_id::text, unread_count) from group_counts), '{}'::jsonb),
    'direct', coalesce((select jsonb_object_agg(conversation_id::text, unread_count) from direct_counts), '{}'::jsonb)
  );
$$;

revoke all on function public.chat_unread_summary() from public, anon;
grant execute on function public.chat_unread_summary() to authenticated;

-- Conversation list: every direct-message partner with the latest message.
create or replace function public.direct_conversations()
returns table (
  member_id     uuid,
  last_body     text,
  last_type     text,
  last_at       timestamptz,
  last_sender_id uuid
)
language sql
security definer
set search_path = ''
stable
as $$
  select distinct on (partner)
    partner as member_id,
    case when m.deleted_at is null then m.body else '' end as last_body,
    m.message_type as last_type,
    m.created_at as last_at,
    m.sender_id as last_sender_id
  from (
    select m.*, case when m.sender_id = auth.uid() then m.recipient_id else m.sender_id end as partner
    from public.messages m
    where public.is_approved_member()
      and m.group_id is null
      and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
  ) m
  order by partner, m.created_at desc;
$$;

revoke all on function public.direct_conversations() from public, anon;
grant execute on function public.direct_conversations() to authenticated;

-- ===========================================================================
-- 7. Special event policies and RPCs
-- ===========================================================================

alter table public.special_events enable row level security;
alter table public.special_event_exclusions enable row level security;
alter table public.special_event_signup_items enable row level security;
alter table public.special_event_signups enable row level security;
alter table public.special_event_rsvps enable row level security;

create policy "Members read accessible events"
  on public.special_events for select
  to authenticated
  using (public.can_access_special_event(id));

create policy "Members create events"
  on public.special_events for insert
  to authenticated
  with check (public.is_approved_member() and created_by = auth.uid());

create policy "Organizers update events"
  on public.special_events for update
  to authenticated
  using (public.can_manage_special_event(id))
  with check (public.can_manage_special_event(id));

create policy "Organizers delete events"
  on public.special_events for delete
  to authenticated
  using (public.can_manage_special_event(id));

create policy "Organizers read exclusions"
  on public.special_event_exclusions for select
  to authenticated
  using (public.can_manage_special_event(event_id));

create policy "Organizers add exclusions"
  on public.special_event_exclusions for insert
  to authenticated
  with check (public.can_manage_special_event(event_id) and member_id <> auth.uid());

create policy "Organizers remove exclusions"
  on public.special_event_exclusions for delete
  to authenticated
  using (public.can_manage_special_event(event_id));

create policy "Participants read signup items"
  on public.special_event_signup_items for select
  to authenticated
  using (public.can_access_special_event(event_id));

create policy "Organizers manage signup items"
  on public.special_event_signup_items for insert
  to authenticated
  with check (public.can_manage_special_event(event_id));

create policy "Organizers update signup items"
  on public.special_event_signup_items for update
  to authenticated
  using (public.can_manage_special_event(event_id))
  with check (public.can_manage_special_event(event_id));

create policy "Organizers delete signup items"
  on public.special_event_signup_items for delete
  to authenticated
  using (public.can_manage_special_event(event_id));

create policy "Participants read signups"
  on public.special_event_signups for select
  to authenticated
  using (exists (
    select 1 from public.special_event_signup_items i
    where i.id = signup_item_id and public.can_access_special_event(i.event_id)
  ));

create policy "Participants sign up"
  on public.special_event_signups for insert
  to authenticated
  with check (member_id = auth.uid() and exists (
    select 1 from public.special_event_signup_items i
    where i.id = signup_item_id and public.is_special_event_participant(i.event_id, auth.uid())
  ));

create policy "Participants withdraw"
  on public.special_event_signups for delete
  to authenticated
  using (member_id = auth.uid() or exists (
    select 1 from public.special_event_signup_items i
    where i.id = signup_item_id and public.can_manage_special_event(i.event_id)
  ));

create policy "Participants read rsvps"
  on public.special_event_rsvps for select
  to authenticated
  using (public.can_access_special_event(event_id));

create policy "Participants rsvp"
  on public.special_event_rsvps for insert
  to authenticated
  with check (member_id = auth.uid() and public.is_special_event_participant(event_id, auth.uid()));

create policy "Participants update rsvp"
  on public.special_event_rsvps for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid() and public.is_special_event_participant(event_id, auth.uid()));

-- Signup capacity is enforced at claim time.
create or replace function public.claim_signup_item(target_item_id uuid, target_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.special_event_signup_items;
  taken integer;
begin
  select * into item from public.special_event_signup_items where id = target_item_id;
  if item.id is null or not public.is_special_event_participant(item.event_id, auth.uid()) then
    raise exception 'Event not found';
  end if;
  perform pg_advisory_xact_lock(hashtext(target_item_id::text));
  select count(*) into taken from public.special_event_signups where signup_item_id = target_item_id;
  if taken >= item.volunteers_needed
     and not exists (select 1 from public.special_event_signups where signup_item_id = target_item_id and member_id = auth.uid()) then
    raise exception 'That spot is already filled';
  end if;
  insert into public.special_event_signups (signup_item_id, member_id, note)
  values (target_item_id, auth.uid(), nullif(btrim(coalesce(target_note, '')), ''))
  on conflict (signup_item_id, member_id) do update set note = excluded.note;
end;
$$;

revoke all on function public.claim_signup_item(uuid, text) from public, anon;
grant execute on function public.claim_signup_item(uuid, text) to authenticated;

-- Invitee list with RSVP state, for organizers.
create or replace function public.special_event_invitees(target_event_id uuid)
returns table (
  member_id    uuid,
  full_name    text,
  photo        text,
  response     text,
  guest_count  integer,
  responded_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select p.id, p.full_name, p.photo, r.response, coalesce(r.guest_count, 0), r.updated_at
  from public.member_profiles p
  left join public.special_event_rsvps r on r.event_id = target_event_id and r.member_id = p.id
  where public.can_manage_special_event(target_event_id)
    and public.is_special_event_participant(target_event_id, p.id)
  order by p.full_name;
$$;

revoke all on function public.special_event_invitees(uuid) from public, anon;
grant execute on function public.special_event_invitees(uuid) to authenticated;

-- Every published event gets a chat group; the group follows the event.
create or replace function public.ensure_special_event_chat_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  gid uuid;
begin
  if new.status = 'published' and new.chat_group_id is null then
    insert into public.groups (name, description, kind, is_public, special_event_id, created_by)
    values (left(new.title, 80), 'Chat for everyone invited to this event.', 'event', false, new.id, new.created_by)
    returning id into gid;
    new.chat_group_id := gid;
  elsif new.chat_group_id is not null then
    update public.groups set name = left(new.title, 80), archived_at = new.archived_at where id = new.chat_group_id;
  end if;
  return new;
end;
$$;

create trigger special_events_chat_group
  before insert or update of title, status, archived_at on public.special_events
  for each row execute function public.ensure_special_event_chat_group();

-- ===========================================================================
-- 8. Members calendar (internal events) and service schedule
-- ===========================================================================

create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(btrim(title)) between 1 and 160),
  description text,
  location    text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  all_day     boolean not null default false,
  category    text not null default 'Fellowship'
              check (category in ('Worship', 'Bible Study', 'Fellowship', 'Outreach', 'Youth', 'Meeting', 'Other')),
  visibility  text not null default 'members' check (visibility in ('members', 'leaders')),
  recurring   text check (recurring is null or recurring in ('weekly', 'biweekly', 'monthly-weekday', 'monthly-date')),
  recurrence_ends_on date,
  created_by  uuid references public.member_profiles(id) on delete set null,
  updated_by  uuid references public.member_profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint calendar_events_time_check check (ends_at is null or ends_at >= starts_at)
);

create index if not exists calendar_events_start_idx on public.calendar_events (starts_at);

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "Members read member calendar events"
  on public.calendar_events for select
  to authenticated
  using (public.is_approved_member() and (visibility = 'members' or public.is_editor()));

create policy "Editors create calendar events"
  on public.calendar_events for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update calendar events"
  on public.calendar_events for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete calendar events"
  on public.calendar_events for delete
  to authenticated
  using (public.is_editor());

-- Service schedule: who serves in which role at each assembly. Entered by
-- hand from the monthly teaching schedule. One row per (date, assembly, duty).
create table if not exists public.service_assignments (
  id            uuid primary key default gen_random_uuid(),
  service_date  date not null,
  service_slot  text not null check (service_slot in ('sunday-am', 'sunday-pm', 'wednesday')),
  duty          text not null check (duty in (
                  'speaker', 'short_talk', 'communion', 'bible_class', 'song_leading', 'opening_prayer',
                  'closing_prayer', 'scripture_reading', 'announcements', 'other')),
  member_id     uuid references public.member_profiles(id) on delete set null,
  assignee_name text,
  notes         text,
  created_by    uuid references public.member_profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint service_assignments_unique unique (service_date, service_slot, duty),
  constraint service_assignments_someone check (member_id is not null or length(btrim(coalesce(assignee_name, ''))) > 0)
);

create index if not exists service_assignments_date_idx on public.service_assignments (service_date);

create trigger service_assignments_set_updated_at
  before update on public.service_assignments
  for each row execute function public.set_updated_at();

create table if not exists public.service_schedule_months (
  year          integer not null check (year between 2020 and 2100),
  month         integer not null check (month between 1 and 12),
  arranger_name text,
  notes         text,
  file_url      text,
  created_by    uuid references public.member_profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (year, month)
);

create trigger service_schedule_months_set_updated_at
  before update on public.service_schedule_months
  for each row execute function public.set_updated_at();

alter table public.service_assignments enable row level security;
alter table public.service_schedule_months enable row level security;

create policy "Members read service assignments"
  on public.service_assignments for select
  to authenticated
  using (public.is_approved_member());

create policy "Editors manage service assignments"
  on public.service_assignments for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update service assignments"
  on public.service_assignments for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete service assignments"
  on public.service_assignments for delete
  to authenticated
  using (public.is_editor());

create policy "Members read schedule months"
  on public.service_schedule_months for select
  to authenticated
  using (public.is_approved_member());

create policy "Editors manage schedule months"
  on public.service_schedule_months for insert
  to authenticated
  with check (public.is_editor());

create policy "Editors update schedule months"
  on public.service_schedule_months for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors delete schedule months"
  on public.service_schedule_months for delete
  to authenticated
  using (public.is_editor());

-- ===========================================================================
-- 9. Communion preparation signup (one household per month)
-- ===========================================================================

create table if not exists public.communion_signups (
  id           uuid primary key default gen_random_uuid(),
  signup_year  integer not null check (signup_year between 2020 and 2100),
  signup_month integer not null check (signup_month between 1 and 12),
  member_id    uuid not null references public.member_profiles(id) on delete cascade,
  notes        text,
  created_by   uuid references public.member_profiles(id) on delete set null,
  removed_at   timestamptz,
  removed_by   uuid references public.member_profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists communion_signups_active_month_idx
  on public.communion_signups (signup_year, signup_month) where removed_at is null;

create trigger communion_signups_set_updated_at
  before update on public.communion_signups
  for each row execute function public.set_updated_at();

create table if not exists public.communion_signup_reminders (
  communion_signup_id uuid not null references public.communion_signups(id) on delete cascade,
  reminder_type       text not null check (reminder_type in ('month_starts_tomorrow', 'week_before')),
  sent_at             timestamptz not null default now(),
  primary key (communion_signup_id, reminder_type)
);

alter table public.communion_signups enable row level security;
alter table public.communion_signup_reminders enable row level security;

create policy "Members read active communion signups"
  on public.communion_signups for select
  to authenticated
  using (public.is_approved_member() and (removed_at is null or member_id = auth.uid() or public.is_editor()));

create policy "Members claim a month"
  on public.communion_signups for insert
  to authenticated
  with check (
    public.is_approved_member()
    and created_by = auth.uid()
    and (member_id = auth.uid() or public.is_editor())
  );

create policy "Members release own month"
  on public.communion_signups for update
  to authenticated
  using (member_id = auth.uid() or public.is_editor())
  with check (member_id = auth.uid() or public.is_editor());

create policy "Editors read communion reminders"
  on public.communion_signup_reminders for select
  to authenticated
  using (public.is_editor());

-- ===========================================================================
-- 10. In-app notifications
-- ===========================================================================

create table if not exists public.notification_preferences (
  member_id         uuid primary key references public.member_profiles(id) on delete cascade,
  direct_messages   boolean not null default true,
  group_messages    boolean not null default true,
  announcements     boolean not null default true,
  calendar          boolean not null default true,
  special_events    boolean not null default true,
  admin_new_member  boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table if not exists public.group_notification_preferences (
  member_id  uuid not null references public.member_profiles(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (member_id, group_id)
);

create table if not exists public.in_app_notifications (
  id                uuid primary key default gen_random_uuid(),
  recipient_id      uuid not null references public.member_profiles(id) on delete cascade,
  notification_type text not null check (notification_type ~ '^[a-z][a-z0-9_]{1,79}$'),
  event_key         text not null check (length(btrim(event_key)) between 1 and 240),
  title             text not null,
  body              text not null default '',
  destination_url   text not null check (destination_url ~ '^/([^/]|$)'),
  entity_type       text,
  entity_id         uuid,
  created_at        timestamptz not null default now(),
  read_at           timestamptz,
  constraint in_app_notifications_recipient_event_unique unique (recipient_id, notification_type, event_key)
);

create index if not exists in_app_notifications_recipient_idx
  on public.in_app_notifications (recipient_id, created_at desc);
create index if not exists in_app_notifications_unread_idx
  on public.in_app_notifications (recipient_id, created_at desc) where read_at is null;

alter table public.notification_preferences enable row level security;
alter table public.group_notification_preferences enable row level security;
alter table public.in_app_notifications enable row level security;

create policy "Members read own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members create own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "Members read own group preferences"
  on public.group_notification_preferences for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members create own group preferences"
  on public.group_notification_preferences for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update own group preferences"
  on public.group_notification_preferences for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "Members read own notifications"
  on public.in_app_notifications for select
  to authenticated
  using (recipient_id = auth.uid());

-- Writes go through the definer helpers below; members never insert directly.

create or replace function public.mark_notification_read(target_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.in_app_notifications
  set read_at = coalesce(read_at, now())
  where id = target_id and recipient_id = auth.uid();
$$;

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.in_app_notifications
  set read_at = now()
  where recipient_id = auth.uid() and read_at is null;
$$;

revoke all on function public.mark_notification_read(uuid) from public, anon;
revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- Upsert a notification for one member. A repeat of the same (type, key)
-- refreshes the row and marks it unread again, so a busy group chat shows one
-- "new messages" entry instead of dozens. Preferences are honored here.
create or replace function public.notify_member(
  target_recipient uuid,
  target_type text,
  target_key text,
  target_title text,
  target_body text,
  target_url text,
  target_entity_type text default null,
  target_entity_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefs public.notification_preferences;
  allowed boolean := true;
begin
  select * into prefs from public.notification_preferences where member_id = target_recipient;
  if prefs.member_id is not null then
    allowed := case target_type
      when 'direct_message'   then prefs.direct_messages
      when 'group_message'    then prefs.group_messages
      when 'announcement'     then prefs.announcements
      when 'calendar_event'   then prefs.calendar
      when 'special_event'    then prefs.special_events
      when 'special_event_rsvp' then prefs.special_events
      when 'member_pending'   then prefs.admin_new_member
      else true end;
  end if;
  if not allowed then return; end if;

  insert into public.in_app_notifications
    (recipient_id, notification_type, event_key, title, body, destination_url, entity_type, entity_id)
  values
    (target_recipient, target_type, target_key, left(target_title, 160), left(coalesce(target_body, ''), 400),
     target_url, target_entity_type, target_entity_id)
  on conflict (recipient_id, notification_type, event_key) do update
    set title = excluded.title,
        body = excluded.body,
        destination_url = excluded.destination_url,
        created_at = now(),
        read_at = null;
end;
$$;

revoke all on function public.notify_member(uuid, text, text, text, text, text, text, uuid) from public, anon, authenticated;

-- Members who can currently see a group (for fan-out).
create or replace function public.group_audience(target_group_id uuid)
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select p.id
  from public.groups g
  join public.member_profiles p on p.approved
  where g.id = target_group_id
    and g.archived_at is null
    and (
      g.kind = 'congregation'
      or (g.kind = 'men' and p.gender = 'male')
      or (g.kind = 'women' and p.gender = 'female')
      or (g.kind = 'custom' and (g.is_public or exists (
            select 1 from public.group_members gm where gm.group_id = g.id and gm.member_id = p.id)))
      or (g.kind = 'event' and g.special_event_id is not null and public.is_special_event_participant(g.special_event_id, p.id))
    );
$$;

revoke all on function public.group_audience(uuid) from public, anon, authenticated;

-- New message -> the other party (direct) or everyone else in the group.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
  preview text;
  grp public.groups;
  recipient uuid;
begin
  select coalesce(nullif(btrim(full_name), ''), 'A member') into sender_name from public.member_profiles where id = new.sender_id;
  preview := case when new.message_type = 'image' then 'Sent a photo' else left(new.body, 140) end;

  if new.recipient_id is not null then
    perform public.notify_member(
      new.recipient_id, 'direct_message', new.sender_id::text,
      sender_name, preview, '/members/chat/direct/' || new.sender_id::text, 'member', new.sender_id);
  elsif new.group_id is not null then
    select * into grp from public.groups where id = new.group_id;
    for recipient in
      select a from public.group_audience(new.group_id) a
      where a <> new.sender_id
        and coalesce((select enabled from public.group_notification_preferences gp
                      where gp.member_id = a and gp.group_id = new.group_id), true)
    loop
      perform public.notify_member(
        recipient, 'group_message', new.group_id::text,
        grp.name, sender_name || ': ' || preview, '/members/chat/group/' || new.group_id::text, 'group', new.group_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- Announcement published -> every approved member except the author.
create or replace function public.notify_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if not new.published or new.publish_date > current_date then return new; end if;
  if tg_op = 'UPDATE' and old.published and old.title = new.title then return new; end if;
  for recipient in select id from public.member_profiles where approved and id is distinct from new.created_by loop
    perform public.notify_member(
      recipient, 'announcement', new.id::text,
      new.title, left(new.body, 140), '/members#announcement-' || new.id::text, 'announcement', new.id);
  end loop;
  return new;
end;
$$;

create trigger announcements_notify
  after insert or update of published, title on public.announcements
  for each row execute function public.notify_announcement();

-- Special event published (or audience widened) -> every participant.
create or replace function public.notify_special_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  organizer text;
begin
  if new.status <> 'published' or new.archived_at is not null then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'published' and old.audience = new.audience and old.starts_at is not distinct from new.starts_at then
    return new;
  end if;
  select coalesce(nullif(btrim(full_name), ''), 'A member') into organizer from public.member_profiles where id = new.created_by;
  for recipient in
    select p.id from public.member_profiles p
    where p.id <> new.created_by and public.is_special_event_participant(new.id, p.id)
  loop
    perform public.notify_member(
      recipient, 'special_event', new.id::text,
      case when tg_op = 'INSERT' or old.status <> 'published' then 'You are invited: ' || new.title else 'Updated: ' || new.title end,
      'From ' || organizer, '/members/events/' || new.id::text, 'special_event', new.id);
  end loop;
  return new;
end;
$$;

create trigger special_events_notify
  after insert or update of status, audience, starts_at, archived_at on public.special_events
  for each row execute function public.notify_special_event();

-- RSVP -> the organizer.
create or replace function public.notify_special_event_rsvp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev public.special_events;
  who text;
begin
  select * into ev from public.special_events where id = new.event_id;
  if ev.created_by = new.member_id then return new; end if;
  select coalesce(nullif(btrim(full_name), ''), 'A member') into who from public.member_profiles where id = new.member_id;
  perform public.notify_member(
    ev.created_by, 'special_event_rsvp', new.event_id::text || ':' || new.member_id::text,
    who || case new.response when 'yes' then ' is coming' when 'maybe' then ' might come' else ' cannot come' end,
    ev.title, '/members/events/' || ev.id::text, 'special_event', ev.id);
  return new;
end;
$$;

create trigger special_event_rsvps_notify
  after insert or update of response on public.special_event_rsvps
  for each row execute function public.notify_special_event_rsvp();

-- New calendar event for members -> every approved member except the author.
create or replace function public.notify_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if new.visibility <> 'members' then return new; end if;
  for recipient in select id from public.member_profiles where approved and id is distinct from new.created_by loop
    perform public.notify_member(
      recipient, 'calendar_event', new.id::text,
      'Added to the calendar: ' || new.title,
      to_char(new.starts_at at time zone 'America/Chicago', 'FMDay, FMMonth FMDD'),
      '/members/calendar?date=' || to_char(new.starts_at at time zone 'America/Chicago', 'YYYY-MM-DD'), 'calendar_event', new.id);
  end loop;
  return new;
end;
$$;

create trigger calendar_events_notify
  after insert on public.calendar_events
  for each row execute function public.notify_calendar_event();

-- New signup -> admins; approval -> the member.
create or replace function public.notify_membership_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if tg_op = 'INSERT' then
    for recipient in select id from public.member_profiles where approved and role = 'admin' loop
      perform public.notify_member(
        recipient, 'member_pending', new.id::text,
        'New member request', coalesce(nullif(btrim(new.full_name), ''), new.email) || ' is waiting for approval.',
        '/members/admin/members', 'member', new.id);
    end loop;
  elsif new.approved and not old.approved then
    perform public.notify_member(
      new.id, 'member_approved', new.id::text,
      'Welcome to the members area', 'Your access has been approved. Take a minute to finish your profile.',
      '/members/profile', 'member', new.id);
    -- Clear the admins' pending notice for this member.
    update public.in_app_notifications set read_at = coalesce(read_at, now())
    where notification_type = 'member_pending' and event_key = new.id::text;
  end if;
  return new;
end;
$$;

create trigger member_profiles_notify
  after insert or update of approved on public.member_profiles
  for each row execute function public.notify_membership_changes();

-- Communion signup -> editors (so the person arranging the schedule knows).
create or replace function public.notify_communion_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who text;
  recipient uuid;
  label text;
begin
  select coalesce(nullif(btrim(full_name), ''), 'A member') into who from public.member_profiles where id = new.member_id;
  label := to_char(make_date(new.signup_year, new.signup_month, 1), 'FMMonth YYYY');
  for recipient in select id from public.member_profiles where approved and role in ('editor', 'admin') and id <> new.created_by loop
    perform public.notify_member(
      recipient, 'communion_signup', new.id::text,
      'Communion preparation: ' || label, who || ' signed up.', '/members/communion', 'communion_signup', new.id);
  end loop;
  return new;
end;
$$;

create trigger communion_signups_notify
  after insert on public.communion_signups
  for each row execute function public.notify_communion_signup();

-- Cron entry point (service role only): remind next month's household.
create or replace function public.send_communion_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'America/Chicago')::date;
  target date;
  sent integer := 0;
  row_rec record;
  kind text;
begin
  for kind in select unnest(array['month_starts_tomorrow', 'week_before']) loop
    target := case kind when 'month_starts_tomorrow' then today + 1 else today + 7 end;
    if extract(day from target) <> 1 then continue; end if;
    for row_rec in
      select s.* from public.communion_signups s
      join public.member_profiles p on p.id = s.member_id and p.approved
      where s.removed_at is null
        and s.signup_year = extract(year from target)::int
        and s.signup_month = extract(month from target)::int
        and not exists (select 1 from public.communion_signup_reminders r where r.communion_signup_id = s.id and r.reminder_type = kind)
    loop
      perform public.notify_member(
        row_rec.member_id, 'communion_reminder', row_rec.id::text || ':' || kind,
        'Communion preparation reminder',
        'You are preparing communion for ' || to_char(target, 'FMMonth YYYY') ||
          case kind when 'month_starts_tomorrow' then ', which starts tomorrow.' else ', starting in one week.' end,
        '/members/communion', 'communion_signup', row_rec.id);
      insert into public.communion_signup_reminders (communion_signup_id, reminder_type) values (row_rec.id, kind);
      sent := sent + 1;
    end loop;
  end loop;
  return sent;
end;
$$;

revoke all on function public.send_communion_reminders() from public, anon, authenticated;
grant execute on function public.send_communion_reminders() to service_role;

-- ===========================================================================
-- 11. Installed-app detection (admin readiness dashboard)
-- ===========================================================================

create table if not exists public.installed_app_detections (
  member_id           uuid primary key references public.member_profiles(id) on delete cascade,
  platform_category   text not null default 'Other' check (platform_category in ('iOS', 'Android', 'Windows', 'macOS', 'Other')),
  standalone_detected boolean not null default true,
  first_detected_at   timestamptz not null default now(),
  last_detected_at    timestamptz not null default now()
);

alter table public.installed_app_detections enable row level security;

create policy "Members and admins read installed app detections"
  on public.installed_app_detections for select
  to authenticated
  using (member_id = auth.uid() or public.is_admin());

create policy "Members record own installed app detection"
  on public.installed_app_detections for insert
  to authenticated
  with check (member_id = auth.uid() and public.is_approved_member());

create policy "Members update own installed app detection"
  on public.installed_app_detections for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- ===========================================================================
-- 12. Storage: member photos (public) and chat photos (private)
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('member-photos', 'member-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('chat-media', 'chat-media', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Photo paths are namespaced by owner: members/<uid>/..., families/<family>/..., children/<family>/...
create policy "Public read member photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'member-photos');

create policy "Members upload own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-photos' and public.is_approved_member()
    and (
      (storage.foldername(name))[1] = 'members' and (storage.foldername(name))[2] = auth.uid()::text
      or ((storage.foldername(name))[1] in ('families', 'children') and public.is_family_member(((storage.foldername(name))[2])::uuid))
      or ((storage.foldername(name))[1] = 'events' and public.can_manage_special_event(((storage.foldername(name))[2])::uuid))
      or public.is_editor()
    )
  );

create policy "Members update own photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-photos' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'member-photos' and (owner = auth.uid() or public.is_admin()));

create policy "Members delete own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-photos' and (owner = auth.uid() or public.is_admin()));

-- Chat media: uploads land under <uid>/...; reads are served through signed
-- URLs minted by the server after the message policy has been checked.
create policy "Members upload chat media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-media' and public.is_approved_member() and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Members read chat media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-media' and public.is_approved_member());

create policy "Members delete own chat media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-media' and (owner = auth.uid() or public.is_admin()));

-- ===========================================================================
-- 13. Realtime
-- ===========================================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
    alter publication supabase_realtime add table public.chat_message_reactions;
    alter publication supabase_realtime add table public.chat_read_states;
    alter publication supabase_realtime add table public.in_app_notifications;
  end if;
exception
  when duplicate_object then null;
end
$$;

-- Realtime payloads for updates/deletes carry the full old row.
alter table public.messages replica identity full;
alter table public.chat_message_reactions replica identity full;
alter table public.in_app_notifications replica identity full;

-- ===========================================================================
-- 14. Grants: new tables follow the existing anon/authenticated model
-- ===========================================================================

revoke all on public.families, public.family_children, public.groups, public.group_members, public.messages,
  public.chat_message_reactions, public.chat_read_states, public.special_events, public.special_event_exclusions,
  public.special_event_signup_items, public.special_event_signups, public.special_event_rsvps,
  public.calendar_events, public.service_assignments, public.service_schedule_months,
  public.communion_signups, public.communion_signup_reminders, public.notification_preferences,
  public.group_notification_preferences, public.in_app_notifications, public.installed_app_detections
  from anon;
