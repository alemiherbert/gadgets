import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, Customer, Order, OrderItem, OrderItemWithProduct, Admin, AdminSession, Session, Category, Subcategory, Brand, SearchHistoryItem, FeaturedSlide, PasswordResetToken, ProductReview, ProductImage } from './types';

// Helper: single row or null
async function single<T>(query: any): Promise<T | null> {
const { data, error } = await query.maybeSingle();
if (error) throw error;
return data as T | null;
}

// Helper: array of rows
async function many<T>(query: any): Promise<T[]> {
const { data, error } = await query;
if (error) throw error;
return (data ?? []) as T[];
}

// ─── Products ────────────────────────────────────────────
export async function getActiveProducts(db: SupabaseClient): Promise<Product[]> {
return many<Product>(
db.from('products').select('*').eq('active', 1).order('created_at', { ascending: false })
);
}

export async function getAllProducts(db: SupabaseClient, limit = 500): Promise<Product[]> {
return many<Product>(
db.from('products').select('*').order('created_at', { ascending: false }).limit(limit)
);
}

export async function getProductById(db: SupabaseClient, id: number): Promise<Product | null> {
return single<Product>(
db.from('products').select('*').eq('id', id)
);
}

export async function getProductBySlug(db: SupabaseClient, slug: string): Promise<Product | null> {
return single<Product>(
db.from('products').select('*').eq('slug', slug)
);
}

export async function getNewArrivals(db: SupabaseClient, limit = 8): Promise<Product[]> {
return many<Product>(
db.from('products').select('*').eq('active', 1).order('created_at', { ascending: false }).limit(limit)
);
}

export async function getFeaturedProducts(db: SupabaseClient, limit = 6): Promise<Product[]> {
return many<Product>(
db.from('products').select('*').eq('active', 1).eq('featured', 1).order('created_at', { ascending: false }).limit(limit)
);
}

export async function getGreatDeals(db: SupabaseClient, limit = 8, offset = 0): Promise<Product[]> {
const { data, error } = await db.rpc('get_great_deals', { _limit: limit, _offset: offset });
if (error) throw error;
return (data ?? []) as Product[];
}

export async function getBestSellers(db: SupabaseClient, limit = 8, offset = 0): Promise<Product[]> {
return many<Product>(
db.from('products').select('*').eq('active', 1)
.order('sales_count', { ascending: false })
.order('created_at', { ascending: false })
.range(offset, offset + limit - 1)
);
}

export async function getShopProducts(db: SupabaseClient, options: {
categorySlug?: string;
subcategorySlug?: string;
brandSlug?: string;
search?: string;
minPrice?: number;
maxPrice?: number;
specFilters?: Record<string, string[]>;
sort?: string;
limit?: number;
offset?: number;
}): Promise<{ products: Product[]; total: number }> {
const { data, error } = await db.rpc('get_shop_products', {
_category_slug: options.categorySlug ?? null,
_subcategory_slug: options.subcategorySlug ?? null,
_brand_slug: options.brandSlug ?? null,
_search: options.search ?? null,
_min_price: options.minPrice ?? null,
_max_price: options.maxPrice ?? null,
_spec_filters: options.specFilters ? JSON.stringify(options.specFilters) : null,
_sort: options.sort ?? 'newest',
_limit: options.limit ?? 48,
_offset: options.offset ?? 0
});
if (error) throw error;
if (data && data.length > 0) {
return { products: data[0].products ?? [], total: data[0].total ?? 0 };
}
return { products: [], total: 0 };
}

export async function getAvailableSpecs(db: SupabaseClient, subcategorySlug?: string): Promise<Record<string, string[]>> {
if (!subcategorySlug) return {};
const { data, error } = await db.rpc('get_available_specs', { _subcategory_slug: subcategorySlug });
if (error) throw error;
return (data as Record<string, string[]>) ?? {};
}

export async function getPriceRange(db: SupabaseClient, categorySlug?: string): Promise<{ min: number; max: number }> {
const { data, error } = await db.rpc('get_price_range', { _category_slug: categorySlug ?? null });
if (error) throw error;
if (data && data.length > 0) {
return { min: data[0].min ?? 0, max: data[0].max ?? 0 };
}
return { min: 0, max: 0 };
}

