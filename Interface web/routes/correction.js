const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const corrector = require('../node_scripts/correction')
const sendEmail = require('../node_scripts/sendEmail');
const path = require("path")
const functions = require("../node_scripts/functions")
const matriculeConverter = require("../node_scripts/convertMatricule")
const getUser = require("../node_scripts/getUser");
const excelCorrection = require("../node_scripts/excelCorrection")

const getExam = require('../node_scripts/database_calls/exam')
const getCopy = require('../node_scripts/database_calls/copy')

const { v4: uuidv4 } = require('uuid');
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


router.get("/modifyCriteria/:examid", access.hasAccess, getExam.getExam(), (req,res)=>{
    return res.render('correction/modifyCriteria.pug', {correctionCriterias:JSON.parse(res.locals.exam.correctionCriterias), redirection:'modify', examId:req.params.examid})
})

router.get("/questionWeighting/:examid", access.hasAccess, getExam.getExam(), (req,res)=>{
    return res.render('correction/questionWeighting', {questionWeights:JSON.parse(res.locals.exam.corrections), exam:res.locals.exam})
})

router.get("/modifyAnswers/:examid", access.hasAccess, getExam.getExam(),(req,res)=>{
    return res.render('correction/modifyAnswers.pug',{correction:JSON.parse(res.locals.exam.corrections),examid:req.params.examid})
})

router.post('/modifyAnswers/:examid', access.hasAccess, getExam.getExam(), (req,res)=>{
    newCorrections = JSON.parse(req.body.liste)
    corrections = JSON.parse(res.locals.exam.corrections)
    Object.entries(corrections).forEach(([key,value]) =>{
        index = 0
        value.forEach(questionObject=>{
            if(questionObject.type == 'qcm'){
                questionObject.response = newCorrections[key][index].response
                index++
            }
        })
    });
    res.locals.exam.corrections = JSON.stringify(corrections)
    getExam.saveExam(res.locals.exam,req,res)
})

router.post('/modifyWeighting/:examid',access.hasAccess, getExam.getExam(), (req,res)=>{ 
    var index = 0
    var corrections = JSON.parse(res.locals.exam.corrections)
    Object.entries(corrections).forEach(([key,value]) =>{
        value.forEach(question=>{
            if(question.type != 'version'){
                question.weight = req.body.weight[index]
                index += 1  
            }
        })
    })
    res.locals.exam.corrections = JSON.stringify(corrections)
    getExam.saveExam(res.locals.exam,req,res)
})

router.get("/downloadExcel/:examid", access.hasAccess, getExam.getExam(true), (req,res)=>{
    return functions.exportStudents(res.locals.exam)
        .then(()=>{
            return res.download( path.resolve(res.locals.exam.excelFile), (err) => {
                if (err) console.log(" --- DOWNLOAD ERROR -- correction/downloadExcel/:examid ---\n " + err)
            });
        })
        .catch(err=>{
            console.log(" --- FILE EXPORT ERROR -- correction/downloadExcel/:examid ---\n ", err)
            req.flash('errormsg', 'File exportation error, error : 1042')
            return res.redirect("/error")
        })
})

router.post("/getUserName/:redirection", access.hasAccess, (req,res)=>{
    matricule = req.body.matricule.toLowerCase()
    getUser.getUser(matriculeConverter.matriculeToEmail(matricule),req,true,false).then(user=>{
        req.flash('newUserName', user.fullName)
        req.flash('newUserMatricule', user.matricule)

        if(req.params.redirection == 'colab') res.redirect('/see/collaborators/' + req.body.examId)
        else res.redirect('/see/copy/' + req.body.copyId)
    })
    .catch(err=>{
        req.flash('userNoExist', "L'utilisateur n'existe pas ! ")
        res.redirect('/see/collaborators/' + req.body.examId)
    })
})

