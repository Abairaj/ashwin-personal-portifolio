// Local development only: runs a temporary MySQL on port 3307 so nothing has to
// be installed. The data is erased when it stops (Ctrl+C); the first run
// downloads MySQL, which takes a few minutes.
import { createDB } from 'mysql-memory-server';

const db = await createDB({ version: '8.4.x', dbName: 'portfolio', username: 'root', port: 3307 });
console.log(`MySQL running: host 127.0.0.1, port ${db.port}, user ${db.username}, no password, database ${db.dbName}`);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await db.stop();
    process.exit(0);
  });
}

// Keep the process (and so the database) alive.
setInterval(() => {}, 1 << 30);
