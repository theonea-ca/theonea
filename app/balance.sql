-- ============================================================
-- THE ONEA — 储值余额 / Prepaid balance
-- 在 Supabase → SQL Editor 里整段运行一次即可（重复运行也安全）。
--
-- 设计：
--   · 只记流水，不直接改余额；余额 = 所有记录相加
--   · 储值金额 paid_cents 和赠送额度 bonus_cents 分开记，金额以「分」存
--   · 扣款先用赠送额度，再用储值金额；余额不会变成负数
--   · 只有登录后台的你能写入；记录不能修改或删除，记错了加一条「调整」
--   · 客人用手机号 + 访问码查看自己的余额（复用 client_login 的验证和锁定）
-- ============================================================

create table if not exists public.balance_transactions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete restrict,
  type        text not null check (type in ('topup','bonus','redeem','refund','adjust')),
  paid_cents  integer not null default 0,
  bonus_cents integer not null default 0,
  booking_ref text,
  label_zh    text,
  label_en    text,
  method      text,
  note        text,            -- 只有后台可见
  created_at  timestamptz not null default now()
);
create index if not exists balance_tx_client_idx on public.balance_transactions (client_id, created_at desc);

alter table public.balance_transactions enable row level security;

-- 后台（已登录）可以读；不建任何写入 policy：写入只能走下面的函数
drop policy if exists balance_admin_read on public.balance_transactions;
create policy balance_admin_read on public.balance_transactions
  for select to authenticated using (true);

-- ---------- 内部：当前余额 ----------
create or replace function public._balance_of(p_client uuid, out paid bigint, out bonus bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(paid_cents),0), coalesce(sum(bonus_cents),0)
  from public.balance_transactions where client_id = p_client;
$$;

-- ---------- 充值（储值 + 赠送一次写入） ----------
create or replace function public.balance_topup(
  p_client uuid, p_paid_cents integer, p_bonus_cents integer default 0,
  p_method text default null, p_note text default null)
returns json language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if auth.role() is distinct from 'authenticated' then raise exception 'not_allowed'; end if;
  if p_paid_cents is null or p_paid_cents <= 0 or coalesce(p_bonus_cents,0) < 0 then raise exception 'bad_amount'; end if;
  perform pg_advisory_xact_lock(hashtext(p_client::text));
  insert into balance_transactions (client_id, type, paid_cents, label_zh, label_en, method, note)
    values (p_client, 'topup', p_paid_cents, '储值充值', 'Top-up', p_method, p_note);
  if coalesce(p_bonus_cents,0) > 0 then
    insert into balance_transactions (client_id, type, bonus_cents, label_zh, label_en)
      values (p_client, 'bonus', p_bonus_cents, '充值赠送', 'Bonus');
  end if;
  select * into b from _balance_of(p_client);
  return json_build_object('paid', b.paid, 'bonus', b.bonus);
end $$;

-- ---------- 扣款：先扣赠送，再扣储值 ----------
create or replace function public.balance_redeem(
  p_client uuid, p_amount_cents integer, p_booking_ref text default null,
  p_label_zh text default null, p_label_en text default null, p_note text default null)
returns json language plpgsql security definer set search_path = public as $$
declare b record; use_bonus integer; use_paid integer;
begin
  if auth.role() is distinct from 'authenticated' then raise exception 'not_allowed'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'bad_amount'; end if;
  perform pg_advisory_xact_lock(hashtext(p_client::text));
  select * into b from _balance_of(p_client);
  if b.paid + b.bonus < p_amount_cents then raise exception 'insufficient'; end if;
  use_bonus := least(b.bonus, p_amount_cents);
  use_paid  := p_amount_cents - use_bonus;
  insert into balance_transactions (client_id, type, paid_cents, bonus_cents, booking_ref, label_zh, label_en, note)
    values (p_client, 'redeem', -use_paid, -use_bonus, p_booking_ref, p_label_zh, p_label_en, p_note);
  return json_build_object('paid', b.paid - use_paid, 'bonus', b.bonus - use_bonus,
                           'used_paid', use_paid, 'used_bonus', use_bonus);
end $$;

-- ---------- 调整 / 停业退款（备注必填） ----------
create or replace function public.balance_adjust(
  p_client uuid, p_type text, p_paid_cents integer, p_bonus_cents integer, p_note text)
returns json language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if auth.role() is distinct from 'authenticated' then raise exception 'not_allowed'; end if;
  if p_type not in ('adjust','refund') then raise exception 'bad_type'; end if;
  if coalesce(trim(p_note),'') = '' then raise exception 'note_required'; end if;
  if coalesce(p_paid_cents,0) = 0 and coalesce(p_bonus_cents,0) = 0 then raise exception 'bad_amount'; end if;
  perform pg_advisory_xact_lock(hashtext(p_client::text));
  select * into b from _balance_of(p_client);
  if b.paid + coalesce(p_paid_cents,0) < 0 or b.bonus + coalesce(p_bonus_cents,0) < 0 then raise exception 'insufficient'; end if;
  insert into balance_transactions (client_id, type, paid_cents, bonus_cents, label_zh, label_en, note)
    values (p_client, p_type, coalesce(p_paid_cents,0), coalesce(p_bonus_cents,0),
            case p_type when 'refund' then '余额退款' else '余额调整' end,
            case p_type when 'refund' then 'Refund' else 'Adjustment' end, p_note);
  return json_build_object('paid', b.paid + coalesce(p_paid_cents,0), 'bonus', b.bonus + coalesce(p_bonus_cents,0));
end $$;

-- ---------- 客人查看自己的余额（不返回备注） ----------
create or replace function public.client_balance(p_phone text, p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare r json; cid uuid; b record;
begin
  r := public.client_login(p_phone, p_code)::json;
  if coalesce((r->>'ok')::boolean, false) is not true then
    return json_build_object('ok', false, 'error', coalesce(r->>'error','nomatch'));
  end if;
  cid := (r->'client'->>'id')::uuid;
  select * into b from _balance_of(cid);
  return json_build_object('ok', true, 'paid', b.paid, 'bonus', b.bonus,
    'tx', coalesce((select json_agg(json_build_object(
              'type', t.type, 'paid', t.paid_cents, 'bonus', t.bonus_cents,
              'label_zh', t.label_zh, 'label_en', t.label_en, 'at', t.created_at) order by t.created_at desc)
            from (select * from balance_transactions where client_id = cid order by created_at desc limit 100) t), '[]'::json));
end $$;

-- ---------- 权限 ----------
revoke all on function public._balance_of(uuid) from public, anon, authenticated;
revoke all on function public.balance_topup(uuid,integer,integer,text,text) from public, anon;
revoke all on function public.balance_redeem(uuid,integer,text,text,text,text) from public, anon;
revoke all on function public.balance_adjust(uuid,text,integer,integer,text) from public, anon;
grant execute on function public.balance_topup(uuid,integer,integer,text,text) to authenticated;
grant execute on function public.balance_redeem(uuid,integer,text,text,text,text) to authenticated;
grant execute on function public.balance_adjust(uuid,text,integer,integer,text) to authenticated;
grant execute on function public.client_balance(text,text) to anon, authenticated;
