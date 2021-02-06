const ExcelJS = require('exceljs');

async function importStudents(path){
  /**
   * Get students infos : { $matricule : {"name": $name, "version": $version} }
   */

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

      if (indexMatr>=0 && indexEtu >=0 && indexVersion >= 0){
        target = rowNumber
        matricule = indexMatr
        student = indexEtu
        version = indexVersion
        // console.log("Target:", target)
        // console.log(version)
      }

      if (target < rowNumber){
        studentDict = {}
        studentDict["name"] = row.values[student]
        studentDict["version"] = row.values[version]
        studentDict["matricule"] = row.values[matricule]
        table.push(studentDict)
        //table[`${row.values[matricule]}`] = studentDict
      }
    });

    return table
}

async function getVersions(path){
  /**
   * Function that returns the number of version in a list
   */

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
    });

    return versions
}

function sayHello(){ //test
  console.log("Hello World")
}


exports.importStudents = importStudents
exports.getVersions = getVersions
// exports.sayHello = sayHello

//table = importStudents("./uploads/exemple_liste.xlsx").then(table => { console.log(table)})
//versions = getVersions("./exemple_liste.xlsx").then(versions => { console.log(versions)})