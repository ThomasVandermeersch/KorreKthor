const ExcelJS = require('exceljs');


// Change le correctif pour une version spécifique
function getExcelCorrectionforVersion(correctif, worksheet){

    data = worksheet.getColumn(1).values
    // console.log(data)

// Vérifier que le nombre de question est ok
    // Step 1 : Calculer le nombre de questions
    questionsNumber = 0
    correctif.forEach(question=>{ if(question.type == 'qcm') questionsNumber = questionsNumber + 1})
    
    // Step 2 : Vérifier que le nombre de questions dans l'Excel correspond au nombre de questions dans le système(remarque : les réponses commencent au deuxième élement de la liste)
    if(data.length - 1 != questionsNumber ){
        console.log("Error Excel file must fit exam template")
        return "Le nombre de questions dans (au moins) une des feuilles du fichier Excel ne correspond au nombre de questions de l'examen"
    }

// Ensuite il faut créer les bonnes listes en fonction des lettres données tout en vérifiant si la lettre est dans l'index de réponse
    letters = 'ABCDEFGHIJKLMNOP'

    questionIndex = 0 // démarrer à 1 pour correspondre à l'Excel
    
    for(var i=0; i< correctif.length; i++){
        if(correctif[i].type == 'qcm'){
            questionIndex += 1 // on fait +1 avant car la liste du contenu des cases excel commence au deuxième élement
            
            lettre = data[questionIndex]
            if(lettre.length !=1) return("Les cases du fichier Excel ne peuvent contenir qu'une seule lettre (en MAJUSCULE)") // vérifier qu'il y a bien une seule lettre d'entrée
            
            letterIndex = letters.indexOf(data[questionIndex])
            propositionlength = correctif[i].response.length
            console.log(letterIndex)
            if(letterIndex >= propositionlength || letterIndex < 0){
                console.log("Au moins une des lettres n'est pas valide ou ne fait pas partie du nombre de propositions valides")
                return("Au moins une des lettres n'est pas valide ou ne fait pas partie du nombre de propositions valides")
            }
            // Recréation d'une liste avec les réponses
            propList = []
            for(j=0;j<propositionlength;j++){
                if(j == letterIndex) propList.push(true)
                else propList.push(false)
            }
            correctif[i].response = propList
        }       
    }

    return correctif
}


async function updateCorrectionByExcel(excelPath,corrections){
    return new Promise(async(resolve, reject)=>{
        try {
            corrections = JSON.parse(corrections)
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(excelPath);
            
            for (var [key, value] of Object.entries(corrections)) {
                console.log(key)
                const worksheet = workbook.getWorksheet(key);
                if(!worksheet) reject("All versions are not in Excel file")
                modifiedValue = getExcelCorrectionforVersion(value, worksheet)
                console.log(modifiedValue)
                if(typeof modifiedValue === 'string') reject(modifiedValue)
                corrections[key] = modifiedValue
            }
            resolve(corrections)
        }

        catch(e){
            console.log(e);
            reject("Unexpected error")
        }
    })
}

exports.updateCorrectionByExcel = updateCorrectionByExcel

/*

examDimensions = {
    'A' : [
        {type:'version','list': [true,true,false,false]},
        {type:'qcm','list':[true,false,true,true]},
        {type:'qcm','list': [true,true,false,false]},
        {type:'qcm','list': [true,true,false,false]}
    ],
    'B' : [
        {type:'version','list': [true,true,false,false]},
        {type:'qcm','list':[true,false,true,true]},
        {type:'qcm','list': [true,true,false,false]},
        {type:'qcm','list': [true,true,false,false]}
    ]
}

excelPath = './test.xlsx'
updateCorrectionByExcel(excelPath,JSON.stringify(examDimensions))

//getExcelCorrectionforVersion(excelPath, examDimensions)

*/





/*      --- INSTRUCTIONS ---
Il est désormais possible d'importer les réponses aux QCM grâce à un fichier Excel.

1. Créer un fichier .xlsx (nom de fichier au choix)

2. Créer une feuille/classeur par version. Cette feuille/classeur doit être nommée avec la lettre de la version en MAJUSCULE. 
(Un examen à deux versions doit donc avoir deux feuilles nommées <A> et <B>)

3. Indication des réponses : 
    3.1 -- Les réponses de chaque versions se trouveront dans la 1ère collone. La réponse à la première question se trouvera dans la case A1, 
la réponse à la deuxième question dans la case A2, ...
    3.2 -- La case doit contenir la lettre de la réponse en MAJUSCULE.
    3.3 -- La lettre ne peux dépasser le nombre de propositions. Par exemple, si la question comprends trois propositions,
            les seules valeurs que peuvent prendre la case sont <A<, <B>, <C>

4. Une fois le fichier créé, importer sur la plate-forme.

*/