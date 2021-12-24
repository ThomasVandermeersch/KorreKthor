const router = require('express-promise-router')();
const path = require("path")
const functions = require("../node_scripts/functions")
const QCM_automatisation = require("../node_scripts/QCM_automatisation")
const access = require('../node_scripts/hasAccess')
const { Exam } = require("../node_scripts/database/models");
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

var multer  = require('multer'); // Specific import for files 
const { cpuUsage } = require('process');
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

router.get("/Step0",access.hasAccess,(req,res)=>{
    res.render('create/introduction')
})

// Route to upload student Excel file
router.get("/Step1",access.hasAccess, function(req,res){
    res.render('create/uploadFile')
})

// Route to enter exam basic information
router.get("/Step21", access.hasAccess, (req,res)=>{
    if (!req.session.excelFile){
        req.flash('errormsg', "You cannot go directly to step 2, error 1014a");
        return res.redirect("/create/Step1")
    }
    res.render('create/examInfo',{
        lesson : req.session.excelFile.lesson,
        version : req.session.excelFile.versions // If no versions are provided in the Excel file, this value will be false
    })
})

// Route to upload PDF questionnaires
router.get("/Step22", access.hasAccess, function(req,res){
    if (!req.session.excelFile){
        req.flash('errormsg', "You cannot go directly to step 2, error 1014a");
        return res.redirect("/create/Step1")
    }
    return res.render('create/loadQuestions', {
        uploadedFilename :req.session.excelFile.filename, 
        versions: JSON.parse(req.session.excelFile.versions),
        lesson : req.session.excelFile.lesson
    })
})

// Route to generate the response grid and load the answers
router.get("/Step3",access.hasAccess, function(req, res){
    if (!req.session.excelFile){
        req.flash('errormsg', "You cannot go directly to step 3, error 1014b");
        return res.redirect("/create/Step1")
    }
    return res.render('create/loadAnswers', {
        versions :JSON.parse(req.session.excelFile.versions),
        lesson : req.session.excelFile.lesson          
    })
})

// Route to enter cotation criterias
router.get("/Step4", access.hasAccess, function(req,res){
    if (!req.session.examId){
        req.flash('errormsg', "You cannot go directly to step 4, error 1014c");
        return res.redirect("/create/Step1")
    }
    Exam.findOne({where:{id:req.session.examId}}).then(exam=>{
        return res.render('create/cotation.pug', {correctionCriterias:JSON.parse(exam.correctionCriterias),redirection:'create',examId:req.session.examId})
    }).catch(err=> {
        console.log(" --- DATABASE ERROR -- CREATE/download ---\n " + err)
        req.flash('errormsg','Database error, error : 1013')
        return res.redirect('/error')
    })
})

// Route to the download page
router.get("/Step5", access.hasAccess, function(req,res){
    if (!req.session.examId){
        req.flash('errormsg', "You cannot go directly to step 5, error 1014d");
        return res.redirect("/create/Step1")
    }
    res.render('create/downloadPDF',{examId:req.session.examId})
})