export async function searchProducts(db: SupabaseClient, query: string, categoryId?: number): Promise<Product[]> {
const { data, error } = await db.rpc('search_products', {
_query: query,
_category_id: categoryId ?? null
});
if (error) throw error;
return (data ?? []) as Product[];
}

export async function getProductsByCategory(db: SupabaseClient, categoryId: number): Promise<Product[]> {
const { data, error } = await db.rpc('get_products_by_category', { _category_id: categoryId });
if (error) throw error;
return (data ?? []) as Product[];
}

export async function getProductsByCategorySlug(db: SupabaseClient, slug: string): Promise<Product[]> {
const { data, error } = await db.rpc('get_products_by_category_slug', { _slug: slug });
if (error) throw error;
return (data ?? []) as Product[];
}

export async function getRecommendedProducts(db: SupabaseClient, productId: number, limit = 4, customerId: number | null = null): Promise<Product[]> {
const { data, error } = await db.rpc('get_recommended_products', {
_product_id: productId,
_limit: limit,
_customer_id: customerId
});
if (error) throw error;
return (data ?? []) as Product[];
}

export async function createProduct(db: SupabaseClient, product: {
name: string; slug: string; sku: string; description: string; price: number; stock: number; image_key: string | null;
compare_at_price?: number | null; featured?: number; subcategory_id?: number | null; brand_id?: number | null; specs?: string;
}): Promise<number> {
const { data, error } = await db.from('products').insert({
name: product.name,
slug: product.slug,
sku: product.sku,
description: product.description,
price: product.price,
compare_at_price: product.compare_at_price ?? null,
stock: product.stock,
image_key: product.image_key,
featured: product.featured ?? 0,
subcategory_id: product.subcategory_id ?? null,
brand_id: product.brand_id ?? null,
specs: product.specs ?? '{}'
}).select('id').single();
if (error) throw error;
return data.id;
}

export async function generateSlug(db: SupabaseClient, name: string): Promise<string> {
const { data, error } = await db.rpc('generate_product_slug', { _name: name });
if (error) throw error;
return data as string;
}

export async function generateSku(db: SupabaseClient, prefix: string = 'A'): Promise<string> {
const { data, error } = await db.rpc('generate_product_sku', { _prefix: prefix });
if (error) throw error;
return data as string;
}

export async function updateProduct(db: SupabaseClient, id: number, product: {
name: string; slug: string; sku: string; description: string; price: number; stock: number; image_key: string | null; active: number;
compare_at_price?: number | null; featured?: number; subcategory_id?: number | null; brand_id?: number | null; specs?: string;
}): Promise<void> {
const { error } = await db.from('products').update({
name: product.name,
slug: product.slug,
sku: product.sku,
description: product.description,
price: product.price,
compare_at_price: product.compare_at_price ?? null,
stock: product.stock,
image_key: product.image_key,
active: product.active,
featured: product.featured ?? 0,
subcategory_id: product.subcategory_id ?? null,
brand_id: product.brand_id ?? null,
specs: product.specs ?? '{}'
}).eq('id', id);
if (error) throw error;
}

export async function getAdjacentProducts(db: SupabaseClient, productId: number): Promise<{ prev: { id: number; name: string; slug: string; image_key: string | null; price: number } | null; next: { id: number; name: string; slug: string; image_key: string | null; price: number } | null }> {
const { data, error } = await db.rpc('get_adjacent_products', { _product_id: productId });
if (error) throw error;
const rows = (data ?? []) as { direction: string; id: number; name: string; slug: string; image_key: string | null; price: number }[];
return {
prev: rows.find(r => r.direction === 'prev') ?? null,
next: rows.find(r => r.direction === 'next') ?? null
};
}

export async function deleteProduct(db: SupabaseClient, id: number): Promise<void> {
const { error } = await db.from('products').delete().eq('id', id);
if (error) throw error;
}

export async function decrementStock(db: SupabaseClient, productId: number, quantity: number): Promise<boolean> {
const { data, error } = await db.rpc('decrement_stock', { _product_id: productId, _quantity: quantity });
if (error) throw error;
return !!data;
}

export async function incrementStock(db: SupabaseClient, productId: number, quantity: number): Promise<void> {
const { error } = await db.rpc('increment_stock', { _product_id: productId, _quantity: quantity });
if (error) throw error;
}

