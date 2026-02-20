import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const bucket = platform!.env.BUCKET;
	const object = await bucket.get(params.key);

	if (!object) {
		return new Response('Not found', { status: 404 });
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(object.body, { headers });
};
