

// // email = "17976@ecam.be"
// // if(email.startsWith('19')) { 
// //     console.log(String(parseInt(email.split('@')[0], 10) - 176000))
// //     console.log("student")
// // }
// // else{
// //     start = String(email.split('@')[0])
// //     let re = /^\d/
// //     if (re.test(start)){
// //         console.log("student")
// //     }
// //     else{
// //         console.log("prof")
// //     }
// // }

const { array } = require("get-stream")


// const { forEach } = require("jszip");
// const { User, Exam, Copy } = require("./node_scripts/database/models");
// const user = require("./node_scripts/database/models/user");

// async function hello(){
//     var users = await User.findAll()
//     var mapping = users.map(user=>(user.dataValues))
//     console.log(mapping)
// }


// // hello()

// //0 ==> admin + create
// //1 ==> create
// //2 ==> admin
// //3 ==> rien
// async function changeAuth(){
//     //var user = await User.findOne({where:{matricule:'17030'}})
//     var users = await User.findAll()

//     users.forEach(user=>{
//         user.destroy()
//     })
//     user.authorizations = 0
//     // console.log(user)
//     // await user.save()
// }


// //angeAuth()

// // async function a(){
// //     a = await User.findOne({where:{matricule:"17076"}})
// //     b = {
// //         a: a,
// //         c: 12,
// //         d:"de"
// //     }
// //     return b
// // }

// // a().then((val) => {
// //     console.log(val)
// // })

// // Copy.findAll().then((val)=>{
// //     val.forEach(async(exam)=>{
// //         console.log(exam.id)
// //         a = await exam.getUser()
// //         b = await a.getCopies()
// //         // console.log(a)
// //         console.log(b.length)
// //     })
    
// // })

// Exam.findOne({where:{id:"e4fca29a-866c-4d9a-ab59-c8635257263f"}}).then(async(val) => {
//     a = await val.getUser()
//     console.log(a.fullName)
//     b = await val.getCopies()
//     console.log(b[0].id)
// })

// // Copy.create({"version":"A", "userId":"d2179d2b-f26a-4e45-bffb-19f23b5349c0", "examId":"e4fca29a-866c-4d9a-ab59-c8635257263f"})


testSet = {
    A: [
      [ true, false, false ],
      [ false, true, false ],
      [ false, true, false ],
      [ false, false, true ],
      [ false, false, true ]
    ],
    B: [
      [ true, false, false ],
      [ false, true, false ],
      [ false, false, true ],
      [ false, false, true ],
      [ false, false, true ]
    ],
    C: [
      [ true, false, false ],
      [ false, true, false ],
      [ false, true, false ],
      [ false, false, true ],
      [ false, false, true ]
    ]
  }

var questionStatus = {}

Object.entries(testSet).forEach(([key,value]) =>{
    let array = []
    for(let i=0 ; i<value.length ;i++){
        array.push('normal')   
    }
    questionStatus[key] = array

});

console.log(questionStatus)