export async function getLowStockProducts(db: SupabaseClient, threshold = 5): Promise<Product[]> {
return many<Product>(
db.from('products').select('*').eq('active', 1).lt('stock', threshold).order('stock', { ascending: true })
);
}

// ─── Customers ───────────────────────────────────────────
export async function getCustomerByEmail(db: SupabaseClient, email: string): Promise<Customer | null> {
return single<Customer>(db.from('customers').select('*').eq('email', email));
}

export async function getCustomerById(db: SupabaseClient, id: number): Promise<Customer | null> {
return single<Customer>(db.from('customers').select('*').eq('id', id));
}

export async function createCustomer(db: SupabaseClient, customer: {
email: string; password_hash: string; name: string; phone: string;
}): Promise<number> {
const { data, error } = await db.from('customers').insert({
email: customer.email,
password_hash: customer.password_hash,
name: customer.name,
phone: customer.phone
}).select('id').single();
if (error) throw error;
return data.id;
}

// ─── Sessions ────────────────────────────────────────────
export async function createSession(db: SupabaseClient, session: Session): Promise<void> {
const { error } = await db.from('sessions').insert({
id: session.id,
customer_id: session.customer_id,
expires_at: session.expires_at
});
if (error) throw error;
}

export async function getSession(db: SupabaseClient, sessionId: string): Promise<(Session & { customer_name: string; customer_email: string }) | null> {
const { data, error } = await db.from('sessions')
.select('*, customers!inner(name, email)')
.eq('id', sessionId)
.gt('expires_at', new Date().toISOString())
.maybeSingle();
if (error) throw error;
if (!data) return null;
const c = data.customers as any;
return {
id: data.id,
customer_id: data.customer_id,
expires_at: data.expires_at,
customer_name: c.name,
customer_email: c.email
};
}

export async function deleteSession(db: SupabaseClient, sessionId: string): Promise<void> {
const { error } = await db.from('sessions').delete().eq('id', sessionId);
if (error) throw error;
}

// ─── Password Reset Tokens ──────────────────────────────
export async function createPasswordResetToken(db: SupabaseClient, token: { id: string; customer_id: number; expires_at: string }): Promise<void> {
await db.from('password_reset_tokens').delete().eq('customer_id', token.customer_id).eq('used', 0);
const { error } = await db.from('password_reset_tokens').insert({
id: token.id,
customer_id: token.customer_id,
expires_at: token.expires_at
});
if (error) throw error;
}

export async function getPasswordResetToken(db: SupabaseClient, tokenId: string): Promise<(PasswordResetToken & { customer_email: string }) | null> {
const { data, error } = await db.from('password_reset_tokens')
.select('*, customers!inner(email)')
.eq('id', tokenId)
.eq('used', 0)
.gt('expires_at', new Date().toISOString())
.maybeSingle();
if (error) throw error;
if (!data) return null;
const c = data.customers as any;
return {
id: data.id,
customer_id: data.customer_id,
expires_at: data.expires_at,
used: data.used,
created_at: data.created_at,
customer_email: c.email
};
}

export async function markResetTokenUsed(db: SupabaseClient, tokenId: string): Promise<void> {
const { error } = await db.from('password_reset_tokens').update({ used: 1 }).eq('id', tokenId);
if (error) throw error;
}

export async function updateCustomerPassword(db: SupabaseClient, customerId: number, passwordHash: string): Promise<void> {
const { error } = await db.from('customers').update({ password_hash: passwordHash }).eq('id', customerId);
if (error) throw error;
}

// ─── Orders ──────────────────────────────────────────────
export async function createOrder(db: SupabaseClient, order: {
customer_id: number | null; name: string; email: string; phone: string;
total: number; shipping_address: string; notes: string;
}): Promise<number> {
const { data, error } = await db.from('orders').insert({
customer_id: order.customer_id,
name: order.name,
email: order.email,
phone: order.phone,
total: order.total,
shipping_address: order.shipping_address,
notes: order.notes
}).select('id').single();
if (error) throw error;
return data.id;
}

export async function createOrderItem(db: SupabaseClient, item: {
order_id: number; product_id: number; quantity: number; price_at_purchase: number;
}): Promise<void> {
const { error } = await db.from('order_items').insert({
order_id: item.order_id,
product_id: item.product_id,
quantity: item.quantity,
price_at_purchase: item.price_at_purchase
});
if (error) throw error;
}

