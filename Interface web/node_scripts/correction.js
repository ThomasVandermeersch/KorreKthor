const { User, Exam, Copy } = require("./database/models");
const getUser = require("./getUser")
const convertMatricule = require("./convertMatricule")

function saveCopy(copy, result, examId, req, error=null){
    getUser.getUser(convertMatricule.matriculeToEmail(String(copy.qrcode.matricule)), req).then(user=>{
        Copy.findOne({where:{"examId":examId,"userMatricule": user.matricule}}).then(dbCopy=>{
            var answers
            if(error) answers = JSON.stringify({"error":error})
            else answers = JSON.stringify(copy.answers)
            if(dbCopy){
                dbCopy.version = copy.qrcode.version, 
                dbCopy.result = result, 
                dbCopy.file = copy.file,
                dbCopy.answers = answers
                dbCopy.save().catch(err=>{
                    console.log(" --- DATABASE ERROR -- Function correction/saveCopy --\n " + err)
                })
            }
            else{
                Copy.create({"userMatricule": user.matricule, 
                            "examId": examId, 
                            "version": copy.qrcode.version, 
                            "result": result, 
                            "file": copy.file,
                            "answers": answers
                        }).catch(err=>{
                            console.log(" --- DATABASE ERROR -- Function correction/saveCopy --\n " + err)
                        })
            }
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- Function correction/saveCopy --\n " + err)
        })
    }).catch(err=>{
        console.log(" --- GRAPH ERROR -- Function correction/saveCopy --\n " + err)
    })
}

// This function is called when correction criterias or question status are changed
function reCorrect(examId){
    return new Promise((resolve,reject)=>{
        const query = {where:{id:examId}, include:[{model:Copy, as:"copies"}]}
        Exam.findOne(query).then(exam=>{
            const corrections = JSON.parse(exam.corrections)
            const questionStatus = JSON.parse(exam.questionStatus)
            const correctionCriterias = JSON.parse(exam.correctionCriterias)

            exam.copies.forEach((copy)=>{
 
                correctionCopy(corrections[copy.version],JSON.parse(copy.answers),questionStatus[copy.version],correctionCriterias)
                .then(result=>{

                    copy.result = result
                    copy.save().catch(err=>{
                        console.log(" --- DATABASE ERROR -- Function correction/recorrect --\n " + err)
                    })
                })
                .catch(err=>{
                    copy.result = [0, 0]
                    copy.answers = JSON.stringify({"error": "error while re correcting"})
                    copy.save().catch(err=>{
                        console.log(" --- DATABASE ERROR -- Function correction/recorrect --\n " + err)
                    })
                })
            })

            resolve('Done')

        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- Function correction/recorrect --\n " + err)
            reject(err)
        })
    })
}

function correctAll(exam, scanResultString, req){
    const scanResult = JSON.parse(scanResultString)
    const corrections = JSON.parse(exam.dataValues.corrections)
    const correctionCriterias = JSON.parse(exam.dataValues.correctionCriterias)
    const questionStatus = JSON.parse(exam.dataValues.questionStatus)

    // Correct all copies
    scanResult.data.forEach( copy =>{
        if (copy.error == "None"){
            correctionCopy( 
                    corrections[copy.qrcode.version],
                    copy.answers,
                    questionStatus[copy.qrcode.version],
                    correctionCriterias
            ).then( result =>{
                saveCopy(copy,result,exam.id, req)
            })
            .catch(err=>{
                saveCopy(copy,[0,0],exam.id,req,err)
            })
        }
    })
    
    // Modify exam status
    exam.status = 2
    exam.save().then(exam=>{
        // nothing to do
    }).catch( err=>{
        console.log(" --- DATABASE ERROR -- Function correction/correctAll \n " + err)
    })
}

