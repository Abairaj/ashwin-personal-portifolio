// Local development only: runs a throw-away PostgreSQL in ./.pgdata on port 5433,
// so nothing has to be installed. Stop it with Ctrl+C.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';

const postgres = new EmbeddedPostgres({
  databaseDir: './.pgdata',
  user: 'postgres',
  password: 'postgres',
  port: 5433,
  persistent: true,
});

if (!existsSync('./.pgdata/PG_VERSION')) await postgres.initialise();
await postgres.start();
await postgres.createDatabase('portfolio').catch(() => {});
console.log('PostgreSQL running: postgres://postgres:postgres@localhost:5433/portfolio');

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await postgres.stop();
    process.exit(0);
  });
}
