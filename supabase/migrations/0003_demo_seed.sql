-- 데모 데이터. 이름 · 학번은 모두 가명. auth 계정 없이 profiles 행만 만든다.
-- 방문자는 익명 로그인 후 페르소나(정하늘 · 김서연 · 박지호)를 고른다.

insert into public.departments (id, name, short_name, college, sort) values
  ('itm', 'ITM전공', 'ITM', '기술경영융합대학', 1),
  ('ise', '산업정보시스템전공', '산업정보', '기술경영융합대학', 2),
  ('msde', 'MSDE학과', 'MSDE', '기술경영융합대학', 3),
  ('biz', '경영학전공', '경영', '기술경영융합대학', 4),
  ('gtm', '글로벌테크노경영전공', '글로벌테크노', '기술경영융합대학', 5),
  ('food', '식품생명공학과', '식품생명', '에너지바이오대학', 6),
  ('cse', '컴퓨터공학과', '컴공', '정보통신대학', 7),
  ('ds', '데이터사이언스학과', '데이터사이언스', '정보통신대학', 8);

do $$
declare
  -- id 끝자리, 이름, 학번, 학과, 학년
  people text[][] := array[
    ['001','정하늘','25102631','itm','2'],
    ['002','김서연','24102095','itm','3'],
    ['003','박지호','23102044','itm','4'],
    ['004','정우진','24102230','itm','3'],
    ['101','최민재','24102113','itm','3'],
    ['102','윤가은','24102168','itm','3'],
    ['103','조하은','25102077','itm','2'],
    ['104','서다인','25102284','itm','2'],
    ['105','남궁현','26102012','itm','1'],
    ['106','백시우','26102109','itm','1'],
    ['107','이수민','24102201','itm','3'],
    ['108','한도윤','24102156','itm','3'],
    ['109','송유나','25102330','itm','2'],
    ['110','임태오','26102145','itm','1'],
    ['111','한가람','26102088','itm','1'],
    ['112','권도하','24102047','itm','3'],
    ['113','강지아','25102219','itm','2'],
    ['114','문채원','26102031','itm','1'],
    ['115','오태윤','26102176','itm','1'],
    ['201','오지훈','24102157','itm','3'],
    ['202','김나연','26102055','itm','1'],
    ['203','이도윤','25102418','itm','2'],
    ['204','박서진','23102266','itm','4'],
    ['205','최유나','26102094','itm','1'],
    ['206','문태경','24102305','itm','3'],
    ['207','윤재민','25102378','itm','2'],
    ['208','강하린','26102190','itm','1'],
    ['209','신우빈','24102412','itm','3'],
    ['210','한소율','26102077','itm','1'],
    ['211','한서준','25102214','itm','2'],
    ['212','오세린','24102087','itm','3'],
    ['213','문도현','26102143','itm','1'],
    ['214','장예린','25102051','itm','2'],
    ['215','배준호','24102399','itm','3'],
    ['216','홍다은','26102124','itm','1'],
    ['217','유지안','25102166','itm','2'],
    ['218','고은채','23102318','itm','4'],
    ['219','류현우','26102018','itm','1'],
    ['220','안소희','25102297','itm','2'],
    ['221','차민혁','24102274','itm','3'],
    ['222','노하윤','26102061','itm','1'],
    ['223','구태민','25102133','itm','2'],
    ['224','진서윤','24102188','itm','3'],
    ['225','표건우','26102039','itm','1'],
    ['226','염지우','25102402','itm','2'],
    ['227','방예준','23102127','itm','4'],
    ['228','석나은','26102157','itm','1'],
    ['229','길도경','25102071','itm','2'],
    ['230','변시아','24102339','itm','3'],
    ['231','하윤서','26102198','itm','1'],
    ['232','남유진','25102245','itm','2'],
    ['233','엄준서','24102061','itm','3'],
    ['234','소예은','26102084','itm','1'],
    ['235','원지환','25102359','itm','2'],
    ['236','선하람','24102120','itm','3'],
    ['237','채은우','26102167','itm','1'],
    ['238','편서아','25102111','itm','2'],
    ['239','탁민서','24102293','itm','3'],
    ['240','국지율','26102026','itm','1'],
    ['241','도하준','25102326','itm','2'],
    ['301','한서윤','23103011','ise','4'],
    ['302','이재민','24103022','biz','3'],
    ['303','장유진','24103033','cse','3'],
    ['304','권민호','25103044','ise','2'],
    ['305','이준서','26103055','msde','1'],
    ['306','김도윤','24103066','gtm','3']
  ];
  p text[];
  v_id uuid;
