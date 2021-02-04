const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');

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
    res.render('creation',{title:"QCM CREATOR", "uploadedFilename": "None"})
})

// Route to send answers
app.post("/quest", upload.single("studentList"), (req, res, next)=>{
    console.log(req.body)
    console.log(JSON.parse(req.body.liste))
    res.end("<h1> Hello World </h1>")
})

// Route to upload files
app.post("/", upload.single("studentList"), function(req, res, next) {
    console.log(req.file)
    res.render('creation',{title:"QCM CREATOR", "uploadedFilename": req.file.originalname})
})

app.listen(8000)