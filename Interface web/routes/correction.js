const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const { Exam, Copy, User } = require("../node_scripts/database/models");
const corrector = require('../node_scripts/correction')
const sendEmail = require('../node_scripts/sendEmail');
const path = require("path")
const functions = require("../node_scripts/functions")
const matriculeConverter = require("../node_scripts/convertMatricule")
const getUser = require("../node_scripts/getUser");

router.get("/modifyCriteria/:examid", access.hasAccess, (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        return res.render('correction/modifyCriteria.pug', {correctionCriterias:JSON.parse(exam.correctionCriterias),redirection:'modify',examId:req.params.examid})
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyCriteria/examid ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1034')
        return res.redirect('/error')
    })
})

router.get("/details/:examid", access.hasAccess, (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        return res.render('correction/details.pug',{exam:exam})
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyCriteria/examid ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1034')
        return res.redirect('/error')
    })
})

router.get("/questionWeighting/:examid", access.hasAccess, (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        return res.render('correction/questionWeighting', {questionWeights:JSON.parse(exam.corrections), exam:exam})
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/questionWeighting/:examid ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1036')
        return res.redirect('/error')
    })
})

router.get("/downloadExcel/:examid", access.hasAccess, async (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}]}).then(exam=>{
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
                            //req.flash('errormsg', 'Error while downloading the file, error : 1041')
                            //return res.redirect('/error')
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

router.get("/modifyAnswers/:examid", access.hasAccess, (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then((exam)=>{    
        return res.render('correction/modifyAnswers.pug',{correction:JSON.parse(exam.corrections),examid:req.params.examid})
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyAnswers/:examid ---\n ", err)
        req.flash('errormsg', 'Database error, error : 1039')
        return res.redirect("/error")
    })
})

router.post("/getUserName/:redirection", access.hasAccess, (req,res)=>{
    matricule = req.body.matricule.toLowerCase()
    getUser.getUser(matriculeConverter.matriculeToEmail(matricule),req,true,false).then(user=>{
        //res.setHeader('Content-Type', 'application/json');
        req.flash('newUserName', user.fullName)
        req.flash('newUserMatricule', user.matricule)

        if(req.params.redirection == 'colab') res.redirect('/see/collaborators/' + req.body.examId)
        else res.redirect('/see/copy/' + req.body.copyId)

        //res.end(JSON.stringify({ name: user.fullName,matricule: user.matricule }));
    })
    .catch(err=>{
        //res.setHeader('Content-Type', 'application/json');
        req.flash('userNoExist', "L'utilisateur n'existe pas ! ")
        res.redirect('/see/collaborators/' + req.body.examId)
    })
})

router.post('/modifyAnswers/:examid', access.hasAccess, (req,res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then((exam)=>{
        newCorrections = JSON.parse(req.body.liste)
        corrections = JSON.parse(exam.corrections)
        Object.entries(corrections).forEach(([key,value]) =>{
            index = 0
            value.forEach(questionObject=>{
                if(questionObject.type == 'qcm'){
                    questionObject.response = newCorrections[key][index].response
                    index++
                }
            })
        });
        exam.corrections = JSON.stringify(corrections)
        exam.save().then(exam=>{
            corrector.reCorrect(req.params.examid).then(suc=>{
                req.flash('recorrectmsg', 'Les réponses aux questions ont été enregistrées et les copies recorrigées')
                return res.redirect(`/see/exam/${req.params.examid}`)
            })
            .catch(err=>{
                console.log(" ---  ERROR WHILE RECORECT EXAM -- POST correction/modifyAnswers/examId ---\n " +err)
                req.flash('errormsg', 'Error while re-correct exam, error : 1044')
                return res.redirect("/error")
            })
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- correction/modifyAnswers/:examid ---\n ", err)
            req.flash('errormsg', 'Database error, error : 1039')
            return res.redirect("/error")
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyAnswers/:examid ---\n ", err)
        req.flash('errormsg', 'Database error, error : 1039')
        return res.redirect("/error")
    })
})

router.post('/modifyWeighting/:examid',async(req,res)=>{ 
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
        var index = 0
        var corrections = JSON.parse(exam.corrections)
        Object.entries(corrections).forEach(([key,value]) =>{
            value.forEach(question=>{
                if(question.type != 'version'){
                    question.weight = req.body.weight[index]
                    index += 1  
                }
            })
        })
        exam.corrections = JSON.stringify(corrections)
        exam.save().then(exam=>{
            corrector.reCorrect(req.params.examid).then(suc=>{
                req.flash('recorrectmsg', 'Les poids des questions ont été enregistrés et les copies recorrigées')
                return res.redirect(`/see/exam/${req.params.examid}`)
            })
            .catch(err=>{
                console.log(" ---  ERROR WHILE RECORECT EXAM -- POST correction/modifyWeighting/examId ---\n " +err)
                req.flash('errormsg', 'Error while re-correct exam, error : 1044')
                return res.redirect("/error")
            })
        }).catch(err=>{
            console.log(" ---  ERROR WHILE SAVING EXAM -- POST correction/modifyWeighting/examId ---\n " + err)
            req.flash('errormsg', 'Error while saving exam, error : 1045')
            return res.redirect("/error")
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/modifyWeighting/:examId ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1046')
        return res.redirect('/error')
    })
})

router.post('/modifyImageTreatment/:copyid', access.hasAccess, (req,res)=>{
    Copy.findOne({where:{id:req.params.copyid}, include:[{model:Exam, as:"exam"}]}).then(copy=>{
        copy.answers = req.body.response
        const correction = JSON.parse(copy.exam.corrections) //GET corrections
        const correctionCriterias = JSON.parse(copy.exam.correctionCriterias) //Get correction criterias
    
        corrector.correctionCopy( 
            correction,JSON.parse(req.body.response),correctionCriterias,copy.version           
        ).then((newData) =>{
            copy.result = newData.result
            copy.version = newData.version
            copy.answers = newData.newResponse
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

router.get('/sendEmail/:copyid', access.hasAccess, (req,res)=>{
    const userMatricule = req.session.userObject.matricule
    Copy.findOne({where:{userMatricule:userMatricule, id:req.params.copyid}, include:[{model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{
        return res.render('correction/complainEmail',{
            destinationName: copy.exam.user.fullName,
            name:req.session.userObject.fullName,
            examName:copy.exam.name,
            email: copy.exam.user.email,
            object: `[ERREUR DE CORRECTION] ${copy.exam.name}`,
            url:`https://${process.env.ENDPOINT}:9898/see/copy/${copy.id}`,
            copyId:copy.id
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- correction/sendEmail/:copyid ---\n ", err)
        req.flash('errormsg', 'Database error, error : 1038')
        return res.redirect("/error")
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

router.post("/updateUser/:copyid", access.hasAccess, async (req, res) => {
    console.log(req.body.newMatricule)
    const userEmail = matriculeConverter.matriculeToEmail(req.body.newMatricule)
    getUser.getUser(userEmail,req)
        .then(user=>{
            Copy.findOne({where:{id:req.params.copyid}})
            .then(copy=>{
                copy.userMatricule = user.matricule
                copy.save()
                req.flash('successNameChange',"L'étudiant " + user.fullName  + " a été assigné.")
                res.redirect(`/see/copies/${req.body.examId}`)
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
})

router.post('/changeCopyStatus/:examid',access.hasAccess,(req,res)=>{    
    Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
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

router.post("/sendCotationCriteria/:redirection/:examid", access.hasAccess, async (req, res)=>{
    Exam.findOne({where:{id:req.params.examid}}).then(async exam=>{
        exam.correctionCriterias = JSON.stringify(req.body)
        await exam.save()
        
        if(req.params.redirection == 'create') return res.redirect('/create/Step5')
        else corrector.reCorrect(req.params.examid).then(suc=>{
            req.flash('recorrectmsg', 'Les critères de cotation ont été enregistrés et les copies recorrigées')
            return res.redirect('/see/exam/' + req.params.examid)
        }).catch(err=>{
            console.log(err)
            req.flash("errormsg", "Error while recorrecting the exam")
            return res.redirect("/error")
        })
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- CREATE/sendCotationCriteria ---\n " + err)
        req.flash('errormsg', 'Database error, error : 1015')
        res.redirect('/error')
    })
})

module.exports = router