begin
  foreach p slice 1 in array people loop
    v_id := ('00000000-0000-4000-8000-000000000' || p[1])::uuid;
    insert into public.profiles (id, name, student_no, department_id, grade)
    values (v_id, p[2], p[3], p[4], p[5]::int)
    on conflict (id) do nothing;
  end loop;
end $$;


-- ───────────── 데모 데이터 채우기 (INSERT만. 비우기는 0004_reset_demo.sql) ─────────────
create or replace function public.seed_demo()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  d date := (now() at time zone 'Asia/Seoul')::date;
  kst text := 'Asia/Seoul';
  u_haneul uuid := '00000000-0000-4000-8000-000000000001';
  u_seoyeon uuid := '00000000-0000-4000-8000-000000000002';
  u_jiho uuid := '00000000-0000-4000-8000-000000000003';
  u_woojin uuid := '00000000-0000-4000-8000-000000000004';
  o_itm uuid; o_snuto uuid; o_tongil uuid; o_sori uuid; o_strc uuid;
  un_head uuid; un_plan uuid; un_admin uuid; un_promo uuid; un_violin uuid;
  s_snack uuid; s_party uuid; s_locker uuid; s_moment uuid; s_night uuid; s_workshop uuid; s_recruit uuid;
  e_prev uuid; e_live uuid; e_tmp uuid;
  op_a uuid; op_b uuid;
  i_umbrella uuid; i_charger uuid; i_cc uuid; i_c8 uuid;
  r record;
  n int := 0;
