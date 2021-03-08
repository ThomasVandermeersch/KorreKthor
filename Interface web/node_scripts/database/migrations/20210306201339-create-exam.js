'use strict';
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('exams', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      numberOfVersion:{
          type: DataTypes.INTEGER,
          allowNull: false
      },
      versionsFiles:{
          type: DataTypes.ARRAY(DataTypes.STRING),
      },
      correctionFiles:{
          type: DataTypes.ARRAY(DataTypes.STRING),
      },
      examFile:{
          type: DataTypes.STRING,
      },
      userId:{
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
    await queryInterface.dropTable('exams');
  }
};