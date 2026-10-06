/** Gallery photos on top of the main one */
export const MAX_GALLERY_IMAGES = 8;

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/**
 * Shrinks a phone photo before upload (browser only). Product photos from a phone are often
 * 5-10 MB; at 1600px they're a few hundred KB, which loads fast and previews in WhatsApp.
 * Anything that can't be resized (GIF, SVG, unsupported formats) is returned unchanged.
 */
export async function shrinkImage(file: File): Promise<File> {
	if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
	try {
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
		if (scale === 1 && file.size < 400_000) {
			bitmap.close();
			return file;
		}
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		const ctx = canvas.getContext('2d');
		if (!ctx) return file;
		// Flatten transparency onto white so PNG cut-outs don't turn black as JPEG
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
		if (!blob || blob.size >= file.size) return file;
		return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
	} catch {
		return file;
	}
}
