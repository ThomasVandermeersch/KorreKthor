const { reject } = require("async");
const { sendEmail } = require("nodejs-nodemailer-outlook");
const { resolve } = require("path");
const { User, Exam, Copy } = require("./database/models");

const email = require('./sendEmail')


//copiesObject = {"zipFile": "78c170ae-8a10-4b1c-9d7f-d3e038141e68.zip", "data": [{"qrcode": {"matricule": 17076, "version": "B", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, true, true], [true, true], [true, false, false], [true, false, false], [true, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_B_17076.png", "error": "None"}, {"qrcode": {"matricule": 14136, "version": "C", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[false, true, false, false], [false, false, false], [false, true, false, false], [true, false, false, false], [false, false, true, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_C_14136.png", "error": "None"}, {"qrcode": {"matricule": 17030, "version": "C", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_C_15154.png", "error": "None"}, {"qrcode": {"matricule": 17030, "version": "A", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, true, false], [false, true, true], [false, true, false], [false, true, true], [false, false, true], [false, true, false, false, true]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_A_17036.png", "error": "None"}, {"qrcode": {"matricule": 17338, "version": "C", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false, false], [true, false, false, false], [false, true, false, false], [false, true, true, false], [false, true, true, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_C_17338.png", "error": "None"}, {"qrcode": {"matricule": 17325, "version": "A", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false], [false, true, false], [true, false, false], [false, true, false], [false, false, true], [true, false, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_A_17325.png", "error": "None"}, {"qrcode": {"matricule": 16027, "version": "B", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, false, false], [false, true], [false, false, true], [false, true, false, false], [true, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_B_16027.png", "error": "None"}, {"qrcode": {"matricule": 19371, "version": "A", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[true, false, true], [false, false, true], [false, true, false], [false, true, true, false], [false, true, false], [false, false, true, true]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_A_19371.png", "error": "None"}, {"qrcode": {"matricule": 19286, "version": "B", "lessonId": "78c170ae-8a10-4b1c-9d7f-d3e038141e68"}, "answers": [[false, true, false], [false, true], [false, false, true], [false, true, false], [true, false, false]], "file": "78c170ae-8a10-4b1c-9d7f-d3e038141e68_B_19286.png", "error": "None"}]}
//correctAll(JSON.stringify(copiesObject))


async function saveCopy(copy,result,examId){
    console.log(copy.qrcode.matricule)
    var user = await User.findOne({where:{"matricule":String(copy.qrcode.matricule)}})
    dbCopy = await Copy.findOne({where:{"examId":examId,"userId": user.id}})
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
    console.log(user.fullName)

    if(dbCopy){
        dbCopy.version = copy.qrcode.version, 
        dbCopy.result =result, 
        dbCopy.file = copy.file,
        dbCopy.answers = JSON.stringify(copy.answers)
        dbCopy.save()
        console.log('Resave copy')
    }
    else{
            Copy.create({"userId": user.id, 
                       "examId":examId, 
                       "version":copy.qrcode.version, 
                       "result": result, 
                       "file": copy.file,
                       "answers": JSON.stringify(copy.answers)
                    })
    }
} 

async function correctAll(scanResultString){
    const scanResult = JSON.parse(scanResultString)
    

    // const examId = null;
    // const exam = null;
    // const corrections = null;
    // const correctionCriterias = null;
    // const questionStatus = null;
    

    //if(copy.qrcode.lessonId != examId){
        // FIND THE EXAM RELATED TO THE EXAMID
            console.log("hello1")
            const id = scanResult.zipFile.split('.')[0]
            var exam = await Exam.findOne({where:{id:id}})
            const examId = exam.id
            const corrections = JSON.parse(exam.dataValues.corrections)
            const correctionCriterias = JSON.parse(exam.dataValues.correctionCriterias)
            const questionStatus = JSON.parse(exam.dataValues.questionStatus)
            console.log("hello")
        // }
        // else{
        //     //Check check
        //     console.log("Change of exam ID")
        // }
    //Step 2 : CORRECT ALL COPIES
    scanResult.data.forEach(async (copy) =>{
        
        
        
       // if(correctionCriterias.type == 'normal'){    
            console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
            console.log(copy)
            correctionCopy(
                    corrections[copy.qrcode.version],
                    copy.answers,
                    questionStatus[copy.qrcode.version],
                    correctionCriterias
            ).then(async result =>{
                console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC")
                console.log(result)
                //When the correction is done, the copy has to be set in the database
                                
                // TO DO -- mettre les points dans la base de données !

                saveCopy(copy,result,exam.id)
                //email.sendResult(copy,result)
                console.log(result)
            })
            .catch(err=>{
                console.log(err+copy.qrcode.matricule)
            })
        })    
    //     else{
    //         var lastExclusive = null;
    //         if(correctionCriterias.isLastExclusive) lastExclusive = true
    //         else lastExclusive = false
            
    //         correctionAdvanced(
    //             corrections[copy.qrcode.version],
    //             copy.answers,
    //             questionStatus[copy.version],
    //             parseInt(correctionCriterias.allGood,10),
    //             parseInt(correctionCriterias.oneWrong,10),
    //             parseInt(correctionCriterias.twoWrong,10),
    //             parseInt(correctionCriterias.threeWrong,10),
    //             parseInt(correctionCriterias.threeMoreWrong,10),
    //             lastExclusive,
    //             parseInt(correctionCriterias.lastExclusiveTrue,10),
    //             parseInt(correctionCriterias.lastExclusiveFalse,10)
    //         ).then(result =>{
    //             //STEP 3 : PU
    //             // TO DO -- mettre les points dans la base de données !
    //             saveCopy(copy,result,exam.id)
    //             console.log(result)
    //         })
    //         .catch(err=>{
    //             console.log(err)
    //         })
           
    //     }
    // })

    exam.status = 2
    exam.save()
}