export async function createOrderItems(db: SupabaseClient, items: {
order_id: number; product_id: number; quantity: number; price_at_purchase: number;
}[]): Promise<void> {
const { error } = await db.from('order_items').insert(items);
if (error) throw error;
}

export async function getOrderById(db: SupabaseClient, id: number): Promise<Order | null> {
return single<Order>(db.from('orders').select('*').eq('id', id));
}

export async function getOrderItems(db: SupabaseClient, orderId: number): Promise<OrderItemWithProduct[]> {
const { data, error } = await db.from('order_items')
.select('*, products!inner(name, image_key)')
.eq('order_id', orderId);
if (error) throw error;
return (data ?? []).map((row: any) => ({
id: row.id,
order_id: row.order_id,
product_id: row.product_id,
quantity: row.quantity,
price_at_purchase: row.price_at_purchase,
product_name: row.products.name,
product_image_key: row.products.image_key
}));
}

export async function getOrdersByCustomer(db: SupabaseClient, customerId: number): Promise<Order[]> {
return many<Order>(
db.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
);
}

export async function getAllOrders(db: SupabaseClient, status?: string): Promise<Order[]> {
let query = db.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
if (status && status !== 'all') {
query = query.eq('status', status);
}
return many<Order>(query);
}

export async function updateOrderStatus(db: SupabaseClient, orderId: number, status: string): Promise<void> {
const { error } = await db.from('orders').update({ status }).eq('id', orderId);
if (error) throw error;
}

export async function getOrderCounts(db: SupabaseClient): Promise<{
total: number; pending: number; confirmed: number; shipped: number; today: number;
}> {
const { data, error } = await db.rpc('get_order_counts');
if (error) throw error;
if (data && data.length > 0) return data[0];
return { total: 0, pending: 0, confirmed: 0, shipped: 0, today: 0 };
}

// ─── Admins ──────────────────────────────────────────────
export async function getAdminByEmail(db: SupabaseClient, email: string): Promise<Admin | null> {
return single<Admin>(db.from('admins').select('*').eq('email', email));
}

export async function createAdminSession(db: SupabaseClient, session: AdminSession): Promise<void> {
const { error } = await db.from('admin_sessions').insert({
id: session.id,
admin_id: session.admin_id,
expires_at: session.expires_at
});
if (error) throw error;
}

export async function getAdminSession(db: SupabaseClient, sessionId: string): Promise<(AdminSession & { admin_email: string }) | null> {
const { data, error } = await db.from('admin_sessions')
.select('*, admins!inner(email)')
.eq('id', sessionId)
.gt('expires_at', new Date().toISOString())
.maybeSingle();
if (error) throw error;
if (!data) return null;
const a = data.admins as any;
return {
id: data.id,
admin_id: data.admin_id,
expires_at: data.expires_at,
admin_email: a.email
};
}

export async function deleteAdminSession(db: SupabaseClient, sessionId: string): Promise<void> {
const { error } = await db.from('admin_sessions').delete().eq('id', sessionId);
if (error) throw error;
}

export async function getAdminCount(db: SupabaseClient): Promise<number> {
const { count, error } = await db.from('admins').select('*', { count: 'exact', head: true });
if (error) throw error;
return count ?? 0;
}

export async function createAdmin(db: SupabaseClient, admin: { email: string; password_hash: string }): Promise<void> {
const { error } = await db.from('admins').insert({
email: admin.email,
password_hash: admin.password_hash
});
if (error) throw error;
}

// ─── Categories ──────────────────────────────────────────
export async function getAllCategories(db: SupabaseClient): Promise<Category[]> {
const { data, error } = await db.rpc('get_all_categories');
if (error) throw error;
return (data ?? []) as Category[];
}

export async function getCategoryBySlug(db: SupabaseClient, slug: string): Promise<Category | null> {
return single<Category>(db.from('categories').select('*').eq('slug', slug));
}

export async function getCategoryById(db: SupabaseClient, id: number): Promise<Category | null> {
return single<Category>(db.from('categories').select('*').eq('id', id));
}

export async function getProductCategoryIds(db: SupabaseClient, productId: number): Promise<number[]> {
const { data, error } = await db.from('product_categories').select('category_id').eq('product_id', productId);
if (error) throw error;
return (data ?? []).map((r: any) => r.category_id);
}

