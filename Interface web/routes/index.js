const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')

router.get("/", access.hasAccess, function(req,res){
        res.render('index/index')    
});

router.get("/favicon.ico",(req,res)=>{
        res.redirect('/');
});

router.get("/viewProfile", access.hasAccess,(req,res)=>{
        res.render('index/viewProfile')    
});

router.get("/noAccess", access.hasAccess,(req,res)=>{
        res.status(403)    
        res.render('index/noAccess')    
});

router.get("/unloggederror",(req,res)=>{
        res.status(403)    
        res.render('index/error')    
});

module.exports = router