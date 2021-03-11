//Correction file
function correctionNormal(  correction /*list of list*/,
                            response /*list of list*/,
                            positif /*number*/,
                            negatif /*number*/,
                            abstention /*number*/ 
                            ){
    if (correction.length != response.length){
        return null
    }

    totalPoints = 0
    const equals = (a, b) => JSON.stringify(a) == JSON.stringify(b);

    for(var questionIndex = 0; questionIndex < correction.length; questionIndex++ ){

        // NO ABSTENTION:
        if(response[questionIndex].some(elem => elem == true)){            
            if(equals(correction[questionIndex],response[questionIndex])) totalPoints += positif
            else totalPoints -= negatif
        }
        else totalPoints += abstention
        
    }
    return totalPoints
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
    
    // Si contrainte sur la dernière proposition, et que la dernière proposition devait être cochée !
    if( lastProp && correction[correction.length - 1]){
        // Si la réponse a été cochée :
        if(response[response.length - 1]){
            //Vérifier que rien d'autre n'a été cocher
            for(var propIndex = 0; propIndex< response.length -1; propIndex++)
            {
                if(response[propIndex]) return lastPropFalse
            }
            
            return lastPropTrue
        }
        else return lastPropFalse
    }

    else if(lastProp && response[response.length -1]){
        return lastPropFalse
    }

    else{
        nbError = 0
        for(var propIndex = 0; propIndex < response.length; propIndex++){
            if(response[propIndex] != correction[propIndex]){
                nbError++
            }
        }

        if(nbError == 0) return eachGood
        if(nbError == 1) return onefalse
        if(nbError == 2) return twofalse
        if(nbError == 3) return threefalse
        if(nbError >  3) return morethanthree
    }
}

function correctionAdvanced(correction,
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
    totalPoints = 0
    for(var questionIndex=0; questionIndex < correction.length; questionIndex++ ){
        totalPoints += correctionAdvancedProp(correction[questionIndex],response[questionIndex],eachGood,onefalse,twofalse,threefalse,morethanthree,lastProp,lastPropTrue,lastPropFalse)
    }
    console.log(totalPoints)
}

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

exports.correctionNormal = correctionNormal

//correctionNormal(correction1,response1,1,1,0,false)
//correctionAdvanced(correction1,response1,1,0.75,0.5,0.25,0,true,1,0) //should return 1
//correctionAdvanced(correction2,response2,1,0.75,0.5,0.25,0,true,1,0) //should return 2.5
//correctionAdvanced(correction3,response3,1,0.75,0.5,0.25,0,false,1,0) //should return 2.5
