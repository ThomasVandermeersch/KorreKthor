const { User } = require("../node_scripts/database/models");
const convertMatricule = require('./../node_scripts/convertMatricule')
const router = require('express-promise-router')();
const getUser = require('../node_scripts/getUser')

router.get("/login",function(req,res){
    if(!req.session.userId) res.render("auth/login")
    else res.redirect('/')
})

router.get('/signin',
  async function (req, res) {
    const urlParameters = {
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };

    try {
      const authUrl = await req.app.locals
        .msalClient.getAuthCodeUrl(urlParameters);
      res.redirect(authUrl);
    }

    catch (error) {
      req.flash('error_msg', {
        message: 'Error getting auth URL ',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      res.redirect('/');
    }
  }
);

router.get('/callback',
  async function(req, res) {
    const tokenRequest = {
      code: req.query.code,
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };

    try {
      const response = await req.app.locals
        .msalClient.acquireTokenByCode(tokenRequest);

      // Save the user's homeAccountId in their session
      req.session.userId = response.account.homeAccountId;

      getUser.getUser(response.account.username,req).then(user=>{ 
        req.session["userObject"] = user
        
        //REDIRECTION
        if(req.session["requestedURL"]) res.redirect(req.session["requestedURL"])
        else res.redirect('/');

      }).catch(err=>{
        console.log(" --- INTERNAL ERROR -- auth/callback ---\n " + err)
        req.flash('errormsg', 'Internal error while logging in, error : 1018')
        return res.redirect('/unloggederror')
      })
    } catch(error) {
      console.log(error)
      req.flash('error_msg', {
        message: 'Error completing authentication HERE',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
    }
  }
);

// </CallbackSnippet>
router.get('/logout',
  async function(req, res) {
    // Sign out
    if (req.session.userId) {
      // Look up the user's account in the cache
      const accounts = await req.app.locals.msalClient
        .getTokenCache()
        .getAllAccounts();

      const userAccount = accounts.find(a => a.homeAccountId === req.session.userId);

      // Remove the account
      if (userAccount) {
        req.app.locals.msalClient
          .getTokenCache()
          .removeAccount(userAccount);
      }
    }

    // Destroy the user's session
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  }
);

module.exports = router