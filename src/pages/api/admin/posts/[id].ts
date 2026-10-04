import type { APIRoute } from 'astro';
import { InvalidPost, deletePost, updatePost } from '../../../../lib/posts';

const missing = () => Response.json({ error: 'That post no longer exists.' }, { status: 404 });

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const post = await updatePost(Number(params.id), await request.json());
    return post ? Response.json({ post }) : missing();
  } catch (error) {
    if (error instanceof InvalidPost) return Response.json({ error: error.message }, { status: 400 });
    console.error(error);
    return Response.json({ error: 'The post could not be saved.' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    return (await deletePost(Number(params.id))) ? Response.json({ ok: true }) : missing();
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'The post could not be deleted.' }, { status: 500 });
  }
};
