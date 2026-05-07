/**
 * Migration: seed per-specialty consultation fee settings
 * Run once: node backend/database/migrations/seed_consultation_fees.js
 */
const { sequelize } = require('../../config/database');
const { Setting } = require('../../models');

const DEFAULT_FEES = [
  { key: 'fee_gp',               value: '150',  label: 'General Practitioner' },
  { key: 'fee_psychiatrist',     value: '300',  label: 'Psychiatrist' },
  { key: 'fee_dermatologist',    value: '250',  label: 'Dermatologist' },
  { key: 'fee_cardiologist',     value: '350',  label: 'Cardiologist' },
  { key: 'fee_internal_medicine',value: '280',  label: 'Internal Medicine' },
  { key: 'fee_pediatrician',     value: '200',  label: 'Pediatrician' },
  { key: 'fee_gynecologist',     value: '250',  label: 'Gynecologist' },
  { key: 'fee_pulmonologist',    value: '280',  label: 'Pulmonologist' },
  { key: 'fee_neurologist',      value: '320',  label: 'Neurologist' },
  { key: 'fee_orthopedic',       value: '300',  label: 'Orthopedic' },
];

async function seed() {
  await sequelize.authenticate();
  for (const { key, value } of DEFAULT_FEES) {
    const existing = await Setting.findOne({ where: { key } });
    if (!existing) {
      await Setting.create({ key, value });
      console.log(`  ✅ Created setting: ${key} = ${value} ETB`);
    } else {
      console.log(`  ⏭  Skipped (already exists): ${key} = ${existing.value} ETB`);
    }
  }
  console.log('\nDone seeding consultation fees.');
}

seed()
  .then(() => process.exit(0))
  .catch(err => { console.error('Seed failed:', err); process.exit(1); });
