-- UCC web: core schema, RLS, and RPCs
-- 발견(opportunities) · 운영(events, rentals) · 전승(series, handover_notes, terms)

create type public.org_kind as enum ('council', 'club');
create type public.member_role as enum ('president', 'officer', 'member');
create type public.event_kind as enum ('giveaway', 'signup', 'notice');
create type public.event_status as enum ('draft', 'published', 'finished');
create type public.item_kind as enum ('rental', 'consumable', 'fixture');

-- ───────────── 학과 · 사람 ─────────────
create table public.departments (
  id text primary key,
  name text not null,
  short_name text not null,
  college text not null,
  sort int not null default 0
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  student_no text not null,
  department_id text not null references public.departments (id),
  grade int not null check (grade between 1 and 5),
  phone text,
  interests text[] not null default '{}',
  wants text[] not null default '{}',
  skills text[] not null default '{}',
  epic jsonb not null default '{"total":0,"recognized":0,"language":0}',
  demo_role text,
  created_at timestamptz not null default now()
);
create index profiles_department_idx on public.profiles (department_id);
create index profiles_student_no_idx on public.profiles (student_no);

-- ───────────── 조직 ─────────────
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind public.org_kind not null,
  department_id text references public.departments (id),
  name text not null,
  term int not null default 1,
  intro text,
  room text,
  instagram text,
  category text,
  meets text,
  fee text,
  size_label text,
  recruiting text,
  rental_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
create index orgs_department_idx on public.orgs (department_id);

create table public.org_units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  description text,
  sort int not null default 0
);
create index org_units_org_idx on public.org_units (org_id);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  unit_id uuid references public.org_units (id) on delete set null,
  title text not null default '부원',
  role public.member_role not null default 'member',
  term int not null,
  active boolean not null default true,
  sort int not null default 0,
  unique (org_id, user_id, term)
);
create index memberships_user_idx on public.memberships (user_id) where active;
create index memberships_org_idx on public.memberships (org_id) where active;
create index memberships_unit_idx on public.memberships (unit_id);

-- ───────────── 발견: 기회 ─────────────
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_kind text not null check (source_kind in ('school', 'department', 'epic', 'contest', 'scholarship', 'org')),
  org_id uuid references public.orgs (id) on delete cascade,
  department_id text references public.departments (id),
  title text not null,
  summary text not null,
  starts_at timestamptz,
  deadline timestamptz,
  location text,
  mode text check (mode in ('offline', 'online', 'mixed')),
  capacity int,
  epic_points int,
  epic_category text check (epic_category in ('recognized', 'contest', 'microdegree', 'internship', 'certificate')),
  eligible_grades int[],
  eligible_departments text[],
  eligibility_note text,
  steps jsonb not null default '[]',
  warning text,
  original_url text,
  posted_at date,
  tags text[] not null default '{}',
  admin_notice boolean not null default false,
  created_at timestamptz not null default now()
);
create index opportunities_deadline_idx on public.opportunities (deadline);
create index opportunities_org_idx on public.opportunities (org_id);

create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);
create index saves_opportunity_idx on public.saves (opportunity_id);

create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null
);

-- ───────────── 운영: 사업 · 행사 ─────────────
create table public.event_series (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  kind public.event_kind not null,
  usual_months int[] not null default '{}',
  sort int not null default 0
);
create index event_series_org_idx on public.event_series (org_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  series_id uuid references public.event_series (id) on delete set null,
  source_event_id uuid references public.events (id) on delete set null,
  kind public.event_kind not null,
  status public.event_status not null default 'draft',
  title text not null,
  semester text not null,
  term int not null,
  greeting text,
  location text,
  opens_at timestamptz,
  pickup_starts_at timestamptz,
  pickup_ends_at timestamptz,
  audience text not null default 'department' check (audience in ('department', 'college', 'all')),
  dues_only boolean not null default false,
  per_person int not null default 1,
  show_remaining boolean not null default true,
  leftovers_open boolean not null default true,
  applied_count int not null default 0,
  stats jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index events_org_idx on public.events (org_id);
create index events_series_idx on public.events (series_id);
create index events_source_idx on public.events (source_event_id);
create index events_created_by_idx on public.events (created_by);

create table public.event_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  quantity int not null check (quantity >= 0),
  taken int not null default 0,
  walkup int not null default 0,
  sold_out_at timestamptz,
  sort int not null default 0
);
create index event_options_event_idx on public.event_options (event_id);

