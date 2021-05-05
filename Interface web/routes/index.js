const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const getUser = require('../node_scripts/getUser');
const { GraphError } = require('@microsoft/microsoft-graph-client');
const { User } = require("../node_scripts/database/models/user")

router.get("/", access.hasAccess, function(req,res){
        res.render('index/index')    
});

router.get("/graph", access.hasAccess, function(req,res){
        getUser.getUser("aa@aa.aa", req).then(user=>{
                console.log(user)
        }).catch(err=>{
                if (err instanceof GraphError){
                        User.create({fullName:"Extra student", matricule:copy.qrcode.matricule, authorizations:3, role:0, email:""})
                }
                console.log(err)
        })

        res.render('index/index')    
});

router.get("/viewProfile", access.hasAccess, function(req,res){
        res.render('index/viewProfile')    
});

router.get("/noAccess", access.hasAccess, function(req,res){
        res.status(403)    
        res.render('index/noAccess')    
});

router.get("/unloggederror", function(req,res){
        res.status(403)    
        res.render('index/error')    
});

module.exports = router