const { User, Exam, Copy } = require("./database/models");
const getUser = require("./getUser")
const convertMatricule = require("./convertMatricule")

async function saveErrorCopy(copy, error, examId, req){
    getUser.getUser(convertMatricule.matriculeToEmail(String(copy.qrcode.matricule)), req).then(async user=>{
        dbCopy = await Copy.findOne({where:{"examId":examId,"userMatricule": user.matricule}})

        if(dbCopy){
            dbCopy.version = copy.qrcode.version, 
            dbCopy.result = [0, 0], 
            dbCopy.file = copy.file,
            dbCopy.answers = JSON.stringify({"error":error})
            dbCopy.save()
            console.log('Resave copy')
        }
        else{
            Copy.create({"userMatricule": user.matricule, 
                        "examId": examId, 
                        "version": copy.qrcode.version, 
                        "result": [0, 0], 
                        "file": copy.file,
                        "answers": JSON.stringify({"error":error})
                    })
        }
    }).catch(err=>{
        console.log(err)
    })
    
}

async function saveCopy(copy, result, examId, req){
    getUser.getUser(convertMatricule.matriculeToEmail(String(copy.qrcode.matricule)), req).then(async user=>{
        dbCopy = await Copy.findOne({where:{"examId":examId, "userMatricule": user.matricule}})

        if(dbCopy){
            dbCopy.version = copy.qrcode.version, 
            dbCopy.result =result, 
            dbCopy.file = copy.file,
            dbCopy.answers = JSON.stringify(copy.answers)
            dbCopy.save()
            console.log('Resave copy')
        }
        else{
            Copy.create({"userMatricule": user.matricule, 
                        "examId":examId, 
                        "version":copy.qrcode.version, 
                        "result": result, 
                        "file": copy.file,
                        "answers": JSON.stringify(copy.answers)
                    })
        }
    }).catch(err=>{
        console.log(err);
    })
}

//called to recorrect after criteria changes
async function reCorrect(examId){
    return new Promise(async(resolve,reject)=>{
        const exam = await Exam.findOne({where:{id:examId}})
        const copies = await Copy.findAll({where:{examId:examId}})
        const corrections = JSON.parse(exam.corrections)
        const questionStatus = JSON.parse(exam.questionStatus)
        const correctionCriterias = JSON.parse(exam.correctionCriterias)
        
        copies.forEach((copy)=>{
            
            console.log(corrections[copy.version])
            console.log(copy.answers)
            correctionCopy(corrections[copy.version],JSON.parse(copy.answers),questionStatus[copy.version],correctionCriterias)
            .then(async result=>{
                console.log('OK')
                console.log(result)
                dbCopy = await Copy.findOne({where:{id:copy.id}})
                dbCopy.result = result
                await dbCopy.save()
            })
            .catch(async err=>{
                console.log('KO')
                dbCopy = await Copy.findOne({where:{id:copy.id}})
                dbCopy.result = [0, 0]
                dbCopy.answers = JSON.stringify({"error": "error while re correcting"})
                reject(err)
            })
        })
        resolve('Done')

    })
}

async function correctAll(exam, scanResultString, req){
    const scanResult = JSON.parse(scanResultString)

    // FIND THE EXAM RELATED TO THE EXAMID
    const id = scanResult.zipFile.split('.')[0]
    const examId = exam.id
    const corrections = JSON.parse(exam.dataValues.corrections)
    const correctionCriterias = JSON.parse(exam.dataValues.correctionCriterias)
    const questionStatus = JSON.parse(exam.dataValues.questionStatus)

    //Step 2 : CORRECT ALL COPIES
    scanResult.data.forEach(async (copy) =>{
        console.log(copy)
        if (copy.error == "None"){
            correctionCopy(
                    corrections[copy.qrcode.version],
                    copy.answers,
                    questionStatus[copy.qrcode.version],
                    correctionCriterias
            ).then(async result =>{
                saveCopy(copy,result,exam.id, req)
                //email.sendResult(copy,result)
                console.log(result)
            })
            .catch(err=>{
                console.log(err+copy.qrcode.matricule)
                saveErrorCopy(copy, "correction copy error", exam.id, req)
            })
        }
    })    

    exam.status = 2
    exam.save()
}