export async function setProductCategories(db: SupabaseClient, productId: number, categoryIds: number[]): Promise<void> {
const { error: delError } = await db.from('product_categories').delete().eq('product_id', productId);
if (delError) throw delError;
if (categoryIds.length > 0) {
const rows = categoryIds.map(catId => ({ product_id: productId, category_id: catId }));
const { error } = await db.from('product_categories').insert(rows);
if (error) throw error;
}
}

// ─── Subcategories ──────────────────────────────────────
export async function getAllSubcategoriesGrouped(db: SupabaseClient): Promise<Record<string, Subcategory[]>> {
const { data, error } = await db.rpc('get_all_subcategories_grouped');
if (error) throw error;
const grouped: Record<string, Subcategory[]> = {};
for (const row of (data ?? []) as any[]) {
const catSlug = row.category_slug;
if (!grouped[catSlug]) grouped[catSlug] = [];
grouped[catSlug].push({
id: row.id,
name: row.name,
slug: row.slug,
category_id: row.category_id,
sort_order: row.sort_order,
product_count: row.product_count,
created_at: row.created_at
});
}
return grouped;
}

export async function getSubcategoriesByCategory(db: SupabaseClient, categorySlug: string): Promise<Subcategory[]> {
const { data, error } = await db.rpc('get_subcategories_by_category', { _category_slug: categorySlug });
if (error) throw error;
return (data ?? []) as Subcategory[];
}

// ─── Search History ─────────────────────────────────────
export async function saveSearchQuery(db: SupabaseClient, customerId: number | null, query: string, resultsCount: number): Promise<void> {
const { error } = await db.from('search_history').insert({
customer_id: customerId,
query,
results_count: resultsCount
});
if (error) throw error;
}

export async function getRecentSearches(db: SupabaseClient, customerId: number, limit = 5): Promise<SearchHistoryItem[]> {
const { data, error } = await db.rpc('get_recent_searches', { _customer_id: customerId, _limit: limit });
if (error) throw error;
return (data ?? []) as SearchHistoryItem[];
}

export async function getPopularSearches(db: SupabaseClient, limit = 5): Promise<string[]> {
const { data, error } = await db.rpc('get_popular_searches', { _limit: limit });
if (error) throw error;
return (data ?? []).map((r: any) => r.query);
}

// ─── Product Views ──────────────────────────────────────
export async function recordProductView(db: SupabaseClient, productId: number, customerId: number | null): Promise<void> {
const { error } = await db.from('product_views').insert({
product_id: productId,
customer_id: customerId
});
if (error) throw error;
}

export async function getPopularProducts(db: SupabaseClient, limit = 8): Promise<Product[]> {
const { data, error } = await db.rpc('get_popular_products', { _limit: limit });
if (error) throw error;
return (data ?? []) as Product[];
}

// ─── Featured Slides ────────────────────────────────────
export async function getActiveSlides(db: SupabaseClient): Promise<FeaturedSlide[]> {
return many<FeaturedSlide>(
db.from('featured_slides').select('*').eq('active', 1).order('sort_order', { ascending: true })
);
}

export async function getAllSlides(db: SupabaseClient): Promise<FeaturedSlide[]> {
return many<FeaturedSlide>(
db.from('featured_slides').select('*').order('sort_order', { ascending: true })
);
}

export async function getSlideById(db: SupabaseClient, id: number): Promise<FeaturedSlide | null> {
return single<FeaturedSlide>(db.from('featured_slides').select('*').eq('id', id));
}

export async function createSlide(db: SupabaseClient, slide: {
title: string; subtitle: string; cta_text: string; cta_link: string;
bg_color: string; text_color: string; image_key: string | null;
bg_image_desktop_key: string | null; bg_image_mobile_key: string | null;
bg_image_position: string; overlay_opacity: number;
product_id: number | null; sort_order: number; active: number;
}): Promise<number> {
const { data, error } = await db.from('featured_slides').insert(slide).select('id').single();
if (error) throw error;
return data.id;
}

export async function updateSlide(db: SupabaseClient, id: number, slide: {
title: string; subtitle: string; cta_text: string; cta_link: string;
bg_color: string; text_color: string; image_key: string | null;
bg_image_desktop_key: string | null; bg_image_mobile_key: string | null;
bg_image_position: string; overlay_opacity: number;
product_id: number | null; sort_order: number; active: number;
}): Promise<void> {
const { error } = await db.from('featured_slides').update(slide).eq('id', id);
if (error) throw error;
}

