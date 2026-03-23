import { Pool } from 'pg';
// dotenv is loaded in index.ts before this module is imported

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default pool;
