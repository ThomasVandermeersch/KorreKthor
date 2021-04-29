const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const path = require("path")
const { Exam, Copy, User } = require("../node_scripts/database/models");
const { computeMean, computeVariance, computeZero, computeParticipants } = require("../node_scripts/stats")
const matriculeConverter = require('../node_scripts/convertMatricule')
const getUser = require('../node_scripts/getUser')

router.get("/", access.hasAccess, async (req, res) => {
    const userMatricule = req.session.userObject.matricule

    if (req.session.userObject.authorizations == 0) query = {order:[["createdAt", "DESC"]]}
    else query = {where:{userMatricule:userMatricule}, order:[["createdAt", "DESC"]]}
    
    Exam.findAll(query).then(exams=>{
        console.log(exams)
        if (req.session.userObject.authorizations != 0) {
            query.include = [{model:Exam, as:'exam', attributes:["name"]}]
            Copy.findAll(query).then(copies=>{
                return res.render("see/showExams", {exams:exams, copies:copies})
            })
        }
        else return res.render("see/showExams", {exams:exams, copies:[]})

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/ ---\n " + err)
        req.flash('errormsg', 'Database error error, error : 1017')
        res.redirect('/error')
    })
})

router.get("/copies/:examid", access.hasAccess, async (req, res) => {
    var exam;
    var examCopies;

    if (req.session.userObject.authorizations == 0){
        exam = await Exam.findOne({where:{id:req.params.examid}})
        examCopies = await exam.getCopies()
    }
    else {
        exam = await Exam.findOne({where:{id:req.params.examid, userMatricule:req.session.userObject.matricule}})
        examCopies = await exam.getCopies()
    } 

    const copies = []
    for (copy of examCopies){
        var user = await copy.getUser()
        console.log(user.fullName)
        copies.push({"copy":copy, "user":user})
    };

    var mean = computeMean(examCopies)
    stats = {"mean": mean, "var":computeVariance(examCopies, mean), "participants":computeParticipants(examCopies), "blancs":computeZero(examCopies), "worstQuestionQtt":13, "worstQuestionNum":5, "bestQuestionQtt":16, "bestQuestionNum":2}
    res.render("see/showCopies", {exam:exam, copies:copies, stats:stats})
})

router.get("/exam/:examid", access.hasAccess, async (req, res) => {
    var exam;
    if (req.session.userObject.authorizations == 0){
        var exam = await Exam.findOne({where:{id:req.params.examid}, })
    }
    else{
        var exam = await Exam.findOne({where:{id:req.params.examid, userMatricule:req.session.userObject.matricule, include:{model:User, as:"user"}}, include:[{model:User, as:"user"}]})
    }

    if (exam){
        res.render("see/showExam", {exam:exam})
    }
    else{
        res.status(404).redirect("/error")
    }
})

router.get("/copy/:copyid", access.hasAccess, async (req, res) => {
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

router.get("/exam/:examid/downloadresult", access.hasAccess, async (req, res) => {
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

router.get("/exam/:examid/downloadcorrection", access.hasAccess, async (req, res) => {
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

router.get("/copy/:copyid/download", access.hasAccess, async (req, res) => {
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

router.post("/updateUser/", access.hasAccess, async (req, res) => {
    if (req.session.userObject.role == 1 || req.session.userObject.authorizations == 0){


        const userEmail = matriculeConverter.matriculeToEmail(req.body.newMatricule)
        getUser.getUser(userEmail,req)
            .then(user=>{
                Copy.findOne({where:{id:req.body.copyId}})
                .then(copy=>{
                    console.log("update userId")
                    copy.userId = user.id
                    copy.save()
                    console.log(user)
                    req.flash('successNameChange',"L'étudiant " + user.fullName  + " a été assigné.")
                    res.redirect(`/see/copies/${req.body.matricule.split("_")[0]}`)
                })
                .catch(err=> {
                    console.log(err)
                    req.flash('errormsg', "Somthing went wrong while saving the copy, error : 1004");
                    res.render("index/error")
                })
            })
            .catch(err=>{
                console.log(err)
                req.flash('errormsg', "Somthing went wrong while changing the user, error : 1005");
                res.render("index/error")
            })
    }
    else{
        res.render("index/noAcces")
    }
})

module.exports = router;