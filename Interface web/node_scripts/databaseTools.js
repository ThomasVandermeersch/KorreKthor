const { User, Exam, Copy } = require("../node_scripts/database/models");

function createStudents(students){
    var out = []
    students.forEach(async (student) => {
        checkStudent = await User.findOne({where:{matricule:student.matricule.toString()}})
        if (!checkStudent){
            checkStudent = await User.create({"fullName":student.name, "matricule":student.matricule.toString(), "email":`${student.matricule}@ecam.be`, "authorizations":3, "role":0})
        }

        out.push(checkStudent)
    });

    return out
}

exports.createStudents = createStudents