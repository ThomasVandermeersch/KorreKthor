const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const url = require('url')

const functions = require("./functions")
const QCM_automatisation = require("./QCM_automatisation")
var multer  = require('multer') // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: './uploads/',
        filename: function(req, file, cb){
            console.log(cb(null, file.originalname))
        }
    }
)
var upload = multer({ storage: storage})


app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));


// Main route
app.get("/",function(req,res){
    res.redirect("/create/Step1")
})

app.get("/create/downloads", (req, res) => {
  res.download(
    path.join('downloads', "ResultatFinal.pdf" ),
    (err) => {
      if (err) res.status(404).send("<h1>File Not found: 404</h1>");
    }
  );
});
app.get("/create/Step1",function(req,res){
    res.render('creation2',{title:"QCM CREATOR"})
})

app.get("/create/Step2", async function(req, res){
    var versions = await functions.getVersions("./uploads/"+req.query.filename)
    res.render('creation',{title:"QCM CREATOR", "uploadedFilename": "None",versions:versions})
})

app.get("/create/Step3",function(req,res){
    res.render('creation3')
})

// Route to send answers
app.post("/quest", upload.single("studentList"), async (req, res,next)=>{
    console.log(req.body)
    console.log(JSON.parse(req.body.liste))
    
    //res.redirect("./create/Step3") //res.redirect est appelé lorsque la fonction de création a terminé
    
    const students = await functions.importStudents("./uploads/exemple_liste.xlsx")
    const answers = JSON.parse(req.body.liste)
    QCM_automatisation.createInvoice(students, 'Math', answers,res);

})

// Route to upload files
app.post("/sendList", upload.single("studentList"), function(req, res, next) {
    res.redirect(url.format({
        pathname:"/create/Step2",
        query: { filename: req.file.originalname}
    }))
          
    //res.render('creation',{title:"QCM CREATOR", "uploadedFilename": req.file.originalname,versions : functions.getVersions('./uploads()')})
})

app.listen(8000)