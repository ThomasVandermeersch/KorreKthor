const { Exam, Copy, User } = require("../database/models");
const corrector = require('../correction')

const createLogger = require('logging')
const logger = createLogger.default('Database_calls -- Copy');

// Return the Copy and the associated exam
const getCopy = (includeUsers=false) => {
    return (req, res, next) => {
        query = includeUsers ? {where:{id:req.params.copyid}, include:[{model:User, as:"user"}, {model:Exam, as:"exam", include:[{model:User, as:"user"}]}]} : {where:{id:req.params.copyid}, include:[{model:Exam, as:"exam"}]} ;
        console.log(query)
        

        Copy.findOne(query).then(copy=>{
            if(!copy){
                req.flash('errormsg', 'This copy does not exist')
                res.status("404")
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


function saveExam(exam,req,res,msg='Les modifications ont été enregistrées et les copies recorrigées', redirection){
    // Update a specific exam. When an exam is updated, all copies must be re-corrected.
    exam.save().then(()=>{        
        corrector.reCorrect(req.params.examid).then(()=>{
            req.flash('recorrectmsg', msg )
            console.log("Redirection : " + redirection)
            if(redirection) return res.redirect(redirection)
            return res.redirect(`/see/exam/${req.params.examid}`)
        }).catch(err =>{
            logger.error(err)
            req.flash('errormsg', 'Error while re-correct exam')
            return res.redirect("/error")
        })
    }).catch(err=>{
        logger.error(err)
        req.flash('errormsg', 'Database error')
        return res.redirect("/error")
    })
}

exports.getCopy = getCopy
exports.saveExam = saveExam
