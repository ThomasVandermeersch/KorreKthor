const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const path = require("path")
const { v4: uuidv4 } = require('uuid');
const loadScannedCopies = require('../node_scripts/loadScannedCopies')
const getExam = require('../node_scripts/database_calls/exam')


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

// This function render the upload page with the historic
router.get("/copies/:examid", access.hasAccess, getExam.getExam(), async(req, res) => {
        res.render("upload/uploadScans", {exam:res.locals.exam,historic:JSON.parse(res.locals.exam.historic)})
})


router.post("/scans/manual/:examid", access.hasAccess, upload.single("file"), getExam.getExam(), async(req, res) => {
    if (path.extname(req.file.filename) != ".pdf"){
        req.flash("errormsg", "Veuillez uploader un fichier pdf")
        return res.render("upload/uploadScans", {exam:exam})
    }
    
        // res.locals.exam.status = 1 // Process correction
        // getExam.saveExam(res.locals.exam,req,res,"Début de la correction, ce processus peut prendre jusqu'a 2 minutes. Actualisez pour voir l'état.","/see" )

        try { loadScannedCopies.loadScannedCopies(req.file.filename, res.locals.exam, req.session.userObject.fullName) }
        catch(err) { console.log(err) }
        req.flash('recorrectmsg', "Début de la correction, ce processus peut prendre jusqu'a 2 minutes.")
        res.redirect("/see/exam/" + req.params.examid)
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
