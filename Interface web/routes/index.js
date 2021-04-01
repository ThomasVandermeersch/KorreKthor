
const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
const { User, Exam, Copy } = require("../node_scripts/database/models");

app.get("/", acces.hasAcces, function(req,res){
        //res.render('index',{name:"Beta"})    
        res.render('index',{name:req.session.userObject.fullName})    
});

app.get("/viewProfile", acces.hasAcces, function(req,res){
        //res.render('index',{name:"Beta"})    
        res.render('viewProfile')    
});

app.get("/noAcces", acces.hasAcces, function(req,res){
        //res.render('index',{name:"Beta"})
        res.status(403)    
        res.render('noAcces')    
});

app.get("/modifyCriteria/:examId", acces.hasAcces, async (req,res)=>{
        var exam = await Exam.findOne({where:{id:req.params.examId}})
        var a = await exam.getUser()
        var b = await req.session.userObject

        if (a.id !== b.id){
                return res.status(403).render('noAcces')
        }

        var correctionCriterias = JSON.parse(exam.correctionCriterias)
        req.session['examId'] = req.params.examId        
        console.log(correctionCriterias)
        res.render('modifyCriteria.pug', correctionCriterias)
})

app.get("/questionStatus/:examId",async (req,res)=>{
        const exam = await Exam.findOne({where:{id:req.params.examId}})
        const questionStatus = JSON.parse(exam.questionStatus)
        res.render('questionStatus',{questionStatus:questionStatus, exam:exam})
})

app.post('/modifyQuestionStatus/:examId',async(req,res)=>{
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
        exam.save()
        res.redirect(`/see/exam/${req.params.examId}`)
})


 app.get('/sendEmail/:copyid',acces.hasAcces, async(req,res)=>{
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
 
                res.render('emailForm',{
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
                res.render("/error")
        }
})

const sendEmail = require('../node_scripts/sendEmail');
const exam = require('../node_scripts/database/models/exam');
app.post('/sendComplainEmail',acces.hasAcces,(req,res)=>{
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
                res.redirect('/sendEmail/'+ req.body.copyId)

        })
        
})


module.exports = router
