-- Update SKU format: add store prefix letter (e.g. A12345, B12345)
-- Update existing SKUs to have 'A' prefix (original store)

UPDATE products
SET sku = 'A' || sku
WHERE sku !~ '^[A-Z]';

-- Update the generate_product_sku function to accept a prefix letter
CREATE OR REPLACE FUNCTION generate_product_sku(_prefix TEXT DEFAULT 'A')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_sku TEXT;
  prefix_char TEXT;
BEGIN
  -- Ensure prefix is a single uppercase letter
  prefix_char := UPPER(LEFT(COALESCE(NULLIF(TRIM(_prefix), ''), 'A'), 1));

  LOOP
    new_sku := prefix_char || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM products WHERE sku = new_sku);
  END LOOP;
  RETURN new_sku;
END;
$$;