//Correction file
function correctionCopy(  correction /*list of list*/,
                            response /*list of list*/,
                            questionStatus, /*list */
                            correctionCriterias,
                            ){

    return new Promise((resolve, reject) => {                                  
        if (correction.length != response.length){
            reject("Le nombre de questions de la correction et de la copie ne correspondent pas")
        }

        totalPoints = 0
        maxPoints = 0
        const equals = (a, b) => JSON.stringify(a) == JSON.stringify(b);
        
        for(var questionIndex = 0; questionIndex < correction.length; questionIndex++ ){
            if(questionStatus[questionIndex] == 'normal'){
                //Vérifier que le nombre de propositions de la correction correspond au nombre
                //de proposition de la copie
                if(response[questionIndex].length != correction[questionIndex].length){
                    reject("Le nombre de propositions de la correction et de la copie ne correspondent pas")
                }

                // --- > Normal correction
                if(correctionCriterias.type == 'normal'){    
                    const positif = parseFloat(correctionCriterias.ptsRight,10)
                    const negatif =  parseFloat(correctionCriterias.ptsWrong,10)
                    const abstention = parseFloat(correctionCriterias.ptsAbs,10)
                    
                    
                    maxPoints += positif
                    // NO ABSTENTION:
                    if(response[questionIndex].some(elem => elem == true)){            
                        if(equals(correction[questionIndex],response[questionIndex])) totalPoints += positif
                        else totalPoints -= negatif
                    }
                    else totalPoints += abstention
                }
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


function correctionAdvancedProp(correction,
                                response,
                                correctionCriterias
                                ){
    
    
    var lastExclusive = null;
    if(correctionCriterias.isLastExclusive) lastExclusive = true
    else lastExclusive = false
    console.log(correctionCriterias)
    
    const eachGood = parseFloat(correctionCriterias.allGood,10)
    const onefalse = parseFloat(correctionCriterias.oneWrong,10)
    const twofalse = parseFloat(correctionCriterias.twoWrong,10)
    const threefalse = parseFloat(correctionCriterias.threeWrong,10)
    const morethanthree = parseFloat(correctionCriterias.threeMoreWrong,10)
    const lastProp = lastExclusive
    const lastPropTrue = parseFloat(correctionCriterias.lastExclusiveTrue,10)
    const lastPropFalse = parseFloat(correctionCriterias.lastExclusiveFalse,10)

    // Si dernière proposition EXCLUSIVE ET DEVAIT être cochée !
    if( lastProp && correction[correction.length - 1]){
        // Si la réponse a été cochée :
        if(response[response.length - 1]){
            //Vérifier que rien d'autre n'a été coché
            for(var propIndex = 0; propIndex< response.length -1; propIndex++)
            {
                if(response[propIndex]) return [lastPropFalse, lastPropTrue ] //Point obtenu, point max
            }
            
            return [lastPropTrue, lastPropTrue] //point Obtenue , point max
        }
        else return [lastPropFalse, lastPropTrue ] //point Obtenue , point max
    }

    //Dernière propostion exclusive MAIS ne devait pas être cochée
    else if(lastProp && response[response.length -1]){
        return [lastPropFalse, eachGood ] //point Obtenue , point max
    }

    else{
        nbError = 0
        for(var propIndex = 0; propIndex < response.length; propIndex++){
            if(response[propIndex] != correction[propIndex]){
                nbError++
            }
        }

        if(nbError == 0) return [eachGood, eachGood ]
        if(nbError == 1) return [onefalse, eachGood ]
        if(nbError == 2) return [twofalse, eachGood ]
        if(nbError == 3) return [threefalse, eachGood ]
        if(nbError >  3) return [morethanthree, eachGood ]
    }
}

exports.saveErrorCopy = saveErrorCopy
exports.saveCopy = saveCopy
exports.correctAll = correctAll
exports.correctionCopy = correctionCopy
exports.reCorrect = reCorrect