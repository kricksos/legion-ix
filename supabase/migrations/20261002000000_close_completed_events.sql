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
    where id = p_event_id
      and status = 'published'
      and (
        starts_at is null
        or (starts_at at time zone 'Europe/Madrid')::date >= (now() at time zone 'Europe/Madrid')::date
      )
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
