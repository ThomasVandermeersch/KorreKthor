const PDFDocument = require("pdfkit");
const fs = require("fs");
const PDFMerger = require('pdf-merger-js');
var QRCode = require('qrcode')
var zipBuilder = require('adm-zip');
const { resolveCname } = require("dns");

async function createInvoice(students, lesson, answers, fileVersions, extraCopies,examDate) {
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
    student = {"extra": true, "name":"", "matricule":`${lesson.id}_${i}`, "version":lesson.versions[i%lesson.versions.length]}
    extraStudents.push(student)
  }

  students = students.concat(extraStudents)

  var sources = [];
  var max = students.length
  let nbDone = 0

  return new Promise((resolve, reject) => {
    students.forEach(async (student) => {
      let doc = new PDFDocument({size: 'A4'});

      generateTemplate(doc); //Mise des carés et d'un titre
      generateTable(doc, answers[student.version]); //Pour chaque étudiant, mise en place des cases à cocher + Question 1
      generateHeader(doc, student, lesson,examDate)
      
      writeStream = fs.createWriteStream("pre_pdf/" + (student.matricule).toString() + ".pdf")
      doc.pipe(writeStream);

      sources.push("pre_pdf/" + (student.matricule).toString() + ".pdf")
      
      let files;
      if(fileVersions != null){
        files = JSON.parse(fileVersions)
      }

      writeStream.on('finish', async function (info) {
        nbDone++;
        if (nbDone == max) {
          const finalZip = new zipBuilder()
          
          c = new PDFMerger();
          var version = Object.keys(answers);
          version.forEach(letter => {
            c.add("pre_pdf/correction" + letter + ".pdf");
          });
          correctionPath = `./downloads/Correction_${lesson.id}.pdf`;
          await c.save(correctionPath);
          finalZip.addLocalFile(correctionPath)

          if(fileVersions != null){
            buildMergeExam(sources,files,students).then(()=>{
              finalZip.addLocalFolder('./pre_pdf/merged')
              examPath = `./downloads/Exam_${lesson.id}.zip`;
              finalZip.writeZip(examPath);
              ret = {
                correction: correctionPath,
                exam: examPath,
                error: null
              };
              resolve(ret)
            })
          }
          else{
            merge = new PDFMerger();
            sources.forEach(path => {
              merge.add(path);
            })
            await merge.save('./pre_pdf/finalExam.pdf'); //save under given name
            finalZip.addLocalFile('./pre_pdf/finalExam.pdf')
          }


          // examPath = `./downloads/Exam_${lesson.id}.zip`;
          // finalZip.writeZip(examPath);
        }
      })
    })
  })
}


function buildMergeExam(sources,files,students){
  return new Promise(async (resolve,reject)=>{
      // var merge = new PDFMerger();
      // merge.add("./uploads/" + files[students[0].version]);
      // merge.add(sources[0]);
      // await merge.save('./pre_pdf/merged/merged.pdf')
      // console.log("donne ahah")
      // resolve()
    var merge = new PDFMerger();
    sources.forEach(async (path,index,array)=>{

      merge.add("./uploads/" + files[students[index].version]);
      merge.add(path);
      await merge.save(`./pre_pdf/Exam_${path}.zip`)
      if(index == array.length) resolve()
    })
  })
}

async function buildSingleGridExam(zipFile,sources){
  merge = new PDFMerger();
  sources.forEach(path => {
    merge.add(path);
  })
  await merge.save('./pre_pdf/finalExam.pdf'); //save under given name
  zipFile.addLocalFile('./pre_pdf/finalExam.pdf')
  console.log("donneee")
}

function buildCorrection(){

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
  doc.fontSize(20).text("Feuille de réponses", 105, 47, { align: "center" });
  //doc.moveDown();
}

function generateHeader(doc, student, lesson,examDate) {
  /**
   * Fucntion that generate pdf header (QRCoed, name, matricule, version...) for each student sheet
   */

   date = new Date(examDate);
   doc.fontSize(10)
   doc.text(`Nom et prénom: ${student.name}`, 140, 75);
   doc.text(`Matricule: ${student.matricule}`, 140, 90);
   doc.text(`Date: ${("0" + date.getDate()).slice(-2)}/${("0" + (date.getMonth()+1)).slice(-2)}/${date.getFullYear()}`, 140, 105);
   doc.text(`Cours: ${lesson.name}`, 140, 120);
   doc.text(`Version: ${student.version}`, 140, 135);

   // QRCode generator
   studentJson = {"matricule": student.matricule, "version": student.version, "lessonId": lesson.id }
   QRCode.toFile('pre_pdf/' + student.matricule + ".png", JSON.stringify(studentJson), function (err) {
     doc.image('pre_pdf/' + student.matricule + ".png", 55, 70, { scale: 0.40 });
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

  for (question = 0; question < answers.length; question++) {
    if (max < answers[question].length) max = answers[question].length

    doc.text("Question " + (question + 1).toString() + " :", 60, 174 + (question * 20));
    for (answer = 0; answer < answers[question].length; answer++) {
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
    });

    correction.end();
    correction.pipe(fs.createWriteStream("pre_pdf/correction" + letter + ".pdf"));
  });
}

exports.createInvoice = createInvoice