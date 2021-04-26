const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
const { Exam, Copy, User } = require("../node_scripts/database/models");
const corrector = require('../node_scripts/correction')
const sendEmail = require('../node_scripts/sendEmail');
const path = require("path")
const functions = require("../node_scripts/functions")

router.get("/modifyCriteria/:examId", acces.hasAcces, async (req,res)=>{
    var exam = await Exam.findOne({where:{id:req.params.examId}})

    var correctionCriterias = JSON.parse(exam.correctionCriterias)
    correctionCriterias['redirection'] = 'modify'
    req.session['examId'] = req.params.examId        
    res.render('correction/modifyCriteria.pug', correctionCriterias)
})

router.get("/questionStatus/:examId", acces.hasAcces, async (req,res)=>{
    const exam = await Exam.findOne({where:{id:req.params.examId}})
    const questionStatus = JSON.parse(exam.questionStatus)
    res.render('correction/questionStatus',{questionStatus:questionStatus, exam:exam})
})

router.post('/modifyQuestionStatus/:examId',async(req,res)=>{    
    var questionStatus = JSON.parse(req.body.questionStatusObject)
    var newStatus = req.body.type
    var index = 0
    Object.entries(questionStatus).forEach(([key,value]) =>{
        slice = newStatus.slice(index, index + value.length);
        index += value.length
        questionStatus[key] = slice
    })

    var exam = await Exam.findOne({where:{id:req.params.examId}})
    exam.questionStatus = JSON.stringify(questionStatus)
    await exam.save()

    corrector.reCorrect(req.params.examId).then(suc=>{
        res.redirect(`/see/exam/${req.params.examId}`)
    })
    .catch(err=>{
        console.log(err)
        res.end('Problem')
    })
})

router.get('/sendEmail/:copyid',acces.hasAcces, async(req,res)=>{
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

router.post('/modifyImageTreatment/:copyId', acces.hasAcces, async (req,res)=>{
    console.log(req.body)
    var copy = await Copy.findOne({where:{id:req.params.copyId}})
    const exam = await Exam.findOne({where:{id:copy.examId}})
    copy.answers = req.body.response
    
    const corrections = JSON.parse(exam.corrections)
    const correction = corrections[copy.version]
    const correctionCriterias = JSON.parse(exam.correctionCriterias)
    var questionStatus = JSON.parse(exam.questionStatus)
    questionStatus = questionStatus[copy.version]

    corrector.correctionCopy( 
        correction,JSON.parse(req.body.response),questionStatus,correctionCriterias           
    )
    .then(async (newResult) =>{
        copy.result = newResult      
        copy.save()
        res.redirect('/see/copies/'+exam.id)
    })
    .catch(err=>{
        console.log(err + ' ---Not normal to have an error here because lists have to match')
        req.flash('errorAnswerChange','Les listes ne correspondent pas, error : 1006');
        res.redirect('/see/copy/'+copy.id)
    })
})

router.post('/sendComplainEmail',acces.hasAcces,(req,res)=>{
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

router.get("/downloadExcel/:examId", acces.hasAcces, async (req,res)=>{
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


module.exports = router