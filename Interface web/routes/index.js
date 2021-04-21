
const router = require('express-promise-router')();
const acces = require('../node_scripts/hasAcces')
require('isomorphic-fetch');
var graph = require('@microsoft/microsoft-graph-client');
const converter = require('../node_scripts/convertMatricule')

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
        const userEmail = converter.matriculeToEmail(req.params.matricule)
        var accessToken = await getAccessToken(req.session.userId, req.app.locals.msalClient)
        const client = getAuthenticatedClient(accessToken);


        client
        .api('/users/'+ userEmail)
        .select('displayName,userPrincipalName')
        .get().then(user=>{
                res.end('<h1>' + user.displayName  +  '</h1>')
  
        }).catch(err=>{
                res.end("<h1> Le client n'existe pas </h1>")
        })

        //console.log(user)
        //res.end('<h1>' + user.displayName  +  '</h1>')

});



async function getAccessToken(userId, msalClient) {
        // Look up the user's account in the cache
        try {
          const accounts = await msalClient
            .getTokenCache()
            .getAllAccounts();
      
          const userAccount = accounts.find(a => a.homeAccountId === userId);
      
          // Get the token silently
          const response = await msalClient.acquireTokenSilent({
            scopes: process.env.OAUTH_SCOPES.split(','),
            redirectUri: process.env.OAUTH_REDIRECT_URI,
            account: userAccount
          });
      
          return response.accessToken;
        } catch (err) {
          console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        }
}






function getAuthenticatedClient(accessToken) {
        // Initialize Graph client
        const client = graph.Client.init({
          // Use the provided access token to authenticate
          // requests
          authProvider: (done) => {
            done(null, accessToken);
          }
        });
      
        return client;
}


module.exports = router