const router = require('express-promise-router')();
const request = require('request');
const unzipper = require("unzipper")
const http = require('http');
const access = require('../node_scripts/hasAccess')
const fs = require("fs");
const correction = require("../node_scripts/correction")
const { Exam } = require("../node_scripts/database/models");
const path = require("path")
const { v4: uuidv4 } = require('uuid');
const copyLayout = require('../node_scripts/copyLayout')


var multer  = require('multer'); // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: 'uploads/',
        filename: function(req, file, cb){
            uid = uuidv4()
            cb(null, uid + '_' + path.extname(file.originalname))
        }
    }
)
var upload = multer({ storage: storage})

const url = `http://${process.env.PYTHON_SERVER_HOST}:${process.env.PYTHON_SERVER_PORT}`
// Call the python server (for correction)
function callCorrection(filename, exam, req){
    // Create a folder for the following copies
    uid = uuidv4()
    if (!fs.existsSync('copies')) {
        fs.mkdirSync('copies')
      }
    fs.mkdirSync('copies/' + uid)

    copyL = copyLayout.getCopyLayout(JSON.parse(exam.corrections))
    const formData = {
        exam_id: exam.id,
        gridLayouts : copyL,
		file: fs.createReadStream(`uploads/${filename}`),
	}
    request.post({url:`${url}/run`, formData:formData}, function (err, httpResponse, body) {
        if (err || !body ||JSON.parse(body).error){
            exam.status = 3 // 3 = correction error
            exam.save()
        }
        else{
            console.log(body)
            zipFile = JSON.parse(body).zipFile
            const file = fs.createWriteStream(`zips/${zipFile}`);
            
            http.get(`${url}/static/${zipFile}`, function(response) {
                response.pipe(file);
            });
            
            file.on("finish", function(){
                fs.createReadStream(`zips/${zipFile}`).pipe(unzipper.Extract({ path: 'copies/' +uid }));
            })

            if (typeof zipFile !== 'undefined' && exam.id == zipFile.split('.')[0]){
                correction.correctAll(exam, body, req,uid)
            }
            else{
                exam.status = 3
                exam.save()
            }
        }
    })
}

// This function render the upload page with the historic
router.get("/copies/:examid", access.hasAccess, async(req, res) => {
    Exam.findOne({where:{id:req.params.examid}}).then(exam =>{
        res.render("upload/uploadScans", {exam:exam,historic:JSON.parse(exam.historic)})
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- UPLOAD/copies ---\n " + err)
        req.flash('errormsg', 'Internal error, error : 1015')
        res.redirect('/error')
    })
})

router.post("/scans/manual/:examid", access.hasAccess, upload.single("file"), async(req, res) => {
    if (path.extname(req.file.filename) != ".pdf"){
        req.flash("errormsg", "Veuillez uploader un fichier pdf")
        return res.render("upload/uploadScans", {exam:exam})
    }
    
    Exam.findOne({where:{id:req.params.examid}}).then(exam =>{
        exam.status = 1 // Process correction
        exam.save()

        req.flash("successmsg", "Début de la correction, ce processus peut prendre jusqu'a 2 minutes. Actualisez pour voir l'état.")
        res.redirect("/see")

        try{
            callCorrection(req.file.filename, exam, req)
        }
        catch(err){
            console.log(" --- Call correction ERROR -- UPLOAD/scan/manual ---\n " + err)
            req.flash("errormsg", "Error while making the correction, error : 1007")
            return res.redirect('/error')
        }        
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- UPLOAD/scan/manual ---\n " + err)
        req.flash('errormsg', 'Internal error, error : 1016')
        return res.redirect('/error')
    })
})

router.get("/downloadUploadedFile/:examid/:filename", access.hasAccess, async (req, res) => {
    return res.download(
        path.resolve('uploads/' + req.params.filename),
        (err) => {
            if (err){
                console.log(" --- DOWNLOAD ERROR -- SEE/exam/downloadresult ---\n " + err)
            } 
        }
    );
});

module.exports = router;
