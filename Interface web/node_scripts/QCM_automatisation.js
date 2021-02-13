const PDFDocument = require("pdfkit");
const fs = require("fs");
const PDFMerger = require('pdf-merger-js');
const Async = require('async')
var QRCode = require('qrcode')


async function createInvoice(students, cours, answers, fileVersions){
  /**
   * Function that create a printable pdf for teachers
   * This function needs a student list, the course name, the answers array and a file list of the different question versions like {"A":"File1.pdf" ... }
   * The output file is located in ./downloads 
   * Temps files are located in ./pre_pdf, ./result_pdf
   */

  var pre_pdf = "pre_pdf/"
  if (!fs.existsSync(pre_pdf)){
    fs.mkdirSync(pre_pdf)
  }

  generateCorection(answers);
  var sources = [];
  var max = students.length
  let nbDone = 0
  Async.forEach(students, async (student)=>{
    let doc = new PDFDocument();
    let writeStream = fs.createWriteStream(pre_pdf + (student.matricule).toString() + ".pdf")

    generateHeader(doc); //Mise des carés et d'un titre
    generateTable(doc, answers[student.version]); //Pour chaque étudiant, mise en place des cases à cocher + Question 1
    date = new Date();
    doc.fontSize(10)
    doc.text(`Nom et prénom: ${student.name}`, 140, 120);
    doc.text(`Matricule: ${student.matricule}`, 140, 135);
    doc.text(`Date: ${date.getDay()}/${date.getMonth()+1}/${date.getFullYear()}`, 140, 150);
    doc.text(`Cours: ${cours}`, 140, 165);
    doc.text(`Version: ${student.version}`, 140, 180);
    
    sources.push("pre_pdf/" + (student.matricule).toString() + ".pdf")
    const files = JSON.parse(fileVersions)
    
    writeStream.on('finish',async function(){
      nbDone++;
      if(nbDone == max){
        m = new PDFMerger()
        var version = Object.keys(answers);
       
        version.forEach(letter=>{
          m.add("pre_pdf/correction" + letter + ".pdf")
        })


        sources.forEach(path=>{

          index = sources.indexOf(path)
          m.add("uploads/" + files[students[index].version])
          m.add(path)
        })

        await m.save('./downloads/ResultatFinal.pdf'); //save under given name
        console.log("Generation completed !")

    }})

    // QRCode generator
    QRCode.toFile('pre_pdf/fff'+student.matricule + ".png",
      'Nom : ' + student.name + "\nMatricule : " + student.matricule + "\nCours : " + 
                 cours + "\nVersion : " + student.version, function (err) {

        doc.image('pre_pdf/fff'+student.matricule + ".png", 50, 115, {scale:0.45});
        doc.pipe(writeStream);
        doc.end();      
    })
  })  
}

function generateHeader(doc) {
  /**
   * Fucntion that generate pdf header (top-left, top-right, bottom-left squares) for each student sheet
   */

  doc.image("result_pdf/squares.PNG", 520, 20, {valign : "top"});
  doc.image("result_pdf/squares.PNG", 20, 20, {valign : "top"});
  doc.image("result_pdf/squares.PNG", 20, 700, {valign : "top"});
  doc.fontSize(20);
  doc.text("Feuilles de réponses", 110, 57, { align: "center" });
  doc.moveDown();
}

function generateTable(doc, answers) {
  /**
   * Function that generate table for the answers 
   */

  for (question = 0; question < answers.length; question ++){
    doc.text("Question" + (question + 1).toString(),  125, 222 + (question*55));
    for (answer = 0; answer < answers[question].length; answer++){
        doc.image("result_pdf/vide.PNG", 250 + (answer*55), 200 + (question*55) );
    }
  }
}

function generateCorection(answers){
  /**
   * Function that generate the correction sheet for teachers and for software corrections 
   */
  
  var version = Object.keys(answers);
  version.forEach((letter) => {
    let correction = new PDFDocument();

    correction.fontSize(20);
    correction.text("Correctif version : " + letter, 110, 57, { align: "center" });
    Qindex = 0;
    answers[letter].forEach((questions) => {
      Aindex = 0;
      correction.text("Question " + (answers[letter].indexOf(questions)+1).toString(),  125, 222 + Qindex*55);
      questions.forEach((answer) => {
        if (answer==true){
          correction.image("result_pdf/rempli.PNG", 250 + (Aindex*55), 200 + (Qindex*55) )
        }
        else{
          correction.image("result_pdf/vide.PNG", 250 + (Aindex*55), 200 + (Qindex*55) )
        }
        Aindex++;
      });

      Qindex++;
    });
    
    correction.end();
    correction.pipe(fs.createWriteStream("pre_pdf/correction" + letter + ".pdf"));
  });
}

// async function call(){
//   const answers = JSON.parse('{"A": [[true, false, false], [false, false, true, false], [false, false, true, true]], "B": [[true, false,true, false], [false, true, false], [false, false, true]]}');
//   const students = await functions.importStudents("./uploads/exemple_liste.xlsx")

//   createInvoice(students, 'Math', answers);
// }

exports.createInvoice = createInvoice