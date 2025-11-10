const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runMigration() {
  try {
    console.log('= Running database migrations...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);

    console.log(' Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('L Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
