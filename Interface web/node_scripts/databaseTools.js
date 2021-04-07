const { User} = require("../node_scripts/database/models");
const convertMatricule = require('./convertMatricule')

function createStudents(students){
    var out = []
    students.forEach(async (student) => {
        var matricule = convertMatricule.convertMatricule(student.matricule)
        checkStudent = await User.findOne({where:{matricule:matricule}})

        if (!checkStudent){
            var email = convertMatricule.matriculeToEmail(student.matricule)
            checkStudent = await User.create({"fullName":student.name, "matricule": matricule, "email": email, "authorizations":3, "role":0})
        }

        out.push(checkStudent)
    });

    return out
}

exports.createStudents = createStudents