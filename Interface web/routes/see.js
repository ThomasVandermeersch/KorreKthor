const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const path = require("path")
const { Exam, Copy, User } = require("../node_scripts/database/models");
const { computeMean, computeVariance, computeZero, computeParticipants } = require("../node_scripts/stats")

const getExam = require('../node_scripts/database_calls/exam')
const getCopy = require('../node_scripts/database_calls/copy');

router.get("/", access.hasAccess, async (req, res) => {
    const matricule = req.session.userObject.matricule
    Exam.findAll({order:[["createdAt", "DESC"]]}).then(exams=>{
        returnedExams = []
        exams.forEach(exam => {
            if(exam.userMatricule == matricule || req.session.userObject.authorizations == 0 || JSON.parse(exam.collaborators).includes(matricule)) returnedExams.push(exam)
        });
        Copy.findAll({where:{userMatricule:matricule},include:[{model:Exam, as:'exam', attributes:["name","copyViewAvailable"]}]}).then(copies=>{
            return res.render("see/showExams", {exams:returnedExams, copies:copies})
        })

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/ ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1017')
        res.redirect('/error')
    })
})

router.get("/copies/:examid", access.hasAccess, getExam.getExam(true), (req, res) => {
    return res.render("see/showCopies", {copies:res.locals.exam.copies,exam:res.locals.exam})
    
    // else{
    //     stats = {"mean": computeMean(res.locals.exam.copies), "var":computeVariance(res.locals.exam.copies, computeMean(res.locals.exam.copies)), "participants":computeParticipants(res.locals.exam.copies), "blancs":computeZero(res.locals.exam.copies), "worstQuestionQtt":13, "worstQuestionNum":5, "bestQuestionQtt":16, "bestQuestionNum":2}
    //     return res.render("see/showCopies", {copies:res.locals.exam.copies,exam:res.locals.exam, stats:stats})
    // }
})

router.get("/exam/:examid", access.hasAccess, getExam.getExam(true), async (req, res) => {
    var copies = res.locals.exam.copies
    var nbCopies = copies.length
    var nbNotSubmitted = copies.filter(copy => copy.status == "not_submitted").length
    var nbErrors = copies.filter(copy => copy.status == "errorVersion").length + copies.filter(copy => copy.status == "error").length
    
    var nbNoStudent = copies.filter(copy => copy.user.fullName == "" && copy.status != "not_submitted" ).length
    enableExcelDownload = (nbErrors > 0 || nbCopies == nbNotSubmitted || nbNoStudent > 0) ? false : true
    
    return res.render("see/showExam", {exam:res.locals.exam,enableExcelDownload:enableExcelDownload})
})

router.get("/exam/:examid/downloadresult", access.hasAccess, getExam.getExam(), async (req, res) => {
    return res.download(
        path.resolve(res.locals.exam.examFile),
        (err) => {
            if (err){
                console.log(" --- DOWNLOAD ERROR -- SEE/exam/downloadresult ---\n " + err)
            } 
        }
    );
});

router.get("/collaborators/:examid",access.hasAccess, getExam.getExam(), (req,res)=>{
    var collaborators = JSON.parse(res.locals.exam.collaborators)
    collaborators.push(res.locals.exam.userMatricule)
    User.findAll({where:{matricule:collaborators},order:[['matricule', 'ASC']]}).then(users=>{
        return res.render('see/showCollaborators',{exam:res.locals.exam,users:users})
    }).catch(err =>{
        console.log(" --- DATABASE ERROR -- SEE/exam/collaborators ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1029')
        return res.redirect('/error')
    })
})

router.post("/collaborators/:examid",access.hasAccess,getExam.getExam(), (req,res)=>{
    var collaborators = JSON.parse(res.locals.exam.collaborators)
    newCollab = JSON.parse(req.body.newCollaborator)[0]
    collaborators.push(newCollab)
    res.locals.exam.collaborators = JSON.stringify(collaborators)
    getExam.saveExam(res.locals.exam,req,res,"",'/see/collaborators/'+ req.params.examid)
})

// Returns an image of the copy
router.get("/copy/:copyid/download", access.hasAccess, getCopy.getCopy(), (req, res) => {
    return res.download(
        path.resolve(`copies/${res.locals.copy.file}`),
        (err) => {
            if (err) {
                console.log(" --- DOWNLOAD ERROR -- SEE/copy/download ---\n " + err)
            }
        }
    );
});

router.get("/copy/:copyid", access.hasAccess, getCopy.getCopy(true), (req, res) => {
    var user = req.session.userObject
    var disableChanges = !(res.locals.copy.exam.userMatricule == user.matricule || user.authorizations == 0 || JSON.parse(res.locals.copy.exam.collaborators).includes(user.matricule))
    Copy.findAll({where:{examId:res.locals.copy.exam.id},order:[['userMatricule', 'ASC']]}).then(copies=>{
        const nbCopies = copies.length
        copies.forEach((item, index)=>{
            if(item.id == req.params.copyid){
                if(nbCopies - 1 == index) return res.render("see/showCopy", {prevCopyId:copies[index-1].id,copy:res.locals.copy,disableChanges:disableChanges}) // Il n'y a pas de copie suivante
                else if(index == 0) return res.render("see/showCopy", {nextCopyId:copies[index+1].id,copy:res.locals.copy,disableChanges:disableChanges})
                else return res.render("see/showCopy", {nextCopyId:copies[index+1].id,prevCopyId:copies[index-1].id,copy:res.locals.copy,disableChanges:disableChanges})  
            }
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copy ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1023')
        // return res.redirect('/error')
    })
})

router.get("/deleteExam/:examid/WARNING_NO_TURNING_BACK", access.hasAccess, (req,res)=>{
    Copy.destroy({where:{examId:req.params.examid}}).then(()=>{
        Exam.destroy({where:{id:req.params.examid}}).then(()=>{
            res.redirect('/see')
        })
    }).catch(err=>{
        console.log(err)
        return res.redirect('/error')
    })
})

module.exports = router;
