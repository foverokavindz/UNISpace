// ============================================================
// src/config/database.ts
// SQL Server — pure JS driver (no ODBC required)
// ============================================================

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

function buildConfig(): sql.config {
  const server = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
  const database = process.env.DB_NAME || 'unispace_db';
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const useTrusted = !dbUser;

  if (useTrusted) {
    console.log(`📦 DB config: Windows Auth → ${server}/${database}`);
  } else {
    console.log(`📦 DB config: SQL Auth (${dbUser}) → ${server}/${database}`);
  }

return {
  server,
  database,
  ...(useTrusted
    ? {}
    : { user: dbUser as string, password: dbPassword ?? '' }),
options: {
  trustServerCertificate: true,
  encrypt: false,   // ← matches -No in sqlcmd
},
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 15000,
};
}

let pool: sql.ConnectionPool | null = null;
let connecting: Promise<sql.ConnectionPool> | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (pool && pool.connected) return pool;
  if (connecting) return connecting;

  const attempt: Promise<sql.ConnectionPool> = (async () => {
    let newPool: sql.ConnectionPool | null = null;
    try {
      newPool = new sql.ConnectionPool(buildConfig());
      newPool.on('close', () => {
        console.warn('⚠️ SQL pool closed — will reconnect on next request');
        pool = null;
      });
      await newPool.connect();
      pool = newPool;
      console.log('✅ SQL Server connected successfully');
      return newPool;
    } catch (err) {
      pool = null;
      if (newPool) newPool.close().catch(() => {});
      throw err;
    } finally {
      connecting = null;
    }
  })();

  connecting = attempt;
  return attempt;
};

export const testConnection = async (): Promise<void> => {
  try {
    const p = await getPool();
    await p.request().query('SELECT 1 AS ok');
    console.log('✅ Database health check passed');
  } catch (error) {
    console.error('❌ SQL Server connection failed:', error);
    throw error;
  }
};

export { sql };