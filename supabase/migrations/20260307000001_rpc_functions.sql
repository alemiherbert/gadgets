-- PostgreSQL functions for complex queries (called via Supabase RPC)

-- ─── Great Deals ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_great_deals(_limit INT, _offset INT)
RETURNS SETOF products AS $$
  SELECT *
  FROM products
  WHERE active = 1
    AND compare_at_price IS NOT NULL
    AND compare_at_price > price
  ORDER BY
    ROUND(((compare_at_price - price) * 100.0) / compare_at_price) DESC,
    sales_count DESC
  LIMIT _limit OFFSET _offset;
$$ LANGUAGE sql STABLE;

-- ─── Shop Products (complex filtered query) ─────────────
CREATE OR REPLACE FUNCTION get_shop_products(
  _category_slug TEXT DEFAULT NULL,
  _subcategory_slug TEXT DEFAULT NULL,
  _brand_slug TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL,
  _min_price INT DEFAULT NULL,
  _max_price INT DEFAULT NULL,
  _spec_filters TEXT DEFAULT NULL,  -- JSON string
  _sort TEXT DEFAULT 'newest',
  _limit INT DEFAULT 48,
  _offset INT DEFAULT 0
)
RETURNS TABLE(products JSONB, total BIGINT) AS $$
DECLARE
  _sql TEXT;
  _count_sql TEXT;
  _where TEXT := 'p.active = 1';
  _joins TEXT := '';
  _order TEXT := 'p.created_at DESC';
  _total BIGINT;
  _result JSONB;
  _terms TEXT[];
  _term TEXT;
  _term_conds TEXT[];
  _term_cond TEXT;
  _spec_obj JSONB;
  _spec_key TEXT;
  _spec_vals JSONB;
