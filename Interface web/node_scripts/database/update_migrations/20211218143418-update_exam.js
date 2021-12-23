'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('exams', 'historic', {
          type: Sequelize.DataTypes.STRING(4096),
        }, { transaction: t }),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('exams', 'historic', { transaction: t }),
      ]);
    });
  }
};
