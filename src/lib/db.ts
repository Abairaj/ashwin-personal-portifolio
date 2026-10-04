import pg from 'pg';

// One pool per process; kept on globalThis so dev-server reloads don't leak connections.
const store = globalThis as { __pgPool?: pg.Pool };

export const pool = (store.__pgPool ??= new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/portfolio',
}));

export const query = <Row extends pg.QueryResultRow>(text: string, params?: unknown[]) =>
  pool.query<Row>(text, params);
