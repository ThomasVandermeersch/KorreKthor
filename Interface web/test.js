const { Exam, Copy, User } = require("./node_scripts/database/models");


Exam.findAll({include:{model:User, as:"user"}}).then(exams=>{
    console.log(exams[0].user.matricule)
})