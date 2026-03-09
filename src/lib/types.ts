// Type definitions for the store

export interface Product {
	id: number;
	name: string;
	slug: string;
	sku: string;
	description: string;
	price: number; // stored in minor units (sale price)
	compare_at_price: number | null; // stored in minor units (original price)
	stock: number;
	image_key: string | null;
	active: number;
	featured: number;
	sales_count: number;
	specs: string; // JSON string of product specifications
	subcategory_id: number | null;
	brand_id: number | null;
	created_at: string;
}

export interface Subcategory {
	id: number;
	name: string;
	slug: string;
	category_id: number;
	sort_order: number;
	product_count?: number;
	created_at: string;
}

export interface Category {
	id: number;
	name: string;
	slug: string;
	description: string;
	icon: string;
	image_key: string | null;
	sort_order: number;
	product_count?: number;
	created_at: string;
}

export interface Brand {
	id: number;
	name: string;
	slug: string;
	logo_key: string | null;
	sort_order: number;
	product_count?: number;
	created_at: string;
}

export interface SearchHistoryItem {
	id: number;
	customer_id: number | null;
	query: string;
	results_count: number;
	created_at: string;
}

export interface ProductView {
	id: number;
	product_id: number;
	customer_id: number | null;
	session_id: string | null;
	created_at: string;
}

export interface FeaturedSlide {
	id: number;
	title: string;
	subtitle: string;
	cta_text: string;
	cta_link: string;
	bg_color: string;
	text_color: string;
	image_key: string | null;
	bg_image_desktop_key: string | null;
	bg_image_mobile_key: string | null;
	bg_image_position: string;
	overlay_opacity: number;
	product_id: number | null;
	sort_order: number;
	active: number;
	created_at: string;
}

export interface Customer {
	id: number;
	email: string;
	password_hash: string | null;
	name: string;
	phone: string;
	created_at: string;
}

export interface WishlistItem {
	id: number;
	customer_id: number;
	product_id: number;
	created_at: string;
	product: Product;
}

export interface Session {
	id: string;
	customer_id: number;
	expires_at: string;
}

export interface PasswordResetToken {
	id: string;
	customer_id: number;
	expires_at: string;
	used: number;
	created_at: string;
}

export interface Order {
	id: number;
	customer_id: number | null;
	name: string;
	email: string;
	phone: string;
	status: OrderStatus;
	total: number; // stored in minor units
	shipping_address: string; // JSON
	notes: string;
	created_at: string;
}

export interface OrderItem {
	id: number;
	order_id: number;
	product_id: number;
	quantity: number;
	price_at_purchase: number; // stored in minor units
}

export interface OrderItemWithProduct extends OrderItem {
	product_name: string;
	product_image_key: string | null;
}

export interface Admin {
	id: number;
	email: string;
	password_hash: string;
}

export interface AdminSession {
	id: string;
	admin_id: number;
	expires_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductImage {
	id: number;
	product_id: number;
	image_key: string;
	sort_order: number;
	created_at: string;
}

export interface ProductReview {
	id: number;
	product_id: number;
	customer_id: number;
	customer_name: string;
	rating: number;
	title: string;
	body: string;
	created_at: string;
}

export interface CartItem {
	productId: number;
	slug: string;
	name: string;
	price: number; // stored in minor units
	quantity: number;
	imageUrl: string;
	stock?: number; // max available quantity (set at add-time)
}

export interface ShippingAddress {
	street: string;
	city: string;
	state: string;
}
