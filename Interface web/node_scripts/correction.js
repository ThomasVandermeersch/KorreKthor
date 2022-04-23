const {  Exam, Copy } = require("./database/models");
const getUser = require("./getUser")
const convertMatricule = require("./convertMatricule")

function saveCopy(copy, data, examId, req, uid){
    getUser.getUser(convertMatricule.matriculeToEmail(String(copy.qrcode.matricule)), req).then(user=>{
        Copy.findOne({where:{"examId":examId,"userMatricule": user.matricule}}).then(dbCopy=>{
            // var answers
            // if(error) answers = JSON.stringify({"error":error})
            // else answers = JSON.stringify(data.newResponse)
            console.log(data.newResponse)
            console.log(typeof(data.newResponse))
            if(dbCopy){
                dbCopy.version = data.version, 
                dbCopy.result = data.result, 
                dbCopy.file = uid + '/' + copy.file,
                dbCopy.answers = data.newResponse
                dbCopy.save().catch(err=>{
                    console.log(" --- DATABASE ERROR -- Function correction/saveCopy --\n " + err)
                })
            }
            else{
                Copy.create({"userMatricule": user.matricule, 
                            "examId": examId, 
                            "version": data.version, 
                            "result": data.result, 
                            "file": uid + '/' + copy.file,
                            "answers": data.newResponse
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
            const correctionCriterias = JSON.parse(exam.correctionCriterias)

            exam.copies.forEach((copy)=>{
                dbAnswers = JSON.parse(copy.answers)
                if('response' in dbAnswers) dbAnswers = dbAnswers.response.map(item => item.list)
                
                correctionCopy(
                    corrections,
                    dbAnswers,
                    correctionCriterias,
                    copy.version)
                .then(data=>{

                    copy.result = data.result
                    copy.version = data.version
                    copy.answers = data.newResponse

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

function correctAll(exam, scanResultString, req,uid){
    const scanResult = JSON.parse(scanResultString)
    const corrections = JSON.parse(exam.dataValues.corrections)
    const correctionCriterias = JSON.parse(exam.dataValues.correctionCriterias)
    
    // Correct all copies
 
    pagesError = []
    scanResult.data.forEach( (copy) =>{
        if (copy.error == "None"){
            correctionCopy( 
                    corrections,
                    copy.answers,
                    correctionCriterias,
                    copy.qrcode.version
            ).then( data =>{
                saveCopy(copy,data,exam.id, req,uid)
            })
            .catch(err=>{
                saveCopy(copy,{result:[0,0],version:copy.qrcode.version,newResponse:err},exam.id,req,uid)
            })
        }
        else{
            originalFileName = copy.filename
            pageNumber = (originalFileName.split(`/`)[1]).split('.')[0]
            pagesError.push(pageNumber)
        }
    })
    
    // Modify exam status
    exam.status = 2
    historic = JSON.parse(exam.historic)
    newHistory = {
        date : Date(),
        user : req.session.userObject.matricule,
        fileName : req.file.filename,
        pagesError : pagesError
    }
    historic.push(newHistory)
    exam.historic = JSON.stringify(historic)
    
    exam.save().then(exam=>{
        // nothing to do
    }).catch( err=>{
        console.log(" --- DATABASE ERROR -- Function correction/correctAll \n " + err)
    })
}

//Correction file
function correctionCopy( corrections, response, correctionCriterias,recivedVersion){
    return new Promise((resolve, reject) => {
        var propError = false // We suppose that their is no Error
        const newResponses = []

        // Set up the version
        var version
        if(recivedVersion == 'X') version = 'A'
        else version = recivedVersion
        
        // Take the correction of the selected version
        correction = corrections[version]

        
        // Declare points 'buffers'
        totalPoints = 0
        maxPoints = 0

        for(var questionIndex = 0; questionIndex < correction.length; questionIndex++ ){
            
            if(correction[questionIndex].type == 'version'){
                versionObject = changeVersion(response[questionIndex])
                if('error' in versionObject){
                   propError = true
                   newResponses.push({list:response[questionIndex],error:versionObject.error})
                } 
                else{
                    correction = corrections[versionObject.version]
                    version = versionObject.version
                    newResponses.push({list:response[questionIndex],version:versionObject.version})
                }
            }

            else if(correction[questionIndex].type == 'qcm'){
                //if(correctionCriterias.type == 'normal'){
                if(true){
                    correctNormalRep = correctNormal(response[questionIndex],correctionCriterias,correction[questionIndex])
                    
                    if('error' in correctNormalRep){
                        newResponses.push(correctNormalRep)
                        propError = true
                    }
                    else{
                        newResponses.push(correctNormalRep)
                        totalPoints += correctNormalRep.totalPoint
                        maxPoints += correctNormalRep.maxPoint
                    }
                }
                
                else{
                    // To implement
                }
            }
        }
        if(propError){
            resolve({version:version,result:["?",maxPoints],newResponse:JSON.stringify({response:newResponses,propError:propError})})
        }
        else{
            resolve({version:version,result:[totalPoints,maxPoints],newResponse:JSON.stringify({response:newResponses,propError:propError})})
        }
    });
}

function changeVersion(list){
    if(list.includes(2)) return {error:'Error, uncertain version selection'}
    const alphabet = 'ABCDEFGH'
    i = list.indexOf(1)
    if(i==-1) return {error:'No selected version'}
    if(list.indexOf(1,i + 1) != -1) return {error:'Two versions selected'}
    version = alphabet[i]
    return {version:version}
}

function correctNormal(responseList,correctionCriterias,correction){
    if(responseList.includes(2)) return {error: 'Detection error'}
    const positif = parseFloat(correctionCriterias.ptsRight,10)
    const negatif =  parseFloat(correctionCriterias.ptsWrong,10)
    const abstention = parseFloat(correctionCriterias.ptsAbs,10)
    
    const maxPoint = positif * correction.weight

    // Check if any proposition is checked to detect absentention
    if(responseList.some(elem => elem == 1)){
        for(var propIndex = 0; propIndex < correction.response.length; propIndex++ ){
            if(correction.response[propIndex] != responseList[propIndex]) return {totalPoint:-negatif * correction.weight,maxPoint:maxPoint,list:responseList}
        }
        return {totalPoint:maxPoint,maxPoint:maxPoint,list:responseList}            
    }
    else return {totalPoint: abstention * correction.weight,maxPoint:maxPoint,list:responseList}
}

function correctAdvanced(){
    correctProp = correctionAdvancedProp(correction[questionIndex],response[questionIndex],correctionCriterias)
    totalPoints += correctProp[0] * questionWeigths[questionIndex]
    maxPoints += correctProp[1] * questionWeigths[questionIndex]
}

function correctOpen(){
                    // Syntaxe : arr.indexOf(élémentRecherché, indiceDébut)
                    indexA = response[questionIndex].indexOf(true)
                    indexB = response[questionIndex].indexOf(true, indexA+1)
                    
    
                    if(indexB == -1 && indexA != -1 ) points = indexA
                    else if(indexB != -1 && indexA != -1) points = (indexA + indexB)/2
                    else points = 0
                    
                    totalPoints += points
                    maxPoints += 10
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
