import type { APIRoute } from 'astro';
import { readImage } from '../../lib/uploads';

// Serves uploaded images. nginx can serve the folder directly instead; see DEPLOY.md.
export const GET: APIRoute = async ({ params }) => {
  const image = await readImage(params.file ?? '');
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
