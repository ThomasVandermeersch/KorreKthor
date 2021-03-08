'use strict';
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('copies', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false
      },
      file: {
          type: DataTypes.STRING,
      },
      result:{
          type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      examId: {
        type: DataTypes.UUID,
        allowNull: false
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
    await queryInterface.dropTable('copies');
  }
};