const PDFDocument = require("pdfkit");
const fs = require("fs");
const request = require('request');
const merge = require('easy-pdf-merge');
const { versions } = require("process");
const { version } = require("os");
const { create } = require("domain");

var download = function(doc, uri, filename, index, last,sources,  callback){
    request.head(uri, async function(err, res, body){
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
      
      var answer = request(uri);
      
      answer.pipe(fs.createWriteStream(filename).on('finish', async() => {
        doc.image(filename, 50, 115);
        doc.end();
        doc.pipe(fs.createWriteStream("pre_pdf/" + index.toString() + ".pdf"));
        console.log("Coucou");
    
        sources[index] = "pre_pdf/" + index + ".pdf"

        if(sources.length == last ){
          console.log("I'm in");
          

          console.log(sources);

          merge(sources,'pre_pdf/merged.pdf',function(err){

            if(err){
              return console.log(err);
            }else{
              for (file=0; file < sources.length; file++){
                  fs.unlinkSync("pre_pdf/" +file.toString()+ ".pdf");
              }
              console.log('Successfully merged!');
            }

          });
        }
        
        

      }));

    });

    return filename
  };

async function createInvoice(students, cours, answers){

  const versions = Object.keys(answers);
  console.log("TTTTTTTTTTTTTTTTTTTTTTTTTT", versions);
  console.log("COUNT : ", versions.length)

  matricules = Object.keys(students);
  console.log(students[matricules[0]]);
  console.log(matricules.length);

  var sources = new Array();

    
  for(index = 0; index < matricules.length; index++){
      let doc = new PDFDocument();
      generateHeader(doc);

      version_of_student = students[matricules[index]]["version"];

      console.log("ICI :" , answers[version_of_student])

      generateTable(doc, answers[version_of_student]);
      generateStudentInformation(doc, students[matricules[index]]["name"], matricules[index], cours, index, matricules.length, sources, version_of_student);
  }


    generateCorection(answers);
    

}

function generateHeader(doc) {
    doc.image("result_pdf/squares.PNG", 520, 20, {valign : "top"});
    doc.image("result_pdf/squares.PNG", 20, 20, {valign : "top"});
    doc.image("result_pdf/squares.PNG", 20, 700, {valign : "top"});
    console.log(doc.page.height);
    doc.fontSize(20);
    doc.text("Feuilles de réponses", 110, 57, { align: "center" });
    doc.moveDown();

  }

function generateTable(doc, answers) {
  console.log("I'm in");
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
    console.log(letter);
    let correction = new PDFDocument();

    correction.fontSize(20);
    correction.text("Correctif version : " + letter, 110, 57, { align: "center" });
    Qindex = 0;
    answers[letter].forEach((questions) => {
      Aindex = 0;
      correction.text("Question " + (answers[letter].indexOf(questions)+1).toString(),  125, 222 + Qindex*55);
      questions.forEach((answer) => {
        console.log("---->", answer);
        if (answer==true){
        // doc.text("ok", 250 + (answer*45), 300 + (question*30) );
          console.log("hauteur ***", answers[letter].indexOf(questions) );
          console.log("largeur ***", questions.indexOf(answer));
          correction.image("result_pdf/rempli.PNG", 250 + (Aindex*55), 200 + (Qindex*55) )
          // correction.text("ok",  250 + (Aindex*55), 200 + (Qindex*55) );
        }else{
          console.log("Reponse ***", answer );
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


  // correction.fontSize(20);
  // correction.text("Correctif version : " + version, 110, 57, { align: "center" });

  // console.log("CORRECTIF ********************************************** VERSION", version);
  // for (question = 0; question < answers.length; question ++){
  //   correction.text("Question" + (question + 1).toString(),  125, 222 + (question*55));
  //   for (answer = 0; answer < answers[question].length; answer++){
  //     console.log("La valeur est : ", answers[question][answer]);
  //     if (answers[question][answer]==true){
  //       // doc.text("ok", 250 + (answer*45), 300 + (question*30) );
  //       correction.image("test/rempli.PNG", 250 + (answer*55), 200 + (question*55) )
  //     }else{
  //       // doc.text("", 250 + (answer*45), 300 + (question*30) );
  //       correction.image("test/vide.PNG", 250 + (answer*55), 200 + (question*55) )
  //     }
      
  //   }
  // }

  // correction.end();
  // correction.pipe(fs.createWriteStream("pre_pdf/correction" + version + ".pdf"));
}

async function generateStudentInformation(doc, name, matricule, cours, index, last, sources, version) {

    await download(doc, 'https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=Nom : ' + name + "\nMatricule : " + matricule + "\nCours : " + cours + "\nVersion : " + version, 'result_pdf/QRCode.PNG', index, last, sources, function(){

    });


    date = new Date();
    doc.fontSize(10)
    doc.text(`Nom et prénom: ${name}`, 140, 120);
    doc.text(`Matricule: ${matricule}`, 140, 135);
    parseInt(matricule[0]);


    doc.text(`Date: ${date.getDay()}/${date.getMonth()+1}/${date.getFullYear()}`, 140, 150);
    doc.text(`Cours: ${cours}`, 140, 165);   

  }


const path = "result_pdf"
const students = JSON.parse('{"17036": {"name": "CAESTECKER Guillaume", "version" : "A"}, "17076": {"name":"BOUILLON Guillaume", "version":"B"}}');
const answers = JSON.parse('{"A": [[true, false, false], [false, false, true, false], [false, false, true, true]], "B": [[true, false,true, false], [false, true, false], [false, false, true]]}');


console.log(answers)
console.log(students);
//createInvoice(students, 'Math', answers);

exports.createInvoice = createInvoice



