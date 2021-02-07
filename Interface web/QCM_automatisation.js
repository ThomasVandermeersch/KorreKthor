const PDFDocument = require("pdfkit");
const fs = require("fs");
const request = require('request');
const merge = require('easy-pdf-merge');
const { versions } = require("process");
const { version } = require("os");
const { create } = require("domain");
const PDFMerger = require('pdf-merger-js');
const Async = require('async')
const functions = require("./functions")
var QRCode = require('qrcode')
const mergess = require('easy-pdf-merge');
const PDFMerge = require('pdf-merge');
let PDFMerges = require('pdfmerge')
const delay = require('delay');
const JSZip = require("jszip");

async function mergeOnePDF(sources){
  var merger = new PDFMerger();
  (async () => {
    sources.forEach(function(item){
      console.log("./" + item.toString())
      merger.add(item)
    })
    await merger.save('merged222.pdf'); //save under given name
  })();
}


async function createInvoice(students, cours, answers,res){
  generateCorection(answers);
  var sources = [];
  var max = students.length
  let nbDone = 0
  Async.forEach(students, async (student)=>{
    let doc = new PDFDocument();
    let writeStream = fs.createWriteStream("pre_pdf/" + (student.matricule).toString() + ".pdf")

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
    
    console.log("hehe")
    writeStream.on('finish',async function(){
      nbDone++;
      if(nbDone == max){
        console.log(sources.length)
        //await delay(8*sources.length);
        m = new PDFMerger()
       var version = Object.keys(answers);
       
       version.forEach(letter=>{
          m.add("pre_pdf/correction" + letter + ".pdf")
        })

        sources.forEach(path=>{
          m.add(path)
        })
        await m.save('./downloads/ResultatFinal.pdf'); //save under given name
        //var zippath = ["pre_pdf/QuestinnaireEtudiant.pdf"]
        console.log("doneee")
        res.redirect("./create/Step3")
        var zip = new JSZip();
        
        // var version = Object.keys(answers);
        // zip.file("pre_pdf/QuestinnaireEtudiant.pdf")
        // version.forEach(letter=>{
        //   zip.file("pre_pdf/correction" + letter + ".pdf")
        // })
        // zip.file("pre_pdf/hello.txt")
        // //console.log("completle done")
        // zip.generateNodeStream({type:'nodebuffer'})
        //   .pipe(fs.createWriteStream('out24.zip'))
        //   .on('finish', function () {
        //   // JSZip generates a readable stream with a "end" event,
        //   // but is piped here in a writable stream which emits a "finish" event.
        //   console.log("out.zip written.");
    // });

    }})

    QRCode.toFile('pre_pdf/fff'+student.matricule + ".png",
      'Nom : ' + student.name + "\nMatricule : " + student.matricule + "\nCours : " + cours + "\nVersion : " + student.version,
      function (err) {
        console.log('done')
        doc.image('pre_pdf/fff'+student.matricule + ".png", 50, 115,{scale:0.45});
        doc.pipe(writeStream);
        doc.end();      
    })
  })  
}


function generateHeader(doc) {
  doc.image("result_pdf/squares.PNG", 520, 20, {valign : "top"});
  doc.image("result_pdf/squares.PNG", 20, 20, {valign : "top"});
  doc.image("result_pdf/squares.PNG", 20, 700, {valign : "top"});
  doc.fontSize(20);
  doc.text("Feuilles de réponses", 110, 57, { align: "center" });
  doc.moveDown();
}

function generateTable(doc, answers) {
for (question = 0; question < answers.length; question ++){
  doc.text("Question" + (question + 1).toString(),  125, 222 + (question*55));
  for (answer = 0; answer < answers[question].length; answer++){
      doc.image("result_pdf/vide.PNG", 250 + (answer*55), 200 + (question*55) );
  }
}
}

function generateCorection(answers){
  var version = Object.keys(answers);
  version.forEach((letter) => {
    //console.log(letter);
    let correction = new PDFDocument();

    correction.fontSize(20);
    correction.text("Correctif version : " + letter, 110, 57, { align: "center" });
    Qindex = 0;
    answers[letter].forEach((questions) => {
      Aindex = 0;
      correction.text("Question " + (answers[letter].indexOf(questions)+1).toString(),  125, 222 + Qindex*55);
      questions.forEach((answer) => {
        //console.log("---->", answer);
        if (answer==true){
        // doc.text("ok", 250 + (answer*45), 300 + (question*30) );
          //console.log("hauteur ***", answers[letter].indexOf(questions) );
          //console.log("largeur ***", questions.indexOf(answer));
          correction.image("result_pdf/rempli.PNG", 250 + (Aindex*55), 200 + (Qindex*55) )
          // correction.text("ok",  250 + (Aindex*55), 200 + (Qindex*55) );
        }else{
          //console.log("Reponse ***", answer );
        // doc.text("", 250 + (answer*45), 300 + (question*30) );
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

async function call(){
  // const path = "result_pdf"
  // const students = {17036:{name: "CAESTECKER Guillaume", version : "A", matricule: "17036"}, 
  //                   17076: {name:"BOUILLON Guillaume",  version :"B", matricule: "17076"}};
  const answers = JSON.parse('{"A": [[true, false, false], [false, false, true, false], [false, false, true, true]], "B": [[true, false,true, false], [false, true, false], [false, false, true]]}');

  const students = await functions.importStudents("./uploads/exemple_liste.xlsx")
  // console.log(answers)
  // console.log(students);

  createInvoice(students, 'Math', answers);
}

//call()

exports.createInvoice = createInvoice