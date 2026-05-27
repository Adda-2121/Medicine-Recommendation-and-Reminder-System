/**
 * Migration: Add queue_number and queue_status to ServiceRequests
 *
 * Run with: node backend/database/migrations/add_queue_fields_to_service_requests.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Add queue_number column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE "ServiceRequests"
      ADD COLUMN IF NOT EXISTS queue_number INTEGER;
    `, { type: QueryTypes.RAW });
    console.log('✓ queue_number column added (or already exists).');

    // Add queue_status column — enum type already created by Sequelize sync
    // Try quoted name first, then unquoted fallback
    try {
      await sequelize.query(`
        ALTER TABLE "ServiceRequests"
        ADD COLUMN IF NOT EXISTS queue_status "enum_ServiceRequests_queue_status" DEFAULT 'waiting';
      `, { type: QueryTypes.RAW });
    } catch {
      await sequelize.query(`
        ALTER TABLE "ServiceRequests"
        ADD COLUMN IF NOT EXISTS queue_status VARCHAR(20) DEFAULT 'waiting';
      `, { type: QueryTypes.RAW });
    }
    console.log('✓ queue_status column added (or already exists).');

    // Backfill queue_number for existing requests — assign per specialist in created_at order
    const specialists = await sequelize.query(`
      SELECT DISTINCT specialist_id FROM "ServiceRequests" WHERE specialist_id IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    for (const { specialist_id } of specialists) {
      const rows = await sequelize.query(`
        SELECT id FROM "ServiceRequests"
        WHERE specialist_id = :specialist_id
        ORDER BY created_at ASC;
      `, { replacements: { specialist_id }, type: QueryTypes.SELECT });

      for (let i = 0; i < rows.length; i++) {
        await sequelize.query(`
          UPDATE "ServiceRequests" SET queue_number = :num WHERE id = :id;
        `, { replacements: { num: i + 1, id: rows[i].id }, type: QueryTypes.UPDATE });
      }
      console.log(`✓ Backfilled queue_number for specialist ${specialist_id} (${rows.length} rows).`);
    }

    // Backfill queue_status based on existing status field
    await sequelize.query(`
      UPDATE "ServiceRequests"
      SET queue_status = CASE
        WHEN status = 'completed' THEN 'completed'::"enum_ServiceRequests_queue_status"
        WHEN status = 'in_progress' THEN 'active'::"enum_ServiceRequests_queue_status"
        ELSE 'waiting'::"enum_ServiceRequests_queue_status"
      END
      WHERE queue_status IS NULL OR queue_status = 'waiting';
    `, { type: QueryTypes.UPDATE });
    console.log('✓ Backfilled queue_status from existing status values.');

    console.log('\nMigration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
