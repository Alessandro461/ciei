import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // If connecting to Railway from outside, ssl is needed, but internally it's not.
      // We can use a dynamic SSL check if the URL contains "proxy.rlwy.net".
      ssl: process.env.DATABASE_URL.includes('proxy.rlwy.net') ? { rejectUnauthorized: false } : undefined
    })
  : new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
    });

pool.on('connect', () => {
  console.log('🔗 Conectado exitosamente a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en la base de datos', err);
  process.exit(-1);
});