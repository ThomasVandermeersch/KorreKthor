const PDFDocument = require("pdfkit");
const fs = require("fs");
const PDFMerger = require('pdf-merger-js');
var QRCode = require('qrcode')
const { User } = require("../node_scripts/database/models");


async function createInvoice(students, lesson, answers, fileVersions, extraCopies) {
  /**
   * Function that create a printable pdf for teachers
   * This function needs a student list, the course name, the answers array and a file list of the different question versions like {"A":"File1.pdf" ... }
   * The output file is located in ./downloads 
   * Temps files are located in ./pre_pdf, ./result_pdf
   */

  setUp()

  generateCorection(answers);

  extraStudents = []
  for (var i=0; i<extraCopies; i++){
    User.create({"fullName":"", "matricule": `${lesson.id}_${i}`, "email": "", "authorizations":3, "role":0})
    student = {"extra": true, "name":"", "matricule":`${lesson.id}_${i}`, "version":lesson.versions[i%lesson.versions.length]}
    extraStudents.push(student)
  }

  students = students.concat(extraStudents)

  var sources = [];
  var max = students.length
  let nbDone = 0

  return new Promise((resolve, reject) => {
    students.forEach(async (student) => {
      let doc = new PDFDocument();
      let writeStream = fs.createWriteStream("pre_pdf/" + (student.matricule).toString() + ".pdf")

      generateTemplate(doc); //Mise des carés et d'un titre
      generateTable(doc, answers[student.version]); //Pour chaque étudiant, mise en place des cases à cocher + Question 1
      generateHeader(doc, student, lesson, writeStream)
    
      sources.push("pre_pdf/" + (student.matricule).toString() + ".pdf")
      const files = JSON.parse(fileVersions)

      writeStream.on('finish', async function () {
        nbDone++;
        if (nbDone == max) {
          m = new PDFMerger();
          c = new PDFMerger();
          var version = Object.keys(answers);

          version.forEach(letter => {
            c.add("pre_pdf/correction" + letter + ".pdf");
          });

          correctionPath = `./downloads/Correction_${lesson.id}.pdf`;
          await c.save(correctionPath);

          
          sources.forEach(path => {
            try{
              index = sources.indexOf(path);
              m.add("uploads/" + files[students[index].version]);
              m.add(path);
            }
            catch (err){
              console.log(err)
              reject({error:`File ${files[students[index].version]} is not correct`})
            }
          });

          examPath = `./downloads/Exam_${lesson.id}.pdf`;
          await m.save(examPath); //save under given name

          removeUnnecessary();

          ret = {
            correction: correctionPath,
            exam: examPath,
            error: null
          };

          console.log("Generation completed !");
          resolve(ret)
        }
      })
    })
  })
}

function setUp(){
  /**
   * This function creates the files environement
   */

  var pre_pdf = "pre_pdf/"
  if (!fs.existsSync(pre_pdf)) {
    fs.mkdirSync(pre_pdf)
  }

  var downloads = "downloads/"
  if (!fs.existsSync(downloads)) {
    fs.mkdirSync(downloads)
  }
}

function removeUnnecessary() {
  /**
   * This function removes the files after generations
   */
  fs.rmdir("pre_pdf/", { recursive: true }, (err) => {
    if (err) {
      throw err;
    }

    console.log('pre_pdf/ is deleted');
  });
}

function generateTemplate(doc) {
  /**
   * Fucntion that generate pdf template (top-left, top-right, bottom-left squares) for each student sheet
   */

  doc.image("result_pdf/squares.PNG", 520, 20, { valign: "top" });
  doc.image("result_pdf/squares.PNG", 20, 20, { valign: "top" });
  doc.image("result_pdf/squares.PNG", 20, 700, { valign: "top" });
  doc.fontSize(20);
  doc.text("Feuilles de réponses", 110, 57, { align: "center" });
  doc.moveDown();
}

function generateHeader(doc, student, lesson, writeStream) {
  /**
   * Fucntion that generate pdf header (QRCoed, name, matricule, version...) for each student sheet
   */

   date = new Date();
   doc.fontSize(10)
   doc.text(`Nom et prénom: ${student.name}`, 140, 120);
   doc.text(`Matricule: ${student.matricule}`, 140, 135);
   doc.text(`Date: ${("0" + date.getDate()).slice(-2)}/${("0" + (date.getMonth()+1)).slice(-2)}/${date.getFullYear()}`, 140, 150);
   doc.text(`Cours: ${lesson.name}`, 140, 165);
   doc.text(`Version: ${student.version}`, 140, 180);

   // QRCode generator
   studentJson = {"matricule": student.matricule, "version": student.version, "lessonId": lesson.id }
   QRCode.toFile('pre_pdf/' + student.matricule + ".png", JSON.stringify(studentJson), function (err) {
     doc.image('pre_pdf/' + student.matricule + ".png", 50, 115, { scale: 0.40 });
     doc.pipe(writeStream);
     doc.end();
   })
}

function generateTable(doc, answers) {
  /**
   * Function that generate table for the answers 
   */

  for (question = 0; question < answers.length; question++) {
    doc.fontSize(10);
    doc.text("Question " + (question + 1).toString() + " :", 125, 252 + (question * 25));
    for (answer = 0; answer < answers[question].length; answer++) {
      doc.image("result_pdf/vide.PNG", 200 + (answer * 35), 245 + (question * 25));
    }
  }
}

function generateCorection(answers) {
  /**
   * Function that generate the correction sheet for teachers and for software corrections 
   */

  var version = Object.keys(answers);
  version.forEach((letter) => {
    let correction = new PDFDocument();

    correction.fontSize(14);
    correction.text("Correctif version : " + letter, 110, 57, { align: "center" });
    Qindex = 0;
    answers[letter].forEach((questions) => {
      Aindex = 0;
      correction.text("Question " + (answers[letter].indexOf(questions) + 1).toString(), 125, 252 + Qindex * 25);
      questions.forEach((answer) => {
        if (answer == true) {
          correction.image("result_pdf/rempli.PNG", 250 + (Aindex * 35), 245 + (Qindex * 25))
        }
        else {
          correction.image("result_pdf/vide.PNG", 250 + (Aindex * 35), 245 + (Qindex * 25))
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