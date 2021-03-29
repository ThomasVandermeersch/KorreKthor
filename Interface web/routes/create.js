const router = require('express-promise-router')();
const path = require("path")
const functions = require("../node_scripts/functions")
const QCM_automatisation = require("../node_scripts/QCM_automatisation")
const acces = require('../node_scripts/hasAcces')
const request = require('request');
const FormData = require('form-data');
const fs = require("fs");
const { User, Exam, Copy } = require("../node_scripts/database/models");
const correction = require("../node_scripts/correction")
const databaseTools = require("../node_scripts/databaseTools")

var multer  = require('multer'); // Specific import for files 
const exam = require('../node_scripts/database/models/exam');
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
router.get("/downloadresult", acces.hasAcces, async (req, res) => {
    var exam = await Exam.findOne({where:{id:req.session.examId}})
    res.download(
        path.resolve(exam.examFile),
        (err) => {
            if (err) res.status(404).send("<h1>File Not found: 404</h1>");
        }
        );
});


router.get("/downloadcorrection", acces.hasAcces, async (req, res) => {
    var exam = await Exam.findOne({where:{id:req.session.examId}})
    res.download(
        path.resolve(exam.correctionFile),
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
                uploadedFilename :req.session.excelFile.filename, 
                versions: JSON.parse(req.session.excelFile.versions),
                lesson : req.session.excelFile.lesson
            })
})

// Route to load the answers
router.get("/Step3",acces.hasAcces, function(req, res){

        res.render('loadAnswers', 
                    {title:"QCM CREATOR", 
                    uploadedFilename: req.session.excelFile.filename,
                    versions :JSON.parse(req.session.excelFile.versions), 
                    files :JSON.parse(req.session.pdffiles),
                    lesson : req.session.excelFile.lesson
    })
    
})


//Route de cotation
router.get("/Step4",acces.hasAcces,function(req,res){
        res.render('cotation.pug',
            {   type:'normal',
                ptsRight:1,
                ptsWrong:0,
                ptsAbs:0,
                allGood:1,
                oneWrong:0.75,
                twoWrong:0.50,
                threeWrong:0.25,
                threeMoreWrong:0.21,
                isLastExclusive : 'on',
                lastExclusiveTrue:1,
                lastExclusiveFalse:0})
})

// Route to the download page
router.get("/Step5",acces.hasAcces, function(req,res){
    res.render('downloadPDF')
})

// Route to send answers
router.post("/quest", upload.single("studentList"), async (req, res) => {
    const filename = req.body.filename
    const lessonName = req.session.excelFile.lesson
    const students = await functions.importStudents("uploads/"+filename)
    const answers = JSON.parse(req.body.liste)
    const files = JSON.parse(req.body.files)

    studentObjects = await databaseTools.createStudents(students)
    console.log(studentObjects)

    var exam = await Exam.create({"userId":req.session.userObject.id, "name":lessonName, "numberOfVersion":JSON.parse(req.session.excelFile.versions).length, "versionsFiles":req.session.excelFile.versions, "corrections":JSON.stringify(answers)})
    console.log(exam.id)
    var lesson = {
        name: lessonName,
        id: exam.id
    }

    QCM_automatisation.createInvoice(students, lesson, answers, files).then((ret) => {
        // handle errors
        if (ret.error){
            exam.destroy()
            res.send({"error":"somthing went wrong while creating exam.", "code":1001})
        }
        
        // update model
        exam.examFile = ret.exam
        exam.correctionFile = ret.correction
        exam.save()
        console.log(exam.id)
        req.session["examId"] = exam.id
        
        //redirect
        res.redirect("/create/Step4")
    });
})

// Route to upload the student list file
router.post("/sendList",acces.hasAcces, upload.single("studentList"), async function(req, res, next) {
        const pathTofile = "uploads/"+req.file.originalname // file path
        var ext = path.extname(pathTofile); // file extension

        if(ext ==".xlsx"){  
            var versions = await functions.getExcelInfo(pathTofile)
            if(versions[0]){
                req.flash('errormsg',versions[0]);
                console.log(versions[1] ) //log de l'erreur détaillée
                res.redirect("/create/Step1")
            }
            else{ 
                excelFile = {
                    filename: req.file.originalname,
                    versions: JSON.stringify(versions[2]),
                    lesson: versions[3]
                }

                req.session["excelFile"] = excelFile
                
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
    req.session.excelFile["lesson"] = req.body.lesson

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


router.post("/sendNormalCotationCriteria", acces.hasAcces, async (req,res)=>{
    var criteria = req.body
    console.log("____ CRITERIAS ___")
    console.log(criteria)
    console.log("____ EXAM ID ___")
    console.log(req.session.examId)

    var exam = await Exam.findOne({where:{id:req.session.examId}})
    exam.correctionCriterias = JSON.stringify(criteria)
    exam.save()
    res.redirect('/create/Step5')
})

router.post("/sendAdvancedCotationCriteria", acces.hasAcces, async (req,res)=>{
    var criteria = req.body
    criteria['type'] = 'advanced'
    var exam = await Exam.findOne({where:{id:req.session.examId}})
    exam.correctionCriterias = JSON.stringify(criteria)
    exam.save()
    res.redirect('/create/Step5')
})

module.exports = router;