// Route to send answers and create Exam
router.post("/quest", upload.single("studentList"), async (req, res) => {
    const excelFile = req.session.excelFile.filename
    const lessonName = req.session.excelFile.lesson
    console.log("Lesson name : " + lessonName)
    if (!excelFile && !lessonName) {
        req.flash('errormsg', "Somthing went wrong please retry, error 1015b");
        res.redirect("/create/Step1")
    }

    const students = await functions.importStudents(excelFile)
    if (!students || students.length < 1){
        req.flash('errormsg', "Somthing went wrong with the student list, error 1015a");
        return res.redirect("/create/Step1")
    }

    // Create an array with all question status to normal
    const answers = JSON.parse(req.body.liste)
    
    if(req.session.noVersion == true){
        Object.entries(answers).forEach(([key,value]) =>{
            value.unshift({type:'version',nbVersion:JSON.parse(req.session.excelFile.versions).length})
        });
    }

    Exam.create({
        "userMatricule":req.session.userObject.matricule, 
        "name":lessonName, 
        "numberOfVersion":JSON.parse(req.session.excelFile.versions).length, 
        "versionsFiles":req.session.excelFile.versions, 
        "corrections":JSON.stringify(answers),
        "collaborators":JSON.stringify([]), 
        "excelFile":excelFile,
        "correctionCriterias": JSON.stringify({type:'normal', ptsRight:1, ptsWrong:0, ptsAbs:0, allGood:1, oneWrong:0.75, twoWrong:0.50, threeWrong:0.25,threeMoreWrong:0,isLastExclusive : 'on',lastExclusiveTrue:1, lastExclusiveFalse:0 }),
        "historic" : '[]'
    }).then(exam => {
        var lesson = { name: lessonName, id: exam.id, versions: JSON.parse(req.session.excelFile.versions)}

        QCM_automatisation.createInvoice(students, lesson, answers, req.session["pdffiles"], req.session.extraCopies, req.session.examDate,req.session.noVersion)
            .then(async(ret) => {
                // handle errors
                if (ret.error){
                    exam.destroy()
                    res.send({"error":"somthing went wrong while creating exam.", "code":1001})
                }
                
                // update model
                exam.examFile = ret.exam
                exam.correctionFile = ret.correction
                exam.save().then(exam=>{
                    req.session["examId"] = exam.id
                    res.redirect("/create/Step4")
                })
            })
            .catch((ret) => {
                exam.destroy()
                console.log(ret)
                req.flash('errormsg', ret.error);
                res.redirect("/create/Step2")
            })
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- CREATE/quest ---\n " + err)
            req.flash('errormsg', 'Database error, error : 1014')
            res.redirect('/error')
        })
})

// Route to upload the student list file
router.post("/sendList", access.hasAccess, uploadxls.single("studentList"), async function(req, res, next) {
    const pathTofile = "./uploads/"+req.file.filename // file path
    var ext = path.extname(pathTofile); // file extension

    req.session["extraCopies"] = req.body.extraCopies

    if(ext == ".xlsx"){  
        functions.getExcelInfo(pathTofile).then((response)=>{
            var excelFile = null

            if(!response.versions)
            {
                excelFile = {
                    filename: pathTofile,
                    versions: false,
                    lesson: response.lesson
                }  
            }
            else{
                excelFile = {
                    filename: pathTofile,
                    versions: JSON.stringify(response.versions),
                    lesson: response.lesson
                }  
            }

            req.session["excelFile"] = excelFile
            res.redirect("/create/Step21")
        }).catch(err=>{
            req.flash('errormsg', 'Problem with Excel file');
            res.redirect("/create/Step1")
        })
    }
    else{
        req.flash('errormsg', 'File must be .xlsx');
        res.redirect("/create/Step1")
    }
})

// Route to upload the question files (PDF)
router.post("/sendQuestions", access.hasAccess, upload.array("question"), (req, res)=>{
    var files = {}
    var liste = JSON.parse(req.body.versions)

    for (var i = 0; i < liste.length; i++) {
        var fileName = req.files[i].filename
        if(path.extname(fileName) != '.pdf'){
            req.flash('errormsg', 'You can only send PDF files');
            return res.redirect('/create/Step22')
        }
        else{
            files[liste[i]] = fileName
        }
    }
    req.session["pdffiles"] = JSON.stringify(files)
    res.redirect("/create/Step3")
})

router.post('/sendexamInfo', access.hasAccess ,body('lesson').isLength({ min: 5,max:65 }),
    function(req,res){
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors)
            return res.send("ERROR")
        } 
        req.session.excelFile["lesson"] = req.body.lesson
        req.session.examDate = req.body.date
        if('version' in req.body){
            nbVersions = parseInt(req.body.version,10)
            versionsLetter = 'ABCDEFG'
            versionList = []
            for(var i=0; i <nbVersions;i++){
                versionList.push(versionsLetter[i])
            }
            req.session.excelFile.versions = JSON.stringify(versionList)
            req.session.noVersion = true
        }
        if('singleGrid' in req.body){
            req.session["pdffiles"] = null
            res.redirect("Step3")
        }
        else res.redirect("Step22")
})

module.exports = router;