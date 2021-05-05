const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const path = require("path")
const { Exam, Copy, User } = require("../node_scripts/database/models");
const { computeMean, computeVariance, computeZero, computeParticipants } = require("../node_scripts/stats")
const matriculeConverter = require('../node_scripts/convertMatricule')
const getUser = require('../node_scripts/getUser');
const { query } = require('express');

router.get("/", access.hasAccess, async (req, res) => {
    const userMatricule = req.session.userObject.matricule
    var query;
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
        req.flash('errormsg', 'Database error, error : 1017')
        res.redirect('/error')
    })
})

router.get("/copies/:examid", access.hasAccess, async (req, res) => {
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}]}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}]}

    Exam.findOne(query).then(exam=>{
        if (exam){
            var mean = computeMean(exam.copies)
            stats = {"mean": mean, "var":computeVariance(exam.copies, mean), "participants":computeParticipants(exam.copies), "blancs":computeZero(exam.copies), "worstQuestionQtt":13, "worstQuestionNum":5, "bestQuestionQtt":16, "bestQuestionNum":2}
            return res.render("see/showCopies", {exam:exam, stats:stats})
        }
        console.log(" --- EXAM DOES NOT EXIST ERROR -- SEE/copies ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1019')
        return res.redirect("/error")
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copies ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1020')
        return res.redirect('/error')
    })
})

router.get("/exam/:examid", access.hasAccess, async (req, res) => {
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if (exam) return res.render("see/showExam", {exam:exam})
        
        console.log(" --- EXAM DOES NOT EXIST ERROR -- SEE/exam ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1019')
        return res.redirect("/error")
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copies ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1021')
        return res.redirect('/error')
    })
})

router.get("/copy/:copyid", access.hasAccess, async (req, res) => {
    const userMatricule = req.session.userObject.matricule

    Copy.findOne({where:{id:req.params.copyid}, include:[{model:User, as:"user"}, {model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{
        if (copy){
            const examOwner = copy.exam.user.matricule
            const copyOwner = copy.userMatricule
            
            if (examOwner == userMatricule || copyOwner == userMatricule || req.session.userObject.authorizations == 0){
                return res.render("see/showCopy", {copy:copy})
            }
            return res.redirect("/noAccess")
        }
        console.log(" --- COPY DOES NOT EXIST ERROR -- SEE/copy ---\n ")
        req.flash('errormsg', 'This copy does not exist, error : 1022')
        return res.redirect('/error')

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copy ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1023')
        return res.redirect('/error')
    })
})

router.get("/exam/:examid/downloadresult", access.hasAccess, async (req, res) => {
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")
   
    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if (exam && exam.examFile){
            return res.download(
                path.resolve(exam.examFile),
                (err) => {
                    if (err){
                        console.log(" --- DOWNLOAD ERROR -- SEE/exam/downloadresult ---\n " + err)
                        req.flash('errormsg', 'Error while downloading the file, error : 1024')
                        return res.redirect('/error')
                    } 
                }
            );
        }
        else{
            console.log(" --- EXAM DOES NOT EXIST ERROR -- SEE/exam/downloadresult ---\n " + err)
            req.flash('errormsg', 'This exam does not exist, error : 1025')
            return res.redirect('/error')
        }
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/exam/downloadresult ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1026')
        return res.redirect('/error')
    })
});

router.get("/exam/:examid/downloadcorrection", access.hasAccess, async (req, res) => {
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")
   
    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if (exam && exam.correctionFile){
            return res.download(
                path.resolve(exam.correctionFile),
                (err) => {
                    if (err){
                        console.log(" --- DOWNLOAD ERROR -- SEE/exam/downloadcorrection ---\n " + err)
                        req.flash('errormsg', 'Error while downloading the file, error : 1027')
                        return res.redirect('/error')
                    } 
                }
            );
        }
        else{
            console.log(" --- EXAM DOES NOT EXIST ERROR -- SEE/exam/downloadcorrection ---\n " + err)
            req.flash('errormsg', 'This exam does not exist, error : 1028')
            return res.redirect('/error')
        }
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/exam/downloadcorrection ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1029')
        return res.redirect('/error')
    })
});

router.get("/copy/:copyid/download", access.hasAccess, async (req, res) => {
    const userMatricule = req.session.userObject.matricule

    Copy.findOne({where:{id:req.params.copyid}, include:[{model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{
        if (copy){
            const examOwner = copy.exam.user.matricule
            const copyOwner = copy.userMatricule
            
            if (examOwner == userMatricule || copyOwner == userMatricule || req.session.userObject.authorizations == 0){
                return res.download(
                    path.resolve(`copies/${copy.file}`),
                    (err) => {
                        if (err) {
                            console.log(" --- DOWNLOAD ERROR -- SEE/copy/download ---\n " + err)
                            req.flash('errormsg', 'Error while downloading the file, error : 1030')
                            return res.redirect('/error')
                        }
                    }
                );
            }
            return res.redirect("/noAccess")
        }
        console.log(" --- COPY DOES NOT EXIST ERROR -- SEE/copy ---\n ")
        req.flash('errormsg', 'This copy does not exist, error : 1031')
        return res.redirect('/error')

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copy ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1032')
        return res.redirect('/error')
    })
});

module.exports = router;