// ============================================================
// src/config/database.ts
// SQL Server LocalDB connection
//
// APPROACH: LocalDB only speaks named pipes. tedious (mssql's
// default driver) only speaks TCP. We bridge this gap by:
//   1. Getting the pipe path from sqllocaldb
//   2. Creating a local TCP server on 127.0.0.1:randomPort
//      that forwards all data to/from the named pipe
//   3. Connecting tedious to that local TCP port
// This requires NO native modules, NO admin rights, and works
// on any Windows machine with LocalDB installed.
// ============================================================

import sql from 'mssql';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import net from 'net';

dotenv.config();

const serverEnv = process.env.DB_SERVER || '(localdb)\\MSSQLLocalDB';
const isLocalDB = serverEnv.toLowerCase().includes('localdb');

// ----------------------------------------------------------
// getLocalDBPipeName — extracts the named pipe UNC path
// ----------------------------------------------------------
function getLocalDBPipeName(instanceName: string): string {
  try {
    const output = execSync(`sqllocaldb info "${instanceName}"`, { encoding: 'utf8' });
    const match = output.match(/Instance pipe name:\s*np:(\\\\[^\r\n]+)/i);
    if (!match) {
      throw new Error(
        `LocalDB instance "${instanceName}" is not running.\n` +
        `Run: sqllocaldb start ${instanceName}`
      );
    }
    return match[1].trim(); // e.g. \\.\pipe\LOCALDB#XXXXXXXX\tsql\query
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to get LocalDB pipe name: ${msg}`);
  }
}

// ----------------------------------------------------------
// createPipeTcpBridge
// Creates a TCP server that forwards all traffic to/from a
// Windows named pipe. Returns the local TCP port it bound to.
// ----------------------------------------------------------
async function createPipeTcpBridge(pipePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer((tcpSocket) => {
      // Open connection to the named pipe
      const pipeSocket = net.createConnection(pipePath);

      tcpSocket.pipe(pipeSocket);
      pipeSocket.pipe(tcpSocket);

      tcpSocket.on('error', () => pipeSocket.destroy());
      pipeSocket.on('error', () => tcpSocket.destroy());
      tcpSocket.on('close', () => pipeSocket.destroy());
      pipeSocket.on('close', () => tcpSocket.destroy());
    });

    // Bind on a random available port on localhost
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        console.log(`🔀 Pipe bridge active: 127.0.0.1:${address.port} → ${pipePath}`);
        resolve(address.port);
      } else {
        reject(new Error('Failed to bind TCP bridge'));
      }
    });

    server.on('error', reject);
  });
}

// ----------------------------------------------------------
// buildConfig — async because we may need to set up the bridge
// ----------------------------------------------------------
async function buildConfig(): Promise<sql.config> {
  if (isLocalDB) {
    const instanceMatch = serverEnv.match(/\(localdb\)\\(.+)/i);
    const instanceName = instanceMatch ? instanceMatch[1].trim() : 'MSSQLLocalDB';
    const pipePath = getLocalDBPipeName(instanceName);
    const tcpPort = await createPipeTcpBridge(pipePath);

    return {
      server: '127.0.0.1',
      port: tcpPort,
      database: process.env.DB_NAME || 'unispace_db',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || 'UNISpace@2024',
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
      connectionTimeout: 30000,
    };
  }

  // Full SQL Server (TCP / SQL Auth)
  return {
    server: serverEnv,
    database: process.env.DB_NAME || 'unispace_db',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 1433,
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

// We export a promise that resolves to the pool.
// The server waits for this in testConnection().
let pool: sql.ConnectionPool;
let poolConnect: Promise<sql.ConnectionPool>;

const poolReady = buildConfig().then((config) => {
  pool = new sql.ConnectionPool(config);
  poolConnect = pool.connect();
  return pool;
});

// ----------------------------------------------------------
// testConnection — called at server startup
// ----------------------------------------------------------
export const testConnection = async (): Promise<void> => {
  try {
    await poolReady;
    await poolConnect;
    console.log('✅ SQL Server (LocalDB) connected successfully');
  } catch (error) {
    console.error('❌ SQL Server connection failed:', error);
    process.exit(1);
  }
};

// getPool — returns the initialized pool (await poolReady first)
export const getPool = async (): Promise<sql.ConnectionPool> => {
  await poolReady;
  return pool;
};

export { sql };

// No default export. Use getPool() or import { sql } instead.