router.post('/modifyImageTreatment/:copyid', access.hasAccess, getCopy.getCopy(), (req,res)=>{
    res.locals.copy.answers = req.body.response
    const correction = JSON.parse(res.locals.copy.exam.corrections) //GET corrections
    const correctionCriterias = JSON.parse(res.locals.copy.exam.correctionCriterias) //Get correction criterias
    
    corrector.correctionCopy( 
        correction,JSON.parse(req.body.response),correctionCriterias,res.locals.copy.version           
    ).then((newData) =>{
        res.locals.copy.result = newData.result
        res.locals.copy.version = newData.version
        res.locals.copy.answers = newData.newResponse
        res.locals.copy.save().then(copy=>{
            req.flash('successCotationChange',"La note de l'étudiant a été modifiée correctement ! ");
            res.redirect('/see/copies/'+copy.exam.id)
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- correction/modifyImageTreatment/:copyid ---\n " + err)
            req.flash('errormsg', 'Error while saving the copy, error : 1047')
            return res.redirect('/error')
        })
    })
    .catch(err=>{
        console.log(' ---Not normal to have an error here because lists have to match ---\n '+ err)
        req.flash('errorAnswerChange','Les listes ne correspondent pas, error : 1006');
        res.redirect('/see/copy/'+copy.id)
    })
})

router.get('/sendEmail/:copyid', access.hasAccess, getCopy.getCopy(includeUsers=true),(req,res)=>{
    return res.render('correction/complainEmail',{
        destinationName: res.locals.copy.exam.user.fullName,
        name:req.session.userObject.fullName,
        examName:res.locals.copy.exam.name,
        email: res.locals.copy.exam.user.email,
        object: `[ERREUR DE CORRECTION] ${res.locals.copy.exam.name}`,
        url:`https://${process.env.ENDPOINT}:9898/see/copy/${res.locals.copy.id}`,
        copyId:res.locals.copy.id
    })
})

router.post('/sendComplainEmail', access.hasAccess,(req,res)=>{
    sendEmail.sendEmail(req.body.email, req.session.userObject.email, req.body.object, req.body.message)
    .then(()=>{
        req.flash('successEmail','Email envoyé');
        res.redirect('/see/copy/' + req.body.copyId)
    })
    .catch(err=>{
        console.log(err)
        req.flash('failEmail',"Erreur dans l'envoi de l'email");
        res.redirect('/correction/sendEmail/'+ req.body.copyId)
    })
})

router.post("/updateUser/:copyid", access.hasAccess, getCopy.getCopy(), async (req, res) => {
    const userEmail = matriculeConverter.matriculeToEmail(req.body.newMatricule)
    getUser.getUser(userEmail,req)
        .then(user=>{
            res.locals.copy.userMatricule = user.matricule
            res.locals.copy.save()
            req.flash('successNameChange',"L'étudiant " + user.fullName  + " a été assigné.")
            res.redirect(`/see/copies/${req.body.examId}`)
        })
        .catch(err=>{
            console.log(err)
            req.flash('errormsg', "Somthing went wrong while changing the user, error : 1005");
            res.render("index/error")
        })
})

router.post('/changeCopyStatus/:examid',access.hasAccess, getExam.getExam(), (req,res)=>{    

    res.locals.exam.copyViewAvailable = req.body.copyViewAvailable
    getExam.saveExam(res.locals.exam,req,res,"La visibilité des copies a été changé avec succès.")
});

router.post("/sendCotationCriteria/:redirection/:examid", access.hasAccess, getExam.getExam, (req, res)=>{
    res.locals.exam.correctionCriterias = JSON.stringify(req.body)
    if(req.params.redirection == 'create') getExam.saveExam(res.locals.exam,req,res,"",'/create/Step5')
    else getExam.saveExam(res.locals.exam,req,res)
})

router.post("/uploadAnswersExcel/:examid", access.hasAccess, upload.single("file"), getExam.getExam, async(req, res) => {
    if (path.extname(req.file.filename) != ".xlsx"){
        req.flash("errormsg", "Veuillez uploader un fichier Excel")
        return res.redirect('/correction/modifyAnswers/'+req.params.examid)
    }
    pathToExcel = './uploads/' + req.file.filename
    excelCorrection.updateCorrectionByExcel(pathToExcel,res.locals.exam.corrections).then(newCorrection=>{
        res.locals.exam.corrections = JSON.stringify(newCorrection)
        getExam.saveExam(res.locals.exam,req,res)
    }).catch(err=>{
        req.flash('errormsg', err)
        console.log(err)
        return res.redirect('/correction/modifyAnswers/'+req.params.examid)
    })
})

router.get("/tutorial",access.hasAccess,(req,res)=>{
    res.render('correction/instructionsExcel')
})

module.exports = router