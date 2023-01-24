const { Exam, Copy, User } = require("../database/models");

const corrector = require('../correction_new')
const createLogger = require('logging')
const logger = createLogger.default('Database_calls -- Exam');


const getExam = (includeCopiesAndUsers=false) => {
    return (req, res, next) => {
        query = includeCopiesAndUsers ? {where:{id:req.params.examid}, include:[{model:Copy, as:"copies", include:[{model:User, as:"user"}]}],order:[[{ model: Copy, as: 'copies' },'display_level', 'DESC'],[{ model: Copy, as: 'copies' },'userMatricule', 'ASC']]} : {where:{id:req.params.examid}} ;
        Exam.findOne(query).then(exam=>{
            if(!exam){
                req.flash('errormsg', 'This exam does not exist')
                res.status(404)
                res.render("index/error");
            }

            res.locals.exam = exam
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
    exam.save().then((exam)=>{
        logger.info(`${req.session.userObject.fullName} made a modification to the exam : ${exam.name} (${exam.id})`)     
        
        corrector.reCorrectExam(req.params.examid).then(()=>{
            req.flash('recorrectmsg', msg )
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

exports.getExam = getExam
exports.saveExam = saveExam
