
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
        res.render('questionStatus',{questionStatus:questionStatus,examId:req.params.examId})
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
        res.redirect('/')
})

app.get('/sendEmail',acces.hasAcces,(req,res)=>{
        res.render('emailForm',{
                destinationName: 'Thomas Vandermeersch',
                name:req.session.userObject.fullName,
                examName:'Mécanique des fluides',
                email: '17030@ecam.be',
                object: '[CORRECTION ERROR] Mécanique des fluides',
                url:'www.facebook.com'
        })
})

const sendEmail = require('../node_scripts/sendEmail')
app.post('/sendComplainEmail',acces.hasAcces,(req,res)=>{
        sendEmail.sendEmail(req.body.email,req.session.userObject.email,req.body.object,req.body.message)
        .then(response=>{
                console.log(response)
                res.send("EMAIL SEND")
        })
        .catch(err=>{
                console.log(err)
                res.status(500).end("ERROR WHILE SENDING EMAIL")
        })
        
})


module.exports = router
