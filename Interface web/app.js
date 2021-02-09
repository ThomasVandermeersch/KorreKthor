const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const url = require('url')

const functions = require("./node_scripts/functions")
const QCM_automatisation = require("./node_scripts/QCM_automatisation")
var multer  = require('multer') // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: './uploads/',
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)
var upload = multer({ storage: storage})


// Initializing the app
app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));


// Main route
app.get("/",function(req,res){
    res.redirect("/create/Step1")
})

// Download final pdf route 
app.get("/create/downloads", (req, res) => {
  res.download(
    path.join('downloads', "ResultatFinal.pdf" ),
    (err) => {
      if (err) res.status(404).send("<h1>File Not found: 404</h1>");
    }
  );
});

// Route to upload file
app.get("/create/Step1",function(req,res){
    res.render('uploadFile', {title:"QCM CREATOR"})
})

// Route to upload questions
app.get("/create/Step2",function(req,res){
    var versions = JSON.parse(req.query.versions)
    res.render('loadQuestions', {title:"QCM CREATOR", "uploadedFilename":req.query.filename, "versions":versions})
})

// Route to load the answers
app.get("/create/Step3", function(req, res){
    res.render('loadAnswers', {title:"QCM CREATOR", "uploadedFilename": req.query.filename, "versions":JSON.parse(req.query.versions), "files":JSON.parse(req.query.files)})
})

// Route to the download page
app.get("/create/Step4",function(req,res){
    res.render('downloadPDF')
})

// Route to send answers
app.post("/quest", upload.single("studentList"), async (req, res, next)=>{
    filename = req.body.filename

    
    const students = await functions.importStudents("./uploads/"+filename)
    const answers = JSON.parse(req.body.liste)
    const files = JSON.parse(req.body.files)
    QCM_automatisation.createInvoice(students, 'Math', answers, files).then(res.redirect("./create/Step4"));
})

// Route to upload the student list file
app.post("/sendList", upload.single("studentList"), async function(req, res, next) {
    var versions = await functions.getVersions("./uploads/"+req.file.originalname)

    res.redirect(url.format({
        pathname:"/create/Step2",
        query: { filename: req.file.originalname, versions:JSON.stringify(versions)}
    }))     
})

// Route to upload the question files
app.post("/sendQuestions", upload.array("question", 4), async (req, res, next)=>{
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

app.get("/debug", function(req, res){
    res.render("loadQuestions")
})

// Application port 8000
app.listen(8000)