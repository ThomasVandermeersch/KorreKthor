const router = require('express-promise-router')();
const request = require('request');
const unzipper = require("unzipper")
const http = require('http');
const acces = require('../node_scripts/hasAcces')
const fs = require("fs");
const correction = require("../node_scripts/correction")
const { Exam } = require("../node_scripts/database/models");
const path = require("path")

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


function callCorrection(filename, exam){
    const formData = {
		my_field: "file",
		my_file: fs.createReadStream(`uploads/${filename}`),
	}
    
    request.post({url:'http://localhost:8080/run', formData:formData}, function (err, httpResponse, body) {
        if (err){
            exam.status = 3
            exam.save()
        }
        else{
            zipFile = JSON.parse(body).zipFile
            const file = fs.createWriteStream(`zips/${zipFile}`);
            
            http.get(`http://localhost:8080/static/${zipFile}`, function(response) {
                response.pipe(file);
            });
            
            file.on("finish", function(){
                fs.createReadStream(`zips/${zipFile}`).pipe(unzipper.Extract({ path: 'copies/' }));
            })
            
            correction.correctAll(body)
        }
    })
}

router.get("/copies/:examid", acces.hasAcces, async(req, res) => {
    var exam = await Exam.findOne({where:{id:req.params.examid}})
    res.render("upload/uploadScans", {exam:exam})
})

router.post("/scans/manual", acces.hasAcces, upload.single("file"), async(req, res) => {
    var exam;
    if (req.session.userObject.authorizations == 0){
        exam = await Exam.findOne({where:{id:req.body.examid}})
    }
    else{
        exam = await Exam.findOne({where:{id:req.body.examid, userId:req.session.userObject.id }})
    }

    if (!exam){
        exam.status = 3
        exam.save()
        req.flash("errormsg", "Exam not found, error : 1007")
        return res.status(500).render("error")
    }
    if (path.extname(req.file.originalname) != ".pdf"){
        req.flash("errormsg", "Veuillez uploader un fichier pdf")
        return res.render("upload/uploadScans", {exam:exam})
    }

    exam.status = 1
    exam.save()

    res.redirect("/see")

    try{
        callCorrection(req.file.originalname, exam)
    }
    catch(err){
        console.log(err)
        req.flash("errormsg", "Error while making the correction, error : 1007")
        return res.status(500).render("error")
    }
})

router.post("/scans/robot", upload.single("file"), async (req, res) => {
    // IMPORTANT GET THE EXAM //
    var exam = null; 
	if (req.params.token == "secretToken"){
        callCorrection(req.file.originalname, exam)
    }
    else{
        res.end("Error, you're not allowed to do that, please check your token")
    }
})

module.exports = router;