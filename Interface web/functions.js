const ExcelJS = require('exceljs');

async function importStudents(path){
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path);
    const worksheet = workbook.worksheets[0];
    
    worksheet.eachRow(function(row, rowNumber) {
        console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
      });
}

importStudents("./exemple_liste.xlsx")