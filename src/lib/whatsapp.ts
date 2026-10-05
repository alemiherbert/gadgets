import { site, whatsappLink } from './site';
import { formatPrice, formatAddress } from './utils';

type MessageOrder = { id: number; name: string; phone: string; total: number; notes?: string; shipping_address: string };
type MessageItem = { product_name: string; quantity: number; price_at_purchase: number };

/** The message a customer sends us on WhatsApp after checking out. Plain text: WhatsApp renders *bold*. */
export function orderMessage(order: MessageOrder, items: MessageItem[]): string {
	let address = '';
	try {
		address = formatAddress(JSON.parse(order.shipping_address));
	} catch {
		// Unreadable address: leave it out, we'll ask in the chat
	}

	const lines = [
		`Hi ${site.name}, I'd like to place this order:`,
		`*Order #${order.id}*`,
		'',
		...items.map((i) => `• ${i.quantity} × ${i.product_name} — ${formatPrice(i.price_at_purchase * i.quantity)}`),
		'',
		`*Subtotal: ${formatPrice(order.total)}* (+ delivery)`,
		'',
		`Name: ${order.name}`,
		`Phone: ${order.phone}`
	];
	if (address) lines.push(`Deliver to: ${address}`);
	if (order.notes?.trim()) lines.push(`Notes: ${order.notes.trim()}`);
	return lines.join('\n');
}

export function orderWhatsappLink(order: MessageOrder, items: MessageItem[]): string | null {
	return whatsappLink(orderMessage(order, items));
}
