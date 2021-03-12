
function convertMatricule (matricule){
    if(typeof matricule != "string")  matricule = (String(parseInt(matricule, 10)))
        
        if(matricule.length == 6  && matricule.startsWith('19')) { 
            matricule = matricule - 176000
        }
    return matricule
}

function emailToMatricule(email){
    var matricule = email.split('@')[0]
    console.log(matricule)
    return convertMatricule(matricule)
}

function matriculeToEmail(matricule){
    if(typeof matricule != "string")  matricule = (String(parseInt(matricule, 10)))
    if(matricule.startsWith('19') && matricule.length == 5){
        matricule = parseInt(matricule, 10)
        matricule = matricule + 176000
    }
    var email = matricule + '@ecam.be'
    return email
}

// console.log(emailToMatricule('195030@ecam.be'))
// console.log(emailToMatricule('195019@ecam.be'))
// console.log(emailToMatricule('j3l@ecam.be'))
// console.log(emailToMatricule('hil@ecam.be'))
// console.log(emailToMatricule('17030@ecam.be'))

// console.log(matriculeToEmail(12399))
// console.log(matriculeToEmail('12399'))
// console.log(matriculeToEmail('hil'))
// console.log(matriculeToEmail('j3L'))

// console.log(matriculeToEmail(195678))
// console.log(matriculeToEmail(19678))
// console.log(matriculeToEmail(19819))

// console.log(mat)


exports.convertMatricule = convertMatricule
exports.emailToMatricule = emailToMatricule
exports.matriculeToEmail = matriculeToEmail