export async function deleteSlide(db: SupabaseClient, id: number): Promise<void> {
const { error } = await db.from('featured_slides').delete().eq('id', id);
if (error) throw error;
}

// ─── Product Reviews ─────────────────────────────────────
export async function getProductReviews(db: SupabaseClient, productId: number): Promise<ProductReview[]> {
const { data, error } = await db.from('product_reviews')
.select('*, customers!inner(name)')
.eq('product_id', productId)
.order('created_at', { ascending: false });
if (error) throw error;
return (data ?? []).map((row: any) => ({
id: row.id,
product_id: row.product_id,
customer_id: row.customer_id,
rating: row.rating,
title: row.title,
body: row.body,
created_at: row.created_at,
customer_name: row.customers.name
}));
}

export async function hasCustomerPurchasedProduct(db: SupabaseClient, customerId: number, productId: number): Promise<boolean> {
const { data, error } = await db.rpc('has_customer_purchased_product', {
_customer_id: customerId,
_product_id: productId
});
if (error) throw error;
return !!data;
}

export async function hasCustomerReviewedProduct(db: SupabaseClient, customerId: number, productId: number): Promise<boolean> {
const { count, error } = await db.from('product_reviews')
.select('*', { count: 'exact', head: true })
.eq('customer_id', customerId)
.eq('product_id', productId);
if (error) throw error;
return (count ?? 0) > 0;
}

export async function createProductReview(db: SupabaseClient, review: {
product_id: number; customer_id: number; rating: number; title: string; body: string;
}): Promise<void> {
const { error } = await db.from('product_reviews').insert(review);
if (error) throw error;
}

export async function getProductImages(db: SupabaseClient, productId: number): Promise<ProductImage[]> {
return many<ProductImage>(
db.from('product_images').select('*').eq('product_id', productId).order('sort_order', { ascending: true })
);
}

export async function addProductImage(db: SupabaseClient, productId: number, imageKey: string, sortOrder: number): Promise<number> {
const { data, error } = await db.from('product_images').insert({
product_id: productId,
image_key: imageKey,
sort_order: sortOrder
}).select('id').single();
if (error) throw error;
return data.id;
}

export async function deleteProductImage(db: SupabaseClient, imageId: number): Promise<string | null> {
const row = await single<{ image_key: string }>(
db.from('product_images').select('image_key').eq('id', imageId)
);
if (row) {
const { error } = await db.from('product_images').delete().eq('id', imageId);
if (error) throw error;
return row.image_key;
}
return null;
}

// ─── Admin: Customers ────────────────────────────────────
export async function getAllCustomers(db: SupabaseClient, limit = 500): Promise<(Customer & { order_count: number; total_spent: number })[]> {
const { data, error } = await db.rpc('get_all_customers').limit(limit);
if (error) throw error;
return (data ?? []) as (Customer & { order_count: number; total_spent: number })[];
}

// ─── Admin: Reviews ──────────────────────────────────────
export async function getAllReviews(db: SupabaseClient, limit = 500): Promise<(ProductReview & { product_name: string })[]> {
const { data, error } = await db.from('product_reviews')
.select('*, customers!inner(name), products!inner(name)')
.order('created_at', { ascending: false })
.limit(limit);
if (error) throw error;
return (data ?? []).map((row: any) => ({
id: row.id,
product_id: row.product_id,
customer_id: row.customer_id,
rating: row.rating,
title: row.title,
body: row.body,
created_at: row.created_at,
customer_name: row.customers.name,
product_name: row.products.name
}));
}

export async function deleteReview(db: SupabaseClient, reviewId: number): Promise<void> {
const { error } = await db.from('product_reviews').delete().eq('id', reviewId);
if (error) throw error;
}

// ─── Admin: Category CRUD ─────────────────────────────────
export async function createCategory(db: SupabaseClient, data: {
name: string; slug: string; description?: string; icon?: string; image_key?: string | null; sort_order?: number;
}): Promise<number> {
const { data: row, error } = await db.from('categories').insert({
name: data.name, slug: data.slug, description: data.description ?? '',
icon: data.icon ?? '', image_key: data.image_key ?? null, sort_order: data.sort_order ?? 0
}).select('id').single();
if (error) throw error;
return row.id;
}