BEGIN
  -- Sort
  IF _sort = 'price-asc' THEN _order := 'p.price ASC';
  ELSIF _sort = 'price-desc' THEN _order := 'p.price DESC';
  ELSIF _sort = 'popular' THEN _order := 'p.sales_count DESC';
  ELSIF _sort = 'discount' THEN _order := 'CASE WHEN p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price THEN ROUND(((p.compare_at_price - p.price) * 100.0) / p.compare_at_price) ELSE 0 END DESC';
  END IF;

  -- Subcategory filter
  IF _subcategory_slug IS NOT NULL THEN
    _joins := _joins || ' JOIN subcategories s ON p.subcategory_id = s.id';
    _where := _where || format(' AND s.slug = %L', _subcategory_slug);
  END IF;

  -- Category filter
  IF _category_slug IS NOT NULL AND _subcategory_slug IS NULL THEN
    _joins := _joins || ' JOIN product_categories pc ON p.id = pc.product_id JOIN categories c ON pc.category_id = c.id';
    _where := _where || format(' AND c.slug = %L', _category_slug);
  END IF;

  -- Brand filter
  IF _brand_slug IS NOT NULL THEN
    _joins := _joins || ' JOIN brands b ON p.brand_id = b.id';
    _where := _where || format(' AND b.slug = %L', _brand_slug);
  END IF;

  -- Search filter
  IF _search IS NOT NULL AND _search != '' THEN
    _terms := regexp_split_to_array(trim(_search), '\s+');
    _term_conds := ARRAY[]::TEXT[];
    FOREACH _term IN ARRAY _terms LOOP
      _term_conds := array_append(_term_conds, format(
        '(p.name ILIKE %L OR p.description ILIKE %L OR p.specs::text ILIKE %L OR EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name ILIKE %L) OR EXISTS (SELECT 1 FROM subcategories sc WHERE sc.id = p.subcategory_id AND sc.name ILIKE %L))',
        '%' || _term || '%', '%' || _term || '%', '%' || _term || '%', '%' || _term || '%', '%' || _term || '%'
      ));
    END LOOP;
    _where := _where || ' AND (' || array_to_string(_term_conds, ' AND ') || ')';
  END IF;

  -- Price filters
  IF _min_price IS NOT NULL THEN
    _where := _where || format(' AND p.price >= %s', _min_price);
  END IF;
  IF _max_price IS NOT NULL THEN
    _where := _where || format(' AND p.price <= %s', _max_price);
  END IF;

  -- Spec filters (JSONB)
  IF _spec_filters IS NOT NULL AND _spec_filters != '' THEN
    _spec_obj := _spec_filters::jsonb;
    FOR _spec_key, _spec_vals IN SELECT * FROM jsonb_each(_spec_obj) LOOP
      IF jsonb_array_length(_spec_vals) > 0 THEN
        _where := _where || format(' AND p.specs->>%L IN (SELECT jsonb_array_elements_text(%L::jsonb))', _spec_key, _spec_vals::text);
      END IF;
    END LOOP;
  END IF;

  -- Count total
  _count_sql := format('SELECT COUNT(*) FROM products p %s WHERE %s', _joins, _where);
  EXECUTE _count_sql INTO _total;

  -- Get products
  _sql := format('SELECT jsonb_agg(sub) FROM (SELECT p.* FROM products p %s WHERE %s ORDER BY %s LIMIT %s OFFSET %s) sub',
    _joins, _where, _order, _limit, _offset);
  EXECUTE _sql INTO _result;

  RETURN QUERY SELECT COALESCE(_result, '[]'::jsonb), COALESCE(_total, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Available Specs ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_available_specs(_subcategory_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  _result JSONB := '{}'::jsonb;
  _row RECORD;
  _specs JSONB;
  _key TEXT;
  _val TEXT;
  _current_vals JSONB;
BEGIN
  FOR _row IN
    SELECT p.specs FROM products p
    JOIN subcategories s ON p.subcategory_id = s.id
    WHERE p.active = 1 AND s.slug = _subcategory_slug
  LOOP
    _specs := _row.specs;
    FOR _key, _val IN SELECT key, value::text FROM jsonb_each_text(_specs) LOOP
      _current_vals := COALESCE(_result->_key, '[]'::jsonb);
      IF NOT _current_vals ? _val THEN
        _current_vals := _current_vals || to_jsonb(_val);
      END IF;
      _result := jsonb_set(_result, ARRAY[_key], _current_vals);
    END LOOP;
  END LOOP;

  -- Sort values within each key
  FOR _key IN SELECT key FROM jsonb_each(_result) LOOP
    _result := jsonb_set(_result, ARRAY[_key],
      (SELECT jsonb_agg(v ORDER BY v) FROM jsonb_array_elements_text(_result->_key) v)
    );
  END LOOP;

  RETURN _result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Price Range ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_price_range(_category_slug TEXT DEFAULT NULL)
RETURNS TABLE(min INT, max INT) AS $$
BEGIN
  IF _category_slug IS NOT NULL THEN
    RETURN QUERY
      SELECT MIN(p.price)::INT, MAX(p.price)::INT FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE p.active = 1 AND c.slug = _category_slug;
  ELSE
    RETURN QUERY
      SELECT MIN(price)::INT, MAX(price)::INT FROM products WHERE active = 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Search Products ─────────────────────────────────────
CREATE OR REPLACE FUNCTION search_products(_query TEXT, _category_id INT DEFAULT NULL)
RETURNS SETOF products AS $$
DECLARE
  _terms TEXT[];
  _term TEXT;
  _term_conds TEXT[];
  _search_where TEXT;
  _sql TEXT;
BEGIN
  _terms := regexp_split_to_array(trim(_query), '\s+');
  IF array_length(_terms, 1) IS NULL OR array_length(_terms, 1) = 0 THEN
    RETURN;
  END IF;

  _term_conds := ARRAY[]::TEXT[];
  FOREACH _term IN ARRAY _terms LOOP
    _term_conds := array_append(_term_conds, format(
      '(p.name ILIKE %L OR p.description ILIKE %L OR p.specs::text ILIKE %L OR EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name ILIKE %L) OR EXISTS (SELECT 1 FROM subcategories sc WHERE sc.id = p.subcategory_id AND sc.name ILIKE %L))',
      '%' || _term || '%', '%' || _term || '%', '%' || _term || '%', '%' || _term || '%', '%' || _term || '%'
    ));
  END LOOP;
  _search_where := array_to_string(_term_conds, ' AND ');

  IF _category_id IS NOT NULL THEN
    _sql := format(
      'SELECT p.* FROM products p JOIN product_categories pc ON p.id = pc.product_id WHERE p.active = 1 AND pc.category_id = %s AND (%s) ORDER BY CASE WHEN LOWER(p.name) = LOWER(%L) THEN 1 WHEN LOWER(p.name) LIKE LOWER(%L) THEN 2 WHEN EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name ILIKE %L) THEN 3 ELSE 4 END, p.sales_count DESC',
      _category_id, _search_where, _query, '%' || _query || '%', '%' || _query || '%'
    );
  ELSE
    _sql := format(
      'SELECT p.* FROM products p WHERE p.active = 1 AND (%s) ORDER BY CASE WHEN LOWER(p.name) = LOWER(%L) THEN 1 WHEN LOWER(p.name) LIKE LOWER(%L) THEN 2 WHEN EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name ILIKE %L) THEN 3 ELSE 4 END, p.sales_count DESC',
      _search_where, _query, '%' || _query || '%', '%' || _query || '%'
    );
  END IF;

  RETURN QUERY EXECUTE _sql;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Products by Category ────────────────────────────────
CREATE OR REPLACE FUNCTION get_products_by_category(_category_id INT)
RETURNS SETOF products AS $$
  SELECT p.* FROM products p
  JOIN product_categories pc ON p.id = pc.product_id
  WHERE p.active = 1 AND pc.category_id = _category_id
  ORDER BY p.created_at DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_products_by_category_slug(_slug TEXT)
RETURNS SETOF products AS $$
  SELECT p.* FROM products p
  JOIN product_categories pc ON p.id = pc.product_id
  JOIN categories c ON pc.category_id = c.id
  WHERE p.active = 1 AND c.slug = _slug
  ORDER BY p.created_at DESC;
$$ LANGUAGE sql STABLE;

-- ─── Recommended Products ────────────────────────────────
CREATE OR REPLACE FUNCTION get_recommended_products(_product_id INT, _limit INT DEFAULT 4, _customer_id INT DEFAULT NULL)
RETURNS SETOF products AS $$
DECLARE
  _seen INT[] := ARRAY[_product_id];
  _results products[];
  _row products;
  _count INT := 0;
BEGIN
  -- 1. Co-purchased products
  FOR _row IN
    SELECT p.* FROM products p
    WHERE p.active = 1 AND p.id != _product_id
    AND p.id IN (
      SELECT oi2.product_id FROM order_items oi1
      JOIN order_items oi2 ON oi1.order_id = oi2.order_id
      WHERE oi1.product_id = _product_id AND oi2.product_id != _product_id
      GROUP BY oi2.product_id
      ORDER BY COUNT(*) DESC
      LIMIT _limit
    )
  LOOP
    IF NOT _row.id = ANY(_seen) THEN
      _seen := array_append(_seen, _row.id);
      RETURN NEXT _row;
      _count := _count + 1;
      EXIT WHEN _count >= _limit;
    END IF;
  END LOOP;

  -- 2. Co-viewed products (collaborative filtering)
  IF _count < _limit AND _customer_id IS NOT NULL THEN
    FOR _row IN
      SELECT p.* FROM products p
      WHERE p.active = 1 AND NOT p.id = ANY(_seen)
      AND p.id IN (
        SELECT pv2.product_id FROM product_views pv1
        JOIN product_views pv2 ON pv1.customer_id = pv2.customer_id
        WHERE pv1.product_id = _product_id AND pv2.product_id != _product_id
        AND pv1.customer_id IS NOT NULL
        GROUP BY pv2.product_id
        ORDER BY COUNT(*) DESC
        LIMIT _limit * 2
      )
      ORDER BY p.sales_count DESC
      LIMIT _limit - _count
    LOOP
      IF NOT _row.id = ANY(_seen) THEN
        _seen := array_append(_seen, _row.id);
        RETURN NEXT _row;
        _count := _count + 1;
        EXIT WHEN _count >= _limit;
      END IF;
    END LOOP;
  END IF;

  -- 3. Same category products
  IF _count < _limit THEN
    FOR _row IN
      SELECT DISTINCT p.* FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.active = 1 AND NOT p.id = ANY(_seen)
      AND pc.category_id IN (
        SELECT category_id FROM product_categories WHERE product_id = _product_id
      )
      ORDER BY p.sales_count DESC, p.featured DESC, p.created_at DESC
      LIMIT _limit * 2
    LOOP
      IF NOT _row.id = ANY(_seen) THEN
        _seen := array_append(_seen, _row.id);
        RETURN NEXT _row;
        _count := _count + 1;
        EXIT WHEN _count >= _limit;
      END IF;
    END LOOP;
  END IF;

  -- 4. Popular products fallback
  IF _count < _limit THEN
    FOR _row IN
      SELECT p.* FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.created_at > now() - interval '30 days'
      WHERE p.active = 1 AND NOT p.id = ANY(_seen)
      GROUP BY p.id
      ORDER BY COUNT(pv.id) DESC, p.sales_count DESC, p.featured DESC
      LIMIT _limit * 2
    LOOP
      IF NOT _row.id = ANY(_seen) THEN
        _seen := array_append(_seen, _row.id);
        RETURN NEXT _row;
        _count := _count + 1;
        EXIT WHEN _count >= _limit;
      END IF;
    END LOOP;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Stock Management ────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(_product_id INT, _quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  _updated INT;
BEGIN
  UPDATE products SET stock = stock - _quantity
  WHERE id = _product_id AND stock >= _quantity;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION increment_stock(_product_id INT, _quantity INT)
RETURNS VOID AS $$
  UPDATE products SET stock = stock + _quantity WHERE id = _product_id;
$$ LANGUAGE sql VOLATILE;

-- ─── Order Counts ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_order_counts()
RETURNS TABLE(total BIGINT, pending BIGINT, confirmed BIGINT, shipped BIGINT, today BIGINT) AS $$
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'shipped')::BIGINT,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::BIGINT
  FROM orders;
$$ LANGUAGE sql STABLE;

-- ─── All Categories with product count ───────────────────
CREATE OR REPLACE FUNCTION get_all_categories()
RETURNS TABLE(id INT, name TEXT, slug TEXT, description TEXT, icon TEXT, image_key TEXT, sort_order INT, created_at TIMESTAMPTZ, product_count BIGINT) AS $$
  SELECT c.id, c.name, c.slug, c.description, c.icon, c.image_key, c.sort_order, c.created_at,
    COUNT(pc.product_id)::BIGINT as product_count
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.category_id
  LEFT JOIN products p ON pc.product_id = p.id AND p.active = 1
  GROUP BY c.id
  ORDER BY c.sort_order ASC;
$$ LANGUAGE sql STABLE;

-- ─── Subcategories Grouped ───────────────────────────────
CREATE OR REPLACE FUNCTION get_all_subcategories_grouped()
RETURNS TABLE(id INT, name TEXT, slug TEXT, category_id INT, sort_order INT, created_at TIMESTAMPTZ, category_slug TEXT, product_count BIGINT) AS $$
  SELECT s.id, s.name, s.slug, s.category_id, s.sort_order, s.created_at, c.slug as category_slug,
    (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.active = 1)::BIGINT as product_count
  FROM subcategories s
  JOIN categories c ON s.category_id = c.id
  ORDER BY s.sort_order ASC;
$$ LANGUAGE sql STABLE;

-- ─── Subcategories by Category ───────────────────────────
CREATE OR REPLACE FUNCTION get_subcategories_by_category(_category_slug TEXT)
RETURNS TABLE(id INT, name TEXT, slug TEXT, category_id INT, sort_order INT, created_at TIMESTAMPTZ, product_count BIGINT) AS $$
  SELECT s.id, s.name, s.slug, s.category_id, s.sort_order, s.created_at,
    (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.active = 1)::BIGINT as product_count
  FROM subcategories s
  JOIN categories c ON s.category_id = c.id
  WHERE c.slug = _category_slug
  ORDER BY s.sort_order ASC;
$$ LANGUAGE sql STABLE;

-- ─── Recent Searches ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_recent_searches(_customer_id INT, _limit INT DEFAULT 5)
RETURNS TABLE(id INT, customer_id INT, query TEXT, results_count INT, created_at TIMESTAMPTZ) AS $$
  SELECT DISTINCT ON (sh.query) sh.id, sh.customer_id, sh.query, sh.results_count, sh.created_at
  FROM search_history sh
  WHERE sh.customer_id = _customer_id
  ORDER BY sh.query, sh.created_at DESC
  LIMIT _limit;
$$ LANGUAGE sql STABLE;

-- ─── Popular Searches ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_popular_searches(_limit INT DEFAULT 5)
RETURNS TABLE(query TEXT) AS $$
  SELECT sh.query FROM search_history sh
  GROUP BY sh.query ORDER BY COUNT(*) DESC LIMIT _limit;
$$ LANGUAGE sql STABLE;

-- ─── Popular Products ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_popular_products(_limit INT DEFAULT 8)
RETURNS SETOF products AS $$
  SELECT p.* FROM products p
  LEFT JOIN product_views pv ON p.id = pv.product_id
  WHERE p.active = 1
  GROUP BY p.id
  ORDER BY COUNT(pv.id) DESC, p.created_at DESC
  LIMIT _limit;
$$ LANGUAGE sql STABLE;

-- ─── Has Customer Purchased Product ──────────────────────
CREATE OR REPLACE FUNCTION has_customer_purchased_product(_customer_id INT, _product_id INT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = _customer_id AND oi.product_id = _product_id
    AND o.status IN ('confirmed','shipped','delivered')
  );
$$ LANGUAGE sql STABLE;

-- ─── All Customers with order stats ─────────────────────
CREATE OR REPLACE FUNCTION get_all_customers()
RETURNS TABLE(id INT, email TEXT, password_hash TEXT, name TEXT, phone TEXT, created_at TIMESTAMPTZ, order_count BIGINT, total_spent BIGINT) AS $$
  SELECT c.id, c.email, c.password_hash, c.name, c.phone, c.created_at,
    COUNT(o.id)::BIGINT as order_count,
    COALESCE(SUM(o.total), 0)::BIGINT as total_spent
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id
  ORDER BY c.created_at DESC;
$$ LANGUAGE sql STABLE;

-- ─── All Brands with product count ───────────────────────
CREATE OR REPLACE FUNCTION get_all_brands()
RETURNS TABLE(id INT, name TEXT, slug TEXT, logo_key TEXT, sort_order INT, created_at TIMESTAMPTZ, product_count BIGINT) AS $$
  SELECT b.id, b.name, b.slug, b.logo_key, b.sort_order, b.created_at,
    COUNT(p.id)::BIGINT as product_count
  FROM brands b
  LEFT JOIN products p ON b.id = p.brand_id AND p.active = 1
  GROUP BY b.id
  ORDER BY b.sort_order ASC;
$$ LANGUAGE sql STABLE;

-- ─── Popular Brands ──────────────────────────────────────
CREATE OR REPLACE FUNCTION get_popular_brands(_limit INT DEFAULT 12)
RETURNS TABLE(id INT, name TEXT, slug TEXT, logo_key TEXT, sort_order INT, created_at TIMESTAMPTZ, product_count BIGINT) AS $$
  SELECT b.id, b.name, b.slug, b.logo_key, b.sort_order, b.created_at,
    COUNT(p.id)::BIGINT as product_count
  FROM brands b
  LEFT JOIN products p ON b.id = p.brand_id AND p.active = 1
  GROUP BY b.id
  HAVING COUNT(p.id) > 0
  ORDER BY COALESCE(SUM(p.sales_count), 0) DESC
  LIMIT _limit;
$$ LANGUAGE sql STABLE;

-- ─── Shop Brands ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_shop_brands(_category_slug TEXT DEFAULT NULL, _subcategory_slug TEXT DEFAULT NULL)
RETURNS TABLE(id INT, name TEXT, slug TEXT, logo_key TEXT, sort_order INT, created_at TIMESTAMPTZ, product_count BIGINT) AS $$
BEGIN
  IF _subcategory_slug IS NOT NULL THEN
    RETURN QUERY
      SELECT b.id, b.name, b.slug, b.logo_key, b.sort_order, b.created_at,
        COUNT(p.id)::BIGINT as product_count
      FROM brands b
      JOIN products p ON b.id = p.brand_id AND p.active = 1
      JOIN subcategories s ON p.subcategory_id = s.id
      WHERE s.slug = _subcategory_slug
      GROUP BY b.id
      ORDER BY SUM(p.sales_count) DESC;
  ELSIF _category_slug IS NOT NULL THEN
    RETURN QUERY
      SELECT b.id, b.name, b.slug, b.logo_key, b.sort_order, b.created_at,
        COUNT(p.id)::BIGINT as product_count
      FROM brands b
      JOIN products p ON b.id = p.brand_id AND p.active = 1
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE c.slug = _category_slug
      GROUP BY b.id
      ORDER BY SUM(p.sales_count) DESC;
  ELSE
    RETURN QUERY
      SELECT b.id, b.name, b.slug, b.logo_key, b.sort_order, b.created_at,
        COUNT(p.id)::BIGINT as product_count
      FROM brands b
      JOIN products p ON b.id = p.brand_id AND p.active = 1
      GROUP BY b.id
      ORDER BY SUM(p.sales_count) DESC
      LIMIT 6;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
