const { User, Exam, Copy } = require("./node_scripts/database/models");

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

Copy.create({"version":"B", "userId":"7fc00d73-0054-4ab2-98b1-28eb93e27178", "examId":"78c170ae-8a10-4b1c-9d7f-d3e038141e68"})


// testSet = {
//     A: [
//       [ true, false, false ],
//       [ false, true, false ],
//       [ false, true, false ],
//       [ false, false, true ],
//       [ false, false, true ]
//     ],
//     B: [
//       [ true, false, false ],
//       [ false, true, false ],
//       [ false, false, true ],
//       [ false, false, true ],
//       [ false, false, true ]
//     ],
//     C: [
//       [ true, false, false ],
//       [ false, true, false ],
//       [ false, true, false ],
//       [ false, false, true ],
//       [ false, false, true ]
//     ]
//   }

// var questionStatus = {}

// Object.entries(testSet).forEach(([key,value]) =>{
//     let array = []
//     for(let i=0 ; i<value.length ;i++){
//         array.push('normal')   
//     }
//     questionStatus[key] = array

// });

// console.log(questionStatus)

const corrector = require('./node_scripts/correction')
//Correction array
correction = [[true, false, false],
              [false,false, true],
              [false,true,false],
              [false,true,true,false]
            ]


response1 = [[true, false, false],
[false,false, true],
[false,true,false],
[false,true,true,false]
]


response2 = [[true, false, false], //good
[false,false, false], //abs
[true,false,false], //incorrect
[false,true,true,false]
]

response3 = [[true, false, false],
[false,false, true],
[false,true,true],
[false,true,true,false]
]


//Response 1 : Tout est correct
questionStatus = ['normal','normal','normal','normal']

corrector.correctionNormal(correction,response1,questionStatus,1,0,0)
    .then(result=>console.log('Should return 4 --- Return : ' + result[0]))
    .catch(err=> console.log(err))


//Shoud return 4
corrector.correctionNormal(correction,response2,questionStatus,1,0,0)
    .then(result=>console.log('Should return 4 --- Return : ' + result[0]))
    .catch(err=> console.log(err)) //Shoud return 5