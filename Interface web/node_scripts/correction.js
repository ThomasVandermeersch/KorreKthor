const { reject } = require("async");
const { resolve } = require("path");
const { User, Exam, Copy } = require("./database/models");


async function correctAll(scanResultString){
    const scanResult = JSON.parse(scanResultString)
    
    //Step 1 : FIND THE EXAM RELATED TO THE EXAMID
    const exam = await Exam.findOne({where:{id:scanResult.examID}})
    const corrections = JSON.parse(exam.dataValues.corrections)
    const correctionCriterias = JSON.parse(exam.dataValues.correctionCriterias)
    const questionStatus = {
        "A": ['normal','normal','cancelled','cancelled','normal'],
        "B": ['normal','normal','normal','normal','normal'],
        "C": ['normal','normal','normal','normal','normal'], 
    }

    //Step 2 : CORRECT ALL COPIES
    if(correctionCriterias.type == 'normal'){
        scanResult.copies.forEach(copy =>{
            correctionNormal(
                corrections[copy.version],
                copy.response,
                questionStatus[copy.version],
                parseInt(correctionCriterias.ptsRight,10),
                parseInt(correctionCriterias.ptsWrong,10),
                parseInt(correctionCriterias.ptsAbs,10)
            ).then(result =>{
                //STEP 3 : PU
                // TO DO -- mettre les points dans la base de données !
                console.log(result)
            })
            .catch(err=>{
                console.log(err)
            })
        })
    }

    else{
        var lastExclusive = null;
        if(correctionCriterias.isLastExclusive) lastExclusive = true
        else lastExclusive = false

        scanResult.copies.forEach(copy =>{
            correctionAdvanced(
                corrections[copy.version],
                copy.response,
                questionStatus[copy.version],
                parseInt(correctionCriterias.allGood,10),
                parseInt(correctionCriterias.oneWrong,10),
                parseInt(correctionCriterias.twoWrong,10),
                parseInt(correctionCriterias.threeWrong,10),
                parseInt(correctionCriterias.threeMoreWrong,10),
                lastExclusive,
                parseInt(correctionCriterias.lastExclusiveTrue,10),
                parseInt(correctionCriterias.lastExclusiveFalse,10)
            ).then(result =>{
                //STEP 3 : PU
                // TO DO -- mettre les points dans la base de données !
                console.log(result)
            })
            .catch(err=>{
                console.log(err)
            })
        })
    }

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
//correctAll(JSON.stringify({examID:"e4fca29a-866c-4d9a-ab59-c8635257263f","copies":copies}))


//Correction file
function correctionNormal(  correction /*list of list*/,
                            response /*list of list*/,
                            questionStatus, /*list */
                            positif /*number*/,
                            negatif /*number*/,
                            abstention /*number*/ 
                            ){
    
    return new Promise((resolve, reject) => {
                                  
        if (correction.length != response.length){
            reject("Le nombre de questions de la correction et de la copie ne correspondent pas")
        }

        totalPoints = 0
        maxPoints = 0
        const equals = (a, b) => JSON.stringify(a) == JSON.stringify(b);
        console.log(questionStatus)
        for(var questionIndex = 0; questionIndex < correction.length; questionIndex++ ){
            console.log(questionStatus[questionIndex])
            if(questionStatus[questionIndex] == 'normal'){
                //Vérifier que le nombre de propositions de la correction correspond au nombre
                //de proposition de la copie
                if(response[questionIndex].length != correction[questionIndex].length){
                    reject("Le nombre de propositions de la correction et de la copie ne correspondent pas")
                }
                maxPoints += positif
                // NO ABSTENTION:
                if(response[questionIndex].some(elem => elem == true)){            
                    if(equals(correction[questionIndex],response[questionIndex])) totalPoints += positif
                    else totalPoints -= negatif
                }
                else totalPoints += abstention
            }
        }
        resolve([totalPoints,maxPoints])
    });
}


function correctionAdvancedProp(correction,
                                response,
                                eachGood,
                                onefalse,
                                twofalse,
                                threefalse,
                                morethanthree,
                                lastProp,
                                lastPropTrue,
                                lastPropFalse 
                                ){
    
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

exports.correctAll = correctAll

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
//correctAll(JSON.stringify({examID:"6db05eb7-e5da-495c-ba5f-a834d3f2c5b3","copies":copies}))

//correctionNormal(correction1,response1,1,1,0,false)
//correctionAdvanced(correction1,response1,1,0.75,0.5,0.25,0,true,1,0) //should return 1
//correctionAdvanced(correction2,response2,1,0.75,0.5,0.25,0,true,1,0) //should return 2.5
//correctionAdvanced(correction3,response3,1,0.75,0.5,0.25,0,false,1,0) //should return 2.5