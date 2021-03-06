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
    static associate(models) {
      // define association here
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
    // sudentList relation

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
  }, {
    sequelize,
    tableName: "exams",
    modelName: 'Exam',
  });
  return Exam;
};