create table public.event_staff (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (event_id, user_id)
);
create index event_staff_user_idx on public.event_staff (user_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  option_id uuid not null references public.event_options (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seq int not null,
  created_at timestamptz not null default now(),
  picked_up_at timestamptz,
  picked_up_by uuid references public.profiles (id) on delete set null,
  unique (event_id, user_id)
);
create index applications_option_idx on public.applications (option_id);
create index applications_user_idx on public.applications (user_id);
create index applications_picked_by_idx on public.applications (picked_up_by);

-- ───────────── 전승 ─────────────
create table public.handover_notes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.event_series (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  author_label text not null,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index handover_notes_series_idx on public.handover_notes (series_id);
create index handover_notes_event_idx on public.handover_notes (event_id);
create index handover_notes_author_idx on public.handover_notes (author_id);

-- ───────────── 대여 ─────────────
create table public.rental_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  kind public.item_kind not null,
  total int not null default 0,
  stock int not null default 0,
  present boolean not null default true,
  sort int not null default 0
);
create index rental_items_org_idx on public.rental_items (org_id);

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.rental_items (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  qty int not null check (qty > 0),
  lent_at timestamptz not null default now(),
  lent_by uuid references public.profiles (id) on delete set null,
  returned_at timestamptz,
  returned_by uuid references public.profiles (id) on delete set null,
  disputed_at timestamptz
);
create index rentals_item_idx on public.rentals (item_id);
create index rentals_org_open_idx on public.rentals (org_id) where returned_at is null;
create index rentals_user_idx on public.rentals (user_id);
create index rentals_lent_by_idx on public.rentals (lent_by);
create index rentals_returned_by_idx on public.rentals (returned_by);

create table public.consumable_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.rental_items (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  qty int not null check (qty > 0),
  given_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index consumable_logs_item_idx on public.consumable_logs (item_id);
create index consumable_logs_org_idx on public.consumable_logs (org_id);
create index consumable_logs_user_idx on public.consumable_logs (user_id);
create index consumable_logs_given_by_idx on public.consumable_logs (given_by);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  body text not null,
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index suggestions_org_idx on public.suggestions (org_id);

-- ───────────── 권한 헬퍼 ─────────────
create or replace function public.is_org_officer(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid())
      and m.active and m.role in ('president', 'officer')
  );
$$;

create or replace function public.is_org_president(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid())
      and m.active and m.role = 'president'
  );
$$;

create or replace function public.is_any_officer()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.active and m.role in ('president', 'officer')
  );
$$;

-- ───────────── RLS ─────────────
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.orgs enable row level security;
alter table public.org_units enable row level security;
alter table public.memberships enable row level security;
alter table public.opportunities enable row level security;
alter table public.saves enable row level security;
alter table public.academic_periods enable row level security;
alter table public.event_series enable row level security;
alter table public.events enable row level security;
alter table public.event_options enable row level security;
alter table public.event_staff enable row level security;
alter table public.applications enable row level security;
alter table public.handover_notes enable row level security;
alter table public.rental_items enable row level security;
alter table public.rentals enable row level security;
alter table public.consumable_logs enable row level security;
alter table public.suggestions enable row level security;

-- 공개 정보: 로그인한 학생 누구나
create policy "read departments" on public.departments for select to authenticated using (true);
create policy "read orgs" on public.orgs for select to authenticated using (true);
create policy "read units" on public.org_units for select to authenticated using (true);
create policy "read memberships" on public.memberships for select to authenticated using (true);
create policy "read opportunities" on public.opportunities for select to authenticated using (true);
create policy "read periods" on public.academic_periods for select to authenticated using (true);
create policy "read series" on public.event_series for select to authenticated using (true);
create policy "read rental items" on public.rental_items for select to authenticated using (true);
create policy "read handover notes" on public.handover_notes for select to authenticated using (true);
create policy "read answered suggestions" on public.suggestions for select to authenticated
  using (answer is not null or (select public.is_org_officer(org_id)));

-- 프로필: 본인, 그리고 운영진(신청자·대여자 확인용)
create policy "read own or as officer" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_any_officer()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 저장: 본인만
create policy "own saves" on public.saves for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 행사: 공개된 것은 누구나, 초안은 운영진만
create policy "read events" on public.events for select to authenticated
  using (status <> 'draft' or (select public.is_org_officer(org_id)));