begin
  -- 페르소나 프로필
  update public.profiles set phone = '010-2718-4403', interests = '{IT·데이터,디자인·예술}', wants = '{공모전·해커톤,자격증·어학}',
         skills = '{Figma,Python 기초}', epic = '{"total":230,"recognized":160,"language":70}', demo_role = 'student'
   where id = u_haneul;
  update public.profiles set phone = '010-3302-1187', interests = '{경영·경제,IT·데이터}', wants = '{취업 준비,공모전·해커톤}',
         skills = '{Excel,Notion}', epic = '{"total":500,"recognized":300,"language":200}', demo_role = 'officer'
   where id = u_seoyeon;
  update public.profiles set phone = '010-4410-2290', interests = '{경영·경제}', wants = '{취업 준비,창업}',
         skills = '{Excel,기획}', epic = '{"total":640,"recognized":300,"language":200}', demo_role = 'president'
   where id = u_jiho;
  update public.profiles set interests = '{디자인·예술}', wants = '{공모전·해커톤}', skills = '{Photoshop,Canva}'
   where id = u_woojin;

  -- 학사일정
  insert into public.academic_periods (name, starts_on, ends_on) values
    ('중간고사 기간', d + 13, d + 17),
    ('기말고사 기간', d + 62, d + 68);

  -- 조직
  insert into public.orgs (slug, kind, department_id, name, term, intro, room, instagram, rental_enabled)
  values ('itm', 'council', 'itm', '원세컨드', 15, 'ITM전공 학우들의 학교생활을 챙기는 학생회예요.', '프론티어관 201-2호 학생회실', '@itm_seoultech', true)
  returning id into o_itm;
  insert into public.orgs (slug, kind, name, term, intro, room, category, meets, fee, size_label, recruiting)
  values ('snuto', 'club', 'SNUTO', 19, '오케스트라 합주를 하는 중앙동아리예요. 1년에 두 번 100주년기념관 대공연장에서 정기공연을 해요.',
          '제1학생회관 316호', '공연분과', '매주 목 19:00, 토 14:00', '3만 원', '52명', '상시 모집')
  returning id into o_snuto;
  insert into public.orgs (slug, kind, name, term, intro, room, category, meets, fee, size_label, recruiting) values
    ('tongil', 'club', '통일아침', 30, '기타, 베이스, 드럼, 키보드 밴드. 가입한 사람은 모두 한 번 이상 무대에 서요.', '제1학생회관 208호', '공연분과', '팀마다 달라요', '2만 원', '80명 이상', '상시 모집'),
    ('sori', 'club', '소리사랑', 22, '어쿠스틱 보컬. 5월과 11월에 정기공연을 해요.', '제1학생회관 312호', '공연분과', '매주 화', '2만 원', '30명', '3월 말 모집'),
    ('strc', 'club', 'STRC', 6, '함께 달리는 러닝 동아리. 캠퍼스와 중랑천을 같이 뛰어요.', '제2학생회관 105호', '체육분과', '매주 수', '없음', '45명', '상시 모집');

  -- 원세컨드 조직도
  insert into public.org_units (org_id, name, description, sort) values (o_itm, '회장단', '학생회 전체를 이끌어요', 0) returning id into un_head;
  insert into public.org_units (org_id, name, description, sort) values (o_itm, '기획부', '행사 기획과 신청 운영', 1) returning id into un_plan;
  insert into public.org_units (org_id, name, description, sort) values (o_itm, '사무부', '예산, 결산, 대여사업', 2) returning id into un_admin;
  insert into public.org_units (org_id, name, description, sort) values (o_itm, '홍보부', '인스타그램과 공지', 3) returning id into un_promo;

  insert into public.memberships (org_id, user_id, unit_id, title, role, term, sort)
  select o_itm, ('00000000-0000-4000-8000-000000000' || x.k)::uuid,
         case x.u when 'head' then un_head when 'plan' then un_plan when 'admin' then un_admin else un_promo end,
         x.t, x.r::public.member_role, 15, x.s
  from (values
    ('003','head','학생회장','president',0), ('002','head','부학생회장','officer',1),
    ('101','plan','기획부장','officer',0), ('102','plan','기획부장','officer',1), ('103','plan','기획차장','officer',2),
    ('104','plan','기획부원','officer',3), ('105','plan','기획부원','officer',4), ('106','plan','기획부원','officer',5),
    ('107','admin','사무부장','officer',0), ('108','admin','사무부장','officer',1), ('109','admin','사무부원','officer',2),
    ('110','admin','사무부원','officer',3), ('111','admin','사무부원','officer',4),
    ('004','promo','홍보부장','officer',0), ('112','promo','홍보부장','officer',1), ('113','promo','홍보차장','officer',2),
    ('114','promo','홍보부원','officer',3), ('115','promo','홍보부원','officer',4)
  ) as x(k, u, t, r, s);

  -- SNUTO
  insert into public.org_units (org_id, name, sort) values (o_snuto, '운영진', 0), (o_snuto, '바이올린', 1) ;
  select id into un_violin from public.org_units where org_id = o_snuto and name = '바이올린';
  insert into public.memberships (org_id, user_id, unit_id, title, role, term, sort) values
    (o_snuto, '00000000-0000-4000-8000-000000000301', (select id from public.org_units where org_id = o_snuto and name = '운영진'), '회장', 'president', 19, 0),
    (o_snuto, u_haneul, un_violin, '바이올린 파트', 'member', 19, 0),
    (o_snuto, '00000000-0000-4000-8000-000000000306', null, '첼로 파트', 'member', 19, 1);

  -- 행사 묶음
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, '간식행사', 'giveaway', '{4,6,10,12}', 0) returning id into s_snack;
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, '개강파티', 'signup', '{3,9}', 1) returning id into s_party;
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, '사물함 배정', 'signup', '{2,9}', 2) returning id into s_locker;
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, '모먼트데이', 'signup', '{5}', 3) returning id into s_moment;
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, 'ITM인의 밤', 'signup', '{11}', 4) returning id into s_night;
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, '워크샵', 'signup', '{1}', 5) returning id into s_workshop;
  insert into public.event_series (org_id, name, kind, usual_months, sort) values (o_itm, '신입부원 모집', 'signup', '{3}', 6) returning id into s_recruit;

  -- 지난 간식행사 3회
  insert into public.events (org_id, series_id, kind, status, title, semester, term, location, opens_at, pickup_starts_at, pickup_ends_at, applied_count, stats, finished_at, published_at, created_by)
  values (o_itm, s_snack, 'giveaway', 'finished', '2025 2학기 기말고사 간식행사', '2025-2', 14, '프론티어관 201-2호 학생회실',
          '2025-12-02 18:00+09', '2025-12-09 18:30+09', '2025-12-09 19:00+09', 50,
          '{"total":50,"applied":50,"picked":41,"no_show":9,"walkup":7,"sold_out_minutes":72,"options":[{"name":"컵밥","quantity":50,"taken":50,"sold_out_minutes":72}]}',
          '2025-12-09 19:20+09', '2025-11-30 12:00+09', null)
  returning id into e_tmp;
  insert into public.events (org_id, series_id, source_event_id, kind, status, title, semester, term, location, opens_at, pickup_starts_at, pickup_ends_at, applied_count, stats, finished_at, published_at)
  values (o_itm, s_snack, e_tmp, 'giveaway', 'finished', '2026 1학기 중간고사 간식행사', '2026-1', 15, '프론티어관 201-2호 학생회실',
          '2026-04-07 18:00+09', '2026-04-14 18:30+09', '2026-04-14 19:00+09', 60,
          '{"total":60,"applied":60,"picked":54,"no_show":6,"walkup":6,"sold_out_minutes":38,"options":[{"name":"육회덮밥","quantity":30,"taken":30,"sold_out_minutes":14},{"name":"연어덮밥","quantity":30,"taken":30,"sold_out_minutes":38}]}',
          '2026-04-14 19:15+09', '2026-04-05 12:00+09')
  returning id into e_tmp;
  insert into public.events (org_id, series_id, source_event_id, kind, status, title, semester, term, greeting, location, opens_at, pickup_starts_at, pickup_ends_at, applied_count, stats, finished_at, published_at)
  values (o_itm, s_snack, e_tmp, 'giveaway', 'finished', '2026 1학기 기말고사 간식행사', '2026-1', 15,
          '안녕하세요, ITM전공 제15대 원세컨드 학생회입니다! 기말고사 응원 간식 신청을 받아요.', '프론티어관 201-2호 학생회실',
          '2026-05-26 18:00+09', '2026-06-02 18:30+09', '2026-06-02 19:30+09', 60,
          '{"total":60,"applied":60,"picked":56,"no_show":4,"walkup":4,"sold_out_minutes":41,"options":[{"name":"DD삼겹 도시락","quantity":60,"taken":60,"sold_out_minutes":41}]}',
          '2026-06-02 19:40+09', '2026-05-24 12:00+09')
  returning id into e_prev;
  insert into public.event_options (event_id, name, quantity, taken, sort) values (e_prev, 'DD삼겹 도시락', 60, 60, 0);

  -- 지금 열려 있는 간식행사 (작년 양식에서 복제)
  insert into public.events (org_id, series_id, source_event_id, kind, status, title, semester, term, greeting, location,
                             opens_at, pickup_starts_at, pickup_ends_at, audience, per_person, published_at, created_by)
  values (o_itm, s_snack, e_prev, 'giveaway', 'published', '2026 2학기 중간고사 간식행사', '2026-2', 15,
          '안녕하세요, ITM전공 제15대 원세컨드 학생회입니다! 중간고사 응원 간식 신청을 받아요.', '프론티어관 201-2호 학생회실',
          now() - interval '3 minutes',
          ((d + 14)::text || ' 18:30')::timestamp at time zone kst,
          ((d + 14)::text || ' 19:00')::timestamp at time zone kst,
          'department', 1, now() - interval '1 day', u_seoyeon)
  returning id into e_live;
  insert into public.event_options (event_id, name, quantity, sort) values (e_live, '제육덮밥', 30, 0) returning id into op_a;
  insert into public.event_options (event_id, name, quantity, sort) values (e_live, '치킨마요덮밥', 30, 1) returning id into op_b;
  insert into public.event_staff (event_id, user_id) values (e_live, u_seoyeon), (e_live, '00000000-0000-4000-8000-000000000109'),
    (e_live, '00000000-0000-4000-8000-000000000105'), (e_live, '00000000-0000-4000-8000-000000000111');

  -- 이미 들어온 신청 41건 (가상 학생, 3분 동안)
  for r in
    select p.id, row_number() over (order by p.student_no) as rn
    from public.profiles p
    where p.department_id = 'itm' and p.id::text like '00000000-0000-4000-8000-0000000002%'
  loop
    n := n + 1;
    insert into public.applications (event_id, option_id, user_id, seq, created_at)
    values (e_live, case when r.rn % 2 = 0 then op_a else op_b end, r.id, n, now() - interval '3 minutes' + (n * interval '4 seconds'));
  end loop;
  for r in
    select p.id from public.profiles p
    where p.id::text like '00000000-0000-4000-8000-0000000001%' and p.id::text > '00000000-0000-4000-8000-000000000105'
    order by p.id limit 4
  loop
    n := n + 1;
    insert into public.applications (event_id, option_id, user_id, seq, created_at)
    values (e_live, op_b, r.id, n, now() - interval '20 seconds' + (n * interval '1 second'));
  end loop;
  update public.events set applied_count = n where id = e_live;
  update public.event_options o set taken = (select count(*) from public.applications a where a.option_id = o.id) where o.event_id = e_live;

  -- 다른 지난 활동
  insert into public.events (org_id, series_id, kind, status, title, semester, term, location, applied_count, stats, finished_at, published_at) values
    (o_itm, s_party, 'signup', 'finished', '2026 2학기 개강파티', '2026-2', 15, '공릉동 행사장', 50, '{"applied":50,"picked":50,"note":"납부자 5,000원, 미납부자 15,000원"}', '2026-09-04 23:00+09', '2026-08-25 12:00+09'),
    (o_itm, s_locker, 'signup', 'finished', '2026 2학기 사물함 배정', '2026-2', 15, '프론티어관 2층', 62, '{"applied":62,"picked":62,"unit":"칸"}', '2026-09-28 18:00+09', '2026-09-20 12:00+09'),
    (o_itm, s_moment, 'signup', 'finished', '2026 모먼트데이', '2026-1', 15, '붕어방', 84, '{"applied":84,"picked":84}', '2026-05-18 20:00+09', '2026-05-10 12:00+09'),
    (o_itm, s_recruit, 'signup', 'finished', '2026 원세컨드 신입부원 모집', '2026-1', 15, '프론티어관 201-2호 학생회실', 15, '{"applied":15,"picked":8,"note":"15명 지원, 8명 선발"}', '2026-03-04 21:30+09', '2026-02-26 12:00+09'),
    (o_itm, s_party, 'signup', 'finished', '2026 1학기 개강파티', '2026-1', 15, '공릉동 행사장', 71, '{"applied":71,"picked":68}', '2026-03-06 23:00+09', '2026-02-27 12:00+09'),
    (o_itm, s_night, 'signup', 'finished', '2025 ITM인의 밤', '2025-2', 14, '100주년기념관', 96, '{"applied":96,"picked":90}', '2025-11-21 22:00+09', '2025-11-10 12:00+09'),
    (o_itm, s_locker, 'signup', 'finished', '2026 1학기 사물함 배정', '2026-1', 15, '프론티어관 2층', 62, '{"applied":62,"picked":62,"unit":"칸"}', '2026-02-27 18:00+09', '2026-02-20 12:00+09');

  -- 다가오는 일정 (공개, 신청 전)
  insert into public.events (org_id, series_id, kind, status, title, semester, term, location, opens_at, published_at) values
    (o_itm, s_night, 'notice', 'published', '2026 ITM인의 밤', '2026-2', 15, '장소 확인 중', ((d + 40)::text || ' 18:00')::timestamp at time zone kst, now());

  -- 이어받은 한 줄
  insert into public.handover_notes (series_id, author_id, author_label, body, created_at) values
    (s_snack, null, '14대 권태호', '줄이 복도 끝까지 섰어요. 18:30 전에 테이블을 학생회실 밖으로 빼두면 편해요.', '2025-12-09 20:00+09'),
    (s_snack, '00000000-0000-4000-8000-000000000107', '15대 이수민', '덮밥이 컵밥보다 훨씬 빨리 나가요. 가격 차이도 크지 않았어요.', '2026-04-14 20:00+09'),
    (s_snack, u_seoyeon, '15대 김서연', '메뉴를 두 개로 나누면 인기 메뉴가 먼저 끝나요. 인기 메뉴를 넉넉히 잡아보세요.', '2026-06-02 20:30+09'),
    (s_party, '00000000-0000-4000-8000-000000000101', '15대 최민재', '납부자 할인이 있으면 학생회비 납부가 같이 늘어요. 공지에 꼭 같이 적어요.', '2026-09-05 12:00+09');

  -- 대여
  insert into public.rental_items (org_id, name, kind, total, stock, present, sort) values
    (o_itm, '노트북 충전기', 'rental', 3, 0, true, 0),
    (o_itm, 'C타입 어댑터', 'rental', 7, 0, true, 1),
    (o_itm, 'C-C 케이블', 'rental', 5, 0, true, 2),
    (o_itm, 'C-8핀 케이블', 'rental', 2, 0, true, 3),
    (o_itm, '우산', 'rental', 5, 0, true, 4),
    (o_itm, '돗자리', 'rental', 2, 0, true, 5),
    (o_itm, '담요', 'rental', 4, 0, true, 6),
    (o_itm, '타이레놀', 'consumable', 0, 6, true, 0),
    (o_itm, '소화제', 'consumable', 0, 2, true, 1),
    (o_itm, '인공눈물', 'consumable', 0, 8, true, 2),
    (o_itm, '일회용 칫솔', 'consumable', 0, 12, true, 3),
    (o_itm, '일회용 치약', 'consumable', 0, 10, true, 4),
    (o_itm, '후시딘', 'fixture', 0, 0, true, 0),
    (o_itm, '버물리', 'fixture', 0, 0, false, 1),
    (o_itm, '뿌리는 파스', 'fixture', 0, 0, true, 2),
    (o_itm, '휴지, 물티슈', 'fixture', 0, 0, true, 3);
  select id into i_umbrella from public.rental_items where org_id = o_itm and name = '우산';
  select id into i_charger from public.rental_items where org_id = o_itm and name = '노트북 충전기';
  select id into i_cc from public.rental_items where org_id = o_itm and name = 'C-C 케이블';
  select id into i_c8 from public.rental_items where org_id = o_itm and name = 'C-8핀 케이블';
  insert into public.rentals (item_id, org_id, user_id, qty, lent_at, lent_by) values
    (i_umbrella, o_itm, '00000000-0000-4000-8000-000000000211', 2, now() - interval '3 days 4 hours', u_seoyeon),
    (i_c8, o_itm, '00000000-0000-4000-8000-000000000212', 1, now() - interval '2 days 2 hours', '00000000-0000-4000-8000-000000000109'),
    (i_charger, o_itm, '00000000-0000-4000-8000-000000000213', 1, now() - interval '1 day 3 hours', u_seoyeon),
    (i_cc, o_itm, '00000000-0000-4000-8000-000000000202', 2, now() - interval '2 hours', '00000000-0000-4000-8000-000000000111'),
    (i_charger, o_itm, '00000000-0000-4000-8000-000000000208', 1, now() - interval '3 hours', u_seoyeon),
    (i_c8, o_itm, '00000000-0000-4000-8000-000000000207', 1, now() - interval '5 hours', '00000000-0000-4000-8000-000000000109');

  -- 건의함
  insert into public.suggestions (org_id, body, answer, answered_at, created_at) values
    (o_itm, '시험 기간에 학생회실을 늦게까지 열어주세요', '1학기 기말고사 기간엔 22시까지 열었어요. 2학기 중간고사 기간에도 똑같이 열어요.', now() - interval '20 days', now() - interval '25 days'),
    (o_itm, '비 오는 날 우산이 금방 없어져요', '2학기에 우산을 3개 더 들여놨어요. 대여 현황에서 남은 개수를 볼 수 있어요.', now() - interval '30 days', now() - interval '34 days'),
    (o_itm, '간식행사 메뉴 투표를 해주시면 좋겠어요', null, null, now() - interval '2 days'),
    (o_itm, '프린터 토너가 자주 떨어져요', null, null, now() - interval '1 day');

  -- 기회 (발견)
  insert into public.opportunities (source, source_kind, department_id, title, summary, starts_at, deadline, location, mode, capacity, epic_points, epic_category,
                                    eligible_grades, eligible_departments, eligibility_note, steps, warning, original_url, posted_at, tags) values
    ('취업진로본부', 'epic', null, '취업·진로 MASTER CLASS 5회차: 대학생 진로설정법과 학년별 TO-DO',
     '현직 취업지원팀장이 학년별로 지금 할 일을 짚어줘요. 현장 참여도 돼요.',
     ((d + 28)::text || ' 18:30')::timestamp at time zone kst, ((d + 27)::text || ' 23:59')::timestamp at time zone kst,
     '테크노큐브 403호', 'mixed', 80, 70, 'recognized', '{1,2}', null, '1~2학년에게 맞는 회차예요',
     '[{"title":"EPiC에서 신청","body":"아래 버튼을 누르면 바로 그 페이지로 가요"},{"title":"당일 출석 체크","body":"현장이면 QR, 온라인이면 접속 기록으로 확인해요"}]',
     null, 'https://epic.seoultech.ac.kr', d - 12, '{취업 준비}'),
    ('취업진로본부', 'epic', null, '취업·진로 MASTER CLASS 6회차: 취준생 필수 준비 리스트와 FAQ',
     '서류부터 면접까지, 취준생이 자주 묻는 것만 모았어요.',
     ((d + 35)::text || ' 18:30')::timestamp at time zone kst, ((d + 34)::text || ' 23:59')::timestamp at time zone kst,
     '테크노큐브 403호', 'offline', 80, 70, 'recognized', '{3,4}', null, '3~4학년에게 맞는 회차예요',
     '[{"title":"EPiC에서 신청","body":"아래 버튼을 누르면 바로 그 페이지로 가요"}]',
     null, 'https://epic.seoultech.ac.kr', d - 12, '{취업 준비}'),
    ('취업진로본부', 'epic', null, '하반기 대면 직무별 모의면접 컨설팅',
     'HR 담당자 출신 면접관이 직무별로 모의면접을 봐줘요. 이력서와 자소서를 먼저 내야 해요.',
     ((d + 55)::text || ' 10:00')::timestamp at time zone kst, ((d + 45)::text || ' 23:59')::timestamp at time zone kst,
     '취업진로본부 상담실', 'offline', 40, 70, 'recognized', null, null, '재학생 누구나',
     '[{"title":"EPiC에서 신청","body":"신청할 때 희망 직무를 골라요"},{"title":"이력서와 자소서 제출","body":"신청 후 3일 안에 EPiC에 올려요"},{"title":"면접 시간 확정","body":"문자로 시간이 와요"}]',
     '이력서와 자소서를 내지 않으면 신청이 취소돼요', 'https://epic.seoultech.ac.kr', d - 8, '{취업 준비}'),
    ('식품생명공학과', 'epic', 'food', '나의 진로는 어디로? 식품생명공학분야 직업 인터뷰',
     '여러 직업을 현직자 인터뷰 영상으로 둘러볼 수 있어요. 시간 맞출 필요가 없어요.',
     null, ((d + 74)::text || ' 23:59')::timestamp at time zone kst,
     'e-class', 'online', 500, 70, 'recognized', null, null, '재학생이면 학과 상관없이 누구나. 작년에 듣지 않았으면 점수가 인정돼요',
     '[{"title":"EPiC에서 신청","body":"아래 버튼을 누르면 바로 그 페이지로 가요"},{"title":"e-class에서도 수강 신청","body":"교육현황 → 개설과목검색 → 비정규과목에서 \"나의 진로는 어디로\"로 검색"},{"title":"영상 시청하기","body":"마감 전날까지 e-class에서 들어요"}]',
     'EPiC이랑 e-class 둘 다 신청해야 해요', 'https://epic.seoultech.ac.kr', d - 140, '{진로 탐색,온라인}'),
    ('ITM전공 홈페이지', 'department', 'itm', '인터랙션 연구실 학부인턴 모집',
     '연구실 프로젝트에 학부생으로 직접 참여해볼 수 있어요. 학과 홈페이지에만 올라와서 놓치기 쉬워요.',
     null, ((d + 10)::text || ' 23:59')::timestamp at time zone kst,
     '프론티어관 연구실', 'offline', 2, null, null, '{2,3}', '{itm,ise}', 'ITM, 산업정보 2~3학년',
     '[{"title":"지원서와 성적표를 메일로 보내기","body":"원문에 있는 교수님 메일로 보내요"},{"title":"짧은 면담","body":"연구실에서 15분 정도 이야기해요"}]',
     null, 'https://itm.seoultech.ac.kr', d - 35, '{대학원·연구,IT·데이터}'),
    ('교외 공모전 · 학과 홈페이지 공지', 'contest', null, '공공데이터 활용 아이디어 공모전',
     '공공데이터로 생활 문제를 푸는 아이디어 공모전이에요. 국내전 입상하면 EPiC 200점.',
     null, ((d + 35)::text || ' 23:59')::timestamp at time zone kst,
     null, 'online', null, 200, 'contest', null, null, '대학생 누구나, 2~4인 팀',
     '[{"title":"팀 꾸리기","body":"기획, 데이터, 디자인, 개발 역할로 나눠요"},{"title":"제안서 제출","body":"공모전 사이트에 PDF로 내요"},{"title":"입상하면 학과 확인","body":"상장을 학과에 내면 EPiC 점수로 인정돼요"}]',
     '입상 후 학과 확인을 거쳐야 EPiC 점수가 들어가요', 'https://www.data.go.kr', d - 5, '{공모전·해커톤,IT·데이터}'),
    ('학사지원과', 'school', null, '마이크로디그리 이수',
     '한 분야 과목을 12학점 이상 묶어 들으면 받는 작은 전공이에요. 이미 들은 과목도 인정되고 졸업증명서에 표기돼요.',
     null, ((d + 80)::text || ' 23:59')::timestamp at time zone kst,
     null, 'online', null, 200, 'microdegree', '{2,3,4}', null, '2학년 이상',
     '[{"title":"과정 고르기","body":"들은 과목과 가까운 과정을 찾아요"},{"title":"학사지원과에 이수 신청","body":"학기 말에 신청 기간이 열려요"}]',
     null, 'https://www.seoultech.ac.kr', d - 20, '{자격증·어학}'),
    ('취업진로본부', 'school', null, '겨울방학 단기 현장실습',
     '방학 동안 기업에서 4~8주 실습해요. 이수하면 EPiC 200점.',
     null, ((d + 50)::text || ' 23:59')::timestamp at time zone kst,
     null, 'offline', 60, 200, 'internship', '{2,3,4}', null, '2학년 이상',
     '[{"title":"모집 공지 확인","body":"공지가 올라오면 알려드려요"},{"title":"기업 지원","body":"원하는 기업에 서류를 내요"}]',
     null, 'https://epic.seoultech.ac.kr', d - 3, '{취업 준비}'),
    ('EPiC 장학공지', 'scholarship', null, '고속도로장학재단 장학생 모집',
     '학업 성적과 생활 형편을 함께 보는 장학이에요. 자격 요건은 원문에서 확인해요.',
     null, ((d + 9)::text || ' 23:59')::timestamp at time zone kst,
     null, 'online', 20, null, null, null, null, '자격 요건은 원문 확인 필요',
     '[{"title":"원문에서 자격 확인","body":"성적, 소득 기준이 있어요"},{"title":"서류 제출","body":"학생지원과에 내요"}]',
     null, 'https://epic.seoultech.ac.kr', d - 25, '{장학}'),
    ('SeoulTech 창업지원단', 'contest', null, 'SeoulTech 해커톤 2026',
     '24시간 동안 팀으로 서비스를 만들어요. 처음 나가보는 팀도 많아요.',
     ((d + 46)::text || ' 10:00')::timestamp at time zone kst, ((d + 30)::text || ' 23:59')::timestamp at time zone kst,
     '창업보육센터', 'offline', 120, 200, 'contest', null, null, '재학생 누구나, 3~5인 팀',
     '[{"title":"팀 등록","body":"팀장이 대표로 등록해요"},{"title":"사전 온라인 준비 2번","body":"아이디어와 역할을 미리 정해요"}]',
     null, 'https://startup.seoultech.ac.kr', d - 10, '{공모전·해커톤,창업,IT·데이터}'),
    ('ITM전공', 'department', 'itm', 'ITM전공 졸업생 취업특강',
     '선배가 들려주는 IT 기획 직무 이야기. 학과 행사예요.',
     ((d + 15)::text || ' 19:00')::timestamp at time zone kst, ((d + 15)::text || ' 18:00')::timestamp at time zone kst,
     '프론티어관 107호', 'offline', 60, null, null, null, '{itm}', 'ITM전공 학생',
     '[{"title":"바로 오면 돼요","body":"따로 신청 없이 들어요"}]',
     null, 'https://itm.seoultech.ac.kr', d - 2, '{취업 준비}');

  insert into public.opportunities (source, source_kind, department_id, title, summary, posted_at, admin_notice, original_url, deadline) values
    ('ITM전공 홈페이지', 'department', 'itm', '산업공학과 ITM전공 학사 안내', '재학생 필수 확인. 졸업요건과 수강 규정이 바뀌었어요.', d - 32, true, 'https://itm.seoultech.ac.kr', null),
    ('ITM전공 홈페이지', 'department', 'itm', '학위취득유예 신청 안내', '졸업을 미루려면 기간 안에 신청해야 해요.', d - 6, true, 'https://itm.seoultech.ac.kr', ((d + 21)::text || ' 23:59')::timestamp at time zone kst);

  -- 저장해둔 것
  insert into public.saves (user_id, opportunity_id)
  select u_haneul, id from public.opportunities where title like 'ITM전공 졸업생%';
end;
$$;

revoke execute on function public.seed_demo() from public, anon, authenticated;

select public.seed_demo();
