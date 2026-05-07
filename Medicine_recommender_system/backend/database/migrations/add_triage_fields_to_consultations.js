/**
 * Migration: add reason_for_visit and assigned_specialization to Consultations
 * Run once: node backend/database/migrations/add_triage_fields_to_consultations.js
 */
const { sequelize } = require('../../config/database');

async function up() {
  await sequelize.query(`
    ALTER TABLE "Consultations"
      ADD COLUMN IF NOT EXISTS "reason_for_visit"       VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "assigned_specialization" VARCHAR(100);
  `);

  console.log('✅ Migration complete: reason_for_visit + assigned_specialization added to Consultations');
}

up()
  .then(() => process.exit(0))
  .catch(err => { console.error('❌ Migration failed:', err); process.exit(1); });
