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
          type: DataTypes.STRING,
      },
      corrections:{
        type: DataTypes.STRING(8192),
      },
      status:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      copyViewAvailable:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      collaborators:{
        type: DataTypes.STRING(4096),
      },
      correctionCriterias:{
        type: DataTypes.STRING(1024)
      },
      correctionFile:{
          type: DataTypes.STRING,
      },
      examFile:{
          type: DataTypes.STRING,
      },
      userMatricule:{
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      excelFile:{
        type: DataTypes.STRING,
        allowNull: false
      },
      historic:{
        type: DataTypes.STRING(4096),
      },
    });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('exams');
  }
};
