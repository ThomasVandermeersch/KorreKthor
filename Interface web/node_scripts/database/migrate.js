const {sequelize} = require("../models")

async function migrate(){
    await sequelize.sync( { force:true } )
}

migrate()