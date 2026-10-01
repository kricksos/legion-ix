create type public.event_status as enum ('draft', 'published', 'cancelled');
create type public.album_status as enum ('draft', 'published', 'archived');
create type public.registration_status as enum ('registered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create policy profiles_read_self_or_admin
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy user_roles_read_self_or_admin
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (length(trim(slug)) > 0),
  description text not null default '',
  starts_at timestamptz,
  location_name text not null default '',
  location_details text not null default '',
  capacity integer check (capacity is null or capacity > 0),
  status public.event_status not null default 'draft',
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_published_schedule_idx
  on public.events (starts_at asc nulls last)
  where status = 'published';

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy events_read_published_or_admin
  on public.events for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy events_admin_manage
  on public.events for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (event_id, user_id)
);

create index event_registrations_event_status_idx
  on public.event_registrations (event_id, status);

alter table public.event_registrations enable row level security;

create policy registrations_read_self_or_admin
  on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy registrations_admin_manage
  on public.event_registrations for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.event_registrations to authenticated;

create function public.register_for_event(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_capacity integer;
  v_registration_count integer;
  v_registration_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select capacity
    into v_capacity
    from public.events
    where id = p_event_id and status = 'published'
    for update;

  if not found then
    raise exception 'event_not_open' using errcode = 'P0002';
  end if;

  select id
    into v_registration_id
    from public.event_registrations
    where event_id = p_event_id
      and user_id = v_user_id
      and status = 'registered';

  if found then
    return v_registration_id;
  end if;

  if v_capacity is not null then
    select count(*)
      into v_registration_count
      from public.event_registrations
      where event_id = p_event_id and status = 'registered';

    if v_registration_count >= v_capacity then
      raise exception 'event_full' using errcode = 'P0001';
    end if;
  end if;

  insert into public.event_registrations (event_id, user_id, status, registered_at, cancelled_at)
  values (p_event_id, v_user_id, 'registered', now(), null)
  on conflict (event_id, user_id) do update
    set status = 'registered', registered_at = now(), cancelled_at = null
  returning id into v_registration_id;

  return v_registration_id;
end;
$$;

revoke all on function public.register_for_event(uuid) from public;
grant execute on function public.register_for_event(uuid) to authenticated;

create function public.cancel_my_event_registration(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  update public.event_registrations
    set status = 'cancelled', cancelled_at = now()
    where event_id = p_event_id
      and user_id = auth.uid()
      and status = 'registered';

  return found;
end;
$$;

revoke all on function public.cancel_my_event_registration(uuid) from public;
grant execute on function public.cancel_my_event_registration(uuid) to authenticated;

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (length(trim(slug)) > 0),
  description text not null default '',
  occurred_on date,
  status public.album_status not null default 'draft',
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index albums_published_recent_idx
  on public.albums (created_at desc)
  where status = 'published';

create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

create table public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '',
  sort_order integer not null default 0,
  uploaded_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index album_photos_album_order_idx
  on public.album_photos (album_id, sort_order, created_at);

alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

create policy albums_read_published_or_admin
  on public.albums for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy albums_admin_manage
  on public.albums for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy album_photos_read_published_or_admin
  on public.album_photos for select to anon, authenticated
  using (
    exists (
      select 1
      from public.albums
      where albums.id = album_photos.album_id
        and (albums.status = 'published' or (select public.is_admin()))
    )
  );

create policy album_photos_admin_manage
  on public.album_photos for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.albums, public.album_photos to anon, authenticated;
grant insert, update, delete on public.albums, public.album_photos to authenticated;

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('mission-photos', 'mission-photos', false, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      allowed_mime_types = excluded.allowed_mime_types;

create policy mission_photos_read_published_or_admin
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'mission-photos'
    and (
      (select public.is_admin())
      or exists (
        select 1
        from public.album_photos
        join public.albums on albums.id = album_photos.album_id
        where album_photos.storage_path = storage.objects.name
          and albums.status = 'published'
      )
    )
  );

create policy mission_photos_admin_upload
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mission-photos' and (select public.is_admin()));

create policy mission_photos_admin_update
  on storage.objects for update to authenticated
  using (bucket_id = 'mission-photos' and (select public.is_admin()))
  with check (bucket_id = 'mission-photos' and (select public.is_admin()));

create policy mission_photos_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'mission-photos' and (select public.is_admin()));