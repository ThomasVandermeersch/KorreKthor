
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
        var correctionCriterias = JSON.parse(exam.correctionCriterias)
        req.session['examId'] = req.params.examId        
        console.log(correctionCriterias)
        res.render('modifyCriteria.pug', correctionCriterias)
})

app.get("/questionStatus",(req,res)=>{
        const questionStatus = {
                "A": ['normal','normal','cancelled','cancelled','normal'],
                "B": ['normal','normal','normal','normal','normal'],
                "C": ['normal','normal','normal','normal','normal'], 
            }
        res.render('questionStatus',{questionStatus:questionStatus})
})

app.post('/modifyQuestionStatus',(req,res)=>{
        console.log(req.body.questionStatusObject)
        
        var questionStatus = JSON.parse(req.body.questionStatusObject)
        var newStatus = req.body.type
        var index = 0
        Object.entries(questionStatus).forEach(([key,value]) =>{
                slice = newStatus.slice(index, index + value.length);
                index += value.length
                questionStatus[key] = slice
        });

        res.send(questionStatus)
})



module.exports = router