//Correction file
function correctionCopy( correction, response, questionStatus, correctionCriterias){
    return new Promise((resolve, reject) => {                                  
        if (correction.length != response.length) reject("Le nombre de questions de la correction et de la copie ne correspondent pas")
        
        totalPoints = 0
        maxPoints = 0
        
        const equals = (a, b) => JSON.stringify(a) == JSON.stringify(b); // Comparaison de deux listes
        
        for(var questionIndex = 0; questionIndex < correction.length; questionIndex++ ){
            if(questionStatus[questionIndex] == 'normal'){
                // Copy proposition length == Correction proposition length
                if(response[questionIndex].length != correction[questionIndex].length) reject("Le nombre de propositions de la correction et de la copie ne correspondent pas")
                
                // Normal correction
                if(correctionCriterias.type == 'normal'){    
                    const positif = parseFloat(correctionCriterias.ptsRight,10)
                    const negatif =  parseFloat(correctionCriterias.ptsWrong,10)
                    const abstention = parseFloat(correctionCriterias.ptsAbs,10)
                    maxPoints += positif

                    // Check if any proposition is checked to detect absentention
                    if(response[questionIndex].some(elem => elem == true)){            
                        if(equals(correction[questionIndex],response[questionIndex])) totalPoints += positif
                        else totalPoints -= negatif
                    }
                    else totalPoints += abstention
                }
                // Advanced correction
                else{
                    correctProp = correctionAdvancedProp(correction[questionIndex],response[questionIndex],correctionCriterias)
                    totalPoints += correctProp[0]
                    maxPoints += correctProp[1]
                }
            }
        }
        resolve([totalPoints,maxPoints])
    });
}

// This function computes the result of an advanced
function correctionAdvancedProp(correction, response, correctionCriterias){
    
    // Check if last proposition is exclusive
    var lastExclusive;
    if(correctionCriterias.isLastExclusive) lastExclusive = true
    else lastExclusive = false

    //Set up correction criterias
    const eachGood = parseFloat(correctionCriterias.allGood,10)
    const onefalse = parseFloat(correctionCriterias.oneWrong,10)
    const twofalse = parseFloat(correctionCriterias.twoWrong,10)
    const threefalse = parseFloat(correctionCriterias.threeWrong,10)
    const morethanthree = parseFloat(correctionCriterias.threeMoreWrong,10)
    const lastProp = lastExclusive
    const lastPropTrue = parseFloat(correctionCriterias.lastExclusiveTrue,10)
    const lastPropFalse = parseFloat(correctionCriterias.lastExclusiveFalse,10)

    // "Case 1" : If last propositon is exclusive AND MUST BE checked
    if( lastProp && correction[correction.length - 1]){
        // DOES student check the question ?
        if(response[response.length - 1]){
            // If checked, verify if no other questions are checked.
            for(var propIndex = 0; propIndex< response.length -1; propIndex++) if(response[propIndex]) return [lastPropFalse, lastPropTrue ] //Point obtenu, point max
            return [lastPropTrue, lastPropTrue] // [getPoint, maxPoint]
        }
        else return [lastPropFalse, lastPropTrue ] // [getPoint, maxPoint]
    }

    // "Case 2" : If last propositon is exclusive AND MUST NOT BE checked
    //Check if the student don't check the proposition
    else if(lastProp && response[response.length -1]) return [lastPropFalse, eachGood ] // [getPoint, maxPoint]
    
    else{
        nbError = 0
        for(var propIndex = 0; propIndex < response.length; propIndex++){
            if(response[propIndex] != correction[propIndex]) nbError++
        }

        if(nbError == 0) return [eachGood, eachGood ]
        if(nbError == 1) return [onefalse, eachGood ]
        if(nbError == 2) return [twofalse, eachGood ]
        if(nbError == 3) return [threefalse, eachGood ]
        if(nbError >  3) return [morethanthree, eachGood]
    }
}

exports.saveCopy = saveCopy
exports.correctAll = correctAll
exports.correctionCopy = correctionCopy
exports.reCorrect = reCorrect