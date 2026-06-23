import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'event-registration',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+08:00',
});

// When the pool creates new connections, set the MySQL session timezone to Singapore time
poolConnection.on('connection', (connection) => {
  connection.query("SET time_zone = '+08:00'");
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
export { schema };
