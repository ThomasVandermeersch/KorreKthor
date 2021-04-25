const router = require('express-promise-router')();
const path = require("path")
const functions = require("../node_scripts/functions")
const QCM_automatisation = require("../node_scripts/QCM_automatisation")
const acces = require('../node_scripts/hasAcces')
const { Exam } = require("../node_scripts/database/models");
const databaseTools = require("../node_scripts/databaseTools")
const corrector = require('../node_scripts/correction')
const { v4: uuidv4 } = require('uuid');

var multer  = require('multer'); // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: 'uploads/',
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)
var storagexls = multer.diskStorage(
    {
        destination: 'uploads/',
        filename: function(req, file, cb){
            uid = uuidv4()
            cb(null, uid + path.extname(file.originalname))
        }
    }
)
var upload = multer({ storage: storage})
var uploadxls = multer({ storage: storagexls})



// Download final pdf route


router.get("/Step0",acces.hasAcces,(req,res)=>{
    res.render('create/introduction')
})


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
    res.render('create/uploadFile', {title:"QCM CREATOR"})

})

// Route to upload questions
router.get("/Step2", acces.hasAcces, function(req,res){
    res.render('create/loadQuestions', 
            {title:"QCM CREATOR", 
                uploadedFilename :req.session.excelFile.filename, 
                versions: JSON.parse(req.session.excelFile.versions),
                lesson : req.session.excelFile.lesson
            })
})

// Route to load the answers
router.get("/Step3",acces.hasAcces, function(req, res){
    res.render('create/loadAnswers', 
                {title:"QCM CREATOR", 
                uploadedFilename: req.session.excelFile.filename,
                versions :JSON.parse(req.session.excelFile.versions), 
                files :JSON.parse(req.session.pdffiles),
                lesson : req.session.excelFile.lesson
    })
    
})


//Route de cotation
router.get("/Step4",acces.hasAcces,function(req,res){
    res.render('create/cotation.pug',
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
            lastExclusiveFalse:0,
            redirection:'create'})
})

// Route to the download page
router.get("/Step5",acces.hasAcces, function(req,res){
    res.render('create/downloadPDF')
})

// Route to send answers
router.post("/quest", upload.single("studentList"), async (req, res) => {
    const excelFile = req.session.excelFile.filename
    const lessonName = req.session.excelFile.lesson
    const students = await functions.importStudents(excelFile)

    if (!students || students.length < 1){
        req.flash('errormsg', "Somthing went wrong with the student list");
        res.redirect("/create/Step1")
    }

    const answers = JSON.parse(req.body.liste)
    var questionStatus = {}

    Object.entries(answers).forEach(([key,value]) =>{
        let array = []
        for(let i=0 ; i<value.length ;i++){
            array.push('normal')   
        }
        questionStatus[key] = array

    });
    
    const files = JSON.parse(req.body.files)

    studentObjects = await databaseTools.createStudents(students)
    var exam = await Exam.create({"userId":req.session.userObject.id, "name":lessonName, "numberOfVersion":JSON.parse(req.session.excelFile.versions).length, "versionsFiles":req.session.excelFile.versions, "corrections":JSON.stringify(answers),"questionStatus":JSON.stringify(questionStatus), "excelFile":excelFile})
    
    var lesson = {
        name: lessonName,
        id: exam.id,
        versions: JSON.parse(req.session.excelFile.versions)
    }

    QCM_automatisation.createInvoice(students, lesson, answers, files, req.session.extraCopies)
        .then((ret) => {
            // handle errors
            if (ret.error){
                exam.destroy()
                res.send({"error":"somthing went wrong while creating exam.", "code":1001})
            }
            
            // update model
            exam.examFile = ret.exam
            exam.correctionFile = ret.correction
            exam.correctionCriterias = JSON.stringify({
                type:'normal',
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
                lastExclusiveFalse:0
            })

            exam.save()
            req.session["examId"] = exam.id
            
            //redirect
            res.redirect("/create/Step4")
        })
        .catch((ret) => {
            exam.destroy()
            console.log(ret)
            req.flash('errormsg', ret.error);
            res.redirect("/create/Step2")
        })
})

// Route to upload the student list file
router.post("/sendList",acces.hasAcces, uploadxls.single("studentList"), async function(req, res, next) {
    const pathTofile = "./uploads/"+req.file.filename // file path
    var ext = path.extname(pathTofile); // file extension

    req.session["extraCopies"] = req.body.extraCopies

    if(ext == ".xlsx"){  
        var versions = await functions.getExcelInfo(pathTofile)
        
        if(versions[0]){
            req.flash('errormsg', versions[0]);
            console.log(versions[1] ) //log de l'erreur détaillée
            res.redirect("/create/Step1")
        }
        else{ 
            excelFile = {
                filename: pathTofile,
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
router.post("/sendQuestions",acces.hasAcces, upload.array("question"), async (req, res)=>{
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


router.post("/sendNormalCotationCriteria/:redirection", acces.hasAcces, async (req,res)=>{
    var criteria = req.body

    var exam = await Exam.findOne({where:{id:req.session.examId}})
    exam.correctionCriterias = JSON.stringify(criteria)
    await exam.save()

    corrector.reCorrect(req.session.examId).then(suc=>{
        if(req.params.redirection == 'create') res.redirect('/create/Step5')
        else res.redirect('/see/exam/' + req.session.examId)
    })
    .catch(err=>{
        console.log(err)
        res.end('Problem')
    })
})

module.exports = router;
