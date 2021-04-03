
const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')

router.get("/", acces.hasAcces, function(req,res){
        //res.render('index',{name:"Beta"})    
        res.render('index/index',{name:req.session.userObject.fullName})    
});

router.get("/viewProfile", acces.hasAcces, function(req,res){
        //res.render('index',{name:"Beta"})    
        res.render('index/viewProfile')    
});

router.get("/noAcces", acces.hasAcces, function(req,res){
        //res.render('index',{name:"Beta"})
        res.status(403)    
        res.render('index/noAcces')    
});

module.exports = router