const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
const { User, Exam, Copy } = require("../node_scripts/database/models");
const corrector = require('../node_scripts/correction')
const sendEmail = require('../node_scripts/sendEmail');

router.get("/modifyCriteria/:examId", acces.hasAcces, async (req,res)=>{
    var exam = await Exam.findOne({where:{id:req.params.examId}})
    var a = await exam.getUser()
    var b = await req.session.userObject

//     if (a.id !== b.id){
//             return res.status(403).render('index/noAcces')
//     }

    var correctionCriterias = JSON.parse(exam.correctionCriterias)
    correctionCriterias['redirection'] = 'modify'
    req.session['examId'] = req.params.examId        
    console.log(correctionCriterias)
    res.render('correction/modifyCriteria.pug', correctionCriterias)
})

router.get("/questionStatus/:examId",async (req,res)=>{
    const exam = await Exam.findOne({where:{id:req.params.examId}})
    const questionStatus = JSON.parse(exam.questionStatus)
    res.render('correction/questionStatus',{questionStatus:questionStatus, exam:exam})
})

router.post('/modifyQuestionStatus/:examId',async(req,res)=>{
    console.log(req.body.questionStatusObject)
    
    var questionStatus = JSON.parse(req.body.questionStatusObject)
    var newStatus = req.body.type
    var index = 0
    Object.entries(questionStatus).forEach(([key,value]) =>{
            slice = newStatus.slice(index, index + value.length);
            index += value.length
            questionStatus[key] = slice
    });
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

router.post('/modifyImageTreatment/:copyId',acces.hasAcces, async (req,res)=>{
    console.log(req.body)
    var copy = await Copy.findOne({where:{id:req.params.copyId}})
    const exam = await Exam.findOne({where:{id:copy.examId}})
    copy.answers = req.body.response
    
    const corrections = JSON.parse(exam.corrections)
    const correction = corrections[copy.version]
    const correctionCriterias = JSON.parse(exam.correctionCriterias)
    var questionStatus = JSON.parse(exam.questionStatus)
    questionStatus = questionStatus[copy.version]
    // console.log('---correction---')
    // console.log(correction)
    // console.log('---correction---')
    // console.log(req.)
    corrector.correctionCopy( 
            correction,JSON.parse(req.body.response),questionStatus,correctionCriterias           

    )
    .then(async (newResult) =>{
        console.log(newResult)
        copy.result = newResult      
        await copy.save()
        req.flash('successAnswerChange','Les réponses ont été correctement enregistrées');
        res.redirect('/see/copy/'+req.params.copyId)
    })
    .catch(err=>{
            console.log(err + ' ---Not normal to have an error here because lists have to match')
    })
})

router.post('/sendComplainEmail',acces.hasAcces,(req,res)=>{
    sendEmail.sendEmail(req.body.email,req.session.userObject.email,req.body.object,req.body.message)
    .then(response=>{
            console.log(response)
            //req.flash('successEmail','Email envoyé');
            //res.redirect('' )
            console.log(req.body)
            console.log(req.body.copyId)
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