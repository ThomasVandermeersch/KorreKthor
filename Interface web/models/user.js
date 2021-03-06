const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.POSTGRES_URL)
