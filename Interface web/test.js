

// email = "17976@ecam.be"
// if(email.startsWith('19')) { 
//     console.log(String(parseInt(email.split('@')[0], 10) - 176000))
//     console.log("student")
// }
// else{
//     start = String(email.split('@')[0])
//     let re = /^\d/
//     if (re.test(start)){
//         console.log("student")
//     }
//     else{
//         console.log("prof")
//     }
// }


const { forEach } = require("jszip");
const { User, Exam, Copy } = require("./node_scripts/database/models");

async function hello(){
    var users = await User.findAll()
    var mapping = users.map(user=>(user.dataValues))
    console.log(mapping)
}


//hello()

//0 ==> admin + create
//1 ==> create
//2 ==> admin
//3 ==> rien
async function changeAuth(){
    var user = await User.findOne({where:{matricule:'17076'}})
    user.authorizations = 1
    await user.save()
}

changeAuth()