export async function updateCategory(db: SupabaseClient, id: number, data: {
name: string; slug: string; description?: string; icon?: string; image_key?: string | null; sort_order?: number;
}): Promise<void> {
const { error } = await db.from('categories').update({
name: data.name, slug: data.slug, description: data.description ?? '',
icon: data.icon ?? '', image_key: data.image_key ?? null, sort_order: data.sort_order ?? 0
}).eq('id', id);
if (error) throw error;
}

export async function deleteCategory(db: SupabaseClient, id: number): Promise<void> {
const { error } = await db.from('categories').delete().eq('id', id);
if (error) throw error;
}

// ─── Admin: Subcategory CRUD ──────────────────────────────
export async function getAllSubcategories(db: SupabaseClient): Promise<(Subcategory & { category_name: string })[]> {
const { data, error } = await db.from('subcategories')
.select('*, categories!inner(name)')
.order('sort_order', { ascending: true });
if (error) throw error;
return (data ?? []).map((row: any) => ({
id: row.id, name: row.name, slug: row.slug, category_id: row.category_id,
sort_order: row.sort_order, created_at: row.created_at, category_name: row.categories.name
}));
}

export async function createSubcategory(db: SupabaseClient, data: {
name: string; slug: string; category_id: number; sort_order?: number;
}): Promise<number> {
const { data: row, error } = await db.from('subcategories').insert({
name: data.name, slug: data.slug, category_id: data.category_id, sort_order: data.sort_order ?? 0
}).select('id').single();
if (error) throw error;
return row.id;
}

export async function updateSubcategory(db: SupabaseClient, id: number, data: {
name: string; slug: string; category_id: number; sort_order?: number;
}): Promise<void> {
const { error } = await db.from('subcategories').update({
name: data.name, slug: data.slug, category_id: data.category_id, sort_order: data.sort_order ?? 0
}).eq('id', id);
if (error) throw error;
}

export async function deleteSubcategory(db: SupabaseClient, id: number): Promise<void> {
const { error } = await db.from('subcategories').delete().eq('id', id);
if (error) throw error;
}

// ─── Brands ──────────────────────────────────────────────
export async function getAllBrands(db: SupabaseClient): Promise<Brand[]> {
const { data, error } = await db.rpc('get_all_brands');
if (error) throw error;
return (data ?? []) as Brand[];
}

export async function getPopularBrands(db: SupabaseClient, limit = 12): Promise<Brand[]> {
const { data, error } = await db.rpc('get_popular_brands', { _limit: limit });
if (error) throw error;
return (data ?? []) as Brand[];
}

export async function getShopBrands(db: SupabaseClient, options?: {
categorySlug?: string;
subcategorySlug?: string;
}): Promise<Brand[]> {
const { data, error } = await db.rpc('get_shop_brands', {
_category_slug: options?.categorySlug ?? null,
_subcategory_slug: options?.subcategorySlug ?? null
});
if (error) throw error;
return (data ?? []) as Brand[];
}

export async function getBrandBySlug(db: SupabaseClient, slug: string): Promise<Brand | null> {
return single<Brand>(db.from('brands').select('*').eq('slug', slug));
}

export async function getBrandById(db: SupabaseClient, id: number): Promise<Brand | null> {
return single<Brand>(db.from('brands').select('*').eq('id', id));
}

export async function createBrand(db: SupabaseClient, data: {
name: string; slug: string; logo_key?: string | null; sort_order?: number;
}): Promise<number> {
const { data: row, error } = await db.from('brands').insert({
name: data.name, slug: data.slug, logo_key: data.logo_key ?? null, sort_order: data.sort_order ?? 0
}).select('id').single();
if (error) throw error;
return row.id;
}

export async function updateBrand(db: SupabaseClient, id: number, data: {
name: string; slug: string; logo_key?: string | null; sort_order?: number;
}): Promise<void> {
const { error } = await db.from('brands').update({
name: data.name, slug: data.slug, logo_key: data.logo_key ?? null, sort_order: data.sort_order ?? 0
}).eq('id', id);
if (error) throw error;
}

export async function deleteBrand(db: SupabaseClient, id: number): Promise<void> {
const { error } = await db.from('brands').delete().eq('id', id);
if (error) throw error;
}
