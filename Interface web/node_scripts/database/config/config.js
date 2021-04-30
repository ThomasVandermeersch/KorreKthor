require('dotenv').config();

module.exports = {
    "development": {
        "username": process.env.POSTGRES_USER,
        "password": process.env.POSTGRES_PASSWORD,
        "database": process.env.POSTGRES_DATABASE_dev,
        "host": process.env.POSTGRES_HOST_dev,
        "port": process.env.POSTGRES_PORT_dev,
        "dialect": "postgres",
        "dialectOptions":{
            statement_timeout: 1000,
            idle_in_transaction_session_timeout: 5000
        }
    },
    "test": {
        "username": "root",
        "password": null,
        "database": "database_test",
        "host": "127.0.0.1",
        "dialect": "postgres"
    },
    "production": {
        "username": process.env.POSTGRES_USER,
        "password": process.env.POSTGRES_PASSWORD,
        "database": process.env.POSTGRES_DATABASE_prod,
        "host": process.env.POSTGRES_HOST_prod,
        "port": process.env.POSTGRES_PORT_prod,
        "dialect": "postgres",
        "logging": false
    }
};