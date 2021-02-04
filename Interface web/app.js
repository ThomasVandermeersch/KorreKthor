const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const url = require('url')

const functions = require("./functions")
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
app.get("/create/Step1",function(req,res){
    res.render('creation2',{title:"QCM CREATOR"})
})

app.get("/create/Step2", async function(req, res){
    var versions = await functions.getVersions("./uploads/"+req.query.filename)
    console.log(req.query)
    res.render('creation',{title:"QCM CREATOR", "uploadedFilename": "None",versions:versions})
})

// Route to send answers
app.post("/quest", upload.single("studentList"), (req, res, next)=>{
    console.log(req.body)
    console.log(JSON.parse(req.body.liste))
    res.end("<h1> Hello World </h1>")
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