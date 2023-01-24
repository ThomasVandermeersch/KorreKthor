const { Exam, Copy, User } = require("../database/models");
const getUser = require('../getUser')
const convertMatricule = require('../convertMatricule')

const createLogger = require('logging')
const logger = createLogger.default('Database_calls -- Copy');


// Create a copy
function createCopy(matricule, version, examid, req){
    getUser.getUser(convertMatricule.matriculeToEmail(String(matricule)), req).then(user=>{
        Copy.create({
            "userMatricule": user.matricule, 
            "examId": examid, 
            "version": version, 
            "file": "",
            "answers": "",
            "status":"not_submitted",
            "display_level": "0_not_submitted"
        }).catch(err=>{
            console.log("Something went wrong")
        })
    }).catch(err=>{
        console.log(err)
    })
}





// Return the Copy and the associated exam
const getCopy = (includeUsers=false) => {
    return (req, res, next) => {
        query = includeUsers ? {where:{id:req.params.copyid}, include:[{model:User, as:"user"}, {model:Exam, as:"exam", include:[{model:User, as:"user"}]}]} : {where:{id:req.params.copyid}, include:[{model:Exam, as:"exam"}]} ;
        
        Copy.findOne(query).then(copy=>{
            if(!copy){
                req.flash('errormsg', 'This copy does not exist')
                res.status(404)
                res.render("index/error");
            }

            res.locals.copy = copy
            next()
        }).catch(err=>{
            logger.error(err)
            req.flash('errormsg', 'Database error')
            return res.redirect('/error')
        })
    };
};

exports.getCopy = getCopy
exports.createCopy = createCopy
