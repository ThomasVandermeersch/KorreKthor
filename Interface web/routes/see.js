const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
const path = require("path")
const { User, Exam, Copy } = require("../node_scripts/database/models");

router.get("/", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exams = await Exam.findAll({where:{userId:userid}})
    var examCopies = await Copy.findAll({where:{userId:userid}})
    
    const copies = []
    for (copy of examCopies){
        var exam = await copy.getExam()
        copies.push({"copy":copy, "exam":exam})
    };
    res.render("showExams", {exams:exams, copies:copies})
})

router.get("/copies/:examid", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    var examCopies = await exam.getCopies()

    const copies = []
    for (copy of examCopies){
        user = await copy.getUser()
        copies.push({"copy":copy, "user":user})
    };

    stats = {"mean": 16, "var":2, "participants":154, "blancs":14, "worstQuestionQtt":13, "worstQuestionNum":5, "bestQuestionQtt":16, "bestQuestionNum":2}
    res.render("showCopies", {exam:exam, copies:copies, stats:stats})
})

router.get("/exam/:examid", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    if (exam){
        res.render("showExam", {exam:exam})
    }
    else{
        res.status(404).redirect("/error")
    }
})

router.get("/copy/:copyid", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var copy = await Copy.findOne({where:{id:req.params.copyid, userId:userid}})
    var exam = await copy.getExam()

    if (copy){
        res.render("showCopy", {exam:exam, copy:copy})
    }
    else{
        res.status(404).redirect("/error")
    }
})

router.get("/exam/:examid/downloadresult", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    
    if (exam.examFile){
        res.download(
            path.resolve(exam.examFile),
            (err) => {
                if (err) res.status(404).render("error");
            }
        );
    }
    else {
        res.status(404).render("error");
    }
});

router.get("/exam/:examid/downloadcorrection", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exam = await Exam.findOne({where:{id:req.params.examid, userId:userid}})
    
    if (exam.correctionFile){
        res.download(
            path.resolve(exam.correctionFile),
            (err) => {
                if (err) res.status(404).render("error");
            }
        );
    }
    else {
        res.status(404).render("error");
    }
});

router.get("/copy/:copyid/download", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var copy = await Copy.findOne({where:{id:req.params.copyid, userId:userid}})

    if (copy.file){
        res.download(
            path.resolve(copy.file),
            (err) => {
                if (err) res.status(404).render("error");
            }
        );
    }
    else {
        res.status(404).render("error");
    }
});

module.exports = router;