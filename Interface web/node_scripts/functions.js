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

async function exportStudents(exam, data){
  /**
   * Function that fills the initial excel file with the student results
   * Return true if something went wrong
   */

  return new Promise(async(resolve, reject)=>{
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(exam.excelFile);
      const worksheet = workbook.worksheets[0];

      var target = 100000
      var matriculeInd = 0
      var coteInd = 0
      var versionInd = 0

      var errors = []
      var maxRows = 0

      worksheet.eachRow(function(row, rowNumber) {
        var indexMatr = row.values.indexOf("matricule")
        var indexCote = row.values.indexOf("cote")
        var indexName = row.values.indexOf("etudiant")
        var indexVersion = row.values.indexOf("version")
        maxRows += 1

        if (indexMatr > 0 && indexCote > 0){
          target = rowNumber
          matriculeInd = indexMatr
          coteInd = indexCote
          nameInd = indexName
          versionInd = indexVersion
        }

        if (target < rowNumber){
          matricule = row.values[matriculeInd]

          if (matricule in data){
            // row.getCell(coteInd).value = Math.round(((data[matricule].result[0]/data[matricule].result[1])*20)*100)/100
            row.getCell(coteInd).value = data[matricule].result[0]
            delete data[matricule]
          }
        }
      })

      var i = 0
      for ([matricule, error] of Object.entries(data)){
        if (error.user.role != 2){
          i += 1
          worksheet.getRow(maxRows+i).getCell(matriculeInd).value = parseInt(error.user.matricule)
          worksheet.getRow(maxRows+i).getCell(coteInd).value = Math.round(((error.result[0]/error.result[1])*20)*100)/100
          worksheet.getRow(maxRows+i).getCell(nameInd).value = error.user.fullName
          worksheet.getRow(maxRows+i).getCell(versionInd).value = error.version
        }
      }

      if (errors.length > 0){
        throw "One or more copy.user.matricule don't match the matricules in excel";
      }

      await workbook.xlsx.writeFile(exam.excelFile)
      resolve()
    }
    catch(e){
      console.log(e);
      reject(e)
    }
  })
}

exports.importStudents = importStudents
exports.getExcelInfo = getExcelInfo
exports.exportStudents = exportStudents