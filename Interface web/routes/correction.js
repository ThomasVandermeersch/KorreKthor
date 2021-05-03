const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const { Exam, Copy, User } = require("../node_scripts/database/models");
const corrector = require('../node_scripts/correction')
const sendEmail = require('../node_scripts/sendEmail');
const path = require("path")
const functions = require("../node_scripts/functions")

router.get("/modifyCriteria/:examId", access.hasAccess,(req,res)=>{
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if(exam){
            var correctionCriterias = JSON.parse(exam.correctionCriterias)
            correctionCriterias['redirection'] = 'modify'
            req.session['examId'] = req.params.examId        
            return res.render('correction/modifyCriteria.pug', correctionCriterias)
        }
        console.log(" --- EXAM DOES NOT EXIST ERROR -- correction/modifyCriteria/examId ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1019')
        return res.redirect("/error")

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyCriteria/:examId ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1020')
        return res.redirect('/error')
    })
})

router.get("/questionStatus/:examId", access.hasAccess,(req,res)=>{
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if(exam) return res.render('correction/questionStatus',{questionStatus:JSON.parse(exam.questionStatus), exam:exam})

        console.log(" --- EXAM DOES NOT EXIST ERROR -- correction/questionStatus/:examId ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1019')
        return res.redirect("/error")

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/questionStatus/:examId ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1020')
        return res.redirect('/error')
    })
})

router.get('/sendEmail/:copyid',access.hasAccess, async(req,res)=>{
    var copy;
    if (req.session.userObject.authorizations == 0){
        copy = await Copy.findOne({where:{id:req.params.copyid}})
    }
    else{
        copy = await Copy.findOne({where:{id:req.params.copyid, userId:req.session.userObject.id}})
    }

    var user = await copy.getUser()
    var exam = await copy.getExam()
    var prof = await exam.getUser()

    if (copy && user && exam && prof){
        res.render('correction/complainEmail',{
                destinationName: prof.fullName,
                name:req.session.userObject.fullName,
                examName:exam.name,
                email: prof.email,
                object: `[CORRECTION ERROR] ${exam.name}`,
                url:`https://localhost:9898/see/copy/${copy.id}`,
                copyId:copy.id
        })
    }
    else{
        res.render("index/error")
    }
})

router.get("/downloadExcel/:examId", access.hasAccess, async (req,res)=>{
    const exam = await Exam.findOne({where:{id:req.params.examId}, attributes:["excelFile"], include:[{model:Copy, as:"copies", attributes:["result", "version"], include:[{model:User, as:"user", attributes:["matricule", "fullName", "role"]}]}]})
    const excelFilePath =  exam.excelFile

    data = {}
    exam.copies.forEach((copy) => {
        data[copy.user.matricule] = copy
    })
    
    err = await functions.exportStudents({"name":exam.name, "excelFile":exam.excelFile, "id":exam.id}, data)

    if (err){
        req.flash("errormsg", err)
        return res.status(500).render("index/error")
    }

    res.download(
        path.resolve(excelFilePath),
        (err) => {
            if (err) res.status(404).send("<h1>File Not found: 404</h1>");
        }
    );
})


router.post('/modifyQuestionStatus/:examId',async(req,res)=>{ 
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}
    
    Exam.findOne(query).then(exam=>{
        if(!exam){
            console.log(" --- EXAM DOES NOT EXIST ERROR -- POST correction/modifyQuestionStatus/examId ---\n ")
            req.flash('errormsg', 'This exam does not exist, error : 1019')
            return res.redirect("/error")
        }
        var questionStatus = JSON.parse(req.body.questionStatusObject)
        var newStatus = req.body.type
        var index = 0
        Object.entries(questionStatus).forEach(([key,value]) =>{
            slice = newStatus.slice(index, index + value.length);
            index += value.length
            questionStatus[key] = slice
        })
        exam.questionStatus = JSON.stringify(questionStatus)
        exam.save().then(exam=>{
            corrector.reCorrect(req.params.examId).then(suc=>{
                req.flash('recorrectmsg', 'Question status saved and exam recorrect successfuly')
                return res.redirect(`/see/exam/${req.params.examId}`)
            })
            .catch(err=>{
                console.log(" ---  ERROR WHILE RECORECT EXAM -- POST correction/modifyQuestionStatus/examId ---\n " +err)
                req.flash('errormsg', 'Error while re-correct exam, error : 1019')
                return res.redirect("/error")
            })
        }).catch(err=>{
            console.log(" ---  ERROR WHILE SAVING EXAM -- POST correction/modifyQuestionStatus/examId ---\n " + err)
            req.flash('errormsg', 'Error while saving exam, error : 1019')
            return res.redirect("/error")
        })
    }).cath(err=>{
        console.log(" --- DATABASE ERROR -- correction/questionStatus/:examId ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1020')
        return res.redirect('/error')
    })
})



router.post('/modifyImageTreatment/:copyId', access.hasAccess, async (req,res)=>{
    
    var copy = await Copy.findOne({where:{id:req.params.copyId}})
    const exam = await Exam.findOne({where:{id:copy.examId}})
    copy.answers = req.body.response
    
    const corrections = JSON.parse(exam.corrections) //GET corrections
    const correction = corrections[copy.version] //Get correction of the version
    const correctionCriterias = JSON.parse(exam.correctionCriterias) //Get correction criterias
    var questionStatus = JSON.parse(exam.questionStatus) //Get question status
    questionStatus = questionStatus[copy.version] //Get question status of the version

    corrector.correctionCopy( 
        correction,JSON.parse(req.body.response),questionStatus,correctionCriterias           
    )
    .then(async (newResult) =>{
        copy.result = newResult      
        copy.save()
        req.flash('successCotationChange',"La note de l'étudiant a été modifiée correctement ! ");
        res.redirect('/see/copies/'+exam.id)
    })
    .catch(err=>{
        console.log(err + ' ---Not normal to have an error here because lists have to match')
        req.flash('errorAnswerChange','Les listes ne correspondent pas, error : 1006');
        res.redirect('/see/copy/'+copy.id)
    })
})

router.post('/sendComplainEmail',access.hasAccess,(req,res)=>{
    sendEmail.sendEmail(req.body.email,req.session.userObject.email,req.body.object,req.body.message)
    .then(response=>{
        req.flash('successEmail','Email envoyé');
        res.redirect('/see/copy/' + req.body.copyId)
    })
    .catch(err=>{
        console.log(err)
        req.flash('failEmail',"Erreur dans l'envoi de l'email");
        res.redirect('/correction/sendEmail/'+ req.body.copyId)
    })
})

module.exports = router