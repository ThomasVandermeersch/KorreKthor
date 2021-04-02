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

//Copy.create({"version":"B", "userId":"7fc00d73-0054-4ab2-98b1-28eb93e27178", "examId":"78c170ae-8a10-4b1c-9d7f-d3e038141e68"})


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

const corrector = require('./node_scripts/correction');
const user = require("./node_scripts/database/models/user");
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
[false,true,true,false] //good
]

response3 = [[true, false, false],
[false,false, true],
[false,true,false],
[false,true,true,false,true]
]

response4 = [[true, false, false],
[false,false, true],
[false,true,false],
[false,true,true,false],
[false,true,true,false]
]



// //Response 1 : Tout est correct
// questionStatus = ['normal','normal','normal','normal']

// console.log('Start script test')

// corrector.correctionNormal(correction,response1,questionStatus,1,0,0)
//     .then(result=>console.log('Should return 4 / 4 --- Return : ' + result[0])) //tout est correct
//     .catch(err=> console.log(err))


// corrector.correctionNormal(correction,response2,questionStatus,1,0,0)
//     .then(result=>console.log('Should return 2 / 4 --- Return : ' + result[0])) //1 abs 1 incorrecte 2 correcte
//     .catch(err=> console.log(err))


// corrector.correctionNormal(correction,response2,questionStatus,1,0.25,0)
//     .then(result=>console.log('Should return 1.75 / 4 --- Return : ' + result[0])) //1 abs 1 incorrecte 2 correcte
//     .catch(err=> console.log(err))


// //Shoud return 4
// corrector.correctionNormal(correction,response2,questionStatus,1,0.25,0.5)
//     .then(result=>console.log('Should return 2.25 / 4 --- Return : ' + result[0])) //1 abs 1 incorrecte 2 correcte
//     .catch(err=> console.log(err)) //Shoud return 5


// corrector.correctionNormal(correction,response3,questionStatus,1,0.25,0.5)
//     .then(result=>console.log('Should return Prop incompatible --- Return : ' + result[0])) //1 abs 1 incorrecte 2 correcte
//     .catch(err=> console.log(err)) //Shoud return 5

// corrector.correctionNormal(correction,response4,questionStatus,1,0.25,0.5)
//     .then(result=>console.log('Should return Question incompatible --- Return : ' + result[0])) //1 abs 1 incorrecte 2 correcte
//     .catch(err=> console.log(err)) //Shoud return 5

// async function search(){
//   const user = await User.findOne({matricule:'17036'})
//   const copies = await Copy.findOne({userId:user.id})
//   console.log(copies)
// }

// search()






 

correctionGuillaume = [[true,false,false],[false,true,false],[false,true,false],[false,false,true],[false,false,true],[false,true,false,true]]

responseGuillaume = [[true,false,false],[false,true,false],[false,true,false],[false,false,true],[false,false,true],[false,true,false,false,true]]
questionStatus = ['normal','normal','normal','normal','normal','normal']
console.log('Prout')
corrector.correctionNormal(responseGuillaume,correctionGuillaume,questionStatus,1,0,0).then(a=>console.log('Salut : '+ a)).catch(err=>console.log(err))



const body = {"zipFile": "78c170ae-8a10-4b1c-9d7f-d3e038141e68.zip", "data": [{"qrcode": {"matricule": 17076, "version": "B", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, true, true], [true, true], [true, false, false], [true, false, false], [true, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_B_17076.png", "error": "None"}, {"qrcode": {"matricule": 14136, "version": "C", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[false, true, false, false], [false, false, false], [false, true, false, false], [true, false, false, false], [false, false, true, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_C_14136.png", "error": "None"}, {"qrcode": {"matricule": 15154, "version": "C", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_C_15154.png", "error": "None"}, {"qrcode": {"matricule": 17036, "version": "A", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false], [false, true, false], [false, true, false], [false, false, true], [false, false, true], [false, true, false, false, true]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_A_17036.png", "error": "None"}, {"qrcode": {"matricule": 17338, "version": "C", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false, false], [true, false, false, false], [false, true, false, false], [false, true, true, false], [false, true, true, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_C_17338.png", "error": "None"}, {"qrcode": {"matricule": 17325, "version": "A", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false], [false, true, false], [true, false, false], [false, true, false], [false, false, true], [true, false, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_A_17325.png", "error": "None"}, {"qrcode": {"matricule": 16027, "version": "B", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false, false], [false, true], [false, false, true], [false, true, false, false], [true, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_B_16027.png", "error": "None"}, {"qrcode": {"matricule": 19371, "version": "A", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, true], [false, false, true], [false, true, false], [false, true, true, false], [false, true, false], [false, false, true, true]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_A_19371.png", "error": "None"}, {"qrcode": {"matricule": 19286, "version": "B", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[false, true, false], [false, true], [false, false, true], [false, true, false], [true, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_B_19286.png", "error": "None"}]}

corrector.correctAll(JSON.stringify(body))