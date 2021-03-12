
//This function is only used by the developpers

const { User, Exam, Copy } = require("./node_scripts/database/models");

async function seeUsers(){
    var users = await User.findAll()
    var mapping = users.map(user=>(user.dataValues))
    console.log(mapping)
}



//0 ==> admin + create
//1 ==> create
//2 ==> admin
//3 ==> rien
async function changeAuth(mat,auth){
    var user = await User.findOne({where:{matricule:mat}})
    user.authorizations = auth
    user.save()
}

async function deleteUsers(){
    await User.destroy({
        truncate:true
    })
}

//seeUsers()
//changeAuth('17030',0)
deleteUsers()