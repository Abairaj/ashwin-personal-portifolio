import type { APIRoute } from 'astro';
import { InvalidPost, createPost } from '../../../../lib/posts';

export const POST: APIRoute = async ({ request }) => {
  try {
    const post = await createPost(await request.json());
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidPost) return Response.json({ error: error.message }, { status: 400 });
    console.error(error);
    return Response.json({ error: 'The post could not be saved.' }, { status: 500 });
  }
};
