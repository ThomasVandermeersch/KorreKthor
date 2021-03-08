'use strict';
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID
      },
      fullName: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING,
      },
      matricule: {
        type: DataTypes.STRING,
      },
      authorizations: {
        type: DataTypes.INTEGER
      },
      role: {
        type: DataTypes.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('users');
  }
};