const router = require('express-promise-router')();
const { User } = require("../node_scripts/database/models");
const access = require('../node_scripts/hasAccess')
const createLogger = require('logging')
const logger = createLogger.default('Admin -- Routes');

router.get('/', access.hasAccess, (req,res)=>{
    User.findAll({where:{role:[0,1]},order:[['matricule', 'ASC']]})
        .then(users => res.render('admin/adminUsers',{users:users}))
        .catch(err =>{
            logger.error(err)
            req.flash('errormsg','Database error, error : 1007')
            res.redirect('/error')
        })
})

router.get('/:matricule', access.hasAccess, (req,res)=>{
    User.findOne({where:{matricule:req.params.matricule}})
        .then(user =>{
            // An admin User, cannot be modified.
            if (user.id != req.session.userObject.id && user.authorizations == 0) res.render('index/noAcces')
            else res.render('admin/adminModifyUser', {user:user})
        })
        .catch(err => {
            logger.error(err)
            req.flash('errormsg','Database error, error : 1008')
            res.redirect('/error')
        })
})

router.post('/:matricule', access.hasAccess, (req,res)=>{
    if(req.body.makeAdmin) auth = 0
    else if(req.body.createQCM) auth = 1
    else auth = 3

    User.findOne({where:{matricule:req.params.matricule}}).then(user=>{
        // An admin User, cannot be modified.
        if (user.id != req.session.userObject.id && user.authorizations == 0) return res.render('index/noAcces')
        
        user.authorizations = auth // modify User Authorizations
        user.save()
        .then(()=>{
            res.redirect("/admin")
            logger.info(`${req.session.userObject.fullName} changed ${user.fullName} authorizations to ${auth}`)
        }
        ).catch(err=>{
            logger.error(err)
            req.flash('errormsg','Database error, error : 1009')
            res.redirect('/error')  
        })
    }).catch(err=>{
        logger.error(err)
        req.flash('errormsg','Database error, error : 1010')
        res.render('/error')  
    })
})

module.exports = router;