
//This function is only used by the developpers

const { User, Exam, Copy } = require("./node_scripts/database/models");

async function seeUsers(){
    var users = await Exam.findAll()
    //var mapping = users.map(user=>(user.dataValues))
    console.log(users)
}

seeUsers()


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
        truncate:true,
        where:{examId:'f0b29f64-3133-4a76-ac62-0149d9b69725'}
    })
}

deleteUsers()

//seeUsers()
changeAuth('17030',0)
//deleteUsers()