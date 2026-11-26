-- ============================================================
-- THE ONEA — 我的护肤柜 / My Shelf
-- 在 Supabase → SQL Editor 里整段运行一次即可（重复运行也安全）。
-- 需要先运行过 balance.sql（用到 client_login）。
--
-- 设计：
--   · 所有有 app 账号的客人都可以用（非会员做 Shelf Edit 是 $49，会员 $29）
--   · 每人最多 20 件；每件两张照片：正面 + 成分表
--   · 照片在手机上压缩后存在单独一张表里，只能通过「手机号 + 访问码」的函数
--     或登录后台的你读取，外人拿不到（相当于私有存储，不需要另外开 Storage）
--   · 列表只带一张小缩略图，打开某件产品时才读取两张大图，省流量
--   · 你在后台给每件打标签：保留 / 暂停 / 重复 / 停用，并写中英文说明
--   · 客人改动后，这件会重新变成「待查看」
-- ============================================================

create table if not exists public.shelf_items (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  name        text not null,
  brand       text,
  category    text,
  usage       text,                  -- am / pm / both / weekly / sometimes / not_using
  opened      date,
  note        text,                  -- 客人写给你的
  thumb       text,                  -- 小缩略图（约 5–10KB）
  verdict     text check (verdict in ('keep','pause','duplicate','stop')),
  advice_zh   text,
  advice_en   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),   -- 客人最后一次改动
  reviewed_at timestamptz,                          -- 你最后一次打标签
  needs_review boolean generated always as (reviewed_at is null or updated_at > reviewed_at) stored
);
create index if not exists shelf_client_idx on public.shelf_items (client_id, created_at);
create index if not exists shelf_review_idx on public.shelf_items (needs_review) where needs_review;

create table if not exists public.shelf_photos (
  item_id     uuid primary key references public.shelf_items(id) on delete cascade,
  front       text,                  -- 正面
  ingredients text                   -- 成分表
);

alter table public.shelf_items  enable row level security;
alter table public.shelf_photos enable row level security;

-- 后台（已登录）可以读、可以删；写入只走下面的函数。客人（anon）没有任何直接读写权限。
drop policy if exists shelf_admin_read on public.shelf_items;
create policy shelf_admin_read on public.shelf_items for select to authenticated using (true);
drop policy if exists shelf_admin_delete on public.shelf_items;
create policy shelf_admin_delete on public.shelf_items for delete to authenticated using (true);
drop policy if exists shelf_photos_admin_read on public.shelf_photos;
create policy shelf_photos_admin_read on public.shelf_photos for select to authenticated using (true);

-- ---------- 内部：客人验证，返回 client id ----------
create or replace function public._shelf_auth(p_phone text, p_code text, out cid uuid, out err text)
language plpgsql security definer set search_path = public as $$
declare r json;
begin
  r := public.client_login(p_phone, p_code)::json;
  if coalesce((r->>'ok')::boolean, false) is not true then
    err := coalesce(r->>'error', 'nomatch'); return;
  end if;
  cid := (r->'client'->>'id')::uuid;
end $$;

-- ---------- 内部：照片检查（只收压缩后的图片） ----------
create or replace function public._shelf_img(p text, p_max int)
returns text language plpgsql immutable as $$
begin
  if p is null or p = '' then return null; end if;
  if length(p) > p_max or p not like 'data:image/%' then raise exception 'photo_too_big'; end if;
  return p;
end $$;

