'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.changeColumn('copies', 'answers', {
          type: Sequelize.DataTypes.STRING(4096),
        }, { transaction: t }),
        queryInterface.changeColumn('exams', 'corrections', {
          type: Sequelize.DataTypes.STRING(8192),
        }, { transaction: t }),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.changeColumn('copies', 'answers', {
          type: Sequelize.DataTypes.STRING(2048),
        }, { transaction: t }),
        queryInterface.changeColumn('exams', 'corrections', {
          type: Sequelize.DataTypes.STRING(4096),
        }, { transaction: t }),
      ]);
    });
  }
};
