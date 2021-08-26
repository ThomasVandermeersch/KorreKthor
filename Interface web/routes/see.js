const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const path = require("path")
const { Exam, Copy, User } = require("../node_scripts/database/models");
const { computeMean, computeVariance, computeZero, computeParticipants } = require("../node_scripts/stats")


router.get("/", access.hasAccess, async (req, res) => {
    const matricule = req.session.userObject.matricule
    Exam.findAll({order:[["createdAt", "DESC"]]}).then(exams=>{
        returnedExams = []
        exams.forEach(exam => {
            if(exam.userMatricule == matricule || req.session.userObject.authorizations == 0 || JSON.parse(exam.collaborators).includes(matricule)) returnedExams.push(exam)
        });
        // query.include = [{model:Exam, as:'exam', attributes:["name"]}]
        Copy.findAll({where:{userMatricule:matricule},include:[{model:Exam, as:'exam', attributes:["name"]}]}).then(copies=>{
            return res.render("see/showExams", {exams:returnedExams, copies:copies})
        })

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/ ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1017')
        res.redirect('/error')
    })
})

router.get("/copies/:examid", access.hasAccess, async (req, res) => {
    Exam.findOne({where:{id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}]}).then(exam=>{
        var mean = computeMean(exam.copies)
        stats = {"mean": mean, "var":computeVariance(exam.copies, mean), "participants":computeParticipants(exam.copies), "blancs":computeZero(exam.copies), "worstQuestionQtt":13, "worstQuestionNum":5, "bestQuestionQtt":16, "bestQuestionNum":2}
        Copy.findAll({where:{examId:req.params.examid},include:[{model:User, as:"user"}],order:[['userMatricule', 'ASC']]}).then(copies=>{
            return res.render("see/showCopies", {copies:copies,exam:exam, stats:stats})
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- SEE/copies ---\n " + err)
            req.flash('errormsg', 'Database error, error : 1020')
            return res.redirect('/error')
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copies ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1020')
        return res.redirect('/error')
    })
})

router.get("/exam/:examid", access.hasAccess, async (req, res) => {
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        if(exam) return res.render("see/showExam", {exam:exam})
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copies ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1021')
        return res.redirect('/error')
    })
})

router.get("/exam/:examid/downloadresult", access.hasAccess, async (req, res) => {
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        if (exam.examFile){
            return res.download(
                path.resolve(exam.examFile),
                (err) => {
                    if (err){
                        console.log(" --- DOWNLOAD ERROR -- SEE/exam/downloadresult ---\n " + err)
                    } 
                }
            );
        }
        else{
            console.log(" --- EXAM DOES NOT EXIST ERROR -- SEE/exam/downloadresult ---\n " + err)
            req.flash('errormsg', 'The exam file does not exist, error : 1025')
            return res.redirect('/error')
        }
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/exam/downloadresult ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1026')
        return res.redirect('/error')
    })
});

router.get("/exam/:examid/downloadcorrection", access.hasAccess, async (req, res) => {
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        if (exam.correctionFile){
            return res.download(
                path.resolve(exam.correctionFile),
                (err) => {
                    if (err){
                        console.log(" --- DOWNLOAD ERROR -- SEE/exam/downloadcorrection ---\n " + err)
                        //req.flash('errormsg', 'Error while downloading the file, error : 1027')
                        //return res.redirect('/error')
                    } 
                }
            );
        }
        else{
            console.log(" --- EXAM DOES NOT EXIST ERROR -- SEE/exam/downloadcorrection ---\n " + err)
            req.flash('errormsg', 'This correction file does not exist, error : 1028')
            return res.redirect('/error')
        }
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/exam/downloadcorrection ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1029')
        return res.redirect('/error')
    })
});

router.get("/collaborators/:examid",access.hasAccess,async (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        var collaborators = JSON.parse(exam.collaborators)
        collaborators.push(exam.userMatricule)
        User.findAll({where:{matricule:collaborators},order:[['matricule', 'ASC']]}).then(users=>{
            return res.render('see/showCollaborators',{exam:exam,users:users})
        }).catch(err =>{
            console.log(" --- DATABASE ERROR -- SEE/exam/collaborators ---\n " + err)
            req.flash('errormsg', 'Database error, error : 1029')
            return res.redirect('/error')
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/exam/collaborators ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1029')
        return res.redirect('/error')
    })

})

router.post("/collaborators/:examid",access.hasAccess,async (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        var collaborators = JSON.parse(exam.collaborators)
        newCollab = JSON.parse(req.body.newCollaborator)[0]
        collaborators.push(newCollab)
        exam.collaborators = JSON.stringify(collaborators)
        exam.save().then(exam=>{
            return res.redirect('/see/collaborators/'+ req.params.examid)
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- SEE/exam/collaborators ---\n " + err)
            req.flash('errormsg', 'Database error, error : 1029')
            return res.redirect('/error')
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/exam/collaborators ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1029')
        return res.redirect('/error')
    })
})
// Returns an image of the copy
router.get("/copy/:copyid/download", access.hasAccess, async (req, res) => {
    const userMatricule = req.session.userObject.matricule

    Copy.findOne({where:{id:req.params.copyid}, include:[{model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{
        return res.download(
            path.resolve(`copies/${copy.file}`),
            (err) => {
                if (err) {
                    console.log(" --- DOWNLOAD ERROR -- SEE/copy/download ---\n " + err)
                    //req.flash('errormsg', 'Error while downloading the file, error : 1030')
                    //return res.redirect('/error')
                }
            }
        );
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copy ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1032')
        return res.redirect('/error')
    })
});

router.get("/copy/:copyid", access.hasAccess, async (req, res) => {
    Copy.findOne({where:{id:req.params.copyid}, include:[{model:User, as:"user"}, {model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{        
        var user = req.session.userObject
        var disableChanges = !(copy.exam.userMatricule == user.matricule || user.authorizations == 0 || JSON.parse(copy.exam.collaborators).includes(user.matricule))
        Copy.findAll({where:{examId:copy.exam.id},order:[['userMatricule', 'ASC']]}).then(copies=>{
            nbCopies = copies.length
            copies.forEach((item, index)=>{
                if(item.id == req.params.copyid){
                    if(nbCopies - 1 == index) return res.render("see/showCopy", {prevCopyId:copies[index-1].id,copy:copy,disableChanges:disableChanges}) // Il n'y a pas de copie suivante
                    else if(index == 0) return res.render("see/showCopy", {nextCopyId:copies[index+1].id,copy:copy,disableChanges:disableChanges})
                    else return res.render("see/showCopy", {nextCopyId:copies[index+1].id,prevCopyId:copies[index-1].id,copy:copy,disableChanges:disableChanges})
                }
            })
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- SEE/copy ---\n " + err)
            req.flash('errormsg', 'Database error, error : 1023')
            return res.redirect('/error')
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- SEE/copy ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1023')
        return res.redirect('/error')
    })
})

module.exports = router;
