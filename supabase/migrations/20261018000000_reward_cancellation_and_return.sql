-- 1. Expand status check constraint on reward_purchases
ALTER TABLE public.reward_purchases 
  DROP CONSTRAINT IF EXISTS reward_purchases_status_check;

ALTER TABLE public.reward_purchases 
  ADD CONSTRAINT reward_purchases_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'redeemed'::text, 'cancelled'::text, 'rejected'::text]));

-- 2. Allow children to cancel their own pending purchases
DROP POLICY IF EXISTS "Children can cancel own pending purchases" ON public.reward_purchases;
CREATE POLICY "Children can cancel own pending purchases"
  ON public.reward_purchases FOR UPDATE
  USING (
    child_id = (SELECT auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    child_id = (SELECT auth.uid())
    AND status = 'cancelled'
  );

-- 3. Stored Procedure: cancel_reward_purchase (Child Action)
CREATE OR REPLACE FUNCTION public.cancel_reward_purchase(p_purchase_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase record;
  v_price int;
  v_new_balance int;
BEGIN
  -- Retrieve the purchase record
  SELECT * INTO v_purchase
  FROM public.reward_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'הבקשה לא נמצאה');
  END IF;

  -- Ensure caller is the child who requested it
  IF v_purchase.child_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'אין הרשאה לבטל בקשה זו');
  END IF;

  -- Ensure status is pending
  IF v_purchase.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'ניתן לבטל רק בקשות שממתינות למימוש');
  END IF;

  -- Get reward price
  SELECT price INTO v_price
  FROM public.rewards_store
  WHERE id = v_purchase.reward_id;

  IF v_price IS NULL THEN
    v_price := 0;
  END IF;

  -- Update purchase status
  UPDATE public.reward_purchases
  SET status = 'cancelled'
  WHERE id = p_purchase_id;

  -- Refund stars to child's profile
  UPDATE public.profiles
  SET stars_balance = stars_balance + v_price
  WHERE id = v_purchase.child_id
  RETURNING stars_balance INTO v_new_balance;

  RETURN json_build_object(
    'success', true,
    'refunded_stars', v_price,
    'new_balance', v_new_balance
  );
END;
$$;

-- 4. Stored Procedure: reject_reward_purchase (Parent Action)
CREATE OR REPLACE FUNCTION public.reject_reward_purchase(p_purchase_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase record;
  v_price int;
  v_new_balance int;
  v_caller_role public.user_role;
  v_caller_family_id uuid;
BEGIN
  -- Retrieve caller info
  SELECT role, family_id INTO v_caller_role, v_caller_family_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role NOT IN ('parent', 'admin_parent') THEN
    RETURN json_build_object('success', false, 'error', 'רק הורה יכול להחזיר או לדחות בקשת פרס');
  END IF;

  -- Retrieve purchase record
  SELECT * INTO v_purchase
  FROM public.reward_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'הבקשה לא נמצאה');
  END IF;

  -- Ensure purchase belongs to same family
  IF v_purchase.family_id != v_caller_family_id THEN
    RETURN json_build_object('success', false, 'error', 'אין הרשאה לפעולה זו במשפחה זו');
  END IF;

  -- Ensure status is pending
  IF v_purchase.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'ניתן להחזיר רק בקשות שממתינות למימוש');
  END IF;

  -- Get reward price
  SELECT price INTO v_price
  FROM public.rewards_store
  WHERE id = v_purchase.reward_id;

  IF v_price IS NULL THEN
    v_price := 0;
  END IF;

  -- Update purchase status
  UPDATE public.reward_purchases
  SET status = 'rejected'
  WHERE id = p_purchase_id;

  -- Refund stars to child's profile
  UPDATE public.profiles
  SET stars_balance = stars_balance + v_price
  WHERE id = v_purchase.child_id
  RETURNING stars_balance INTO v_new_balance;

  RETURN json_build_object(
    'success', true,
    'refunded_stars', v_price,
    'child_id', v_purchase.child_id,
    'new_balance', v_new_balance
  );
END;
$$;
