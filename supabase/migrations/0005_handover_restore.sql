-- 임기 넘기기: 다시 넘길 때 비활성 행을 되살린다
create or replace function public.handover_term(p_org uuid, p_next_president uuid, p_keep jsonb, p_keep_units boolean default true)
returns int
language plpgsql security definer set search_path = ''
as $$
declare v_org public.orgs%rowtype; v_next int; v_item jsonb;
begin
  select * into v_org from public.orgs where id = p_org for update;
  if not found or not public.is_org_president(p_org) then raise exception '회장만 넘길 수 있어요'; end if;
  v_next := v_org.term + 1;

  update public.memberships set active = false where org_id = p_org and term = v_org.term and role <> 'member';

  insert into public.memberships (org_id, user_id, unit_id, title, role, term, sort)
  values (p_org, p_next_president, null, '학생회장', 'president', v_next, 0)
  on conflict (org_id, user_id, term) do update set role = 'president', title = '학생회장', unit_id = null, active = true;

  for v_item in select * from jsonb_array_elements(coalesce(p_keep, '[]'::jsonb)) loop
    if (v_item->>'user_id')::uuid = p_next_president then continue; end if;
    insert into public.memberships (org_id, user_id, unit_id, title, role, term, sort)
    values (p_org, (v_item->>'user_id')::uuid,
            case when p_keep_units then nullif(v_item->>'unit_id', '')::uuid end,
            coalesce(nullif(v_item->>'title', ''), '부원'), 'officer', v_next, 1)
    on conflict (org_id, user_id, term) do update
      set unit_id = excluded.unit_id, title = excluded.title, role = 'officer', active = true;
  end loop;

  update public.orgs set term = v_next where id = p_org;
  return v_next;
end;
$$;

-- 데모: 넘긴 임기를 이전 기수로 되돌린다 (DELETE 없이 활성 상태만 바꾼다)
create or replace function public.demo_restore_term(p_org uuid)
returns int
language plpgsql security definer set search_path = ''
as $$
declare v_org public.orgs%rowtype; v_prev int;
begin
  if public.me() is null then raise exception '로그인이 필요해요'; end if;
  select * into v_org from public.orgs where id = p_org for update;
  if not found or v_org.kind <> 'council' then raise exception '학생회가 아니에요'; end if;
  if not exists (select 1 from public.memberships where org_id = p_org and term = v_org.term - 1) then
    raise exception '되돌릴 이전 기수가 없어요';
  end if;
  v_prev := v_org.term - 1;
  update public.memberships set active = false where org_id = p_org and term = v_org.term;
  update public.memberships set active = true where org_id = p_org and term = v_prev;
  update public.orgs set term = v_prev where id = p_org;
  return v_prev;
end;
$$;

revoke execute on function public.demo_restore_term from public, anon;
grant execute on function public.demo_restore_term to authenticated;
