const router = require('express-promise-router')();
const path = require("path")
const functions = require("../node_scripts/functions")
const QCM_automatisation = require("../node_scripts/QCM_automatisation")
const access = require('../node_scripts/hasAccess')
const { Exam } = require("../node_scripts/database/models");
const corrector = require('../node_scripts/correction')
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

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


router.get("/downloadresult", access.hasAccess, async (req, res) => {
    Exam.findOne({where:{id:req.session.examId}}).then(exam=> {
        res.download(
            path.resolve(exam.examFile),
            (err) => {
		console.log("--- DOWNLOAD ERROR CREATE/downloadresult ---\n", err) 
               // if (err) res.redirect("/error")
            }
        );
    }).catch(err=> {
        console.log(" --- DATABASE ERROR -- CREATE/download ---\n " + err)
        req.flash('errormsg','Database error, error : 1011')
        res.redirect('/error')
    })
});

router.get("/downloadcorrection", access.hasAccess, async (req, res) => {
    Exam.findOne({where:{id:req.session.examId}}).then(exam=> {
        res.download(
            path.resolve(exam.correctionFile),
            (err) => {
		console.log("--- DOWNLOAD ERROR CREATE/downloadcorrection ---\n", err) 
                //if (err) res.redirect("error")
            }
        ); 
    }).catch(err=> {
        console.log(" --- DATABASE ERROR -- CREATE/download ---\n " + err)
        req.flash('errormsg','Database error, error : 1012')
        res.redirect('/error')
    })
})

router.get("/Step0",access.hasAccess,(req,res)=>{
    res.render('create/introduction')
})

// Route to upload file
router.get("/Step1",access.hasAccess, function(req,res){
    res.render('create/uploadFile')
})

// Route to upload questions
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

router.get("/Step21", access.hasAccess, (req,res)=>{
    if (!req.session.excelFile){
        req.flash('errormsg', "You cannot go directly to step 2, error 1014a");
        return res.redirect("/create/Step1")
    }
    res.render('create/examInfo',{
        lesson : req.session.excelFile.lesson
    })
})

// Route to load the answers
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

//Route de cotation
router.get("/Step4", access.hasAccess, function(req,res){
    if (!req.session.examId){
        req.flash('errormsg', "You cannot go directly to step 4, error 1014c");
        return res.redirect("/create/Step1")
    }
    Exam.findOne({where:{id:req.session.examId}}).then(exam=>{
        var correctionCriterias = JSON.parse(exam.correctionCriterias)
        correctionCriterias['redirection'] = 'create'
        
        return res.render('create/cotation.pug', correctionCriterias)
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
    res.render('create/downloadPDF')
})

// Route to send answers and create Exam
router.post("/quest", upload.single("studentList"), async (req, res) => {
    const excelFile = req.session.excelFile.filename
    const lessonName = req.session.excelFile.lesson

    if (!excelFile && !lessonName) {
        req.flash('errormsg', "Somthing went wrong please retry, error 1015b");
        res.redirect("/create/Step1")
    }

    const students = await functions.importStudents(excelFile)

    if (!students || students.length < 1){
        req.flash('errormsg', "Somthing went wrong with the student list, error 1015a");
        res.redirect("/create/Step1")
    }

    // Create an array with all question status to normal
    const answers = JSON.parse(req.body.liste)
    var questionStatus = {}

    Object.entries(answers).forEach(([key,value]) =>{
        let array = []
        for(let i=0 ; i<value.length ;i++){
            array.push('normal')   
        }
        questionStatus[key] = array
    });
    
    //const files = JSON.parse(req.body.files)

    Exam.create({
        "userMatricule":req.session.userObject.matricule, 
        "name":lessonName, 
        "numberOfVersion":JSON.parse(req.session.excelFile.versions).length, 
        "versionsFiles":req.session.excelFile.versions, 
        "corrections":JSON.stringify(answers),
        "questionStatus":JSON.stringify(questionStatus), 
        "excelFile":excelFile
    }).then(exam => {
        var lesson = {
            name: lessonName,
            id: exam.id,
            versions: JSON.parse(req.session.excelFile.versions)
        }

        QCM_automatisation.createInvoice(students, lesson, answers, req.session["pdffiles"], req.session.extraCopies, req.session.examDate)
            .then(async(ret) => {
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
                    threeMoreWrong:0,
                    isLastExclusive : 'on',
                    lastExclusiveTrue:1,
                    lastExclusiveFalse:0
                })

                exam.save().then(exam=>{
                    req.session["examId"] = exam.id
                    //redirect
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
        var versions = await functions.getExcelInfo(pathTofile)
        
        if(versions[0]){
            req.flash('errormsg', versions[0]);
            console.log(versions[1]) //log de l'erreur détaillée
            res.redirect("/create/Step1")
        }
        else{ 
            excelFile = {
                filename: pathTofile,
                versions: JSON.stringify(versions[2]),
                lesson: versions[3]
            }

            req.session["excelFile"] = excelFile
            res.redirect("/create/Step21")
        }
    }
    else{
        req.flash('errormsg', 'File must be .xlsx');
        res.redirect("/create/Step1")
    }
})

// Route to upload the question files
router.post("/sendQuestions", access.hasAccess, upload.array("question"), (req, res)=>{
    var files = {}
    var liste = JSON.parse(req.body.versions)
    req.session.excelFile["lesson"] = req.body.lesson

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
        console.log(req.body)
        req.session.excelFile["lesson"] = req.body.lesson
        req.session.examDate = req.body.date

        if('singleGrid' in req.body){
            req.session["pdffiles"] = null
            res.redirect("Step3")
        }
        else res.redirect("Step22")
})

router.post("/sendCotationCriteria/:redirection", access.hasAccess, async (req, res)=>{
    var criteria = req.body

    Exam.findOne({where:{id:req.session.examId}}).then(async exam=>{
        if (exam){
            exam.correctionCriterias = JSON.stringify(criteria)
            await exam.save()
            
            if(req.params.redirection == 'create') return res.redirect('/create/Step5')
            else corrector.reCorrect(req.session.examId).then(suc=>{
                req.flash('recorrectmsg', 'Les critères de cotation ont été enregistrés et les copies recorrigées')
                return res.redirect('/see/exam/' + req.session.examId)
            }).catch(err=>{
                console.log(err)
                req.flash("errormsg", "Error while recorrecting the exam")
                return res.redirect("/error")
            })
        }
        else {
            req.flash("errormsg", "No exam found")
            return res.redirect("/error")
        }
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- CREATE/sendCotationCriteria ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1015')
        res.redirect('/error')
    })
})

module.exports = router;
