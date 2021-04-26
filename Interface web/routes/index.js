const router = require('express-promise-router')();
const access = require('../node_scripts/hasAccess')
const graph = require('../node_scripts/graph')

router.get("/", access.hasAccess, function(req,res){
        res.render('index/index')    
});

router.get("/viewProfile", access.hasAccess, function(req,res){
        res.render('index/viewProfile')    
});

router.get("/noAccess", access.hasAccess, function(req,res){
        res.status(403)    
        res.render('index/noAccess')    
});

module.exports = router