'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TreatmentPlans', 'is_cured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('TreatmentPlans', 'cured_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('TreatmentPlans', 'is_cured');
    await queryInterface.removeColumn('TreatmentPlans', 'cured_at');
  }
};
