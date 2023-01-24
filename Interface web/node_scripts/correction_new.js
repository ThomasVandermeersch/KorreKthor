const {  Exam, Copy } = require("./database/models");

function correctionCopy( copy, response, corrections, correctionCriterias, userCorrection=false ){    
    var previousCopyStatus = copy.status

    const newResponses = [] // va contenir l'objet avec les réponses
    
    // Set up the version and the associated correction
    version = copy.version == 'X' ? 'A' : copy.version;        
    var correction = corrections[version]

    // Declare points 'buffers'
    totalPoints = 0
    maxPoints = 0

    for(var questionIndex = 0; questionIndex < correction.length; questionIndex++ ){
        
        if(correction[questionIndex].type == 'version'){
            versionObject = changeVersion(response[questionIndex])
            if('error' in versionObject){
                copy.status = "errorVersion"
                newResponses.push({list:response[questionIndex],status:"errorVersion"})
            } 
            else{
                correction = corrections[versionObject.version]
                version = versionObject.version
                if(userCorrection){
                    newResponses.push({list:response[questionIndex],version:versionObject.version,status:"verified"})
                    copy.status = "verified"
                } 
                else{
                    newResponses.push({list:response[questionIndex],version:versionObject.version,status:"ok"})
                    copy.status = "ok"
                }
            }
        }

        else if(correction[questionIndex].type == 'qcm'){
            correctNormalRep = correctSingleQuestion(response[questionIndex],correctionCriterias,correction[questionIndex])

            if(copy.answers != "") correctNormalRep = addStatusToSingleQuestion(JSON.parse(copy.answers)[questionIndex], correctNormalRep, userCorrection)
            else correctNormalRep = addStatusToSingleQuestion("", correctNormalRep, userCorrection)
            
            // Add the modifications to the chain
            if(copy.answers != ""){
                previousResponse = JSON.parse(copy.answers)[questionIndex]
                if(previousResponse.status == "error" && !userCorrection) correctNormalRep.status = "error"
            } 
            newResponses.push(correctNormalRep)

            if(copy.status == "errorVersion") copy.status = "errorVersion"
            else if(correctNormalRep.status == 'error' || copy.status == "error") copy.status = "error"

            else if(previousCopyStatus == "verified" || userCorrection) copy.status = "verified"

            else if(copy.status == "double_and_abs") copy.status = "double_and_abs"

            else if(correctNormalRep.status == "abs"){
                if(copy.status == "double") copy.status = "double_and_abs"
                else copy.status = correctNormalRep.status
            }

            else if(correctNormalRep.status == "double"){
                if(copy.status == "abs") copy.status = "double_and_abs"
                else copy.status = correctNormalRep.status
            }

            else if(copy.status == "abs" || copy.status == "double" || copy.status == "double_and_abs") copy.status = copy.status

            else copy.status = "ok"

            if(copy.status != "error"){
                totalPoints += correctNormalRep.totalPoint
                maxPoints += correctNormalRep.maxPoint
            }
        }
    }

    if(copy.status == "error" || copy.status == "errorVersion") copy.display_level = "2"
    else copy.display_level = "1"
    copy.version = version
    copy.answers = JSON.stringify(newResponses)
    copy.result = [totalPoints,maxPoints]
    return copy
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

function correctSingleQuestion(responseList,correctionCriterias,correction){
    if(responseList.includes(2)) return {status: 'error',list:Array(correction.length).fill(0)}
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

function addStatusToSingleQuestion(previousResponseList, responseList, userCorrection){
    
    if(responseList.status == "error") responseList.status = "error"
    
    else if(previousResponseList.status == "verified" || userCorrection) responseList.status = "verified"
    
    else{
        nbOnes = responseList.list.filter(x => x == 1).length;

        if(nbOnes == 0) responseList.status = "abs"
        else if (nbOnes == 1) responseList.status = "ok"
        else if (nbOnes > 1) responseList.status = "double"
    }

    return responseList
}


function reCorrectExam(examId){
    return new Promise((resolve,reject)=>{
        Exam.findOne({where:{id:examId}}).then(exam=>{
            const corrections = JSON.parse(exam.corrections)
            const correctionCriterias = JSON.parse(exam.correctionCriterias)
            
            Copy.findAll({where:{examId:examId}}).then(copies=>{
                for (let copyIndex = 0; copyIndex < copies.length; copyIndex++){
                    if(copies[copyIndex].status != "not_submitted"){
                        dbAnswers = JSON.parse(copies[copyIndex].answers)
                        dbAnswers = dbAnswers.map(item => item.list)
                        copies[copyIndex] = correctionCopy( copies[copyIndex], dbAnswers, corrections, correctionCriterias)
                        copies[copyIndex].save()

                    }
                }
            })


            exam.save().then(()=>{
                resolve()
            }).catch(err=>{
                console.log(err)
                reject(err)
            })
        })
    })
}


exports.correctionCopy = correctionCopy
exports.reCorrectExam = reCorrectExam