import mysql from 'mysql2/promise';
import schema from '../../db/schema.sql?raw';

// One pool per process; kept on globalThis so dev-server reloads don't leak connections.
const store = globalThis as { __dbPool?: mysql.Pool; __dbReady?: Promise<unknown> };

const pool = (store.__dbPool ??= mysql.createPool({
  // 127.0.0.1 rather than "localhost": on Hostinger, Node resolves localhost to
  // IPv6, which the database user is not allowed to connect from.
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  // Dates are stored and read as UTC.
  timezone: 'Z',
  connectionLimit: 5,
  // Let go of idle connections before the server closes them.
  maxIdle: 2,
  idleTimeout: 60_000,
  enableKeepAlive: true,
}));

// Creates the tables the first time the database is used, so a fresh database
// needs no manual setup. Retried on the next request if it fails.
const ready = () =>
  (store.__dbReady ??= pool.query(schema).catch((error) => {
    store.__dbReady = undefined;
    throw error;
  }));

export async function query<Result = mysql.RowDataPacket[]>(sql: string, params: unknown[] = []) {
  await ready();
  const [result] = await pool.query(sql, params);
  return result as Result;
}

export type WriteResult = mysql.ResultSetHeader;
