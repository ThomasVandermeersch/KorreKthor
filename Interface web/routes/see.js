const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
const path = require("path")
const { User, Exam, Copy } = require("../node_scripts/database/models");
const exam = require('../node_scripts/database/models/exam');

router.get("/", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exams = await Exam.findAll({where:{userId:userid}})
    var copies = await Copy.findAll({where:{userId:userid}})
    res.render("showExams", {exams:exams, copies:copies})
})

router.get("/exam/:examid", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    if (exam){
        res.render("showExam", {exam:exam})
    }
    else{
        res.status(404).redirect("/noAcces")
    }
})

router.get("/copy/:copyid", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var copy = await Copy.findOne({where:{id:req.params.copyid, userId:userId}})

    if (copy){
        res.render("showCopy", {copy:copy})
    }
    else{
        res.status(404).redirect("/noAcces")
    }
})

router.get("/exam/:examid/downloadresult", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    
    if (exam.examFile){
        res.download(
            path.resolve(exam.examFile),
            (err) => {
                if (err) res.status(404).render("noAcces");
            }
        );
    }
    else {
        res.status(404).render("noAcces");
    }
});

router.get("/exam/:examid/downloadcorrection", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    
    if (exam.correctionFile){
        res.download(
            path.resolve(exam.correctionFile),
            (err) => {
                if (err) res.status(404).render("noAcces");
            }
        );
    }
    else {
        res.status(404).render("noAcces");
    }
});

module.exports = router;