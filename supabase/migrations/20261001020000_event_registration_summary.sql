create function public.get_event_registration_count(p_event_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(registration.id)::bigint
  from public.events as event
  left join public.event_registrations as registration
    on registration.event_id = event.id
   and registration.status = 'registered'
  where event.id = p_event_id
    and event.status = 'published';
$$;

revoke all on function public.get_event_registration_count(uuid) from public;
grant execute on function public.get_event_registration_count(uuid) to anon, authenticated;

create function public.get_event_participants(p_event_id uuid)
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
grant execute on function public.get_event_participants(uuid) to authenticated;create function public.get_event_registration_count(p_event_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(registration.id)::bigint
  from public.events as event
  left join public.event_registrations as registration
    on registration.event_id = event.id
   and registration.status = 'registered'
  where event.id = p_event_id
    and event.status = 'published';
$$;

revoke all on function public.get_event_registration_count(uuid) from public;
grant execute on function public.get_event_registration_count(uuid) to anon, authenticated;

create function public.get_event_participants(p_event_id uuid)
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