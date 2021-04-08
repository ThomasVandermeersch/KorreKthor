const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
const path = require("path")
const { Exam, Copy, User } = require("../node_scripts/database/models");

router.get("/", acces.hasAcces, async (req, res) => {
    userid = req.session.userObject.id
    var exams;
    var examCopies;

    if (req.session.userObject.authorizations == 0){
        exams = await Exam.findAll({order:["createdAt"]})
        examCopies = await Copy.findAll({order:["createdAt"], include:[{model:User, as:'user'}]})
    }
    else {
        exams = await Exam.findAll({where:{userId:userid}, order:["createdAt"]})
        examCopies = await Copy.findAll({where:{userId:userid}, order:["createdAt"], include:[{model:User, as:'user'}]})
    }   
    
    const copies = []
    for (copy of examCopies){
        var exam = await copy.getExam()
        copies.push({"copy":copy, "exam":exam})
    };
    res.render("see/showExams", {exams:exams, copies:copies})
})

router.get("/copies/:examid", acces.hasAcces, async (req, res) => {
    var exam;
    var examCopies;

    if (req.session.userObject.authorizations == 0){
        exam = await Exam.findOne({where:{id:req.params.examid}})
        examCopies = await exam.getCopies()
    }
    else {
        exam = await Exam.findOne({where:{id:req.params.examid, userId:req.session.userObject.id}})
        examCopies = await exam.getCopies()
    } 

    const copies = []
    for (copy of examCopies){
        var user = await copy.getUser()
        console.log(user.fullName)
        copies.push({"copy":copy, "user":user})
    };

    stats = {"mean": 16, "var":2, "participants":154, "blancs":14, "worstQuestionQtt":13, "worstQuestionNum":5, "bestQuestionQtt":16, "bestQuestionNum":2}
    res.render("see/showCopies", {exam:exam, copies:copies, stats:stats})
})

router.get("/exam/:examid", acces.hasAcces, async (req, res) => {
    var exam;
    if (req.session.userObject.authorizations == 0){
        var exam = await Exam.findOne({where:{id:req.params.examid}})
    }
    else{
        var exam = await Exam.findOne({where:{id:req.params.examid, userId:req.session.userObject.id}})
    }

    if (exam){
        res.render("see/showExam", {exam:exam})
    }
    else{
        res.status(404).redirect("/error")
    }
})

router.get("/copy/:copyid", acces.hasAcces, async (req, res) => {
    var exam;
    var copy;

    if (req.session.userObject.authorizations == 0 || req.session.userObject.role == 1){
        var copy = await Copy.findOne({where:{id:req.params.copyid}, include:[{model:User, as:'user'}]})
        var exam = await copy.getExam()
    }
    else{
        var copy = await Copy.findOne({where:{id:req.params.copyid, userId:req.session.userObject.id}, include:[{model:User, as:'user'}]})
        var exam = await copy.getExam()
    }
    
    if (copy && exam){
        res.render("see/showCopy", {exam:exam, copy:copy})
    }
    else{
        res.status(404).redirect("/error")
    }
})

router.get("/exam/:examid/downloadresult", acces.hasAcces, async (req, res) => {
    var exam;

    if (req.session.userObject.authorizations == 0){
        exam = await Exam.findOne({where:{id:req.params.examid}})
    }
    else{
        exam = await Exam.findOne({where:{id:req.params.examid, userId:req.session.userObject.id}})
    }
    
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
    var exam;
    
    if (req.session.userObject.authorizations == 0){
        exam = await Exam.findOne({where:{id:req.params.examid}})
    }
    else{
        exam = await Exam.findOne({where:{id:req.params.examid, userId:req.session.userObject.id}})
    }
    
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
    var copy;
    
    if (req.session.userObject.authorizations == 0 || req.session.userObject.role == 1){
        copy = await Copy.findOne({where:{id:req.params.copyid}})
    }
    else{
        copy = await Copy.findOne({where:{id:req.params.copyid, userId:req.session.userObject.id}})
    }

    if (copy.file){
        res.download(
            path.resolve(`copies/${copy.file}`),
            (err) => {
                if (err) res.status(404).render("error");
            }
        );
    }
    else {
        res.status(404).render("error");
    }
});

router.post("/updateUser/", acces.hasAcces, async (req, res) => {
    if (req.session.userObject.role == 1 || req.session.userObject.authorizations == 0){
        User.findOne({where:{matricule:req.body.matricule}}).then((user) => {
            user.fullName = "dddddd"
            user.email = ""
            user.matricule = req.body.matricule
            user.save()

            res.redirect(`/see/copies/${req.body.matricule.split("_")[0]}`)

        }).catch((err) => {
            res.render("index/error")
        })
    }
    else{
        res.render("index/noAcces")
    }
});

module.exports = router;