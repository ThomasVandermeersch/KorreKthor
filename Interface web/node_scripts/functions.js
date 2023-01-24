const ExcelJS = require('exceljs');

async function importStudents(path){
  /**
   * Function that get students infos from an formated excel 
   * Return structure : [{"name": $name, "version": $version, "matricule" : $matricule}, ... ]
   */
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path);
      const worksheet = workbook.worksheets[0];
      
      var table = []
      var target = 1000
      var matricule = 0
      var student = 0
      var version = -1

      worksheet.eachRow(function(row, rowNumber) {
        var indexMatr = row.values.indexOf("matricule")
        var indexEtu = row.values.indexOf("etudiant")
        var indexVersion = row.values.indexOf("version")

        if (indexMatr >= 0 && indexEtu >= 0){
          target = rowNumber
          matricule = indexMatr
          student = indexEtu
          if(indexVersion >= 0){
            version = indexVersion
          }
        }

        if (target < rowNumber){
          studentDict = {}
          studentDict["name"] = row.values[student]
          if(version >= 0) studentDict["version"] = row.values[version]
          studentDict["matricule"] = row.values[matricule]
          table.push(studentDict)
        }
      });

      if (table.length < 0) return null
      return table
    }
    catch (err) {
      console.log(err)
      return null
    }
}

async function getExcelInfo(path){
  return new Promise(async(resolve,reject)=>{  
    /**
     * Function that returns the number of version in a list
     * Return structure : ["A", "B", ... ]
     */
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path);
      const worksheet = workbook.worksheets[0];

      var target = 10000
      var versions = []
      var version = 0

      if(worksheet.getRow(2).values.includes('cote') && worksheet.getRow(2).values.includes('etudiant')){
          worksheet.eachRow(function(row, rowNumber) {
            var indexVersion = row.values.indexOf("version")
            if (indexVersion >= 0){
              target = rowNumber
              version = indexVersion
            }

            if (target < rowNumber){
              if (!versions.includes(row.values[version]) && row.values[version] !== undefined){
                versions.push(row.values[version])
              }
            }
          })
        }

        else{
          reject("Le fichier ne contient pas de colonne 'etudiant' et/ou 'cote' à la ligne 2")
        }

      lesson = worksheet.getCell("A1").value

      if (version == 0 || versions.length==0) resolve({versions:false, lesson:lesson})
      else resolve({versions:versions, lesson:lesson}) 
    }

    catch{
      reject("Internal error")
    }
  })
}

async function exportStudents(exam){
  /**
   * Function that fills the initial excel file with the student results
   */

  return new Promise(async(resolve, reject)=>{
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(exam.excelFile);
      const worksheet = workbook.worksheets[0];

      // First Step : find col indexes and number of rows
      coteColIndex = worksheet.getRow(2).values.indexOf('cote')
      matriculeColIndex = worksheet.getRow(2).values.indexOf('matricule')
      etudiantColIndex = worksheet.getRow(2).values.indexOf('etudiant')
      
      nbRows = worksheet.getColumn(matriculeColIndex).values.length
      console.log(nbRows)

      exam.copies.forEach(copy => {
        if(copy.status == 'not_submitted') return
        // Check if copy has a user
        if(copy.user.fullName != ""){
          // Find row of copyMatricule
          excelCopyRowIndex = worksheet.getColumn(matriculeColIndex).values.indexOf(parseInt(copy.user.matricule))
          
          // The copy matricule is already in the Excel file
          if(excelCopyRowIndex > 0){
            worksheet.getRow(excelCopyRowIndex).getCell(coteColIndex).value = copy.result[0]
          }

          // THe copy matricule is not yet in the Excel file
          else{
            nbRows = nbRows + 1
            worksheet.getRow(nbRows).getCell(coteColIndex).value = copy.result[0]
            worksheet.getRow(nbRows).getCell(matriculeColIndex).value = parseInt(copy.user.matricule)
            worksheet.getRow(nbRows).getCell(etudiantColIndex).value = copy.user.fullName
          }
        }
      });


      produceStatistics(exam, workbook)

      await workbook.xlsx.writeFile(exam.excelFile)
      resolve()
    }
    catch(e){
      console.log(e);
      reject(e)
    }
  })
}

function produceStatistics(exam, workbook){
  
  // Step 1 : Create the working object
  statistics = {}
  for (const [key, value] of Object.entries(JSON.parse(exam.corrections))) {
    resultList = []
    
    // maxProps, nbQuestions and noVersion information are extract to know the size of the statistics table
    maxProps = 0
    nbQuestions = value.length
    statistics[key] = {'noVersion':false}

    
    
    value.forEach((prop,index) =>{
      if(prop.type == 'version'){
        statistics[key].noVersion = true
        if(prop.nbVersion > maxProps) maxProps = prop.nbVersion
        propsArray = new Array(prop.nbVersion).fill(0)
        propsArray.unshift('Version')
        resultList.push(propsArray)
      } 
      if(prop.type == 'qcm'){
        if(prop.response.length > maxProps) maxProps = prop.response.length
        propsArray = new Array(prop.response.length).fill(0)
        propsArray.unshift('Q'+index)
        resultList.push(propsArray)
      } 
    })

    
    statistics[key].result = resultList
    statistics[key].nbQuestions = nbQuestions
    statistics[key].nbMaxProps = maxProps
  }


  // Step 2 : Browse all copies and count responses.


  exam.copies.forEach(copy =>{
    if(copy.status == 'not_submitted') return
    response = JSON.parse(copy.answers)
    if(copy.version != 'X'){
      // browse through questions
      for(i=0;i < response.length;i++){
        // browse through propositions
        questionProps = response[i].list        
        for(j=0;j < questionProps.length;j++){
          if(questionProps[j] == 1){
            statistics[copy.version]['result'][i][j+1] = statistics[copy.version]['result'][i][j+1] + 1
          }
        }
      }
    }
  })

  // Step 3 : Export statistics into Excel file
  for (const [key, value] of Object.entries(statistics)){
    sheetName = 'Statistiques_v' + key
    if(workbook.getWorksheet(sheetName)) workbook.removeWorksheet(workbook.getWorksheet(sheetName).id)    
    sheet = workbook.addWorksheet(sheetName, {properties:{tabColor:{argb:'FFC0000'}}});

    //Header creation
    sheet.getCell('A1').value = 'Statistiques -- Version ' + key;
    sheet.getCell('A2').value = "Nombre d'étudiants ayant noirci la case"
    alphabet = 'ABCDEFGHIJ'

    header = [{name: 'Question n°'}]
    for (let i = 0; i < value.nbMaxProps; i++) {
        header.push({name:alphabet[i]})
    }

    // add a table to a sheet
    sheet.addTable({
        name: 'Table' + key,
        displayName	: 'Table' + key,
        ref: 'B4',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleDark1',
            showRowStripes: true,
        },
        columns: header,
        rows: value.result
    });


    // Step 4 : Color correct responses in green
    correction = JSON.parse(exam.corrections)[key]
    correction.forEach((question,indexQuestion) =>{
      if(question.type == 'qcm'){
        question.response.forEach((proposition, propIndex) =>{
          if(proposition) sheet.getRow(indexQuestion + 5).getCell(propIndex + 3).font = {color: {argb: "0000ff00"}}
        })
      }
    })

    exam.corrections[key]
  }
}

exports.importStudents = importStudents
exports.getExcelInfo = getExcelInfo
exports.exportStudents = exportStudents


