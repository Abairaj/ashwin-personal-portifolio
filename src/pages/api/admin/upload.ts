import type { APIRoute } from 'astro';
import { saveImage } from '../../../lib/uploads';

export const POST: APIRoute = async ({ request }) => {
  const file = (await request.formData().catch(() => null))?.get('image');
  if (!(file instanceof File)) return Response.json({ error: 'No image was sent.' }, { status: 400 });
  try {
    return Response.json({ url: await saveImage(file) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
};
