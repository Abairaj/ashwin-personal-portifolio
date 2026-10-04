import sanitizeHtml from 'sanitize-html';

// What the editor can produce. Everything else is stripped before saving.
export function sanitizeContent(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's', 'code', 'pre', 'a', 'img', 'hr', 'br'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}

export const textOnly = (html: string) =>
  sanitizeHtml(html.replace(/<\/(p|h2|h3|li|blockquote)>/g, ' '), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();

// Accepts an uploaded image path or an https image link; anything else is dropped.
export function cleanImageUrl(value: unknown) {
  const url = typeof value === 'string' ? value.trim() : '';
  return /^\/uploads\/[\w-]+\.webp$/.test(url) || /^https:\/\/[^\s"'<>]+$/.test(url) ? url : null;
}
