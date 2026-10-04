// "My_First Post" → "my-first-post". Used for post URLs and file names.
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
