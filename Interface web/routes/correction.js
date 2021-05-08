const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const { Exam, Copy, User } = require("../node_scripts/database/models");
const corrector = require('../node_scripts/correction')
const sendEmail = require('../node_scripts/sendEmail');
const path = require("path")
const functions = require("../node_scripts/functions")
const matriculeConverter = require("../node_scripts/convertMatricule")
const getUser = require("../node_scripts/getUser")

router.get("/modifyCriteria/:examid", access.hasAccess, (req,res)=>{
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if(exam){
            var correctionCriterias = JSON.parse(exam.correctionCriterias)
            correctionCriterias['redirection'] = 'modify'
            req.session['examId'] = req.params.examid        
            return res.render('correction/modifyCriteria.pug', correctionCriterias)
        }
        console.log(" --- EXAM DOES NOT EXIST ERROR -- correction/modifyCriteria/examid ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1033')
        return res.redirect("/error")

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyCriteria/examid ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1034')
        return res.redirect('/error')
    })
})

router.get("/questionStatus/:examid", access.hasAccess, (req,res)=>{
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}

    Exam.findOne(query).then(exam=>{
        if(exam) return res.render('correction/questionStatus', {questionStatus:JSON.parse(exam.questionStatus), exam:exam})

        console.log(" --- EXAM DOES NOT EXIST ERROR -- correction/questionStatus/:examid ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1035')
        return res.redirect("/error")

    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/questionStatus/:examid ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1036')
        return res.redirect('/error')
    })
})

router.get('/sendEmail/:copyid', access.hasAccess, (req,res)=>{
    const userMatricule = req.session.userObject.matricule
    var query;

    Copy.findOne({where:{userMatricule:userMatricule, id:req.params.copyid}, include:[{model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{
        if (copy){
            return res.render('correction/complainEmail',{
                destinationName: copy.exam.user.fullName,
                name:req.session.userObject.fullName,
                examName:copy.exam.name,
                email: copy.exam.user.email,
                object: `[ERREUR DE CORRECTION] ${copy.exam.name}`,
                url:`https://${process.env.ENDPOINT}/see/copy/${copy.id}`,
                copyId:copy.id
            })
        }
        console.log(" --- COPY DOES NOT EXIST ERROR -- correction/sendEmail/:copyid ---\n ")
        req.flash('errormsg', 'This copy does not exist, error : 1037')
        return res.redirect("/error")
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/sendEmail/:copyid ---\n ", err)
        req.flash('errormsg', 'Database error, error : 1038')
        return res.redirect("/error")
    })
})

router.get("/downloadExcel/:examid", access.hasAccess, async (req,res)=>{
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}]}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}]}

    Exam.findOne(query).then(exam=>{
        if (exam && exam.copies){
            data = {}
            exam.copies.forEach((copy) => {
                data[copy.user.matricule] = copy
            })

            return functions.exportStudents({"name":exam.name, "excelFile":exam.excelFile, "id":exam.id}, data)
            .then(()=>{
                return res.download(
                    path.resolve(exam.excelFile),
                    (err) => {
                        if (err) {
                            console.log(" --- DOWNLOAD ERROR -- correction/downloadExcel/:examid ---\n " + err)
                            req.flash('errormsg', 'Error while downloading the file, error : 1041')
                            return res.redirect('/error')
                        }
                    }
                );
            })
            .catch(err=>{
                console.log(" --- FILE EXPORT ERROR -- correction/downloadExcel/:examid ---\n ", err)
                req.flash('errormsg', 'File exportation error, error : 1042')
                return res.redirect("/error")
            })
        }

        console.log(" --- EXAM DOES NOT EXIST ERROR -- correction/downloadExcel/:examid ---\n ")
        req.flash('errormsg', 'This exam does not exist, error : 1040')
        return res.redirect("/error")
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/downloadExcel/:examid ---\n ", err)
        req.flash('errormsg', 'Database error, error : 1039')
        return res.redirect("/error")
    })
})

router.post('/modifyQuestionStatus/:examid',async(req,res)=>{ 
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.params.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.params.examid}}
    
    Exam.findOne(query).then(exam=>{
        if(!exam){
            console.log(" --- EXAM DOES NOT EXIST ERROR -- POST correction/modifyQuestionStatus/examid ---\n ")
            req.flash('errormsg', 'This exam does not exist, error : 1043')
            return res.redirect("/error")
        }
        var questionStatus = JSON.parse(req.body.questionStatusObject)
        var newStatus = req.body.type
        var index = 0
        Object.entries(questionStatus).forEach(([key,value]) =>{
            slice = newStatus.slice(index, index + value.length);
            index += value.length
            questionStatus[key] = slice
        })
        exam.questionStatus = JSON.stringify(questionStatus)
        exam.save().then(exam=>{
            corrector.reCorrect(req.params.examid).then(suc=>{
                req.flash('recorrectmsg', 'Le statut de la question a été enregistré et les copies recorrigées')
                return res.redirect(`/see/exam/${req.params.examid}`)
            })
            .catch(err=>{
                console.log(" ---  ERROR WHILE RECORECT EXAM -- POST correction/modifyQuestionStatus/examId ---\n " +err)
                req.flash('errormsg', 'Error while re-correct exam, error : 1044')
                return res.redirect("/error")
            })
        }).catch(err=>{
            console.log(" ---  ERROR WHILE SAVING EXAM -- POST correction/modifyQuestionStatus/examId ---\n " + err)
            req.flash('errormsg', 'Error while saving exam, error : 1045')
            return res.redirect("/error")
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/questionStatus/:examId ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1046')
        return res.redirect('/error')
    })
})

