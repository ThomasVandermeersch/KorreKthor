'use strict';
const {
  Model,
  Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Exam extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Copy }) {
      // define association here
      this.belongsTo(User, {foreignKey:"userMatricule", as:"user"})
      this.hasMany(Copy, {foreignKey:"examId", as:"copies"})
    }
  };
  Exam.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
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
    excelFile:{
      type: DataTypes.STRING,
      allowNull: false
    },
    historic:{
      type: DataTypes.STRING(4096),
    },
  }, {
    sequelize,
    tableName: "exams",
    modelName: 'Exam',
  });
  return Exam;
};
