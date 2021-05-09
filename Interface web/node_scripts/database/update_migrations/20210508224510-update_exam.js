'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('exams', 'copyViewAvailable', {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0,
        }, { transaction: t }),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('exams', 'copyViewAvailable', { transaction: t }),
      ]);
    });
  }
};
