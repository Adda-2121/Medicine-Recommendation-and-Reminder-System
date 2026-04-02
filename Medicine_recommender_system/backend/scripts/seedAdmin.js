const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { User } = require('../models');

const seedAdmins = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const adminFile = path.join(__dirname, '../admin_users.json');
    if (!fs.existsSync(adminFile)) {
      console.log('admin_users.json not found. Exiting...');
      process.exit(0);
    }

    const adminUsers = JSON.parse(fs.readFileSync(adminFile, 'utf8'));

    for (const adminData of adminUsers) {
      const existingUser = await User.findOne({ where: { email: adminData.email } });
      if (existingUser) {
        console.log(`Admin ${adminData.email} already exists. Skipping.`);
        continue;
      }

      await User.create({
        id: adminData.id,
        name: adminData.name,
        email: adminData.email,
        password: adminData.password, // Already hashed using bcrypt
        role: adminData.role,
        is_verified: true, // Auto verify system admins
      });
      console.log(`Successfully seeded admin: ${adminData.email}`);
    }

    console.log('Admin seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
