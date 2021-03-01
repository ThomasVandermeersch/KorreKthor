const router = require('express-promise-router')();
const url = require('url')
const path = require("path")

const functions = require("../node_scripts/functions")
const QCM_automatisation = require("../node_scripts/QCM_automatisation")
var multer  = require('multer') // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: '../uploads/',
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)
var upload = multer({ storage: storage})

// Download final pdf route 
router.get("/downloadresult", (req, res) => {
    if (hasAcces(req.session.userId,res)){
        res.download(
            path.join('downloads', "ResultatFinal.pdf" ),
            (err) => {
              if (err) res.status(404).send("<h1>File Not found: 404</h1>");
            }
          );
    }
});


router.get("/downloadcorrection", (req, res) => {
    if (hasAcces(req.session.userId,res)){
        res.download(
            path.join('downloads', "Correction.pdf" ),
            (err) => {
                if (err) res.status(404).send("<h1>File Not found: 404</h1>");
            }
        );
    }
})

// Route to upload file
router.get("/Step1",function(req,res){
    if (hasAcces(req.session.userId,res)){
        res.render('uploadFile', {title:"QCM CREATOR"})
    }
})

// Route to upload questions
router.get("/Step2",function(req,res){
    if (hasAcces(req.session.userId,res)){
        var versions = JSON.parse(req.query.versions)
        res.render('loadQuestions', {title:"QCM CREATOR", "uploadedFilename":req.query.filename, "versions":versions})
    }
})

// Route to load the answers
router.get("/Step3", function(req, res){
    if (hasAcces(req.session.userId,res)){

        res.render('loadAnswers', {title:"QCM CREATOR", "uploadedFilename": req.query.filename, "versions":JSON.parse(req.query.versions), "files":JSON.parse(req.query.files)})
    }
})


//Route de cotation
router.get("/Step4",function(req,res){
    if (hasAcces(req.session.userId,res)){
        res.render('cotation.pug')
    }
})

// Route to the download page
router.get("/Step5",function(req,res){
    if (hasAcces(req.session.userId,res)){
        res.render('downloadPDF')
    }
})

// Route to send answers
router.post("/quest", upload.single("studentList"), async (req, res, next)=>{
    const filename = req.body.filename
    const students = await functions.importStudents("../uploads/"+filename)
    const answers = JSON.parse(req.body.liste)
    const files = JSON.parse(req.body.files)

    QCM_automatisation.createInvoice(students, 'Math', answers, files).then(res.redirect("/create/Step4"));
})

// Route to upload the student list file
router.post("/sendList", upload.single("studentList"), async function(req, res, next) {
    var versions = await functions.getVersions("../uploads/"+req.file.originalname)

    res.redirect(url.format({
        pathname:"/create/Step2",
        query: { filename: req.file.originalname, versions:JSON.stringify(versions)}
    }))     
})

// Route to upload the question files
router.post("/sendQuestions", upload.array("question", 4), async (req, res, next)=>{
    var files = {}
    var liste = JSON.parse(req.body.versions)

    var i;
    for (i = 0; i < liste.length; i++) {
        files[liste[i]] = req.files[i].filename
    }

    res.redirect(url.format({
        pathname:"/create/Step3",
        query: { filename: req.body.listeEtu, versions:req.body.versions, files:JSON.stringify(files)}
    }))

})


router.post("/sendNormalCotationCriteria", (req,res)=>{
    console.log(req.body)
    res.redirect('/create/Step5')
})

router.post("/sendAdvancedCotationCriteria",(req,res)=>{
    console.log(req.body)
    res.redirect('/create/Step5')
})

function hasAcces(userID,res){
    if(!userID){
        res.redirect("/auth/login")
        return false
    }
    return true
}

module.exports = router;