router.post('/modifyImageTreatment/:copyid', access.hasAccess, (req,res)=>{
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    Copy.findOne({where:{id:req.params.copyid}, include:[{model:Exam, as:"exam"}]}).then(copy=>{
        copy.answers = req.body.response
        const correction = JSON.parse(copy.exam.corrections)[copy.version] //GET corrections
        const correctionCriterias = JSON.parse(copy.exam.correctionCriterias) //Get correction criterias
        const questionStatus = JSON.parse(copy.exam.questionStatus)[copy.version] //Get question status
    
        corrector.correctionCopy( 
            correction,JSON.parse(req.body.response),questionStatus,correctionCriterias           
        )
        .then((newResult) =>{
            copy.result = newResult      
            copy.save().then(copy=>{
                req.flash('successCotationChange',"La note de l'étudiant a été modifiée correctement ! ");
                res.redirect('/see/copies/'+copy.exam.id)
            }).catch(err=>{
                console.log(" --- DATABASE ERROR -- correction/modifyImageTreatment/:copyid ---\n " + err)
                req.flash('errormsg', 'Error while saving the copy, error : 1047')
                return res.redirect('/error')
            })
        })
        .catch(err=>{
            console.log(' ---Not normal to have an error here because lists have to match ---\n '+ err)
            req.flash('errorAnswerChange','Les listes ne correspondent pas, error : 1006');
            res.redirect('/see/copy/'+copy.id)
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyImageTreatment/:copyid ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1048')
        return res.redirect('/error')
    })
})

router.post('/sendComplainEmail', access.hasAccess,(req,res)=>{
    sendEmail.sendEmail(req.body.email, req.session.userObject.email, req.body.object, req.body.message)
    .then(response=>{
        req.flash('successEmail','Email envoyé');
        res.redirect('/see/copy/' + req.body.copyId)
    })
    .catch(err=>{
        console.log(err)
        req.flash('failEmail',"Erreur dans l'envoi de l'email");
        res.redirect('/correction/sendEmail/'+ req.body.copyId)
    })
})


router.post("/updateUser/", access.hasAccess, async (req, res) => {
    if (req.session.userObject.role == 1 || req.session.userObject.authorizations == 0){

        const userEmail = matriculeConverter.matriculeToEmail(req.body.newMatricule)
        getUser.getUser(userEmail,req)
            .then(user=>{
                Copy.findOne({where:{id:req.body.copyId}})
                .then(copy=>{
                    copy.userMatricule = user.matricule
                    copy.save()
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

router.post('/changeCopyStatus',access.hasAccess,(req,res)=>{    
    if (req.session.userObject.authorizations == 3 && req.session.userObject.role == 0) return res.redirect("/noAccess")

    const userMatricule = req.session.userObject.matricule
    var query;

    if (req.session.userObject.authorizations == 0) query = {where:{id:req.body.examid}}
    else query = {where:{userMatricule:userMatricule, id:req.body.examid}}

    Exam.findOne(query).then(exam=>{
        if(!exam){
            console.log(" --- EXAM DOES NOT EXIST ERROR -- POST correction/changeCopyStatus ---\n ")
            req.flash('errormsg', 'This exam does not exist, error : 1003a')
            return res.redirect("/error")
        }
        if ("copyViewAvailable" in req.body){
            exam.copyViewAvailable = req.body.copyViewAvailable

            return exam.save().then(exam=>{
                if(exam){
                    req.flash('succCopyStatusChange', "La visibilité des copies a été changé avec succès.");
                    return res.redirect('/see/exam/'+req.body.examid)
                }
                console.log(" --- EXAM DOES NOT EXIST ERROR -- CORRECTION/changeCopyStatus ---\n ")
                req.flash('errormsg', 'This exam does not exist, error : 1003b')
                return res.redirect("/error")
            }).catch(err=>{
                console.log(" --- DATABASE ERROR -- CORRECTION/changeCopyStatus ---\n " + err)
                req.flash('errCopyStatusChange', "Error while saving the copy visibility, error : 1003c");
                res.redirect('/see/exam/'+req.body.examid)()
            })
        }

        console.log(" --- BODY ERROR ERROR -- POST correction/changeCopyStatus ---\n ")
        req.flash('errormsg', 'The body does not contian the copyViewAvailable key, error : 1003d')
        return res.redirect("/error") 
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- CORRECTION/changeCopyStatus ---\n " + err)
        req.flash('errormsg', "Error while changing copy visibility, error : 1003e");
        return res.redirect('/see/exam/'+req.body.examid)
    })
});

module.exports = router