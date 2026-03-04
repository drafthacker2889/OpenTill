-- Migration: Create sell_items RPC for atomic transactions and stock deduction
-- Also adds increment_gift_card_balance RPC

-- 1. Create type for order item input if needed, or just use JSONB
-- We will use JSONB for flexibility: 
-- payload: { 
--   branchId: uuid, 
--   totalAmount: number, 
--   paymentMethod: text, 
--   customerId: uuid (optional), 
--   items: [ { variant_id: uuid, quantity: number, price: number, modifiers: [] } ] 
-- }

CREATE OR REPLACE FUNCTION public.sell_items(order_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_total_amount numeric;
  v_recipe record;
  v_ingredient_deduction numeric;
BEGIN
  -- 1. Insert Order
  INSERT INTO public.orders (
    branch_id,
    total_amount,
    payment_method,
    customer_id,
    customer_name,
    table_number,
    status,
    created_at
  ) VALUES (
    (order_payload->>'branchId')::uuid,
    (order_payload->>'totalAmount')::numeric,
    order_payload->>'paymentMethod',
    (order_payload->>'customerId')::uuid,
    order_payload->>'customerName',
    order_payload->>'tableNumber',
    'COMPLETED',
    NOW()
  ) RETURNING id INTO v_order_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_payload->'items')
  LOOP
    v_variant_id := (v_item->>'id')::uuid; -- Assuming 'id' matches variant_id in payload
    v_quantity := (v_item->>'quantity')::int;

    -- Insert Order Item
    INSERT INTO public.order_items (
      order_id,
      variant_id,
      quantity,
      price_at_sale,
      modifiers
    ) VALUES (
      v_order_id,
      v_variant_id,
      v_quantity,
      (v_item->>'price')::numeric,
      v_item->'modifiers'
    );

    -- 3. Deduct Ingredients (Atomic Stock Management)
    FOR v_recipe IN 
      SELECT ingredient_id, quantity_required 
      FROM public.product_ingredients 
      WHERE variant_id = v_variant_id
    LOOP
      v_ingredient_deduction := v_recipe.quantity_required * v_quantity;

      UPDATE public.ingredients
      SET current_stock = current_stock - v_ingredient_deduction
      WHERE id = v_recipe.ingredient_id;
      
      -- Optional: Log wastage or check for low stock here if needed
    END LOOP;

    -- 4. Deduct Variant Stock (if tracked)
    UPDATE public.variants
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_variant_id AND track_stock = true;

  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;

-- 2. Gift Card Recharge RPC
CREATE OR REPLACE FUNCTION public.increment_gift_card_balance(card_code text, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gift_cards
  SET balance = balance + amount,
      last_used = NOW()
  WHERE code = card_code;
END;
$$;
