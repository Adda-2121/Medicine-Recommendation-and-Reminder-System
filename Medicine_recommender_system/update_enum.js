require('dotenv').config({path: './backend/.env'});
const { sequelize } = require('./backend/config/database');

async function updateEnum() {
  try {
    await sequelize.authenticate();
    
    const queries = [
      "ALTER TYPE \"enum_Consultations_status\" ADD VALUE IF NOT EXISTS 'in_progress';",
      "ALTER TYPE \"enum_Consultations_status\" ADD VALUE IF NOT EXISTS 'waiting_for_results';",
      "ALTER TYPE \"enum_Consultations_status\" ADD VALUE IF NOT EXISTS 'result_ready';"
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log(`Executed: ${query}`);
      } catch (err) {
        console.log(`Failed (might already exist): ${query}`, err.message);
      }
    }
    
    console.log("ENUM update complete.");
    process.exit(0);
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }
}

updateEnum();
