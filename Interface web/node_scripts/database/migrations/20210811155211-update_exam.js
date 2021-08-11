'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('exams', 'questionStatus', 'collaborators');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('exams', 'collaborators', 'questionStatus');
  }
};
