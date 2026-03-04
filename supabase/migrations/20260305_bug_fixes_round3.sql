-- FIX: Missing add_loyalty_points RPC
CREATE OR REPLACE FUNCTION add_loyalty_points(customer_id uuid, points integer)
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET loyalty_points = loyalty_points + points
  WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX: Prevent Duplicate Ingredients in Recipes
-- First, clean up duplicates if any exist (keeping the one with highest quantity or just latest)
-- Efficient de-dupe logic:
DELETE FROM product_ingredients a USING product_ingredients b
WHERE a.id < b.id 
  AND a.variant_id = b.variant_id 
  AND a.ingredient_id = b.ingredient_id;

-- Now add the constraint
ALTER TABLE product_ingredients 
ADD CONSTRAINT unique_recipe_ingredient UNIQUE (variant_id, ingredient_id);