create policy "officers write events" on public.events for insert to authenticated
  with check ((select public.is_org_officer(org_id)));
create policy "officers update events" on public.events for update to authenticated
  using ((select public.is_org_officer(org_id))) with check ((select public.is_org_officer(org_id)));
create policy "officers delete draft events" on public.events for delete to authenticated
  using (status = 'draft' and (select public.is_org_officer(org_id)));

create policy "read options" on public.event_options for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id
                 and (e.status <> 'draft' or (select public.is_org_officer(e.org_id)))));
create policy "officers write options" on public.event_options for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and (select public.is_org_officer(e.org_id))))
  with check (exists (select 1 from public.events e where e.id = event_id and (select public.is_org_officer(e.org_id))));

create policy "read staff" on public.event_staff for select to authenticated using (true);
create policy "officers write staff" on public.event_staff for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and (select public.is_org_officer(e.org_id))))
  with check (exists (select 1 from public.events e where e.id = event_id and (select public.is_org_officer(e.org_id))));

-- 신청: 본인 것, 그리고 그 조직 운영진. 쓰기는 RPC로만
create policy "read own or org applications" on public.applications for select to authenticated
  using (user_id = (select auth.uid())
         or exists (select 1 from public.events e where e.id = event_id and (select public.is_org_officer(e.org_id))));

-- 이어받은 한 줄: 운영진이 쓴다
create policy "officers write notes" on public.handover_notes for insert to authenticated
  with check (author_id = (select auth.uid())
              and exists (select 1 from public.event_series s where s.id = series_id and (select public.is_org_officer(s.org_id))));

-- 대여: 본인 기록, 운영진 전체. 쓰기는 RPC로만
create policy "read own or org rentals" on public.rentals for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_org_officer(org_id)));
create policy "officers read consumable logs" on public.consumable_logs for select to authenticated
  using ((select public.is_org_officer(org_id)));
create policy "officers update items" on public.rental_items for update to authenticated
  using ((select public.is_org_officer(org_id))) with check ((select public.is_org_officer(org_id)));

-- 건의: 누구나 익명으로 보내고, 운영진이 답한다
create policy "anyone suggests" on public.suggestions for insert to authenticated
  with check (answer is null);
create policy "officers answer" on public.suggestions for update to authenticated
  using ((select public.is_org_officer(org_id))) with check ((select public.is_org_officer(org_id)));

-- ───────────── RPC: 선착순 신청 ─────────────
create or replace function public.apply_event(p_event uuid, p_option uuid)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
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

-- 수령 체크 (운영진)
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
    update public.applications set picked_up_at = coalesce(picked_up_at, now()), picked_up_by = coalesce(picked_up_by, (select auth.uid()))
     where id = p_application;
  end if;
end;
$$;

