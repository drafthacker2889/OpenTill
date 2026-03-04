-- 1. Ensure 'orders' table has necessary columns for the RPC
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number text;

-- 2. Ensure Gift Cards track usage
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS last_used timestamp with time zone;

-- 3. Drop old functions to avoid conflicts during recreation
DROP FUNCTION IF EXISTS sell_items(jsonb);
DROP FUNCTION IF EXISTS increment_gift_card_balance(text, numeric);

-- 4. Re-create the Gift Card Increment RPC
CREATE OR REPLACE FUNCTION increment_gift_card_balance(
  card_code_input text,
  amount numeric
) RETURNS jsonb AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  SELECT balance INTO current_balance FROM gift_cards WHERE code = card_code_input FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Gift card not found');
  END IF;

  new_balance := current_balance + amount;

  UPDATE gift_cards SET balance = new_balance, last_used = NOW() WHERE code = card_code_input;
  
  INSERT INTO gift_card_transactions (card_code, amount, transaction_type)
  VALUES (card_code_input, amount, 'TOPUP');

  RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$ LANGUAGE plpgsql;

-- 5. Re-create the 'sell_items' RPC (Critical for KDS & Stock)
CREATE OR REPLACE FUNCTION sell_items(order_payload jsonb)
RETURNS jsonb AS $$
DECLARE
  new_order_id uuid;
  item_record jsonb;
  order_total numeric;
  v_payment_method text;
  v_card_code text;
  v_branch_id uuid;
BEGIN
  v_payment_method := order_payload->>'paymentMethod';
  order_total := (order_payload->>'totalAmount')::numeric;
  v_branch_id := (order_payload->>'branchId')::uuid;

  -- A. Gift Card Payment Logic
  IF v_payment_method LIKE 'GIFT_CARD%' THEN
     v_card_code := order_payload->>'giftCardCode';
     -- Basic check if card exists and has balance
     UPDATE gift_cards
     SET balance = balance - (order_total / 100.0), last_used = NOW()
     WHERE code = v_card_code AND balance >= (order_total / 100.0);
     
     IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient gift card balance or invalid card';
     END IF;
     
     INSERT INTO gift_card_transactions (card_code, amount, transaction_type)
     VALUES (v_card_code, -(order_total / 100.0), 'PURCHASE');
  END IF;

  -- B. Create Order
  INSERT INTO orders (
    total_amount, payment_method, status, branch_id, customer_name, table_number
  ) VALUES (
    (order_payload->>'totalAmount')::int,
    v_payment_method,
    'COMPLETED',
    v_branch_id,
    order_payload->>'customerName',
    order_payload->>'tableNumber'
  ) RETURNING id INTO new_order_id;

  -- C. Process Items (Stock & Order Items)
  FOR item_record IN SELECT * FROM jsonb_array_elements(order_payload->'items')
  LOOP
    -- Deduct Stock (only if ID is valid)
    IF (item_record->>'id') IS NOT NULL AND (item_record->>'id') != '' THEN
        UPDATE branch_product_stock
        SET stock_quantity = stock_quantity - (item_record->>'quantity')::int
        WHERE variant_id = (item_record->>'id')::uuid AND branch_id = v_branch_id;
    END IF;

    -- Insert Order Item
    INSERT INTO order_items (
      order_id, variant_id, product_name_snapshot, quantity, price_at_sale, modifiers, branch_id
    ) VALUES (
      new_order_id,
      CASE WHEN (item_record->>'id') = '' OR (item_record->>'id') IS NULL THEN NULL ELSE (item_record->>'id')::uuid END,
      item_record->>'name',
      (item_record->>'quantity')::int,
      (item_record->>'price')::int,
      COALESCE(item_record->'modifiers', '[]'::jsonb),
      v_branch_id
    );
  END LOOP;
  
  -- D. Create Kitchen Ticket (Automated KDS)
  INSERT INTO kitchen_tickets (table_number, items, status, branch_id, created_at)
  VALUES (
    COALESCE(order_payload->>'tableNumber', 'Walk-In'),
    order_payload->'items',
    'PENDING',
    v_branch_id,
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'order_id', new_order_id);
END;
$$ LANGUAGE plpgsql;