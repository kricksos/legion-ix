drop function if exists public.approve_member_request(uuid, boolean);

create or replace function public.approve_member_request(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_required' using errcode = '42501';
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
end;
$$;

revoke all on function public.approve_member_request(uuid) from public;
grant execute on function public.approve_member_request(uuid) to authenticated;

create function public.get_approved_members()
returns table (
  user_id uuid,
  display_name text,
  email text,
  created_at timestamptz,
  email_confirmed boolean,
  is_admin boolean
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
      auth_user.email_confirmed_at is not null,
      exists (
        select 1
        from public.user_roles as role_row
        where role_row.user_id = profile.id
          and role_row.role = 'admin'
      )
    from public.profiles as profile
    join auth.users as auth_user on auth_user.id = profile.id
    where profile.membership_status = 'approved'
    order by profile.created_at desc;
end;
$$;

revoke all on function public.get_approved_members() from public;
grant execute on function public.get_approved_members() to authenticated;

create function public.set_user_admin_role(p_user_id uuid)
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

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
      and membership_status = 'approved'
  ) then
    raise exception 'member_approval_required' using errcode = '42501';
  end if;

  select email_confirmed_at
    into v_email_confirmed_at
    from auth.users
    where id = p_user_id;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  if v_email_confirmed_at is null then
    raise exception 'email_not_confirmed' using errcode = '42501';
  end if;

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

revoke all on function public.set_user_admin_role(uuid) from public;
grant execute on function public.set_user_admin_role(uuid) to authenticated;
