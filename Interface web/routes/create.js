const router = require('express-promise-router')();
const path = require("path")
const functions = require("../node_scripts/functions")
const QCM_automatisation = require("../node_scripts/QCM_automatisation")
const acces = require('../node_scripts/hasAcces')
const request = require('request');
const FormData = require('form-data');
const fs = require("fs");
const correction = require("../node_scripts/correction")

var multer  = require('multer') // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: 'uploads/',
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)
var upload = multer({ storage: storage})



// Download final pdf route 
router.get("/downloadresult", acces.hasAcces, (req, res) => {
    res.download(
        path.join('downloads', "ResultatFinal.pdf" ),
        (err) => {
            if (err) res.status(404).send("<h1>File Not found: 404</h1>");
        }
        );
});


router.get("/downloadcorrection", acces.hasAcces, (req, res) => {
    res.download(
        path.join('downloads', "Correction.pdf" ),
        (err) => {
            if (err) res.status(404).send("<h1>File Not found: 404</h1>");
        }
    );
})

// Route to upload file
router.get("/Step1",acces.hasAcces, function(req,res){
    res.render('uploadFile', {title:"QCM CREATOR"})

})

// Route to upload questions
router.get("/Step2", acces.hasAcces, function(req,res){
    res.render('loadQuestions', 
            {title:"QCM CREATOR", 
                uploadedFilename :req.session.excelfilename, 
                versions: JSON.parse(req.session.excelversions),
                lesson : req.session.excellesson
            })
})

// Route to load the answers
router.get("/Step3",acces.hasAcces, function(req, res){

        res.render('loadAnswers', 
                    {title:"QCM CREATOR", 
                    uploadedFilename: req.session.excelfilename,
                    versions :JSON.parse(req.session.excelversions), 
                    files :JSON.parse(req.session.pdffiles),
                    lesson : req.session.excellesson 
    })
    
})


//Route de cotation
router.get("/Step4",acces.hasAcces,function(req,res){
        res.render('cotation.pug')
    
})

// Route to the download page
router.get("/Step5",acces.hasAcces, function(req,res){
    res.render('downloadPDF')
})

// Route to send answers
router.post("/quest", upload.single("studentList"), async (req, res) => {
    const filename = req.body.filename  
    const lesson = req.session.excellesson
    const students = await functions.importStudents("uploads/"+filename)
    const answers = JSON.parse(req.body.liste)
    const files = JSON.parse(req.body.files)

    QCM_automatisation.createInvoice(students, lesson, answers, files).then(res.redirect("/create/Step4"));
})

// Route to upload the student list file
router.post("/sendList",acces.hasAcces, upload.single("studentList"), async function(req, res, next) {
        const pathTofile = "uploads/"+req.file.originalname
        console.log(pathTofile)
        var ext = path.extname(pathTofile);
        console.log(ext);
        if(ext ==".xlsx"){
            var versions = await functions.getExcelInfo(pathTofile)
            if(versions[0]){
                req.flash('errormsg',versions[0]);
                console.log(versions[1] ) //log de l'erreur détaillée
                res.redirect("/create/Step1")
            }
            else{ 
                req.session["excelfilename"] = req.file.originalname  
                req.session["excelversions"] = JSON.stringify(versions[2])
                req.session["excellesson"] = JSON.stringify(versions[3])

                res.redirect("/create/Step2")
            }
        }
        else{
            req.flash('errormsg', 'File must be .xlsx');
            res.redirect("/create/Step1")
        }
    
})

// Route to upload the question files
router.post("/sendQuestions",acces.hasAcces, upload.array("question"), async (req, res, next)=>{
    var files = {}
    var liste = JSON.parse(req.body.versions)
    req.session["excellesson"] = req.body.lesson

    for (var i = 0; i < liste.length; i++) {
        var fileName = req.files[i].filename
        if(path.extname(fileName) != '.pdf'){
            req.flash('errormsg', 'You can only send PDF files');
            res.redirect('/create/Step2')
           return 0
        }
        else{
            files[liste[i]] = fileName
        }
    }
    req.session["pdffiles"] = JSON.stringify(files)
    res.redirect("/create/Step3")
})


router.post("/sendNormalCotationCriteria", acces.hasAcces, (req,res)=>{
    console.log(req.body)
    res.redirect('/create/Step5')
})

router.post("/sendAdvancedCotationCriteria", acces.hasAcces,(req,res)=>{
    console.log(req.body)
    res.redirect('/create/Step5')
})

module.exports = router;
