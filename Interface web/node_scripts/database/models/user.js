'use strict';
const {
  Model,
  Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Exam, Copy }) {
      // define association here
      this.hasMany(Exam, {foreignKey: "userId", as:"exams"})
      this.hasMany(Copy, {foreignKey: "userId", as:"copies"})
    }
  };
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    matricule: {
        type: DataTypes.INTEGER,
    },
    authorizations:{
        type: DataTypes.INTEGER,
    },
    role:{
        type: DataTypes.INTEGER,
    },
  }, {
    sequelize,
    tableName: "users",
    modelName: 'User',
  });
  return User;
};