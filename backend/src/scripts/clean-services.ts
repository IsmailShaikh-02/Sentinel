import { pool } from '../db/pool.js';

async function cleanServices() {
  const client = await pool.connect();
  try {
    console.log('🧹 Clearing all services and cascading data...');

    await client.query('BEGIN');

    // TRUNCATE with CASCADE wipes services, checks, and incidents
    await client.query('TRUNCATE TABLE services CASCADE;');

    await client.query('COMMIT');
    console.log('✅ All services, checks, and incidents wiped successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clear services:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanServices();