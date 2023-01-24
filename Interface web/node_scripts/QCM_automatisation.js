const PDFDocument = require("pdfkit");
const fs = require("fs");
const PDFMerger = require('pdf-merger-js');
var QRCode = require('qrcode')
const copy = require('./database_calls/copy')


async function createInvoice(students, lesson, answers, fileVersions, extraCopies,examDate,noVersion, req) {
  /**
   * Function that create a printable pdf for teachers
   * This function needs a student list, the course name, the answers array and a file list of the different question versions like {"A":"File1.pdf" ... }
   * The output file is located in ./downloads 
   * Temps files are located in ./pre_pdf, ./source_pdf
   */

  setUp()

  generateCorection(answers);

  extraStudents = []
  for (var i=0; i<extraCopies; i++){
    // User.create({"fullName":"", "matricule": `${lesson.id}_${i}`, "email": "", "authorizations":3, "role":2})
    student = {"extra": true, "name":"", "matricule": 99500 + i, "version":lesson.versions[i%lesson.versions.length]}
    extraStudents.push(student)
  }

  students = students.concat(extraStudents)

  var sources = [];
  var max = students.length
  let nbDone = 0

  return new Promise((resolve, reject) => {
    students.forEach(async (student) => {

      


      let doc = new PDFDocument({size: 'A4'});
      let writeStream = fs.createWriteStream("pre_pdf/" + (student.matricule).toString() + ".pdf")

      generateTemplate(doc); //Mise des carés et d'un titre
      
      if(!noVersion){
        copy.createCopy(student.matricule,student.version,"X",lesson.id,req)
        generateTable(doc, answers[student.version]); //Pour chaque étudiant, mise en place des cases à cocher + Question 1
        generateHeader(doc, student, lesson, writeStream,examDate,true)
      }
      else{
        copy.createCopy(student.matricule,"X",lesson.id,req)
        generateTable(doc, answers['A']); //Pour chaque étudiant, mise en place des cases à cocher + Question 1
        generateHeader(doc, student, lesson, writeStream,examDate)
      }
      
    
      sources.push("pre_pdf/" + (student.matricule).toString() + ".pdf")
      
      let files;
      if(fileVersions != null){
        files = JSON.parse(fileVersions)
      }

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
              if(fileVersions != null){
                m.add("uploads/" + files[students[index].version]);
              }
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
  });
}

function generateTemplate(doc) {
  /**
   * Fucntion that generate pdf template (top-left, top-right, bottom-left squares) for each student sheet
   */
  doc.image("source_pdf/squares.PNG", 530, 10, { valign: "top" });
  doc.image("source_pdf/squares.PNG", 530, 765, { valign: "top" });
  doc.image("source_pdf/squares.PNG", 10, 765, { valign: "top" });
  doc.fontSize(20);
  doc.text("Feuille de réponses", 105, 47, { align: "center" });
  doc.moveDown();
}

function generateHeader(doc, student, lesson, writeStream,examDate,versionHeader=false) {
  /**
   * Fucntion that generate pdf header (QRCoed, name, matricule, version...) for each student sheet
   */

   date = new Date(examDate);
   doc.fontSize(10)
   doc.text(`Nom et prénom: ${student.name}`, 140, 75);
   if(student.matricule >= 99000) doc.text(`Matricule:`, 140, 90);
   else doc.text(`Matricule: ${student.matricule}`, 140, 90);
   doc.text(`Date: ${("0" + date.getDate()).slice(-2)}/${("0" + (date.getMonth()+1)).slice(-2)}/${date.getFullYear()}`, 140, 105);
   doc.text(`Cours: ${lesson.name}`, 140, 120);
   if(versionHeader) doc.text(`Version: ${student.version}`, 140, 135);

   // QRCode generator
   if(versionHeader) studentString = `${student.matricule};${student.version};${lesson.id}`
   else studentString = `${student.matricule};X;${lesson.id}`
   QRCode.toFile('pre_pdf/' + student.matricule + ".png", studentString, function (err) {
     doc.image('pre_pdf/' + student.matricule + ".png", 55, 70, { scale: 0.51 });
     doc.pipe(writeStream);
     doc.end();
   })
}

function generateTable(doc, answers) {
  /**
   * Function that generate table for the answers 
   */

  const alph = "ABCDEFGHIJKLMNOP" 
  var max = 0
  doc.fontSize(10);


  var questionIndex = 1
  for (question = 0; question < answers.length; question++) {
    var nbProp;
    if(answers[question].type == 'qcm'){
      nbProp = answers[question].response.length
      doc.text("Question " + (questionIndex).toString() + " :", 60, 174 + (question * 20));
      questionIndex++;
    } 
    else if(answers[question].type == 'version'){
      nbProp =  answers[question].nbVersion
      doc.text("Version :", 60, 174 + (question * 20));
    } 
    if (max < nbProp) max = nbProp


    for (answer = 0; answer < nbProp; answer++) {
      doc.image("source_pdf/vide.PNG", 135 + (answer * 35), 170 + (question * 20), {scale: 0.15});
    }
  }

  doc.fontSize(13);
  for (letter = 0; letter < max; letter++) {
    doc.text(alph[letter], 138 + (letter * 35), 155);
  }
}

function generateCorection(answers) {
  /**
   * Function that generate the correction sheet for teachers and for software corrections 
   */

  var version = Object.keys(answers);
  version.forEach((letter) => {
    let correction = new PDFDocument();

    correction.fontSize(10);
    correction.text("Correctif version " + letter, 110, 57, { align: "center" });
    Qindex = 0;
    answers[letter].forEach((questions) => {
      if(questions.type == 'qcm'){
        questions = questions.response
        Aindex = 0;
        correction.text("Question " + (answers[letter].indexOf(questions) + 1).toString() + " :", 50, 105 + Qindex * 20);
        questions.forEach((answer) => {
          if (answer == true) {
            correction.image("source_pdf/rempli.PNG", 130 + (Aindex * 35), 100 + (Qindex * 20), {scale: 0.15})
          }
          else {
            correction.image("source_pdf/vide.PNG", 130 + (Aindex * 35), 100 + (Qindex * 20), {scale: 0.15})
          }
          Aindex++;
        });

        Qindex++;
      }
    });

    correction.end();
    correction.pipe(fs.createWriteStream("pre_pdf/correction" + letter + ".pdf"));
  });
}

exports.createInvoice = createInvoice