copies = [
    {"matricule": 12345, "version": "A", "response": [
        [ true, false, false ],
        [ false, true, false ],
        [ false, false, true ],
        [ false, false, false, true ],
        [ false, false, false, false, true ]
      ]},
    {"matricule": 12335, "version": "B", "response": [
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ]
      ]},
    
    
    {"matricule": 12345, "version": "C", "response": [
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ]
      ]}
]


//Correction file
function correctionCopy(  correction /*list of list*/,
                            response /*list of list*/,
                            questionStatus, /*list */
                            correctionCriterias,
                            ){
    
    console.log('---Correction criterias---')
    console.log(correctionCriterias)
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
                    const positif = parseInt(correctionCriterias.ptsRight,10)
                    const negatif =  parseInt(correctionCriterias.ptsWrong,10)
                    const abstention = parseInt(correctionCriterias.ptsAbs,10)
                    
                    
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
    
    const eachGood = parseInt(correctionCriterias.allGood,10)
    const onefalse = parseInt(correctionCriterias.oneWrong,10)
    const twofalse = parseInt(correctionCriterias.twoWrong,10)
    const threefalse = parseInt(correctionCriterias.threeWrong,10)
    const morethanthree = parseInt(correctionCriterias.threeMoreWrong,10)
    const lastProp = lastExclusive
    const lastPropTrue = parseInt(correctionCriterias.lastExclusiveTrue,10)
    const lastPropFalse = parseInt(correctionCriterias.lastExclusiveFalse,10)

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

function correctionAdvanced(correction,
                            response,
                            questionStatus, /*list */
                            eachGood,
                            onefalse,
                            twofalse,
                            threefalse,
                            morethanthree,
                            lastProp,
                            lastPropTrue,
                            lastPropFalse 
                            ){
    
    return new Promise((resolve,reject)=>{
        totalPoints = 0
        maxPoints = 0
        if (correction.length != response.length){
            reject("Le nombre de questions de la correction et de la copie ne correspondent pas")
        }
        for(var questionIndex=0; questionIndex < correction.length; questionIndex++ ){
            
            if(questionStatus[questionIndex] == 'normal'){
                if(response[questionIndex].length != correction[questionIndex].length){
                    reject("Le nombre de propositions de la correction et de la copie ne correspondent pas")
                }
                correctProp = correctionAdvancedProp(correction[questionIndex],response[questionIndex],eachGood,onefalse,twofalse,threefalse,morethanthree,lastProp,lastPropTrue,lastPropFalse)
                totalPoints += correctProp[0]
                maxPoints += correctProp[1]
            }
        }
        resolve([totalPoints,maxPoints])
    })

}

exports.saveCopy = saveCopy
exports.correctAll = correctAll
exports.correctionCopy = correctionCopy

//------ TEST --------

const correction1 = [
    [ true, false, false],
    [false, false, false],
    [ true, false, false],
    [false,false,true]
]

const response1 = [
    [ false, false, true], //0 --> si activation dernière proposition
    [false, false, true], //0
    [false, false, true], //0 
    [false,false,true] //1
]


const correction2 = [
    [ false, false, true],
    [true, false, false],
    [ true, false, false],
    [false,true,false]
]

const response2 = [
    [ false, false, true], //1  --> si activation dernière question
    [true, true, false], //0.75
    [false, false, true], //0
    [false,false,false] //0.75
] // normalment ==> 2.5


const correction3 = [
    [ false, false, true],
    [true, false, false],
    [ true, false, false],
    [false,true,false]
]

const response3 = [
    [ false, false, true], //1  --> si NON NON activation dernière question
    [true, true, true], //0.5
    [false, true, true], //0.25
    [false,false,false] //0.75
] // normalment ==> 2.5

copies = [
    {"matricule": 12345, "version": "A", "response": [
        [ true, false, false ],
        [ false, true, false ],
        [ false, false, true ],
        [ false, false, false, true ],
        [ false, false, false, false, true ]
      ]},
    {"matricule": 12335, "version": "B", "response": [
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ]
      ]},
    
    
    {"matricule": 12345, "version": "C", "response": [
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ],
        [ false, false, false ]
      ]}
]
//correctAll(JSON.stringify(copiesObject))

//correctionNormal(correction1,response1,1,1,0,false)
//correctionAdvanced(correction1,response1,1,0.75,0.5,0.25,0,true,1,0) //should return 1
//correctionAdvanced(correction2,response2,1,0.75,0.5,0.25,0,true,1,0) //should return 2.5
//correctionAdvanced(correction3,response3,1,0.75,0.5,0.25,0,false,1,0) //should return 2.5