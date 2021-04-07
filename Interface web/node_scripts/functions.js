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
      var version = 0

      worksheet.eachRow(function(row, rowNumber) {
        var indexMatr = row.values.indexOf("matricule")
        var indexEtu = row.values.indexOf("etudiant")
        var indexVersion = row.values.indexOf("version")

        if (indexMatr >= 0 && indexEtu >= 0 && indexVersion >= 0){
          target = rowNumber
          matricule = indexMatr
          student = indexEtu
          version = indexVersion
        }
        else{
          return None
        }

        if (target < rowNumber){
          studentDict = {}
          studentDict["name"] = row.values[student]
          studentDict["version"] = row.values[version]
          studentDict["matricule"] = row.values[matricule]
          table.push(studentDict)
        }
      });

      return table
    }
    catch{
      return None
    }
}

async function getExcelInfo(path){
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

    worksheet.eachRow(function(row, rowNumber) {
      var indexVersion = row.values.indexOf("version")
      if (indexVersion >= 0){
        target = rowNumber
        version = indexVersion
      }

      if (target < rowNumber){
        if (!versions.includes(row.values[version])){
          versions.push(row.values[version])
        }
      }
    })  

    lesson = worksheet.getCell("A1").value

    if(versions.length > 0){
      return [null, null, versions, lesson]
    }
    return ["Il manque un champ 'version' dans le fichier Excel", "Erreur auto-générée", null]
  }
  catch{
    return ["Internal error", "Error in getExcelInfo method"]
  }
}

exports.importStudents = importStudents
exports.getExcelInfo = getExcelInfo

//table = importStudents("./uploads/exemple_liste.xlsx").then(table => { console.log(table)})
//versions = getExcelInfo("./exemple_liste.xlsx").then(versions => { console.log(versions)})