const router = require('express-promise-router')();
const { User } = require("../node_scripts/database/models");
const access = require('../node_scripts/hasAccess')

router.get('/', access.hasAccess, (req,res)=>{
    User.findAll({where:{role:[0,1]},order:[['matricule', 'ASC']]})
        .then(users => res.render('admin/adminUsers',{users:users}))
        .catch(err =>{
            console.log(" --- DATABASE ERROR -- ADMIN/ ---\n " + err)
            req.flash('errormsg','Database error, error : 1007')
            res.render('index/error')
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
            console.log(" --- DATABASE ERROR -- ADMIN/:matricule ---\n " + err)
            req.flash('errormsg','Database error, error : 1008')
            res.render('index/error')        
        })
})

router.post('/:matricule', access.hasAccess, (req,res)=>{
    if(req.body.makeAdmin) auth=0
    else if(req.body.createQCM) auth=1
    else auth= 3

    User.findOne({where:{matricule:req.params.matricule}}).then(user=>{
        // An admin User, cannot be modified.
        if (user.id != req.session.userObject.id && user.authorizations == 0) res.render('index/noAcces')
        else{
            user.authorizations = auth
            user.save()
            .then(()=>{
                res.redirect("/admin")
            }
            ).catch(err=>{
                console.log(" --- DATABASE ERROR -- ADMIN/:matricule ---\n " + err)
                req.flash('errormsg','Database error, error : 1009')
                res.render('index/error')  
            })
        }
    }).catch(err=>{
        console.log(" --- DATABASE ERROR -- ADMIN/:matricule ---\n " + err)
        req.flash('errormsg','Database error, error : 1010')
        res.render('index/error')  
    })
})

module.exports = router;