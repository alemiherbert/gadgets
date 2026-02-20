// Type definitions for the store

export interface Product {
	id: number;
	name: string;
	description: string;
	price: number; // cents
	stock: number;
	image_key: string | null;
	active: number;
	created_at: string;
}

export interface Customer {
	id: number;
	email: string;
	password_hash: string;
	name: string;
	phone: string;
	created_at: string;
}

export interface Session {
	id: string;
	customer_id: number;
	expires_at: string;
}

export interface Order {
	id: number;
	customer_id: number | null;
	name: string;
	email: string;
	phone: string;
	status: OrderStatus;
	total: number; // cents
	shipping_address: string; // JSON
	notes: string;
	created_at: string;
}

export interface OrderItem {
	id: number;
	order_id: number;
	product_id: number;
	quantity: number;
	price_at_purchase: number; // cents
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

export interface CartItem {
	productId: number;
	name: string;
	price: number; // cents
	quantity: number;
	imageUrl: string;
}

export interface ShippingAddress {
	street: string;
	city: string;
	state: string;
}
