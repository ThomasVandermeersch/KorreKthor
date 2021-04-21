'use strict';
const {
  Model,
  Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Copy extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Exam }) {
      // define association here
      this.belongsTo(User, {foreignKey:"userId", as:"user"})
      this.belongsTo(Exam, {foreignKey:"examId", as:"exam"})
    }
  };
  Copy.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    version: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file: {
        type: DataTypes.STRING,
    },
    result:{
        type: DataTypes.ARRAY(DataTypes.FLOAT),
    },
    answers:{
      type: DataTypes.STRING(2048),
    },
  }, {
    sequelize,
    tableName: "copies",
    modelName: 'Copy',
  });
  return Copy;
};