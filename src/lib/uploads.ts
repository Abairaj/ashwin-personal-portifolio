import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const MAX_BYTES = 10 * 1024 * 1024;
const FILE_NAME = /^[\w-]+\.webp$/;

const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? './uploads');

// Every upload is re-encoded to WebP: that proves it is a real image, strips
// metadata such as GPS location, and keeps file sizes sensible.
export async function saveImage(file: File) {
  if (file.size > MAX_BYTES) throw new Error('The image is larger than 10 MB.');
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error('That file is not an image this site can read.');
  }
  const name = `${randomUUID()}.webp`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), output);
  return `/uploads/${name}`;
}

export async function readImage(name: string) {
  if (!FILE_NAME.test(name)) return null;
  return readFile(path.join(uploadDir(), name)).catch(() => null);
}
