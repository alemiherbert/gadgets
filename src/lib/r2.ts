// R2 image storage helpers

export async function uploadImage(bucket: R2Bucket, key: string, data: ArrayBuffer | ReadableStream, contentType: string): Promise<void> {
	await bucket.put(key, data, {
		httpMetadata: { contentType }
	});
}

export function getImageUrl(key: string | null): string {
	if (!key) return '/img/placeholder.svg';
	// In production, use a custom domain or R2 public URL
	// For now, serve through our own API route
	return `/api/images/${key}`;
}

export async function deleteImage(bucket: R2Bucket, key: string): Promise<void> {
	await bucket.delete(key);
}

export function generateImageKey(filename: string, prefix: string = 'products'): string {
	const ext = filename.split('.').pop() || 'jpg';
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}/${timestamp}-${random}.${ext}`;
}
