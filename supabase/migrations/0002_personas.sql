-- 데모 로그인: 익명 세션 → 페르소나 프로필
-- 권한 판단은 auth.uid()가 아니라 지금 세션이 고른 프로필(me())로 한다.

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

create table public.persona_sessions (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index persona_sessions_profile_idx on public.persona_sessions (profile_id);
alter table public.persona_sessions enable row level security;
create policy "own session" on public.persona_sessions for select to authenticated
  using (auth_user_id = (select auth.uid()));

create or replace function public.me()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select profile_id from public.persona_sessions where auth_user_id = (select auth.uid());
$$;

create or replace function public.choose_persona(p_role text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_profile uuid;
begin
  if (select auth.uid()) is null then raise exception '로그인이 필요해요'; end if;
  select id into v_profile from public.profiles where demo_role = p_role;
  if v_profile is null then raise exception '없는 데모 역할이에요'; end if;
  insert into public.persona_sessions (auth_user_id, profile_id) values ((select auth.uid()), v_profile)
  on conflict (auth_user_id) do update set profile_id = excluded.profile_id, created_at = now();
  return v_profile;
end;
$$;

-- 권한 헬퍼
create or replace function public.is_org_officer(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = public.me()
      and m.active and m.role in ('president', 'officer')
  );
$$;

create or replace function public.is_org_president(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = public.me()
      and m.active and m.role = 'president'
  );
$$;

create or replace function public.is_any_officer()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = public.me() and m.active and m.role in ('president', 'officer')
  );
$$;

-- 본인 기준 정책
alter policy "read own or as officer" on public.profiles
  using (id = (select public.me()) or (select public.is_any_officer()));
alter policy "update own profile" on public.profiles
  using (id = (select public.me())) with check (id = (select public.me()));
alter policy "own saves" on public.saves
  using (user_id = (select public.me())) with check (user_id = (select public.me()));
alter policy "read own or org applications" on public.applications
  using (user_id = (select public.me())
         or exists (select 1 from public.events e where e.id = event_id and (select public.is_org_officer(e.org_id))));
alter policy "officers write notes" on public.handover_notes
  with check (author_id = (select public.me())
              and exists (select 1 from public.event_series s where s.id = series_id and (select public.is_org_officer(s.org_id))));
alter policy "read own or org rentals" on public.rentals
  using (user_id = (select public.me()) or (select public.is_org_officer(org_id)));

-- RPC
create or replace function public.apply_event(p_event uuid, p_option uuid)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.me();
  v_event public.events%rowtype;
  v_profile public.profiles%rowtype;
  v_option public.event_options%rowtype;
  v_seq int;
begin
  if v_uid is null then raise exception '로그인이 필요해요'; end if;

  select * into v_event from public.events where id = p_event for update;
  if not found or v_event.status <> 'published' then raise exception '신청할 수 없는 행사예요'; end if;
  if v_event.opens_at is not null and now() < v_event.opens_at then raise exception '아직 신청이 열리지 않았어요'; end if;
  if v_event.pickup_starts_at is not null and now() > v_event.pickup_starts_at then raise exception '신청 기간이 끝났어요'; end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_event.audience = 'department' and not exists (
    select 1 from public.orgs o where o.id = v_event.org_id and o.department_id = v_profile.department_id
  ) then raise exception '이 학과 학생만 신청할 수 있어요'; end if;

  if exists (select 1 from public.applications a where a.event_id = p_event and a.user_id = v_uid) then
    raise exception '이미 신청했어요';
  end if;

  select * into v_option from public.event_options where id = p_option and event_id = p_event for update;
  if not found then raise exception '메뉴를 다시 골라주세요'; end if;
  if v_option.taken >= v_option.quantity then raise exception '이 메뉴는 다 나갔어요'; end if;

  v_seq := v_event.applied_count + 1;
  update public.events set applied_count = v_seq where id = p_event;
  update public.event_options
     set taken = taken + 1,
         sold_out_at = case when taken + 1 >= quantity then now() else sold_out_at end
   where id = p_option;
  insert into public.applications (event_id, option_id, user_id, seq) values (p_event, p_option, v_uid, v_seq);
  return v_seq;
end;
$$;

create or replace function public.check_pickup(p_application uuid, p_undo boolean default false)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid;
begin
  select e.org_id into v_org from public.applications a join public.events e on e.id = a.event_id where a.id = p_application;
  if v_org is null or not public.is_org_officer(v_org) then raise exception '권한이 없어요'; end if;
  if p_undo then
    update public.applications set picked_up_at = null, picked_up_by = null where id = p_application;
  else
    update public.applications set picked_up_at = coalesce(picked_up_at, now()), picked_up_by = coalesce(picked_up_by, public.me())
     where id = p_application;
  end if;
end;
$$;

create or replace function public.lend_item(p_item uuid, p_user uuid, p_qty int)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_item public.rental_items%rowtype; v_out int; v_id uuid;
begin
  select * into v_item from public.rental_items where id = p_item for update;
  if not found or not public.is_org_officer(v_item.org_id) then raise exception '권한이 없어요'; end if;
  if v_item.kind <> 'rental' then raise exception '대여 물품이 아니에요'; end if;
  select coalesce(sum(qty), 0) into v_out from public.rentals where item_id = p_item and returned_at is null;
  if v_item.total - v_out < p_qty then raise exception '남은 개수가 부족해요'; end if;
  insert into public.rentals (item_id, org_id, user_id, qty, lent_by)
  values (p_item, v_item.org_id, p_user, p_qty, public.me()) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.return_rental(p_rental uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid;
begin
  select org_id into v_org from public.rentals where id = p_rental;
  if v_org is null or not public.is_org_officer(v_org) then raise exception '권한이 없어요'; end if;
  update public.rentals set returned_at = now(), returned_by = public.me()
   where id = p_rental and returned_at is null;
end;
$$;

create or replace function public.dispute_rental(p_rental uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.rentals set disputed_at = now() where id = p_rental and user_id = public.me();
$$;

create or replace function public.give_consumable(p_item uuid, p_user uuid, p_qty int)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_item public.rental_items%rowtype;
begin
  select * into v_item from public.rental_items where id = p_item for update;
  if not found or not public.is_org_officer(v_item.org_id) then raise exception '권한이 없어요'; end if;
  if v_item.kind <> 'consumable' then raise exception '소모품이 아니에요'; end if;
  if v_item.stock < p_qty then raise exception '남은 개수가 부족해요'; end if;
  update public.rental_items set stock = stock - p_qty where id = p_item;
  insert into public.consumable_logs (item_id, org_id, user_id, qty, given_by)
  values (p_item, v_item.org_id, p_user, p_qty, public.me());
end;
$$;

-- 데모: 다른 학생들의 신청이 실시간으로 들어오는 장면
create or replace function public.demo_simulate_applications(p_event uuid, p_count int default 3)
returns int
language plpgsql security definer set search_path = ''
as $$
declare v_event public.events%rowtype; r record; v_opt uuid; n int := 0;
begin
  select * into v_event from public.events where id = p_event for update;
  if not found or not public.is_org_officer(v_event.org_id) then raise exception '권한이 없어요'; end if;
  if v_event.status <> 'published' then raise exception '진행 중인 행사가 아니에요'; end if;
  for r in
    select p.id from public.profiles p join public.orgs o on o.id = v_event.org_id
    where p.department_id = o.department_id and p.demo_role is null
      and not exists (select 1 from public.applications a where a.event_id = p_event and a.user_id = p.id)
    order by random() limit greatest(1, least(p_count, 10))
  loop
    select o.id into v_opt from public.event_options o
     where o.event_id = p_event and o.taken < o.quantity order by random() limit 1 for update;
    exit when v_opt is null;
    update public.events set applied_count = applied_count + 1 where id = p_event returning applied_count into v_event.applied_count;
    update public.event_options set taken = taken + 1,
           sold_out_at = case when taken + 1 >= quantity then now() else sold_out_at end where id = v_opt;
    insert into public.applications (event_id, option_id, user_id, seq) values (p_event, v_opt, r.id, v_event.applied_count);
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke execute on function public.me, public.choose_persona, public.demo_simulate_applications from public, anon;
grant execute on function public.me, public.choose_persona, public.demo_simulate_applications to authenticated;