-- 현장 배부 (이름 없이 숫자만)
create or replace function public.give_walkup(p_option uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid; v_left int;
begin
  select e.org_id into v_org from public.event_options o join public.events e on e.id = o.event_id where o.id = p_option;
  if v_org is null or not public.is_org_officer(v_org) then raise exception '권한이 없어요'; end if;
  select o.quantity - (select count(*) from public.applications a where a.option_id = o.id and a.picked_up_at is not null) - o.walkup
    into v_left from public.event_options o where o.id = p_option for update;
  if v_left <= 0 then raise exception '남은 게 없어요'; end if;
  update public.event_options set walkup = walkup + 1 where id = p_option;
end;
$$;

-- 행사 끝내기: 기록에서 숫자를 뽑아 stats에 남긴다
create or replace function public.finish_event(p_event uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_stats jsonb;
begin
  select * into v_event from public.events where id = p_event for update;
  if not found or not public.is_org_officer(v_event.org_id) then raise exception '권한이 없어요'; end if;

  select jsonb_build_object(
    'total', coalesce(sum(o.quantity), 0),
    'applied', v_event.applied_count,
    'picked', (select count(*) from public.applications a where a.event_id = p_event and a.picked_up_at is not null),
    'no_show', (select count(*) from public.applications a where a.event_id = p_event and a.picked_up_at is null),
    'walkup', coalesce(sum(o.walkup), 0),
    'sold_out_minutes', case when bool_and(o.sold_out_at is not null) and v_event.opens_at is not null
                         then round(extract(epoch from (max(o.sold_out_at) - v_event.opens_at)) / 60) end,
    'options', jsonb_agg(jsonb_build_object(
        'name', o.name, 'quantity', o.quantity, 'taken', o.taken,
        'sold_out_minutes', case when o.sold_out_at is not null and v_event.opens_at is not null
                             then round(extract(epoch from (o.sold_out_at - v_event.opens_at)) / 60) end)
        order by o.sort)
  ) into v_stats
  from public.event_options o where o.event_id = p_event;

  update public.events set status = 'finished', finished_at = now(), stats = v_stats where id = p_event;
  return v_stats;
end;
$$;

-- 대여: 빌려주기 · 반납 · 소모품
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
  values (p_item, v_item.org_id, p_user, p_qty, (select auth.uid())) returning id into v_id;
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
  update public.rentals set returned_at = now(), returned_by = (select auth.uid())
   where id = p_rental and returned_at is null;
end;
$$;

create or replace function public.dispute_rental(p_rental uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.rentals set disputed_at = now() where id = p_rental and user_id = (select auth.uid());
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
  values (p_item, v_item.org_id, p_user, p_qty, (select auth.uid()));
end;
$$;

-- 대여 현황 (누가 빌렸는지는 빼고 남은 개수만)
create or replace function public.rental_availability(p_org uuid)
returns table (id uuid, name text, kind public.item_kind, total int, available int, present boolean, sort int)
language sql stable security definer set search_path = ''
as $$
  select i.id, i.name, i.kind, i.total,
         case when i.kind = 'rental' then i.total - coalesce((select sum(r.qty) from public.rentals r where r.item_id = i.id and r.returned_at is null), 0)::int
              when i.kind = 'consumable' then i.stock
              else null end,
         i.present, i.sort
  from public.rental_items i where i.org_id = p_org order by i.kind, i.sort;
$$;

-- ───────────── 전승: 임기 넘기기 ─────────────
-- p_keep: [{"user_id": "...", "unit_id": "...", "title": "...", "role": "officer"}]
create or replace function public.handover_term(p_org uuid, p_next_president uuid, p_keep jsonb, p_keep_units boolean default true)
returns int
language plpgsql security definer set search_path = ''
as $$
declare v_org public.orgs%rowtype; v_next int; v_item jsonb;
begin
  select * into v_org from public.orgs where id = p_org for update;
  if not found or not public.is_org_president(p_org) then raise exception '회장만 넘길 수 있어요'; end if;
  v_next := v_org.term + 1;

  if not p_keep_units then
    delete from public.org_units where org_id = p_org;
  end if;

  update public.memberships set active = false where org_id = p_org and term = v_org.term and role <> 'member';

  insert into public.memberships (org_id, user_id, unit_id, title, role, term)
  values (p_org, p_next_president, null, '학생회장', 'president', v_next)
  on conflict (org_id, user_id, term) do update set role = 'president', title = '학생회장', active = true;

  for v_item in select * from jsonb_array_elements(coalesce(p_keep, '[]'::jsonb)) loop
    if (v_item->>'user_id')::uuid = p_next_president then continue; end if;
    insert into public.memberships (org_id, user_id, unit_id, title, role, term)
    values (p_org, (v_item->>'user_id')::uuid,
            case when p_keep_units then nullif(v_item->>'unit_id', '')::uuid end,
            coalesce(v_item->>'title', '부원'), 'officer', v_next)
    on conflict (org_id, user_id, term) do nothing;
  end loop;

  update public.orgs set term = v_next where id = p_org;
  return v_next;
end;
$$;

-- RPC 실행 권한: 로그인한 사용자만
revoke execute on function public.apply_event, public.check_pickup, public.give_walkup, public.finish_event,
  public.lend_item, public.return_rental, public.dispute_rental, public.give_consumable,
  public.rental_availability, public.handover_term,
  public.is_org_officer, public.is_org_president, public.is_any_officer from public, anon;
grant execute on function public.apply_event, public.check_pickup, public.give_walkup, public.finish_event,
  public.lend_item, public.return_rental, public.dispute_rental, public.give_consumable,
  public.rental_availability, public.handover_term,
  public.is_org_officer, public.is_org_president, public.is_any_officer to authenticated;

-- 실시간: 남은 개수와 신청 명단
alter publication supabase_realtime add table public.event_options, public.applications, public.events;