-- ---------- 客人：查看自己的护肤柜（只带缩略图） ----------
create or replace function public.shelf_list(p_phone text, p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select * into a from _shelf_auth(p_phone, p_code);
  if a.cid is null then return json_build_object('ok', false, 'error', a.err); end if;
  return json_build_object('ok', true, 'limit', 20,
    'items', coalesce((select json_agg(json_build_object(
        'id', s.id, 'name', s.name, 'brand', s.brand, 'category', s.category, 'usage', s.usage,
        'opened', s.opened, 'note', s.note, 'thumb', s.thumb,
        'has_front', p.front is not null, 'has_ingredients', p.ingredients is not null,
        'verdict', case when s.reviewed_at is null then null else s.verdict end,
        'advice_zh', s.advice_zh, 'advice_en', s.advice_en,
        'created_at', s.created_at, 'reviewed_at', s.reviewed_at,
        'needs_review', s.needs_review) order by s.created_at)
      from shelf_items s left join shelf_photos p on p.item_id = s.id
      where s.client_id = a.cid), '[]'::json));
end $$;

-- ---------- 客人：读取某一件的两张大图 ----------
create or replace function public.shelf_photos_get(p_phone text, p_code text, p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare a record; r record;
begin
  select * into a from _shelf_auth(p_phone, p_code);
  if a.cid is null then return json_build_object('ok', false, 'error', a.err); end if;
  select p.front, p.ingredients into r
    from shelf_items s join shelf_photos p on p.item_id = s.id
    where s.id = p_id and s.client_id = a.cid;
  return json_build_object('ok', true, 'front', r.front, 'ingredients', r.ingredients);
end $$;

-- ---------- 客人：新增 / 修改一件 ----------
-- p_item: name, brand, category, usage, opened, note, thumb, front, ingredients
-- 修改时：没有传 front / ingredients / thumb 这几个键 = 保留原来的照片；传空字符串 = 删除
create or replace function public.shelf_save(p_phone text, p_code text, p_id uuid, p_item json)
returns json language plpgsql security definer set search_path = public as $$
declare a record; j jsonb := p_item::jsonb; nm text; new_id uuid;
begin
  select * into a from _shelf_auth(p_phone, p_code);
  if a.cid is null then return json_build_object('ok', false, 'error', a.err); end if;

  nm := left(trim(coalesce(j->>'name','')), 120);
  if nm = '' then return json_build_object('ok', false, 'error', 'name_required'); end if;

  begin
    perform _shelf_img(j->>'thumb', 40000), _shelf_img(j->>'front', 400000), _shelf_img(j->>'ingredients', 400000);
  exception when others then
    return json_build_object('ok', false, 'error', 'photo_too_big');
  end;

  if p_id is null then
    if (select count(*) from shelf_items where client_id = a.cid) >= 20 then
      return json_build_object('ok', false, 'error', 'too_many');
    end if;
    insert into shelf_items (client_id, name, brand, category, usage, opened, note, thumb)
    values (a.cid, nm, left(nullif(trim(j->>'brand'),''),120), left(nullif(j->>'category',''),40),
            left(nullif(j->>'usage',''),40), nullif(j->>'opened','')::date,
            left(nullif(trim(j->>'note'),''),1000), nullif(j->>'thumb',''))
    returning id into new_id;
    insert into shelf_photos (item_id, front, ingredients)
    values (new_id, nullif(j->>'front',''), nullif(j->>'ingredients',''));
  else
    update shelf_items set
      name = nm, brand = left(nullif(trim(j->>'brand'),''),120),
      category = left(nullif(j->>'category',''),40), usage = left(nullif(j->>'usage',''),40),
      opened = nullif(j->>'opened','')::date, note = left(nullif(trim(j->>'note'),''),1000),
      thumb = case when j ? 'thumb' then nullif(j->>'thumb','') else thumb end,
      updated_at = clock_timestamp()
    where id = p_id and client_id = a.cid
    returning id into new_id;
    if new_id is null then return json_build_object('ok', false, 'error', 'not_found'); end if;
    insert into shelf_photos (item_id, front, ingredients)
    values (new_id, nullif(j->>'front',''), nullif(j->>'ingredients',''))
    on conflict (item_id) do update set
      front       = case when j ? 'front'       then nullif(j->>'front','')       else shelf_photos.front end,
      ingredients = case when j ? 'ingredients' then nullif(j->>'ingredients','') else shelf_photos.ingredients end;
  end if;
  return json_build_object('ok', true, 'id', new_id);
end $$;

-- ---------- 客人：删除一件（用完了 / 扔掉了） ----------
create or replace function public.shelf_delete(p_phone text, p_code text, p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select * into a from _shelf_auth(p_phone, p_code);
  if a.cid is null then return json_build_object('ok', false, 'error', a.err); end if;
  delete from shelf_items where id = p_id and client_id = a.cid;
  return json_build_object('ok', true);
end $$;

-- ---------- 后台：打标签 + 写说明（只有登录后台的你可以） ----------
create or replace function public.shelf_review(p_id uuid, p_verdict text, p_advice_zh text, p_advice_en text)
returns json language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if auth.role() is distinct from 'authenticated' then raise exception 'not_allowed'; end if;
  if p_verdict is not null and p_verdict not in ('keep','pause','duplicate','stop') then raise exception 'bad_verdict'; end if;
  update shelf_items set verdict = p_verdict,
    advice_zh = nullif(trim(coalesce(p_advice_zh,'')),''), advice_en = nullif(trim(coalesce(p_advice_en,'')),''),
    reviewed_at = clock_timestamp()
  where id = p_id
  returning id, verdict, advice_zh, advice_en, reviewed_at, needs_review into r;
  if r.id is null then raise exception 'not_found'; end if;
  return row_to_json(r);
end $$;

-- ---------- 权限 ----------
revoke all on function public._shelf_auth(text,text) from public, anon, authenticated;
revoke all on function public.shelf_review(uuid,text,text,text) from public, anon;
grant execute on function public.shelf_list(text,text) to anon, authenticated;
grant execute on function public.shelf_photos_get(text,text,uuid) to anon, authenticated;
grant execute on function public.shelf_save(text,text,uuid,json) to anon, authenticated;
grant execute on function public.shelf_delete(text,text,uuid) to anon, authenticated;
grant execute on function public.shelf_review(uuid,text,text,text) to authenticated;
