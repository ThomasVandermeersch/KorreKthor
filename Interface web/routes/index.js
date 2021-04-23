
const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')

const graph = require('../node_scripts/graph')
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

router.get("/testAPI/:matricule",acces.hasAcces,async function(req,res){
        graph.getName(req.params.matricule,req.app.locals.msalClient,req.session.userId)
                .then(user=>{
                        res.end(user)
                })
                .catch(err=>{
                        //console.log(err)
                        res.end("Le client n'existe pas")
                })
});

module.exports = router