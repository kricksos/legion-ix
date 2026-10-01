alter table public.profiles
  add column membership_status text not null default 'approved'
    check (membership_status in ('pending', 'approved', 'rejected')),
  add column membership_reviewed_at timestamptz,
  add column membership_reviewed_by uuid references public.profiles (id) on delete set null;

alter table public.profiles
  alter column membership_status set default 'pending';

create function public.get_pending_member_requests()
returns table (
  user_id uuid,
  display_name text,
  email text,
  created_at timestamptz,
  email_confirmed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  return query
    select
      profile.id,
      profile.display_name,
      auth_user.email::text,
      profile.created_at,
      auth_user.email_confirmed_at is not null
    from public.profiles as profile
    join auth.users as auth_user on auth_user.id = profile.id
    where profile.membership_status = 'pending'
    order by profile.created_at desc;
end;
$$;

revoke all on function public.get_pending_member_requests() from public;
grant execute on function public.get_pending_member_requests() to authenticated;

create function public.approve_member_request(p_user_id uuid, p_make_admin boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email_confirmed_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select email_confirmed_at
    into v_email_confirmed_at
    from auth.users
    where id = p_user_id;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  if p_make_admin and v_email_confirmed_at is null then
    raise exception 'email_not_confirmed' using errcode = '42501';
  end if;

  update public.profiles
    set membership_status = 'approved',
        membership_reviewed_at = now(),
        membership_reviewed_by = auth.uid()
    where id = p_user_id
      and membership_status = 'pending';

  if not found then
    raise exception 'member_request_not_pending' using errcode = 'P0002';
  end if;

  if p_make_admin then
    insert into public.user_roles (user_id, role)
    values (p_user_id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
end;
$$;

revoke all on function public.approve_member_request(uuid, boolean) from public;
grant execute on function public.approve_member_request(uuid, boolean) to authenticated;

create or replace function public.register_for_event(p_event_id uuid)
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

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and membership_status = 'approved'
  ) then
    raise exception 'member_approval_required' using errcode = '42501';
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

create or replace function public.get_event_participants(p_event_id uuid)
returns table (display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and membership_status = 'approved'
  ) then
    raise exception 'member_approval_required' using errcode = '42501';
  end if;

  return query
    select coalesce(nullif(trim(profile.display_name), ''), 'Recluta')
    from public.event_registrations as registration
    join public.profiles as profile on profile.id = registration.user_id
    join public.events as event on event.id = registration.event_id
    where registration.event_id = p_event_id
      and registration.status = 'registered'
      and event.status = 'published'
    order by registration.registered_at asc;
end;
$$;

revoke all on function public.get_event_participants(uuid) from public;
grant execute on function public.get_event_participants(uuid) to authenticated;
