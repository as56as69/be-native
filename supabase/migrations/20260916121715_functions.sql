-- ---------------------------------------------------------- DB functions
-- Atomic credit spend (fast transit). Raises INSUFFICIENT_CREDITS when the
-- balance is below the amount; the UPDATE either fully deducts or no-ops.

create or replace function public.spend_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'AMOUNT_MUST_BE_POSITIVE';
  end if;

  update public.users
     set credits_balance = credits_balance - p_amount
   where id = p_user_id and credits_balance >= p_amount
   returning credits_balance into v_balance;

  if v_balance is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  return v_balance;
end;
$$;

grant execute on function public.spend_credits to anon, authenticated, service_role;

-- Atomic voucher redemption: locks the user row, marks the voucher redeemed
-- exactly once, and increments the balance in one transaction.

create or replace function public.redeem_voucher(p_user_id uuid, p_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_credit  integer;
begin
  perform 1 from public.users where id = p_user_id for update;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  update public.vouchers
     set is_redeemed         = true,
         redeemed_by_user_id = p_user_id,
         redeemed_at         = now()
   where code = p_code and not is_redeemed
   returning credit_amount into v_credit;

  if v_credit is null then
    raise exception 'VOUCHER_INVALID';
  end if;

  update public.users
     set credits_balance = credits_balance + v_credit
   where id = p_user_id
   returning credits_balance into v_balance;

  return v_balance;
end;
$$;

grant execute on function public.redeem_voucher to anon, authenticated, service_role;

commit;