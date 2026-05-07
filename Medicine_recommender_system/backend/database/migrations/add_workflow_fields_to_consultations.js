/**
 * Migration: add consultation_type, target_specialty, referred_by_id to Consultations
 * Run once: node backend/database/migrations/add_workflow_fields_to_consultations.js
 */
const { sequelize } = require('../../config/database');

async function up() {
  const qi = sequelize.getQueryInterface();

  // Add consultation_type ENUM
  await qi.sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_consultations_consultation_type') THEN
        CREATE TYPE "enum_Consultations_consultation_type" AS ENUM ('gp', 'specialist');
      END IF;
    END $$;
  `);

  await qi.sequelize.query(`
    ALTER TABLE "Consultations"
      ADD COLUMN IF NOT EXISTS "consultation_type" "enum_Consultations_consultation_type" NOT NULL DEFAULT 'gp',
      ADD COLUMN IF NOT EXISTS "target_specialty" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "referred_by_id" UUID REFERENCES "Consultations"("id") ON DELETE SET NULL;
  `);

  // Also add specialty column to Users if not present (for doctor specialty)
  await qi.sequelize.query(`
    ALTER TABLE "Users"
      ADD COLUMN IF NOT EXISTS "specialty" VARCHAR(255);
  `);

  console.log('✅ Migration complete: workflow fields added to Consultations');
}

up()
  .then(() => process.exit(0))
  .catch(err => { console.error('Migration failed:', err); process.exit(1); });
