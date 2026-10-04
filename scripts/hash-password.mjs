// Prints the value for ADMIN_PASSWORD_HASH. Usage: npm run hash-password
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const prompt = createInterface({ input: process.stdin, output: process.stderr });
const password = process.argv[2] ?? (await prompt.question('New admin password: '));
prompt.close();

if (password.length < 10) {
  console.error('Use at least 10 characters.');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
