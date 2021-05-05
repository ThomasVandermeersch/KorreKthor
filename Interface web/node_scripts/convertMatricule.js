function convertMatricule (matricule){
    if(typeof matricule != "string")  matricule = (String(parseInt(matricule, 10)))
        
        if(matricule.length == 6  && matricule.startsWith('19')) { 
            matricule = matricule - 176000
        }
    return matricule
}

function emailToMatricule(email){
    var matricule = email.split('@')[0]
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

exports.convertMatricule = convertMatricule
exports.emailToMatricule = emailToMatricule
exports.matriculeToEmail = matriculeToEmail