
/* 
Role :
    0 : Student
    1 : Teacher
    2 : Fake user

Authorizations :
    0 : Admin 
    1 : Create
    2 : No privilliges
*/

/*
In the session of each user there is a object 'accesses'
    {
        examIds : [ List of accessible examId's],
        copyIds : [ List of accessible copies]
    }
*/

const e = require("express");
const { Exam, Copy, User } = require("../node_scripts/database/models");


function hasAccess(req,res,next){
    // Si l'utilisateur n'est pas connecté
    if(!req.session.userObject) return res.redirect("/auth/login")
    const user = req.session.userObject
    
    // L'utilisateur fait une requête vers 'Create'
    if (req.originalUrl.includes("/create")){
        if(user.role == 1 || user.authorizations == 0 || user.authorizations == 1) return next()
        else return res.redirect("/noAcces")
    }

    // L'utilisateur fait une requête vers 'Admin'
    if (req.originalUrl.includes("/admin")){
        if( user.authorizations == 0) return next()
        else return res.redirect("/noAccess")
    }

    if('examid' in req.params){
        if(req.session.accesses.examIds.includes(req.params.examid)) return next()

        Exam.findOne({where:{id:req.params.examid}}).then(exam=>{
            if(exam){
                if(user.authorizations==0 || exam.userMatricule == user.matricule || JSON.parse(exam.collaborators).includes(user.matricule)){
                    req.session.accesses.examIds.push(req.params.examid)
                    return next()
                }
                else return res.redirect("/noAccess") 
            }
            else{
                console.log(" --- EXAM DOES NOT EXIST ERROR ---\n ")
                req.flash('errormsg', 'This exam does not exist !!!')
                return res.redirect("/error")
            }
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- hasAccess ---\n " + err)
            req.flash('errormsg', 'Database error, error : 2000')
            return res.redirect('/error')
        })
    }
    else if('copyid' in req.params){
        if(req.session.accesses.copyIds.includes(req.params.copyid) && req.method == 'GET') return next()

        Copy.findOne({where:{id:req.params.copyid}, include:[{model:Exam, as:"exam", include:[{model:User, as:"user"}]}]}).then(copy=>{
            if(copy){
                const examOwner = copy.exam.user.matricule
                const copyOwner = copy.userMatricule
                if(copy.exam.copyViewAvailable == 2){                
                    if ((examOwner == user.matricule || copyOwner == user.matricule || req.session.userObject.authorizations == 0 || JSON.parse(copy.exam.collaborators).includes(user.matricule)) && req.method == "GET"){
                        req.session.accesses.copyIds.push(req.params.copyid)
                        return next()
                    }
                    else if(examOwner == user.matricule || req.session.userObject.authorizations == 0 || JSON.parse(copy.exam.collaborators).includes(user.matricule)){
                        req.session.accesses.copyIds.push(req.params.copyid)
                        return next() 
                    }
                }
                return res.redirect("/noAccess")
            }
            else{
                console.log(" --- COPY DOES NOT EXIST ERROR ---\n ")
                req.flash('errormsg', 'This exam does not exist !!!')
                return res.redirect("/error")
            }
        }).catch(err=>{
            console.log(" --- DATABASE ERROR -- hasAccess ---\n " + err)
            req.flash('errormsg', 'Database error, error : 2001')
            return res.redirect('/error')
        })
    }
    else{
        next();
    }
}

exports.hasAccess = hasAccess
