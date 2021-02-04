const ExcelJS = require('exceljs');

async function importStudents(path){
  /**
 * Get students infos : { "matricule" : "name" }
 */

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path);
    const worksheet = workbook.worksheets[0];
    
    var table = {}
    var target = 1000
    var matricule = 0
    var student = 0

    worksheet.eachRow(function(row, rowNumber) {
      var indexMatr = row.values.indexOf("matricule")
      var indexEtu = row.values.indexOf("etudiant")

      if (indexMatr>=0 && indexEtu >=0){
        target = rowNumber
        matricule = indexMatr
        student = indexEtu
        console.log("Target:", target)
      }

      if (target < rowNumber){
        table[`${row.values[matricule]}`] = row.values[student]
      }
    });

    return table
}

table = importStudents("./uploads/exemple_liste.xlsx").then(table => { console.log(table)})