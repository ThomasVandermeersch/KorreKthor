const router = require('express-promise-router')();
const request = require('request');
const unzipper = require("unzipper")
const http = require('http');
const access = require('../node_scripts/hasAccess')
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

const url = `http://${process.env.PYTHON_SERVER_HOST}:${process.env.PYTHON_SERVER_PORT}`

// Call the python server (for correction)
function callCorrection(filename, exam, req){
    const formData = {
		my_field: "file",
		my_file: fs.createReadStream(`uploads/${filename}`),
	}
    
    request.post({url:`${url}/run`, formData:formData}, function (err, httpResponse, body) {
        if (err){
            exam.status = 3 // 3 = correction error
            exam.save()
        }
        else{
            zipFile = JSON.parse(body).zipFile
            const file = fs.createWriteStream(`zips/${zipFile}`);
            
            http.get(`${url}/static/${zipFile}`, function(response) {
                response.pipe(file);
            });
            
            file.on("finish", function(){
                fs.createReadStream(`zips/${zipFile}`).pipe(unzipper.Extract({ path: 'copies/' }));
            })

            if (exam.id == zipFile.split('.')[0]){
                correction.correctAll(exam, body, req)
            }
            else{
                exam.status = 3
                exam.save()
            }
        }
    })
}

router.get("/copies/:examid", access.hasAccess, async(req, res) => {
    Exam.findOne({where:{id:req.params.examid}}).then(exam =>{
        if (req.session.userObject.matricule == exam.userMatricule || req.session.userObject.authorizations == 0) res.render("upload/uploadScans", {exam:exam})
        else res.redirect('/noAccess')
        
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- UPLOAD/copies ---\n " + err)
        req.flash('errormsg', 'Internal error, error : 1015')
        res.redirect('/error')
    })
})

router.post("/scans/manual", access.hasAccess, upload.single("file"), async(req, res) => {
    if (path.extname(req.file.originalname) != ".pdf"){
        req.flash("errormsg", "Veuillez uploader un fichier pdf")
        return res.render("upload/uploadScans", {exam:exam})
    }
    
    Exam.findOne({where:{id:req.body.examid}}).then(exam =>{
        if (!exam){
            req.flash("errormsg", "Exam not found, error : 1007")
            return res.redirect('/error')
        }

        if (req.session.userObject.matricule == exam.userMatricule || req.session.userObject.authorizations == 0){
            exam.status = 1 // Process correction
            exam.save()

            req.flash("successmsg", "Début de la correction, ce processus peut prendre jusqu'a 10 minutes. Actualisez pour voir l'état.")
            res.redirect("/see")

            try{
                callCorrection(req.file.originalname, exam, req)
            }
            catch(err){
                console.log(" --- Call correction ERROR -- UPLOAD/scan/manual ---\n " + err)
                req.flash("errormsg", "Error while making the correction, error : 1007")
                return res.redirect('/error')
            }
        }

        else res.redirect('/noAccess')
        
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- UPLOAD/scan/manual ---\n " + err)
        req.flash('errormsg', 'Internal error, error : 1016')
        return res.redirect('/error')
    })
})

// router.post("/scans/robot", upload.single("file"), async (req, res) => {
//     // IMPORTANT GET THE EXAM //
//     var exam = null; 
// 	if (req.params.token == "secretToken"){
//         callCorrection(req.file.originalname, exam)
//     }
//     else{
//         res.end("Error, you're not allowed to do that, please check your token")
//     }
// })

module.exports = router;