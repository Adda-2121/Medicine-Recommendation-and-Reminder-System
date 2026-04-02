const { sequelize } = require('./config/database');

async function fix() {
  try {
    await sequelize.authenticate();
    await sequelize.query('DELETE FROM "Reminders" WHERE "scheduled_time" IS NULL;');
    console.log('Fixed: Deleted Reminders with NULL scheduled_time');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
